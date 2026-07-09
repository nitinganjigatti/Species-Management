'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Checkbox, Divider, Drawer, IconButton, Menu, MenuItem, Select, TextField, Typography } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { alpha, useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import type {
  CircleSubTab,
  LifecycleBirth,
  LifecycleDeath,
  SpeciesBirths,
  SpeciesDeaths,
  SpeciesLifecycle
} from 'src/types/species-management/detail'
import {
  EmptyState,
  EntityListDrawer,
  SectionCard
} from 'src/views/pages/species-management/detail/detailUi'
import { ColumnBarChart, SmoothAreaChart } from 'src/views/pages/species-management/dashboard/dashboardUi'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { EMPTY_ANALYSIS, type AnalysisFilter } from 'src/views/pages/species-management/speciesListing.utils'


// Shared height for the period controls (toggle / dropdowns / gender filter) so they all align.
export const CTRL_H = 48
// Shared height for the table-card header controls (view toggle + search) so they line up.
const TABLE_CTRL_H = 44

// Gender breakdown as a pie (used by both Births and Deaths).
const GenderPie: React.FC<{ male: number; female: number; other: number; otherLabel?: string; title: string }> = ({
  male,
  female,
  other,
  otherLabel = 'Unsexed',
  title
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const raw = [
    { label: 'Male', value: male, color: theme.palette.secondary.main },
    { label: 'Female', value: female, color: cc.Tertiary },
    { label: otherLabel, value: other, color: cc.Outline }
  ].filter(d => d.value > 0)
  const total = male + female + other

  if (!total) {
    return (
      <SectionCard title={title}>
        <EmptyState message='No gender data for this period' />
      </SectionCard>
    )
  }

  const options = {
    chart: { toolbar: { show: false } },
    labels: raw.map(d => d.label),
    colors: raw.map(d => d.color),
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    legend: { position: 'bottom' as const, labels: { colors: cc.OnSurfaceVariant } },
    dataLabels: { enabled: true, formatter: (v: number) => `${Math.round(v)}%` },
    tooltip: { y: { formatter: (v: number) => v.toLocaleString() } }
  }

  return (
    <SectionCard title={title}>
      <ReactApexcharts type='pie' height={260} options={options} series={raw.map(d => d.value)} />
    </SectionCard>
  )
}

// Gender filter dropdown — mirrors the species-list Gender facet (Male / Female / Unsexed; all = cleared).
const GENDER_OPTS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unsexed', label: 'Unsexed' }
]
export const GenderFilter: React.FC<{ selected: string[]; onChange: (s: string[]) => void }> = ({ selected, onChange }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const toggle = (k: string) => {
    const next = selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k]
    onChange(next.length >= GENDER_OPTS.length ? [] : next)
  }
  const labelText = !selected.length
    ? 'Gender'
    : `Gender-${GENDER_OPTS.filter(o => selected.includes(o.key)).map(o => o.label.charAt(0)).join(' & ')}`

  return (
    <>
      <Button
        variant='outlined'
        onClick={e => setAnchor(e.currentTarget)}
        endIcon={<Icon icon='mdi:chevron-down' />}
        sx={{
          height: CTRL_H,
          textTransform: 'none',
          fontWeight: 500,
          color: cc.OnSurfaceVariant,
          bgcolor: theme.palette.background.paper,
          borderColor: selected.length ? cc.OnSurfaceVariant : cc.OutlineVariant,
          '&:hover': { borderColor: cc.Outline, bgcolor: theme.palette.background.paper }
        }}
      >
        {labelText}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { mt: 1, minWidth: 180, borderRadius: '10px' } } }}>
        {GENDER_OPTS.map(o => (
          <MenuItem key={o.key} onClick={() => toggle(o.key)} sx={{ gap: 1 }}>
            <Checkbox checked={selected.includes(o.key)} size='small' sx={{ p: 0.5 }} />
            <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
              {o.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// "Other Filters" drawer — Site / Enclosure / (Cause or Breed) facets built from the events.
export interface FacetDef {
  key: string
  label: string
  options: { value: string; count: number }[]
}
export const MoreFiltersDrawer: React.FC<{
  open: boolean
  onClose: () => void
  facets: FacetDef[]
  selected: Record<string, string[]>
  onApply: (sel: Record<string, string[]>) => void
}> = ({ open, onClose, facets, selected, onApply }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [draft, setDraft] = useState<Record<string, string[]>>(selected)
  const [q, setQ] = useState<Record<string, string>>({})
  useEffect(() => {
    if (open) setDraft(selected)
  }, [open, selected])

  const toggle = (key: string, val: string) =>
    setDraft(d => {
      const cur = d[key] || []

      return { ...d, [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }
    })
  const count = facets.reduce((n, f) => n + (draft[f.key]?.length || 0), 0)

  return (
    <Drawer anchor='right' open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 } } } }}>
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
            Other Filters
          </Typography>
          <IconButton size='small' onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', mr: -2, pr: 2 }}>
          {facets.map(f => {
            const query = (q[f.key] || '').toLowerCase()
            const opts = query ? f.options.filter(o => o.value.toLowerCase().includes(query)) : f.options

            return (
              <Box key={f.key} sx={{ mb: 3 }}>
                <Typography variant='caption' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: cc.OnSurfaceVariant }}>
                  {f.label}
                </Typography>
                {f.options.length > 8 && (
                  <TextField
                    size='small'
                    fullWidth
                    placeholder={`Search ${f.label.toLowerCase()}…`}
                    value={q[f.key] || ''}
                    onChange={e => setQ(s => ({ ...s, [f.key]: e.target.value }))}
                    sx={{ mt: 1 }}
                    InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
                  />
                )}
                <Box sx={{ mt: 0.5, maxHeight: 220, overflowY: 'auto' }}>
                  {opts.slice(0, 100).map(o => (
                    <Box
                      key={o.value}
                      onClick={() => toggle(f.key, o.value)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, cursor: 'pointer' }}
                    >
                      <Checkbox checked={(draft[f.key] || []).includes(o.value)} size='small' sx={{ p: 0.5 }} />
                      <Typography variant='body2' sx={{ flex: 1, color: cc.OnSurfaceVariant }} noWrap>
                        {o.value}
                      </Typography>
                      <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                        {o.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <Button fullWidth variant='outlined' onClick={() => setDraft({})} sx={{ textTransform: 'none' }}>
            Clear
          </Button>
          <Button fullWidth variant='contained' onClick={() => { onApply(draft); onClose() }} sx={{ textTransform: 'none' }}>
            Apply{count ? ` (${count})` : ''}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

/** "YYYY-MM" → "Jan '46" (the prototype's month labels on the trend charts). */
const fmtYm = (k: string) => {
  const mm = /^(\d{4})-(\d{2})$/.exec(k)

  return mm ? `${MONTHS[+mm[2] - 1]} '${mm[1].slice(2)}` : k
}

// The prototype's 1Y·2Y·3Y·All underline tabs on the trend-chart header. Picking one
// drives the SHARED period filter, so the top Quick preset changes with it.
const TREND_RANGES: { key: RangePreset; label: string }[] = [
  { key: 'last_1y', label: '1Y' },
  { key: 'last_2y', label: '2Y' },
  { key: 'last_3y', label: '3Y' },
  { key: 'all', label: 'All' }
]

const TrendRangeTabs: React.FC<{ value: RangePreset; onPick: (p: RangePreset) => void; color: string }> = ({ value, onPick, color }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  return (
    <Box sx={{ display: 'flex', borderBottom: `2px solid ${cc.SurfaceVariant}` }}>
      {TREND_RANGES.map(r => {
        const active = value === r.key

        return (
          <Box
            key={r.key}
            onClick={() => onPick(r.key)}
            sx={{
              px: '14px',
              py: '4px',
              cursor: 'pointer',
              mb: '-2px',
              borderBottom: `2.5px solid ${active ? color : 'transparent'}`,
              transition: 'all .15s ease'
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 700, color: active ? color : cc.neutralSecondary }}>
              {r.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

/** Trend series for the chart: bounded year-presets get a contiguous zero-filled month
 *  window (prototype's _buildLastNMonths); everything else shows the months that have data. */
const trendMonths = (byYearMonth: { label: string; value: number }[], preset: RangePreset) => {
  const n = preset === 'last_1y' ? 12 : preset === 'last_2y' ? 24 : preset === 'last_3y' ? 36 : null
  if (!n) return byYearMonth.map(d => ({ label: fmtYm(d.label), value: d.value }))

  const map = new Map(byYearMonth.map(d => [d.label, d.value]))
  const now = new Date()
  const out: { label: string; value: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ label: fmtYm(k), value: map.get(k) || 0 })
  }

  return out
}

const BirthsView: React.FC<{ births: SpeciesBirths; rangePreset: RangePreset; onPickRange: (p: RangePreset) => void }> = ({
  births,
  rangePreset,
  onPickRange
}) => {
  const theme = useTheme() as any
  const green = theme.palette.primary.main
  const peak = (births.seasonal || []).reduce(
    (best, d) => (d.value > (best?.value ?? -1) ? d : best),
    null as null | { label: string; value: number }
  )
  const trend = useMemo(() => trendMonths(births.byYearMonth || [], rangePreset), [births.byYearMonth, rangePreset])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {trend.length > 0 && (
        <SectionCard title='Births Over Time' action={<TrendRangeTabs value={rangePreset} onPick={onPickRange} color={green} />}>
          <SmoothAreaChart values={trend.map(d => d.value)} labels={trend.map(d => d.label)} color={green} name='Births' />
        </SectionCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <GenderPie
          title='Gender'
          male={births.byGender?.male || 0}
          female={births.byGender?.female || 0}
          other={births.byGender?.undetermined || 0}
          otherLabel='Undetermined'
        />
        {births.seasonal?.length > 0 && (
          <SectionCard title='Seasonal Breeding Pattern'>
            <ColumnBarChart values={births.seasonal.map(d => d.value)} labels={births.seasonal.map(d => d.label)} color={green} name='Births' height={220} showValues hideYAxis />
            {peak && (
              <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', mt: 1 }}>
                Peak:{' '}
                <Box component='span' sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {peak.label}
                </Box>
              </Typography>
            )}
          </SectionCard>
        )}
      </Box>
    </Box>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthOf = (s?: string) => Number(String(s || '').slice(5, 7)) // "YYYY-MM..." → 1-12

type Drill = { title: string; subtitle: string; items: { id: string; name: string; sub?: string }[] }

const DeathsView: React.FC<{ deaths: SpeciesDeaths; rangePreset: RangePreset; onPickRange: (p: RangePreset) => void }> = ({
  deaths,
  rangePreset,
  onPickRange
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const recent = deaths.recent || []
  const [drill, setDrill] = useState<Drill | null>(null)
  const [showAllCauses, setShowAllCauses] = useState(false)

  // Deaths over time — same trend chart + 1Y/2Y/3Y/All control as Births (prototype parity).
  const trend = useMemo(() => trendMonths(deaths.byYearMonth || [], rangePreset), [deaths.byYearMonth, rangePreset])

  // Mortality pattern: cumulative deaths per calendar month, summed across all years (Jan = every January).
  const byMonth = useMemo(
    () =>
      MONTHS.map((label, i) => ({
        label,
        count: (deaths.byYearMonth || [])
          .filter(r => monthOf(r.label) === i + 1)
          .reduce((s, r) => s + (r.value || 0), 0)
      })),
    [deaths.byYearMonth]
  )

  // Survival Analysis — accession → death, bucketed (mirrors the prototype's 5-band chart).
  const sb = deaths.survivalBuckets
  const SURV_BANDS: { key: keyof NonNullable<typeof sb>; label: string; desc: string; opacity: number }[] = [
    { key: 'd7', label: '0–7d', desc: 'Died within first week', opacity: 1 },
    { key: 'd30', label: '8–30d', desc: 'Died within first month', opacity: 0.82 },
    { key: 'd90', label: '31–90d', desc: 'Died within 3 months', opacity: 0.64 },
    { key: 'd365', label: '91–365d', desc: 'Died within first year', opacity: 0.46 },
    { key: 'over365', label: '365+d', desc: 'Survived over a year', opacity: 0.32 }
  ]
  const survTotal = sb ? SURV_BANDS.reduce((s, b) => s + (sb[b.key] || 0), 0) : 0

  const age = deaths.ageAtDeath
  const fmtYrs = (y?: number) => (y == null ? '—' : `${(+y).toFixed(1)} yrs`)

  const causeSummary = (records: typeof recent) => {
    const m = new Map<string, number>()
    records.forEach(r => m.set(r.manner || 'Unknown', (m.get(r.manner || 'Unknown') || 0) + 1))

    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')
  }

  const openMonth = (label: string) => {
    const idx = MONTHS.indexOf(label) + 1
    const recs = recent.filter(r => monthOf(r.date) === idx)
    setDrill({
      title: `${label} — mortality`,
      subtitle: recs.length ? causeSummary(recs) : 'No itemised records for this month',
      items: recs.map((r, i) => ({
        id: `${i}`,
        name: r.enclosure || r.site || 'Unknown',
        sub: [r.date, r.manner, r.necropsy].filter(Boolean).join(' · ')
      }))
    })
  }

  const openCause = (manner: string) => {
    const recs = recent.filter(r => (r.manner || 'Unknown') === manner)
    setDrill({
      title: manner,
      subtitle: 'Deaths recorded under this cause',
      items: recs.map((r, i) => ({
        id: `${i}`,
        name: r.enclosure || r.site || 'Unknown',
        sub: [r.date, r.necropsy].filter(Boolean).join(' · ')
      }))
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {trend.length > 0 && (
        <SectionCard title='Deaths Over Time' action={<TrendRangeTabs value={rangePreset} onPick={onPickRange} color={cc.Tertiary} />}>
          <SmoothAreaChart values={trend.map(d => d.value)} labels={trend.map(d => d.label)} color={cc.Tertiary} name='Deaths' />
        </SectionCard>
      )}

      {byMonth.some(m => m.count > 0) && (
        <SectionCard title='Seasonal Mortality Pattern'>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 2 }}>
            Deaths per calendar month, summed across all years · click a month for its detail
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 200 }}>
            {(() => {
              const max = Math.max(1, ...byMonth.map(m => m.count))

              return byMonth.map(m => (
                <Box
                  key={m.label}
                  onClick={() => m.count && openMonth(m.label)}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    cursor: m.count ? 'pointer' : 'default'
                  }}
                >
                  <Typography variant='caption' sx={{ color: cc.OnSurfaceVariant, fontWeight: 700, mb: 0.5 }}>
                    {m.count || ''}
                  </Typography>
                  <Box
                    sx={{
                      width: '62%',
                      maxWidth: 30,
                      height: `${(m.count / max) * 100}%`,
                      minHeight: m.count ? 4 : 0,
                      bgcolor: cc.Tertiary,
                      borderRadius: '4px 4px 0 0',
                      transition: '0.15s',
                      '&:hover': { opacity: 0.8 }
                    }}
                  />
                  <Typography variant='caption' sx={{ color: cc.neutralSecondary, mt: 0.75 }}>
                    {m.label}
                  </Typography>
                </Box>
              ))
            })()}
          </Box>
        </SectionCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'stretch' }}>
        {sb && survTotal > 0 && (
          <SectionCard title='Survival Analysis'>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 2 }}>
              Time from accession to death
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, px: 1 }}>
              {(() => {
                const max = Math.max(1, ...SURV_BANDS.map(b => sb[b.key] || 0))

                return SURV_BANDS.map(b => {
                  const v = sb[b.key] || 0
                  const pct = survTotal ? Math.round((v / survTotal) * 1000) / 10 : 0
                  const bh = v > 0 ? Math.max(6, Math.round((v / max) * 120)) : 0

                  return (
                    <Box key={b.key} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, color: cc.Tertiary, opacity: v ? 1 : 0.4 }}>
                        {v || '–'}
                      </Typography>
                      <Typography variant='caption' sx={{ color: cc.neutralSecondary, mb: 0.5, visibility: v > 0 ? 'visible' : 'hidden' }}>
                        {pct}%
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 56,
                          height: bh,
                          bgcolor: cc.Tertiary,
                          opacity: b.opacity,
                          borderRadius: '4px 4px 0 0'
                        }}
                      />
                      <Typography variant='caption' sx={{ fontWeight: 700, color: cc.Tertiary, mt: 0.75, whiteSpace: 'nowrap' }}>
                        {b.label}
                      </Typography>
                      <Typography variant='caption' sx={{ color: cc.neutralSecondary, textAlign: 'center', lineHeight: 1.2, mt: 0.25, minHeight: 32 }}>
                        {b.desc}
                      </Typography>
                    </Box>
                  )
                })
              })()}
            </Box>
          </SectionCard>
        )}
        {(deaths as any).byGender && (
          <GenderPie
            title='Deaths by Gender'
            male={(deaths as any).byGender.male || 0}
            female={(deaths as any).byGender.female || 0}
            other={(deaths as any).byGender.unsexed || 0}
          />
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'stretch' }}>
        {age && (age.count || 0) > 0 && (
          <SectionCard title='Age at Death'>
            <Box sx={{ display: 'flex', gap: 12, rowGap: 4, flexWrap: 'wrap' }}>
              {[
                { label: 'Average', value: fmtYrs(age.avg), color: cc.OnSurfaceVariant },
                { label: 'Youngest', value: fmtYrs(age.min), color: theme.palette.secondary.main },
                { label: 'Oldest', value: fmtYrs(age.max), color: theme.palette.primary.main },
                { label: 'Records', value: `${age.count}`, color: cc.neutralSecondary }
              ].map(m => (
                <Box key={m.label}>
                  <Typography variant='h5' sx={{ fontWeight: 700, color: m.color }}>
                    {m.value}
                  </Typography>
                  <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                    {m.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </SectionCard>
        )}
        {deaths.byManner?.length > 0 &&
          (() => {
            const all = deaths.byManner.map(m => ({ label: m.manner, count: m.count })).sort((a, b) => b.count - a.count)
            const data = showAllCauses ? all : all.slice(0, 8)

            return (
              <SectionCard
                title='Cause of Death'
                action={
                  all.length > 8 ? (
                    <Typography
                      variant='caption'
                      onClick={() => setShowAllCauses(v => !v)}
                      sx={{ cursor: 'pointer', fontWeight: 600, color: theme.palette.primary.main }}
                    >
                      {showAllCauses ? 'View less' : `View more (${all.length - 8})`}
                    </Typography>
                  ) : undefined
                }
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {data.map(d => (
                    <Box
                      key={d.label}
                      onClick={() => openCause(d.label)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 4,
                        py: 1.25,
                        borderRadius: '999px',
                        border: `1px solid ${cc.SurfaceVariant}`,
                        backgroundColor: cc.Surface,
                        cursor: 'pointer',
                        transition: 'border-color .15s ease, background .15s ease',
                        '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.background.paper }
                      }}
                    >
                      <Typography variant='body2' sx={{ fontWeight: 500, color: cc.OnSurfaceVariant }}>
                        {d.label}
                      </Typography>
                      <Box component='span' sx={{ fontSize: '0.95rem', fontWeight: 700, color: cc.Tertiary, fontVariantNumeric: 'tabular-nums' }}>
                        {d.count}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </SectionCard>
            )
          })()}
      </Box>

      <EntityListDrawer
        open={!!drill}
        title={drill?.title || ''}
        subtitle={drill?.subtitle}
        items={drill?.items || []}
        onClose={() => setDrill(null)}
      />
    </Box>
  )
}

// ── Period filtering over real day-level events ────────────────────────────────
const inYear = (y: number, f: number | null, t: number | null) => (f == null || y >= f) && (t == null || y <= t)
const inMonth = (m: number, f: number | null, t: number | null) => {
  if (f == null && t == null) return true
  const lo = f ?? t!
  const hi = t ?? f!

  return lo <= hi ? m >= lo && m <= hi : m >= lo || m <= hi // wrap-around (Dec→Jan)
}

/** Build the predicate the active period (preset window OR month/year range) applies to an event date. */
export function makeMatcher(range: RangeSelection, analysis: AnalysisFilter): (d: string) => boolean {
  if (range.preset !== 'all') {
    const { from, to } = resolveRange(range, new Date())
    const fromMs = from ? from.getTime() : -Infinity
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    const toMs = end.getTime()

    return d => {
      const t = Date.parse(`${d}T00:00:00`)

      return t >= fromMs && t <= toMs
    }
  }

  return d => inYear(+d.slice(0, 4), analysis.yearFrom, analysis.yearTo) && inMonth(+d.slice(5, 7), analysis.monthFrom, analysis.monthTo)
}

const kOf = (e: { k?: number }) => e.k || 1
const g3 = (g?: string): 'male' | 'female' | 'undetermined' =>
  g === 'male' ? 'male' : g === 'female' ? 'female' : 'undetermined'

/** Reshape filtered birth events into the SpeciesBirths shape BirthsView already renders. */
function buildBirths(evs: LifecycleBirth[]): SpeciesBirths {
  const total = evs.reduce((s, e) => s + kOf(e), 0)
  const ym = new Map<string, number>()
  const seasonal = Array.from({ length: 12 }, () => 0)
  const gender = { male: 0, female: 0, undetermined: 0 }
  const sites = new Map<string, { count: number; male: number; female: number; unsexed: number }>()
  for (const e of evs) {
    const k = kOf(e)
    ym.set(e.d.slice(0, 7), (ym.get(e.d.slice(0, 7)) || 0) + k)
    seasonal[+e.d.slice(5, 7) - 1] += k
    gender[g3(e.g)] += k
    if (e.s) {
      const row = sites.get(e.s) || { count: 0, male: 0, female: 0, unsexed: 0 }
      row.count += k
      if (e.g === 'male') row.male += k
      else if (e.g === 'female') row.female += k
      else row.unsexed += k
      sites.set(e.s, row)
    }
  }
  const sexed = gender.male + gender.female

  return {
    total,
    byYearMonth: Array.from(ym.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([label, value]) => ({ label, value })),
    byGender: gender,
    seasonal: MONTHS.map((label, i) => ({ label, value: seasonal[i] })),
    bySite: Array.from(sites.entries()).sort((a, b) => b[1].count - a[1].count).map(([site, r]) => ({ site, ...r })),
    recent: evs.slice(0, 30).map(e => ({ date: e.d, site: e.s, enclosure: e.e, gender: e.g, breed: e.b })),
    sexedPct: total ? Math.round((sexed / total) * 100) : 0
  }
}

/** Reshape filtered death events into the SpeciesDeaths shape DeathsView already renders. */
function buildDeaths(evs: LifecycleDeath[]): SpeciesDeaths {
  const total = evs.reduce((s, e) => s + kOf(e), 0)
  const ym = new Map<string, number>()
  const manner = new Map<string, number>()
  const carcass: Record<string, number> = {}
  const gender = { male: 0, female: 0, unsexed: 0 }
  const sites = new Map<string, { count: number; male: number; female: number; unsexed: number }>()
  const ages: number[] = [] // age-at-death in years, one entry per animal
  const survDays: number[] = [] // survival days (accession → death), expanded by count
  const survBuckets = { d7: 0, d30: 0, d90: 0, d365: 0, over365: 0 }
  for (const e of evs) {
    const k = kOf(e)
    ym.set(e.d.slice(0, 7), (ym.get(e.d.slice(0, 7)) || 0) + k)
    if (e.m) manner.set(e.m, (manner.get(e.m) || 0) + k)
    if (e.c) carcass[e.c] = (carcass[e.c] || 0) + k
    if (e.g === 'male') gender.male += k
    else if (e.g === 'female') gender.female += k
    else gender.unsexed += k
    if (e.s) {
      const row = sites.get(e.s) || { count: 0, male: 0, female: 0, unsexed: 0 }
      row.count += k
      sites.set(e.s, row)
    }
    if (typeof e.a === 'number') ages.push(e.a)
    if (typeof e.sv === 'number') {
      const days = e.sv
      for (let i = 0; i < k; i++) survDays.push(days)
      if (days <= 7) survBuckets.d7 += k
      else if (days <= 30) survBuckets.d30 += k
      else if (days <= 90) survBuckets.d90 += k
      else if (days <= 365) survBuckets.d365 += k
      else survBuckets.over365 += k
    }
  }

  // Age-at-death summary (years) — avg/min/max/count for the 4-metric card.
  const ageAtDeath = ages.length
    ? {
        avg: Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10,
        min: Math.min(...ages),
        max: Math.max(...ages),
        count: ages.length
      }
    : undefined

  // Survival stats (days) — avg + median over the count-expanded list.
  const survTotal = survDays.length
  const sortedSurv = [...survDays].sort((a, b) => a - b)
  const avgSurvivalDays = survTotal ? Math.round(survDays.reduce((s, d) => s + d, 0) / survTotal) : undefined
  const medianSurvivalDays = survTotal ? sortedSurv[Math.floor(survTotal / 2)] : undefined

  return {
    total,
    byYearMonth: Array.from(ym.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([label, value]) => ({ label, value })),
    byManner: Array.from(manner.entries()).sort((a, b) => b[1] - a[1]).map(([m, count]) => ({ manner: m, count })),
    seasonal: [],
    carcassCondition: carcass,
    byGender: gender,
    ageAtDeath,
    survivalBuckets: survTotal ? survBuckets : undefined,
    avgSurvivalDays,
    medianSurvivalDays,
    bySite: Array.from(sites.entries()).sort((a, b) => b[1].count - a[1].count).map(([site, r]) => ({ site, ...r })),
    recent: evs.slice(0, 50).map(e => ({ date: e.d, site: e.s, enclosure: e.e, manner: e.m, necropsy: e.y }))
  } as SpeciesDeaths
}

// ── Lifespan view (age-at-death distribution) ──────────────────────────────────
const AGE_BUCKETS: { label: string; lo: number; hi: number }[] = [
  { label: '< 1y', lo: 0, hi: 1 },
  { label: '1–3y', lo: 1, hi: 3 },
  { label: '3–7y', lo: 3, hi: 7 },
  { label: '7–15y', lo: 7, hi: 15 },
  { label: '15–30y', lo: 15, hi: 30 },
  { label: '30–60y', lo: 30, hi: 60 },
  { label: '60y +', lo: 60, hi: Infinity }
]

const LifespanView: React.FC<{ deaths: LifecycleDeath[] }> = ({ deaths }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [drill, setDrill] = useState<{ title: string; subtitle: string; items: { id: string; name: string; sub?: string }[] } | null>(null)

  const aged = useMemo(() => deaths.filter(d => typeof d.a === 'number') as (LifecycleDeath & { a: number })[], [deaths])

  const stats = useMemo(() => {
    if (!aged.length) return null
    const adult = aged.filter(d => d.a >= 1)
    const avgAdult = adult.length ? adult.reduce((s, d) => s + d.a, 0) / adult.length : null
    const avgAll = aged.reduce((s, d) => s + d.a, 0) / aged.length
    const max = Math.max(...aged.map(d => d.a))
    const sex = { male: 0, female: 0, unsexed: 0 }
    for (const d of aged) {
      if (d.g === 'male') sex.male += 1
      else if (d.g === 'female') sex.female += 1
      else sex.unsexed += 1
    }

    return { avgAdult, avgAll, max, count: aged.length, sex }
  }, [aged])

  const buckets = useMemo(
    () => AGE_BUCKETS.map(b => ({ ...b, items: aged.filter(d => d.a >= b.lo && d.a < b.hi) })),
    [aged]
  )

  if (!stats) return <EmptyState message='No age-at-death data for this period' />
  const maxCount = Math.max(1, ...buckets.map(b => b.items.length))

  const openBucket = (label: string, items: (LifecycleDeath & { a: number })[]) =>
    setDrill({
      title: `Age at death · ${label}`,
      subtitle: `${items.length} animal${items.length === 1 ? '' : 's'}`,
      items: items
        .sort((a, b) => b.a - a.a)
        .map((d, i) => ({ id: `${i}`, name: d.e || d.s || 'Unknown', sub: [`${d.a}y`, d.d, d.m].filter(Boolean).join(' · ') }))
    })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionCard title='Age at Death Distribution'>
        <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 2 }}>
          How long animals of this species lived · click a band for the animals
        </Typography>
        {buckets.map(b => (
          <Box
            key={b.label}
            onClick={() => b.items.length && openBucket(b.label, b.items)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.85, cursor: b.items.length ? 'pointer' : 'default', '&:hover': { opacity: b.items.length ? 0.85 : 1 } }}
          >
            <Typography variant='body2' sx={{ width: 70, flexShrink: 0, color: cc.OnSurfaceVariant, fontWeight: 500 }}>
              {b.label}
            </Typography>
            <Box sx={{ flex: 1, height: 12, bgcolor: cc.Surface, borderRadius: 6, overflow: 'hidden', minWidth: 0 }}>
              <Box sx={{ width: `${(b.items.length / maxCount) * 100}%`, height: '100%', bgcolor: theme.palette.secondary.main, borderRadius: 6, transition: '0.2s' }} />
            </Box>
            <Typography variant='subtitle2' sx={{ width: 40, textAlign: 'right', fontWeight: 700, color: cc.OnSurfaceVariant }}>
              {b.items.length}
            </Typography>
          </Box>
        ))}
      </SectionCard>

      <EntityListDrawer
        open={!!drill}
        title={drill?.title || ''}
        subtitle={drill?.subtitle}
        items={drill?.items || []}
        onClose={() => setDrill(null)}
      />
    </Box>
  )
}

// ── Big sub-tab cards (Births · Deaths · Lifespan) with a live headline metric inside ──
type ViewTone = 'success' | 'error' | 'secondary'

// Slim segmented sub-tab pill (icon + label + small count). Active = the tab's accent, white text.
const ViewTab: React.FC<{
  active: boolean
  icon: string
  label: string
  value: string
  tone: ViewTone
  onClick: () => void
}> = ({ active, icon, label, value, tone, onClick }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const accent = tone === 'secondary' ? theme.palette.secondary.main : tone === 'error' ? cc.Tertiary : theme.palette.primary.main

  return (
    <Box
      onClick={onClick}
      role='tab'
      aria-selected={active}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1,
        py: 1.5,
        mb: '-1px',
        borderBottom: '2.5px solid',
        borderColor: active ? accent : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: active ? accent : cc.OutlineVariant }
      }}
    >
      <Icon icon={icon} fontSize='1.375rem' color={active ? accent : cc.Outline} />
      <Typography variant='body1' sx={{ fontWeight: 600, color: active ? accent : cc.neutralSecondary, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Typography variant='body1' sx={{ fontWeight: 700, color: active ? accent : cc.Outline, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  )
}

// Compact period-range Select (Year From–To / Month From–To), shown below the tabs.
export const RangeSelect: React.FC<{
  value: number | null
  onPick: (v: number | null) => void
  items: { value: number; label: string }[]
  anyLabel: string
}> = ({ value, onPick, items, anyLabel }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  return (
    <Select
      size='small'
      value={value == null ? '' : String(value)}
      displayEmpty
      onChange={(e: SelectChangeEvent) => onPick(e.target.value === '' ? null : Number(e.target.value))}
      renderValue={v => (v === '' ? anyLabel : items.find(i => String(i.value) === v)?.label ?? String(v))}
      sx={{
        minWidth: 84,
        bgcolor: theme.palette.background.paper,
        '& .MuiSelect-select': { py: 0.85, color: cc.OnSurfaceVariant, fontSize: '0.875rem' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: cc.OutlineVariant }
      }}
      MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320, borderRadius: '10px' } } } }}
    >
      <MenuItem value=''>{anyLabel}</MenuItem>
      {items.map(i => (
        <MenuItem key={i.value} value={String(i.value)}>
          {i.label}
        </MenuItem>
      ))}
    </Select>
  )
}

// ── Animal events datatable (sticky No + animal cell, horizontal scroll, pagination) ──
const necStatusOf = (y?: string): 'Pending' | 'Completed' | 'NA' => (y === 'Completed' ? 'Completed' : y === 'Pending' ? 'Pending' : 'NA')
const genderLabel = (g?: string) => (g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Unsexed')
const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'

// Compact animal identity cell: avatar + name + AID (no sex chip; gender lives in its own column).
const AnimalIdCell: React.FC<{ aid?: string; idv?: string; idn?: string }> = ({ aid, idv, idn }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const name = idv || idn || (aid ? `Animal ${aid}` : 'Unknown')

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Avatar src={ANTZ_LOGO} alt='' sx={{ width: 40, height: 40, bgcolor: cc.Surface, '& img': { objectFit: 'contain', padding: '5px' } }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
          {name}
        </Typography>
        {aid && (
          <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
            AID: {aid}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

const buildLifecycleColumns = (mode: CircleSubTab, theme: any, hasBreed: boolean): GridColDef[] => {
  const cc = theme.palette.customColors as Record<string, string>
  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <Typography variant='body2' sx={{ color: color || cc.OnSurfaceVariant, fontWeight: weight }}>
      {v ?? '-'}
    </Typography>
  )
  const sl: GridColDef = { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) }
  const animal: GridColDef = {
    width: 240,
    sortable: false,
    field: 'animal',
    headerName: 'Animal Name & ID',
    renderCell: p => <AnimalIdCell aid={p.row.aid} idv={p.row.idv} idn={p.row.idn} />
  }
  const gender: GridColDef = { width: 110, sortable: false, field: 'g', headerName: 'Gender', renderCell: p => txt(genderLabel(p.row.g)) }
  const site: GridColDef = { width: 200, sortable: false, field: 's', headerName: 'Site', renderCell: p => txt(p.row.s) }
  const encl: GridColDef = { width: 180, sortable: false, field: 'e', headerName: 'Enclosure', renderCell: p => txt(p.row.e) }
  const cause: GridColDef = { width: 170, sortable: false, field: 'm', headerName: 'Cause of Death', renderCell: p => txt(p.row.m, cc.Tertiary, 600) }
  const necropsy: GridColDef = {
    width: 150,
    sortable: false,
    field: 'y',
    headerName: 'Necropsy',
    renderCell: p => {
      const s = necStatusOf(p.row.y)
      const color = s === 'Completed' ? theme.palette.primary.dark : s === 'Pending' ? theme.palette.warning.main : cc.neutralSecondary

      return txt(s, color, 600)
    }
  }
  // Parent column: shows the parent's profile + name & ID when mapped, else "--" (no lineage in the data yet).
  const parent = (field: string, header: string): GridColDef => ({
    width: 200,
    sortable: false,
    field,
    headerName: header,
    renderCell: p => (p.row[field] ? <AnimalIdCell aid={p.row[field].aid} idv={p.row[field].idv} /> : txt('--', cc.neutralSecondary))
  })

  if (mode === 'births')
    return [
      sl,
      animal,
      { width: 130, sortable: false, field: 'd', headerName: 'Date of Birth', renderCell: p => txt(p.row.d) },
      gender,
      site,
      encl,
      ...(hasBreed ? [{ width: 130, sortable: false, field: 'b', headerName: 'Breed', renderCell: (p: GridRenderCellParams) => txt(p.row.b) } as GridColDef] : []),
      parent('mother', 'Mother'),
      parent('father', 'Father')
    ]

  if (mode === 'lifespan')
    return [
      sl,
      animal,
      { width: 120, sortable: false, field: 'a', headerName: 'Age at Death', renderCell: p => txt(p.row.a != null ? `${p.row.a}y` : '-', theme.palette.secondary.main, 700) },
      { width: 130, sortable: false, field: 'd', headerName: 'Date of Death', renderCell: p => txt(p.row.d) },
      gender,
      site,
      encl,
      cause,
      necropsy
    ]

  return [sl, animal, gender, site, encl, cause, necropsy]
}

// ── Site-wise rollup (one row per site) ─────────────────────────────────────────
// Aggregates the SAME (already period/gender/filter-scoped) events the animal table receives,
// so the two views always reconcile. Columns adapt per sub-tab, mirroring the animal table.
interface SiteAgg {
  site: string
  count: number // animals (births / deaths) — sum of event count k
  records: number // event rows (lifespan uses this as "Records with known age")
  enclosures: number // distinct enclosures with events at this site
  male: number
  female: number
  unsexed: number
  breeds: string[] // distinct breeds (births only)
  topCause?: string // most frequent manner of death (deaths only)
  necropsyPending: number
  necropsyDone: number
  avgAge: number | null // lifespan only — mean age at death (yrs)
  longest: number | null // lifespan only — max age at death (yrs)
}

const buildSiteRows = (events: (LifecycleBirth | LifecycleDeath)[], mode: CircleSubTab): SiteAgg[] => {
  const map = new Map<string, any>()
  for (const e of events as any[]) {
    const site = e.s || 'Unknown'
    let r = map.get(site)
    if (!r) {
      r = { site, count: 0, records: 0, encl: new Set<string>(), male: 0, female: 0, unsexed: 0, breeds: new Set<string>(), causes: new Map<string, number>(), necropsyPending: 0, necropsyDone: 0, ageSum: 0, ageN: 0, ageMax: 0 }
      map.set(site, r)
    }
    const k = e.k || 1
    r.count += k
    r.records += 1
    if (e.e) r.encl.add(e.e)
    if (e.g === 'male') r.male += k
    else if (e.g === 'female') r.female += k
    else r.unsexed += k
    if (mode === 'births' && e.b) r.breeds.add(e.b)
    if (mode === 'deaths') {
      if (e.m) r.causes.set(e.m, (r.causes.get(e.m) || 0) + k)
      if (e.y === 'Pending') r.necropsyPending += 1
      else if (e.y === 'Completed') r.necropsyDone += 1
    }
    if (mode === 'lifespan' && typeof e.a === 'number') {
      r.ageSum += e.a
      r.ageN += 1
      if (e.a > r.ageMax) r.ageMax = e.a
    }
  }
  const out: SiteAgg[] = Array.from(map.values()).map(r => ({
    site: r.site,
    count: r.count,
    records: mode === 'lifespan' ? r.ageN : r.records,
    enclosures: r.encl.size,
    male: r.male,
    female: r.female,
    unsexed: r.unsexed,
    breeds: Array.from(r.breeds) as string[],
    topCause: r.causes.size ? (Array.from(r.causes.entries()) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] : undefined,
    necropsyPending: r.necropsyPending,
    necropsyDone: r.necropsyDone,
    avgAge: r.ageN ? r.ageSum / r.ageN : null,
    longest: r.ageN ? r.ageMax : null
  }))
  const key = (x: SiteAgg) => (mode === 'lifespan' ? x.records : x.count)

  return out.sort((a, b) => key(b) - key(a))
}

// Sticky site identity cell — mirrors AnimalIdCell's avatar + label layout.
const SiteIdCell: React.FC<{ site: string }> = ({ site }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Avatar sx={{ width: 40, height: 40, bgcolor: cc.Surface, color: cc.Outline }}>
        <Icon icon='mdi:map-marker-outline' fontSize='1.3rem' />
      </Avatar>
      <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
        {site}
      </Typography>
    </Box>
  )
}

const buildSiteColumns = (mode: CircleSubTab, theme: any, hasBreed: boolean): GridColDef[] => {
  const cc = theme.palette.customColors as Record<string, string>
  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <Typography variant='body2' sx={{ color: color || cc.OnSurfaceVariant, fontWeight: weight }}>
      {v ?? '-'}
    </Typography>
  )
  const sl: GridColDef = { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) }
  const site: GridColDef = { width: 360, sortable: false, field: 'site', headerName: 'Site', renderCell: p => <SiteIdCell site={p.row.site} /> }
  const enclosures: GridColDef = { width: 120, sortable: false, field: 'enclosures', headerName: 'Enclosures', renderCell: p => txt(Number(p.row.enclosures || 0).toLocaleString(), undefined, 600) }
  const num = (field: string, header: string, color: string): GridColDef => ({
    width: 100,
    sortable: false,
    field,
    headerName: header,
    renderCell: p => txt(Number(p.row[field] || 0).toLocaleString(), color, 600)
  })
  // Male / Female / Unsexed — same colour language as the sex tiles (teal · orange · grey).
  const sexes: GridColDef[] = [
    { width: 90, sortable: false, field: 'male', headerName: 'Male', renderCell: p => txt(Number(p.row.male || 0).toLocaleString(), theme.palette.secondary.main, 600) },
    { width: 90, sortable: false, field: 'female', headerName: 'Female', renderCell: p => txt(Number(p.row.female || 0).toLocaleString(), cc.Tertiary, 600) },
    { width: 100, sortable: false, field: 'unsexed', headerName: 'Unsexed', renderCell: p => txt(Number(p.row.unsexed || 0).toLocaleString(), cc.neutralSecondary, 600) }
  ]
  const years = (field: string, header: string, color: string): GridColDef => ({
    width: 110,
    sortable: false,
    field,
    headerName: header,
    renderCell: p => txt(p.row[field] != null ? `${(p.row[field] as number).toFixed(1)}y` : '-', p.row[field] != null ? color : cc.neutralSecondary, 700)
  })

  if (mode === 'births')
    return [
      sl,
      site,
      num('count', 'Births', theme.palette.primary.dark),
      enclosures,
      ...sexes,
      ...(hasBreed
        ? [{ width: 180, sortable: false, field: 'breeds', headerName: 'Breeds', renderCell: (p: GridRenderCellParams) => txt((p.row.breeds as string[])?.join(', ') || '-') } as GridColDef]
        : [])
    ]

  if (mode === 'lifespan')
    return [sl, site, num('records', 'Records', cc.OnSurfaceVariant), years('avgAge', 'Avg age', theme.palette.secondary.main), years('longest', 'Longest', theme.palette.primary.dark), ...sexes]

  // deaths
  const topCause: GridColDef = { width: 180, sortable: false, field: 'topCause', headerName: 'Top cause', renderCell: p => txt(p.row.topCause || '-', p.row.topCause ? cc.Tertiary : cc.neutralSecondary, 600) }
  const necropsy: GridColDef = {
    width: 150,
    sortable: false,
    field: 'necropsy',
    headerName: 'Necropsy',
    renderCell: p => {
      const done = Number(p.row.necropsyDone || 0)
      const pending = Number(p.row.necropsyPending || 0)
      if (!done && !pending) return txt('-', cc.neutralSecondary)

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {done > 0 && (
            <Typography variant='caption' sx={{ color: theme.palette.primary.dark, fontWeight: 600 }}>
              {done} completed
            </Typography>
          )}
          {pending > 0 && (
            <Typography variant='caption' sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
              {pending} pending
            </Typography>
          )}
        </Box>
      )
    }
  }

  return [sl, site, num('count', 'Deaths', cc.Tertiary), enclosures, ...sexes, topCause, necropsy]
}

// Animal-wise / Site-wise segmented toggle — lives in the table card header.
const TABLE_VIEWS: { key: 'animal' | 'site'; label: string; icon: string }[] = [
  { key: 'animal', label: 'Animal-wise', icon: 'mdi:paw' },
  { key: 'site', label: 'Site-wise', icon: 'mdi:map-marker-outline' }
]
const ViewToggle: React.FC<{ value: 'animal' | 'site'; onChange: (v: 'animal' | 'site') => void }> = ({ value, onChange }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'stretch', height: TABLE_CTRL_H, p: 0.75, borderRadius: '999px', border: `1px solid ${cc.OutlineVariant}`, bgcolor: theme.palette.background.paper }}>
      {TABLE_VIEWS.map(v => {
        const on = value === v.key

        return (
          <Box
            key={v.key}
            onClick={() => onChange(v.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 4,
              borderRadius: '999px',
              cursor: 'pointer',
              bgcolor: on ? theme.palette.primary.main : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon icon={v.icon} fontSize='1.15rem' color={on ? theme.palette.common.white : cc.neutralSecondary} />
            <Typography variant='body2' sx={{ fontWeight: 600, color: on ? theme.palette.common.white : cc.neutralSecondary, whiteSpace: 'nowrap' }}>
              {v.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

const eventHaystack = (e: any) =>
  [e.idv, e.idn, e.aid, e.s, e.e, e.m, e.y, e.b, e.d, e.a].filter(v => v != null).join(' ').toLowerCase()

const AnimalEventsTable: React.FC<{
  events: (LifecycleBirth | LifecycleDeath)[]
  mode: CircleSubTab
  viewMode: 'animal' | 'site'
  onViewModeChange: (v: 'animal' | 'site') => void
  onDrillSite: (site: string) => void
}> = ({ events, mode, viewMode, onViewModeChange, onDrillSite }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const isSite = viewMode === 'site'

  const hasBreed = mode === 'births' && events.some(e => (e as LifecycleBirth).b)
  const siteRows = useMemo(() => buildSiteRows(events, mode), [events, mode])

  const filtered = useMemo(() => {
    if (isSite) return query ? siteRows.filter(r => r.site.toLowerCase().includes(query)) : siteRows

    return query ? events.filter(e => eventHaystack(e).includes(query)) : events
  }, [isSite, siteRows, events, query])

  useEffect(() => { setPm(p => ({ ...p, page: 0 })) }, [events, query, viewMode])
  const columns = useMemo(
    () => (isSite ? buildSiteColumns(mode, theme, hasBreed) : buildLifecycleColumns(mode, theme, hasBreed)),
    [isSite, mode, theme, hasBreed]
  )
  const start = pm.page * pm.pageSize
  const rows = (filtered as any[]).slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i, sl_no: start + i + 1 }))

  const stickyField = isSite ? 'site' : 'animal'
  const title = `${isSite ? 'Sites' : 'Animals'} · ${filtered.length.toLocaleString()}`
  const headerAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
      <TextField
        size='small'
        placeholder={isSite ? 'Search sites…' : 'Search animals…'}
        value={q}
        onChange={e => setQ(e.target.value)}
        sx={{ width: 240, '& .MuiInputBase-root': { height: TABLE_CTRL_H, bgcolor: theme.palette.background.paper } }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
      />
    </Box>
  )

  if (!events.length) {
    return (
      <SectionCard title={`${isSite ? 'Sites' : 'Animals'} · 0`} action={<ViewToggle value={viewMode} onChange={onViewModeChange} />}>
        <EmptyState message='No data for this selection' />
      </SectionCard>
    )
  }

  return (
    <SectionCard title={title} action={headerAction}>
      <CommonTable
        columns={columns}
        indexedRows={rows}
        total={filtered.length}
        loading={false}
        paginationModel={pm}
        setPaginationModel={setPm}
        handleSortModel={() => {}}
        searchValue=''
        getRowHeight={() => 'auto'}
        onRowClick={isSite ? (params: { row: { site: string } }) => onDrillSite(params.row.site) : () => {}}
        externalTableStyle={{
          '& .MuiDataGrid-cell': { py: 2, px: 3, display: 'flex', alignItems: 'center' },
          // Never clip a header — wrap to two lines instead.
          '& .MuiDataGrid-columnHeaderTitle': { whiteSpace: 'normal', lineHeight: 1.2, overflow: 'visible', textOverflow: 'clip' },
          '& .MuiDataGrid-columnHeaderTitleContainerContent': { overflow: 'visible' },
          ...(isSite ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {}),
          '& .MuiDataGrid-cell[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 3, backgroundColor: theme.palette.background.paper },
          '& .MuiDataGrid-columnHeader[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 5, backgroundColor: cc.customTableHeaderBg },
          [`& .MuiDataGrid-cell[data-field="${stickyField}"]`]: { position: 'sticky', left: 64, zIndex: 3, backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${cc.OutlineVariant}` },
          [`& .MuiDataGrid-columnHeader[data-field="${stickyField}"]`]: { position: 'sticky', left: 64, zIndex: 5, backgroundColor: cc.customTableHeaderBg, borderRight: `1px solid ${cc.OutlineVariant}` }
        }}
      />
    </SectionCard>
  )
}

// ── Tab shell: big Births/Deaths/Lifespan tab cards; period controls sit below ──
interface CircleOfLifeTabProps {
  births?: SpeciesBirths
  deaths?: SpeciesDeaths
  lifecycle?: SpeciesLifecycle | null
}

const CircleOfLifeTab: React.FC<CircleOfLifeTabProps> = ({ births, deaths, lifecycle }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [analysis, setAnalysis] = useState<AnalysisFilter>({ ...EMPTY_ANALYSIS, mode: 'births' })
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })
  const [periodMode, setPeriodModeState] = useState<'quick' | 'range'>('quick')
  const [genders, setGenders] = useState<string[]>([])
  const [extra, setExtra] = useState<Record<string, string[]>>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [tableView, setTableView] = useState<'animal' | 'site'>('animal')
  const sub = (analysis.mode || 'births') as CircleSubTab

  const birthEvents = lifecycle?.births || []
  const deathEvents = lifecycle?.deaths || []
  const hasEvents = birthEvents.length > 0 || deathEvents.length > 0

  // Years present in this species' events (for the Year range selects).
  const years = useMemo(() => {
    const set = new Set<number>()
    for (const e of birthEvents) set.add(+e.d.slice(0, 4))
    for (const e of deathEvents) set.add(+e.d.slice(0, 4))

    return Array.from(set).filter(Number.isFinite).sort((a, b) => b - a)
  }, [birthEvents, deathEvents])

  // "Other Filters" facet options, built from the events (Site/Enclosure shared; Cause for deaths, Breed for births).
  const tally = (arr: { [k: string]: any }[], get: (e: any) => string | undefined) => {
    const m = new Map<string, number>()
    for (const e of arr) {
      const v = get(e)
      if (v) m.set(v, (m.get(v) || 0) + 1)
    }

    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
  }
  const facets: FacetDef[] = useMemo(() => {
    const all = [...birthEvents, ...deathEvents]
    const base: FacetDef[] = [
      { key: 'Site', label: 'Site', options: tally(all, e => e.s) },
      { key: 'Enclosure', label: 'Enclosure', options: tally(all, e => e.e) }
    ]
    if (sub === 'births') base.push({ key: 'Breed', label: 'Breed', options: tally(birthEvents, e => e.b) })
    else base.push({ key: 'Manner', label: 'Cause of Death', options: tally(deathEvents, e => e.m) })

    return base.filter(f => f.options.length)
  }, [birthEvents, deathEvents, sub])
  const extraCount = Object.values(extra).reduce((n, v) => n + (v?.length || 0), 0)

  const matcher = useMemo(() => makeMatcher(range, analysis), [range, analysis])
  const genderKey = (g?: string) => (g === 'male' ? 'male' : g === 'female' ? 'female' : 'unsexed')
  const gMatch = (g?: string) => !genders.length || genders.includes(genderKey(g))
  const inExtra = (key: string, v?: string) => !(extra[key]?.length) || (v != null && extra[key].includes(v))
  const filteredBirths = useMemo(
    () => birthEvents.filter(e => matcher(e.d) && gMatch(e.g) && inExtra('Site', e.s) && inExtra('Enclosure', e.e) && inExtra('Breed', e.b)),
    [birthEvents, matcher, genders, extra]
  )
  const filteredDeaths = useMemo(
    () => deathEvents.filter(e => matcher(e.d) && gMatch(e.g) && inExtra('Site', e.s) && inExtra('Enclosure', e.e) && inExtra('Manner', e.m)),
    [deathEvents, matcher, genders, extra]
  )

  // Headline metrics shown in the tabs — recomputed from the FILTERED events so the counts track the period / gender / other filters.
  const headline = useMemo(() => {
    const totalBirths = filteredBirths.reduce((s, e) => s + (e.k || 1), 0)
    const totalDeaths = filteredDeaths.reduce((s, e) => s + (e.k || 1), 0)
    const adult = filteredDeaths.filter(e => typeof e.a === 'number' && (e.a as number) >= 1).map(e => e.a as number)
    const avgAdult = adult.length ? adult.reduce((a, b) => a + b, 0) / adult.length : null

    return { totalBirths, totalDeaths, avgAdult }
  }, [filteredBirths, filteredDeaths])

  if (!births && !deaths && !hasEvents) return <EmptyState message='No lifecycle data available' />

  // Mode (tab) and period are set independently.
  const setMode = (mode: CircleSubTab) => setAnalysis(a => ({ ...a, mode }))
  const setPeriod = (patch: Partial<AnalysisFilter>) => setAnalysis(a => ({ ...a, ...patch }))
  const onRangeChange = (sel: RangeSelection) => setRange(sel)

  // Toggle between the two period pickers — clear the other one so only one window is ever active.
  const setPeriodMode = (m: 'quick' | 'range') => {
    if (m === 'quick') setAnalysis(a => ({ ...a, yearFrom: null, yearTo: null, monthFrom: null, monthTo: null }))
    else setRange({ preset: 'all', start: null, end: null })
    setPeriodModeState(m)
  }

  const yearItems = years.map(y => ({ value: y, label: String(y) }))
  const monthItems = MONTHS.map((m, i) => ({ value: i + 1, label: m }))

  // Chart-level 1Y/2Y/3Y/All tabs drive the SAME period state as the top Quick picker:
  // force quick mode (clearing any by-month/year window) and set the preset.
  const pickTrendRange = (p: RangePreset) => {
    setAnalysis(a => ({ ...a, yearFrom: null, yearTo: null, monthFrom: null, monthTo: null }))
    setPeriodModeState('quick')
    setRange({ preset: p, start: null, end: null })
  }

  const renderView = () => {
    if (sub === 'lifespan') return <LifespanView deaths={hasEvents ? filteredDeaths : []} />
    if (sub === 'births')
      return birthEvents.length ? (
        <BirthsView births={buildBirths(filteredBirths)} rangePreset={range.preset} onPickRange={pickTrendRange} />
      ) : births ? (
        <BirthsView births={births} rangePreset={range.preset} onPickRange={pickTrendRange} />
      ) : (
        <EmptyState message='No birth data available' />
      )

    return deathEvents.length ? (
      <DeathsView deaths={buildDeaths(filteredDeaths)} rangePreset={range.preset} onPickRange={pickTrendRange} />
    ) : deaths ? (
      <DeathsView deaths={deaths} rangePreset={range.preset} onPickRange={pickTrendRange} />
    ) : (
      <EmptyState message='No death data available' />
    )
  }

  const groupLabel = (text: string) => (
    <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {text}
    </Typography>
  )
  const dash = <Typography variant='body2' sx={{ color: cc.neutralSecondary }}>–</Typography>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* PART 1 — Control band: slim sub-tab strip + period/filters bound in one card. */}
      <Box
        sx={{
          borderRadius: '10px',
          border: `1px solid ${cc.SurfaceVariant}`,
          bgcolor: theme.palette.background.paper,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {/* underline sub-tab bar — active tab gets its accent underline + coloured text/count */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: `1px solid ${cc.SurfaceVariant}` }}>
          <ViewTab active={sub === 'births'} icon='mdi:egg-outline' label='Births' value={headline.totalBirths.toLocaleString()} tone='success' onClick={() => setMode('births')} />
          <ViewTab active={sub === 'deaths'} icon='mdi:grave-stone' label='Deaths' value={headline.totalDeaths.toLocaleString()} tone='error' onClick={() => setMode('deaths')} />
          <ViewTab active={sub === 'lifespan'} icon='mdi:timer-sand' label='Lifespan' value={headline.avgAdult != null ? `${headline.avgAdult.toFixed(1)}y` : '—'} tone='secondary' onClick={() => setMode('lifespan')} />
        </Box>

        {/* Period controls. One picker at a time via the Quick / By month·year toggle. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2, md: 2.5 },
            flexWrap: 'wrap',
            '& .MuiInputBase-root': { height: CTRL_H },
            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0, fontSize: '0.875rem' },
            '& .MuiOutlinedInput-input': { py: 0, fontSize: '0.875rem' }
          }}
        >
          {groupLabel('Period')}

        {/* dark segmented toggle — selected segment green with white text; roomy padding */}
        <Box sx={{ display: 'inline-flex', height: CTRL_H, p: 1.5, borderRadius: '999px', bgcolor: cc.OnSurfaceVariant }}>
          {(['quick', 'range'] as const).map(m => {
            const on = periodMode === m

            return (
              <Box
                key={m}
                onClick={() => setPeriodMode(m)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 4,
                  borderRadius: '999px',
                  cursor: 'pointer',
                  bgcolor: on ? theme.palette.primary.main : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ fontWeight: on ? 600 : 500, color: on ? theme.palette.common.white : alpha(theme.palette.common.white, 0.7), whiteSpace: 'nowrap' }}
                >
                  {m === 'quick' ? 'Quick' : 'By month / year'}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <GenderFilter selected={genders} onChange={setGenders} />

        {periodMode === 'quick' ? (
          <DashboardDateRange value={range} onChange={onRangeChange} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {groupLabel('Years')}
              <RangeSelect value={analysis.yearFrom} onPick={v => setPeriod({ yearFrom: v })} items={yearItems} anyLabel='All' />
              {dash}
              <RangeSelect value={analysis.yearTo} onPick={v => setPeriod({ yearTo: v })} items={yearItems} anyLabel='All' />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {groupLabel('Months')}
              <RangeSelect value={analysis.monthFrom} onPick={v => setPeriod({ monthFrom: v })} items={monthItems} anyLabel='All' />
              {dash}
              <RangeSelect value={analysis.monthTo} onPick={v => setPeriod({ monthTo: v })} items={monthItems} anyLabel='All' />
            </Box>
          </>
        )}

        {/* Other Filters — pinned to the far right, white fill, matching height */}
        <FilterButtonWithNotification
          label='Other Filters'
          onClick={() => setFilterOpen(true)}
          appliedFiltersCount={extraCount || undefined}
          sx={{ ml: 'auto', height: CTRL_H, bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.background.paper } }}
        />
        </Box>
      </Box>

      {renderView()}

      {/* Animal / Site datatable — sticky first cell, paginated; columns vary by sub-tab + view */}
      <AnimalEventsTable
        mode={sub}
        events={sub === 'births' ? filteredBirths : sub === 'lifespan' ? filteredDeaths.filter(e => typeof e.a === 'number') : filteredDeaths}
        viewMode={tableView}
        onViewModeChange={setTableView}
        onDrillSite={site => {
          setExtra(e => ({ ...e, Site: [site] }))
          setTableView('animal')
        }}
      />

      <MoreFiltersDrawer open={filterOpen} onClose={() => setFilterOpen(false)} facets={facets} selected={extra} onApply={setExtra} />
    </Box>
  )
}

export default CircleOfLifeTab
