'use client'

import React, { useState } from 'react'
import { Box, Checkbox, Collapse, TextField, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import SpeciesListAnalysisFilter from 'src/views/pages/species-management/SpeciesListAnalysisFilter'
import { compactNumber, type AnalysisFilter, type SpeciesFilters } from 'src/views/pages/species-management/speciesListing.utils'
import type { MajorFilterRow } from 'src/views/pages/species-management/SpeciesListMajorFilters'

export const ANALYSIS_KEY = 'ANALYSIS'

interface SpeciesListFilterRailProps {
  sections: MajorFilterRow[]
  selected: SpeciesFilters
  onToggle: (key: keyof SpeciesFilters, value: string) => void
  analysis: AnalysisFilter
  analysisYears: number[]
  onAnalysisChange: (next: AnalysisFilter) => void
  /** Section keys (or ANALYSIS_KEY) that start expanded. */
  defaultOpen?: string[]
}

const VISIBLE_CAP = 6 // options shown before a "+N more" expander
const SEARCH_THRESHOLD = 12 // show the inline search field above this many options
const REVEAL_INDENT: Partial<Record<keyof SpeciesFilters, boolean>> = { Order: true, Family: true, Genus: true }

/**
 * Left, sticky, independently-scrollable filter rail for the Species List — Myntra-style sectioned
 * facets (Analysis + taxonomy/conservation/etc). On-system throughout: theme tokens, Typography
 * variants, mdi icons, MUI primitives. Active state is mirrored in the chip row above the results.
 */
const SpeciesListFilterRail: React.FC<SpeciesListFilterRailProps> = ({
  sections,
  selected,
  onToggle,
  analysis,
  analysisYears,
  onAnalysisChange,
  defaultOpen = ['Category', 'Class']
}) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    defaultOpen.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>)
  )
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [q, setQ] = useState<Record<string, string>>({})

  const toggleOpen = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }))

  const sectionHeader = (key: string, label: string, activeCount: number) => (
    <Box
      onClick={() => toggleOpen(key)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
        py: 2.5
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          variant='subtitle2'
          sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: cc.OnSurfaceVariant }}
        >
          {label}
        </Typography>
        {activeCount > 0 && (
          <Box
            sx={{
              minWidth: 18,
              height: 18,
              px: 0.75,
              borderRadius: '9px',
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant='caption' sx={{ color: theme.palette.common.white, fontWeight: 700, lineHeight: 1 }}>
              {activeCount}
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          color: cc.neutralSecondary,
          transform: open[key] ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s ease'
        }}
      >
        <Icon icon='mdi:chevron-down' fontSize='1.35rem' />
      </Box>
    </Box>
  )

  const optionRow = (sectionKey: keyof SpeciesFilters, value: string, label: string, count: number) => {
    const checked = selected[sectionKey].includes(value)

    return (
      <Box
        key={value}
        onClick={() => onToggle(sectionKey, value)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.5,
          cursor: 'pointer',
          borderRadius: '6px',
          '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.03) }
        }}
      >
        <Checkbox checked={checked} size='small' sx={{ p: 0.5, color: cc.OutlineVariant, '&.Mui-checked': { color: theme.palette.primary.main } }} />
        <Typography
          variant='body2'
          sx={{ flex: 1, minWidth: 0, color: cc.OnSurfaceVariant, fontWeight: checked ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {label}
        </Typography>
        <Typography variant='caption' sx={{ color: cc.neutralSecondary, flexShrink: 0 }}>
          {compactNumber(count)}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Rail title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2, borderBottom: `1px solid ${cc.SurfaceVariant}` }}>
        <Icon icon='mdi:filter-variant' fontSize='1.35rem' color={cc.OnSurfaceVariant} />
        <Typography variant='subtitle1' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
          Filters
        </Typography>
      </Box>

      {/* ── ANALYSIS (its own top section) ── */}
      <Box sx={{ borderBottom: `1px solid ${cc.SurfaceVariant}` }}>
        {sectionHeader(ANALYSIS_KEY, 'Analysis', analysis.mode ? 1 : 0)}
        <Collapse in={open[ANALYSIS_KEY]}>
          <Box sx={{ pb: 3 }}>
            <SpeciesListAnalysisFilter value={analysis} years={analysisYears} onChange={onAnalysisChange} vertical />
          </Box>
        </Collapse>
      </Box>

      {/* ── Facet sections ── */}
      {sections.map(section => {
        // Progressive reveal: hide the whole section until its parent facet has a selection.
        if (section.revealWhenSelected && selected[section.revealWhenSelected].length === 0) return null

        const activeCount = selected[section.key].length
        const query = (q[section.key] || '').trim().toLowerCase()
        const searchable = section.options.length > SEARCH_THRESHOLD
        const matched = query ? section.options.filter(o => o.label.toLowerCase().includes(query)) : section.options
        const isExpanded = expanded[section.key]
        const overflowing = matched.length > VISIBLE_CAP
        const shown = overflowing && !isExpanded ? matched.slice(0, VISIBLE_CAP) : matched
        const indent = REVEAL_INDENT[section.key]

        return (
          <Box key={section.key} sx={{ borderBottom: `1px solid ${cc.SurfaceVariant}`, pl: indent ? 2 : 0 }}>
            {sectionHeader(section.key, indent ? `↳ ${section.label}` : section.label, activeCount)}
            <Collapse in={open[section.key]}>
              <Box sx={{ pb: 2.5 }}>
                {searchable && (
                  <TextField
                    size='small'
                    fullWidth
                    placeholder={`Search ${section.label.toLowerCase()}…`}
                    value={q[section.key] || ''}
                    onChange={e => setQ(p => ({ ...p, [section.key]: e.target.value }))}
                    sx={{ mb: 1.5 }}
                    InputProps={{
                      startAdornment: (
                        <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} />
                      )
                    }}
                  />
                )}
                {shown.map(opt => optionRow(section.key, opt.value, opt.label, opt.count))}
                {matched.length === 0 && (
                  <Typography variant='caption' sx={{ color: cc.neutralSecondary, pl: 1 }}>
                    No matches
                  </Typography>
                )}
                {overflowing && (
                  <Box
                    onClick={() => setExpanded(p => ({ ...p, [section.key]: !isExpanded }))}
                    sx={{ mt: 0.5, cursor: 'pointer', display: 'inline-flex', userSelect: 'none' }}
                  >
                    <Typography variant='caption' sx={{ color: theme.palette.primary.dark, fontWeight: 600 }}>
                      {isExpanded ? 'Show less' : `+ ${matched.length - VISIBLE_CAP} more`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )
      })}
    </Box>
  )
}

export default SpeciesListFilterRail
