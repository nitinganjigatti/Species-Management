'use client'

import React, { useState } from 'react'
import { Box, Divider, Drawer, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { compactNumber, type FilterInsights, type SpeciesFilters } from 'src/views/pages/species-management/list2/speciesListing.utils'

export interface MajorFilterOption {
  value: string
  label: string
  count: number
  animals: number
  insights?: FilterInsights
  note?: string
}

export interface MajorFilterRow {
  key: keyof SpeciesFilters
  label: string
  options: MajorFilterOption[]
  /** When set, this row is hidden until the named facet has a selection (progressive flow). */
  revealWhenSelected?: keyof SpeciesFilters
}

interface SpeciesListMajorFiltersProps {
  rows: MajorFilterRow[]
  selected: SpeciesFilters
  onToggle: (key: keyof SpeciesFilters, value: string) => void
  onClearFacet: (key: keyof SpeciesFilters) => void
}

// Chips shown per row before collapsing the rest behind "+N more" (keeps each row to 1 line).
const ROW_CAP = 4

const SpeciesListMajorFilters: React.FC<SpeciesListMajorFiltersProps> = ({ rows, selected, onToggle, onClearFacet }) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [sheetOpt, setSheetOpt] = useState<MajorFilterOption | null>(null)

  const pillSx = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    pl: 2.75,
    pr: 2.5,
    py: 1.35,
    borderRadius: '999px',
    cursor: 'pointer',
    border: '1px solid',
    borderColor: active ? cc.OnSurfaceVariant : cc.OutlineVariant,
    bgcolor: active ? cc.OnSurfaceVariant : theme.palette.background.paper,
    color: active ? theme.palette.common.white : cc.OnSurfaceVariant,
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
    '&:hover': {
      borderColor: active ? cc.OnSurfaceVariant : cc.Outline,
      bgcolor: active ? cc.OnSurfaceVariant : alpha(theme.palette.common.black, 0.04)
    }
  })

  const ghostPillSx = {
    display: 'inline-flex',
    alignItems: 'center',
    py: 1,
    px: 1.5,
    borderRadius: '999px',
    cursor: 'pointer',
    color: theme.palette.primary.dark,
    fontWeight: 600,
    flexShrink: 0,
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
    '&:hover': { bgcolor: cc.OnBackground }
  }

  // ── Tooltip content (dark surface, white text) ──
  const tipRow = (label: string, value: string) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2.5, py: 0.65 }}>
      <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
        {label}
      </Typography>
      <Typography variant='caption' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  )

  const insightTitle = (opt: MajorFilterOption) => {
    const i = opt.insights
    if (!i) return ''

    return (
      <Box sx={{ py: 0.5, minWidth: 190 }}>
        <Typography
          variant='caption'
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.5, color: cc.OnSurfaceVariant }}
        >
          {opt.label}
        </Typography>
        {opt.note && (
          <Typography variant='caption' sx={{ display: 'block', color: theme.palette.primary.dark, mb: 1, lineHeight: 1.4 }}>
            {opt.note}
          </Typography>
        )}
        {tipRow('Share', `${i.sharePct}% of species`)}
        {tipRow('Threatened', `S-${compactNumber(i.threatenedS)} • A-${compactNumber(i.threatenedA)}`)}
        {tipRow('CITES', `I: ${i.citesI.toLocaleString()} · II: ${i.citesII.toLocaleString()}`)}
        {tipRow('Needs sexing', `S-${compactNumber(i.sexingS)} • A-${compactNumber(i.sexingA)}`)}
        <Box
          onClick={e => {
            e.stopPropagation()
            setSheetOpt(opt)
          }}
          sx={{
            mt: 1.25,
            pt: 1,
            borderTop: `1px solid ${cc.SurfaceVariant}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            color: theme.palette.primary.main
          }}
        >
          <Icon icon='mdi:creation' fontSize='1rem' />
          <Typography variant='caption' sx={{ fontWeight: 700, color: 'inherit' }}>
            AI Insight
          </Typography>
        </Box>
      </Box>
    )
  }

  const tooltipSlotProps = {
    tooltip: {
      sx: {
        bgcolor: theme.palette.background.paper,
        color: cc.OnSurfaceVariant,
        border: `1px solid ${cc.SurfaceVariant}`,
        boxShadow: theme.shadows[4],
        px: 3.5,
        py: 3,
        borderRadius: '12px',
        maxWidth: 340
      }
    },
    arrow: { sx: { color: theme.palette.background.paper, '&::before': { border: `1px solid ${cc.SurfaceVariant}` } } }
  }

  // ── Side sheet content (light surface, dark text) ──
  const sheetRow = (label: string, value: string) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: `1px solid ${cc.SurfaceVariant}` }}>
      <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
        {value}
      </Typography>
    </Box>
  )

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {rows.map(row => {
          if (row.revealWhenSelected && selected[row.revealWhenSelected].length === 0) return null

          const sel = selected[row.key]
          const allActive = sel.length === 0
          const isExpanded = expanded[row.key]
          const overflowing = row.options.length > ROW_CAP
          const shown = overflowing && !isExpanded ? row.options.slice(0, ROW_CAP) : row.options
          const hiddenCount = row.options.length - ROW_CAP

          return (
            <Box key={row.key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'nowrap' }}>
              <Typography
                variant='body2'
                sx={{
                  color: cc.OnSurfaceVariant,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  width: 92,
                  flexShrink: 0,
                  pt: 1.1
                }}
              >
                {row.label}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flexWrap: 'wrap', flex: 1 }}>
                <Box sx={pillSx(allActive)} onClick={() => onClearFacet(row.key)}>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'inherit' }}>
                    All
                  </Typography>
                </Box>

                {shown.map(opt => {
                  const active = sel.includes(opt.value)

                  return (
                    <Tooltip
                      key={opt.value}
                      arrow
                      placement='top'
                      title={insightTitle(opt)}
                      enterDelay={400}
                      enterTouchDelay={400}
                      leaveTouchDelay={5000}
                      slotProps={tooltipSlotProps}
                    >
                      <Box sx={pillSx(active)} onClick={() => onToggle(row.key, opt.value)}>
                        <Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }} noWrap>
                          {opt.label}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            color: active ? alpha(theme.palette.common.white, 0.8) : cc.neutralSecondary,
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          S-{compactNumber(opt.count)} • A-{compactNumber(opt.animals)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )
                })}

                {overflowing && (
                  <Box sx={ghostPillSx} onClick={() => setExpanded(p => ({ ...p, [row.key]: !isExpanded }))}>
                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                      {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* AI Insight side sheet */}
      <Drawer
        anchor='right'
        open={!!sheetOpt}
        onClose={() => setSheetOpt(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 } } } }}
      >
        {sheetOpt?.insights && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Icon icon='mdi:creation' />
                <Typography variant='subtitle1' sx={{ fontWeight: 700, color: cc.OnSurfaceVariant }}>
                  AI Insight
                </Typography>
              </Box>
              <IconButton size='small' onClick={() => setSheetOpt(null)}>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>

            <Typography variant='h6' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
              {sheetOpt.label}
            </Typography>
            {sheetOpt.note && (
              <Typography variant='body2' sx={{ color: theme.palette.primary.dark, mt: 0.5, mb: 2 }}>
                {sheetOpt.note}
              </Typography>
            )}

            <Box sx={{ mt: 2 }}>
              {sheetRow('Share of collection', `${sheetOpt.insights.sharePct}% of species`)}
              {sheetRow('Threatened (IUCN)', `S-${compactNumber(sheetOpt.insights.threatenedS)} • A-${compactNumber(sheetOpt.insights.threatenedA)}`)}
              {sheetRow('CITES', `Appendix I: ${sheetOpt.insights.citesI.toLocaleString()} · Appendix II: ${sheetOpt.insights.citesII.toLocaleString()}`)}
              {sheetRow('Needs sexing', `S-${compactNumber(sheetOpt.insights.sexingS)} • A-${compactNumber(sheetOpt.insights.sexingA)}`)}
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              Counts are species (S) and animals (A) within this filter. Totals for the whole collection are shown in the
              stats band above the list.
            </Typography>
          </Box>
        )}
      </Drawer>
    </>
  )
}

export default SpeciesListMajorFilters
