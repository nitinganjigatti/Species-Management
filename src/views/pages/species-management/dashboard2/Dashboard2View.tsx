// Dashboard 2 — species-level management view (pure template; all data computed in
// Dashboard2Container). Story order: verdict (are we okay?) → where's the fire →
// trend shape → obligations. The watchlist table lives behind the fire tiles (drawer).
// Two modes: collection (all species) and single-species (same bands, one species' health check).

import React, { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'

import Icon from 'src/@core/components/icon'
import DashboardSpeciesPicker, { SpeciesOption } from 'src/views/pages/species-management/dashboard/DashboardSpeciesPicker'
import { ColumnBarChart, TaxonomyStatusStrip } from 'src/views/pages/species-management/dashboard/dashboardUi'
import { SectionCard, EmptyState, DetailTable } from 'src/views/pages/species-management/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/detail/useSortableTable'

export type SignalKey = 'fewLeft' | 'deathSpike' | 'declining' | 'singleSex' | 'noRecentBirth'

export interface WatchRow {
  id: number
  name: string
  sci: string
  count: number
  m: number
  f: number
  u: number
  b12: number
  d12: number
  d3: number
  net12: number
  lastBirth: string
  signals: SignalKey[]
  score: number
  iucnCode: string
  threatened: boolean
}

export interface SpeciesScope {
  id: number
  name: string
  sci: string
  count: number
  m: number
  f: number
  u: number
  sites: number
  enclosures: number
  pairs: number
  b12: number
  d12: number
  d3: number
  net12: number
  netPrev: number
  lastBirth: string
  signals: SignalKey[]
  trend12: { label: string; births: number; deaths: number }[]
  className: string
  iucn: string
  iucnCode: string
  cites: string
  category: string
}

export interface Dashboard2Data {
  pulse: { species: number; animals: number; births12: number; deaths12: number; net12: number; netPrev: number; declining: number }
  trend12: { label: string; births: number; deaths: number }[]
  watchlist: WatchRow[]
  trajectory: { growing: number; stable: number; declining: number }
  obligations: { threatened: number; threatenedAtRisk: number; citesI: number; worst: WatchRow[] }
}

const SIGNAL_LABEL: Record<SignalKey, string> = {
  fewLeft: '≤3 left',
  deathSpike: 'death spike',
  declining: 'declining',
  singleSex: 'single-sex',
  noRecentBirth: 'no birth 4y+'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtMonthKey = (k?: string) => {
  const mm = /^(\d{4})-(\d{2})$/.exec(String(k || ''))

  return mm ? `${MONTHS[Number(mm[2]) - 1]} '${mm[1].slice(2)}` : '—'
}
const fmtMonthLabels = (trend: { label: string }[]) => trend.map(t => fmtMonthKey(t.label))
const signed = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString())

/* ================================================================== Band 1 — verdict */

interface VerdictStat {
  label: string
  value: string
  /** 'green' = bright headline (totals & good news) · 'white' = neutral. Nothing hot on the dark ground. */
  accent: 'green' | 'white'
  caption?: string
  icon?: string
}

const VerdictBand: React.FC<{ stats: VerdictStat[] }> = ({ stats }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const wMuted = 'rgba(255,255,255,0.60)'
  const wDivider = 'rgba(255,255,255,0.14)'

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        bgcolor: 'customColors.chatBubbleSent',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(31,81,91,0.14)',
        px: '12px',
        py: '26px'
      }}
    >
      {stats.map((s, i) => (
        <Box
          key={s.label}
          sx={{
            px: '28px',
            borderLeft: { xs: i % 2 === 1 ? `1px solid ${wDivider}` : 'none', md: i > 0 ? `1px solid ${wDivider}` : 'none' },
            minWidth: 0
          }}
        >
          <Typography
            variant='caption'
            sx={{ color: wMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', mb: 1.5 }}
          >
            {s.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {s.icon && <Icon icon={s.icon} fontSize='1.9rem' color={s.accent === 'green' ? cc.PrimaryContainer : theme.palette.common.white} />}
            <Typography
              sx={{
                fontSize: '2.4rem',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: s.accent === 'green' ? cc.PrimaryContainer : 'common.white'
              }}
              noWrap
            >
              {s.value}
            </Typography>
          </Box>
          {s.caption && (
            <Typography variant='caption' sx={{ color: wMuted, display: 'block', mt: 1.5 }} noWrap>
              {s.caption}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

/* ================================================================== Band 2 — fire / status tiles */

interface Tile {
  key: string
  label: string
  sub: string
  statHeader: string
  match: (r: WatchRow) => boolean
  /** The one number that explains why a species is on this tile. */
  stat: (r: WatchRow) => string
  hot: boolean
  /** Detail tab this tile deep-links to in single-species mode. */
  tab: string
}

const TILES: Tile[] = [
  {
    key: 'fewLeft',
    label: 'Crisis',
    sub: '3 or fewer individuals left',
    statHeader: 'Left',
    match: r => r.signals.includes('fewLeft'),
    stat: r => `${r.count} left`,
    hot: true,
    tab: 'overview'
  },
  {
    key: 'deathSpike',
    label: 'Death spikes',
    sub: 'deaths well above own baseline',
    statHeader: 'Deaths · 3m',
    match: r => r.signals.includes('deathSpike'),
    stat: r => `${r.d3} in 3m`,
    hot: true,
    tab: 'circle'
  },
  {
    key: 'declining',
    label: 'Declining',
    sub: 'deaths outpacing births · 12m',
    statHeader: 'Net · 12m',
    match: r => r.signals.includes('declining'),
    stat: r => signed(r.net12),
    hot: true,
    tab: 'circle'
  },
  {
    key: 'stalled',
    label: 'Breeding stalled',
    sub: 'single-sex or no birth in 4y+',
    statHeader: 'Breeding',
    match: r => r.signals.includes('singleSex') || r.signals.includes('noRecentBirth'),
    stat: r => (r.signals.includes('singleSex') ? `${r.m}M · ${r.f}F` : `last ${fmtMonthKey(r.lastBirth)}`),
    hot: false,
    tab: 'pairing'
  }
]

/** Collection mode — pure stat tile (option A): label · big count · subtitle. Nothing else. */
const FireTile: React.FC<{ tile: Tile; count: number; onOpen: () => void }> = ({ tile, count, onOpen }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const active = count > 0
  const numColor = !active ? cc.OutlineVariant : tile.hot ? cc.Tertiary : cc.OnSurfaceVariant

  return (
    <Box
      onClick={active ? onOpen : undefined}
      sx={{
        borderRadius: '10px',
        bgcolor: 'background.paper',
        border: `1px solid ${cc.SurfaceVariant}`,
        borderLeft: `4px solid ${active ? (tile.hot ? cc.Tertiary : cc.Outline) : cc.SurfaceVariant}`,
        p: '22px 24px',
        cursor: active ? 'pointer' : 'default',
        transition: 'transform .15s ease, box-shadow .15s ease',
        '&:hover': active ? { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(31,81,91,0.12)' } : undefined,
        minWidth: 0
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {tile.label}
        </Typography>
        {active && <Icon icon='mdi:chevron-right' fontSize='1.2rem' color={cc.Outline} />}
      </Box>
      <Typography sx={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, color: numColor, letterSpacing: '-0.01em' }}>
        {count}
      </Typography>
      <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', display: 'block', mt: 2 }} noWrap>
        {active ? tile.sub : 'none — all clear'}
      </Typography>
    </Box>
  )
}

/** Single-species mode — the same four boxes read as this species' health checks. */
const StatusTile: React.FC<{ tile: Tile; value: string; ok: boolean; note: string; onOpen: () => void }> = ({ tile, value, ok, note, onOpen }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const edge = ok ? theme.palette.primary.main : cc.Tertiary

  return (
    <Box
      onClick={onOpen}
      sx={{
        borderRadius: '10px',
        bgcolor: 'background.paper',
        border: `1px solid ${cc.SurfaceVariant}`,
        borderLeft: `4px solid ${edge}`,
        p: '22px 24px',
        cursor: 'pointer',
        transition: 'transform .15s ease, box-shadow .15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(31,81,91,0.12)' },
        minWidth: 0
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {tile.label}
        </Typography>
        <Icon icon={ok ? 'mdi:check-circle' : 'mdi:alert-circle'} fontSize='1.25rem' color={edge} />
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.05, color: 'customColors.OnSurfaceVariant', letterSpacing: '-0.01em' }} noWrap>
        {value}
      </Typography>
      <Typography variant='caption' sx={{ color: ok ? 'primary.dark' : cc.Tertiary, fontWeight: 700, display: 'block', mt: 2 }} noWrap>
        {note}
      </Typography>
    </Box>
  )
}

/* ================================================================== drill drawer (de-chipped) */

const WatchDrawer: React.FC<{
  tile: Tile | null
  rows: WatchRow[]
  onClose: () => void
  onOpenSpecies: (id: number) => void
}> = ({ tile, rows, onClose, onOpenSpecies }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows

    return rows.filter(r => `${r.name} ${r.sci}`.toLowerCase().includes(query))
  }, [rows, q])

  const tbl = useSortableTable(filtered, { field: 'net12', sort: 'asc' })

  if (!tile) return null

  const others = (r: WatchRow) => {
    const rest = r.signals.filter(s => !tile.match({ ...r, signals: [s] } as WatchRow)).map(s => SIGNAL_LABEL[s])

    return rest.length ? `also: ${rest.join(' · ')}` : ''
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Species',
      flex: 1,
      minWidth: 260,
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
            <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
              {p.row.name}
            </Typography>
            {p.row.iucnCode && ['CR', 'EN', 'VU'].includes(p.row.iucnCode) && (
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: cc.Tertiary, flexShrink: 0 }}>{p.row.iucnCode}</Typography>
            )}
          </Box>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontStyle: 'italic' }} noWrap>
            {p.row.sci}
          </Typography>
        </Box>
      )
    },
    {
      field: 'count',
      headerName: 'Population',
      width: 150,
      renderCell: p => (
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 700, color: cc.OnSurfaceVariant }}>
            {p.row.count.toLocaleString()}
          </Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
            {p.row.m}M · {p.row.f}F · {p.row.u}U
          </Typography>
        </Box>
      )
    },
    {
      field: 'net12',
      headerName: tile.statHeader,
      width: 170,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant='body2' sx={{ fontWeight: 700, color: tile.hot ? cc.Tertiary : cc.OnSurfaceVariant }}>
            {tile.stat(p.row)}
          </Typography>
          {others(p.row) && (
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }} noWrap>
              {others(p.row)}
            </Typography>
          )}
        </Box>
      )
    }
  ]

  return (
    <Drawer anchor='right' open onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 720 }, p: 6 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box>
            <Typography variant='h5'>
              {tile.label} · {rows.length}
            </Typography>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              {tile.sub}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <TextField
          size='small'
          placeholder='Search species…'
          value={q}
          onChange={e => setQ(e.target.value)}
          sx={{ width: 280, maxWidth: '100%' }}
          InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
        />

        {tbl.total ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            rowHeight={60}
            onRowClick={(p: { row: WatchRow }) => onOpenSpecies(p.row.id)}
          />
        ) : (
          <EmptyState message='No matching species' />
        )}
      </Box>
    </Drawer>
  )
}

/* ================================================================== chart band */

const TrendCards: React.FC<{ trend: { label: string; births: number; deaths: number }[]; births12: number; deaths12: number }> = ({
  trend,
  births12,
  deaths12
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const labels = fmtMonthLabels(trend)

  const header = (label: string, total: number, color: string) => (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1 }}>{total.toLocaleString()}</Typography>
      <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
        · 12m
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
      <SectionCard title={header('Births', births12, theme.palette.primary.dark)}>
        <ColumnBarChart values={trend.map(t => t.births)} labels={labels} color={theme.palette.primary.main} name='Births' height={250} />
      </SectionCard>
      <SectionCard title={header('Deaths', deaths12, cc.Tertiary)}>
        <ColumnBarChart values={trend.map(t => t.deaths)} labels={labels} color={cc.Tertiary} name='Deaths' height={250} />
      </SectionCard>
    </Box>
  )
}

/* ================================================================== main view */

const Dashboard2View: React.FC<{
  data: Dashboard2Data
  scope: SpeciesScope | null
  speciesOptions: SpeciesOption[]
  selectedId: number | null
  onSelectSpecies: (id: number | null) => void
  onOpenSpecies: (id: number, tab?: string) => void
}> = ({ data, scope, speciesOptions, selectedId, onSelectSpecies, onOpenSpecies }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  const [openTile, setOpenTile] = useState<Tile | null>(null)

  const tileRows = useMemo(() => {
    const m: Record<string, WatchRow[]> = {}
    for (const t of TILES) m[t.key] = data.watchlist.filter(t.match)

    return m
  }, [data.watchlist])

  const trajTotal = Math.max(1, data.trajectory.growing + data.trajectory.stable + data.trajectory.declining)
  const trajSegs = [
    { label: 'Growing', value: data.trajectory.growing, color: theme.palette.primary.main },
    { label: 'Stable', value: data.trajectory.stable, color: cc.SurfaceVariant },
    { label: 'Declining', value: data.trajectory.declining, color: cc.Tertiary }
  ]
  const atRiskPct = data.obligations.threatened ? Math.round((data.obligations.threatenedAtRisk / data.obligations.threatened) * 100) : 0

  /* ------- single-species status checks ------- */
  const speciesChecks = scope
    ? [
        {
          tile: TILES[0],
          value: scope.count.toLocaleString(),
          ok: !scope.signals.includes('fewLeft'),
          note: scope.signals.includes('fewLeft') ? 'crisis — 3 or fewer left' : 'population clear'
        },
        {
          tile: TILES[1],
          value: `${scope.d3}`,
          ok: !scope.signals.includes('deathSpike'),
          note: scope.signals.includes('deathSpike') ? 'spike vs own baseline' : 'deaths in 3m — normal'
        },
        {
          tile: TILES[2],
          value: signed(scope.net12),
          ok: !scope.signals.includes('declining'),
          note: scope.signals.includes('declining') ? 'deaths outpacing births' : 'net · 12m'
        },
        {
          tile: TILES[3],
          value: `${scope.m}M · ${scope.f}F`,
          ok: !scope.signals.includes('singleSex') && !scope.signals.includes('noRecentBirth'),
          note: scope.signals.includes('singleSex')
            ? 'single-sex — cannot breed'
            : scope.signals.includes('noRecentBirth')
            ? `no birth since ${fmtMonthKey(scope.lastBirth)}`
            : scope.lastBirth
            ? `last birth ${fmtMonthKey(scope.lastBirth)}`
            : 'breeding possible'
        }
      ]
    : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header — title + species picker */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3, flexWrap: 'wrap' }}>
          <Typography variant='h5'>{scope ? scope.name : 'Species Dashboard'}</Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontStyle: scope ? 'italic' : 'normal' }}>
            {scope ? scope.sci : 'trailing 12 months · real birth, death & population records'}
          </Typography>
        </Box>
        <DashboardSpeciesPicker options={speciesOptions} value={selectedId} onChange={onSelectSpecies} />
      </Box>

      {/* Band 1 — verdict */}
      {scope ? (
        <VerdictBand
          stats={[
            { label: 'Animals', value: scope.count.toLocaleString(), accent: 'green', caption: `${scope.m}M · ${scope.f}F · ${scope.u}U` },
            {
              label: 'Net change · 12m',
              value: signed(scope.net12),
              accent: scope.net12 >= 0 ? 'green' : 'white',
              icon: scope.net12 >= 0 ? 'mdi:trending-up' : 'mdi:trending-down',
              caption: `${scope.b12} births · ${scope.d12} deaths`
            },
            { label: 'Sites', value: scope.sites.toLocaleString(), accent: 'white', caption: `${scope.enclosures.toLocaleString()} enclosures` },
            { label: 'Breeding pairs', value: scope.pairs.toLocaleString(), accent: 'white', caption: scope.lastBirth ? `last birth ${fmtMonthKey(scope.lastBirth)}` : 'no birth on record' }
          ]}
        />
      ) : (
        <VerdictBand
          stats={[
            { label: 'Species', value: data.pulse.species.toLocaleString(), accent: 'green' },
            { label: 'Animals', value: data.pulse.animals.toLocaleString(), accent: 'green' },
            {
              label: 'Net change · 12m',
              value: signed(data.pulse.net12),
              accent: data.pulse.net12 >= 0 ? 'green' : 'white',
              icon: data.pulse.net12 >= 0 ? 'mdi:trending-up' : 'mdi:trending-down',
              caption: `${signed(data.pulse.net12 - data.pulse.netPrev)} vs prior 12m`
            },
            {
              label: 'Declining species',
              value: data.pulse.declining.toLocaleString(),
              accent: 'white',
              caption: `of ${data.pulse.species.toLocaleString()} species`
            }
          ]}
        />
      )}

      {/* Band 2 — fire tiles / status checks */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 4 }}>
        {scope
          ? speciesChecks.map(c => (
              <StatusTile key={c.tile.key} tile={c.tile} value={c.value} ok={c.ok} note={c.note} onOpen={() => onOpenSpecies(scope.id, c.tile.tab)} />
            ))
          : TILES.map(t => <FireTile key={t.key} tile={t} count={tileRows[t.key].length} onOpen={() => setOpenTile(t)} />)}
      </Box>

      {/* Band 3 — trend shape */}
      {scope ? (
        <TrendCards trend={scope.trend12} births12={scope.b12} deaths12={scope.d12} />
      ) : (
        <TrendCards trend={data.trend12} births12={data.pulse.births12} deaths12={data.pulse.deaths12} />
      )}

      {/* Band 4 — collection: trajectory + obligations · single: identity + full profile */}
      {scope ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TaxonomyStatusStrip
            chips={[
              { label: 'Class', value: scope.className, icon: 'mdi:family-tree' },
              { label: 'IUCN', value: scope.iucn, icon: 'mdi:earth' },
              { label: 'CITES', value: scope.cites, icon: 'mdi:file-document-outline' },
              { label: 'Category', value: scope.category, icon: 'mdi:tag-outline' }
            ]}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant='contained' endIcon={<Icon icon='mdi:arrow-right' />} onClick={() => onOpenSpecies(scope.id)}>
              Open full profile
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          <SectionCard
            title={
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Population trajectory
              </Typography>
            }
            titleMb={3}
          >
            <Box sx={{ display: 'flex', height: 18, borderRadius: '9px', overflow: 'hidden' }}>
              {trajSegs.map(s => (
                <Box key={s.label} sx={{ width: `${(s.value / trajTotal) * 100}%`, bgcolor: s.color, minWidth: s.value ? '4px' : 0 }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 5, mt: 3, flexWrap: 'wrap' }}>
              {trajSegs.map(s => (
                <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                  <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                    {s.label} <b>{s.value.toLocaleString()}</b>
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mt: 3 }}>
              Share of species by net births − deaths over the trailing 12 months.
            </Typography>
          </SectionCard>

          <SectionCard
            title={
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Conservation obligations
              </Typography>
            }
            titleMb={3}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '2.1rem', fontWeight: 800, color: data.obligations.threatenedAtRisk ? cc.Tertiary : 'primary.dark', lineHeight: 1 }}>
                {data.obligations.threatenedAtRisk}
              </Typography>
              <Typography variant='body1' sx={{ color: cc.OnSurfaceVariant }}>
                of <b>{data.obligations.threatened}</b> threatened species need attention
              </Typography>
              <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                · {data.obligations.citesI} on CITES Appendix I
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', height: 10, borderRadius: '5px', overflow: 'hidden', bgcolor: cc.SurfaceVariant, mt: 3 }}>
              <Box sx={{ width: `${atRiskPct}%`, bgcolor: cc.Tertiary, borderRadius: '5px' }} />
            </Box>

            {data.obligations.worst.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                {data.obligations.worst.map(w => (
                  <Box
                    key={w.id}
                    onClick={() => onOpenSpecies(w.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: '12px',
                      py: '6px',
                      borderRadius: '18px',
                      cursor: 'pointer',
                      bgcolor: 'customColors.Surface',
                      border: `1px solid ${cc.SurfaceVariant}`,
                      '&:hover': { bgcolor: cc.OnBackground }
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: cc.Tertiary }}>{w.iucnCode || 'T'}</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
                      {w.name}
                    </Typography>
                    <Typography variant='caption' sx={{ color: cc.neutralSecondary, flexShrink: 0 }}>
                      {w.count} left
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Box>
      )}

      {openTile && <WatchDrawer tile={openTile} rows={tileRows[openTile.key]} onClose={() => setOpenTile(null)} onOpenSpecies={onOpenSpecies} />}
    </Box>
  )
}

export default Dashboard2View
