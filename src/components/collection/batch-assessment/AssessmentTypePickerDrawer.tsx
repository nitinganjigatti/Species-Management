import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { getAssessmentCategoriesList, getAssessmentTypesList } from 'src/lib/api/report'

interface AssessmentCategory {
  assessment_category_id: number
  label: string
}

interface AssessmentType {
  assessment_type_id: number
  assessments_type_label: string
}

interface AssessmentTypePickerDrawerProps {
  open: boolean
  onClose: () => void
  initialSelectedIds: number[]
  onConfirm: (ids: number[]) => void
  refType?: string
}

const ALL_CATEGORY_ID = 0

const AssessmentTypePickerDrawer: React.FC<AssessmentTypePickerDrawerProps> = ({
  open,
  onClose,
  initialSelectedIds,
  onConfirm,
  refType = 'animal'
}) => {
  const theme = useTheme() as any

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [catId, setCatId] = useState<number>(ALL_CATEGORY_ID)
  const [searchInput, setSearchInput] = useState('')
  const [searchValue, setSearchValue] = useState('')

  // Reset state every time the drawer opens — selection seeds from the URL via initialSelectedIds.
  useEffect(() => {
    if (!open) return
    setSelectedIds(initialSelectedIds)
    setCatId(ALL_CATEGORY_ID)
    setSearchInput('')
    setSearchValue('')
  }, [open, initialSelectedIds])

  const debouncedSearch = useMemo(() => debounce((val: string) => setSearchValue(val), 400), [])
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  // Categories — drives the chip strip.
  const categoriesQuery = useQuery({
    queryKey: ['assessment-categories', refType],
    queryFn: () => getAssessmentCategoriesList({ ref_type: refType }),
    enabled: open
  })

  const categories: AssessmentCategory[] = useMemo(() => {
    return (categoriesQuery.data?.data as AssessmentCategory[]) ?? []
  }, [categoriesQuery.data])

  // Types — paginated via useInfiniteQuery. Each new (refType, catId, searchValue) triple gets a
  // fresh queryKey so React Query swaps the page list cleanly on filter changes.
  // The endpoint doesn't accept a `limit`; we follow whatever page size the backend returns and
  // stop once the running total hits `total_count`.
  const typesQuery = useInfiniteQuery({
    queryKey: ['assessment-types', refType, catId, searchValue],
    queryFn: async ({ pageParam }) => {
      const res: any = await getAssessmentTypesList({
        ref_type: refType as 'animal' | 'housing',
        cat_id: (catId === ALL_CATEGORY_ID ? '' : String(catId)) as any,
        q: searchValue,
        page_no: pageParam as number
      })
      const result = (res?.data?.result ?? []) as AssessmentType[]
      const total = Number(res?.data?.total_count ?? 0)

      return { result, total }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.result.length) return undefined
      const fetched = allPages.reduce((sum, p) => sum + p.result.length, 0)

      return fetched < lastPage.total ? allPages.length + 1 : undefined
    },
    enabled: open
  })

  // Flatten all loaded pages into a single list for rendering.
  const types: AssessmentType[] = useMemo(() => {
    return typesQuery.data?.pages.flatMap(p => p.result) ?? []
  }, [typesQuery.data])

  // Bottom-of-list sentinel — when it scrolls into view, request the next page (with a 300ms
  // cooldown to avoid double-firing in the same scroll burst, mirroring SectionsDrawer).
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!typesQuery.isFetchingNextPage && typesQuery.hasNextPage) {
      cooldownRef.current = true
      typesQuery.fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [typesQuery])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  const toggle = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleAdd = () => {
    onConfirm(selectedIds)
    onClose()
  }

  const selectionLabel =
    selectedIds.length === 0
      ? 'No type selected'
      : `${selectedIds.length} type${selectedIds.length === 1 ? '' : 's'} selected`

  // "Dirty" check — has the user changed the selection vs. what was already saved (URL-derived).
  // Used to disable the Add button when reopening the drawer with no edits yet.
  const isDirty = useMemo(() => {
    const a = [...selectedIds].sort((x, y) => x - y)
    const b = [...initialSelectedIds].sort((x, y) => x - y)
    if (a.length !== b.length) return true

    return a.some((v, i) => v !== b[i])
  }, [selectedIds, initialSelectedIds])

  // Show the Add button whenever there's anything to act on — either the user has
  // a current selection, or there was an existing one to potentially modify.
  const showAddButton = selectedIds.length > 0 || initialSelectedIds.length > 0

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 600 },
            backgroundColor: theme.palette.customColors?.Background ?? theme.palette.background.default
          }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 4,
            px: 5,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.customColors?.OnSurfaceVariant }}>
              <Icon icon='mdi:arrow-left' />
            </IconButton>
            <Typography
              variant='h6'
              noWrap
              sx={{ fontWeight: 600, color: theme.palette.customColors?.OnSurfaceVariant }}
            >
              Search Assessment Type
            </Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Divider />

        {/* Search */}
        <Box sx={{ px: 5, pt: 4, pb: 2, flexShrink: 0 }}>
          <Search
            sx={{ backgroundColor: theme.palette.background.paper }}
            borderRadius='8px'
            width='100%'
            textFielsSX={{ height: 56 }}
            inputStyle={{ padding: '14px 12px', fontSize: '1rem' }}
            placeholder='Search assessment type'
            value={searchInput}
            onClear={() => {
              setSearchInput('')
              setSearchValue('')
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchInput(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
        </Box>

        {/* Category chip strip — horizontal scroll */}
        <Box sx={{ px: 5, pt: 1, pb: 3, flexShrink: 0, overflowX: 'auto' }}>
          {categoriesQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', py: 1 }}>
              <CircularProgress size={18} />
            </Box>
          ) : (
            <Stack direction='row' spacing={1.5} sx={{ flexWrap: 'nowrap', width: 'max-content' }}>
              {[{ assessment_category_id: ALL_CATEGORY_ID, label: 'All' }, ...categories].map(cat => {
                const id = cat.assessment_category_id
                const selected = catId === id

                return (
                  <Chip
                    key={id}
                    label={cat.label}
                    clickable
                    onClick={() => setCatId(id)}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      px: 1,
                      backgroundColor: selected
                        ? theme.palette.primary.main
                        : theme.palette.customColors.Surface,
                      color: selected ? theme.palette.common.white : theme.palette.customColors.OnSurfaceVariant,
                      border: selected ? 'none' : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                      '&:hover': {
                        backgroundColor: selected
                          ? theme.palette.primary.dark
                          : theme.palette.customColors.Surface
                      }
                    }}
                  />
                )
              })}
            </Stack>
          )}
        </Box>

        <Divider />

        {/* Types list — paginated. Sentinel <div ref={loaderRef}/> at the bottom triggers fetchNextPage. */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 3 }}>
          {typesQuery.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : types.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 6, color: theme.palette.text.secondary }}>
              No assessment types found
            </Typography>
          ) : (
            types.map(t => {
              // Backend ships assessment_type_id as a string ("4"); URL-parsed selectedIds are numbers.
              // Coerce here so `.includes` doesn't silently miss matches.
              const id = Number(t.assessment_type_id)
              const checked = selectedIds.includes(id)

              return (
                <Card
                  key={id}
                  variant='outlined'
                  onClick={() => toggle(id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 2,
                    mb: 1.5,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: `1.5px solid ${
                      checked ? theme.palette.primary.main : theme.palette.customColors.SurfaceVariant
                    }`,
                    backgroundColor: checked
                      ? theme.palette.customColors.Surface
                      : theme.palette.background.paper,
                    transition: 'all 0.15s'
                  }}
                >
                  <Typography
                    variant='subtitle1'
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      pr: 2,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t.assessments_type_label}
                  </Typography>
                  <Checkbox
                    checked={checked}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggle(id)}
                    sx={{ p: 0.5 }}
                  />
                </Card>
              )
            })
          )}

          {/* Bottom sentinel + next-page spinner. Empty when there are no more pages. */}
          {types.length > 0 && (typesQuery.hasNextPage || typesQuery.isFetchingNextPage) && (
            <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              {typesQuery.isFetchingNextPage && <CircularProgress size={20} />}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography
            variant='body2'
            sx={{ flex: 1, color: theme.palette.customColors.neutralSecondary, fontWeight: 500 }}
          >
            {selectionLabel}
          </Typography>
          {showAddButton && (
            <Button variant='contained' size='large' disabled={!isDirty} onClick={handleAdd}>
              {selectedIds.length > 0 ? `Add (${selectedIds.length})` : 'Add'}
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default AssessmentTypePickerDrawer
