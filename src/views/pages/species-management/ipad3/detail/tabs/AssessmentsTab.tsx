'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import type { AssessmentAnimal, CatTypeItem, SpeciesAssessments } from 'src/types/species-management/detail'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { BarColumns } from 'src/views/pages/species-management/ipad3/marks'
import {
  AnimalCell,
  CategoryFilter,
  CellText,
  DetailTable,
  DrillSheet,
  EmptyState,
  EntityListDrawer,
  IntelligenceCard,
  RangeBar,
  SectionCard,
  SelectChevron,
  SheetRow,
  Sparkline,
  StatTile,
  TileGrid,
  VBarChart
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'
import { resolveRange, type RangePreset } from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'

/* ------------------------------------------------------------------ helpers */

const cc = (theme: any) => theme.palette.customColors as Record<string, string>
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-06-15" → "15-Jun-25"; passes anything else through, blank → em-dash. */
const fmtDate = (d?: string): string => {
  if (!d) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return d

  return `${m[3]}-${MONTHS[Number(m[2]) - 1] ?? m[2]}-${m[1].slice(2)}`
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Weight display: grams under 1kg, else kg (mirrors the prototype's fmtWt). */
const fmtWt = (v?: number | null): { n: string; u: string } => {
  if (v == null) return { n: '—', u: '' }

  return v < 1 ? { n: `${Math.round(v * 1000)}`, u: 'g' } : { n: v.toLocaleString(), u: 'kg' }
}

/** Chronologically-ordered value series from a {d,v} history (for sparklines). */
const series = (history?: { d: string; v: number }[]) =>
  [...(history || [])].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)).map(h => h.v)

/** Same ordering, keeping the {d,v} pairs (for the trend bar marks). */
const series2 = (history?: { d: string; v: number }[]) =>
  [...(history || [])].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))

/** Two-line axis label — "03 Jun" over "'25" (the standard month/year axis grammar). */
const axisDate = (d: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return d

  return `${m[3]} ${MONTHS[Number(m[2]) - 1] ?? m[2]}\n${m[1].slice(2)}`
}

type ChipTone = 'error' | 'warning' | 'success' | 'neutral' | 'info' | 'primary'

/** Headline stat chip (count + label) with a tone-colored left rail — the row above the charts. */
// CC pair per tone: the DOT wears the bright fill (a mark), the COUNT wears the
// tone's readable ink — never the bright as type, never a wash over the card.
const CHIP_TONES: Record<ChipTone, { dot: string; ink: string }> = {
  success: { dot: skin.TONE_FILL.good, ink: skin.TONE_TYPE.good },
  warning: { dot: skin.TONE_FILL.warn, ink: skin.TONE_TYPE.warn },
  error: { dot: skin.TONE_FILL.bad, ink: skin.TONE_TYPE.bad },
  info: { dot: '#00abab', ink: skin.strokeOf('#00abab') },
  primary: { dot: skin.ACCENT_FILL, ink: skin.ACCENT_INK },
  neutral: { dot: skin.TONE_FILL.neutral, ink: skin.VALUE }
}

const StatChip: React.FC<{ count: React.ReactNode; label: string; tone: ChipTone; onClick?: () => void }> = ({ count, label, tone, onClick }) => {
  const t = CHIP_TONES[tone]

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: '1 1 150px',
        maxWidth: 240,
        cursor: onClick ? 'pointer' : 'default',
        ...skin.cardSx,
        borderRadius: '12px',
        px: 3,
        py: 2,
        ...(onClick && { ...skin.cardPressSx, '&:hover': { backgroundColor: '#fcfcfb' } })
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', bgcolor: t.dot }} />
        <Typography sx={{ fontSize: '22px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: t.ink, lineHeight: 1.1 }}>
          {count}
        </Typography>
      </Box>
      <Typography variant='caption' sx={{ color: skin.FAINT, display: 'block', mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  )
}

/** Bucket a numeric type's animals into ~6 ranges for a distribution histogram (+ drill items). */
const bucketize = (animals: { id: string; name?: string; value: number }[], nb = 6) => {
  const vals = animals.map(a => a.value).filter(v => typeof v === 'number')
  if (!vals.length) return [] as { label: string; count: number; items: { id: string; name?: string; value: number }[] }[]
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  if (min === max) return [{ label: `${round1(min)}`, count: animals.length, items: animals }]
  const step = (max - min) / nb
  const buckets = Array.from({ length: nb }, (_, i) => ({ lo: min + i * step, hi: min + (i + 1) * step, items: [] as typeof animals }))
  animals.forEach(a => {
    const idx = Math.min(nb - 1, Math.max(0, Math.floor((a.value - min) / step)))
    buckets[idx].items.push(a)
  })

  return buckets.map(b => ({ label: `${round1(b.lo)}–${round1(b.hi)}`, count: b.items.length, items: b.items }))
}

/**
 * Weight trend % (first→recent over a dynamic lookback) + volatility % (avg |Δ| between
 * consecutive weights). Ported from the prototype's per-animal intelligence pass; needs ≥3 points.
 */
const trendVol = (history?: { d: string; v: number }[]): { trend: number | null; vol: number | null } => {
  const h = [...(history || [])].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  if (h.length < 3) return { trend: null, vol: null }

  const last = h[h.length - 1].v
  const firstD = new Date(h[0].d)
  const lastD = new Date(h[h.length - 1].d)
  const spanDays = Math.round((lastD.getTime() - firstD.getTime()) / 86400000)
  const lbDays = spanDays > 365 ? 180 : spanDays > 180 ? 90 : spanDays
  const targetD = new Date(lastD.getTime() - lbDays * 86400000)
  let best = Infinity
  let base: number | null = null
  for (let i = 0; i < h.length - 1; i++) {
    const diff = Math.abs(new Date(h[i].d).getTime() - targetD.getTime())
    if (diff < best) {
      best = diff
      base = h[i].v
    }
  }
  const trend = base && base > 0 ? round1(((last - base) / base) * 100) : null

  let sum = 0
  let n = 0
  for (let i = 1; i < h.length; i++) {
    if (h[i - 1].v > 0) {
      sum += Math.abs(((h[i].v - h[i - 1].v) / h[i - 1].v) * 100)
      n++
    }
  }

  return { trend, vol: n > 0 ? round1(sum / n) : null }
}

/* ------------------------------------------------------------------ shared cell renderers */

/** Standard detail-table text cell — matches Housing/Pairing (1rem, weight 500). */
const useCell = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  /** Animal identity cell — delegates to the shared AnimalCell (single copy in detailUi). */
  const animalCell = (name?: string, site?: string) => <AnimalCell name={name} sub={site} />

  /** Signed % with direction arrow, tinted green up / orange down / neutral flat. */
  const trendCell = (pct: number | null) => {
    if (pct == null) return txt('—', skin.DASH_INK)
    const up = pct >= 0
    const color = pct > 1 ? skin.TONE_TYPE.good : pct < -1 ? skin.CORAL : skin.FAINT

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Icon icon={up ? 'mdi:arrow-up' : 'mdi:arrow-down'} fontSize={16} color={color} />
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color }}>
          {up ? '+' : ''}
          {pct}%
        </Typography>
      </Box>
    )
  }

  /** Value pill + unit + inline line sparkline — the prototype's "Weight/BCS Trend" cell. */
  const trendSparkCell = (
    valueLabel: React.ReactNode,
    unit: string | undefined,
    spark: number[],
    tone: 'up' | 'down' | 'flat' | 'info',
    valueColor?: string
  ) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
      <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', backgroundColor: skin.ROW_LINE, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '1.0625rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: valueColor || skin.VALUE }}>{valueLabel}</Typography>
      </Box>
      {unit && (
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: skin.FAINT, flexShrink: 0 }}>
          {unit}
        </Typography>
      )}
      <Sparkline values={spark} tone={tone} />
    </Box>
  )

  return { txt, animalCell, trendCell, trendSparkCell, c, theme }
}

/* ------------------------------------------------------------- shared table controls */

// Every assessment table carries a pill search + site dropdown (stakeholder call
// 2026-08-27). The site list comes from the rows themselves, so tables whose rows carry
// no site — and single-site species — simply never show the dropdown.
function useSiteSearch<T extends { name?: string; antzId?: string; site?: string }>(rows: T[]) {
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const sites = useMemo(() => Array.from(new Set(rows.map(r => r.site).filter(Boolean))) as string[], [rows])
  const query = q.trim().toLowerCase()
  const filtered = rows.filter(
    r =>
      (!query || `${r.name || ''} ${r.antzId || ''} ${r.site || ''}`.toLowerCase().includes(query)) &&
      (!site || r.site === site)
  )

  return { q, setQ, site, setSite, sites, filtered }
}

const TableControls: React.FC<{
  ctl: { q: string; setQ: (v: string) => void; site: string | null; setSite: (v: string | null) => void; sites: string[] }
  placeholder?: string
}> = ({ ctl, placeholder = 'Search animals…' }) => (
  // Lives in the table card's header row (user call 2026-09-01) — search wears the
  // in-white-section grey per the contextual search standard.
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
    <TextField
      size='small'
      placeholder={placeholder}
      value={ctl.q}
      onChange={e => ctl.setQ(e.target.value)}
      sx={{
        flex: 1,
        minWidth: 200,
        '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px', height: 44, fontSize: '15px' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
      }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
    />
    {ctl.sites.length > 1 && (
      <CategoryFilter
        radius='999px'
        width={180}
        options={ctl.sites}
        value={ctl.site}
        onChange={v => ctl.setSite(v)}
        placeholder='All sites'
        icon='mdi:map-marker-outline'
      />
    )}
  </Box>
)

/* ------------------------------------------------------------------ Population table */

const PopulationTable: React.FC<{ animals: AssessmentAnimal[]; onAnimal: (id: string) => void }> = ({ animals, onAnimal }) => {
  const { txt, animalCell, trendCell, c } = useCell()

  const data = useMemo(
    () =>
      animals.map(a => {
        const { trend, vol } = trendVol(a.weightHistory)

        return {
          antzId: a.antzId,
          name: a.name || a.antzId,
          site: a.site,
          gender: a.gender,
          weight: a.latestWeight ?? null,
          bcs: a.latestBcs != null ? Number(a.latestBcs) : null,
          trend,
          vol,
          records: a.assessmentCount ?? 0,
          lastDate: a.latestWeightDate || a.latestBcsDate || ''
        }
      }),
    [animals]
  )

  const ctl = useSiteSearch(data)
  const tbl = useSortableTable(ctl.filtered, { field: 'weight', sort: 'desc' })
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [ctl.q, ctl.site]) // eslint-disable-line react-hooks/exhaustive-deps

  const bcsColor = (v: number) => (v >= 2.5 && v <= 3.5 ? undefined : skin.CORAL)

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    {
      field: 'name',
      headerName: 'Animal',
      flex: 1,
      minWidth: 210,
      renderCell: p => animalCell(p.row.name, p.row.site)
    },
    { field: 'weight', headerName: 'Weight', flex: 0.5, minWidth: 140, renderCell: p => txt(p.row.weight != null ? p.row.weight.toLocaleString() : '—', undefined, 600) },
    { field: 'bcs', headerName: 'BCS', flex: 0.4, minWidth: 104, renderCell: p => txt(p.row.bcs != null ? p.row.bcs : '—', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary, 600) },
    { field: 'trend', headerName: 'Overall %', flex: 0.5, minWidth: 150, renderCell: p => trendCell(p.row.trend) },
    { field: 'lastDate', headerName: 'Last Assessed', flex: 0.6, minWidth: 180, renderCell: p => <CellText noWrap color={c.neutralSecondary}>{fmtDate(p.row.lastDate)}</CellText> }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Controls live inside the table card (user call 2026-09-01). */}
      <SectionCard titleMb={4} title={<TableControls ctl={ctl} />}>
        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: { antzId: string } }) => onAnimal(p.row.antzId)}
          />
        ) : (
          <EmptyState message='No animals match your filters' />
        )}
      </SectionCard>
    </Box>
  )
}

/* ------------------------------------------------------------------ Numeric type panel */

const UNIT_ABBR: Record<string, string> = {
  centimeter: 'CM', centimeters: 'CM', centimetre: 'CM', centimetres: 'CM', cm: 'CM',
  millimeter: 'MM', millimeters: 'MM', millimetre: 'MM', millimetres: 'MM', mm: 'MM',
  meter: 'M', meters: 'M', metre: 'M', metres: 'M', kilometer: 'KM', kilometers: 'KM',
  kilogram: 'KG', kilograms: 'KG', kg: 'KG', gram: 'G', grams: 'G', percent: '%', percentage: '%'
}
/** Short uppercase unit label for compact tiles/headers (centimeter → CM). Unknown units pass through. */
const abbrevUnit = (u?: string) => (u ? UNIT_ABBR[u.trim().toLowerCase()] || u : '')

const NumericTypePanel: React.FC<{
  item: Extract<CatTypeItem, { display: 'numeric' }>
  siteById?: Map<string, string | undefined>
  onAnimal: (id: string) => void
  onBucket: (title: string, items?: any[]) => void
}> = ({ item, siteById, onAnimal, onBucket }) => {
  const { txt, animalCell, trendSparkCell, c, theme } = useCell()

  const data = useMemo(
    () =>
      (item.animals || []).map(a => {
        const spark = series(a.history)

        return {
          antzId: a.id,
          name: a.name || a.id,
          site: siteById?.get(a.id),
          value: a.value,
          spark,
          trendUp: spark.length >= 2 ? spark[spark.length - 1] >= spark[0] : null,
          dev: a.pctVsAvg,
          lastDate: a.date || ''
        }
      }),
    [item, siteById]
  )
  const ctl = useSiteSearch(data)
  const tbl = useSortableTable(ctl.filtered, { field: 'value', sort: 'desc' })
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [ctl.q, ctl.site]) // eslint-disable-line react-hooks/exhaustive-deps

  const devCell = (pct: number) => {
    const color = pct > 1 ? skin.TONE_TYPE.good : pct < -1 ? skin.CORAL : skin.FAINT

    return txt(`${pct > 0 ? '+' : ''}${round1(pct)}%`, color, 600)
  }

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'value',
      headerName: `Trend${item.uom ? ` (${abbrevUnit(item.uom)})` : ''}`,
      flex: 1.2,
      minWidth: 280,
      maxWidth: 520,
      renderCell: p =>
        p.row.spark.length >= 2
          ? trendSparkCell(p.row.value?.toLocaleString?.() ?? p.row.value, abbrevUnit(item.uom), p.row.spark, p.row.trendUp ? 'up' : 'down')
          : txt(p.row.value?.toLocaleString?.() ?? p.row.value, undefined, 600)
    },
    { field: 'dev', headerName: 'vs Avg', flex: 0.5, minWidth: 130, renderCell: p => devCell(p.row.dev ?? 0) },
    { field: 'lastDate', headerName: 'Last Assessed', flex: 0.6, minWidth: 180, renderCell: p => <CellText noWrap color={c.neutralSecondary}>{fmtDate(p.row.lastDate)}</CellText> }
  ]

  const above = data.filter(d => d.value > item.avg)
  const below = data.filter(d => d.value < item.avg)
  const rankedN = [...data].filter(d => typeof d.value === 'number').sort((x, y) => y.value - x.value)
  const hiN = rankedN[0]
  const loN = rankedN[rankedN.length - 1]
  const buckets = bucketize((item.animals || []).map(an => ({ id: an.id, name: an.name, value: an.value })))
  const uom = item.uom ? ` ${abbrevUnit(item.uom)}` : ''

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='Average' value={`${item.avg}${uom}`} tone='info' />
        <StatTile label='Median' value={item.median} tone='neutral' />
        <StatTile label='Min' value={item.min} tone='neutral' />
        <StatTile label='Max' value={item.max} tone='neutral' />
      </TileGrid>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {buckets.length > 1 ? (
          <SectionCard title='Distribution'>
            <VBarChart bars={buckets.map(b => ({ label: b.label, count: b.count, tone: 'info' }))} />
          </SectionCard>
        ) : (
          <SectionCard title='Range' titleMb={2}>
            <RangeBar min={item.min} avg={item.avg} max={item.max} />
          </SectionCard>
        )}
        {data.length > 0 && (
          <IntelligenceCard
            title={`${item.type} Intelligence`}
            segments={[
              { label: 'Above Average', value: above.length, tone: 'info' },
              { label: 'Below Average', value: below.length, tone: 'neutral' }
            ]}
            centerValue={`${item.avg}`}
            centerSub={abbrevUnit(item.uom) || 'Average'}
            insights={[
              ...(hiN ? [{ icon: 'mdi:arrow-up', tone: 'info' as const, label: 'Highest:', value: `${hiN.name}  ${hiN.value}${uom}` }] : []),
              ...(loN && loN !== hiN ? [{ icon: 'mdi:arrow-down', tone: 'neutral' as const, label: 'Lowest:', value: `${loN.name}  ${loN.value}${uom}` }] : [])
            ]}
          />
        )}
      </Box>
      {/* Controls live inside the table card (user call 2026-09-01). */}
      <SectionCard titleMb={4} title={<TableControls ctl={ctl} />}>
        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: { antzId: string } }) => onAnimal(p.row.antzId)}
          />
        ) : (
          <EmptyState message='No animals match your filters' />
        )}
      </SectionCard>
    </Box>
  )
}

/* ------------------------------------------------------------------ Weight & BCS synthetic panels */

const WeightPanel: React.FC<{ a: SpeciesAssessments; onAnimal: (id: string) => void; onBucket: (title: string, items?: any[]) => void }> = ({ a, onAnimal, onBucket }) => {
  const { txt, animalCell, trendCell, trendSparkCell, c } = useCell()
  const animals = (a.animals || []).filter(an => an.weightHistory?.length)

  const data = useMemo(
    () =>
      animals.map(an => {
        const { trend, vol } = trendVol(an.weightHistory)

        return {
          antzId: an.antzId,
          name: an.name || an.antzId,
          site: an.site,
          gender: an.gender,
          weight: an.latestWeight ?? null,
          spark: series(an.weightHistory),
          trend,
          vol,
          lastDate: an.latestWeightDate || ''
        }
      }),
    [animals]
  )
  const ctl = useSiteSearch(data)
  const tbl = useSortableTable(ctl.filtered, { field: 'weight', sort: 'desc' })
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [ctl.q, ctl.site]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'weight',
      headerName: 'Weight Trend',
      flex: 1.2,
      minWidth: 300,
      maxWidth: 520,
      renderCell: p => {
        const w = fmtWt(p.row.weight)

        return trendSparkCell(w.n, w.u, p.row.spark, p.row.trend == null ? 'flat' : p.row.trend >= 0 ? 'up' : 'down')
      }
    },
    { field: 'trend', headerName: 'Overall %', flex: 0.5, minWidth: 150, renderCell: p => trendCell(p.row.trend) },
    { field: 'lastDate', headerName: 'Last Assessed', flex: 0.6, minWidth: 180, renderCell: p => <CellText noWrap color={c.neutralSecondary}>{fmtDate(p.row.lastDate)}</CellText> }
  ]

  const gaining = data.filter(d => d.trend != null && d.trend > 1)
  const declining = data.filter(d => d.trend != null && d.trend < -1)
  const stable = data.filter(d => d.trend != null && d.trend >= -1 && d.trend <= 1)
  const ranked = data.filter(d => d.trend != null).sort((x, y) => (y.trend as number) - (x.trend as number))
  const top = ranked[0]
  const bottom = ranked[ranked.length - 1]
  const trended = gaining.length + stable.length + declining.length
  const pctGain = trended ? Math.round((gaining.length / trended) * 100) : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <StatChip count={data.length} label='Assessed' tone='neutral' />
        <StatChip count={gaining.length} label='Gaining' tone='success' />
        <StatChip count={declining.length} label='Declining' tone='error' />
        <StatChip count={stable.length} label='Stable' tone='neutral' />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {a.weightDistribution?.length ? (
          <SectionCard title='Weight Distribution'>
            <VBarChart bars={a.weightDistribution.map(b => ({ label: b.label, count: b.count, tone: 'info' }))} />
          </SectionCard>
        ) : null}
        {trended > 0 && (
          <IntelligenceCard
            title='Weight Intelligence'
            segments={[
              { label: 'Gaining', value: gaining.length, tone: 'success' },
              { label: 'Stable', value: stable.length, tone: 'neutral' },
              { label: 'Declining', value: declining.length, tone: 'error' }
            ]}
            centerValue={`${pctGain}%`}
            centerSub='Gaining'
            insights={[
              ...(top && top.trend != null ? [{ icon: 'mdi:arrow-up', tone: 'success' as const, label: 'Top Gainer:', value: `${top.name}  +${top.trend}%` }] : []),
              ...(bottom && bottom.trend != null && bottom !== top ? [{ icon: 'mdi:arrow-down', tone: 'error' as const, label: 'Top Loser:', value: `${bottom.name}  ${bottom.trend}%` }] : [])
            ]}
          />
        )}
      </Box>
      {/* Controls live inside the table card (user call 2026-09-01). */}
      <SectionCard titleMb={4} title={<TableControls ctl={ctl} />}>
        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: { antzId: string } }) => onAnimal(p.row.antzId)}
          />
        ) : (
          <EmptyState message='No animals match your filters' />
        )}
      </SectionCard>
    </Box>
  )
}

const BcsPanel: React.FC<{ a: SpeciesAssessments; onAnimal: (id: string) => void; onBucket: (title: string, items?: any[]) => void }> = ({ a, onAnimal, onBucket }) => {
  const { txt, animalCell, trendSparkCell, c, theme } = useCell()
  const animals = (a.animals || []).filter(an => an.bcsHistory?.length || an.latestBcs != null)

  const data = useMemo(
    () =>
      animals.map(an => ({
        antzId: an.antzId,
        name: an.name || an.antzId,
        site: an.site,
        gender: an.gender,
        bcs: an.latestBcs != null ? Number(an.latestBcs) : null,
        spark: series(an.bcsHistory),
        weight: an.latestWeight ?? null,
        lastDate: an.latestBcsDate || ''
      })),
    [animals]
  )
  const ctl = useSiteSearch(data)
  const tbl = useSortableTable(ctl.filtered, { field: 'bcs', sort: 'desc' })
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [ctl.q, ctl.site]) // eslint-disable-line react-hooks/exhaustive-deps
  const bcsColor = (v: number) => (v >= 2.5 && v <= 3.5 ? undefined : skin.CORAL)

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'bcs',
      headerName: 'BCS Trend',
      flex: 1.2,
      minWidth: 280,
      maxWidth: 520,
      renderCell: p =>
        p.row.spark.length >= 2
          ? trendSparkCell(p.row.bcs != null ? p.row.bcs : '—', '', p.row.spark, 'info', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary)
          : txt(p.row.bcs != null ? p.row.bcs : '—', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary, 600)
    },
    { field: 'weight', headerName: 'Weight', flex: 0.5, minWidth: 130, renderCell: p => txt(p.row.weight != null ? fmtWt(p.row.weight).n : '—', undefined, 600) },
    { field: 'lastDate', headerName: 'Last Assessed', flex: 0.6, minWidth: 180, renderCell: p => <CellText noWrap color={c.neutralSecondary}>{fmtDate(p.row.lastDate)}</CellText> }
  ]

  const withBcs = data.filter(d => d.bcs != null)
  const under = withBcs.filter(d => (d.bcs as number) < 2.5)
  const ideal = withBcs.filter(d => (d.bcs as number) >= 2.5 && (d.bcs as number) <= 3.5)
  const over = withBcs.filter(d => (d.bcs as number) > 3.5)
  const noBcs = (a.animals || []).filter(an => an.latestBcs == null && !an.bcsHistory?.length).length
  const move = data
    .filter(d => d.spark.length >= 2)
    .map(d => {
      const s = d.spark
      // positive delta = moved closer to the ideal midpoint (3.0)
      return { d, delta: Math.abs(s[s.length - 2] - 3) - Math.abs(s[s.length - 1] - 3) }
    })
  const improved = move.filter(m => m.delta > 0)
  const declined = move.filter(m => m.delta < 0)
  const mostImproved = [...improved].sort((x, y) => y.delta - x.delta)[0]
  const mostDeclined = [...declined].sort((x, y) => x.delta - y.delta)[0]
  const pctIdeal = withBcs.length ? Math.round((ideal.length / withBcs.length) * 100) : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {noBcs > 0 && <StatChip count={noBcs} label='with no BCS records' tone='error' />}
        {over.length > 0 && <StatChip count={over.length} label='overweight (BCS > 3.5)' tone='neutral' />}
        {under.length > 0 && <StatChip count={under.length} label='underweight (BCS < 2.5)' tone='error' />}
        <StatChip count={improved.length} label='improved toward ideal' tone='success' />
        <StatChip count={declined.length} label='declined from ideal' tone='warning' />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {a.bcsDistribution?.length ? (
          <SectionCard title='BCS Distribution'>
            <VBarChart
              bars={a.bcsDistribution.map(b => {
                const v = parseFloat(b.label)

                return { label: b.label, count: b.count, tone: (v < 2.5 ? 'error' : v <= 3.5 ? 'success' : 'neutral') as any }
              })}
              legend={[
                { label: 'Under (<2.5)', tone: 'error' },
                { label: 'Ideal (2.5–3.5)', tone: 'success' },
                { label: 'Over (>3.5)', tone: 'neutral' }
              ]}
            />
          </SectionCard>
        ) : null}
        {withBcs.length > 0 && (
          <IntelligenceCard
            title='BCS Intelligence'
            segments={[
              { label: 'Ideal', value: ideal.length, tone: 'success' },
              { label: 'Under', value: under.length, tone: 'error' },
              { label: 'Over', value: over.length, tone: 'neutral' }
            ]}
            centerValue={`${pctIdeal}%`}
            centerSub='Ideal'
            centerColor={pctIdeal >= 60 ? skin.TONE_TYPE.good : skin.CORAL}
            insights={[
              ...(mostImproved ? [{ icon: 'mdi:arrow-up', tone: 'success' as const, label: 'Most Improved:', value: `${mostImproved.d.name}  ${mostImproved.d.bcs ?? ''}` }] : []),
              ...(mostDeclined ? [{ icon: 'mdi:arrow-down', tone: 'error' as const, label: 'Most Declined:', value: `${mostDeclined.d.name}  ${mostDeclined.d.bcs ?? ''}` }] : [])
            ]}
          />
        )}
      </Box>
      {/* Controls live inside the table card (user call 2026-09-01). */}
      <SectionCard titleMb={4} title={<TableControls ctl={ctl} />}>
        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: { antzId: string } }) => onAnimal(p.row.antzId)}
          />
        ) : (
          <EmptyState message='No animals match your filters' />
        )}
      </SectionCard>
    </Box>
  )
}

/* ------------------------------------------------------------------ Category panel (sub-type pills → panel) */

// Synthetic sub-type keys for Physical Health's built-in weight / BCS views.
const SYN_WEIGHT = '__weight__'
const SYN_BCS = '__bcs__'

const Pills: React.FC<{ options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }> = ({ options, value, onChange }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
      {options.map(o => {
        const on = o.key === value

        return (
          <Box
            key={o.key}
            onClick={() => onChange(o.key)}
            sx={{
              flexShrink: 0,
              px: '18px',
              py: 1.25,
              borderRadius: '999px',
              cursor: 'pointer',
              border: `1px solid ${on ? skin.TAB_PILL : skin.HAIR}`,
              backgroundColor: on ? skin.TAB_PILL : '#ffffff',
              ...skin.cardPressSx,
              transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}`,
              ...(!on && { '&:hover': { backgroundColor: skin.ROW_HOVER } })
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: on ? '#ffffff' : skin.INK2, whiteSpace: 'nowrap' }}>
              {o.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

const CategoryPanel: React.FC<{
  a: SpeciesAssessments
  category: string
  onAnimal: (id: string) => void
  onBucket: (label: string, subtitle?: string, items?: any[]) => void
}> = ({ a, category, onAnimal, onBucket }) => {
  const isPhysical = /physical/i.test(category)
  const types = a.catDetail?.[category] || []

  const options = useMemo(() => {
    const opts: { key: string; label: string }[] = []
    if (isPhysical) {
      if (a.weightDistribution?.length || (a.animals || []).some(an => an.weightHistory?.length)) opts.push({ key: SYN_WEIGHT, label: 'Weight' })
      if (a.bcsDistribution?.length || (a.animals || []).some(an => an.bcsHistory?.length || an.latestBcs != null)) opts.push({ key: SYN_BCS, label: 'BCS' })
    }
    types.forEach((t, i) => opts.push({ key: `t${i}`, label: t.type }))

    return opts
  }, [a, category, isPhysical, types])

  const [sel, setSel] = useState(options[0]?.key || '')
  const current = options.find(o => o.key === sel) ? sel : options[0]?.key || ''

  if (!options.length) return <EmptyState message='No assessment types recorded for this category' />

  const bucket = (title: string, items?: any[]) => onBucket(title, items && items.length ? `${items.length} animals` : undefined, items)

  const renderPanel = () => {
    if (current === SYN_WEIGHT) return <WeightPanel a={a} onAnimal={onAnimal} onBucket={bucket} />
    if (current === SYN_BCS) return <BcsPanel a={a} onAnimal={onAnimal} onBucket={bucket} />
    const idx = Number(current.replace('t', ''))
    const item = types[idx]
    if (!item) return <EmptyState message='No data for this type' />
    if (item.display === 'numeric')
      return <NumericTypePanel item={item} siteById={new Map((a.animals || []).map(an => [an.antzId, an.site]))} onAnimal={onAnimal} onBucket={bucket} />

    // Prototype rule: any non-numeric type shows the per-animal pill-history timeline.
    return <StripTypeTable key={item.type} a={a} category={category} item={item} onAnimal={onAnimal} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {options.length > 1 && <Pills options={options} value={current} onChange={setSel} />}
      {renderPanel()}
    </Box>
  )
}

/* ------------------------------------------------------------------ Strip panel (per-animal reading timeline) */

// Categorical value → sentiment, ported from the WildVenture prototype's good/bad word lists.
const GOOD_VALS = new Set([
  'Normal', 'Good', 'Engaged', 'Social', 'Frequent', 'Adequate', 'Present', 'Appropriate', 'Suitable',
  'Content', 'Relaxed', 'Playful', 'Stable', 'Gaining', 'High', 'Quiet', 'Ideal Range', 'Good response', 'Lively', 'Sociable'
])
const BAD_VALS = new Set([
  'Reduced', 'Poor', 'No Activity', 'Absent', 'Anorexic', 'Aggressive Interactions', 'Aggression', 'Isolated',
  'Dehydrated', 'Inadequate', 'Losing', 'Pacing', 'Disturbed', 'No response', 'Poor response', 'Self-Mutilation',
  'Destructive', 'Refusing Food', 'Lethargic', 'Lethargy', 'Loss of Appetite', 'Insufficient', 'Very Loud',
  'Tense/Fearful', 'Frustrated', 'Stressed', 'Fearful', 'Wary', 'Tense', 'Uncomfortable', 'Dull', 'Abnormal', 'Apathetic', 'Depressed'
])
const valSentiment = (v: string): 'good' | 'bad' | 'neutral' => (GOOD_VALS.has(v) ? 'good' : BAD_VALS.has(v) ? 'bad' : 'neutral')

// Nutrition shows only these five user-facing types, in this order; other categories show all their types.
const NUTRITION_STRIP_TYPES = ['Water intake -Trunk count', 'Hydration Status', 'Appetite', 'Food Preferences', 'Feeding']

// Types that keep their original aggregate panel (per user) instead of the per-animal strip.
const LEGACY_PANEL_TYPES = new Set(['Water intake -Trunk count'])

interface StripReading {
  v: string
  d: string
  u?: string
}

// Entries filter for the strip tables — count-based caps + the dashboard's time presets.
type EntriesFilter = 'n10' | 'n20' | 'last_week' | 'last_30' | 'last_6m' | 'last_1y' | 'last_2y' | 'all'

const ENTRIES_FILTERS: { key: EntriesFilter; label: string }[] = [
  { key: 'n10', label: 'Last 10 entries' },
  { key: 'n20', label: 'Last 20 entries' },
  { key: 'last_week', label: 'Last week' },
  { key: 'last_30', label: 'Last 1 month' },
  { key: 'last_6m', label: 'Last 6 months' },
  { key: 'last_1y', label: 'Last 1 year' },
  { key: 'last_2y', label: 'Last 2 years' },
  { key: 'all', label: 'All entries' }
]

/** Local YYYY-MM-DD (record dates are local-day ISO strings, so compare in local time). */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Hard cap on chips rendered per strip row; anything beyond shows as "+N". */
const MAX_STRIP_READINGS = 60

/** Per-animal reading timeline table for ONE assessment type — the prototype's categorical
 * pill-history table (value chips + dates, horizontal scroll under a pinned Animal column).
 * Used by StripPanel for its categories and by CategoryPanel for every non-numeric type. */
const StripTypeTable: React.FC<{
  a: SpeciesAssessments
  category: string
  item: CatTypeItem
  onAnimal: (id: string) => void
}> = ({ a, category, item, onAnimal }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const { animalCell } = useCell()

  const [q, setQ] = useState('')
  const [siteSel, setSiteSel] = useState<string | null>(null)
  const [entries, setEntries] = useState<EntriesFilter>('n10')

  const isText = item.display === 'text'
  const isNumeric = item.display === 'numeric'

  // Per-animal readings for this type, newest first, scoped by the entries filter;
  // animals with no reading in scope are dropped.
  const allRows = useMemo(() => {
    const cap = entries === 'n10' ? 10 : entries === 'n20' ? 20 : Infinity
    const from =
      entries === 'n10' || entries === 'n20' || entries === 'all'
        ? null
        : resolveRange({ preset: entries as RangePreset, start: null, end: null }, new Date()).from
    const cutoff = from ? isoDay(from) : null

    return (a.animals || [])
      .map(an => {
        let readings = (an.records || [])
          .filter(r => r.c === category && r.t === item.type)
          .map(r => ({ v: r.v, d: r.d, u: r.u }))
          .sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0))
        if (cutoff) readings = readings.filter(r => r.d >= cutoff)
        if (readings.length > cap) readings = readings.slice(0, cap)

        return { id: an.antzId, name: an.name, site: an.site, readings, latest: readings[0]?.d || '' }
      })
      .filter(r => r.readings.length > 0)
  }, [a, category, item, entries])

  const changed = useMemo(
    () => allRows.filter(r => r.readings.length >= 2 && r.readings[0].v !== r.readings[1].v).length,
    [allRows]
  )

  const stripSites = useMemo(() => Array.from(new Set(allRows.map(r => r.site).filter(Boolean))) as string[], [allRows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return allRows.filter(
      r =>
        (!query || `${r.name || ''} ${r.site || ''}`.toLowerCase().includes(query)) && (!siteSel || r.site === siteSel)
    )
  }, [allRows, q, siteSel])

  const tbl = useSortableTable(filtered, { field: 'latest', sort: 'desc' })

  // Search / site / entries-filter changes must not strand the view on an out-of-range page.
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [q, siteSel, entries]) // eslint-disable-line react-hooks/exhaustive-deps

  // CC tone pairs: soft wash + the tone's readable ink.
  const chip = (label: string, sentiment: 'good' | 'bad' | 'neutral', text?: boolean) => {
    const bg = sentiment === 'good' ? skin.TONE_SOFT.good : sentiment === 'bad' ? skin.TONE_SOFT.bad : skin.TONE_SOFT.neutral
    const fg = sentiment === 'good' ? skin.TONE_TYPE.good : sentiment === 'bad' ? skin.TONE_TYPE.bad : skin.TONE_TYPE.neutral

    return (
      <Box sx={{ px: '11px', py: '3px', borderRadius: '999px', bgcolor: bg, maxWidth: text ? 180 : 'none' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: text ? 500 : 600, color: fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </Typography>
      </Box>
    )
  }

  const stripCell = (readings: StripReading[]) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {readings.slice(0, MAX_STRIP_READINGS).map((r, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isText ? 'flex-start' : 'center',
            px: '14px',
            borderLeft: i ? `1px solid ${skin.HAIR}` : 'none'
          }}
        >
          {chip(
            isNumeric ? `${r.v}${r.u ? ` ${abbrevUnit(r.u)}` : ''}` : r.v,
            isText || isNumeric ? 'neutral' : valSentiment(r.v),
            isText
          )}
          <Typography variant='caption' sx={{ color: skin.FAINT, mt: '4px', whiteSpace: 'nowrap' }}>
            {fmtDate(r.d)}
          </Typography>
        </Box>
      ))}
      {readings.length > MAX_STRIP_READINGS && (
        <Typography variant='caption' sx={{ color: skin.FAINT, alignSelf: 'center', pl: '10px' }}>
          +{readings.length - MAX_STRIP_READINGS}
        </Typography>
      )}
    </Box>
  )

  // Widen the strip column to fit the longest visible timeline — the flex column's minWidth
  // pushes past the container so the table scrolls horizontally under the pinned Animal column.
  const maxShown = useMemo(
    () => allRows.reduce((m, r) => Math.max(m, Math.min(r.readings.length, MAX_STRIP_READINGS)), 1),
    [allRows]
  )
  const perReadingW = isText ? 230 : 170

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Animal', width: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'latest',
      headerName: `${item.type} assessment`,
      flex: 1,
      minWidth: Math.max(440, maxShown * perReadingW),
      renderCell: p => stripCell(p.row.readings)
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {changed > 0 && (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, alignSelf: 'flex-start', px: 3, py: 1.25, borderRadius: '999px', bgcolor: skin.TONE_SOFT.warn }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.TONE_TYPE.warn }}>{changed}</Typography>
          <Typography variant='body2' sx={{ color: skin.INK2 }}>
            animal{changed === 1 ? '' : 's'} changed since previous assessment
          </Typography>
        </Box>
      )}

      <SectionCard
        title={
          <Typography variant='subtitle1' sx={{ fontWeight: 600, color: skin.INK, fontVariantNumeric: 'tabular-nums' }}>
            {tbl.total.toLocaleString()} animal{tbl.total === 1 ? '' : 's'}
          </Typography>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {stripSites.length > 1 && (
              <CategoryFilter
                radius='999px'
                width={180}
                options={stripSites}
                value={siteSel}
                onChange={v => setSiteSel(v)}
                placeholder='All sites'
                icon='mdi:map-marker-outline'
              />
            )}
            <Select
              size='small'
              value={entries}
              onChange={e => setEntries(e.target.value as EntriesFilter)}
              IconComponent={SelectChevron}
              sx={{
                minWidth: 160,
                bgcolor: '#ffffff',
                borderRadius: '999px',
                '& .MuiSelect-select': { color: skin.INK2, fontSize: '15px', fontWeight: 500 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.HAIR },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.TRACK }
              }}
            >
              {ENTRIES_FILTERS.map(f => (
                <MenuItem key={f.key} value={f.key}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
            <TextField
              size='small'
              placeholder='Search animal…'
              value={q}
              onChange={e => setQ(e.target.value)}
              sx={{
                width: 240,
                maxWidth: '100%',
                '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px', fontSize: '15px' },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
              }}
              InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
            />
          </Box>
        }
        titleMb={2}
      >
        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            rowHeight={84}
            onRowClick={p => onAnimal(p.row.id)}
            stickyField='name'
          />
        ) : (
          <EmptyState message='No matching animals' />
        )}
      </SectionCard>
    </Box>
  )
}

/** Whole-category strip view (Behaviour, Endoscopy, Environment, Nutrition, Musth Behavior):
 * type pills → per-animal strip for every type, except the legacy aggregate types. */
const StripPanel: React.FC<{
  a: SpeciesAssessments
  category: string
  onAnimal: (id: string) => void
  onBucket?: (label: string, subtitle?: string, items?: any[]) => void
}> = ({ a, category, onAnimal, onBucket }) => {
  const types = useMemo(() => {
    const all = a.catDetail?.[category] || []
    if (!/nutrition/i.test(category)) return all

    return NUTRITION_STRIP_TYPES.map(n => all.find(t => t.type === n)).filter((t): t is CatTypeItem => !!t)
  }, [a, category])

  const [selIdx, setSelIdx] = useState(0)
  const options = useMemo(() => types.map((t, i) => ({ key: `t${i}`, label: t.type })), [types])
  const idx = selIdx < types.length ? selIdx : 0
  const current = types[idx]

  if (!types.length || !current) return <EmptyState message='No assessment types recorded for this category' />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {options.length > 1 && (
        <Pills options={options} value={options[idx].key} onChange={k => setSelIdx(Number(k.replace('t', '')))} />
      )}

      {current.display === 'numeric' && LEGACY_PANEL_TYPES.has(current.type) ? (
        // Water intake keeps its original aggregate numeric panel (stats, distribution, per-animal drill).
        <NumericTypePanel
          item={current}
          siteById={new Map((a.animals || []).map(an => [an.antzId, an.site]))}
          onAnimal={onAnimal}
          onBucket={(title, items) => onBucket?.(title, items && items.length ? `${items.length} animals` : undefined, items)}
        />
      ) : (
        <StripTypeTable key={current.type} a={a} category={category} item={current} onAnimal={onAnimal} />
      )}
    </Box>
  )
}

/* ------------------------------------------------------------------ Alerts panel */

interface AlertGroup {
  id: string
  label: string
  tone: 'error' | 'warning' | 'success' | 'neutral'
  unit?: string
  items: { id: string; name?: string; sub?: string; value?: number }[]
}

const SectionLabel: React.FC<{ children: React.ReactNode; sub?: React.ReactNode }> = ({ children, sub }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
      <Typography variant='caption' sx={{ color: skin.FAINT, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
        {children}
      </Typography>
      {sub != null && (
        <>
          <Typography variant='caption' sx={{ color: skin.DASH_INK }}>·</Typography>
          <Typography variant='caption' sx={{ color: skin.FAINT }}>{sub}</Typography>
        </>
      )}
    </Box>
  )
}

const AlertsPanel: React.FC<{ a: SpeciesAssessments; onOpenGroup: (g: AlertGroup) => void; onAnimal: (id: string) => void }> = ({ a, onOpenGroup, onAnimal }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const { animalCell, txt } = useCell()
  const al = a.alerts || {}

  const groups: AlertGroup[] = useMemo(() => {
    const g: AlertGroup[] = []
    const push = (id: string, label: string, tone: AlertGroup['tone'], unit: string | undefined, arr?: any[], map?: (x: any) => AlertGroup['items'][number]) => {
      if (arr && arr.length) g.push({ id, label, tone, unit, items: arr.map(map || (x => ({ id: x.antzId, name: x.name, sub: x.site }))) })
    }
    push('neverWeighed', 'No Weight Records', 'error', undefined, al.neverWeighed)
    push('overdue', 'Overdue (>6 months)', 'warning', 'days', al.overdue, x => ({ id: x.antzId, name: x.name, sub: x.site, value: x.daysSince }))
    push('wtinc', 'Weight Increasing (>10%)', 'success', '%', al.weightIncreasing, x => ({ id: x.antzId, name: x.name, sub: x.site, value: round1(x.pctChange) }))
    push('wtdec', 'Weight Decreasing (>10%)', 'error', '%', al.weightDecreasing, x => ({ id: x.antzId, name: x.name, sub: x.site, value: round1(x.pctChange) }))
    push('undermon', 'Under-Monitored (<5 records)', 'neutral', 'records', al.underMonitored, x => ({ id: x.antzId, name: x.name, sub: x.site, value: x.weightCount }))

    // BCS out-of-range, computed from animals
    const bcsUnder = (a.animals || []).filter(an => an.latestBcs != null && Number(an.latestBcs) < 2.5)
    const bcsOver = (a.animals || []).filter(an => an.latestBcs != null && Number(an.latestBcs) > 3.5)
    if (bcsUnder.length) g.push({ id: 'bcsunder', label: 'Underweight (BCS < 2.5)', tone: 'error', unit: 'BCS', items: bcsUnder.map(an => ({ id: an.antzId, name: an.name, sub: an.site, value: Number(an.latestBcs) })) })
    if (bcsOver.length) g.push({ id: 'bcsover', label: 'Overweight (BCS > 3.5)', tone: 'neutral', unit: 'BCS', items: bcsOver.map(an => ({ id: an.antzId, name: an.name, sub: an.site, value: Number(an.latestBcs) })) })

    return g
  }, [a, al])

  // Cross-category numeric "prev → new" changes, grouped by category (matches the prototype's State Changes).
  const changesByCat = useMemo(() => {
    const out: { cat: string; items: { id: string; name?: string; metric: string; from: number; to: number; pct: number; date?: string }[] }[] = []
    for (const [cat, types] of Object.entries(a.catDetail || {})) {
      const items: { id: string; name?: string; metric: string; from: number; to: number; pct: number; date?: string }[] = []
      for (const t of types) {
        if (t.display !== 'numeric') continue
        for (const ch of t.changes || []) items.push({ id: ch.id, name: ch.name, metric: t.type, from: ch.from, to: ch.to, pct: ch.pct, date: ch.date })
      }
      if (items.length) {
        items.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct))
        out.push({ cat, items })
      }
    }

    return out
  }, [a])

  // Measurement outliers: numeric values >30% off the species average, any category.
  const outlierRows = useMemo(() => {
    const siteById = new Map((a.animals || []).map(an => [an.antzId, an.site]))
    const rows: { antzId: string; name?: string; site?: string; cat: string; metric: string; value: number; avg: number; dev: number; uom: string; absDev: number }[] = []
    for (const [cat, types] of Object.entries(a.catDetail || {})) {
      for (const t of types) {
        if (t.display !== 'numeric') continue
        for (const an of t.animals || []) {
          if (typeof an.pctVsAvg === 'number' && Math.abs(an.pctVsAvg) >= 30 && typeof an.value === 'number') {
            rows.push({ antzId: an.id, name: an.name, site: siteById.get(an.id), cat, metric: t.type, value: an.value, avg: t.avg, dev: round1(an.pctVsAvg), uom: abbrevUnit(t.uom), absDev: Math.abs(an.pctVsAvg) })
          }
        }
      }
    }

    return rows
  }, [a])

  const outlierCtl = useSiteSearch(outlierRows)

  // Sort on the real 'dev' column. A sortModel field with no matching column makes DataGrid
  // loop onSortModelChange → setState → "Maximum update depth exceeded" (the earlier crash).
  const outlierTbl = useSortableTable(outlierCtl.filtered, { field: 'dev', sort: 'desc' })
  useEffect(() => outlierTbl.setPaginationModel(p => ({ ...p, page: 0 })), [outlierCtl.q, outlierCtl.site]) // eslint-disable-line react-hooks/exhaustive-deps

  // The dot wears the tone's FILL, the count its readable INK — and warning is the
  // amber family, no longer sharing error's coral.
  const toneOf = (tone: AlertGroup['tone']) =>
    tone === 'error'
      ? { dot: skin.TONE_FILL.bad, ink: skin.TONE_TYPE.bad }
      : tone === 'warning'
        ? { dot: skin.TONE_FILL.warn, ink: skin.TONE_TYPE.warn }
        : tone === 'success'
          ? { dot: skin.TONE_FILL.good, ink: skin.TONE_TYPE.good }
          : { dot: skin.TONE_FILL.neutral, ink: skin.VALUE }

  if (!groups.length && !changesByCat.length && !outlierRows.length) return <EmptyState message='No alerts for this species' />

  const outlierCols: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name) },
    {
      field: 'metric',
      headerName: 'Metric',
      flex: 1,
      minWidth: 170,
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: skin.INK }} noWrap>
            {p.row.metric}
          </Typography>
          <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
            {p.row.cat}
          </Typography>
        </Box>
      )
    },
    { field: 'value', headerName: 'Value', width: 140, renderCell: p => txt(`${p.row.value?.toLocaleString?.() ?? p.row.value}${p.row.uom ? ` ${p.row.uom}` : ''}`, undefined, 600) },
    { field: 'avg', headerName: 'Species Avg', width: 140, renderCell: p => txt(p.row.avg?.toLocaleString?.() ?? p.row.avg, skin.FAINT) },
    {
      field: 'dev',
      headerName: 'Deviation',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => {
        const up = p.row.dev >= 0
        const col = up ? skin.TONE_TYPE.good : skin.CORAL

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25 }}>
            <Icon icon={up ? 'mdi:arrow-up' : 'mdi:arrow-down'} fontSize={16} color={col} />
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: col }}>
              {up ? '+' : ''}
              {p.row.dev}%
            </Typography>
          </Box>
        )
      }
    }
  ]

  const changeVal = (from: number, to: number, pct: number) => {
    const up = pct >= 0
    const col = up ? skin.TONE_TYPE.good : skin.CORAL

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', color: skin.FAINT, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {from} →{' '}
          <Box component='span' sx={{ color: skin.VALUE, fontWeight: 600 }}>
            {to}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: col }}>
          {up ? '+' : ''}
          {pct}%
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {/* Section 1 — Physical Health alert cards */}
      {groups.length > 0 && (
        <Box>
          <SectionLabel>Physical Health</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {groups.map(g => {
              const t = toneOf(g.tone)

              return (
                <Box
                  key={g.id}
                  onClick={() => onOpenGroup(g)}
                  sx={{
                    flex: '1 1 180px',
                    maxWidth: 260,
                    cursor: 'pointer',
                    ...skin.cardSx,
                    borderRadius: '12px',
                    p: 3,
                    ...skin.cardPressSx,
                    '&:hover': { backgroundColor: '#fcfcfb' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', bgcolor: t.dot }} />
                    <Typography sx={{ fontSize: '22px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: t.ink, lineHeight: 1.1 }}>
                      {g.items.length}
                    </Typography>
                  </Box>
                  <Typography variant='caption' sx={{ color: skin.FAINT, display: 'block', mt: 0.5 }}>
                    {g.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Section 2 — Recent changes, grouped by category */}
      {changesByCat.length > 0 && (
        <Box>
          <SectionLabel sub='Animals whose latest reading moved from the previous one'>Recent Changes</SectionLabel>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {changesByCat.map(grp => (
              <Box key={grp.cat} sx={{ ...skin.cardSx, p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1.5,
                    mb: 1,
                    borderBottom: `1px solid ${skin.HAIR}`
                  }}
                >
                  <Typography variant='subtitle1' sx={{ fontWeight: 600, color: skin.INK }}>
                    {grp.cat}
                  </Typography>
                  <Typography variant='caption' sx={{ color: skin.FAINT, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {grp.items.length} changed
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {grp.items.slice(0, 5).map((it, i) => (
                    <Box
                      key={i}
                      onClick={() => onAnimal(it.id)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        py: 1.25,
                        borderTop: i ? `1px solid ${skin.HAIR}` : 'none',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: skin.ROW_HOVER }
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: skin.INK }} noWrap>
                          {it.name || it.id}
                        </Typography>
                        <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
                          {it.metric}
                        </Typography>
                      </Box>
                      {changeVal(it.from, it.to, it.pct)}
                    </Box>
                  ))}
                </Box>
                {grp.items.length > 5 && (
                  <Typography
                    onClick={() =>
                      onOpenGroup({
                        id: `chg-${grp.cat}`,
                        label: `${grp.cat} — Recent Changes`,
                        tone: 'neutral',
                        unit: '%',
                        items: grp.items.map(it => ({ id: it.id, name: it.name, sub: `${it.metric}: ${it.from} → ${it.to}`, value: it.pct }))
                      })
                    }
                    variant='caption'
                    sx={{ color: skin.ACCENT_INK, fontWeight: 600, cursor: 'pointer', display: 'inline-block', mt: 1.5 }}
                  >
                    View all {grp.items.length} changes →
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Section 3 — Measurement outliers */}
      {outlierRows.length > 0 && (
        <Box>
          <SectionLabel sub={`Values more than 30% from the species average · ${outlierRows.length} flagged`}>Measurement Outliers</SectionLabel>
          {/* Controls live inside the table card (user call 2026-09-01). */}
          <SectionCard titleMb={4} title={<TableControls ctl={outlierCtl} />}>
            {outlierTbl.total ? (
              <DetailTable
                columns={outlierCols}
                rows={outlierTbl.rows}
                total={outlierTbl.total}
                paginationModel={outlierTbl.paginationModel}
                setPaginationModel={outlierTbl.setPaginationModel}
                sortModel={outlierTbl.sortModel}
                handleSortModel={outlierTbl.handleSortModel}
                onRowClick={(p: { row: { antzId: string } }) => onAnimal(p.row.antzId)}
              />
            ) : (
              <EmptyState message='No animals match your filters' />
            )}
          </SectionCard>
        </Box>
      )}
    </Box>
  )
}

/* ------------------------------------------------------------------ Animal drawer (by-animal drill) — reused as-is */

const AnimalDrawer: React.FC<{ animal: AssessmentAnimal | null; speciesAvgWeight?: number; speciesMinWeight?: number; onClose: () => void }> = ({
  animal,
  speciesAvgWeight,
  speciesMinWeight,
  onClose
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, { v: string; d: string }[]>>()
    for (const r of animal?.records || []) {
      if (!m.has(r.c)) m.set(r.c, new Map())
      const tm = m.get(r.c) as Map<string, { v: string; d: string }[]>
      if (!tm.has(r.t)) tm.set(r.t, [])
      tm.get(r.t)?.push({ v: r.v, d: r.d })
    }

    return m
  }, [animal])

  const wVsAvg =
    animal?.latestWeight != null && speciesAvgWeight
      ? Math.round(((animal.latestWeight - speciesAvgWeight) / speciesAvgWeight) * 1000) / 10
      : null

  return (
    <DrillSheet
      open={!!animal}
      onClose={onClose}
      size='lg'
      title={animal ? animal.name || animal.antzId : undefined}
      eyebrow={
        animal
          ? [animal.gender, animal.site, animal.enclosure, animal.ageYears != null ? `${animal.ageYears} yr` : null].filter(Boolean).join(' · ')
          : undefined
      }
    >
      {animal && (
        <>
          {/* Stat BOXES in the StatBand anatomy (user call 2026-09-01) — one white card,
              hairline-divided cells, 13px caps label over the 24px figure. The old
              tone-tile grid is retired; string values (kg, %) welcome. */}
          {(() => {
            const cells = [
              ...(animal.latestWeight != null ? [{ label: 'Latest Weight', value: `${animal.latestWeight}` }] : []),
              ...(wVsAvg != null ? [{ label: 'Vs Species Avg', value: `${wVsAvg > 0 ? '+' : ''}${wVsAvg}%` }] : []),
              ...(animal.latestBcs != null ? [{ label: 'Latest BCS', value: `${animal.latestBcs}` }] : []),
              ...(animal.weightCount != null ? [{ label: 'Weight Records', value: animal.weightCount.toLocaleString() }] : []),
              ...(animal.assessmentCount != null ? [{ label: 'Total Records', value: animal.assessmentCount.toLocaleString() }] : [])
            ]

            return cells.length ? (
              <Box
                sx={{
                  ...skin.cardSx,
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`
                }}
              >
                {cells.map((cl, i) => (
                  <Box
                    key={cl.label}
                    sx={{ px: '18px', py: '14px', display: 'flex', flexDirection: 'column', gap: '9px', borderLeft: i === 0 ? 'none' : `1px solid ${skin.HAIR}` }}
                  >
                    <Typography
                      sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: skin.FAINT }}
                      noWrap
                    >
                      {cl.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: '-0.6px',
                        fontVariantNumeric: 'tabular-nums',
                        color: skin.VALUE
                      }}
                    >
                      {cl.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null
          })()}

          {animal.weightHistory && animal.weightHistory.length > 1 && (
            <SectionCard title='Weight Trend' sx={{ mt: 3 }}>
              <BarColumns
                bars={series2(animal.weightHistory).slice(-12).map(h => [axisDate(h.d), h.v] as [string, number])}
                fill='#00abab'
                noun='kg'
                height={160}
                minSlot={64}
              />
              {speciesMinWeight != null && (
                <Typography variant='caption' sx={{ color: skin.FAINT }}>
                  Baseline = species minimum ({speciesMinWeight})
                </Typography>
              )}
            </SectionCard>
          )}

          {animal.bcsHistory && animal.bcsHistory.length > 1 && (
            <SectionCard title='BCS Trend' sx={{ mt: 3 }}>
              <BarColumns
                bars={series2(animal.bcsHistory).slice(-12).map(h => [axisDate(h.d), h.v] as [string, number])}
                noun='BCS'
                height={110}
                minSlot={64}
              />
            </SectionCard>
          )}

          {grouped.size > 0 && (
            <SectionCard title='Recent Readings' sx={{ mt: 3 }}>
              {/* Kit SheetRow cards per category (2026-09-01) — the hand-rolled
                  label/value rows were the old grammar. */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Array.from(grouped.entries()).map(([cat, typesMap], i) => {
                  const rows = Array.from(typesMap.entries())

                  return (
                    <Box key={i}>
                      <Typography
                        sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: skin.FAINT, mb: 1 }}
                      >
                        {cat}
                      </Typography>
                      {rows.map(([t, vals], j) => (
                        <SheetRow
                          key={j}
                          icon='mdi:clipboard-text-outline'
                          iconSize={32}
                          title={t}
                          caption={vals[0].v}
                          emphasizeCaption
                          when={vals[0].d}
                          subline={vals.length > 1 ? `${vals.length} readings` : undefined}
                          last={j === rows.length - 1}
                        />
                      ))}
                    </Box>
                  )
                })}
              </Box>
            </SectionCard>
          )}

          {!animal.weightHistory?.length && !animal.bcsHistory?.length && grouped.size === 0 && <EmptyState message='No assessment history for this animal' />}
        </>
      )}
    </DrillSheet>
  )
}

/* ------------------------------------------------------------------ Category tabs — underline rail */

const CategoryTabs: React.FC<{ options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }> = ({
  options,
  value,
  onChange
}) => (
  // CC SegmentToggle grammar: one sage track, the active segment a white pill wearing
  // the accent ink; counts ride as tabular figures. Scrolls, never wraps.
  <Box
    sx={{
      display: 'inline-flex',
      alignSelf: 'flex-start',
      maxWidth: '100%',
      alignItems: 'center',
      p: '3px',
      gap: '2px',
      bgcolor: skin.TOGGLE_TRACK,
      borderRadius: '999px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': { display: 'none' },
      WebkitOverflowScrolling: 'touch'
    }}
  >
    {options.map(o => {
      const on = o.value === value
      const m = o.label.match(/^(.*?)\s*\((\d[\d,]*)\)\s*$/)
      const name = m ? m[1] : o.label
      const count = m ? m[2] : null

      return (
        <Box
          key={o.value}
          onClick={() => onChange(o.value)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            px: 3.5,
            py: 1.5,
            borderRadius: '999px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            bgcolor: on ? '#ffffff' : 'transparent',
            ...skin.cardPressSx,
            transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}`
          }}
        >
          <Typography sx={{ fontSize: '15px', fontWeight: 500, color: on ? skin.TOGGLE_ON : skin.MUTED, whiteSpace: 'nowrap' }}>
            {name}
          </Typography>
          {count && (
            <Typography
              component='span'
              sx={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: on ? skin.TOGGLE_ON : skin.FAINT }}
            >
              {count}
            </Typography>
          )}
        </Box>
      )
    })}
  </Box>
)

/* ------------------------------------------------------------------ Tab root */

const POPULATION = '__population__'
const ALERTS = '__alerts__'

const AssessmentsTab: React.FC<{ assessments?: SpeciesAssessments }> = ({ assessments }) => {
  const a = assessments
  // Default landing = Physical Health (stakeholder call 2026-08-27). Population keeps its
  // first slot in the tab row; only the initial selection moves. The effect covers data
  // that arrives after mount — once seeded, a manual pick of Population sticks.
  const [sub, setSub] = useState<string>(
    () => Object.keys(a?.catDetail || {}).find(cat => /physical/i.test(cat)) || POPULATION
  )


  const [animalDrill, setAnimalDrill] = useState<AssessmentAnimal | null>(null)
  const [bucket, setBucket] = useState<{ title: string; subtitle?: string; items?: any[]; unit?: string } | null>(null)

  const animalById = useMemo(() => {
    const m = new Map<string, AssessmentAnimal>()
    for (const an of a?.animals || []) m.set(an.antzId, an)

    return m
  }, [a])

  const categories = useMemo(() => {
    if (!a) return [] as string[]
    const fromDetail = Object.keys(a.catDetail || {})
    const counts = a.summary?.categories || {}

    return fromDetail.sort((x, y) => {
      if (/physical/i.test(x)) return -1
      if (/physical/i.test(y)) return 1

      return (counts[y] || 0) - (counts[x] || 0)
    })
  }, [a])

  const physicalCat = categories.find(cat => /physical/i.test(cat))
  useEffect(() => {
    if (physicalCat) setSub(prev => (prev === POPULATION ? physicalCat : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physicalCat])

  const alertCount = useMemo(() => {
    const al = a?.alerts || {}
    const bcsOut = (a?.animals || []).filter(an => an.latestBcs != null && (Number(an.latestBcs) < 2.5 || Number(an.latestBcs) > 3.5)).length

    return (
      (al.neverWeighed?.length || 0) +
      (al.overdue?.length || 0) +
      (al.weightIncreasing?.length || 0) +
      (al.weightDecreasing?.length || 0) +
      (al.underMonitored?.length || 0) +
      bcsOut
    )
  }, [a])

  if (!a || !a.summary?.totalRecords) return <EmptyState message='No assessment data available' />

  const openAnimal = (id: string) => setAnimalDrill(animalById.get(id) || { antzId: id })

  const options = [
    { label: `Population (${a.animals?.length ?? 0})`, value: POPULATION },
    ...categories.map(c => ({ label: c, value: c })),
    ...(alertCount > 0 ? [{ label: `Alerts (${alertCount})`, value: ALERTS }] : [])
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <CategoryTabs options={options} value={sub} onChange={setSub} />

      {sub === POPULATION ? (
        <PopulationTable animals={a.animals || []} onAnimal={openAnimal} />
      ) : sub === ALERTS ? (
        <AlertsPanel a={a} onAnimal={openAnimal} onOpenGroup={g => setBucket({ title: g.label, subtitle: `${g.items.length} animals`, items: g.items, unit: g.unit })} />
      ) : /behaviou?r|endoscopy|environment|nutrition/i.test(sub) ? (
        <StripPanel a={a} category={sub} onAnimal={openAnimal} onBucket={(title, subtitle, items) => setBucket({ title, subtitle, items })} />
      ) : (
        <CategoryPanel a={a} category={sub} onAnimal={openAnimal} onBucket={(title, subtitle, items) => setBucket({ title, subtitle, items })} />
      )}

      <AnimalDrawer
        animal={animalDrill}
        speciesAvgWeight={a.summary?.avgWeight}
        speciesMinWeight={a.highlights?.lightest?.weight}
        onClose={() => setAnimalDrill(null)}
      />

      <EntityListDrawer
        open={!!bucket}
        title={bucket?.title}
        subtitle={bucket?.subtitle}
        unit={bucket?.unit}
        items={bucket?.items}
        isClickable={(id: string) => animalById.has(id)}
        onItemClick={(id: string) => {
          setBucket(null)
          openAnimal(id)
        }}
        onClose={() => setBucket(null)}
      />
    </Box>
  )
}

export default AssessmentsTab
