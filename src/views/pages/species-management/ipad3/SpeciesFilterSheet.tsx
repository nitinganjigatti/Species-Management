'use client'

// iPad 3 fork of the Diet-module filter (CustomFilterDrawer + SpeciesManagementFilterDrawer2
// merged into ONE generic component) — the single filter surface for the whole iPad tree:
// species listing "Filters" AND detail-tab "Other Filters" both open this. UI is a straight
// copy of the Diet filter (left menu rail w/ badges, search, Select all, checkbox list w/
// counts, Cancel All / Apply Filter footer); geometry comes from the kit SheetDrawer
// (portrait = full-width 88dvh bottom sheet w/ grab handle, landscape = right side sheet).
// Originals in src/components/drawers + src/components/species-management stay untouched.

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Checkbox, Divider, IconButton, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { SheetDrawer } from 'src/views/pages/species-management/ipad3/detail/detailUi'

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
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Header (copy of CustomFilterDrawer) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 3 }}>
          <Icon icon='mage:filter' fontSize={26} color={skin.LIST_GREEN} />
          <Typography sx={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.3px', color: skin.INK }}>{heading}</Typography>
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
                  fontSize: '16px',
                  fontWeight: 400,
                  borderRadius: '10px',
                  mb: 0.5,
                  backgroundColor: selectedMenu === s.key ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedMenu === s.key ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '16px', fontWeight: selectedMenu === s.key ? 600 : 400, color: selectedMenu === s.key ? skin.LIST_GREEN : skin.INK2 }}>{s.label}</Typography>
                      <Badge badgeContent={draftFor(s.key).length} sx={{ ml: 2, '& .MuiBadge-badge': { bgcolor: skin.LIST_GREEN, color: '#ffffff', fontWeight: 600 } }} />
                    </Box>
                  }
                  sx={{ '& .MuiListItemText-primary': { fontSize: '16px' } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ width: '100%', borderLeft: `1px solid ${skin.HAIR}`, p: '24px', pt: 0, pb: 0, flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ mb: 4 }}>
              <Search
                value={searchQuery}
                placeholder={`Search ${(section?.label || '').toLowerCase()}...`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                borderRadius='999px'
                backgroundColor={skin.FIELD_BG}
                textFielsSX={{
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
                }}
              />
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {currentOptions.length > 0 ? (
                <>
                  {/* The WHOLE row is the tap target (checkbox alone is a fiddly
                      target on glass); the checkbox stops propagation so a direct
                      tap on it doesn't toggle twice. */}
                  <Box
                    onClick={handleSelectAll}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer',
                      borderRadius: '10px',
                      ...skin.cardPressSx,
                      '&:hover': { bgcolor: skin.ROW_HOVER }
                    }}
                  >
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!!section && draftFor(section.key).length > 0 && !allVisibleSelected}
                      onChange={handleSelectAll}
                      onClick={e => e.stopPropagation()}
                      sx={{ color: skin.DASH_INK, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: skin.LIST_GREEN } }}
                    />
                    <Typography variant='body1' sx={{ color: skin.MUTED }}>
                      Select all
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: skin.HAIR }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {currentOptions.map(opt => (
                      <Box
                        key={opt.value}
                        onClick={() => toggleOption(opt.value)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderRadius: '10px',
                          pr: 2,
                          ...skin.cardPressSx,
                          '&:hover': { bgcolor: skin.ROW_HOVER }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                          <Checkbox
                            checked={!!section && draftFor(section.key).includes(opt.value)}
                            onChange={() => toggleOption(opt.value)}
                            onClick={e => e.stopPropagation()}
                            sx={{ color: skin.DASH_INK, '&.Mui-checked': { color: skin.LIST_GREEN } }}
                          />
                          <Typography variant='body1' sx={{ color: skin.INK2 }} noWrap>
                            {opt.label}
                          </Typography>
                        </Box>
                        <Typography variant='caption' sx={{ color: skin.FAINT, flexShrink: 0, ml: 2, fontVariantNumeric: 'tabular-nums' }}>
                          {opt.count.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant='body2' sx={{ color: skin.FAINT, textAlign: 'center', py: 4 }}>
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
          bgcolor: '#ffffff',
          borderTop: `1px solid ${skin.HAIR}`,
          px: 4,
          py: 4,
          gap: 2,
          flexShrink: 0
        }}
      >
        {/* color='inherit' / variant='contained' keep these off the theme's
            text-primary hover rule (primary @ 8% — a pale wash that outranks
            a plain sx '&:hover' and washed the CTA out). */}
        <Button
          size='large'
          fullWidth
          color='inherit'
          onClick={handleCancelAll}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '999px',
            color: skin.INK2,
            border: `1px solid ${skin.TRACK}`,
            ...skin.cardPressSx,
            '&:hover': { bgcolor: skin.ROW_HOVER }
          }}
        >
          Cancel All
        </Button>
        <Button
          size='large'
          fullWidth
          variant='contained'
          disableElevation
          onClick={handleApply}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '999px',
            color: '#ffffff',
            bgcolor: skin.LIST_GREEN,
            ...skin.cardPressSx,
            '&:hover': { bgcolor: skin.ACCENT_INK, color: '#ffffff' }
          }}
        >
          Apply Filter
        </Button>
      </Box>
    </SheetDrawer>
  )
}

export default SpeciesFilterSheet
