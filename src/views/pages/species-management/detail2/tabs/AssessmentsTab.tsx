'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, IconButton, Drawer, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import type { AssessmentAnimal, CatTypeItem, SpeciesAssessments } from 'src/types/species-management/detail'
import {
  ColumnTrend,
  DetailTable,
  EmptyState,
  EntityListDrawer,
  IntelligenceCard,
  RangeBar,
  SectionCard,
  Sparkline,
  StatTile,
  TileGrid,
  VBarChart
} from 'src/views/pages/species-management/detail2/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/detail2/useSortableTable'
import { resolveRange, type RangePreset } from 'src/views/pages/species-management/dashboard/DashboardDateRange'

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

type ChipTone = 'error' | 'warning' | 'success' | 'neutral' | 'info' | 'primary'

/** Headline stat chip (count + label) with a tone-colored left rail — the row above the charts. */
const StatChip: React.FC<{ count: React.ReactNode; label: string; tone: ChipTone; onClick?: () => void }> = ({ count, label, tone, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const col = tone === 'success' ? theme.palette.primary.main : tone === 'error' || tone === 'warning' ? c.Tertiary : tone === 'info' ? theme.palette.secondary.main : c.neutralSecondary

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: '1 1 150px',
        maxWidth: 240,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '10px',
        border: `1px solid ${c.SurfaceVariant}`,
        borderLeft: `3px solid ${col}`,
        backgroundColor: theme.palette.background.paper,
        px: 3,
        py: 2,
        transition: 'box-shadow .15s ease',
        '&:hover': onClick ? { boxShadow: 2 } : undefined
      }}
    >
      <Typography variant='h5' sx={{ color: col, lineHeight: 1.1 }}>
        {count}
      </Typography>
      <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
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
    <Typography sx={{ fontSize: '1rem', color: color || c.OnSurfaceVariant, fontWeight: weight }}>{v ?? '—'}</Typography>
  )

  /** Animal identity cell: gender glyph + name (600) over site (caption). */
  const animalCell = (name?: string, site?: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Avatar
        src='/images/branding/Antz_logomark_h_color.svg'
        sx={{ width: 36, height: 36, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {name || '—'}
        </Typography>
        {site && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }} noWrap>
            {site}
          </Typography>
        )}
      </Box>
    </Box>
  )

  /** Signed % with direction arrow, tinted green up / orange down / neutral flat. */
  const trendCell = (pct: number | null) => {
    if (pct == null) return txt('—', c.neutralSecondary)
    const up = pct >= 0
    const color = pct > 1 ? theme.palette.primary.main : pct < -1 ? c.Tertiary : c.neutralSecondary

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
      <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', backgroundColor: c.Surface, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: valueColor || c.OnSurfaceVariant }}>{valueLabel}</Typography>
      </Box>
      {unit && (
        <Typography variant='caption' sx={{ color: c.neutralSecondary, flexShrink: 0 }}>
          {unit}
        </Typography>
      )}
      <Sparkline values={spark} tone={tone} />
    </Box>
  )

  return { txt, animalCell, trendCell, trendSparkCell, c, theme }
}

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

  const tbl = useSortableTable(data, { field: 'weight', sort: 'desc' })

  const bcsColor = (v: number) => (v >= 2.5 && v <= 3.5 ? undefined : c.Tertiary)

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    {
      field: 'name',
      headerName: 'Animal',
      flex: 1,
      minWidth: 210,
      renderCell: p => animalCell(p.row.name, p.row.site)
    },
    { field: 'weight', headerName: 'Weight', width: 140, renderCell: p => txt(p.row.weight != null ? p.row.weight.toLocaleString() : '—', undefined, 600) },
    { field: 'bcs', headerName: 'BCS', width: 104, renderCell: p => txt(p.row.bcs != null ? p.row.bcs : '—', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary, 600) },
    { field: 'trend', headerName: 'Overall %', width: 160, renderCell: p => trendCell(p.row.trend) },
    { field: 'lastDate', headerName: 'Last Assessed', width: 190, align: 'right', headerAlign: 'right', renderCell: p => txt(fmtDate(p.row.lastDate), c.neutralSecondary) }
  ]

  return (
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

const NumericTypePanel: React.FC<{ item: Extract<CatTypeItem, { display: 'numeric' }>; onAnimal: (id: string) => void; onBucket: (title: string, items?: any[]) => void }> = ({ item, onAnimal, onBucket }) => {
  const { txt, animalCell, trendSparkCell, c, theme } = useCell()

  const data = useMemo(
    () =>
      (item.animals || []).map(a => {
        const spark = series(a.history)

        return {
          antzId: a.id,
          name: a.name || a.id,
          value: a.value,
          spark,
          trendUp: spark.length >= 2 ? spark[spark.length - 1] >= spark[0] : null,
          dev: a.pctVsAvg,
          lastDate: a.date || ''
        }
      }),
    [item]
  )
  const tbl = useSortableTable(data, { field: 'value', sort: 'desc' })

  const devCell = (pct: number) => {
    const color = pct > 1 ? theme.palette.primary.main : pct < -1 ? c.Tertiary : c.neutralSecondary

    return txt(`${pct > 0 ? '+' : ''}${round1(pct)}%`, color, 600)
  }

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name) },
    {
      field: 'value',
      headerName: `Trend${item.uom ? ` (${abbrevUnit(item.uom)})` : ''}`,
      flex: 2,
      minWidth: 280,
      renderCell: p =>
        p.row.spark.length >= 2
          ? trendSparkCell(p.row.value?.toLocaleString?.() ?? p.row.value, abbrevUnit(item.uom), p.row.spark, p.row.trendUp ? 'up' : 'down')
          : txt(p.row.value?.toLocaleString?.() ?? p.row.value, undefined, 600)
    },
    { field: 'dev', headerName: 'vs Avg', width: 130, renderCell: p => devCell(p.row.dev ?? 0) },
    { field: 'lastDate', headerName: 'Last Assessed', width: 190, align: 'right', headerAlign: 'right', renderCell: p => txt(fmtDate(p.row.lastDate), c.neutralSecondary) }
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
              { label: 'Above average', value: above.length, tone: 'info' },
              { label: 'Below average', value: below.length, tone: 'neutral' }
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
  const tbl = useSortableTable(data, { field: 'weight', sort: 'desc' })

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'weight',
      headerName: 'Weight Trend',
      flex: 2,
      minWidth: 300,
      renderCell: p => {
        const w = fmtWt(p.row.weight)

        return trendSparkCell(w.n, w.u, p.row.spark, p.row.trend == null ? 'flat' : p.row.trend >= 0 ? 'up' : 'down')
      }
    },
    { field: 'trend', headerName: 'Overall %', width: 162, renderCell: p => trendCell(p.row.trend) },
    { field: 'lastDate', headerName: 'Last Assessed', width: 180, align: 'right', headerAlign: 'right', renderCell: p => txt(fmtDate(p.row.lastDate), c.neutralSecondary) }
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
              ...(top && top.trend != null ? [{ icon: 'mdi:arrow-up', tone: 'success' as const, label: 'Top gainer:', value: `${top.name}  +${top.trend}%` }] : []),
              ...(bottom && bottom.trend != null && bottom !== top ? [{ icon: 'mdi:arrow-down', tone: 'error' as const, label: 'Top loser:', value: `${bottom.name}  ${bottom.trend}%` }] : [])
            ]}
          />
        )}
      </Box>
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
  const tbl = useSortableTable(data, { field: 'bcs', sort: 'desc' })
  const bcsColor = (v: number) => (v >= 2.5 && v <= 3.5 ? undefined : c.Tertiary)

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'bcs',
      headerName: 'BCS Trend',
      flex: 2,
      minWidth: 280,
      renderCell: p =>
        p.row.spark.length >= 2
          ? trendSparkCell(p.row.bcs != null ? p.row.bcs : '—', '', p.row.spark, 'info', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary)
          : txt(p.row.bcs != null ? p.row.bcs : '—', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary, 600)
    },
    { field: 'weight', headerName: 'Weight', width: 130, renderCell: p => txt(p.row.weight != null ? fmtWt(p.row.weight).n : '—', undefined, 600) },
    { field: 'lastDate', headerName: 'Last Assessed', width: 180, align: 'right', headerAlign: 'right', renderCell: p => txt(fmtDate(p.row.lastDate), c.neutralSecondary) }
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
            centerColor={pctIdeal >= 60 ? theme.palette.primary.main : c.Tertiary}
            insights={[
              ...(mostImproved ? [{ icon: 'mdi:arrow-up', tone: 'success' as const, label: 'Most improved:', value: `${mostImproved.d.name}  ${mostImproved.d.bcs ?? ''}` }] : []),
              ...(mostDeclined ? [{ icon: 'mdi:arrow-down', tone: 'error' as const, label: 'Most declined:', value: `${mostDeclined.d.name}  ${mostDeclined.d.bcs ?? ''}` }] : [])
            ]}
          />
        )}
      </Box>
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
              py: 1,
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${on ? theme.palette.primary.main : c.OutlineVariant}`,
              backgroundColor: on ? theme.palette.primary.main : theme.palette.background.paper,
              transition: 'all 0.15s ease'
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 600, color: on ? theme.palette.common.white : c.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
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
    if (item.display === 'numeric') return <NumericTypePanel item={item} onAnimal={onAnimal} onBucket={bucket} />

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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return allRows

    return allRows.filter(r => `${r.name || ''} ${r.site || ''}`.toLowerCase().includes(query))
  }, [allRows, q])

  const tbl = useSortableTable(filtered, { field: 'latest', sort: 'desc' })

  // Search or entries-filter changes must not strand the view on an out-of-range page.
  useEffect(() => tbl.setPaginationModel(p => ({ ...p, page: 0 })), [q, entries]) // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (label: string, sentiment: 'good' | 'bad' | 'neutral', text?: boolean) => {
    const bg = sentiment === 'good' ? c.OnBackground : sentiment === 'bad' ? c.BgTeritary : c.SurfaceVariant
    const fg = sentiment === 'good' ? theme.palette.primary.dark : sentiment === 'bad' ? c.Tertiary : c.OnSurfaceVariant

    return (
      <Box sx={{ px: '11px', py: '3px', borderRadius: '14px', bgcolor: bg, maxWidth: text ? 180 : 'none' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: text ? 500 : 700, color: fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            borderLeft: i ? `1px solid ${c.SurfaceVariant}` : 'none'
          }}
        >
          {chip(
            isNumeric ? `${r.v}${r.u ? ` ${abbrevUnit(r.u)}` : ''}` : r.v,
            isText || isNumeric ? 'neutral' : valSentiment(r.v),
            isText
          )}
          <Typography variant='caption' sx={{ color: c.neutralSecondary, mt: '4px', whiteSpace: 'nowrap' }}>
            {fmtDate(r.d)}
          </Typography>
        </Box>
      ))}
      {readings.length > MAX_STRIP_READINGS && (
        <Typography variant='caption' sx={{ color: c.Outline, alignSelf: 'center', pl: '10px' }}>
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
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, alignSelf: 'flex-start', px: 2, py: 1, borderRadius: '10px', bgcolor: c.BgTeritary }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: c.Tertiary }}>{changed}</Typography>
          <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }}>
            animal{changed === 1 ? '' : 's'} changed since previous assessment
          </Typography>
        </Box>
      )}

      <SectionCard
        title={
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            {tbl.total.toLocaleString()} animal{tbl.total === 1 ? '' : 's'}
          </Typography>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Select
              size='small'
              value={entries}
              onChange={e => setEntries(e.target.value as EntriesFilter)}
              sx={{ minWidth: 160, bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: c.SurfaceVariant } }}
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
              sx={{ width: 240, maxWidth: '100%', '& .MuiInputBase-root': { bgcolor: theme.palette.background.paper } }}
              InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: c.neutralSecondary }} /> }}
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
      <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
        {children}
      </Typography>
      {sub != null && (
        <>
          <Typography variant='caption' sx={{ color: c.OutlineVariant }}>·</Typography>
          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>{sub}</Typography>
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
    const rows: { antzId: string; name?: string; cat: string; metric: string; value: number; avg: number; dev: number; uom: string; absDev: number }[] = []
    for (const [cat, types] of Object.entries(a.catDetail || {})) {
      for (const t of types) {
        if (t.display !== 'numeric') continue
        for (const an of t.animals || []) {
          if (typeof an.pctVsAvg === 'number' && Math.abs(an.pctVsAvg) >= 30 && typeof an.value === 'number') {
            rows.push({ antzId: an.id, name: an.name, cat, metric: t.type, value: an.value, avg: t.avg, dev: round1(an.pctVsAvg), uom: abbrevUnit(t.uom), absDev: Math.abs(an.pctVsAvg) })
          }
        }
      }
    }

    return rows
  }, [a])

  // Sort on the real 'dev' column. A sortModel field with no matching column makes DataGrid
  // loop onSortModelChange → setState → "Maximum update depth exceeded" (the earlier crash).
  const outlierTbl = useSortableTable(outlierRows, { field: 'dev', sort: 'desc' })

  const toneColor = (tone: AlertGroup['tone']) =>
    tone === 'error' ? c.Tertiary : tone === 'warning' ? c.Tertiary : tone === 'success' ? theme.palette.primary.main : c.neutralSecondary

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
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
            {p.row.metric}
          </Typography>
          <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
            {p.row.cat}
          </Typography>
        </Box>
      )
    },
    { field: 'value', headerName: 'Value', width: 140, renderCell: p => txt(`${p.row.value?.toLocaleString?.() ?? p.row.value}${p.row.uom ? ` ${p.row.uom}` : ''}`, undefined, 600) },
    { field: 'avg', headerName: 'Species Avg', width: 140, renderCell: p => txt(p.row.avg?.toLocaleString?.() ?? p.row.avg, c.neutralSecondary) },
    {
      field: 'dev',
      headerName: 'Deviation',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => {
        const up = p.row.dev >= 0
        const col = up ? theme.palette.primary.main : c.Tertiary

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25 }}>
            <Icon icon={up ? 'mdi:arrow-up' : 'mdi:arrow-down'} fontSize={16} color={col} />
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: col }}>
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
    const col = up ? theme.palette.primary.main : c.Tertiary

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {from} →{' '}
          <Box component='span' sx={{ color: c.OnSurfaceVariant, fontWeight: 600 }}>
            {to}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: col }}>
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
              const col = toneColor(g.tone)

              return (
                <Box
                  key={g.id}
                  onClick={() => onOpenGroup(g)}
                  sx={{
                    flex: '1 1 180px',
                    maxWidth: 260,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: `1px solid ${c.SurfaceVariant}`,
                    borderLeft: `3px solid ${col}`,
                    backgroundColor: theme.palette.background.paper,
                    p: 3,
                    transition: 'box-shadow .15s ease',
                    '&:hover': { boxShadow: 2 }
                  }}
                >
                  <Typography variant='h5' sx={{ color: col }}>
                    {g.items.length}
                  </Typography>
                  <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
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
              <Box
                key={grp.cat}
                sx={{ borderRadius: '10px', border: `1px solid ${c.SurfaceVariant}`, backgroundColor: theme.palette.background.paper, p: 3 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1.5,
                    mb: 1,
                    borderBottom: `1px solid ${c.SurfaceVariant}`
                  }}
                >
                  <Typography variant='subtitle1' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                    {grp.cat}
                  </Typography>
                  <Typography variant='caption' sx={{ color: c.neutralSecondary, fontWeight: 600 }}>
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
                        borderTop: i ? `1px solid ${c.Surface}` : 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        '&:hover': { backgroundColor: c.Surface }
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                          {it.name || it.id}
                        </Typography>
                        <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
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
                    sx={{ color: theme.palette.primary.main, fontWeight: 600, cursor: 'pointer', display: 'inline-block', mt: 1.5 }}
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
    <Drawer anchor='right' open={!!animal} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 580 }, p: 4 } } }}>
      {animal && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                {animal.name || animal.antzId}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {[animal.gender, animal.site, animal.enclosure, animal.ageYears != null ? `${animal.ageYears} yr` : null].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          <TileGrid>
            {animal.latestWeight != null && (
              <StatTile label='Latest Weight' value={animal.latestWeight} sub={wVsAvg != null ? `${wVsAvg > 0 ? '+' : ''}${wVsAvg}% vs avg` : undefined} tone='info' />
            )}
            {animal.latestBcs != null && <StatTile label='Latest BCS' value={animal.latestBcs} tone='primary' />}
            {animal.weightCount != null && <StatTile label='Weight Records' value={animal.weightCount} tone='neutral' />}
            {animal.assessmentCount != null && <StatTile label='Total Records' value={animal.assessmentCount} tone='neutral' />}
          </TileGrid>

          {animal.weightHistory && animal.weightHistory.length > 1 && (
            <SectionCard title='Weight Trend' sx={{ mt: 3 }}>
              <ColumnTrend data={animal.weightHistory.map(h => ({ label: h.d, value: h.v }))} tone='info' baseline={speciesMinWeight} />
              {speciesMinWeight != null && (
                <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                  Baseline = species minimum ({speciesMinWeight})
                </Typography>
              )}
            </SectionCard>
          )}

          {animal.bcsHistory && animal.bcsHistory.length > 1 && (
            <SectionCard title='BCS Trend' sx={{ mt: 3 }}>
              <ColumnTrend data={animal.bcsHistory.map(h => ({ label: h.d, value: h.v }))} tone='primary' height={100} />
            </SectionCard>
          )}

          {grouped.size > 0 && (
            <SectionCard title='Recent Readings' sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from(grouped.entries()).map(([cat, typesMap], i) => (
                  <Box key={i}>
                    <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase' }}>
                      {cat}
                    </Typography>
                    {Array.from(typesMap.entries()).map(([t, vals], j) => (
                      <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
                        <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, flex: 1 }}>
                          {t}
                        </Typography>
                        <Box sx={{ textAlign: 'right', maxWidth: '55%' }}>
                          <Typography variant='body2' sx={{ color: c.OnSurface }} noWrap>
                            {vals[0].v}
                          </Typography>
                          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                            {vals[0].d}
                            {vals.length > 1 ? ` · ${vals.length} readings` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </SectionCard>
          )}

          {!animal.weightHistory?.length && !animal.bcsHistory?.length && grouped.size === 0 && <EmptyState message='No assessment history for this animal' />}
        </>
      )}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ Category tabs — underline rail */

const CategoryTabs: React.FC<{ options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }> = ({
  options,
  value,
  onChange
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '24px',
        borderBottom: `1px solid ${c.SurfaceVariant}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
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
              position: 'relative',
              flexShrink: 0,
              cursor: 'pointer',
              pt: '10px',
              pb: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              '&::after': on
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '-1px',
                    height: '3px',
                    borderRadius: '3px 3px 0 0',
                    backgroundColor: theme.palette.primary.main
                  }
                : undefined
            }}
          >
            <Typography
              sx={{ fontSize: '0.9375rem', fontWeight: on ? 700 : 500, color: on ? c.OnSurfaceVariant : c.neutralSecondary }}
            >
              {name}
            </Typography>
            {count && (
              <Box
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  lineHeight: 1.7,
                  px: '7px',
                  borderRadius: '999px',
                  fontVariantNumeric: 'tabular-nums',
                  backgroundColor: on ? c.OnBackground : c.Surface,
                  color: on ? theme.palette.primary.dark : c.Outline,
                  border: `1px solid ${on ? c.OnBackground : c.SurfaceVariant}`
                }}
              >
                {count}
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

/* ------------------------------------------------------------------ Tab root */

const POPULATION = '__population__'
const ALERTS = '__alerts__'

const AssessmentsTab: React.FC<{ assessments?: SpeciesAssessments }> = ({ assessments }) => {
  const a = assessments
  const [sub, setSub] = useState<string>(POPULATION)
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
