'use client'

import React from 'react'
import { Box, MenuItem, Select, Typography } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { SelectChevron } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { MONTH_LABELS, type AnalysisFilter, type AnalysisMode } from 'src/views/pages/species-management/ipad3/list/speciesListing.utils'

interface SpeciesListAnalysisFilterProps {
  value: AnalysisFilter
  years: number[]
  onChange: (next: AnalysisFilter) => void
  /** Row label (default "Analysis"). */
  label?: string
  /** When true, a mode is always active — clicking the active pill does nothing (no "off" state).
   *  Used on the species-detail Circle of Life tab where the pills act as sub-tabs. */
  alwaysOn?: boolean
  /** When true, Lifespan mode shows the same Year/Month period range as Births/Deaths (to scope the
   *  age-at-death window) instead of the species-list min/max lifespan band. */
  periodForLifespan?: boolean
  /** Stacked layout for the narrow filter rail: hides the inline label and stacks the controls. */
  vertical?: boolean
}

const MODES: { key: AnalysisMode; label: string; icon: string }[] = [
  { key: 'births', label: 'Births', icon: 'mdi:egg-outline' },
  { key: 'deaths', label: 'Deaths', icon: 'mdi:grave-stone' },
  { key: 'lifespan', label: 'Lifespan', icon: 'mdi:timer-sand' }
]

// Lifespan band bounds offered in the min/max selects (years).
const LIFE_BOUNDS = [1, 3, 5, 10, 15, 20, 30, 50, 75]

const SpeciesListAnalysisFilter: React.FC<SpeciesListAnalysisFilterProps> = ({
  value,
  years,
  onChange,
  label = 'Analysis',
  alwaysOn = false,
  periodForLifespan = false,
  vertical = false
}) => {
  const setMode = (mode: AnalysisMode) => {
    // Re-clicking the active mode turns analysis off (unless alwaysOn); switching picks the new mode.
    if (value.mode === mode) {
      if (alwaysOn) return
      return onChange({ ...value, mode: null })
    }
    onChange({ mode, yearFrom: null, yearTo: null, monthFrom: null, monthTo: null, lifeMin: null, lifeMax: null })
  }

  // Year/Month period range applies to Births/Deaths, and to Lifespan when periodForLifespan is set.
  const showPeriod = value.mode === 'births' || value.mode === 'deaths' || (value.mode === 'lifespan' && periodForLifespan)

  const pillSx = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.85,
    pl: 2.25,
    pr: 2.5,
    height: skin.CONTROL_H,
    borderRadius: '999px',
    cursor: 'pointer',
    border: '1px solid',
    borderColor: active ? skin.mixOverWhite(skin.LIST_GREEN, 0.28) : skin.DROPDOWN_BORDER,
    bgcolor: active ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : '#ffffff',
    color: active ? skin.LIST_GREEN : skin.INK2,
    transition: `all ${skin.DUR_FAST} ${skin.EASE}`,
    userSelect: 'none' as const,
    '&:hover': {
      borderColor: active ? skin.mixOverWhite(skin.LIST_GREEN, 0.4) : skin.DROPDOWN_BORDER_HOVER,
      bgcolor: active ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER
    }
  })

  // Compact, on-system Select used for every range bound.
  const rangeSelect = (
    current: number | null,
    onPick: (v: number | null) => void,
    items: { value: number; label: string }[],
    anyLabel: string
  ) => (
    <Select
      size='small'
      value={current == null ? '' : String(current)}
      displayEmpty
      onChange={(e: SelectChangeEvent) => onPick(e.target.value === '' ? null : Number(e.target.value))}
      renderValue={v => (v === '' ? anyLabel : items.find(i => String(i.value) === v)?.label ?? String(v))}
      IconComponent={SelectChevron}
      sx={{
        minWidth: vertical ? 0 : 86,
        flex: vertical ? 1 : 'none',
        bgcolor: '#ffffff',
        borderRadius: '999px',
        '& .MuiSelect-select': { py: 0.85, color: skin.INK2, fontSize: '0.875rem' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER_HOVER }
      }}
      MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320, borderRadius: '10px' } } } }}
    >
      <MenuItem value=''>
        <Typography variant='body2' sx={{ color: skin.FAINT }}>
          {anyLabel}
        </Typography>
      </MenuItem>
      {items.map(i => (
        <MenuItem key={i.value} value={String(i.value)}>
          {i.label}
        </MenuItem>
      ))}
    </Select>
  )

  const dash = (
    <Typography variant='body2' sx={{ color: skin.FAINT, px: 0.25 }}>
      –
    </Typography>
  )
  const groupLabel = (text: string) => (
    <Typography variant='caption' sx={{ color: skin.FAINT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mr: 0.5 }}>
      {text}
    </Typography>
  )

  const yearItems = years.map(y => ({ value: y, label: String(y) }))
  const monthItems = MONTH_LABELS.map((m, i) => ({ value: i + 1, label: m }))
  const lifeItems = LIFE_BOUNDS.map(y => ({ value: y, label: `${y}y` }))

  // Vertical (rail) version: a from–to pair stacked under its label, selects sharing the width.
  const verticalRange = (
    text: string,
    fromVal: number | null,
    onFrom: (v: number | null) => void,
    toVal: number | null,
    onTo: (v: number | null) => void,
    items: { value: number; label: string }[],
    anyLabel: string
  ) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {groupLabel(text)}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {rangeSelect(fromVal, onFrom, items, anyLabel)}
        {dash}
        {rangeSelect(toVal, onTo, items, anyLabel)}
      </Box>
    </Box>
  )

  if (vertical) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {MODES.map(m => {
            const active = value.mode === m.key

            return (
              <Box key={m.key} sx={pillSx(active)} onClick={() => setMode(m.key)}>
                <Icon icon={m.icon} fontSize='1.05rem' />
                <Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>
                  {m.label}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {showPeriod && (
          <>
            {verticalRange('Years', value.yearFrom, v => onChange({ ...value, yearFrom: v }), value.yearTo, v => onChange({ ...value, yearTo: v }), yearItems, 'All time')}
            {verticalRange('Months', value.monthFrom, v => onChange({ ...value, monthFrom: v }), value.monthTo, v => onChange({ ...value, monthTo: v }), monthItems, 'All')}
          </>
        )}

        {value.mode === 'lifespan' && !periodForLifespan &&
          verticalRange('Avg adult life', value.lifeMin, v => onChange({ ...value, lifeMin: v }), value.lifeMax, v => onChange({ ...value, lifeMax: v }), lifeItems, 'Any')}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
      {!vertical && (
        <Typography
          variant='body2'
          sx={{ color: skin.INK2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', width: 92, flexShrink: 0 }}
        >
          {label}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {MODES.map(m => {
          const active = value.mode === m.key

          return (
            <Box key={m.key} sx={pillSx(active)} onClick={() => setMode(m.key)}>
              <Icon icon={m.icon} fontSize='1.05rem' />
              <Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>
                {m.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* Births / Deaths (and detail Lifespan) period controls */}
      {showPeriod && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pl: { sm: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {groupLabel('Years')}
            {rangeSelect(value.yearFrom, v => onChange({ ...value, yearFrom: v }), yearItems, 'All time')}
            {dash}
            {rangeSelect(value.yearTo, v => onChange({ ...value, yearTo: v }), yearItems, 'All time')}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {groupLabel('Months')}
            {rangeSelect(value.monthFrom, v => onChange({ ...value, monthFrom: v }), monthItems, 'All')}
            {dash}
            {rangeSelect(value.monthTo, v => onChange({ ...value, monthTo: v }), monthItems, 'All')}
          </Box>
        </Box>
      )}

      {/* Lifespan band controls (species-list only — filters species by lifespan range) */}
      {value.mode === 'lifespan' && !periodForLifespan && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', pl: { sm: 1 } }}>
          {groupLabel('Avg adult life')}
          {rangeSelect(value.lifeMin, v => onChange({ ...value, lifeMin: v }), lifeItems, 'Any')}
          {dash}
          {rangeSelect(value.lifeMax, v => onChange({ ...value, lifeMax: v }), lifeItems, 'Any')}
          <Typography variant='caption' sx={{ color: skin.FAINT, ml: 0.5 }}>
            Ranked by average adult lifespan
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default SpeciesListAnalysisFilter
