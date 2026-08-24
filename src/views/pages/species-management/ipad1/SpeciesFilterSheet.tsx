'use client'

// iPad 1 fork of the Diet-module filter (CustomFilterDrawer + SpeciesManagementFilterDrawer2
// merged into ONE generic component) — the single filter surface for the whole iPad tree:
// species listing "Filters" AND detail-tab "Other Filters" both open this. UI is a straight
// copy of the Diet filter (left menu rail w/ badges, search, Select all, checkbox list w/
// counts, Cancel All / Apply Filter footer); geometry comes from the kit SheetDrawer
// (portrait = full-width 88dvh bottom sheet w/ grab handle, landscape = right side sheet).
// Originals in src/components/drawers + src/components/species-management stay untouched.

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Checkbox, Divider, IconButton, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { SheetDrawer } from 'src/views/pages/species-management/ipad1/detail/detailUi'

export interface FilterSheetOption {
  value: string
  label: string
  count: number
}

export interface FilterSheetSection {
  key: string
  label: string
  options: FilterSheetOption[]
}

interface SpeciesFilterSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  sections: FilterSheetSection[]
  /** Applied selection per section key — the sheet stages a draft and commits on Apply. */
  selected: Record<string, string[]>
  onApply: (selected: Record<string, string[]>) => void
}

const SpeciesFilterSheet: React.FC<SpeciesFilterSheetProps> = ({ open, onClose, title = 'Filter', sections, selected, onApply }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  const [selectedMenu, setSelectedMenu] = useState<string>(sections[0]?.key || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [draft, setDraft] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (open) {
      setDraft({ ...selected })
      setSearchQuery('')
      setSelectedMenu(prev => (sections.some(s => s.key === prev) ? prev : sections[0]?.key || ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const section = sections.find(s => s.key === selectedMenu) || sections[0]
  const draftFor = (key: string) => draft[key] || []

  const currentOptions = useMemo(() => {
    const opts = section?.options || []
    if (!searchQuery) return opts

    return opts.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [section, searchQuery])

  const toggleOption = (value: string) => {
    if (!section) return
    setDraft(prev => {
      const cur = prev[section.key] || []
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]

      return { ...prev, [section.key]: next }
    })
  }

  const allVisibleSelected = !!section && currentOptions.length > 0 && currentOptions.every(o => draftFor(section.key).includes(o.value))

  const handleSelectAll = () => {
    if (!section) return
    setDraft(prev => {
      const values = currentOptions.map(o => o.value)
      const cur = prev[section.key] || []
      const allSel = values.every(v => cur.includes(v))
      const next = allSel ? cur.filter(v => !values.includes(v)) : Array.from(new Set([...cur, ...values]))

      return { ...prev, [section.key]: next }
    })
  }

  const handleCancelAll = () => setDraft({})

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const totalCount = sections.reduce((n, s) => n + draftFor(s.key).length, 0)
  const heading = totalCount > 0 ? `${title} - ${totalCount}` : title

  return (
    <SheetDrawer
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: cc.Background,
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Header (copy of CustomFilterDrawer) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 3 }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: cc.OnSurfaceVariant }}>{heading}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      {/* Content — left menu rail + option panel */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', px: 5, minHeight: 0 }}>
        <Box sx={{ width: 200, flexShrink: 0, overflowY: 'auto' }}>
          <List sx={{ p: 0 }}>
            {sections.map(s => (
              <ListItemButton
                key={s.key}
                onClick={() => {
                  setSelectedMenu(s.key)
                  setSearchQuery('')
                }}
                sx={{
                  color: 'primary.light',
                  fontSize: '16px',
                  fontWeight: 400,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  backgroundColor: selectedMenu === s.key ? cc.OnPrimary : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedMenu === s.key ? cc.OnPrimary : alpha(cc.OnPrimary, 0.8)
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '16px', color: cc.OnSurfaceVariant }}>{s.label}</Typography>
                      <Badge badgeContent={draftFor(s.key).length} color='primary' sx={{ ml: 2 }} />
                    </Box>
                  }
                  sx={{ '& .MuiListItemText-primary': { color: cc.OnSurfaceVariant, fontSize: '16px' } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ width: '100%', backgroundColor: cc.OnPrimary, borderTopRightRadius: '8px', p: '24px', pb: 0, flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ mb: 4 }}>
              <Search
                value={searchQuery}
                placeholder={`Search ${(section?.label || '').toLowerCase()}...`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {currentOptions.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!!section && draftFor(section.key).length > 0 && !allVisibleSelected}
                      onChange={handleSelectAll}
                    />
                    <Typography variant='body1' sx={{ color: cc.Outline }}>
                      Select all
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {currentOptions.map(opt => (
                      <Box key={opt.value} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                          <Checkbox checked={!!section && draftFor(section.key).includes(opt.value)} onChange={() => toggleOption(opt.value)} />
                          <Typography variant='body1' sx={{ color: cc.OnSurfaceVariant }} noWrap>
                            {opt.label}
                          </Typography>
                        </Box>
                        <Typography variant='caption' sx={{ color: cc.neutralSecondary, flexShrink: 0, ml: 2 }}>
                          {opt.count.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant='body2' sx={{ color: cc.Outline, textAlign: 'center', py: 4 }}>
                  No options found
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer (copy of CustomFilterDrawer) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: cc.OnPrimary,
          px: 4,
          py: 6,
          boxShadow: `0px 4px 21px 0px ${alpha(theme.palette.primary.deepDark || theme.palette.primary.dark, 0.4)}`,
          gap: 2,
          flexShrink: 0
        }}
      >
        <Button size='large' variant='outlined' fullWidth onClick={handleCancelAll}>
          Cancel All
        </Button>
        <Button size='large' variant='contained' fullWidth onClick={handleApply}>
          Apply Filter
        </Button>
      </Box>
    </SheetDrawer>
  )
}

export default SpeciesFilterSheet
