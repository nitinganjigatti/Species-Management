'use client'

import React, { useMemo, useState } from 'react'
import { Box, IconButton, Drawer, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import type { AssessmentAnimal, CatTypeItem, SpeciesAssessments } from 'src/types/species-management/detail'
import {
  ColumnTrend,
  DetailTable,
  DistributionBarChart,
  EmptyState,
  EntityListDrawer,
  IntelligenceCard,
  RangeBar,
  SectionCard,
  Sparkline,
  StatTile,
  TileGrid,
  VBarChart
} from 'src/views/pages/species-management/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/detail/useSortableTable'

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
  const animalCell = (name?: string, site?: string, gender?: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Icon
        icon={gender === 'male' ? 'mdi:gender-male' : gender === 'female' ? 'mdi:gender-female' : 'mdi:gender-male-female'}
        fontSize={18}
        color={c.Outline}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {name || '—'}
        </Typography>
        {site && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
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
      renderCell: p => animalCell(p.row.name, p.row.site, p.row.gender)
    },
    { field: 'weight', headerName: 'Weight', width: 140, renderCell: p => txt(p.row.weight != null ? p.row.weight.toLocaleString() : '—', undefined, 600) },
    { field: 'bcs', headerName: 'BCS', width: 104, renderCell: p => txt(p.row.bcs != null ? p.row.bcs : '—', p.row.bcs != null ? bcsColor(p.row.bcs) : c.neutralSecondary, 600) },
    { field: 'trend', headerName: 'Overall %', width: 160, renderCell: p => trendCell(p.row.trend) },
    {
      field: 'vol',
      headerName: 'Volatility',
      width: 156,
      renderCell: p => txt(p.row.vol != null ? `${p.row.vol}%` : '—', p.row.vol != null && p.row.vol > 10 ? c.Tertiary : c.neutralSecondary, p.row.vol != null && p.row.vol > 10 ? 600 : 500)
    },
    { field: 'records', headerName: 'Records', width: 140, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.records, c.neutralSecondary) },
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
      headerName: `Trend${item.uom ? ` (${item.uom})` : ''}`,
      flex: 2,
      minWidth: 280,
      renderCell: p =>
        p.row.spark.length >= 2
          ? trendSparkCell(p.row.value?.toLocaleString?.() ?? p.row.value, item.uom, p.row.spark, p.row.trendUp ? 'up' : 'down')
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
  const uom = item.uom ? ` ${item.uom}` : ''

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
            <VBarChart
              bars={buckets.map(b => ({ label: b.label, count: b.count, tone: 'info' }))}
              onSelect={label => {
                const b = buckets.find(x => x.label === label)
                onBucket(`${item.type} · ${label}${uom}`, (b?.items || []).map(it => ({ id: it.id, name: it.name, value: it.value })))
              }}
            />
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
            centerSub={item.uom || 'Average'}
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

/* ------------------------------------------------------------------ Distribution / text type panel */

type DistItem = Extract<CatTypeItem, { display: 'distribution' }> | Extract<CatTypeItem, { display: 'text' }>

const DistributionTypePanel: React.FC<{ item: DistItem; onAnimal: (id: string) => void; onBucket: (title: string, items?: any[]) => void }> = ({
  item,
  onAnimal,
  onBucket
}) => {
  const { txt, animalCell, c } = useCell()
  const values = item.display === 'distribution' ? item.values : item.top

  // Invert per-value animal lists → one row per animal (latest value + reading count).
  const data = useMemo(() => {
    const byAnimal = new Map<string, { name?: string; label: string; date: string; count: number }>()
    for (const v of values || []) {
      for (const an of v.animals || []) {
        const prev = byAnimal.get(an.id)
        const date = an.date || ''
        if (!prev) byAnimal.set(an.id, { name: an.name, label: v.label, date, count: 1 })
        else {
          prev.count += 1
          if (date > prev.date) {
            prev.label = v.label
            prev.date = date
          }
        }
      }
    }

    return Array.from(byAnimal.entries()).map(([id, r]) => ({ antzId: id, name: r.name || id, value: r.label, readings: r.count, lastDate: r.date }))
  }, [values])

  const tbl = useSortableTable(data, { field: 'lastDate', sort: 'desc' })

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 56, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary, 400) },
    { field: 'name', headerName: 'Animal', width: 200, renderCell: p => animalCell(p.row.name) },
    { field: 'value', headerName: 'Latest Value', flex: 1, minWidth: 220, renderCell: p => txt(p.row.value, undefined, 500) },
    { field: 'readings', headerName: 'Readings', width: 140, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.readings, c.neutralSecondary) },
    { field: 'lastDate', headerName: 'Last Assessed', width: 190, align: 'right', headerAlign: 'right', renderCell: p => txt(fmtDate(p.row.lastDate), c.neutralSecondary) }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {values?.length ? (
        <SectionCard title='Distribution'>
          <DistributionBarChart
            data={values.slice(0, 10).map(v => ({ label: v.label, count: v.count }))}
            onSelect={label => {
              const v = values.find(x => x.label === label)
              onBucket(`${item.type} · ${label}`, (v?.animals || []).map(an => ({ id: an.id, name: an.name })))
            }}
          />
        </SectionCard>
      ) : null}
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
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site, p.row.gender) },
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
            <VBarChart
              bars={a.weightDistribution.map(b => ({ label: b.label, count: b.count, tone: 'info' }))}
              onSelect={label => {
                const b = a.weightDistribution?.find(x => x.label === label)
                onBucket(`Weight · ${label}`, (b?.items || []).map(it => ({ id: it.id, name: it.name, value: it.value })))
              }}
            />
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
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 190, renderCell: p => animalCell(p.row.name, p.row.site, p.row.gender) },
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
              onSelect={label => {
                const b = a.bcsDistribution?.find(x => x.label === label)
                onBucket(`BCS · ${label}`, (b?.items || []).map(it => ({ id: it.id, name: it.name, value: it.value })))
              }}
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
              px: 2,
              py: 1,
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${on ? theme.palette.primary.main : c.OutlineVariant}`,
              backgroundColor: on ? theme.palette.primary.main : 'transparent',
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

    return <DistributionTypePanel item={item} onAnimal={onAnimal} onBucket={bucket} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {options.length > 1 && <Pills options={options} value={current} onChange={setSel} />}
      {renderPanel()}
    </Box>
  )
}

/* ------------------------------------------------------------------ Alerts panel */

interface AlertGroup {
  id: string
  label: string
  tone: 'error' | 'warning' | 'success' | 'neutral'
  items: { id: string; name?: string; sub?: string; value?: number }[]
}

const AlertsPanel: React.FC<{ a: SpeciesAssessments; onOpenGroup: (g: AlertGroup) => void }> = ({ a, onOpenGroup }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const al = a.alerts || {}

  const groups: AlertGroup[] = useMemo(() => {
    const g: AlertGroup[] = []
    const push = (id: string, label: string, tone: AlertGroup['tone'], arr?: any[], map?: (x: any) => AlertGroup['items'][number]) => {
      if (arr && arr.length) g.push({ id, label, tone, items: arr.map(map || (x => ({ id: x.antzId, name: x.name, sub: x.site }))) })
    }
    push('neverWeighed', 'No Weight Records', 'error', al.neverWeighed)
    push('overdue', 'Overdue (>6 months)', 'warning', al.overdue, x => ({ id: x.antzId, name: x.name, sub: x.site, value: x.daysSince }))
    push('wtinc', 'Weight Increasing (>10%)', 'success', al.weightIncreasing, x => ({ id: x.antzId, name: x.name, sub: x.site, value: round1(x.pctChange) }))
    push('wtdec', 'Weight Decreasing (>10%)', 'error', al.weightDecreasing, x => ({ id: x.antzId, name: x.name, sub: x.site, value: round1(x.pctChange) }))
    push('undermon', 'Under-Monitored (<5 records)', 'neutral', al.underMonitored, x => ({ id: x.antzId, name: x.name, sub: x.site, value: x.weightCount }))

    // BCS out-of-range, computed from animals
    const bcsUnder = (a.animals || []).filter(an => an.latestBcs != null && Number(an.latestBcs) < 2.5)
    const bcsOver = (a.animals || []).filter(an => an.latestBcs != null && Number(an.latestBcs) > 3.5)
    if (bcsUnder.length) g.push({ id: 'bcsunder', label: 'Underweight (BCS < 2.5)', tone: 'error', items: bcsUnder.map(an => ({ id: an.antzId, name: an.name, sub: an.site, value: Number(an.latestBcs) })) })
    if (bcsOver.length) g.push({ id: 'bcsover', label: 'Overweight (BCS > 3.5)', tone: 'neutral', items: bcsOver.map(an => ({ id: an.antzId, name: an.name, sub: an.site, value: Number(an.latestBcs) })) })

    return g
  }, [a, al])

  const toneColor = (tone: AlertGroup['tone']) =>
    tone === 'error' ? c.Tertiary : tone === 'warning' ? c.Tertiary : tone === 'success' ? theme.palette.primary.main : c.neutralSecondary

  if (!groups.length) return <EmptyState message='No alerts for this species' />

  return (
    <Box>
      <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
        Physical Health
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
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

/* ------------------------------------------------------------------ Tab root */

const POPULATION = '__population__'
const ALERTS = '__alerts__'

const AssessmentsTab: React.FC<{ assessments?: SpeciesAssessments }> = ({ assessments }) => {
  const a = assessments
  const [sub, setSub] = useState<string>(POPULATION)
  const [animalDrill, setAnimalDrill] = useState<AssessmentAnimal | null>(null)
  const [bucket, setBucket] = useState<{ title: string; subtitle?: string; items?: any[] } | null>(null)

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
      <Box sx={{ overflowX: 'auto', pb: 1, '& .MuiToggleButtonGroup-root .MuiToggleButton-root': { px: 4 } }}>
        <CustomSwitchTabs options={options} value={sub} onChange={(_e: React.SyntheticEvent, v: string | null) => v && setSub(v)} />
      </Box>

      {sub === POPULATION ? (
        <PopulationTable animals={a.animals || []} onAnimal={openAnimal} />
      ) : sub === ALERTS ? (
        <AlertsPanel a={a} onOpenGroup={g => setBucket({ title: g.label, subtitle: `${g.items.length} animals`, items: g.items })} />
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
