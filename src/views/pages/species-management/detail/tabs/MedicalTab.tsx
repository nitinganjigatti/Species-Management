'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Autocomplete, Avatar, Box, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import type { PreventiveProgram, PreventiveRecord, PreventiveSite, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import type { ClinicalProgram, ClinicalRecord, SpeciesClinical } from 'src/lib/api/species-management/detail'
import {
  ColumnTrend,
  DetailTable,
  Donut,
  EmptyState,
  Pill,
  SectionCard,
  Sparkline,
  StatTile,
  StatusChip
} from 'src/views/pages/species-management/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/detail/useSortableTable'
import DashboardDateRange, { resolveRange, type RangeSelection } from 'src/views/pages/species-management/dashboard/DashboardDateRange'

type TabKey = 'overview' | 'symptoms' | 'diagnosis' | 'vaccination' | 'deworming' | 'supplements'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Date-in-window test for the selected range. `from === null` (All time) passes everything. */
const useWindow = (range: RangeSelection) => {
  const { from, to } = resolveRange(range, new Date())
  const lo = from ? from.getTime() : null
  const hi = to.getTime()

  return (s?: string) => {
    if (!s) return true
    const t = new Date(s).getTime()
    if (isNaN(t)) return true

    return (lo == null || t >= lo) && t <= hi
  }
}

/** Count occurrences of `key` across rows → [{ name, count }] sorted desc. */
const rankBy = (rows: any[], key: string, idKey = 'aid'): { name: string; count: number; animals: number }[] => {
  const m: Record<string, { count: number; animals: Set<string> }> = {}
  for (const r of rows) {
    const k = r[key]
    if (!m[k]) m[k] = { count: 0, animals: new Set() }
    m[k].count++
    m[k].animals.add(r[idKey])
  }

  return Object.entries(m)
    .map(([name, v]) => ({ name, count: v.count, animals: v.animals.size }))
    .sort((a, b) => b.count - a.count)
}

/** Monthly counts over the trailing 12 months (for the clinical trend when a window is applied). */
const monthlyTrend = (rows: { date: string }[], now: Date) => {
  const buckets: { label: string; value: number }[] = []
  const idx: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    idx[`${d.getFullYear()}-${d.getMonth()}`] = buckets.length
    buckets.push({ label: MONTHS[d.getMonth()], value: 0 })
  }
  for (const r of rows) {
    const d = new Date(r.date)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (idx[k] != null) buckets[idx[k]].value++
  }

  return buckets
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'diagnosis', label: 'Clinical Assessment' },
  { key: 'vaccination', label: 'Vaccination' },
  { key: 'deworming', label: 'Deworming' },
  { key: 'supplements', label: 'Supplements' }
]

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

// Same branding mark the other detail tables use for the animal identity cell.
const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'

const fmtDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)

  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── shared cell renderers (avatar + name/AID, matches Assessments) ───────── */
const useCells = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  const txt = (v: React.ReactNode, color?: string, weight = 400) => (
    <Typography sx={{ fontSize: '1rem', fontWeight: weight, color: color || c.OnSurfaceVariant }} noWrap>
      {v}
    </Typography>
  )

  // Identical to the Assessments tab cell: logo avatar + name (600) over site (caption).
  const animalCell = (name?: string, site?: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Avatar
        src={ANTZ_LOGO}
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

  return { txt, animalCell, c, theme }
}

/* ── layout helpers ───────────────────────────────────────────────────────── */
const StatsRow: React.FC<{ children: React.ReactNode; cols?: number }> = ({ children, cols = 4 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${cols}, 1fr)` }, gap: 3 }}>{children}</Box>
)

const ChartsRow: React.FC<{ children: React.ReactNode; md?: string }> = ({ children, md = 'repeat(2, 1fr)' }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md }, gap: 4 }}>{children}</Box>
)

const FilterChip: React.FC<{ label: string; onClear: () => void }> = ({ label }) => <Pill label={label} icon='mdi:filter-variant' onClick={undefined} />

/* ── animal-wise grouping + shared bits ───────────────────────────────────── */
interface AniGroup {
  id: string
  aid: string
  name: string
  site: string
  enclosure: string
  types: string[]
  count: number
  active: number
  latest: string
  status: 'active' | 'resolved'
  records: any[]
}

/** Roll records up to one row per animal. `activeStatus` = the "needs attention" state
 *  ('active' for clinical, 'overdue' for preventive); `dateKey` = the field used for "latest". */
const groupByAnimal = (records: any[], dateKey: string, activeStatus: string): AniGroup[] => {
  const m = new Map<string, AniGroup>()
  for (const r of records) {
    let g = m.get(r.aid)
    if (!g) {
      g = { id: r.aid, aid: r.aid, name: r.name, site: r.site, enclosure: r.enclosure, types: [], count: 0, active: 0, latest: '', status: 'resolved', records: [] }
      m.set(r.aid, g)
    }
    g.count++
    g.records.push(r)
    if (!g.types.includes(r.type)) g.types.push(r.type)
    if (r.status === activeStatus) {
      g.active++
      g.status = 'active'
    }
    const d = r[dateKey]
    if (d && d > g.latest) g.latest = d
  }

  return [...m.values()]
}

// Shared height for the table-card header controls (view toggle + search) so they line up — matches Circle of Life.
const TABLE_CTRL_H = 44

const VIEW_OPTIONS: { key: 'animal' | 'record'; label: string; icon: string }[] = [
  { key: 'animal', label: 'Animal-wise', icon: 'mdi:paw' },
  { key: 'record', label: 'Record-wise', icon: 'mdi:format-list-bulleted' }
]
const MATRIX_VIEW_OPTIONS: { key: 'site' | 'animal'; label: string; icon: string }[] = [
  { key: 'site', label: 'Site-wise', icon: 'mdi:map-marker-outline' },
  { key: 'animal', label: 'Animal-wise', icon: 'mdi:paw' }
]

/** Segmented toggle — same pill styling as the Circle-of-Life table toggle. Generic over the option keys. */
function ViewToggle<T extends string>({
  view,
  onChange,
  options = VIEW_OPTIONS as unknown as { key: T; label: string; icon: string }[]
}: {
  view: T
  onChange: (v: T) => void
  options?: { key: T; label: string; icon: string }[]
}) {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'stretch', height: TABLE_CTRL_H, p: 0.75, borderRadius: '999px', border: `1px solid ${c.OutlineVariant}`, bgcolor: theme.palette.background.paper }}>
      {options.map(v => {
        const on = view === v.key

        return (
          <Box
            key={v.key}
            onClick={() => onChange(v.key)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 4, borderRadius: '999px', cursor: 'pointer', bgcolor: on ? theme.palette.primary.main : 'transparent', transition: 'all 0.15s ease' }}
          >
            <Icon icon={v.icon} fontSize='1.15rem' color={on ? theme.palette.common.white : c.neutralSecondary} />
            <Typography variant='body2' sx={{ fontWeight: 600, color: on ? theme.palette.common.white : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {v.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

/** Table search box — same styling/behaviour as the Circle-of-Life table search. */
const TableSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Search…' }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <TextField
      size='small'
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      sx={{ width: 240, maxWidth: '100%', '& .MuiInputBase-root': { height: TABLE_CTRL_H, bgcolor: theme.palette.background.paper } }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: c.neutralSecondary }} /> }}
    />
  )
}

/** Case-insensitive substring match over an animal-ish record's identity fields. */
const matchesQuery = (r: any, q: string) => {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const types = Array.isArray(r.types) ? r.types.join(' ') : r.type || ''

  return `${r.name} ${r.aid} ${r.site} ${r.enclosure} ${types}`.toLowerCase().includes(query)
}

/** Number-first ranked list (rank badge · label · count · chevron) — replaces ranked bar charts. */
const RankedList: React.FC<{
  items: { label: string; count: number; animals?: number }[]
  onItem?: (label: string) => void
  limit?: number
  showAnimals?: boolean
}> = ({ items, onItem, limit, showAnimals }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const shown = limit ? items.slice(0, limit) : items

  return (
    <Box>
      {shown.map((it, i) => (
        <Box
          key={it.label}
          onClick={onItem ? () => onItem(it.label) : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            px: 1,
            mx: -1,
            borderBottom: i < shown.length - 1 ? `1px solid ${c.Surface}` : 'none',
            borderRadius: '8px',
            cursor: onItem ? 'pointer' : 'default',
            transition: 'background .15s ease',
            '&:hover': onItem ? { backgroundColor: c.Surface } : undefined
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              flex: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: i < 3 ? c.BgTeritary : c.Surface,
              color: i < 3 ? c.Tertiary : c.neutralSecondary
            }}
          >
            {i + 1}
          </Box>
          <Typography variant='body2' sx={{ flex: 1, minWidth: 0, fontWeight: 500 }} noWrap>
            {it.label}
          </Typography>
          {showAnimals ? (
            <Typography variant='body2' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
              <Box component='span' sx={{ fontSize: '1.05rem', fontWeight: 700, color: c.Tertiary, fontVariantNumeric: 'tabular-nums' }}>
                {it.count.toLocaleString()}
              </Box>{' '}
              rec · {(it.animals ?? 0).toLocaleString()} animals
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: c.Tertiary, fontVariantNumeric: 'tabular-nums' }}>
              {it.count.toLocaleString()}
            </Typography>
          )}
          {onItem && <Icon icon='mdi:chevron-right' fontSize={18} color={c.OutlineVariant} />}
        </Box>
      ))}
    </Box>
  )
}

/** First 2 type chips + "+N" — the conditions/items summary in an animal-wise row. */
const TypeChips: React.FC<{ types: string[] }> = ({ types }) => {
  const c = cc(useTheme() as any)
  const shown = types.slice(0, 2)
  const extra = types.length - shown.length

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
      {shown.map(t => (
        <StatusChip key={t} label={t} tone='neutral' />
      ))}
      {extra > 0 && (
        <Typography variant='caption' sx={{ color: c.neutralSecondary, fontWeight: 600 }}>
          +{extra}
        </Typography>
      )}
    </Box>
  )
}

/** Per-animal side sheet: that animal's full event timeline for the current program. */
const AnimalRecordsDrawer: React.FC<{
  group: AniGroup | null
  onClose: () => void
  mode: 'clinical' | 'preventive'
  isDiag?: boolean
  overdueWord?: string
}> = ({ group, onClose, mode, isDiag, overdueWord = 'overdue' }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const activeWord = mode === 'preventive' ? overdueWord : 'active'
  const sorted = group ? [...group.records].sort((a, b) => ((a.date || a.due) < (b.date || b.due) ? 1 : -1)) : []

  return (
    <Drawer anchor='right' open={!!group} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {group && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Avatar src={ANTZ_LOGO} alt='' sx={{ width: 40, height: 40, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap>
                  {group.name}
                </Typography>
                <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
                  {group.aid} · {group.site} · {group.enclosure}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} size='small'>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${c.Surface}` }}>
            <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
              {group.count} records · {group.active} {activeWord}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {sorted.map((r, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, borderBottom: `1px solid ${c.Surface}` }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
                    {r.type}
                  </Typography>
                  <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
                    {mode === 'clinical'
                      ? `${isDiag ? 'Diagnosed' : 'Reported'} ${fmtDate(r.date)}${isDiag && r.prognosis ? ' · ' + r.prognosis : ''}`
                      : `Last given ${fmtDate(r.lastGiven)} · due ${fmtDate(r.due)}`}
                  </Typography>
                </Box>
                {mode === 'clinical' ? (
                  <StatusChip label={r.status === 'active' ? 'Active' : 'Resolved'} tone={r.status === 'active' ? 'error' : 'success'} />
                ) : r.status === 'overdue' ? (
                  <StatusChip label={`${overdueWord} ${r.days}d`} tone='error' />
                ) : (
                  <StatusChip label={`in ${r.days}d`} tone='info' />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

/* ═══════════════════════════════════════════════ Overview panel (cross-domain roll-up) */
interface OviAnimal {
  id: string
  aid: string
  name: string
  site: string
  enclosure: string
  activeTypes: string[]
  activeClinical: number
  clinicalTotal: number
  overdue: number
  worst: 'Poor' | 'Guarded' | null
  latest: string
  score: number
  status: 'Healthy' | 'Needs attention' | 'Critical'
  events: { domain: string; type: string; date: string; status: string; days?: number; lastGiven?: string; prognosis?: string; severity?: string }[]
}

const CLINICAL_DOMAINS: { key: 'symptoms' | 'diagnosis'; label: string }[] = [
  { key: 'symptoms', label: 'Symptom' },
  { key: 'diagnosis', label: 'Clinical Assessment' }
]
const PREVENTIVE_DOMAINS: { key: 'vaccination' | 'deworming' | 'supplements'; label: string }[] = [
  { key: 'vaccination', label: 'Vaccination' },
  { key: 'deworming', label: 'Deworming' },
  { key: 'supplements', label: 'Supplements' }
]

const buildRollup = (clinical: SpeciesClinical | null | undefined, preventive: SpeciesPreventive | null | undefined, inWin: (s?: string) => boolean): OviAnimal[] => {
  const m = new Map<string, OviAnimal>()
  const get = (r: any): OviAnimal => {
    let g = m.get(r.aid)
    if (!g) {
      g = { id: r.aid, aid: r.aid, name: r.name, site: r.site, enclosure: r.enclosure, activeTypes: [], activeClinical: 0, clinicalTotal: 0, overdue: 0, worst: null, latest: '', score: 0, status: 'Healthy', events: [] }
      m.set(r.aid, g)
    }

    return g
  }

  for (const { key, label } of CLINICAL_DOMAINS) {
    const prog = clinical?.programs?.[key]
    if (!prog) continue
    for (const r of prog.records) {
      if (!inWin(r.date)) continue
      const g = get(r)
      g.clinicalTotal++
      g.events.push({ domain: label, type: r.type, date: r.date, status: r.status, prognosis: r.prognosis, severity: r.severity })
      if (r.status === 'active') {
        g.activeClinical++
        if (!g.activeTypes.includes(r.type)) g.activeTypes.push(r.type)
        if (r.prognosis === 'Poor') g.worst = 'Poor'
        else if (r.prognosis === 'Guarded' && g.worst !== 'Poor') g.worst = 'Guarded'
      }
      if (r.date > g.latest) g.latest = r.date
    }
  }

  for (const { key, label } of PREVENTIVE_DOMAINS) {
    const prog = preventive?.programs?.[key]
    if (!prog) continue
    for (const r of prog.records) {
      if (!inWin(r.due)) continue
      const g = get(r)
      g.events.push({ domain: label, type: r.type, date: r.due, status: r.status, days: r.days, lastGiven: r.lastGiven })
      if (r.status === 'overdue') g.overdue++
      if ((r.lastGiven || '') > g.latest) g.latest = r.lastGiven || g.latest
    }
  }

  for (const g of m.values()) {
    const critical = g.activeClinical >= 2 || g.overdue >= 3 || g.worst === 'Poor'
    g.status = critical ? 'Critical' : g.activeClinical > 0 || g.overdue > 0 ? 'Needs attention' : 'Healthy'
    g.score = (critical ? 1000 : 0) + g.activeClinical * 10 + g.overdue
  }

  return [...m.values()]
}

const countBy = (prog: { records: any[] } | undefined, activeStatus: string, dateKey: string, inWin: (s?: string) => boolean) =>
  prog ? prog.records.filter(r => r.status === activeStatus && inWin(r[dateKey])).length : 0

/** Combined per-animal timeline (clinical + preventive) for the Overview drill. */
const OverviewAnimalDrawer: React.FC<{ group: OviAnimal | null; onClose: () => void }> = ({ group, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const events = group ? [...group.events].sort((a, b) => (a.date < b.date ? 1 : -1)) : []

  // domain → icon + whether it's a preventive (schedule) domain that shows a date
  const META: Record<string, { icon: string; preventive: boolean }> = {
    Vaccination: { icon: 'mdi:needle', preventive: true },
    Deworming: { icon: 'mdi:pill', preventive: true },
    Supplements: { icon: 'mdi:water', preventive: true },
    'Clinical Assessment': { icon: 'mdi:stethoscope', preventive: false },
    Symptom: { icon: 'mdi:emoticon-sad-outline', preventive: false }
  }
  // pill label → [bg, border] from the medical-tag theme tokens
  const TAG: Record<string, [string, string]> = {
    Favourable: [c.medTagYellowBg, c.medTagYellowBorder],
    Guarded: [c.medTagTealBg, c.medTagTealBorder],
    Doubtful: [c.medTagOrangeBg, c.medTagOrangeBorder],
    Poor: [c.medTagRedBg, c.medTagRedBorder],
    Grave: [c.medTagMaroonBg, c.medTagMaroonBorder],
    Low: [c.medTagTealBg, c.medTagTealBorder],
    Medium: [c.medTagYellowBg, c.medTagYellowBorder],
    High: [c.medTagOrangeBg, c.medTagOrangeBorder],
    Overdue: [c.medTagOrangeBg, c.medTagOrangeBorder],
    Upcoming: [c.medTagTealBg, c.medTagTealBorder]
  }
  const pillFor = (e: OviAnimal['events'][number]): string | null => {
    if (META[e.domain]?.preventive) return e.status === 'overdue' ? 'Overdue' : 'Upcoming'
    if (e.domain === 'Symptom') return e.severity || null // severity: Low/Medium/High
    return e.prognosis || null // Clinical Assessment → prognosis
  }
  const Pill: React.FC<{ label: string }> = ({ label }) => {
    const [bg, border] = TAG[label] || [c.Surface, c.OutlineVariant]
    const text = label === 'Grave' ? c.medTagMaroonBorder : theme.palette.common.black

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: '10px', py: '4px', borderRadius: 999, backgroundColor: bg, border: `0.5px solid ${border}`, whiteSpace: 'nowrap' }}>
        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: text }}>{label}</Typography>
      </Box>
    )
  }
  // Only ACTIVE items belong here: active clinical/symptom, and all preventive (overdue/upcoming).
  const shown = events.filter(e => META[e.domain]?.preventive || e.status === 'active')

  return (
    <Drawer anchor='right' open={!!group} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, maxWidth: '100%' } }}>
      {group && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Avatar src={ANTZ_LOGO} alt='' sx={{ width: 40, height: 40, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap>
                  {group.name}
                </Typography>
                <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
                  {group.aid} · {group.site} · {group.enclosure}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} size='small'>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${c.Surface}` }}>
            <StatusChip
              label={group.status}
              tone={group.status === 'Critical' ? 'error' : group.status === 'Needs attention' ? 'warning' : 'success'}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: c.OnSurfaceVariant, mt: 2, mb: 1 }}>
              Active care &amp; health
            </Typography>
            {shown.map((e, i) => {
              const m = META[e.domain]
              const label = pillFor(e)

              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, borderBottom: i < shown.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none' }}>
                  <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '8px', backgroundColor: c.displaybgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon={m?.icon || 'mdi:medical-bag'} fontSize={20} color={c.OnPrimaryContainer} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                      {e.type}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.66px', color: c.neutralSecondary, mt: '2px' }} noWrap>
                      {e.domain}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {label && <Pill label={label} />}
                    {m?.preventive && (
                      <Typography sx={{ fontSize: '12px', color: c.Outline }}>{fmtDate(e.date)}</Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
            {shown.length === 0 && (
              <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
                No active care or health items.
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

const OverviewPanel: React.FC<{
  preventive?: SpeciesPreventive | null
  clinical?: SpeciesClinical | null
  range: RangeSelection
  onGoToTab: (t: TabKey) => void
}> = ({ preventive, clinical, range, onGoToTab }) => {
  const { txt, animalCell, c, theme } = useCells()
  const inWin = useWindow(range)
  const [drill, setDrill] = useState<OviAnimal | null>(null)
  const [q, setQ] = useState('')

  const total = preventive?.animalCount ?? clinical?.animalCount ?? 0
  const groups = useMemo(() => buildRollup(clinical, preventive, inWin), [clinical, preventive, range])

  const currentlySick = groups.filter(g => g.activeClinical > 0).length
  const overduePrev = groups.filter(g => g.overdue > 0).length
  const affected = groups.filter(g => g.status !== 'Healthy').length
  const healthy = Math.max(0, total - affected)

  const load = [
    { label: 'Active symptoms', value: countBy(clinical?.programs?.symptoms, 'active', 'date', inWin), tab: 'symptoms' as TabKey },
    { label: 'Active clinical assessments', value: countBy(clinical?.programs?.diagnosis, 'active', 'date', inWin), tab: 'diagnosis' as TabKey },
    { label: 'Overdue vaccination', value: countBy(preventive?.programs?.vaccination, 'overdue', 'due', inWin), tab: 'vaccination' as TabKey },
    { label: 'Overdue deworming', value: countBy(preventive?.programs?.deworming, 'overdue', 'due', inWin), tab: 'deworming' as TabKey },
    { label: 'Overdue supplements', value: countBy(preventive?.programs?.supplements, 'overdue', 'due', inWin), tab: 'supplements' as TabKey }
  ].sort((a, b) => b.value - a.value)

  const attentionRows = useMemo(() => {
    const base = groups.filter(g => g.status !== 'Healthy')

    return q.trim() ? base.filter(g => matchesQuery({ ...g, types: g.activeTypes }, q)) : base
  }, [groups, q])
  const tbl = useSortableTable(attentionRows, { field: 'score', sort: 'desc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    {
      field: 'activeTypes',
      headerName: 'Active Conditions',
      flex: 1,
      minWidth: 240,
      sortable: false,
      renderCell: p => (p.row.activeTypes.length ? <TypeChips types={p.row.activeTypes} /> : txt('—', c.neutralSecondary))
    },
    { field: 'overdue', headerName: 'Overdue', width: 140, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.overdue, p.row.overdue ? c.Tertiary : c.neutralSecondary, 700) },
    { field: 'latest', headerName: 'Last Update', width: 170, renderCell: p => txt(fmtDate(p.row.latest), c.neutralSecondary) },
    {
      // field maps to the numeric severity `score` so the default sort model has a matching column
      // (a sortModel field with no column throws DataGrid's "Maximum update depth" crash); the cell still shows the status.
      field: 'score',
      headerName: 'Status',
      width: 160,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => (
        <StatusChip label={p.row.status} tone={p.row.status === 'Critical' ? 'error' : p.row.status === 'Needs attention' ? 'warning' : 'success'} />
      )
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Row 1 · stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 3 }}>
        <StatTile label='Animals' value={total.toLocaleString()} tone='neutral' />
        <StatTile label='Currently Sick' value={currentlySick.toLocaleString()} tone='error' />
        <StatTile label='Overdue Preventive' value={overduePrev.toLocaleString()} tone='warning' />
        <StatTile label='Healthy' value={healthy.toLocaleString()} tone='success' />
      </Box>

      {/* Row 2 · charts */}
      <ChartsRow md='1fr 1.2fr'>
        <SectionCard title='Health status' titleMb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Donut
              segments={[
                { label: 'Healthy', value: healthy, tone: 'success' },
                { label: 'Affected', value: affected, tone: 'error' }
              ]}
              centerValue={total.toLocaleString()}
              centerSub='animals'
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: theme.palette.primary.main }} />
                <Typography variant='body2'>
                  Healthy{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    {healthy.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: c.Tertiary }} />
                <Typography variant='body2'>
                  Affected{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    {affected.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
              <Typography variant='caption' sx={{ color: c.neutralSecondary, mt: 0.5 }}>
                Sick now or overdue on care
              </Typography>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title='Where the load is' titleMb={2}>
          <RankedList
            items={load.map(l => ({ label: l.label, count: l.value }))}
            onItem={label => {
              const hit = load.find(l => l.label === label)
              if (hit) onGoToTab(hit.tab)
            }}
          />
        </SectionCard>
      </ChartsRow>

      {/* Row 3 · animals needing attention */}
      <SectionCard
        title={`Animals needing attention · ${attentionRows.length.toLocaleString()}`}
        action={<TableSearch value={q} onChange={onQ} placeholder='Search animal, site…' />}
        titleMb={2}
      >
        {attentionRows.length ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: OviAnimal }) => setDrill(p.row)}
          />
        ) : (
          <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
            No animals currently need attention in this window.
          </Typography>
        )}
      </SectionCard>

      <OverviewAnimalDrawer group={drill} onClose={() => setDrill(null)} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════ Preventive panel (vacc/deworm/supp) */
const wordingFor = (key: TabKey, kind: string) => {
  const ongoing = kind === 'ongoing'

  return {
    coverageLabel: ongoing ? 'On Schedule' : 'Coverage',
    overdueLabel: ongoing ? 'Lapsed' : 'Overdue',
    overdueWord: ongoing ? 'lapsed' : 'overdue',
    dueLabel: ongoing ? 'Due to Renew' : 'Due in 30 Days',
    typeNoun: key === 'vaccination' ? 'vaccines' : key === 'deworming' ? 'dewormers' : 'supplements',
    typeCol: key === 'vaccination' ? 'Vaccine' : key === 'deworming' ? 'Dewormer' : 'Supplement'
  }
}

// ── Site-matrix pieces (Direction 3) ────────────────────────────────────────
const CovRing: React.FC<{ pct: number }> = ({ pct }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const R = 13
  const C = 2 * Math.PI * R

  return (
    <svg width={34} height={34} viewBox='0 0 34 34'>
      <circle cx={17} cy={17} r={R} fill='none' stroke={c.SurfaceVariant} strokeWidth={4} />
      <circle cx={17} cy={17} r={R} fill='none' stroke={theme.palette.primary.main} strokeWidth={4} strokeLinecap='round' strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform='rotate(-90 17 17)' />
    </svg>
  )
}

/** Three overdue-aging cells (0-30 / 30-90 / 90+); orange intensity = alpha of Tertiary. */
const AgeCells: React.FC<{ aging: { d0_30: number; d30_90: number; d90plus: number } }> = ({ aging }) => {
  const c = cc(useTheme() as any)
  const O = c.Tertiary
  const defs = [
    { v: aging.d0_30, bg: `${O}30`, fg: O },
    { v: aging.d30_90, bg: `${O}85`, fg: '#fff' },
    { v: aging.d90plus, bg: O, fg: '#fff' }
  ]

  return (
    <Box sx={{ display: 'flex', gap: '16px' }}>
      {defs.map((d, i) => (
        <Box
          key={i}
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: d.v > 0 ? d.bg : 'transparent',
            border: d.v > 0 ? 'none' : `1px solid ${c.SurfaceVariant}`
          }}
        >
          <Typography variant='caption' sx={{ fontWeight: 700, color: d.v > 0 ? d.fg : c.OutlineVariant }}>
            {d.v}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

const MATRIX_COLS = 'minmax(200px, 1fr) 116px 78px 190px 116px'

const SiteMatrix: React.FC<{ sites: PreventiveSite[]; overdueLabel: string; onRow: (site: string) => void }> = ({ sites, overdueLabel, onRow }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  // Header cell styled like the standard DetailTable header (customHeadingTextColor, weight 500, 0.95rem — not uppercase).
  const H: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
    <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: c.customHeadingTextColor, textTransform: 'uppercase', letterSpacing: '0.17px', textAlign: align }} noWrap>
      {children}
    </Typography>
  )

  return (
    <Box sx={{ overflowX: 'auto', border: `1px solid ${c.SurfaceVariant}`, borderRadius: '8px' }}>
      <Box sx={{ minWidth: 900 }}>
        {/* Header row — matches the standard antz DataGrid header (bg + 56px height + 20/16px padding). */}
        <Box sx={{ display: 'grid', gridTemplateColumns: MATRIX_COLS, columnGap: '48px', alignItems: 'center', pl: '20px', pr: '16px', minHeight: 56, borderRadius: '8px 8px 0 0', backgroundColor: c.customTableHeaderBg }}>
          <H>Site</H>
          <H>Coverage</H>
          <H>{overdueLabel}</H>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: c.customHeadingTextColor, textTransform: 'uppercase', letterSpacing: '0.17px', lineHeight: 1.25 }} noWrap>
              Ageing
            </Typography>
            {/* Same 42px slots + 16px gap as the AgeCells boxes so each range sits over its box. */}
            <Box sx={{ display: 'flex', gap: '16px', mt: 0.5 }}>
              {['0–30', '30–90', '90+'].map(l => (
                <Typography key={l} variant='caption' sx={{ width: 42, flexShrink: 0, textAlign: 'center', fontWeight: 500, color: c.OnSurfaceVariant }} noWrap>
                  {l}
                </Typography>
              ))}
            </Box>
          </Box>
          <H align='right'>90-day trend</H>
        </Box>
        {sites.map(st => (
          <Box
            key={st.site}
            onClick={() => onRow(st.site)}
            // Taller than the 64px standard rows — this content is heavier and needs breathing space.
            sx={{ display: 'grid', gridTemplateColumns: MATRIX_COLS, columnGap: '48px', alignItems: 'center', pl: '20px', pr: '16px', minHeight: 88, py: 2, borderTop: `1px solid ${c.SurfaceVariant}`, cursor: 'pointer', transition: 'background .15s ease', '&:hover': { backgroundColor: c.Surface } }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                {st.site}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
                {st.animals.toLocaleString()} animals · {st.enclosures} enclosure{st.enclosures === 1 ? '' : 's'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <CovRing pct={st.coveragePct} />
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {st.coveragePct}%
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: st.overdue ? c.Tertiary : c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>
              {st.overdue}
            </Typography>
            <AgeCells aging={st.aging} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
              <Sparkline values={st.spark} tone={st.trendPct >= 0 ? 'up' : 'down'} width={58} height={24} />
              <Typography variant='caption' sx={{ fontWeight: 700, color: st.trendPct >= 0 ? theme.palette.primary.dark : c.Tertiary }}>
                {st.trendPct >= 0 ? '+' : ''}
                {st.trendPct}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/** The 4-cell coverage/overdue/due/never strip (one card, dividers, tinted coverage cell). */
const PreventiveStatStrip: React.FC<{ s: PreventiveProgram['summary']; programLabel: string; w: ReturnType<typeof wordingFor>; nSites: number }> = ({ s, programLabel, w, nSites }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const ongoing = w.coverageLabel === 'On Schedule'
  const upToDate = Math.max(0, s.animalsTracked - s.overdue - s.never)
  const cells: { label: string; value: string; delta?: string; sub: string; tint?: boolean; color: string }[] = [
    { label: ongoing ? 'On Schedule' : `${programLabel} Coverage`, value: `${s.coveragePct}%`, delta: `▲ +${s.coverageTrendPct}%`, sub: `${upToDate.toLocaleString()} of ${s.animalsTracked.toLocaleString()} animals up to date`, tint: true, color: c.OnSurfaceVariant },
    { label: w.overdueLabel, value: s.overdue.toLocaleString(), sub: `across ${nSites} site${nSites === 1 ? '' : 's'}`, color: c.Tertiary },
    { label: w.dueLabel, value: s.dueIn30.toLocaleString(), sub: 'upcoming round', color: c.OnSurfaceVariant },
    { label: 'Never Given', value: s.never.toLocaleString(), sub: 'new / unrecorded', color: c.OnSurfaceVariant }
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, border: `1px solid ${c.SurfaceVariant}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: theme.palette.background.paper }}>
      {cells.map((cell, i) => (
        <Box
          key={i}
          sx={{
            p: 3,
            borderRight: { xs: 'none', md: i < 3 ? `1px solid ${c.SurfaceVariant}` : 'none' },
            borderBottom: { xs: i < 2 ? `1px solid ${c.SurfaceVariant}` : 'none', md: 'none' },
            backgroundColor: cell.tint ? `${theme.palette.primary.main}14` : 'transparent'
          }}
        >
          <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase', letterSpacing: '.03em', fontWeight: 600 }}>
            {cell.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, color: cell.color, lineHeight: 1 }}>
              {cell.value}
            </Typography>
            {cell.delta && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: '6px', backgroundColor: `${theme.palette.primary.main}1F` }}>
                <Typography variant='caption' sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>
                  {cell.delta}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: 0.5 }}>
            {cell.sub}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

/** Row-click drill: the actionable animals at one site (searchable). */
const SiteDrillDrawer: React.FC<{ site: string | null; records: PreventiveRecord[]; overdueWord: string; onClose: () => void }> = ({ site, records, overdueWord, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [q, setQ] = useState('')
  const rows = site
    ? records.filter(r => r.site === site && (!q.trim() || matchesQuery(r, q))).sort((a, b) => (a.due < b.due ? -1 : 1))
    : []

  return (
    <Drawer anchor='right' open={!!site} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, maxWidth: '100%' } }}>
      {site && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap>
                {site}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {rows.length.toLocaleString()} actionable animals
              </Typography>
            </Box>
            <IconButton onClick={onClose} size='small'>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Box sx={{ p: 3, pb: 2 }}>
            <TextField
              fullWidth
              size='small'
              placeholder='Search animal…'
              value={q}
              onChange={e => setQ(e.target.value)}
              InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: c.neutralSecondary }} /> }}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {rows.map((r, i) => (
              <Box
                key={i}
                sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, py: 4, borderBottom: i < rows.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none' }}
              >
                {/* Shared AnimalCard — same identity block as every other side sheet (site omitted; the drawer is already scoped to one site). */}
                <AnimalCard
                  data={{
                    default_icon: ANTZ_LOGO,
                    local_identifier_name: 'ID',
                    local_identifier_value: r.name,
                    animal_id: r.aid,
                    gender: r.gender,
                    age: r.age,
                    weight: r.weight,
                    user_enclosure_name: r.enclosure
                  }}
                />
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mb: 0.75 }} noWrap>
                    Due {fmtDate(r.due)}
                  </Typography>
                  {r.status === 'overdue'
                    ? <StatusChip label={overdueWord.charAt(0).toUpperCase() + overdueWord.slice(1)} tone='error' />
                    : <StatusChip label='Upcoming' tone='info' />}
                </Box>
              </Box>
            ))}
            {rows.length === 0 && (
              <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
                No actionable animals at this site.
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

const PreventivePanel: React.FC<{ tab: TabKey; prog: PreventiveProgram }> = ({ tab, prog }) => {
  const { txt, animalCell, c, theme } = useCells()
  const [siteDrill, setSiteDrill] = useState<string | null>(null)
  const [matrixView, setMatrixView] = useState<'site' | 'animal'>('site')
  const [matrixQ, setMatrixQ] = useState('')
  const [animalQ, setAnimalQ] = useState('')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  const s = prog.summary
  const w = wordingFor(tab, prog.kind)
  const programLabel = TABS.find(t => t.key === tab)?.label ?? ''
  const sites = prog.sites ?? []
  const matrixSites = matrixQ.trim() ? sites.filter(x => x.site.toLowerCase().includes(matrixQ.trim().toLowerCase())) : sites
  const worst = sites[0]
  const insightTail = worst
    ? ` has the most ${w.overdueWord} (${worst.overdue})${worst.aging.d90plus ? ` and ${worst.aging.d90plus} critical (90+ day) case${worst.aging.d90plus > 1 ? 's' : ''}` : ''} — prioritise it. Click any row for the animal list.`
    : ''

  // Animal-wise rollup: one row per animal, its overdue/upcoming counts + next due date.
  const animalRows = useMemo(() => {
    const m = new Map<string, { id: string; name: string; site: string; enclosure: string; overdue: number; upcoming: number; nextDue: string }>()
    for (const r of prog.records) {
      let g = m.get(r.aid)
      if (!g) {
        g = { id: r.aid, name: r.name, site: r.site, enclosure: r.enclosure, overdue: 0, upcoming: 0, nextDue: '' }
        m.set(r.aid, g)
      }
      if (r.status === 'overdue') g.overdue++
      else g.upcoming++
      if (!g.nextDue || r.due < g.nextDue) g.nextDue = r.due
    }

    return [...m.values()]
  }, [prog.records])
  const siteOptions = useMemo(() => Array.from(new Set(animalRows.map(a => a.site))).sort(), [animalRows])
  const filteredAnimals = useMemo(() => {
    const q = animalQ.trim().toLowerCase()

    return animalRows.filter(a => (!siteFilter || a.site === siteFilter) && (!q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)))
  }, [animalRows, siteFilter, animalQ])
  const start = pm.page * pm.pageSize
  const pageRows = filteredAnimals.slice(start, start + pm.pageSize).map((a, i) => ({ ...a, sl_no: start + i + 1 }))
  const animalColumns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 300, renderCell: p => animalCell(p.row.name, p.row.site) },
    { field: 'overdue', headerName: w.overdueLabel, flex: 1, minWidth: 160, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.overdue, p.row.overdue ? c.Tertiary : c.neutralSecondary, 700) },
    { field: 'upcoming', headerName: 'Upcoming', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.upcoming, c.neutralSecondary) },
    { field: 'nextDue', headerName: 'Next Due', flex: 1, minWidth: 170, renderCell: p => txt(fmtDate(p.row.nextDue), c.neutralSecondary) }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PreventiveStatStrip s={s} programLabel={programLabel} w={w} nSites={sites.length} />

      <SectionCard
        title={matrixView === 'site' ? `${programLabel} status by site` : `${programLabel} · ${filteredAnimals.length.toLocaleString()} animals`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            {matrixView === 'site' ? (
              <TableSearch value={matrixQ} onChange={setMatrixQ} placeholder='Search site…' />
            ) : (
              <>
                <Autocomplete
                  size='small'
                  options={siteOptions}
                  value={siteFilter}
                  onChange={(_e, v) => {
                    setSiteFilter(v)
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                  sx={{ width: 220 }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder='All sites'
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, color: c.Outline }}>
                            <Icon icon='mdi:map-marker-outline' fontSize='1.15rem' />
                          </Box>
                        )
                      }}
                      sx={{ bgcolor: 'background.paper', borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: c.SurfaceVariant } }}
                    />
                  )}
                />
                <TableSearch value={animalQ} onChange={setAnimalQ} placeholder='Search animal…' />
              </>
            )}
            <ViewToggle view={matrixView} onChange={setMatrixView} options={MATRIX_VIEW_OPTIONS} />
          </Box>
        }
        titleMb={4}
      >
        {/* Stable height so switching Site-wise ⇄ Animal-wise doesn't make the card jump. */}
        <Box sx={{ minHeight: 560 }}>
          {matrixView === 'site' ? (
            matrixSites.length ? (
              <>
                <SiteMatrix sites={matrixSites} overdueLabel={w.overdueLabel} onRow={setSiteDrill} />
                {worst && (
                  <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: 2 }}>
                    <Box component='span' sx={{ color: c.Tertiary, fontWeight: 700 }}>
                      {worst.site}
                    </Box>
                    {insightTail}
                  </Typography>
                )}
              </>
            ) : (
              <EmptyState message='No site data for this species' />
            )
          ) : filteredAnimals.length ? (
            // CommonTable carries a built-in mt:5; zero it so the only top gap is the 16px titleMb (matches the matrix).
            <Box sx={{ '& .MuiDataGrid-root': { marginTop: '0 !important' } }}>
              <DetailTable columns={animalColumns} rows={pageRows} total={filteredAnimals.length} paginationModel={pm} setPaginationModel={setPm} />
            </Box>
          ) : (
            <EmptyState message='No animals for this filter' />
          )}
        </Box>
      </SectionCard>

      <SiteDrillDrawer site={siteDrill} records={prog.records} overdueWord={w.overdueWord} onClose={() => setSiteDrill(null)} />
    </Box>
  )
}

/**
 * Type list for the stat-tile side sheet, rendered with the standard antz DetailTable (DataGrid):
 * Symptom · Records · Animals · Recurrence, sortable headers, standard row height/colours.
 * Every row is clickable → filters the animal table.
 */
const TypeTable: React.FC<{
  items: { name: string; count: number; animals: number }[]
  noun: string
  onPick: (name: string) => void
}> = ({ items, noun, onPick }) => {
  const { txt, c, theme } = useCells()
  const rows = useMemo(
    () => items.map((d, i) => ({ id: i, order: i, name: d.name, count: d.count, animals: d.animals, ratio: d.count / Math.max(1, d.animals) })),
    [items]
  )
  const tbl = useSortableTable(rows, { field: 'order', sort: 'asc' })

  const columns: GridColDef[] = [
    { field: 'name', headerName: noun === 'symptoms' ? 'Symptom' : 'Assessment', flex: 1, minWidth: 200, renderCell: p => txt(p.row.name, undefined, 600) },
    {
      field: 'count',
      headerName: 'Records',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(p.row.count.toLocaleString(), undefined, 700)
    },
    {
      field: 'animals',
      headerName: 'Animals',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(p.row.animals.toLocaleString(), c.neutralSecondary, 600)
    },
    {
      field: 'ratio',
      headerName: 'Recurrence',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(`${p.row.ratio.toFixed(1)}×`, theme.palette.primary.dark, 700)
    }
  ]

  if (!items.length) {
    return (
      <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
        No {noun} in this group.
      </Typography>
    )
  }

  return (
    <DetailTable
      columns={columns}
      rows={tbl.rows}
      total={tbl.total}
      paginationModel={tbl.paginationModel}
      setPaginationModel={tbl.setPaginationModel}
      sortModel={tbl.sortModel}
      handleSortModel={tbl.handleSortModel}
      onRowClick={p => onPick(p.row.name)}
    />
  )
}

/* ═══════════════════════════════════════════════ Clinical panel (symptoms/diagnosis) */
const ClinicalPanel: React.FC<{ tab: TabKey; prog: ClinicalProgram; range: RangeSelection; animalCount?: number }> = ({ tab, prog, range, animalCount = 0 }) => {
  const { txt, animalCell, c, theme } = useCells()
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState<{ idx: number; y: number; m: number; label: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'active' | 'longopen' | null>(null)
  const [drawerScope, setDrawerScope] = useState<'all' | 'active' | 'longopen' | 'recurring' | null>(null)
  const [view, setView] = useState<'animal' | 'record'>('animal')
  const tableRef = useRef<HTMLDivElement>(null)
  const [animalDrill, setAnimalDrill] = useState<AniGroup | null>(null)
  const [q, setQ] = useState('')
  const inWin = useWindow(range)
  const all = range.preset === 'all'
  const isDiag = tab === 'diagnosis'
  const noun = isDiag ? 'clinical assessments' : 'symptoms'
  const typeCol = isDiag ? 'Clinical Assessment' : 'Symptom'

  // Window records by report/diagnosis date; 'All time' keeps the precomputed aggregates.
  const windowed = useMemo(() => (all ? prog.records : prog.records.filter(r => inWin(r.date))), [prog.records, all, range])
  const activeRecs = windowed.filter(r => r.status === 'active')
  const s = all
    ? prog.summary
    : {
        types: new Set(windowed.map(r => r.type)).size,
        active: activeRecs.length,
        resolved: windowed.length - activeRecs.length,
        animalsAffected: new Set(windowed.map(r => r.aid)).size,
        avgResolutionDays: (() => {
          const res = windowed.filter(r => r.status === 'resolved')

          return res.length ? Math.round(res.reduce((a, r) => a + r.durationDays, 0) / res.length) : 0
        })()
      }
  const topTypes = all ? prog.topTypes : rankBy(windowed, 'type')
  const statusMix = { active: s.active, resolved: s.resolved }
  const prognosisMix = all
    ? prog.prognosisMix
    : ['Favourable', 'Guarded', 'Poor']
        .map(name => ({ name, count: activeRecs.filter(r => r.prognosis === name).length }))
        .filter(p => p.count > 0)
  const trend = all ? prog.trend : monthlyTrend(windowed, new Date())

  // ── Symptom-tab management metrics ──────────────────────────────────────────
  // "Most common" = breadth (affects the most distinct animals); "Most recurring" = intensity
  // (episodes per animal) — a genuinely different, chronic-care signal. "Long-open" = neglect.
  const commonTypes = isDiag ? topTypes : [...topTypes].sort((a, b) => (b.animals ?? b.count) - (a.animals ?? a.count))
  const mostRecurring = isDiag
    ? null
    : topTypes
        .filter(t => (t.animals ?? 0) >= 2)
        .map(t => ({ name: t.name, animals: t.animals ?? 0, ratio: t.count / (t.animals ?? 1) }))
        .sort((a, b) => b.ratio - a.ratio)[0] ?? null
  const longOpen = activeRecs.filter(r => r.durationDays > 30).length
  const prevalencePct = animalCount ? Math.round((s.animalsAffected / animalCount) * 100) : 0
  const newThisMonth = trend.length ? trend[trend.length - 1].value : 0
  const prevMonth = trend.length > 1 ? trend[trend.length - 2].value : 0
  const monthDelta = newThisMonth - prevMonth

  // Trend bars = trailing 12 months. Clicking one filters the list to that calendar month;
  // clicking the active bar clears it. Bars are dimmed except the selected one.
  const onTrendBar = (i: number) => {
    const now = new Date()
    const monthsAgo = trend.length - 1 - i
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    setMonthFilter(prev =>
      prev && prev.idx === i ? null : { idx: i, y: d.getFullYear(), m: d.getMonth(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
    )
  }
  const inMonth = (dateStr: string) => {
    if (!monthFilter) return true
    const d = new Date(dateStr)

    return d.getFullYear() === monthFilter.y && d.getMonth() === monthFilter.m
  }
  const inStatus = (r: ClinicalRecord) =>
    !statusFilter || (statusFilter === 'active' ? r.status === 'active' : r.status === 'active' && r.durationDays > 30)

  // Records after the status/type/month scoping (drives both the record table and the animal grouping).
  const scopedRecords = useMemo(() => {
    let s = statusFilter ? windowed.filter(inStatus) : windowed
    if (typeFilter) s = s.filter(r => r.type === typeFilter)
    if (monthFilter) s = s.filter(r => inMonth(r.date))

    return s
  }, [windowed, statusFilter, typeFilter, monthFilter])

  const rows = useMemo(() => (q.trim() ? scopedRecords.filter(r => matchesQuery(r, q)) : scopedRecords), [scopedRecords, q])
  const animalRows = useMemo(() => {
    const grouped = groupByAnimal(scopedRecords, 'date', 'active')

    return q.trim() ? grouped.filter(g => matchesQuery(g, q)) : grouped
  }, [scopedRecords, q])

  // Side-sheet contents for a clicked stat tile: symptom types within that tile's population.
  const STATUS_META = { active: 'active over 12 months', longopen: 'active over 30 days', recurring: 'ranked by recurrence', all: '' } as const
  const drawerData = useMemo(() => {
    if (!drawerScope) return null
    const recs =
      drawerScope === 'active'
        ? windowed.filter(r => r.status === 'active')
        : drawerScope === 'longopen'
        ? windowed.filter(r => r.status === 'active' && r.durationDays > 30)
        : windowed
    let ranked = rankBy(recs, 'type')
    if (drawerScope === 'recurring') ranked = [...ranked].sort((a, b) => b.count / Math.max(1, b.animals) - a.count / Math.max(1, a.animals))
    else if (drawerScope === 'all') ranked = [...ranked].sort((a, b) => b.animals - a.animals)
    const title =
      drawerScope === 'active'
        ? `Active ${noun}`
        : drawerScope === 'longopen'
        ? `Long-open ${noun}`
        : drawerScope === 'recurring'
        ? `${isDiag ? 'Clinical assessments' : 'Symptoms'} by recurrence`
        : `All ${noun}`

    return { title, ranked, hint: STATUS_META[drawerScope], scope: drawerScope }
  }, [drawerScope, windowed, isDiag, noun])

  // Clicking a symptom in a tile's side sheet → filter the animal table (type + the tile's status
  // scope), close the sheet, and scroll down to the table.
  const pickFromDrawer = (label: string) => {
    setTypeFilter(label)
    setStatusFilter(drawerScope === 'active' ? 'active' : drawerScope === 'longopen' ? 'longopen' : null)
    setDrawerScope(null)
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const tbl = useSortableTable(rows, { field: 'date', sort: 'desc' })
  const atbl = useSortableTable(animalRows, { field: 'active', sort: 'desc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
    atbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }

  const progColor = (p?: string) =>
    p === 'Favourable' ? theme.palette.primary.dark : p === 'Guarded' ? c.Tertiary : p === 'Poor' ? c.Tertiary : c.neutralSecondary

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    { field: 'type', headerName: typeCol, flex: 1, minWidth: 220, renderCell: p => txt(p.row.type, undefined, 500) },
    ...(isDiag
      ? [
          {
            field: 'prognosis',
            headerName: 'Prognosis',
            width: 140,
            renderCell: (p: any) => txt(p.row.prognosis || '—', progColor(p.row.prognosis), 600)
          } as GridColDef
        ]
      : []),
    { field: 'date', headerName: isDiag ? 'Diagnosed' : 'Reported', width: 150, renderCell: p => txt(fmtDate(p.row.date), c.neutralSecondary) },
    { field: 'durationDays', headerName: 'Duration', width: 140, renderCell: p => txt(`${p.row.durationDays}d`, c.neutralSecondary) },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => <StatusChip label={p.row.status === 'active' ? 'Active' : 'Resolved'} tone={p.row.status === 'active' ? 'error' : 'success'} />
    }
  ]

  const animalColumns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    { field: 'types', headerName: 'Conditions', flex: 1, minWidth: 240, sortable: false, renderCell: p => <TypeChips types={p.row.types} /> },
    { field: 'active', headerName: 'Active', width: 120, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.active, p.row.active ? c.Tertiary : c.neutralSecondary, 700) },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => (p.row.active ? <StatusChip label='Active' tone='error' /> : <StatusChip label='Recovered' tone='success' />)
    }
  ]

  const donutSegments = isDiag && prognosisMix?.length
    ? prognosisMix.map(p => ({ label: p.name, value: p.count, tone: (p.name === 'Favourable' ? 'success' : 'error') as any }))
    : [
        { label: 'Resolved', value: statusMix.resolved, tone: 'success' as const },
        { label: 'Active', value: statusMix.active, tone: 'error' as const }
      ]
  const donutTotal = donutSegments.reduce((a, b) => a + b.value, 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Row 1 · stats */}
      <StatsRow cols={isDiag ? 5 : 4}>
        {isDiag ? (
          <>
            <StatTile label={`${typeCol} Types`} value={s.types} tone='neutral' />
            <StatTile label='Active' value={s.active.toLocaleString()} tone='error' />
            <StatTile label='Resolved (12 mo)' value={s.resolved.toLocaleString()} tone='success' />
            <StatTile label='Avg Resolution' value={`${s.avgResolutionDays ?? 0}d`} tone='info' />
            <StatTile label='Animals Affected' value={s.animalsAffected.toLocaleString()} tone='neutral' />
          </>
        ) : (
          <>
            <StatTile label='Active' value={s.active.toLocaleString()} tone='error' onClick={() => setDrawerScope('active')} />
            <StatTile label='Animals Affected' value={s.animalsAffected.toLocaleString()} tone='neutral' onClick={() => setDrawerScope('all')} />
            <StatTile
              label='Most Recurring'
              value={
                <Box component='span' sx={{ display: 'inline-block', fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.25, whiteSpace: 'normal' }}>
                  {mostRecurring?.name ?? '—'}
                </Box>
              }
              tone='warning'
              onClick={() => setDrawerScope('recurring')}
            />
            <StatTile label='Long-open Cases' value={longOpen.toLocaleString()} tone='error' onClick={() => setDrawerScope('longopen')} />
          </>
        )}
      </StatsRow>

      {/* Row 2 · charts */}
      <ChartsRow md='repeat(3, 1fr)'>
        <SectionCard title={isDiag ? `Most common ${noun}` : 'Most widespread symptoms'} titleMb={2}>
          {commonTypes.length ? (
            <>
              <RankedList items={commonTypes.map(t => ({ label: t.name, count: isDiag ? t.count : t.animals ?? t.count }))} onItem={setTypeFilter} limit={5} />
              {commonTypes.length > 5 && (
                <Box
                  onClick={() => setDrawerScope('all')}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5, cursor: 'pointer', color: theme.palette.secondary.main }}
                >
                  <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                    View all {commonTypes.length} {noun}
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize={16} />
                </Box>
              )}
            </>
          ) : (
            <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
              No records.
            </Typography>
          )}
        </SectionCard>

        <SectionCard title={isDiag ? 'Prognosis mix' : 'Active vs resolved'} titleMb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Donut
              segments={donutSegments}
              centerValue={donutTotal.toLocaleString()}
              centerSub={isDiag ? 'open' : 'records'}
              size={188}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {donutSegments.map(seg => (
                <Box key={seg.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '3px',
                      bgcolor: seg.tone === 'success' ? theme.palette.primary.main : c.Tertiary
                    }}
                  />
                  <Typography variant='body2'>
                    {seg.label}{' '}
                    <Box component='span' sx={{ fontWeight: 700 }}>
                      {seg.value.toLocaleString()}
                    </Box>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title={`${isDiag ? 'Clinical Assessments' : 'Reports'} over time`} titleMb={2}>
          <ColumnTrend data={trend} tone='info' height={195} showValues onBarClick={onTrendBar} activeIndex={monthFilter?.idx ?? null} />
        </SectionCard>
      </ChartsRow>

      {/* Row 3 · standard DataGrid */}
      <Box ref={tableRef}>
      <SectionCard
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {view === 'animal' ? `Animals · ${animalRows.length.toLocaleString()}` : `Records · ${rows.length.toLocaleString()}`}
            </Typography>
            {statusFilter && (
              <FilterChip label={statusFilter === 'active' ? 'Active' : 'Long-open (>30d)'} onClear={() => setStatusFilter(null)} />
            )}
            {typeFilter && <FilterChip label={typeFilter} onClear={() => setTypeFilter(null)} />}
            {monthFilter && <FilterChip label={monthFilter.label} onClear={() => setMonthFilter(null)} />}
            {(typeFilter || monthFilter || statusFilter) && (
              <Typography
                variant='caption'
                onClick={() => {
                  setTypeFilter(null)
                  setMonthFilter(null)
                  setStatusFilter(null)
                }}
                sx={{ color: theme.palette.secondary.main, cursor: 'pointer', fontWeight: 600 }}
              >
                Clear
              </Typography>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ViewToggle view={view} onChange={setView} />
            <TableSearch value={q} onChange={onQ} placeholder='Search animal, site…' />
          </Box>
        }
        titleMb={2}
      >
        {view === 'animal' ? (
          <DetailTable
            columns={animalColumns}
            rows={atbl.rows}
            total={atbl.total}
            paginationModel={atbl.paginationModel}
            setPaginationModel={atbl.setPaginationModel}
            sortModel={atbl.sortModel}
            handleSortModel={atbl.handleSortModel}
            onRowClick={(p: { row: AniGroup }) => setAnimalDrill(p.row)}
          />
        ) : (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
          />
        )}
      </SectionCard>
      </Box>

      <AnimalRecordsDrawer group={animalDrill} onClose={() => setAnimalDrill(null)} mode='clinical' isDiag={isDiag} />

      {/* side sheet · symptom types for the clicked stat tile (scoped) */}
      <Drawer
        anchor='right'
        open={!!drawerData}
        onClose={() => setDrawerScope(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 620 }, maxWidth: '100%' } }}
      >
        {drawerData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 5, py: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', color: c.OnSurfaceVariant }} noWrap>
                  {drawerData.title}
                </Typography>
              </Box>
              <IconButton onClick={() => setDrawerScope(null)} size='small'>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 3 }}>
              <TypeTable items={drawerData.ranked} noun={noun} onPick={pickFromDrawer} />
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  )
}

/* ═══════════════════════════════════════════════ Tab bar + shell */
const SubTabs: React.FC<{ tab: TabKey; onChange: (t: TabKey) => void }> = ({ tab, onChange }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {TABS.map(t => {
        const on = t.key === tab

        return (
          <Box
            key={t.key}
            onClick={() => onChange(t.key)}
            role='tab'
            aria-selected={on}
            sx={{ py: 1.5, mb: '-1px', borderBottom: '2.5px solid', borderColor: on ? theme.palette.primary.main : 'transparent', cursor: 'pointer' }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: on ? theme.palette.primary.dark : c.neutralSecondary }}>
              {t.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

interface Props {
  preventive?: SpeciesPreventive | null
  clinical?: SpeciesClinical | null
}

const MedicalTab: React.FC<Props> = ({ preventive, clinical }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<TabKey>('overview')
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })

  const renderPanel = () => {
    if (tab === 'overview') return <OverviewPanel preventive={preventive} clinical={clinical} range={range} onGoToTab={setTab} />

    if (tab === 'symptoms' || tab === 'diagnosis') {
      const prog = clinical?.programs?.[tab]
      if (!prog || (!prog.records.length && !prog.summary.animalsAffected)) return <EmptyState message={`No ${tab} data for this species`} />

      return <ClinicalPanel key={tab} tab={tab} prog={prog} range={range} animalCount={clinical?.animalCount ?? 0} />
    }

    const prog = preventive?.programs?.[tab]
    if (!prog || !prog.summary.animalsTracked) return <EmptyState message='No preventive-care data for this species' />

    return <PreventivePanel key={tab} tab={tab} prog={prog} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', borderBottom: `1px solid ${c.SurfaceVariant}` }}>
        <SubTabs tab={tab} onChange={setTab} />
        <Box sx={{ pb: 1.5 }}>
          <DashboardDateRange value={range} onChange={setRange} />
        </Box>
      </Box>
      {renderPanel()}
    </Box>
  )
}

export default MedicalTab
