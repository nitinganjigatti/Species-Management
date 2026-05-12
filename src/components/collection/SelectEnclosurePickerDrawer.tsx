import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Radio,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { AuthContext } from 'src/context/AuthContext'
import {
  getSectionsForPicker,
  getEnclosuresForPicker,
  SectionPickerItem,
  EnclosurePickerItem
} from 'src/lib/api/collection/enclosurePicker'

// ============== Types =================

export interface SelectedEnclosure {
  enclosure_id: number
  enclosure_name: string
  enclosure_image?: string | null
  section_id: number | string
  section_name?: string
  site_id?: number | string | null
  site_name?: string | null
  parent_chain: Array<{ id: number | string; name: string }>
}

interface SelectEnclosurePickerDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (enc: SelectedEnclosure) => void
}

// Each frame in the navigation stack — a section starts the journey, then enclosures stack on top.
type Frame =
  | {
      kind: 'section'
      sectionId: number | string
      sectionName: string
      siteId?: number | string | null
      siteName?: string | null
    }
  | {
      kind: 'enclosure'
      sectionId: number | string
      sectionName: string
      siteId?: number | string | null
      siteName?: string | null
      parentEnclosureId: number | string
      parentEnclosureName: string
    }

// Helper — does an enclosure have children?
// Backend returns `sub_enclosure_count` as a string (e.g. "6") for the parent_child listing,
// so coerce safely. Any positive count → render a chevron and allow drilling deeper.
const subCount = (e: EnclosurePickerItem): number => {
  const raw = e.sub_enclosure_count
  if (raw == null) return 0
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : 0
}

const hasSubs = (e: EnclosurePickerItem): boolean => subCount(e) > 0

const enclosureLabel = (e: EnclosurePickerItem) =>
  e.user_enclosure_name || e.enclosure_name || `Enclosure ${e.enclosure_id}`

// Pull site_id from any record (section or enclosure), tolerating common key variants
// and nested shapes the backend has been seen to return.
const pickSiteId = (record: Record<string, unknown> | null | undefined): number | string | null => {
  if (!record) return null
  const direct = (record.site_id ??
    (record as any).siteId ??
    (record as any).site?.id ??
    (record as any).site?.site_id) as number | string | null | undefined
  return direct ?? null
}

const pickSiteName = (record: Record<string, unknown> | null | undefined): string | null => {
  if (!record) return null
  const direct = (record.site_name ??
    (record as any).siteName ??
    (record as any).site?.name ??
    (record as any).site?.site_name) as string | null | undefined
  return direct ?? null
}

const SelectEnclosurePickerDrawer: React.FC<SelectEnclosurePickerDrawerProps> = ({ open, onClose, onSelect }) => {
  const theme = useTheme() as any
  const authData = useContext(AuthContext) as any
  const zooId: number | undefined = authData?.userData?.user?.zoos?.[0]?.zoo_id

  // Navigation stack — empty stack = "Section selection" view.
  const [stack, setStack] = useState<Frame[]>([])
  const [localSearch, setLocalSearch] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [selectedEnclosure, setSelectedEnclosure] = useState<EnclosurePickerItem | null>(null)

  const currentFrame: Frame | null = stack.length ? stack[stack.length - 1] : null
  const isSectionLevel = currentFrame === null

  // Reset everything when drawer reopens
  useEffect(() => {
    if (!open) return
    setStack([])
    setLocalSearch('')
    setSearchValue('')
    setSelectedEnclosure(null)
  }, [open])

  // Reset search state when changing levels
  useEffect(() => {
    setLocalSearch('')
    setSearchValue('')
    setSelectedEnclosure(null)
  }, [stack.length])

  const debouncedSearch = useMemo(() => debounce((val: string) => setSearchValue(val), 400), [])
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  // ============== Sections query (top level) =================
  const sectionsQuery = useQuery({
    queryKey: ['enclosure-picker-sections', zooId, searchValue],
    queryFn: () =>
      getSectionsForPicker({
        zoo_id: zooId!,
        q: searchValue,
        page: 1,
        offset: 50
      }),
    enabled: open && isSectionLevel && Boolean(zooId)
  })

  // ============== Enclosures query (any nested level) =================
  const enclosuresQuery = useQuery({
    queryKey: [
      'enclosure-picker-enclosures',
      currentFrame?.kind,
      currentFrame?.kind === 'section' ? currentFrame.sectionId : null,
      currentFrame?.kind === 'enclosure' ? currentFrame.parentEnclosureId : null,
      searchValue
    ],
    queryFn: () => {
      if (!currentFrame) return Promise.resolve(null)
      return getEnclosuresForPicker({
        section_id: currentFrame.sectionId,
        parent_enclosure_id: currentFrame.kind === 'enclosure' ? currentFrame.parentEnclosureId : null,
        q: searchValue,
        page_no: 1
      })
    },
    enabled: open && !isSectionLevel
  })

  // Normalise list — backends often nest these
  const sections: SectionPickerItem[] = useMemo(() => {
    const data = sectionsQuery.data
    return data?.sections?.[0] ?? data?.sections ?? data?.data ?? []
  }, [sectionsQuery.data])

  const enclosures: EnclosurePickerItem[] = useMemo(() => {
    const data = enclosuresQuery.data
    return data?.data ?? data?.enclosures ?? []
  }, [enclosuresQuery.data])

  // ============== Drill-down / drill-up =================
  const drillIntoSection = (s: SectionPickerItem) => {
    setStack([
      {
        kind: 'section',
        sectionId: s.section_id,
        sectionName: s.section_name,
        siteId: pickSiteId(s as any),
        siteName: pickSiteName(s as any)
      }
    ])
  }
  const drillIntoEnclosure = (e: EnclosurePickerItem) => {
    if (!currentFrame) return
    setStack(prev => [
      ...prev,
      {
        kind: 'enclosure',
        sectionId: currentFrame.sectionId,
        sectionName: currentFrame.sectionName,
        siteId: currentFrame.siteId ?? null,
        siteName: currentFrame.siteName ?? null,
        parentEnclosureId: e.enclosure_id,
        parentEnclosureName: enclosureLabel(e)
      }
    ])
  }
  const drillUp = () => {
    if (stack.length === 0) {
      onClose()
      return
    }
    setStack(prev => prev.slice(0, -1))
  }

  // ============== Selection =================
  const handleConfirm = () => {
    if (!selectedEnclosure || !currentFrame) return

    // Build the parent chain so callers can show breadcrumbs if they want.
    const parent_chain = stack
      .filter(f => f.kind === 'enclosure')
      .map(f => ({
        id: (f as Extract<Frame, { kind: 'enclosure' }>).parentEnclosureId,
        name: (f as Extract<Frame, { kind: 'enclosure' }>).parentEnclosureName
      }))

    // site_id can land on either the section or the enclosure record depending on the API shape.
    // Prefer the selected enclosure's site_id (most specific), fall back to the section frame.
    const resolvedSiteId = pickSiteId(selectedEnclosure as any) ?? currentFrame.siteId ?? null
    const resolvedSiteName = pickSiteName(selectedEnclosure as any) ?? currentFrame.siteName ?? null

    onSelect({
      enclosure_id: selectedEnclosure.enclosure_id,
      enclosure_name: enclosureLabel(selectedEnclosure),
      enclosure_image: selectedEnclosure.enclosure_image ?? null,
      section_id: currentFrame.sectionId,
      section_name: currentFrame.sectionName,
      site_id: resolvedSiteId,
      site_name: resolvedSiteName,
      parent_chain
    })
  }

  // ============== Title for the current view =================
  const title = isSectionLevel
    ? 'Sections'
    : currentFrame?.kind === 'enclosure'
    ? currentFrame.parentEnclosureName
    : currentFrame?.sectionName ?? ''

  const isLoading = isSectionLevel ? sectionsQuery.isLoading : enclosuresQuery.isLoading

  // ============== Render =================
  return (
    <Drawer
      anchor='bottom'
      open={open}
      onClose={onClose}
      // Render inside the parent drawer instead of teleporting to <body>.
      // Paired with absolute-positioned Paper/Backdrop, this constrains the picker
      // to the parent drawer's width (e.g. AddAnimalDrawer's 560px) instead of the full viewport.
      ModalProps={{ disablePortal: true }}
      slotProps={{
        root: {
          sx: { position: 'absolute' }
        },
        backdrop: {
          sx: { position: 'absolute' }
        },
        paper: {
          sx: {
            position: 'absolute',
            width: '100%',
            height: '75%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: theme.palette.customColors?.Background ?? theme.palette.background.default
          }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* ====== Title bar — back arrow + name + close ====== */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 4,
            px: 5,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <IconButton size='small' onClick={drillUp} sx={{ color: theme.palette.customColors?.OnSurfaceVariant }}>
              <Icon icon='mdi:arrow-left' />
            </IconButton>
            <Typography
              variant='h6'
              noWrap
              sx={{
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant ?? theme.palette.text.primary
              }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Divider />

        {/* ====== Search row ====== */}
        <Box sx={{ px: 5, pt: 4, pb: 2, flexShrink: 0 }}>
          <Search
            sx={{ backgroundColor: theme.palette.background.paper }}
            borderRadius='8px'
            width='100%'
            textFielsSX={{ height: 56 }}
            inputStyle={{ padding: '14px 12px', fontSize: '1rem' }}
            placeholder={isSectionLevel ? 'Search Section' : 'Search Enclosure'}
            value={localSearch}
            onClear={() => {
              setLocalSearch('')
              setSearchValue('')
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLocalSearch(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
        </Box>

        {/* ====== List ====== */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pb: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : isSectionLevel ? (
            sections.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 6, color: theme.palette.text.secondary }}>
                No sections found
              </Typography>
            ) : (
              sections.map(s => (
                <Box
                  key={s.section_id}
                  onClick={() => drillIntoSection(s)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    mb: 1.5,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <Avatar
                    src={s.section_image || undefined}
                    sx={{ width: 48, height: 48, bgcolor: theme.palette.customColors?.Surface }}
                  >
                    <Icon icon='mdi:home-city-outline' />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                      {s.section_name}
                    </Typography>
                    <Typography variant='caption' sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                      In Charge - {s.in_charge_name || 'NA'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {s.enclosure_count != null && (
                        <Chip
                          size='small'
                          label={`Enclosures ${s.enclosure_count}`}
                          sx={{
                            backgroundColor: theme.palette.customColors?.Surface,
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        />
                      )}
                      {s.animal_count != null && (
                        <Chip
                          size='small'
                          label={`Animals ${s.animal_count}`}
                          sx={{
                            backgroundColor: theme.palette.customColors?.Surface,
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )
          ) : enclosures.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 6, color: theme.palette.text.secondary }}>
              No enclosures found
            </Typography>
          ) : (
            enclosures.map(e => {
              const isSelected = selectedEnclosure?.enclosure_id === e.enclosure_id
              const showsChevron = hasSubs(e)

              return (
                // Two-section card: a tinted radio compartment on the left + a white content area on the right.
                // Both share the same outer rounded corners (overflow:hidden clips them together).
                // Hover lives on the OUTER container so both sections highlight together — not piecemeal.
                <Box
                  key={e.enclosure_id}
                  onClick={() => (showsChevron ? drillIntoEnclosure(e) : setSelectedEnclosure(e))}
                  sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    mb: 1.5,
                    border: `1.5px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s'
                  }}
                >
                  {/* Radio compartment — OnSurfaceVariant (#44544A) at 60% alpha (hex suffix 99).
                      Keeps the color sourced from the design-system token instead of a raw hex. */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 2,
                      minWidth: 64,
                      backgroundColor: alpha(theme.palette.customColors.OnSurfaceVariant, 0.1)
                    }}
                  >
                    <Radio
                      checked={isSelected}
                      onClick={ev => ev.stopPropagation()}
                      onChange={() => setSelectedEnclosure(e)}
                    />
                  </Box>

                  {/* White content area — avatar + name + optional chip + chevron */}
                  <Box
                    className='row-content-bg'
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: 0,
                      p: 1.5,
                      pr: 2,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <Avatar
                      src={e.enclosure_image || undefined}
                      sx={{ width: 40, height: 40, bgcolor: theme.palette.customColors?.Surface }}
                    >
                      <Icon icon='mdi:home-outline' />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                        {enclosureLabel(e)}
                      </Typography>
                      {showsChevron && (
                        <Chip
                          size='small'
                          label={`Subenclosures ${subCount(e)}`}
                          sx={{
                            mt: 0.5,
                            backgroundColor: theme.palette.customColors?.Surface,
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        />
                      )}
                    </Box>
                    {showsChevron && <Icon icon='mdi:chevron-right' />}
                  </Box>
                </Box>
              )
            })
          )}
        </Box>

        {/* ====== Footer — Cancel / Select ====== */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Button fullWidth variant='outlined' size='large' onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth variant='contained' size='large' disabled={!selectedEnclosure} onClick={handleConfirm}>
            Select
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectEnclosurePickerDrawer
