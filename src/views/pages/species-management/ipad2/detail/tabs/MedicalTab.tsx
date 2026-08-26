'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, Box, IconButton, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import type {
  PreventiveDoseSpec,
  PreventiveProgram,
  PreventiveType,
  PreventiveTypeAnimal,
  PreventiveTypeSite,
  PreventiveTypeStatus,
  SpeciesPreventive
} from 'src/lib/api/species-management/detail'
import type { ClinicalProgram, ClinicalRecord, SpeciesClinical } from 'src/lib/api/species-management/detail'
import {
  CategoryFilter,
  AnimalCell,
  CellText,
  DetailTable,
  sheetPaperSx,
  SHEET_PX,
  EmptyState,
  FilterChip,
  SeasonalColumnChart,
  SectionCard,
  Sheet,
  SheetEmpty,
  SheetFilterBar,
  SheetHeader,
  SheetRow,
  SheetSearch,
  SheetSection,
  SheetTabs,
  SheetStats,
  StatTile,
  StatusChip,
  thinScrollbarSx,
  TrendAreaChart,
  TrendRangeTabs
, SheetDrawer} from 'src/views/pages/species-management/ipad2/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad2/detail/useSortableTable'
// App-standard filter drawer (the hospital Add-Patient animal-picker filter) — reused as-is.
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { FilterButton } from 'src/views/utility/render-snippets'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/ipad2/dashboard/DashboardDateRange'
import { computeHotspots, computeOverviewSignals, INSIGHT_THRESHOLDS, type HealthSignal } from './medical/signals'
import {
  buildPrescriptionProgram,
  rollupAnimals,
  type RxAnimalRollup,
  type RxMedicine,
  type RxMissedDose,
  type RxProgram
} from './medical/prescription'
import SignalsBand from './medical/SignalsBand'
import SickTrendCard from './medical/SickTrendCard'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
import InsightsPanel from './medical/InsightsPanel'

type TabKey = 'overview' | 'insights' | 'clinical' | 'vaccination' | 'deworming' | 'supplements' | 'prescription'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ── merged Clinical domain model (Symptoms + Clinical Assessment in one tab) ── */
type Domain = 'symptom' | 'assessment'
type DomainTab = 'all' | Domain
interface MergedRec extends ClinicalRecord {
  domain: Domain
}

const DOMAIN_META: Record<Domain, { label: string; icon: string }> = {
  symptom: { label: 'Symptom', icon: 'mdi:emoticon-sad-outline' },
  assessment: { label: 'Assessment', icon: 'mdi:stethoscope' }
}

// Gravest first — index 0 wins when picking a condition's "worst active prognosis" dot.
const PROGNOSIS_ORDER = ['Grave', 'Poor', 'Doubtful', 'Guarded', 'Favourable']
const SEVERITY_ORDER = ['High', 'Medium', 'Low']

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

/** Distinct animals per month over the trailing `months` — drives the per-type graph sheet. */
const monthlyAnimals = (rows: ClinicalRecord[], now: Date, months = 12) => {
  const buckets: { label: string; value: number }[] = []
  const sets: Record<string, Set<string>> = {}
  const idx: Record<string, number> = {}
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    idx[k] = buckets.length
    sets[k] = new Set()
    buckets.push({ label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, value: 0 })
  }
  for (const r of rows) {
    const d = new Date(r.date)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (idx[k] != null) sets[k].add(r.aid)
  }
  for (const k in idx) buckets[idx[k]].value = sets[k].size

  return buckets
}

/** Bar index (0 = 11 months ago … len-1 = current) → the calendar month it represents. */
const monthForBar = (i: number, len: number, now: Date) => {
  const monthsAgo = len - 1 - i
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)

  return { y: d.getFullYear(), m: d.getMonth(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'insights', label: 'Insights' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'vaccination', label: 'Vaccination' },
  { key: 'deworming', label: 'Deworming' },
  { key: 'supplements', label: 'Supplements' },
  { key: 'prescription', label: 'Prescription' }
]

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

// pill/dot label → [bg, border] from the medical-tag theme tokens (the Figma tag ramp).
const medTagMap = (c: Record<string, string>): Record<string, [string, string]> => ({
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
})

/** Severity/prognosis tag pill in the exact Figma medTag colours (shared by drawers + the Clinical table). */
const MedTagPill: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [bg, border] = medTagMap(c)[label] || [c.Surface, c.OutlineVariant]
  const text = label === 'Grave' ? c.medTagMaroonBorder : theme.palette.common.black

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: '10px', py: '4px', borderRadius: 999, backgroundColor: bg, border: `0.5px solid ${border}`, whiteSpace: 'nowrap' }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: text }}>{label}</Typography>
    </Box>
  )
}

/**
 * Condition tag: medTag colour = the record's severity (symptom) / prognosis (assessment),
 * domain icon inside the tag, tooltip spells it out ("Symptom · High"). No separate level column.
 */
const MedTagChip: React.FC<{ name: string; domain: Domain; level?: string }> = ({ name, domain, level }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [bg, border] = (level && medTagMap(c)[level]) || [c.Surface, c.OutlineVariant]
  const text = level === 'Grave' ? c.medTagMaroonBorder : theme.palette.common.black
  const meta = DOMAIN_META[domain]

  return (
    <Tooltip title={`${meta.label}${level ? ' • ' + level : ''}`} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: '10px', py: '4px', borderRadius: 999, backgroundColor: bg, border: `0.5px solid ${border}`, whiteSpace: 'nowrap' }}>
        <Icon icon={meta.icon} fontSize='0.95rem' color={text} />
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: text }}>{name}</Typography>
      </Box>
    </Tooltip>
  )
}

/** Distinct condition tags for one animal in one domain, each at its worst ACTIVE level (fallback: worst ever). */
const worstOf = (recs: MergedRec[], domain: Domain): { name: string; level?: string }[] => {
  const order = domain === 'symptom' ? SEVERITY_ORDER : PROGNOSIS_ORDER
  const act: Record<string, number> = {}
  const any: Record<string, number> = {}
  const names: string[] = []
  for (const r of recs) {
    if (r.domain !== domain) continue
    if (!names.includes(r.type)) names.push(r.type)
    const lvl = domain === 'symptom' ? r.severity : r.prognosis
    const rk = lvl ? order.indexOf(lvl) : -1
    if (rk < 0) continue
    if (any[r.type] == null || rk < any[r.type]) any[r.type] = rk
    if (r.status === 'active' && (act[r.type] == null || rk < act[r.type])) act[r.type] = rk
  }

  return names.map(n => {
    const rk = act[n] ?? any[n]

    return { name: n, level: rk == null ? undefined : order[rk] }
  })
}

/** First `max` condition tags (≤2 rows worst case) + "+N more" for an animal-wise cell. */
const ChipsCell: React.FC<{ chips: { name: string; level?: string }[]; domain: Domain; max?: number }> = ({ chips, domain, max = 2 }) => {
  const c = cc(useTheme() as any)
  const shown = chips.slice(0, max)
  const extra = chips.length - shown.length

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', py: 1 }}>
      {shown.map(t => (
        <MedTagChip key={t.name} name={t.name} domain={domain} level={t.level} />
      ))}
      {extra > 0 && (
        <Typography variant='caption' sx={{ color: c.neutralSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>
          +{extra} more
        </Typography>
      )}
    </Box>
  )
}

// Same branding mark the other detail tables use for the animal identity cell.

const fmtDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)

  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * 86400000).toISOString().slice(0, 10)

/* ── shared cell renderers (avatar + name/AID, matches Assessments) ───────── */
const useCells = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  const txt = (v: React.ReactNode, color?: string, weight = 400) => (
    <CellText color={color} weight={weight} noWrap>
      {v}
    </CellText>
  )

  // Animal identity cell — delegates to the shared AnimalCell (single copy in detailUi).
  const animalCell = (name?: string, site?: string) => <AnimalCell name={name} sub={site} />

  return { txt, animalCell, c, theme }
}

/* ── layout helpers ───────────────────────────────────────────────────────── */
const StatsRow: React.FC<{ children: React.ReactNode; cols?: number }> = ({ children, cols = 4 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${cols}, 1fr)` }, gap: 3 }}>{children}</Box>
)

const ChartsRow: React.FC<{ children: React.ReactNode; md?: string }> = ({ children, md = 'repeat(2, 1fr)' }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md }, gap: 4 }}>{children}</Box>
)

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
  { key: 'animal', label: 'Animal-Wise', icon: 'mdi:paw' },
  { key: 'record', label: 'Record-Wise', icon: 'mdi:format-list-bulleted' }
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
export const TableSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; width?: number; height?: number; grow?: boolean }> = ({
  value,
  onChange,
  placeholder = 'Search…',
  width = 240,
  height = TABLE_CTRL_H,
  // grow: fill the available row width (portrait two-row headers) instead of the fixed width.
  grow = false
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <TextField
      size='small'
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      sx={{ ...(grow ? { flex: '1 1 auto', minWidth: 0 } : { width }), maxWidth: '100%', '& .MuiInputBase-root': { height, bgcolor: theme.palette.background.paper } }}
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

/** Per-animal side sheet: that animal's full clinical timeline (symptoms + assessments). */
const AnimalRecordsDrawer: React.FC<{
  group: AniGroup | null
  onClose: () => void
}> = ({ group, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const sorted = group ? [...group.records].sort((a, b) => (a.date < b.date ? 1 : -1)) : []

  return (
    <SheetDrawer open={!!group} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {group && (
        <Sheet>
          <SheetHeader avatar title={group.name} subtitle={`${group.site} • ${group.enclosure}`} onClose={onClose} />
          <Box sx={{ px: SHEET_PX, py: 2, borderBottom: `1px solid ${c.Surface}` }}>
            <SheetStats
              items={[
                { label: 'Records', value: group.count },
                { label: 'Active', value: group.active }
              ]}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {sorted.map((r, i) => {
              const meta = DOMAIN_META[r.domain as Domain]
              const level = r.domain === 'assessment' ? r.prognosis : r.severity

              return (
                <SheetRow
                  key={i}
                  icon={meta?.icon || 'mdi:medical-bag'}
                  title={r.type}
                  caption={fmtDate(r.date)}
                  last={i === sorted.length - 1}
                  trailing={
                    <>
                      {level && <MedTagPill label={level} />}
                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: r.status === 'active' ? c.Tertiary : theme.palette.primary.dark }}>
                        {r.status === 'active' ? 'Active' : 'Resolved'}
                      </Typography>
                    </>
                  }
                />
              )
            })}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
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
  status: 'Healthy' | 'Needs Attention' | 'Critical'
  events: { domain: string; type: string; date: string; status: string; days?: number; lastGiven?: string; prognosis?: string; severity?: string; durationDays?: number; outcome?: 'died' }[]
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
      g.events.push({ domain: label, type: r.type, date: r.date, status: r.status, prognosis: r.prognosis, severity: r.severity, durationDays: r.durationDays, outcome: r.outcome })
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
    g.status = critical ? 'Critical' : g.activeClinical > 0 || g.overdue > 0 ? 'Needs Attention' : 'Healthy'
    g.score = (critical ? 1000 : 0) + g.activeClinical * 10 + g.overdue
  }

  return [...m.values()]
}

const PROGRAM_ICONS: Record<'vaccination' | 'deworming' | 'supplements', string> = {
  vaccination: 'mdi:needle',
  deworming: 'mdi:pill',
  supplements: 'mdi:water'
}

/* Overdue-preventive stat-grid: program · total · four day-buckets · chevron */
const OVERDUE_GRID = 'minmax(200px, 1.4fr) repeat(5, 1fr) 24px'
const overdueHd = (c: Record<string, string>) => ({
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  textAlign: 'right' as const,
  color: c.neutralSecondary
})

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
  const pillFor = (e: OviAnimal['events'][number]): string | null => {
    if (META[e.domain]?.preventive) return e.status === 'overdue' ? 'Overdue' : 'Upcoming'
    if (e.domain === 'Symptom') return e.severity || null // severity: Low/Medium/High
    return e.prognosis || null // Clinical Assessment → prognosis
  }
  // Only ACTIVE items belong here: active clinical/symptom, and all preventive (overdue/upcoming).
  const shown = events.filter(e => META[e.domain]?.preventive || e.status === 'active')

  // Closed clinical cases (newest first — `events` is already sorted). Preventive never resolves.
  const history = events.filter(e => !META[e.domain]?.preventive && e.status === 'resolved')

  // Condition → occurrences in the window (all statuses) — drives the quiet ×N repeat marker.
  const typeCounts = new Map<string, number>()
  for (const e of events) {
    if (!META[e.domain]?.preventive) typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1)
  }

  return (
    <SheetDrawer open={!!group} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {group && (
        <Sheet>
          <SheetHeader avatar title={group.name} subtitle={`${group.site} • ${group.enclosure}`} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            <SheetSection
              first
              label='Active Care & Health'
              noDivider={history.length === 0}
              chip={
                <StatusChip
                  label={group.status}
                  tone={group.status === 'Critical' ? 'error' : group.status === 'Needs Attention' ? 'warning' : 'success'}
                />
              }
            >
              {shown.map((e, i) => {
                const m = META[e.domain]
                const label = pillFor(e)

                return (
                  <SheetRow
                    key={i}
                    icon={m?.icon || 'mdi:medical-bag'}
                    title={e.type}
                    titleCount={m?.preventive ? undefined : typeCounts.get(e.type)}
                    caption={e.domain}
                    last={i === shown.length - 1}
                    trailing={
                      <>
                        {label && <MedTagPill label={label} />}
                        <Typography sx={{ fontSize: '14px', color: c.Outline }}>{fmtDate(e.date)}</Typography>
                      </>
                    }
                  />
                )
              })}
              {shown.length === 0 && <SheetEmpty>No active care or health items.</SheetEmpty>}
            </SheetSection>
            {history.length > 0 && (
              <SheetSection label='Resolved' noDivider>
                {history.map((e, i) => (
                  <SheetRow
                    key={i}
                    icon={META[e.domain]?.icon || 'mdi:medical-bag'}
                    title={e.type}
                    titleCount={typeCounts.get(e.type)}
                    caption={e.domain}
                    when={
                      e.outcome === 'died'
                        ? fmtDate(e.date)
                        : `${fmtDate(e.date)} → ${fmtDate(addDays(e.date, e.durationDays ?? 0))}`
                    }
                    durationLabel={e.outcome === 'died' ? undefined : `${e.durationDays ?? 0} d`}
                    last={i === history.length - 1}
                    trailing={e.outcome === 'died' ? <MedTagPill label='Died' /> : undefined}
                  />
                ))}
              </SheetSection>
            )}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

const OverviewPanel: React.FC<{
  preventive?: SpeciesPreventive | null
  clinical?: SpeciesClinical | null
  range: RangeSelection
  onRange: (r: RangeSelection) => void
  onGoToTab: (t: TabKey) => void
}> = ({ preventive, clinical, range, onRange, onGoToTab }) => {
  const { c, theme } = useCells()
  const inWin = useWindow(range)
  const [drill, setDrill] = useState<OviAnimal | null>(null)
  const [signalDrill, setSignalDrill] = useState<SignalDrawerPayload | null>(null)

  const groups = useMemo(() => buildRollup(clinical, preventive, inWin), [clinical, preventive, range])

  // The three big attention cards (2026-07-30 review: "two-three critical things, big cards").
  const signals = useMemo(() => computeOverviewSignals(clinical, inWin), [clinical, range])

  const openSignal = (sig: HealthSignal) =>
    setSignalDrill({
      title: sig.label,
      explainer: sig.explainer,
      icon: sig.icon,
      tone: sig.key === 'severe' ? 'error' : 'neutral',
      animals: sig.animals
    })

  // Signal drawer row → the animal's combined care/health timeline (stacks over the signal sheet).
  const openSignalAnimal = (aid: string) => {
    const g = groups.find(x => x.aid === aid)
    if (g) setDrill(g)
  }

  /* verdict headline — currently-sick animals, worst first; the number opens the list */
  const sickNow = useMemo(
    () => groups.filter(g => g.activeClinical > 0).sort((a, b) => b.score - a.score),
    [groups]
  )
  const openSickNow = () =>
    sickNow.length &&
    setSignalDrill({
      title: 'Sick Right Now',
      explainer: 'Animals with an active symptom or clinical assessment in this window.',
      icon: 'mdi:heart-pulse',
      tone: 'error',
      animals: sickNow.map(g => ({
        aid: g.aid,
        name: g.name,
        site: g.site,
        enclosure: g.enclosure,
        condition: g.activeTypes.join(', '),
        detail: g.activeClinical > 1 ? `${g.activeClinical} active conditions` : '',
        pill: g.status === 'Critical' ? 'Critical' : 'Active',
        pillTone: g.status === 'Critical' ? ('error' as const) : ('warning' as const),
        date: g.latest
      }))
    })

  /* overdue preventive care — distinct animals per program, bucketed by how long overdue
     (worst overdue date per animal, so a row's buckets sum to its total) */
  const overdueRows = useMemo(
    () =>
      PREVENTIVE_DOMAINS.map(({ key, label }) => {
        const recs = (preventive?.programs?.[key]?.records ?? []).filter(r => r.status === 'overdue' && inWin(r.due))
        const worstByAid = new Map<string, number>()
        for (const r of recs) worstByAid.set(r.aid, Math.max(worstByAid.get(r.aid) ?? 0, r.days))
        const b = { d30: 0, d31: 0, d61: 0, d90: 0 } // 0–30 · 31–60 · 61–90 · 90+
        for (const d of worstByAid.values()) {
          if (d > 90) b.d90++
          else if (d > 60) b.d61++
          else if (d > 30) b.d31++
          else b.d30++
        }

        return { key, label, animals: worstByAid.size, b }
      }),
    [preventive, range]
  )

  /* site concentration — Insights hotspot rule; the trend-card strip renders only when a site runs hot */
  const hotspots = useMemo(() => computeHotspots(clinical, inWin), [clinical, range])
  const hotSites = useMemo(
    () =>
      hotspots.rows
        .filter(
          r =>
            (r.sickAnimals ?? 0) >= INSIGHT_THRESHOLDS.hotspotMinSick &&
            r.value >= hotspots.avg * INSIGHT_THRESHOLDS.hotspotHotMult
        )
        .map(r => ({ site: r.label, count: r.sickAnimals ?? 0 })),
    [hotspots]
  )
  const allSiteAnimals = useMemo(() => hotspots.rows.flatMap(r => r.animals), [hotspots])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1 · verdict headline — the page's only stat; the number is the call to action.
          The period control rides this row (Hospital pattern), not the tab bar. */}
      <Box
        sx={{ pt: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}
      >
        <Typography
          sx={{ fontSize: { xs: '24px', md: '30px' }, fontWeight: 800, lineHeight: 1.25, color: c.OnSurfaceVariant }}
        >
          {sickNow.length ? (
            <>
              <Box
                component='span'
                onClick={openSickNow}
                sx={{
                  color: c.Tertiary,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '6px',
                  textDecorationThickness: '2.5px',
                  whiteSpace: 'nowrap',
                  '&:hover': { opacity: 0.85 }
                }}
              >
                {sickNow.length.toLocaleString()} {sickNow.length === 1 ? 'Animal' : 'Animals'}
                <Icon icon='mdi:chevron-right' fontSize={26} style={{ verticalAlign: '-4px' }} />
              </Box>{' '}
              {sickNow.length === 1 ? 'Is' : 'Are'} Sick Right Now
            </>
          ) : (
            'No Animals Are Sick Right Now'
          )}
        </Typography>
        <DashboardDateRange value={range} onChange={onRange} />
      </Box>

      {/* 2 · three big attention cards */}
      <SignalsBand signals={signals} onOpen={openSignal} />

      {/* 3 · overdue preventive care — stat-grid table (V1): big numbers under quiet caps
          headers, coral reserved for the 90+ column; each row opens its tab */}
      <SectionCard title='Overdue Preventive Care' titleMb={2}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 760 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: OVERDUE_GRID, gap: 3, alignItems: 'center', pb: 2.5, px: 1, borderBottom: `1px solid ${c.SurfaceVariant}` }}>
              <Typography sx={{ ...overdueHd(c), textAlign: 'left' }}>Program</Typography>
              <Typography sx={overdueHd(c)}>Overdue animals</Typography>
              <Typography sx={overdueHd(c)}>0–30 days</Typography>
              <Typography sx={overdueHd(c)}>31–60 days</Typography>
              <Typography sx={overdueHd(c)}>61–90 days</Typography>
              <Typography sx={{ ...overdueHd(c), color: c.Tertiary }}>90+ days</Typography>
              <span />
            </Box>
            {overdueRows.map((row, i) => {
              const num = (v: number, kind: 'total' | 'dim' | 'mid' | 'hot') => (
                <Typography
                  sx={{
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: kind === 'total' ? '26px' : '24px',
                    fontWeight: kind === 'total' || (kind === 'hot' && v > 0) ? 800 : kind === 'dim' ? 600 : 700,
                    color:
                      kind === 'hot' && v > 0
                        ? c.Tertiary
                        : kind === 'dim' || v === 0
                        ? c.neutralSecondary
                        : c.OnSurfaceVariant
                  }}
                >
                  {v.toLocaleString()}
                </Typography>
              )

              return (
                <Box
                  key={row.key}
                  onClick={() => onGoToTab(row.key)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: OVERDUE_GRID,
                    gap: 3,
                    alignItems: 'center',
                    py: 3.5,
                    px: 1,
                    borderBottom: i === overdueRows.length - 1 ? 'none' : `0.5px solid ${c.OutlineVariant}`,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: c.Surface }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        borderRadius: '10px',
                        backgroundColor: c.displaybgPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon icon={PROGRAM_ICONS[row.key]} fontSize={17} color={c.OnPrimaryContainer} />
                    </Box>
                    <Typography sx={{ fontSize: '17px', fontWeight: 700, color: c.OnSurfaceVariant }} noWrap>
                      {row.label}
                    </Typography>
                  </Box>
                  {num(row.animals, 'total')}
                  {num(row.b.d30, 'dim')}
                  {num(row.b.d31, 'dim')}
                  {num(row.b.d61, 'mid')}
                  {num(row.b.d90, 'hot')}
                  <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} style={{ justifySelf: 'end' }} />
                </Box>
              )
            })}
          </Box>
        </Box>
      </SectionCard>

      {/* 4 · sickness trend (+ conditional site-concentration strip) */}
      <SickTrendCard clinical={clinical} preventive={preventive} hotSites={hotSites} allSiteAnimals={allSiteAnimals} />

      <SignalDrawer payload={signalDrill} onClose={() => setSignalDrill(null)} onAnimal={openSignalAnimal} />
      <OverviewAnimalDrawer group={drill} onClose={() => setDrill(null)} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════ Preventive panel — vaccine-wise (index → detail) */
// ONE wording set for all three programs (user 2026-08-03: "the title stats should be the same,
// I don't want any change") — the old "ongoing" variants (Lapsed / Upcoming Renewals / Never
// Started) are gone; only the medicine noun differs per tab.
const wordingFor = (key: TabKey, _kind: string) => {
  return {
    coverageLabel: 'Coverage',
    overdueLabel: 'Overdue',
    overdueWord: 'overdue',
    // "due"/"due on" is BANNED for future items — future = "upcoming" (user rule 2026-07-14)
    dueLabel: 'Upcoming in 30 Days',
    dueShort: 'Upcoming',
    neverLabel: 'Never Given',
    dueWord: 'upcoming',
    doseNoun: 'Doses given',
    statusLabels: { covered: 'Covered', due: 'Upcoming', overdue: 'Overdue', never: 'Never' } as Record<
      PreventiveTypeStatus,
      string
    >,
    typeNoun:
      key === 'vaccination' ? 'vaccines' : key === 'deworming' ? 'dewormers' : key === 'prescription' ? 'medicines' : 'supplements',
    typeCol: key === 'vaccination' ? 'Vaccine' : key === 'deworming' ? 'Dewormer' : key === 'prescription' ? 'Medicine' : 'Supplement'
  }
}
const PROGRAM_ICON: Record<string, string> = {
  vaccination: 'mdi:needle',
  deworming: 'mdi:pill',
  supplements: 'mdi:water',
  prescription: 'mdi:prescription'
}

/** Standard stat tiles (Clinical/Hospital pattern) — the species-level coverage roll-up was
 *  removed per the 2026-07-30 review ("how will that number help?"); coverage lives per-vaccine. */
const PreventiveStatStrip: React.FC<{
  s: PreventiveProgram['summary']
  w: ReturnType<typeof wordingFor>
  onPick: (t: StatusSheetTab) => void
}> = ({ s, w, onPick }) => (
  <StatsRow cols={3}>
    <StatTile label={w.overdueLabel} value={s.overdue.toLocaleString()} tone='error' onClick={() => onPick('overdue')} />
    <StatTile label={w.dueLabel} value={s.dueIn30.toLocaleString()} tone='neutral' onClick={() => onPick('due')} />
    <StatTile label={w.neverLabel} value={s.never.toLocaleString()} tone='neutral' onClick={() => onPick('never')} />
  </StatsRow>
)

/* ── Most Used section — top 10 medicines by animals given; scrollable tabs + monthly trend ── */
// Monthly-bucketed data can't honor "Today / Last week / Last 30 days" — offer month-valid presets only.
const MOST_USED_PRESETS: RangePreset[] = ['last_6m', 'last_1y', 'last_2y', 'last_3y', 'all']
const presetMonths = (p: RangePreset, total: number) =>
  p === 'last_6m' ? 6 : p === 'last_1y' ? 12 : p === 'last_2y' ? 24 : p === 'last_3y' ? 36 : total

/** ISO dose date → its "Aug '23" month-label key (the sidecar months format). */
const doseMonthLabel = (iso: string) => {
  const d = new Date(iso)

  return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
}

/** Chart-point drill: who received THIS medicine that month — searchable, site dropdown
 *  (SheetFilterBar), seeded with the section's site so the list matches the clicked point.
 *  Row → dose history. */
const MostUsedMonthDrawer: React.FC<{
  data: { label: string; site: string | null } | null
  type: PreventiveType | null
  icon: string
  showLate?: boolean
  onClose: () => void
}> = ({ data, type, icon, showLate = true, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)

  useEffect(() => {
    if (data) {
      setQ('')
      setSite(data.site)
    }
  }, [data])

  // every animal with a dose of this medicine in the clicked month (+ that dose's date)
  const monthRows = useMemo(() => {
    if (!data || !type) return []

    return type.animals
      .map(a => ({ a, date: a.doses.find(d => doseMonthLabel(d) === data.label) }))
      .filter((x): x is { a: PreventiveTypeAnimal; date: string } => !!x.date)
      .sort((x, y) => x.a.name.localeCompare(y.a.name))
  }, [data, type])

  const siteOptions = useMemo(() => Array.from(new Set(monthRows.map(x => x.a.site))).sort(), [monthRows])
  const query = q.trim().toLowerCase()
  const shown = monthRows
    .filter(x => !site || x.a.site === site)
    .filter(x => !query || x.a.name.toLowerCase().includes(query) || x.a.site.toLowerCase().includes(query))

  return (
    <SheetDrawer open={!!data} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {data && type && (
        <Sheet>
          <SheetHeader
            icon={icon}
            title={`${data.label} • ${type.name}`}
            stats={[{ label: 'Animals', value: shown.length }]}
            onClose={onClose}
          />
          <SheetFilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder='Search animals…'
            facetOptions={siteOptions}
            facetValue={site}
            onFacet={setSite}
            facetPlaceholder='All Sites'
            facetIcon='mdi:map-marker-outline'
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
            {shown.map((x, i) => (
              <SheetRow
                key={x.a.aid}
                avatar
                title={x.a.name}
                caption={
                  <>
                    <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                      {x.a.site}
                    </Box>
                    <Box component='span' sx={{ display: 'block' }}>{fmtDate(x.date)}</Box>
                  </>
                }
                last={i === shown.length - 1}
                onClick={() => setDrill(x.a)}
                chevron
              />
            ))}
            {!shown.length && <SheetEmpty>No animals in this group.</SheetEmpty>}
          </Box>
          <DoseHistoryDrawer
            animal={drill}
            typeName={type.name}
            icon={icon}
            dose={type.dose}
            showLate={showLate}
            onClose={() => setDrill(null)}
          />
        </Sheet>
      )}
    </SheetDrawer>
  )
}

const MostUsedSection: React.FC<{
  prog: PreventiveProgram
  w: ReturnType<typeof wordingFor>
  months: string[]
  icon: string
  /** Prescription reuse: no coverage/overdue exists, so the site rows state animals treated instead. */
  siteCaption?: (s: PreventiveTypeSite) => React.ReactNode
  showLate?: boolean
}> = ({ prog, w, months, icon, siteCaption, showLate = true }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const portrait = useMediaQuery('(orientation: portrait)')
  const [selName, setSelName] = useState<string | null>(null)
  const [range, setRange] = useState<RangeSelection>({ preset: 'last_1y', start: null, end: null })
  const [site, setSite] = useState<string | null>(null)
  const [monthDrill, setMonthDrill] = useState<{ label: string; site: string | null } | null>(null)

  // "Aug '23" label → month index, for bucketing per-animal dose dates when a site is picked
  const monthIdx = useMemo(() => new Map(months.map((m, i) => [m, i])), [months])

  // Ranked by DISTINCT animals given — dose counts would double-count boosters. All Sites reads
  // the true aggregates (tracked − never, dosesPerMonth); a picked site derives both count and
  // monthly series from that site's animals instead.
  const top = useMemo(
    () =>
      (prog.types ?? [])
        .map(t => {
          if (!site) return { t, given: Math.max(0, t.tracked - t.never), series: t.dosesPerMonth }
          const here = t.animals.filter(a => a.site === site)
          const series = months.map(() => 0)
          for (const a of here)
            for (const d of a.doses) {
              const i = monthIdx.get(doseMonthLabel(d))
              if (i != null) series[i]++
            }

          return { t, given: here.filter(a => a.status !== 'never').length, series }
        })
        .filter(x => x.given > 0)
        .sort((a, b) => b.given - a.given)
        .slice(0, 10),
    [prog.types, site, months, monthIdx]
  )
  const sel = top.find(x => x.t.name === selName) ?? top[0]

  if (!months.length || (!top.length && !site)) return null

  const n = Math.min(presetMonths(range.preset, months.length), months.length)

  // Two-row portrait header (shipped grammar): title row, then the site filter +
  // date range spread across a full-width controls row. Landscape keeps one row.
  const siteCtl = (
    <SiteFilterControl
      sites={(prog.sites ?? []) as unknown as PreventiveTypeSite[]}
      sitesTotal={(prog.sites ?? []).length}
      tracked={prog.summary.animalsTracked}
      value={site}
      onChange={setSite}
      overdueWord={w.overdueWord}
      caption={siteCaption}
    />
  )
  const rangeCtl = <DashboardDateRange value={range} onChange={setRange} presets={MOST_USED_PRESETS} />
  const stackedHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
      <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600 }}>
        {`Most Used ${w.typeCol}s`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, width: '100%' }}>
        {siteCtl}
        {rangeCtl}
      </Box>
    </Box>
  )

  return (
    <SectionCard
      title={portrait ? stackedHeader : `Most Used ${w.typeCol}s`}
      action={
        portrait ? undefined : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {siteCtl}
            {rangeCtl}
          </Box>
        )
      }
      titleMb={3}
    >
      {!sel ? (
        <EmptyState message={`No ${w.typeNoun} given at ${site}`} />
      ) : (
        <>
      {/* one scrollable row of underline tabs — full names at full size, overflow scrolls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          mb: 4,
          ...thinScrollbarSx(theme)
        }}
      >
        {top.map(x => {
          const active = x.t.name === sel.t.name

          return (
            <Box
              key={x.t.name}
              onClick={() => setSelName(x.t.name)}
              role='tab'
              aria-selected={active}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                pb: 1.5,
                flexShrink: 0,
                borderBottom: '2.5px solid',
                borderColor: active ? theme.palette.primary.main : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: active ? theme.palette.primary.main : c.OutlineVariant }
              }}
            >
              <Typography
                variant='body1'
                sx={{ fontWeight: 600, color: active ? theme.palette.primary.main : c.neutralSecondary, whiteSpace: 'nowrap' }}
              >
                {x.t.name}
              </Typography>
              <Typography
                variant='body1'
                sx={{ fontWeight: 700, color: active ? theme.palette.primary.main : c.Outline, fontVariantNumeric: 'tabular-nums' }}
              >
                {x.given.toLocaleString()}
              </Typography>
            </Box>
          )
        })}
      </Box>
      <TrendAreaChart
        values={sel.series.slice(-n)}
        labels={months.slice(-n)}
        color={theme.palette.primary.main}
        name={w.doseNoun}
        height={260}
        onPointClick={i => {
          const label = months.slice(-n)[i]
          if (label) setMonthDrill({ label, site })
        }}
      />
        </>
      )}
      <MostUsedMonthDrawer data={monthDrill} type={sel?.t ?? null} icon={icon} showLate={showLate} onClose={() => setMonthDrill(null)} />
    </SectionCard>
  )
}

/** Screen 1 — the vaccine index: stat strip + one row per medicine, worst coverage first. */
const PreventiveIndex: React.FC<{
  prog: PreventiveProgram
  w: ReturnType<typeof wordingFor>
  icon: string
  programLabel: string
  months: string[]
  onPick: (name: string) => void
}> = ({ prog, w, icon, programLabel, months, onPick }) => {
  const { txt, c } = useCells()
  const [q, setQ] = useState('')
  const [statusSheet, setStatusSheet] = useState<StatusSheetTab | null>(null)
  const types = prog.types ?? []

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = query ? types.filter(t => t.name.toLowerCase().includes(query)) : types

    // Overdue animals bucketed by how long overdue (2026-07-30 review: days, not graphs/percentages)
    return list.map(t => {
      const b = { d30: 0, d31: 0, d61: 0, d90: 0 }
      for (const a of t.animals) {
        if (a.status !== 'overdue') continue
        const d = a.days ?? 0
        if (d > 90) b.d90++
        else if (d > 60) b.d61++
        else if (d > 30) b.d31++
        else b.d30++
      }

      return { id: t.name, ...t, ...b }
    })
  }, [types, q])
  // worst first — the 90+ bucket is the action column (a sortModel field MUST exist as a column)
  const tbl = useSortableTable(rows, { field: 'd90', sort: 'desc' })

  const num = (v: number, color: string, weight = 600) => (
    <Typography sx={{ fontSize: '18px', fontWeight: weight, color, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
  )

  const columns: GridColDef[] = [
    // single-line name, no schedule subtitle (2026-07-31: headers and cells stay one line)
    { field: 'name', headerName: w.typeCol, flex: 1, minWidth: 180, renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    // Overdue animals by age — the 2026-07-30 review's day buckets, 90+ carries the only red.
    // Wide enough for ONE-line uppercase headers; counts at 18px (one step above CELL_FONT).
    { field: 'd30', headerName: '0–30 Days', width: 150, renderCell: p => num(p.row.d30, p.row.d30 ? c.neutralSecondary : c.Outline) },
    { field: 'd31', headerName: '31–60 Days', width: 160, renderCell: p => num(p.row.d31, p.row.d31 ? c.neutralSecondary : c.Outline) },
    { field: 'd61', headerName: '61–90 Days', width: 160, renderCell: p => num(p.row.d61, p.row.d61 ? c.OnSurfaceVariant : c.Outline) },
    { field: 'd90', headerName: '90+ Days', width: 150, renderCell: p => num(p.row.d90, p.row.d90 ? c.Tertiary : c.Outline, 700) },
    {
      field: 'sitesAffected',
      headerName: 'Sites Affected',
      width: 210,
      renderCell: p => txt(`${p.row.sitesAffected} of ${p.row.sitesTotal} site${p.row.sitesTotal === 1 ? '' : 's'}`, c.neutralSecondary)
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PreventiveStatStrip s={prog.summary} w={w} onPick={setStatusSheet} />
      <PreventiveStatusSheet
        openTab={statusSheet}
        prog={prog}
        w={w}
        icon={icon}
        programLabel={programLabel}
        onClose={() => setStatusSheet(null)}
      />
      <SectionCard
        title={
          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
            {w.typeCol}s{' '}
            <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
              • {types.length}
            </Box>
          </Typography>
        }
        action={<TableSearch value={q} onChange={setQ} placeholder={`Search ${w.typeNoun}…`} />}
        titleMb={3}
      >
        {rows.length ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: PreventiveType }) => onPick(p.row.name)}
          />
        ) : (
          <EmptyState message={`No ${w.typeNoun} match this search`} />
        )}
      </SectionCard>
      <MostUsedSection prog={prog} w={w} months={months} icon={icon} />
    </Box>
  )
}

/** Per-site chips — stats AND the site filter in one. Sorted worst coverage first. */
/** Site filter — dropdown-style trigger beside the table search; opens a standard side sheet
 *  listing every site (coverage % + overdue) with search. Picking a row filters the table. */
export const SiteFilterControl: React.FC<{
  sites: PreventiveTypeSite[]
  sitesTotal: number
  tracked: number
  value: string | null
  onChange: (v: string | null) => void
  overdueWord: string
  /** Optional per-site caption override (default: "N% • M overdue" coverage wording). */
  caption?: (s: PreventiveTypeSite) => React.ReactNode
}> = ({ sites, sitesTotal, tracked, value, onChange, overdueWord, caption }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [open, setOpen] = useState(false)
  const [siteQ, setSiteQ] = useState('')

  const filtered = siteQ.trim() ? sites.filter(s => s.site.toLowerCase().includes(siteQ.trim().toLowerCase())) : sites
  const pick = (v: string | null) => {
    onChange(v)
    setOpen(false)
    setSiteQ('')
  }

  const row = (opts: {
    key: string
    selected: boolean
    onClick: () => void
    icon: string
    title: string
    caption: React.ReactNode
    last: boolean
  }) => (
    <Box
      key={opts.key}
      onClick={opts.onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 4,
        borderBottom: opts.last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        cursor: 'pointer',
        '&:hover': { backgroundColor: c.Surface }
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '8px',
          backgroundColor: c.displaybgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon icon={opts.icon} fontSize={20} color={c.OnPrimaryContainer} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {opts.title}
        </Typography>
        <Typography
          sx={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.66px', color: c.neutralSecondary, mt: '2px' }}
          noWrap
        >
          {opts.caption}
        </Typography>
      </Box>
      {opts.selected ? (
        <Icon icon='mdi:check-circle' fontSize={20} color={theme.palette.primary.dark} />
      ) : (
        <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} />
      )}
    </Box>
  )

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          height: TABLE_CTRL_H,
          borderRadius: '8px',
          border: `1px solid ${value ? theme.palette.primary.main : c.OutlineVariant}`,
          backgroundColor: value ? c.Surface : theme.palette.background.paper,
          cursor: 'pointer',
          transition: 'border-color .15s ease',
          '&:hover': { borderColor: theme.palette.primary.main }
        }}
      >
        <Icon icon='mdi:map-marker-outline' fontSize={16} color={value ? theme.palette.primary.dark : c.Outline} />
        <Typography variant='body2' sx={{ fontWeight: 600, maxWidth: 180, color: value ? theme.palette.primary.dark : c.OnSurfaceVariant }} noWrap>
          {value ?? 'All sites'}
        </Typography>
        <Icon icon='mdi:chevron-down' fontSize={16} color={c.Outline} />
      </Box>

      <SheetDrawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: sheetPaperSx('md') }}>
        <Sheet>
          <SheetHeader title='Sites' stats={[{ label: 'Sites', value: sitesTotal }]} onClose={() => setOpen(false)} />
          <SheetSearch value={siteQ} onChange={setSiteQ} placeholder='Search sites…' />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, mt: 1 }}>
            {!siteQ.trim() &&
              row({
                key: '__all',
                selected: value == null,
                onClick: () => pick(null),
                icon: 'mdi:map-marker-multiple-outline',
                title: 'All Sites',
                caption: `${tracked.toLocaleString()} animals`,
                last: filtered.length === 0
              })}
            {filtered.map((s, i) =>
              row({
                key: s.site,
                selected: value === s.site,
                onClick: () => pick(value === s.site ? null : s.site),
                icon: 'mdi:map-marker-outline',
                title: s.site,
                caption: caption ? (
                  caption(s)
                ) : (
                  <>
                    <Box component='span' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.coveragePct}%</Box>
                    {' • '}
                    <Box component='span' sx={{ color: s.overdue ? c.Tertiary : c.neutralSecondary, fontWeight: s.overdue ? 700 : 600 }}>
                      {s.overdue} {overdueWord}
                    </Box>
                  </>
                ),
                last: i === filtered.length - 1
              })
            )}
            {filtered.length === 0 && siteQ.trim() && (
              <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
                No sites match.
              </Typography>
            )}
          </Box>
        </Sheet>
      </SheetDrawer>
    </>
  )
}

/** "38 ml" — bold amount, muted unit. The one way a dose value renders anywhere in Medical. */
const DoseAmount: React.FC<{ value: number; unit: string }> = ({ value, unit }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    // lineHeight matches the SheetRow 16px title's line box (24px) so the amount sits exactly
    // on the same visual row as the date/medicine title beside it
    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: c.OnSurfaceVariant, whiteSpace: 'nowrap', lineHeight: '24px', fontVariantNumeric: 'tabular-nums' }}>
      {value.toLocaleString()}{' '}
      <Box component='span' sx={{ fontSize: '14px', fontWeight: 600, color: c.neutralSecondary }}>
        {unit}
      </Box>
    </Typography>
  )
}

/** "1 ml" / "0.2 mg/kg" — a medicine's standard dose as display text. */
const doseRate = (d?: PreventiveDoseSpec) => (d ? `${d.qty.toLocaleString()} ${d.unit}${d.perKg ? '/kg' : ''}` : null)

/** Per-animal dose history for ONE medicine — one line per dose: date left · dose right.
 *  Weight-based medicines show the rate under the date and the given TOTAL on the right. */
const DoseHistoryDrawer: React.FC<{
  animal: PreventiveTypeAnimal | null
  typeName: string
  icon: string
  dose?: PreventiveDoseSpec
  /** Prescriptions have no schedule — nothing can be "late", so they suppress the lateness caption. */
  showLate?: boolean
  onClose: () => void
}> = ({ animal, typeName, icon, dose, showLate = true, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const rate = doseRate(dose)

  return (
    <SheetDrawer open={!!animal} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {animal && (
        <Sheet>
          <SheetHeader avatar title={animal.name} subtitle={animal.site} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            <SheetSection label={typeName} first noDivider>
              {animal.doses.map((d, i) => {
                const amt = animal.amounts?.[i]
                const late = showLate ? doseLateDays(animal.aid, typeName, d) : 0

                return (
                  <SheetRow
                    key={i}
                    icon={icon}
                    iconSize={32}
                    title={fmtDate(d)}
                    // a delayed administration states its delay under the date (same fact —
                    // and the same doseLateDays — as the Delayed chart's month sheet chips)
                    caption={
                      late > 0 ? (
                        // administered late — dark grey (gold text is unreadable), never coral
                        <Box component='span' sx={{ color: c.OnSurfaceVariant, fontWeight: 600 }}>
                          Late • {late}d
                        </Box>
                      ) : undefined
                    }
                    last={i === animal.doses.length - 1}
                    // right side: TOTAL given on the title line; weight-based medicines show
                    // their rate (e.g. "5 mg/kg") directly beneath it
                    trailing={
                      amt != null && dose ? (
                        <>
                          <DoseAmount value={amt} unit={dose.unit} />
                          {dose.perKg && rate && (
                            <Typography variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
                              {rate}
                            </Typography>
                          )}
                        </>
                      ) : undefined
                    }
                  />
                )
              })}
              {animal.doses.length === 0 && <SheetEmpty>No doses recorded for this animal.</SheetEmpty>}
            </SheetSection>
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/** Month drill for the doses-per-month chart — who received THIS medicine that month.
 *  Standard side-sheet list: avatar · name+id · site caption · dose-count pill; row → dose history. */
/** Month bar click → that month's schedule story: who was administered (scheduled vs actual
 *  date with the gap) and who missed (overdue since their due date). Row → dose history. */
type MonthRow = { a: PreventiveTypeAnimal; kind: 'given' | 'missed'; date: string; due: string; gap: number }
const MonthDosesDrawer: React.FC<{
  data: { label: string; rows: MonthRow[] } | null
  typeName: string
  icon: string
  onAnimal: (a: PreventiveTypeAnimal) => void
  onClose: () => void
}> = ({ data, typeName, icon, onAnimal, onClose }) => {
  // two tabs only — Administered (on-time + late) vs Overdue; mixing them in an "All" list
  // made a "26d late" chip read like another overdue. Counts live in the header stats.
  const [tab, setTab] = useState<'given' | 'missed'>('given')
  // each month opens on Administered
  useEffect(() => {
    if (data) setTab('given')
  }, [data])
  const rows = data?.rows ?? []
  const given = rows.filter(r => r.kind === 'given')
  const missed = rows.filter(r => r.kind === 'missed')
  const shown = tab === 'given' ? given : missed
  const tabs: { key: 'given' | 'missed'; label: string }[] = [
    { key: 'given', label: 'Administered' },
    { key: 'missed', label: 'Overdue' }
  ]

  return (
    <SheetDrawer open={!!data} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {data && (
        <Sheet>
          <SheetHeader
            icon={icon}
            title={`${data.label} • ${typeName}`}
            stats={[
              { label: 'Administered', value: given.length },
              { label: 'Overdue', value: missed.length }
            ]}
            onClose={onClose}
          />
          <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {shown.map((r, i) => (
              <SheetRow
                key={`${r.a.aid}-${r.date}`}
                avatar
                title={r.a.name}
                caption={
                  r.kind === 'missed'
                    ? `Scheduled ${fmtDate(r.due)}`
                    : r.gap > 0
                    ? `Scheduled ${fmtDate(r.due)} • given ${fmtDate(r.date)}`
                    : fmtDate(r.date) // on time — the chip already says so, the date is enough
                }
                last={i === shown.length - 1}
                onClick={() => onAnimal(r.a)}
                chevron
                trailing={
                  r.kind === 'missed' ? (
                    // no "overdue" word — the tab already says it
                    <StatusChip label={`${r.gap}d`} tone='error' />
                  ) : r.gap > 0 ? (
                    // late but ADMINISTERED — yellow, never the overdue coral ('warning' maps
                    // to the same Tertiary as 'error' in this kit; 'caution' is the yellow)
                    <StatusChip label={`${r.gap}d late`} tone='caution' />
                  ) : (
                    <StatusChip label='On Time' tone='success' />
                  )
                }
              />
            ))}
            {shown.length === 0 && <SheetEmpty>No records in this group.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

// Coverage-over-time point → who makes up that month's coverage %. A status filter (All / Covered
/** Deterministic synthetic lateness for ONE dose: ~15% of doses run 8–45 days behind schedule.
 *  ONE source of truth — the Delayed chart, its month sheet, stats and chips all call this, so
 *  a bar's number always equals what its sheet lists. Real API delay data replaces this. */
const doseLateDays = (aid: string, medicine: string, date: string): number => {
  let h = 0
  const s = `late|${aid}|${medicine}|${date}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h % 100 < 15 ? 8 + ((h >>> 4) % 38) : 0
}

/** Overdue-by-Age bucket click → that bucket's animals, longest overdue first; row → dose history. */
const BucketDrawer: React.FC<{
  data: { label: string; animals: PreventiveTypeAnimal[] } | null
  typeName: string
  icon: string
  onAnimal: (a: PreventiveTypeAnimal) => void
  onClose: () => void
}> = ({ data, typeName, icon, onAnimal, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <SheetDrawer open={!!data} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {data && (
        <Sheet>
          <SheetHeader
            icon={icon}
            iconTone={{ bg: c.BgTeritary, fg: c.Tertiary }}
            title={`Overdue ${data.label} • ${typeName}`}
            stats={[{ label: 'Animals', value: data.animals.length }]}
            onClose={onClose}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {data.animals.map((a, i) => (
              <SheetRow
                key={a.aid}
                avatar
                title={a.name}
                caption={a.site}
                last={i === data.animals.length - 1}
                onClick={() => onAnimal(a)}
                chevron
                trailing={<StatusChip label={`${a.days ?? 0}d overdue`} tone='error' />}
              />
            ))}
            {!data.animals.length && <SheetEmpty>No animals in this bucket.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/* ── species-level status sheet — stat-tile click → Overdue / Upcoming / Never Given ── */
type StatusSheetTab = 'overdue' | 'due' | 'never'
type StatusSheetRow = { a: PreventiveTypeAnimal; type: PreventiveType; days: number }
const STATUS_DAY_MS = 86400000
const UPCOMING_WINDOWS = [
  { label: 'Next 30 Days', value: 30 },
  { label: 'Next 60 Days', value: 60 },
  { label: 'Next 90 Days', value: 90 },
  { label: 'Next 6 Months', value: 180 }
]
// same buckets as the medicine table's overdue-age columns
const OVERDUE_BUCKETS = [
  { label: '0–30 Days', value: 'd30', min: 0, max: 30 },
  { label: '31–60 Days', value: 'd31', min: 31, max: 60 },
  { label: '61–90 Days', value: 'd61', min: 61, max: 90 },
  { label: '90+ Days', value: 'd90', min: 91, max: Infinity }
]

/** Stat-strip drill: one sheet, three tabs (the clicked tile lands on its tab). Rows are
 *  animal × medicine (an animal overdue for two vaccines = two missed doses = two rows),
 *  medicine named under the animal. Search + the app-standard CustomFilterDrawer (medicine
 *  multi-select; Upcoming window 30d default → up to 6 months). Row → dose history. */
const PreventiveStatusSheet: React.FC<{
  openTab: StatusSheetTab | null
  prog: PreventiveProgram
  w: ReturnType<typeof wordingFor>
  icon: string
  programLabel: string
  onClose: () => void
}> = ({ openTab, prog, w, icon, programLabel, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<StatusSheetTab>('overdue')
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<StatusSheetRow | null>(null)

  // applied filters (chips) + the drawer's working copy (committed on Apply)
  const [vaccines, setVaccines] = useState<string[]>([])
  const [windowDays, setWindowDays] = useState<number>(30)
  const [ageBuckets, setAgeBuckets] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMenu, setFilterMenu] = useState<string>(w.typeCol)
  const [filterQ, setFilterQ] = useState('')
  const [pendVaccines, setPendVaccines] = useState<string[]>([])
  const [pendWindow, setPendWindow] = useState<number[]>([30])
  const [pendBuckets, setPendBuckets] = useState<string[]>([])

  // each open lands on the clicked tile's tab with a clean slate
  useEffect(() => {
    if (openTab) {
      setTab(openTab)
      setQ('')
    }
  }, [openTab])

  const types = prog.types ?? []
  const typeItems = useMemo(() => types.map(t => ({ label: t.name, value: t.name })), [types])

  const lists = useMemo(() => {
    const query = q.trim().toLowerCase()
    const now = Date.now()
    const mk = (tb: StatusSheetTab) => {
      const out: StatusSheetRow[] = []
      for (const t of types) {
        if (vaccines.length && !vaccines.includes(t.name)) continue
        for (const a of t.animals) {
          let days = a.days ?? 0
          if (tb === 'due') {
            // upcoming = anything whose next dose falls inside the window (covered animals
            // roll in as the window widens past 30 days)
            if (a.status === 'overdue' || a.status === 'never' || !a.nextDue) continue
            const until = Math.ceil((new Date(a.nextDue).getTime() - now) / STATUS_DAY_MS)
            if (until < 0 || until > windowDays) continue
            days = until
          } else if (a.status !== tb) continue
          if (
            tb === 'overdue' &&
            ageBuckets.length &&
            !OVERDUE_BUCKETS.some(b => ageBuckets.includes(b.value) && days >= b.min && days <= b.max)
          )
            continue
          if (
            query &&
            !a.name.toLowerCase().includes(query) &&
            !t.name.toLowerCase().includes(query) &&
            !a.site.toLowerCase().includes(query)
          )
            continue
          out.push({ a, type: t, days })
        }
      }

      return out.sort(
        tb === 'overdue'
          ? (x, y) => y.days - x.days // longest overdue first
          : tb === 'due'
          ? (x, y) => x.days - y.days // soonest first
          : (x, y) => x.a.name.localeCompare(y.a.name)
      )
    }

    return { overdue: mk('overdue'), due: mk('due'), never: mk('never') }
  }, [types, q, vaccines, windowDays, ageBuckets])
  const shown = lists[tab]

  const tabs: { key: StatusSheetTab; label: string }[] = [
    { key: 'overdue', label: `${w.overdueLabel} • ${lists.overdue.length}` },
    { key: 'due', label: `${w.dueShort} • ${lists.due.length}` },
    { key: 'never', label: `${w.neverLabel} • ${lists.never.length}` }
  ]

  const windowLabel = UPCOMING_WINDOWS.find(o => o.value === windowDays)?.label ?? `Next ${windowDays} Days`
  const ageMenu = `${w.overdueLabel} Age`
  const appliedCount = vaccines.length + ageBuckets.length + (windowDays !== 30 ? 1 : 0)

  const openFilter = () => {
    setPendVaccines(vaccines)
    setPendWindow([windowDays])
    setPendBuckets(ageBuckets)
    setFilterMenu(w.typeCol)
    setFilterQ('')
    setFilterOpen(true)
  }
  const applyFilters = () => {
    setVaccines(pendVaccines)
    setWindowDays(pendWindow[0] ?? 30)
    setAgeBuckets(pendBuckets)
    setFilterOpen(false)
  }
  const clearAll = () => {
    setPendVaccines([])
    setPendWindow([30])
    setPendBuckets([])
  }

  const filteredTypeItems = filterQ.trim()
    ? typeItems.filter(i => i.label.toLowerCase().includes(filterQ.trim().toLowerCase()))
    : typeItems
  const filteredWindows = filterQ.trim()
    ? UPCOMING_WINDOWS.filter(o => o.label.toLowerCase().includes(filterQ.trim().toLowerCase()))
    : UPCOMING_WINDOWS

  return (
    <SheetDrawer open={!!openTab} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      <Sheet>
        <SheetHeader
          icon={icon}
          title={programLabel}
          subtitle={`${prog.summary.animalsTracked.toLocaleString()} animals tracked`}
          onClose={onClose}
        />
        <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: SHEET_PX }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SheetSearch value={q} onChange={setQ} placeholder={`Search animals, ${w.typeNoun}, sites…`} />
          </Box>
          <Box sx={{ pt: 2 }}>
            <FilterButton
              onClick={openFilter}
              appliedFiltersCount={appliedCount}
              bgColor={theme.palette.background.paper}
              border={`1px solid ${c.SurfaceVariant}`}
            />
          </Box>
        </Box>
        {appliedCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, px: SHEET_PX, pt: 2 }}>
            {vaccines.map(v => (
              <FilterChip key={v} label={v} onClear={() => setVaccines(prev => prev.filter(x => x !== v))} />
            ))}
            {ageBuckets.map(b => (
              <FilterChip
                key={b}
                label={`${w.overdueLabel} ${OVERDUE_BUCKETS.find(o => o.value === b)?.label ?? b}`}
                onClear={() => setAgeBuckets(prev => prev.filter(x => x !== b))}
              />
            ))}
            {windowDays !== 30 && <FilterChip label={windowLabel} onClear={() => setWindowDays(30)} />}
          </Box>
        )}
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {shown.map((r, i) => (
            <SheetRow
              key={`${r.type.name}-${r.a.aid}`}
              avatar
              title={r.a.name}
              // line 2: medicine • site in dark grey; line 3 (Upcoming only): the date in the
              // standard muted caption style — the two lines differ by color alone
              caption={
                <>
                  <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                    {r.type.name}
                    <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                      •
                    </Box>
                    {r.a.site}
                  </Box>
                  {tab === 'due' && r.a.nextDue && (
                    <Box component='span' sx={{ display: 'block' }}>
                      {fmtDate(r.a.nextDue)}
                    </Box>
                  )}
                </>
              }
              last={i === shown.length - 1}
              onClick={() => setDrill(r)}
              chevron
              trailing={
                tab === 'overdue' ? (
                  <StatusChip label={`${r.days}d`} tone='error' />
                ) : tab === 'due' ? (
                  // imminent = yellow attention, never coral — these doses aren't a failure
                  <StatusChip label={r.days <= 0 ? 'Today' : `In ${r.days}d`} tone={r.days <= 7 ? 'caution' : 'neutral'} />
                ) : undefined
              }
            />
          ))}
          {!shown.length && <SheetEmpty>No animals in this group.</SheetEmpty>}
        </Box>
      </Sheet>

      <CustomFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        onClearAll={clearAll}
        filterLists={[w.typeCol, ageMenu, 'Upcoming Window']}
        selectedOptions={{
          [w.typeCol]: pendVaccines,
          [ageMenu]: pendBuckets,
          'Upcoming Window': pendWindow[0] === 30 ? [] : pendWindow
        }}
        selectedItem={filterMenu}
        onSelectItem={(m: string) => {
          setFilterMenu(m)
          setFilterQ('')
        }}
      >
        {filterMenu === w.typeCol && (
          <FilterContent
            menuName={w.typeCol}
            searchQuery={filterQ}
            onSearch={setFilterQ}
            selectedOptions={pendVaccines}
            onOptionChange={(id: string) =>
              setPendVaccines(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
            }
            selectAllHandler={() =>
              setPendVaccines(prev => (prev.length === typeItems.length ? [] : typeItems.map(i => i.value)))
            }
            items={filteredTypeItems}
            isAllSelected={typeItems.length > 0 && pendVaccines.length === typeItems.length}
            searchLoading={false}
            placeholder={`Search ${w.typeNoun}…`}
            enableSelectAll
          />
        )}
        {filterMenu === ageMenu && (
          <FilterContent
            menuName={ageMenu}
            searchQuery={filterQ}
            onSearch={setFilterQ}
            selectedOptions={pendBuckets}
            onOptionChange={(id: string) =>
              setPendBuckets(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
            }
            items={OVERDUE_BUCKETS.filter(
              o => !filterQ.trim() || o.label.toLowerCase().includes(filterQ.trim().toLowerCase())
            )}
            isAllSelected={false}
            searchLoading={false}
            placeholder='Search…'
          />
        )}
        {filterMenu === 'Upcoming Window' && (
          <FilterContent
            menuName='Upcoming Window'
            searchQuery={filterQ}
            onSearch={setFilterQ}
            selectedOptions={pendWindow}
            onOptionChange={(id: number) => setPendWindow([id])} // single-select: picking replaces
            items={filteredWindows}
            isAllSelected={false}
            searchLoading={false}
            placeholder='Search…'
          />
        )}
      </CustomFilterDrawer>

      <DoseHistoryDrawer
        animal={drill?.a ?? null}
        typeName={drill?.type.name ?? ''}
        icon={icon}
        dose={drill?.type.dose}
        onClose={() => setDrill(null)}
      />
    </SheetDrawer>
  )
}

const PreventiveDetail: React.FC<{
  type: PreventiveType
  months: string[]
  w: ReturnType<typeof wordingFor>
  icon: string
  onBack: () => void
}> = ({ type, months, w, icon, onBack }) => {
  const { txt, animalCell, c, theme } = useCells()

  // Portrait: the status tabs + site filter + search don't fit one header row —
  // stack as two deliberate rows (tabs / full-width search + right-aligned filter).
  const portrait = useMediaQuery('(orientation: portrait)')
  // ONE range drives both dose-administration panels (given | delayed) — they tell one story.
  const [doseRange, setDoseRange] = useState<RangePreset>('last_1y')
  const [statusTab, setStatusTab] = useState<'all' | PreventiveTypeStatus>('all')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)
  const [monthDrill, setMonthDrill] = useState<{ label: string; rows: MonthRow[] } | null>(null)
  const [bucketDrill, setBucketDrill] = useState<{ label: string; animals: PreventiveTypeAnimal[] } | null>(null)

  // Chart values derived from the SAME dose records the month drill lists — the sidecar's
  // precomputed dosesPerMonth doesn't reconcile with the decoded per-animal dose dates, and a
  // bar that says 8 must open a sheet that shows 8. Missed doses = currently-overdue animals,
  // attributed to the month their lapsed due date fell in (full bar height = due that month).
  const { derivedDosesPerMonth, derivedAnimalsPerMonth, derivedMissedPerMonth } = useMemo(() => {
    const counts = new Map<string, number>()
    const animalSets = new Map<string, Set<string>>()
    const missed = new Map<string, number>()
    for (const a of type.animals) {
      for (const d of a.doses) {
        const key = d.slice(0, 7)
        counts.set(key, (counts.get(key) ?? 0) + 1)
        ;(animalSets.get(key) ?? animalSets.set(key, new Set()).get(key)!).add(a.aid)
      }
      if (a.status === 'overdue' && a.nextDue) {
        const key = a.nextDue.slice(0, 7)
        missed.set(key, (missed.get(key) ?? 0) + 1)
      }
    }
    const keyOf = (label: string) => {
      const m = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(label.trim())
      const mi = m ? MONTHS.indexOf(m[1]) : -1

      return m && mi >= 0 ? `20${m[2]}-${String(mi + 1).padStart(2, '0')}` : null
    }

    return {
      derivedDosesPerMonth: months.map(l => counts.get(keyOf(l) ?? '') ?? 0),
      derivedAnimalsPerMonth: months.map(l => animalSets.get(keyOf(l) ?? '')?.size ?? 0),
      derivedMissedPerMonth: months.map(l => missed.get(keyOf(l) ?? '') ?? 0)
    }
  }, [type, months])

  // This vaccine's overdue animals by age — mirrors the index table's buckets (V7).
  const buckets = useMemo(() => {
    const defs = [
      { label: '0–30 Days', animals: [] as PreventiveTypeAnimal[] },
      { label: '31–60 Days', animals: [] as PreventiveTypeAnimal[] },
      { label: '61–90 Days', animals: [] as PreventiveTypeAnimal[] },
      { label: '90+ Days', animals: [] as PreventiveTypeAnimal[] }
    ]
    for (const a of type.animals) {
      if (a.status !== 'overdue') continue
      const d = a.days ?? 0
      defs[d > 90 ? 3 : d > 60 ? 2 : d > 30 ? 1 : 0].animals.push(a)
    }
    for (const b of defs) b.animals.sort((x, y) => (y.days ?? 0) - (x.days ?? 0))

    return defs
  }, [type])

  // Bar click → the month's schedule story: administered doses (scheduled vs actual + gap)
  // and missed dues (overdue since that month). Reconciles with the stacked bar's segments.
  const onDoseMonth = (label: string) => {
    const m = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(label.trim())
    const mi = m ? MONTHS.indexOf(m[1]) : -1
    if (!m || mi < 0) return
    const year = 2000 + Number(m[2])
    const inMonth = (iso?: string) => {
      if (!iso) return false
      const dd = new Date(iso)

      return dd.getFullYear() === year && dd.getMonth() === mi
    }
    const rows: MonthRow[] = []
    for (const a of type.animals) {
      for (const d of a.doses) {
        if (!inMonth(d)) continue
        const gap = doseLateDays(a.aid, type.name, d)
        rows.push({ a, kind: 'given', date: d, due: addDays(d, -gap), gap })
      }
      if (a.status === 'overdue' && inMonth(a.nextDue)) {
        rows.push({ a, kind: 'missed', date: a.nextDue!, due: a.nextDue!, gap: a.days ?? 0 })
      }
    }
    // missed first (longest overdue on top), then given (biggest gap first)
    rows.sort((x, y) => (x.kind === y.kind ? y.gap - x.gap : x.kind === 'missed' ? -1 : 1))
    setMonthDrill({ label: `${m[1]} ${year}`, rows })
  }

  const monthsOf = (preset: RangePreset) => (preset === 'last_1y' ? 12 : preset === 'last_2y' ? 24 : months.length || 36)
  const slice = (arr: number[], preset: RangePreset) => arr.slice(-monthsOf(preset))
  const sliceLabels = (preset: RangePreset) => months.slice(-monthsOf(preset))
  // >12 columns: thin the axis captions but keep full labels for tooltips
  const counts: Record<'all' | PreventiveTypeStatus, number> = {
    all: type.tracked,
    covered: type.covered,
    due: type.due,
    overdue: type.overdue,
    never: type.never
  }
  const STATUS_TABS: { key: 'all' | PreventiveTypeStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'covered', label: w.statusLabels.covered },
    { key: 'due', label: w.statusLabels.due },
    { key: 'overdue', label: w.statusLabels.overdue },
    { key: 'never', label: w.statusLabels.never }
  ]
  const accents: Record<'all' | PreventiveTypeStatus, string> = {
    all: c.OnSurfaceVariant,
    covered: theme.palette.primary.dark,
    due: theme.palette.secondary.main,
    overdue: c.Tertiary,
    never: c.neutralSecondary
  }

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()

    return type.animals
      .filter(a => (statusTab === 'all' || a.status === statusTab) && (!siteFilter || a.site === siteFilter) && (!query || `${a.name} ${a.aid} ${a.site}`.toLowerCase().includes(query)))
      .map(a => ({ id: a.aid, ...a, doseCount: a.doses.length }))
  }, [type.animals, statusTab, siteFilter, q])
  const tbl = useSortableTable(rows, { field: 'nextDue', sort: 'asc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }

  const statusPill = (a: PreventiveTypeAnimal) => {
    const label =
      a.status === 'overdue'
        ? `${w.statusLabels.overdue} ${a.days ?? 0}d`
        : a.status === 'due'
        ? `${w.coverageLabel === 'On Schedule' ? 'Renew in' : 'in'} ${a.days ?? 0}d`
        : w.statusLabels[a.status]
    const tone = a.status === 'covered' ? 'success' : a.status === 'due' ? 'info' : a.status === 'overdue' ? 'error' : 'neutral'

    return <StatusChip label={label} tone={tone as any} />
  }

  // Last-dose cell: date on top, given amount beneath (weight-based also states its rate).
  const lastDoseCell = (a: PreventiveTypeAnimal) => {
    if (!a.lastGiven) return txt('—', c.neutralSecondary)
    const amt = a.amounts?.[0]
    const sub = amt != null && type.dose ? `${amt.toLocaleString()} ${type.dose.unit}${type.dose.perKg ? ` • ${doseRate(type.dose)}` : ''}` : null

    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1rem', color: c.OnSurfaceVariant, whiteSpace: 'nowrap' }}>{fmtDate(a.lastGiven)}</Typography>
        {sub && (
          <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, display: 'block', fontVariantNumeric: 'tabular-nums' }} noWrap>
            {sub}
          </Typography>
        )}
      </Box>
    )
  }

  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    // standard animal cell (avatar · name · site) — the site lives here, not in its own column
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    { field: 'doseCount', headerName: 'Doses', width: 110, renderCell: p => txt(p.row.doseCount || '—', c.neutralSecondary, 600) },
    { field: 'lastGiven', headerName: 'Last Dose', width: 190, renderCell: p => lastDoseCell(p.row) },
    {
      field: 'nextDue',
      headerName: 'Scheduled',
      width: 170,
      // A row is EITHER upcoming OR overdue — one scheduled date, and the Status chip says
      // which side of it we're on. So the column is the neutral fact ("Scheduled"), in neutral
      // ink; labelling it "Upcoming" contradicted every overdue row.
      renderCell: p => txt(p.row.nextDue ? fmtDate(p.row.nextDue) : '—', c.neutralSecondary)
    },
    // left-aligned like every other column (user rule: nothing right-aligns)
    { field: 'status', headerName: 'Status', width: 190, renderCell: p => statusPill(p.row) }
  ]

  const statusTabs = (
    // Never wraps: one row, overflow scrolls (the kit's underline-tab pattern).
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', ...thinScrollbarSx(theme) }}>
      {STATUS_TABS.map(m => {
        const active = statusTab === m.key
        const accent = accents[m.key]

        return (
          <Box
            key={m.key}
            onClick={() => {
              setStatusTab(m.key)
              tbl.setPaginationModel(p => ({ ...p, page: 0 }))
            }}
            role='tab'
            aria-selected={active}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5, flexShrink: 0, borderBottom: '2.5px solid', borderColor: active ? accent : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { borderColor: active ? accent : c.OutlineVariant } }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: active ? accent : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {m.label}
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: active ? accent : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
              {counts[m.key].toLocaleString()}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconButton onClick={onBack} sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${c.OutlineVariant}` }}>
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h5' sx={{ fontWeight: 600 }} noWrap>
            {type.name}
          </Typography>
          <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
            {type.coveragePct}% {w.coverageLabel.toLowerCase()} •{' '}
            <Box component='span' sx={{ color: type.overdue ? c.Tertiary : c.neutralSecondary, fontWeight: type.overdue ? 700 : 400 }}>
              {type.overdue} {w.overdueWord}
            </Box>{' '}
            • {type.due} {w.dueWord} • {type.never} {w.statusLabels.never.toLowerCase()}
          </Typography>
        </Box>
      </Box>

      {/* One chart (2026-07-30 review): administered stacked with missed — full bar height =
          due that month. Right panel: this vaccine's overdue animals bucketed by age → sheet. */}
      <SectionCard
        title='Doses • Administered vs Overdue'
        action={<TrendRangeTabs value={doseRange} onPick={setDoseRange} color={theme.palette.primary.dark} />}
        titleMb={3}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, gap: 6, alignItems: 'stretch' }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', mb: 2 }}>
              {[
                { color: theme.palette.primary.main, label: 'Administered' },
                { color: c.Tertiary, label: 'Overdue' }
              ].map(l => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: l.color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '16px', color: c.neutralSecondary }}>{l.label}</Typography>
                </Box>
              ))}
            </Box>
            <SeasonalColumnChart
              values={slice(derivedDosesPerMonth, doseRange)}
              labels={sliceLabels(doseRange)}
              color={theme.palette.primary.main}
              name={w.doseNoun}
              series2={{ values: slice(derivedMissedPerMonth, doseRange), name: 'Overdue', color: c.Tertiary }}
              height={250}
              padLeft={0}
              onBarClick={onDoseMonth}
              tooltipRows={i => {
                const adm = slice(derivedDosesPerMonth, doseRange)[i] ?? 0
                const miss = slice(derivedMissedPerMonth, doseRange)[i] ?? 0

                return [
                  { color: theme.palette.primary.main, label: 'Administered', value: adm.toLocaleString() },
                  ...(miss ? [{ color: c.Tertiary, label: 'Overdue', value: miss.toLocaleString() }] : []),
                  { label: 'Total', value: (adm + miss).toLocaleString() }
                ]
              }}
            />
          </Box>

          <Box sx={{ borderLeft: { xs: 'none', md: `1px solid ${c.SurfaceVariant}` }, pl: { xs: 0, md: 6 } }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.neutralSecondary }}>
              Overdue by Age
            </Typography>
            <Typography
              sx={{
                fontSize: '36px',
                fontWeight: 800,
                lineHeight: 1.15,
                color: type.overdue ? c.Tertiary : c.neutralSecondary,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {type.overdue.toLocaleString()}
            </Typography>
            {buckets.map((b, i) => (
              <Box
                key={b.label}
                onClick={b.animals.length ? () => setBucketDrill({ label: b.label, animals: b.animals }) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  py: 3,
                  px: 1,
                  borderBottom: i === buckets.length - 1 ? 'none' : `0.5px solid ${c.OutlineVariant}`,
                  cursor: b.animals.length ? 'pointer' : 'default',
                  '&:hover': b.animals.length ? { backgroundColor: c.Surface } : undefined
                }}
              >
                <Typography sx={{ flex: 1, fontSize: '16px', fontWeight: 600, color: c.OnSurfaceVariant }}>
                  {b.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: b.animals.length ? [c.neutralSecondary, c.neutralSecondary, c.OnSurfaceVariant, c.Tertiary][i] : c.Outline
                  }}
                >
                  {b.animals.length}
                </Typography>
                {b.animals.length > 0 && <Icon icon='mdi:chevron-right' fontSize={17} color={c.Outline} />}
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>

      {/* animal table — site filter (dropdown → side sheet) + search live together in the
          header. Landscape: one row (tabs left, controls right). Portrait: tabs row, then
          full-width search running up to the right-aligned site filter. */}
      {(() => {
        const siteFilterCtl = (
          <SiteFilterControl
            sites={type.sites}
            sitesTotal={type.sitesTotal}
            tracked={type.tracked}
            value={siteFilter}
            onChange={v => {
              setSiteFilter(v)
              tbl.setPaginationModel(p => ({ ...p, page: 0 }))
            }}
            overdueWord={w.overdueWord}
          />
        )
        const searchCtl = <TableSearch value={q} onChange={onQ} placeholder='Search animals…' grow={portrait} />
        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            {statusTabs}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {searchCtl}
              {siteFilterCtl}
            </Box>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : statusTabs}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {searchCtl}
            </Box>
          )
        }
        titleMb={2}
      >
        {rows.length ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: PreventiveTypeAnimal }) => setDrill(p.row)}
          />
        ) : (
          <EmptyState message='No animals for this filter' />
        )}
      </SectionCard>
        )
      })()}

      <MonthDosesDrawer
        key={monthDrill?.label ?? 'month'}
        data={monthDrill}
        typeName={type.name}
        icon={icon}
        onAnimal={a => setDrill(a)}
        onClose={() => setMonthDrill(null)}
      />
      <BucketDrawer data={bucketDrill} typeName={type.name} icon={icon} onAnimal={a => setDrill(a)} onClose={() => setBucketDrill(null)} />
      <DoseHistoryDrawer animal={drill} typeName={type.name} icon={icon} dose={type.dose} onClose={() => setDrill(null)} />
    </Box>
  )
}

const PreventivePanel: React.FC<{ tab: TabKey; prog: PreventiveProgram; months: string[] }> = ({ tab, prog, months }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const w = wordingFor(tab, prog.kind)
  const icon = PROGRAM_ICON[tab] ?? 'mdi:medical-bag'
  const sel = (prog.types ?? []).find(t => t.name === selected)

  if (!prog.types?.length) return <EmptyState message={`No ${w.typeNoun} data for this species`} />

  return sel ? (
    <PreventiveDetail key={sel.name} type={sel} months={months} w={w} icon={icon} onBack={() => setSelected(null)} />
  ) : (
    <PreventiveIndex
      prog={prog}
      w={w}
      icon={icon}
      programLabel={tab.charAt(0).toUpperCase() + tab.slice(1)}
      months={months}
      onPick={setSelected}
    />
  )
}

/* ══ Prescription (curative medicine) — usage + recency frame, NO schedule concepts ══
   Stat strip (5 clickable tiles) → medicines table → Most Used; medicine click → detail
   (header stats + doses-per-month + animal list → dose dates). 2026-07-30 stakeholder ask:
   "how many animals are given in 30/60 days • which medicine they're using more often". */

const RX_ICON = PROGRAM_ICON.prescription

type RxSheetTab = 'courses' | 'animals' | 'd30' | 'd60' | 'missed'

/** animal × medicine pair — the dose-history drill target used across the prescription sheets. */
type RxDrill = { a: PreventiveTypeAnimal; med: RxMedicine } | null

const rxCutoff = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

/** Animal click → that animal's whole prescription story: one section per medicine, dose dates
 *  with amounts. Deep clinical detail stays in the Animal Health Record (2026-07-30: "go into
 *  the animal record and see that"). */
const RxAnimalDrawer: React.FC<{ animal: RxAnimalRollup | null; rx: RxProgram; onClose: () => void }> = ({
  animal,
  rx,
  onClose
}) => {
  const sections = useMemo(() => {
    if (!animal) return []

    return rx.medicines
      .map(med => ({ med, a: med.animals.find(x => x.aid === animal.aid) }))
      .filter((s): s is { med: RxMedicine; a: PreventiveTypeAnimal } => !!s.a)
      .sort((x, y) => (x.a.lastGiven ?? '') < (y.a.lastGiven ?? '') ? 1 : -1)
  }, [animal, rx])

  return (
    <SheetDrawer open={!!animal} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {animal && (
        <Sheet>
          <SheetHeader avatar title={animal.name} subtitle={animal.site} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {sections.map((s, si) => (
              <SheetSection
                key={s.med.name}
                label={`${s.med.name} • ${s.med.route}`}
                first={si === 0}
                noDivider={si === sections.length - 1}
              >
                {s.a.doses.map((d, i) => {
                  const amt = s.a.amounts?.[i]

                  return (
                    <SheetRow
                      key={i}
                      icon={RX_ICON}
                      iconSize={32}
                      title={fmtDate(d)}
                      last={i === s.a.doses.length - 1}
                      trailing={amt != null && s.med.dose ? <DoseAmount value={amt} unit={s.med.dose.unit} /> : undefined}
                    />
                  )
                })}
              </SheetSection>
            ))}
            {!sections.length && <SheetEmpty>No doses recorded for this animal.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/** Stat-strip drill: ONE sheet, five tabs (the clicked tile lands on its tab). Search + the
 *  app-standard CustomFilterDrawer (Medicine + Site multi-select). Rows drill to dose history;
 *  the Medicines tab hands off to the medicine detail screen. */
const RxStatusSheet: React.FC<{
  openTab: RxSheetTab | null
  rx: RxProgram
  onClose: () => void
}> = ({ openTab, rx, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<RxSheetTab>('courses')
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<RxDrill>(null)
  const [animalDrill, setAnimalDrill] = useState<RxAnimalRollup | null>(null)

  // applied filters (chips) + the drawer's working copy (committed on Apply)
  const [medFilter, setMedFilter] = useState<string[]>([])
  const [siteFilter, setSiteFilter] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMenu, setFilterMenu] = useState<string>('Medicine')
  const [filterQ, setFilterQ] = useState('')
  const [pendMeds, setPendMeds] = useState<string[]>([])
  const [pendSites, setPendSites] = useState<string[]>([])

  useEffect(() => {
    if (openTab) {
      setTab(openTab)
      setQ('')
    }
  }, [openTab])

  const medItems = useMemo(() => rx.medicines.map(m => ({ label: m.name, value: m.name })), [rx])
  const siteItems = useMemo(() => rx.sites.map(s => ({ label: s.site, value: s.site })), [rx])
  const query = q.trim().toLowerCase()
  const matches = (name: string, med: string, site: string) =>
    (!medFilter.length || medFilter.includes(med)) &&
    (!siteFilter.length || siteFilter.includes(site)) &&
    (!query || name.toLowerCase().includes(query) || med.toLowerCase().includes(query) || site.toLowerCase().includes(query))

  const lists = useMemo(() => {
    const courses = rx.courses.filter(cr => matches(cr.name, cr.medicine, cr.site))
    const animals = rollupAnimals(rx).filter(
      a =>
        (!medFilter.length || a.medicines.some(m => medFilter.includes(m))) &&
        (!siteFilter.length || siteFilter.includes(a.site)) &&
        (!query || a.name.toLowerCase().includes(query) || a.site.toLowerCase().includes(query))
    )
    const window = (days: number) => {
      const cut = rxCutoff(days)
      const out: { a: PreventiveTypeAnimal; med: RxMedicine }[] = []
      for (const med of rx.medicines)
        for (const a of med.animals)
          if ((a.lastGiven ?? '') >= cut && matches(a.name, med.name, a.site)) out.push({ a, med })

      return out.sort((x, y) => ((x.a.lastGiven ?? '') < (y.a.lastGiven ?? '') ? 1 : -1))
    }
    const missed = rx.medicines
      .flatMap(med => med.missed.map(m => ({ med, m })))
      .filter(x => matches(x.m.name, x.med.name, x.m.site))
      .sort((x, y) => (x.m.date < y.m.date ? 1 : -1))

    return { courses, animals, d30: window(30), d60: window(60), missed }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rx, q, medFilter, siteFilter])

  const tabs: { key: RxSheetTab; label: string }[] = [
    { key: 'courses', label: `Prescriptions • ${lists.courses.length}` },
    { key: 'animals', label: `Animals • ${lists.animals.length}` },
    { key: 'd30', label: `Last 30 Days • ${lists.d30.length}` },
    { key: 'd60', label: `Last 60 Days • ${lists.d60.length}` },
    { key: 'missed', label: `Missed • ${lists.missed.length}` }
  ]

  const appliedCount = medFilter.length + siteFilter.length
  const openFilter = () => {
    setPendMeds(medFilter)
    setPendSites(siteFilter)
    setFilterMenu('Medicine')
    setFilterQ('')
    setFilterOpen(true)
  }
  const applyFilters = () => {
    setMedFilter(pendMeds)
    setSiteFilter(pendSites)
    setFilterOpen(false)
  }
  const clearAll = () => {
    setPendMeds([])
    setPendSites([])
  }

  const filteredMedItems = filterQ.trim()
    ? medItems.filter(i => i.label.toLowerCase().includes(filterQ.trim().toLowerCase()))
    : medItems
  const filteredSiteItems = filterQ.trim()
    ? siteItems.filter(i => i.label.toLowerCase().includes(filterQ.trim().toLowerCase()))
    : siteItems

  const countText = (n: number, noun: string) => (
    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: c.OnSurfaceVariant, whiteSpace: 'nowrap', lineHeight: '24px', fontVariantNumeric: 'tabular-nums' }}>
      {n.toLocaleString()}{' '}
      <Box component='span' sx={{ fontSize: '14px', fontWeight: 600, color: c.neutralSecondary }}>
        {noun}
      </Box>
    </Typography>
  )

  const drillCourse = (aid: string, medicine: string) => {
    const med = rx.medicines.find(m => m.name === medicine)
    const a = med?.animals.find(x => x.aid === aid)
    if (med && a) setDrill({ a, med })
  }

  return (
    <SheetDrawer open={!!openTab} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      <Sheet>
        <SheetHeader
          icon={RX_ICON}
          title='Prescription'
          subtitle={`${rx.summary.animalsTreated.toLocaleString()} animals treated`}
          onClose={onClose}
        />
        <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: SHEET_PX }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SheetSearch value={q} onChange={setQ} placeholder='Search animals, medicines, sites…' />
          </Box>
          <Box sx={{ pt: 2 }}>
            <FilterButton
              onClick={openFilter}
              appliedFiltersCount={appliedCount}
              bgColor={theme.palette.background.paper}
              border={`1px solid ${c.SurfaceVariant}`}
            />
          </Box>
        </Box>
        {appliedCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, px: SHEET_PX, pt: 2 }}>
            {medFilter.map(v => (
              <FilterChip key={v} label={v} onClear={() => setMedFilter(prev => prev.filter(x => x !== v))} />
            ))}
            {siteFilter.map(v => (
              <FilterChip key={v} label={v} onClear={() => setSiteFilter(prev => prev.filter(x => x !== v))} />
            ))}
          </Box>
        )}
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {tab === 'courses' &&
            lists.courses.map((cr, i) => (
              <SheetRow
                key={`${cr.aid}-${cr.medicine}-${cr.start}`}
                avatar
                title={cr.name}
                caption={
                  <>
                    <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                      {cr.medicine}
                      <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                        •
                      </Box>
                      {cr.site}
                    </Box>
                    <Box component='span' sx={{ display: 'block' }}>Started {fmtDate(cr.start)}</Box>
                  </>
                }
                last={i === lists.courses.length - 1}
                onClick={() => drillCourse(cr.aid, cr.medicine)}
                chevron
                trailing={countText(cr.doses, cr.doses === 1 ? 'dose' : 'doses')}
              />
            ))}
          {tab === 'animals' &&
            lists.animals.map((a, i) => (
              <SheetRow
                key={a.aid}
                avatar
                title={a.name}
                caption={
                  <>
                    <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                      {a.medicines.length === 1 ? a.medicines[0] : `${a.medicines.length} medicines`}
                      <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                        •
                      </Box>
                      {a.site}
                    </Box>
                    <Box component='span' sx={{ display: 'block' }}>Last given {fmtDate(a.lastGiven)}</Box>
                  </>
                }
                last={i === lists.animals.length - 1}
                onClick={() => setAnimalDrill(a)}
                chevron
                trailing={countText(a.courses, a.courses === 1 ? 'prescription' : 'prescriptions')}
              />
            ))}
          {(tab === 'd30' || tab === 'd60') &&
            lists[tab].map((r, i) => (
              <SheetRow
                key={`${r.med.name}-${r.a.aid}`}
                avatar
                title={r.a.name}
                caption={
                  <>
                    <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                      {r.med.name}
                      <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                        •
                      </Box>
                      {r.a.site}
                    </Box>
                    <Box component='span' sx={{ display: 'block' }}>{fmtDate(r.a.lastGiven)}</Box>
                  </>
                }
                last={i === lists[tab].length - 1}
                onClick={() => setDrill({ a: r.a, med: r.med })}
                chevron
              />
            ))}
          {tab === 'missed' &&
            lists.missed.map((x, i) => (
              <SheetRow
                key={`${x.med.name}-${x.m.aid}-${x.m.date}`}
                avatar
                title={x.m.name}
                caption={
                  <>
                    <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                      {x.med.name}
                      <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                        •
                      </Box>
                      {x.m.site}
                    </Box>
                    <Box component='span' sx={{ display: 'block' }}>
                      {x.m.reason} • {fmtDate(x.m.date)}
                    </Box>
                  </>
                }
                last={i === lists.missed.length - 1}
                onClick={() => drillCourse(x.m.aid, x.med.name)}
                chevron
                trailing={<StatusChip label={x.m.kind === 'stopped' ? 'Stopped' : 'Skipped'} tone='error' />}
              />
            ))}
          {!lists[tab].length && <SheetEmpty>No records in this group.</SheetEmpty>}
        </Box>
      </Sheet>

      <CustomFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        onClearAll={clearAll}
        filterLists={['Medicine', 'Site']}
        selectedOptions={{ Medicine: pendMeds, Site: pendSites }}
        selectedItem={filterMenu}
        onSelectItem={(m: string) => {
          setFilterMenu(m)
          setFilterQ('')
        }}
      >
        {filterMenu === 'Medicine' && (
          <FilterContent
            menuName='Medicine'
            searchQuery={filterQ}
            onSearch={setFilterQ}
            selectedOptions={pendMeds}
            onOptionChange={(id: string) =>
              setPendMeds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
            }
            selectAllHandler={() =>
              setPendMeds(prev => (prev.length === medItems.length ? [] : medItems.map(i => i.value)))
            }
            items={filteredMedItems}
            isAllSelected={medItems.length > 0 && pendMeds.length === medItems.length}
            searchLoading={false}
            placeholder='Search medicines…'
            enableSelectAll
          />
        )}
        {filterMenu === 'Site' && (
          <FilterContent
            menuName='Site'
            searchQuery={filterQ}
            onSearch={setFilterQ}
            selectedOptions={pendSites}
            onOptionChange={(id: string) =>
              setPendSites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
            }
            selectAllHandler={() =>
              setPendSites(prev => (prev.length === siteItems.length ? [] : siteItems.map(i => i.value)))
            }
            items={filteredSiteItems}
            isAllSelected={siteItems.length > 0 && pendSites.length === siteItems.length}
            searchLoading={false}
            placeholder='Search sites…'
            enableSelectAll
          />
        )}
      </CustomFilterDrawer>

      <DoseHistoryDrawer
        animal={drill?.a ?? null}
        typeName={drill?.med.name ?? ''}
        icon={RX_ICON}
        dose={drill?.med.dose}
        showLate={false}
        onClose={() => setDrill(null)}
      />
      <RxAnimalDrawer animal={animalDrill} rx={rx} onClose={() => setAnimalDrill(null)} />
    </SheetDrawer>
  )
}

/** Month bar click → that month's dose story for ONE medicine: Administered (→ dose history)
 *  and Missed (skipped with reason / stopped course) — the prescription analog of the
 *  vaccination detail's month drill. Missed = not-done → coral chips. */
const RxMonthDrawer: React.FC<{
  data: { label: string } | null
  med: RxMedicine | null
  onClose: () => void
}> = ({ data, med, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<'given' | 'missed'>('given')
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)

  useEffect(() => {
    if (data) {
      setTab('given')
      setQ('')
      setSite(null)
    }
  }, [data])

  const { given, missed } = useMemo(() => {
    if (!data || !med) return { given: [] as { a: PreventiveTypeAnimal; date: string }[], missed: [] as RxMissedDose[] }
    const givenRows: { a: PreventiveTypeAnimal; date: string }[] = []
    for (const a of med.animals) {
      const date = a.doses.find(d => doseMonthLabel(d) === data.label)
      if (date) givenRows.push({ a, date })
    }
    givenRows.sort((x, y) => (x.date < y.date ? 1 : -1))

    return { given: givenRows, missed: med.missed.filter(m => doseMonthLabel(m.date) === data.label) }
  }, [data, med])

  const query = q.trim().toLowerCase()
  const siteOptions = useMemo(
    () => Array.from(new Set([...given.map(g => g.a.site), ...missed.map(m => m.site)])).sort(),
    [given, missed]
  )
  const shownGiven = given
    .filter(g => !site || g.a.site === site)
    .filter(g => !query || g.a.name.toLowerCase().includes(query) || g.a.site.toLowerCase().includes(query))
  const shownMissed = missed
    .filter(m => !site || m.site === site)
    .filter(m => !query || m.name.toLowerCase().includes(query) || m.site.toLowerCase().includes(query))

  const tabs: { key: 'given' | 'missed'; label: string }[] = [
    { key: 'given', label: `Administered • ${shownGiven.length}` },
    { key: 'missed', label: `Missed • ${shownMissed.length}` }
  ]

  return (
    <SheetDrawer open={!!data} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {data && med && (
        <Sheet>
          <SheetHeader icon={RX_ICON} title={`${data.label} • ${med.name}`} onClose={onClose} />
          <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
          <SheetFilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder='Search animals…'
            facetOptions={siteOptions}
            facetValue={site}
            onFacet={setSite}
            facetPlaceholder='All Sites'
            facetIcon='mdi:map-marker-outline'
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
            {tab === 'given' &&
              shownGiven.map((g, i) => (
                <SheetRow
                  key={`${g.a.aid}-${g.date}`}
                  avatar
                  title={g.a.name}
                  caption={
                    <>
                      <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                        {g.a.site}
                      </Box>
                      <Box component='span' sx={{ display: 'block' }}>{fmtDate(g.date)}</Box>
                    </>
                  }
                  last={i === shownGiven.length - 1}
                  onClick={() => setDrill(g.a)}
                  chevron
                />
              ))}
            {tab === 'missed' &&
              shownMissed.map((m, i) => (
                <SheetRow
                  key={`${m.aid}-${m.date}`}
                  avatar
                  title={m.name}
                  caption={
                    <>
                      <Box component='span' sx={{ display: 'block', color: c.OnSurfaceVariant }}>
                        {m.reason}
                        <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
                          •
                        </Box>
                        {m.site}
                      </Box>
                      <Box component='span' sx={{ display: 'block' }}>{fmtDate(m.date)}</Box>
                    </>
                  }
                  last={i === shownMissed.length - 1}
                  trailing={<StatusChip label={m.kind === 'stopped' ? 'Stopped' : 'Skipped'} tone='error' />}
                />
              ))}
            {!(tab === 'given' ? shownGiven : shownMissed).length && <SheetEmpty>No doses in this group.</SheetEmpty>}
          </Box>
          <DoseHistoryDrawer
            animal={drill}
            typeName={med.name}
            icon={RX_ICON}
            dose={med.dose}
            showLate={false}
            onClose={() => setDrill(null)}
          />
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/** Screen 2 — one medicine: header stats, doses-per-month trend (point → month sheet), animal
 *  list → dose dates. No schedule concepts — the frame is who got it, how much, how recently. */
const PrescriptionDetail: React.FC<{ med: RxMedicine; rx: RxProgram; onBack: () => void }> = ({ med, rx, onBack }) => {
  const { txt, animalCell, c, theme } = useCells()
  const portrait = useMediaQuery('(orientation: portrait)')
  const [doseRange, setDoseRange] = useState<RangePreset>('last_1y')
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)
  const [monthDrill, setMonthDrill] = useState<{ label: string } | null>(null)

  // prescriptions written per animal for THIS medicine (the table's Prescriptions column)
  const coursesByAid = useMemo(() => {
    const map = new Map<string, number>()
    for (const cr of rx.courses) if (cr.medicine === med.name) map.set(cr.aid, (map.get(cr.aid) ?? 0) + 1)

    return map
  }, [rx, med])

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()

    return med.animals
      .filter(a => !query || `${a.name} ${a.aid} ${a.site}`.toLowerCase().includes(query))
      .map(a => ({ id: a.aid, ...a, courses: coursesByAid.get(a.aid) ?? 1, doseCount: a.doses.length }))
  }, [med.animals, q, coursesByAid])
  const tbl = useSortableTable(rows, { field: 'lastGiven', sort: 'desc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    { field: 'courses', headerName: 'Prescriptions', width: 180, renderCell: p => txt(p.row.courses, c.neutralSecondary, 600) },
    { field: 'doseCount', headerName: 'Doses', width: 120, renderCell: p => txt(p.row.doseCount, c.neutralSecondary, 600) },
    // date only — the given amount lives in the dose-history sheet, not this table
    { field: 'lastGiven', headerName: 'Last Given', width: 170, renderCell: p => txt(p.row.lastGiven ? fmtDate(p.row.lastGiven) : '—', c.neutralSecondary) }
  ]

  const monthsOf = (preset: RangePreset) => (preset === 'last_1y' ? 12 : preset === 'last_2y' ? 24 : rx.months.length || 36)
  const n = monthsOf(doseRange)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconButton onClick={onBack} sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${c.OutlineVariant}` }}>
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
        </IconButton>
        <Typography variant='h5' sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
          {med.name}
        </Typography>
      </Box>

      <StatsRow cols={4}>
        <StatTile label='Animals' value={med.tracked.toLocaleString()} tone='neutral' />
        <StatTile label='Prescriptions' value={med.courses.toLocaleString()} tone='neutral' />
        <StatTile label='Doses Given' value={med.dosesGiven.toLocaleString()} tone='neutral' />
        <StatTile label='Doses Missed' value={med.dosesMissed.toLocaleString()} tone='error' />
      </StatsRow>

      {/* Administered stacked with missed (skipped + stopped) — full bar = scheduled that month.
          The prescription analog of vaccination's Administered-vs-Overdue chart. */}
      <SectionCard
        title='Doses • Administered vs Missed'
        action={<TrendRangeTabs value={doseRange} onPick={setDoseRange} color={theme.palette.primary.dark} />}
        titleMb={3}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', mb: 2 }}>
          {[
            { color: theme.palette.primary.main, label: 'Administered' },
            { color: c.Tertiary, label: 'Missed' }
          ].map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: l.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '16px', color: c.neutralSecondary }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
        <SeasonalColumnChart
          values={med.dosesPerMonth.slice(-n)}
          labels={rx.months.slice(-n)}
          color={theme.palette.primary.main}
          name='Administered'
          series2={{ values: med.missedPerMonth.slice(-n), name: 'Missed', color: c.Tertiary }}
          height={250}
          padLeft={0}
          onBarClick={(label: string) => setMonthDrill({ label })}
          tooltipRows={(i: number) => {
            const adm = med.dosesPerMonth.slice(-n)[i] ?? 0
            const miss = med.missedPerMonth.slice(-n)[i] ?? 0

            return [
              { color: theme.palette.primary.main, label: 'Administered', value: adm.toLocaleString() },
              ...(miss ? [{ color: c.Tertiary, label: 'Missed', value: miss.toLocaleString() }] : []),
              { label: 'Scheduled', value: (adm + miss).toLocaleString() }
            ]
          }}
        />
      </SectionCard>

      {/* Portrait: title row, then full-width search (shipped two-row grammar). */}
      <SectionCard
        title={
          <Box sx={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: 4, width: portrait ? '100%' : undefined, minWidth: 0 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Animals{' '}
              <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
                • {med.tracked.toLocaleString()}
              </Box>
            </Typography>
            {portrait && <TableSearch value={q} onChange={onQ} placeholder='Search animals…' grow />}
          </Box>
        }
        action={portrait ? undefined : <TableSearch value={q} onChange={onQ} placeholder='Search animals…' />}
        titleMb={3}
      >
        {rows.length ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: PreventiveTypeAnimal }) => setDrill(p.row)}
          />
        ) : (
          <EmptyState message='No animals match this search' />
        )}
      </SectionCard>

      <RxMonthDrawer data={monthDrill} med={med} onClose={() => setMonthDrill(null)} />
      <DoseHistoryDrawer animal={drill} typeName={med.name} icon={RX_ICON} dose={med.dose} showLate={false} onClose={() => setDrill(null)} />
    </Box>
  )
}

/** Screen 1 — the medicine index: 5 clickable stat tiles + one row per medicine (most used
 *  first) + Most Used trend. Cure frame — usage and recency, no coverage/overdue columns. */
const PrescriptionIndex: React.FC<{ rx: RxProgram; onPick: (name: string) => void }> = ({ rx, onPick }) => {
  const { txt, c } = useCells()
  const portrait = useMediaQuery('(orientation: portrait)')
  const [q, setQ] = useState('')
  const [statusSheet, setStatusSheet] = useState<RxSheetTab | null>(null)

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = query ? rx.medicines.filter(m => m.name.toLowerCase().includes(query)) : rx.medicines

    return list.map(m => ({ id: m.name, ...m, animalsN: m.tracked }))
  }, [rx, q])
  const tbl = useSortableTable(rows, { field: 'animalsN', sort: 'desc' })

  // the "hot" 30-day count — same rule as the Lab tab's hot column (≥1.3× the non-zero average)
  const hot30 = useMemo(() => {
    const vals = rx.medicines.map(m => m.given30).filter(v => v > 0)
    if (vals.length < 2) return Infinity

    return (vals.reduce((s, v) => s + v, 0) / vals.length) * 1.3
  }, [rx])

  const num = (v: number, color: string, weight = 600) => (
    <Typography sx={{ fontSize: '18px', fontWeight: weight, color, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
  )

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Medicine', flex: 1, minWidth: 200, renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    { field: 'animalsN', headerName: 'Animals', width: 130, renderCell: p => num(p.row.animalsN, c.neutralSecondary) },
    { field: 'courses', headerName: 'Prescriptions', width: 180, renderCell: p => num(p.row.courses, c.neutralSecondary) },
    {
      field: 'given30',
      headerName: 'Last 30 Days',
      width: 160,
      renderCell: p => num(p.row.given30, p.row.given30 ? (p.row.given30 >= hot30 ? c.Tertiary : c.OnSurfaceVariant) : c.Outline, p.row.given30 >= hot30 ? 700 : 600)
    },
    { field: 'given60', headerName: 'Last 60 Days', width: 160, renderCell: p => num(p.row.given60, p.row.given60 ? c.neutralSecondary : c.Outline) },
    { field: 'lastGiven', headerName: 'Last Given', width: 160, renderCell: p => txt(p.row.lastGiven ? fmtDate(p.row.lastGiven) : '—', c.neutralSecondary) }
  ]

  // Most Used reuse: the medicines ARE PreventiveTypes; site rows say "animals treated" instead
  // of coverage wording, and dose sheets suppress the (schedule-only) lateness caption.
  const progLike = useMemo<PreventiveProgram>(
    () => ({
      kind: 'ongoing',
      summary: {
        coveragePct: 0,
        coverageTrendPct: 0,
        overdue: 0,
        dueIn30: 0,
        never: 0,
        animalsTracked: rx.summary.animalsTreated
      },
      topOverdue: [],
      aging: { d0_30: 0, d30_90: 0, d90plus: 0 },
      bySite: [],
      sites: rx.sites,
      types: rx.medicines,
      records: []
    }),
    [rx]
  )
  const w = wordingFor('prescription', 'ongoing')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <StatsRow cols={5}>
        <StatTile
          label='Prescriptions'
          value={rx.summary.prescriptions.toLocaleString()}
          tone='neutral'
          onClick={() => setStatusSheet('courses')}
        />
        <StatTile
          label='Animals Treated'
          value={rx.summary.animalsTreated.toLocaleString()}
          tone='neutral'
          onClick={() => setStatusSheet('animals')}
        />
        <StatTile
          label='Given in Last 30 Days'
          value={rx.summary.given30.toLocaleString()}
          tone='neutral'
          onClick={() => setStatusSheet('d30')}
        />
        <StatTile
          label='Given in Last 60 Days'
          value={rx.summary.given60.toLocaleString()}
          tone='neutral'
          onClick={() => setStatusSheet('d60')}
        />
        <StatTile
          label='Doses Missed'
          value={rx.summary.dosesMissed.toLocaleString()}
          tone='error'
          onClick={() => setStatusSheet('missed')}
        />
      </StatsRow>
      <RxStatusSheet openTab={statusSheet} rx={rx} onClose={() => setStatusSheet(null)} />
      {/* Portrait: title row, then full-width search (shipped two-row grammar). */}
      <SectionCard
        title={
          <Box sx={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: 4, width: portrait ? '100%' : undefined, minWidth: 0 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Medicines{' '}
              <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
                • {rx.medicines.length}
              </Box>
            </Typography>
            {portrait && <TableSearch value={q} onChange={setQ} placeholder='Search medicines…' grow />}
          </Box>
        }
        action={portrait ? undefined : <TableSearch value={q} onChange={setQ} placeholder='Search medicines…' />}
        titleMb={3}
      >
        {rows.length ? (
          <DetailTable
            columns={columns}
            rows={tbl.rows}
            total={tbl.total}
            paginationModel={tbl.paginationModel}
            setPaginationModel={tbl.setPaginationModel}
            sortModel={tbl.sortModel}
            handleSortModel={tbl.handleSortModel}
            onRowClick={(p: { row: RxMedicine }) => onPick(p.row.name)}
          />
        ) : (
          <EmptyState message='No medicines match this search' />
        )}
      </SectionCard>
      <MostUsedSection
        prog={progLike}
        w={w}
        months={rx.months}
        icon={RX_ICON}
        siteCaption={s => `${s.animals.toLocaleString()} animal${s.animals === 1 ? '' : 's'} treated`}
        showLate={false}
      />
    </Box>
  )
}

const PrescriptionPanel: React.FC<{ rx: RxProgram }> = ({ rx }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const sel = rx.medicines.find(m => m.name === selected)

  return sel ? (
    <PrescriptionDetail key={sel.name} med={sel} rx={rx} onBack={() => setSelected(null)} />
  ) : (
    <PrescriptionIndex rx={rx} onPick={setSelected} />
  )
}

/** Rounded pill: type name + a metric value. Optional `dot` = worst-active-prognosis marker. */
const ChipTag: React.FC<{
  label: string
  value: React.ReactNode
  valueColor: string
  /** [bg, border] from the medical-tag ramp — the pill wears its worst severity/prognosis. */
  tint?: [string, string]
  onClick?: () => void
}> = ({ label, value, valueColor, tint, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        px: 4,
        py: 1.25,
        borderRadius: '999px',
        border: `1px solid ${tint ? tint[1] : c.SurfaceVariant}`,
        backgroundColor: tint ? tint[0] : theme.palette.background.paper,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease',
        '&:hover': onClick ? { boxShadow: '0 2px 8px rgba(31,81,91,0.14)' } : undefined
      }}
    >
      <Typography variant='body2' sx={{ fontWeight: 500, color: c.OnSurfaceVariant }}>
        {label}
      </Typography>
      <Box component='span' sx={{ fontSize: '0.95rem', fontWeight: 700, color: valueColor, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Box>
    </Box>
  )
}

/**
 * Type list for the stat-tile side sheet, rendered with the standard antz DetailTable (DataGrid):
 * Symptom · Records · Animals · Recurrence, sortable headers, standard row height/colours.
 * Every row is clickable → filters the animal table.
 */
const TypeTable: React.FC<{
  items: { name: string; count: number; animals: number; category?: string }[]
  noun: string
  // MUST reference a real column field below — a sortModel field with no matching column throws
  // DataGrid's "Maximum update depth exceeded" crash.
  initialSort?: { field: 'count' | 'animals' | 'ratio' | 'name'; sort: 'asc' | 'desc' }
  onPick: (name: string) => void
}> = ({ items, noun, initialSort = { field: 'count', sort: 'desc' }, onPick }) => {
  const { txt, c, theme } = useCells()
  const rows = useMemo(
    () =>
      items.map((d, i) => ({ id: i, name: d.name, category: d.category, count: d.count, animals: d.animals, ratio: d.count / Math.max(1, d.animals) })),
    [items]
  )
  const tbl = useSortableTable(rows, initialSort)
  const hasCategory = items.some(d => d.category)

  const columns: GridColDef[] = [
    { field: 'name', headerName: noun === 'symptoms' ? 'Symptom' : 'Assessment', flex: 1, minWidth: 200, renderCell: p => txt(p.row.name, undefined, 600) },
    ...(hasCategory
      ? [
          {
            field: 'category',
            headerName: 'Category',
            width: 170,
            renderCell: (p: any) => txt(p.row.category || '—', c.neutralSecondary)
          } as GridColDef
        ]
      : []),
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

/* ═══════════════════════════════════════════════ Clinical panel (merged Symptoms + Clinical Assessment) */
const ClinicalMergedPanel: React.FC<{
  symptoms?: ClinicalProgram
  diagnosis?: ClinicalProgram
  range: RangeSelection
}> = ({ symptoms, diagnosis, range }) => {
  const { txt, animalCell, c, theme } = useCells()
  const tagColors = medTagMap(c)
  const portrait = useMediaQuery('(orientation: portrait)')

  // table scoping
  const [domainTab, setDomainTab] = useState<DomainTab>('all')
  const [typeFilter, setTypeFilter] = useState<{ domain: Domain; name: string } | null>(null)
  const [monthFilter, setMonthFilter] = useState<{ idx: number; y: number; m: number; label: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved' | null>(null)
  const [sevFilter, setSevFilter] = useState<string | null>(null)
  const [progFilter, setProgFilter] = useState<string | null>(null)
  const [view, setView] = useState<'animal' | 'record'>('animal')
  const [q, setQ] = useState('')
  // ranked panels (Top Symptoms | Top Conditions)
  const [symCat, setSymCat] = useState<string | null>(null)
  const [condCat, setCondCat] = useState<string | null>(null)
  const [viewAll, setViewAll] = useState<Domain | null>(null)
  // sheets / drawers
  const [typeSheet, setTypeSheet] = useState<{ domain: Domain; name: string } | null>(null)
  const [sheetRange, setSheetRange] = useState<RangePreset>('last_1y')
  const [animalDrill, setAnimalDrill] = useState<AniGroup | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const inWin = useWindow(range)
  const all = range.preset === 'all'

  // One merged, windowed record set with a domain marker.
  const windowed = useMemo(() => {
    const out: MergedRec[] = []
    const push = (prog: ClinicalProgram | undefined, domain: Domain) => {
      for (const r of prog?.records ?? []) if (all || inWin(r.date)) out.push({ ...r, domain })
    }
    push(symptoms, 'symptom')
    push(diagnosis, 'assessment')

    return out
  }, [symptoms, diagnosis, all, range])

  // ── stat band (both domains; 'All time' trusts the precomputed summaries) ──
  const symActive = all ? symptoms?.summary.active ?? 0 : windowed.filter(r => r.domain === 'symptom' && r.status === 'active').length
  const diagActive = all ? diagnosis?.summary.active ?? 0 : windowed.filter(r => r.domain === 'assessment' && r.status === 'active').length
  const affected = new Set(windowed.map(r => r.aid)).size
  const totalCases = all
    ? (symptoms?.summary.active ?? 0) + (symptoms?.summary.resolved ?? 0) + (diagnosis?.summary.active ?? 0) + (diagnosis?.summary.resolved ?? 0)
    : windowed.length
  const totalResolved = all
    ? (symptoms?.summary.resolved ?? 0) + (diagnosis?.summary.resolved ?? 0)
    : windowed.filter(r => r.status === 'resolved').length
  const recoveredPct = totalCases ? Math.round((totalResolved / totalCases) * 100) : 0

  // Worst ACTIVE level per type (falls back to worst overall) → the pill tint from the
  // medical-tag ramp. Symptoms rank by severity (High…Low), assessments by prognosis (Grave…Favourable).
  const worstLevel = useMemo(() => {
    const rankOf = (r: MergedRec) =>
      r.domain === 'assessment' ? PROGNOSIS_ORDER.indexOf(r.prognosis ?? '') : SEVERITY_ORDER.indexOf(r.severity ?? '')
    const act: Record<string, number> = {}
    const any: Record<string, number> = {}
    for (const r of windowed) {
      const rk = rankOf(r)
      if (rk < 0) continue
      const key = `${r.domain}|${r.type}`
      if (any[key] == null || rk < any[key]) any[key] = rk
      if (r.status === 'active' && (act[key] == null || rk < act[key])) act[key] = rk
    }

    return (domain: Domain, type: string): string | undefined => {
      const rk = act[`${domain}|${type}`] ?? any[`${domain}|${type}`]
      if (rk == null) return undefined

      return domain === 'assessment' ? PROGNOSIS_ORDER[rk] : SEVERITY_ORDER[rk]
    }
  }, [windowed])

  // ── ranked types per domain (windowed), each carrying its category ──
  const rankTypes = (domain: Domain, prog?: ClinicalProgram) => {
    if (all && prog) return prog.topTypes.map(t => ({ name: t.name, count: t.count, animals: t.animals ?? 0, category: t.category || 'General' }))
    const m: Record<string, { count: number; animals: Set<string>; category: string }> = {}
    for (const r of windowed) {
      if (r.domain !== domain) continue
      const g = (m[r.type] ??= { count: 0, animals: new Set(), category: r.category || 'General' })
      g.count++
      g.animals.add(r.aid)
    }

    return Object.entries(m)
      .map(([name, v]) => ({ name, count: v.count, animals: v.animals.size, category: v.category }))
      .sort((a, b) => b.count - a.count)
  }
  const symTypes = useMemo(() => rankTypes('symptom', symptoms), [windowed, all, symptoms])
  const condTypes = useMemo(() => rankTypes('assessment', diagnosis), [windowed, all, diagnosis])


  const catsOf = (list: { category: string }[]) => Array.from(new Set(list.map(t => t.category))).sort()
  const symCats = useMemo(() => catsOf(symTypes), [symTypes])
  const condCats = useMemo(() => catsOf(condTypes), [condTypes])

  const filterTypes = <T extends { name: string; category: string }>(list: T[], cat: string | null, tq: string): T[] =>
    list.filter(t => (!cat || t.category === cat) && (!tq.trim() || t.name.toLowerCase().includes(tq.trim().toLowerCase())))
  const symShown = useMemo(() => filterTypes(symTypes, symCat, ''), [symTypes, symCat])
  const condShown = useMemo(() => filterTypes(condTypes, condCat, ''), [condTypes, condCat])

  const PILL_LIMIT = 12

  const scrollToTable = () => setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)

  // Pill click → scope the table to that type + open the graph sheet (fresh at 1Y).
  const pickType = (domain: Domain, name: string) => {
    setDomainTab(domain)
    setTypeFilter({ domain, name })
    setStatusFilter(null)
    setMonthFilter(null)
    setSheetRange('last_1y')
    setTypeSheet({ domain, name })
  }

  // Stat-tile click → scope the table below (kept behaviour).
  const scopeTable = (domain: DomainTab, status: 'active' | 'resolved' | null) => {
    setDomainTab(domain)
    setStatusFilter(status)
    setTypeFilter(null)
    setMonthFilter(null)
    scrollToTable()
  }

  const inMonth = (dateStr: string) => {
    if (!monthFilter) return true
    const d = new Date(dateStr)

    return d.getFullYear() === monthFilter.y && d.getMonth() === monthFilter.m
  }

  // ── combined table scoping (status/type/month/category apply before the domain tabs count) ──
  // Severity/prognosis each scope only their OWN domain's records: Severity=High keeps High
  // symptoms while assessments stay intact (unless the prognosis filter is also set).
  const base = useMemo(() => {
    let s = windowed
    if (statusFilter) s = s.filter(r => r.status === statusFilter)
    if (typeFilter) s = s.filter(r => r.domain === typeFilter.domain && r.type === typeFilter.name)
    if (monthFilter) s = s.filter(r => inMonth(r.date))
    if (sevFilter) s = s.filter(r => r.domain !== 'symptom' || r.severity === sevFilter)
    if (progFilter) s = s.filter(r => r.domain !== 'assessment' || r.prognosis === progFilter)

    return s
  }, [windowed, statusFilter, typeFilter, monthFilter, sevFilter, progFilter])
  const searched = useMemo(() => (q.trim() ? base.filter(r => matchesQuery(r, q)) : base), [base, q])
  const counts: Record<DomainTab, number> = useMemo(
    () => ({
      all: searched.length,
      symptom: searched.filter(r => r.domain === 'symptom').length,
      assessment: searched.filter(r => r.domain === 'assessment').length
    }),
    [searched]
  )
  const scoped = useMemo(() => (domainTab === 'all' ? searched : searched.filter(r => r.domain === domainTab)), [searched, domainTab])
  const scopedNoQ = useMemo(() => (domainTab === 'all' ? base : base.filter(r => r.domain === domainTab)), [base, domainTab])

  const recordRows = useMemo(() => scoped.map((r, i) => ({ ...r, id: i })), [scoped])
  // Animal-wise groups keep the animal's FULL record set; the search then matches whole groups.
  // Each group gets per-domain condition tags at their worst active severity/prognosis.
  const animalRows = useMemo(() => {
    const grouped = groupByAnimal(scopedNoQ, 'date', 'active').map(g => ({
      ...g,
      symChips: worstOf(g.records as MergedRec[], 'symptom'),
      asmChips: worstOf(g.records as MergedRec[], 'assessment')
    }))

    return q.trim() ? grouped.filter(g => matchesQuery(g, q)) : grouped
  }, [scopedNoQ, q])

  const tbl = useSortableTable(recordRows, { field: 'date', sort: 'desc' })
  const atbl = useSortableTable(animalRows, { field: 'active', sort: 'desc' })

  // Row click (either view) → that animal's FULL clinical timeline, rebuilt from the
  // un-chip-filtered window. Filters find the animal; the drawer shows the whole story —
  // the filtered record appears in place among the animal's other symptoms/assessments.
  const openAnimal = (aid: string) => {
    const g = groupByAnimal(windowed.filter(r => r.aid === aid), 'date', 'active')[0]
    if (g) setAnimalDrill(g)
  }
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
    atbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }
  const resetPages = () => {
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
    atbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }
  const onSev = (v: string | null) => {
    setSevFilter(v)
    resetPages()
  }
  const onProg = (v: string | null) => {
    setProgFilter(v)
    resetPages()
  }

  // Per-type graph sheet: distinct animals affected per month. The sheet has its own
  // 1Y·2Y·3Y·All range tabs, so it reads the RAW program records, not the page window.
  const sheetSeries = useMemo(() => {
    if (!typeSheet) return null
    const now = new Date()
    const src = (typeSheet.domain === 'symptom' ? symptoms : diagnosis)?.records ?? []
    const recs = src.filter(r => r.type === typeSheet.name)
    let n = sheetRange === 'last_2y' ? 24 : sheetRange === 'last_3y' ? 36 : 12
    if (sheetRange === 'all' && recs.length) {
      const earliest = recs.reduce((min, r) => (r.date < min ? r.date : min), recs[0].date)
      const ed = new Date(earliest)
      n = Math.max(12, (now.getFullYear() - ed.getFullYear()) * 12 + (now.getMonth() - ed.getMonth()) + 1)
    }
    const winStart = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1)
    const inRange = recs.filter(r => new Date(r.date) >= winStart)
    const series = monthlyAnimals(inRange, now, n)
    const peakIdx = series.reduce((mx, b, i) => (b.value > series[mx].value ? i : mx), 0)

    return {
      series,
      totalAnimals: new Set(inRange.map(r => r.aid)).size,
      totalEpisodes: inRange.length,
      peakLabel: series[peakIdx]?.value ? monthForBar(peakIdx, series.length, now).label : '—'
    }
  }, [typeSheet, symptoms, diagnosis, sheetRange])

  // Bar click → close the sheet, filter table by type + that month, Record-wise, scroll to it.
  const onSheetBar = (i: number) => {
    if (!sheetSeries || !typeSheet) return
    const mf = monthForBar(i, sheetSeries.series.length, new Date())
    setDomainTab(typeSheet.domain)
    setTypeFilter(typeSheet)
    setStatusFilter(null)
    setMonthFilter({ idx: i, y: mf.y, m: mf.m, label: mf.label })
    setView('record')
    setTypeSheet(null)
    scrollToTable()
  }
  const onSheetViewAll = () => {
    if (!typeSheet) return
    setDomainTab(typeSheet.domain)
    setTypeFilter(typeSheet)
    setMonthFilter(null)
    setStatusFilter(null)
    setTypeSheet(null)
    scrollToTable()
  }

  /* ── cells / columns ── */
  const domainCell = (domain: Domain) => {
    const meta = DOMAIN_META[domain]
    const color = domain === 'symptom' ? c.Tertiary : theme.palette.secondary.main

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon={meta.icon} fontSize='1.1rem' color={color} />
        <Typography variant='body2' sx={{ fontWeight: 600, color }}>
          {meta.label}
        </Typography>
      </Box>
    )
  }

  // Record-wise: the Type cell IS the colored tag (severity/prognosis + domain icon) — no
  // separate level column. Domain column only on the All tab (redundant on a single-domain tab).
  const columns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 240, renderCell: p => animalCell(p.row.name, p.row.site) },
    ...(domainTab === 'all'
      ? [{ field: 'domain', headerName: 'Domain', width: 160, renderCell: (p: any) => domainCell(p.row.domain) } as GridColDef]
      : []),
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 220,
      renderCell: p => <MedTagChip name={p.row.type} domain={p.row.domain} level={p.row.domain === 'symptom' ? p.row.severity : p.row.prognosis} />
    },
    { field: 'category', headerName: 'Category', width: 170, renderCell: p => txt(p.row.category || '—', c.neutralSecondary) },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: p => <StatusChip label={p.row.status === 'active' ? 'Active' : 'Resolved'} tone={p.row.status === 'active' ? 'error' : 'success'} />
    },
    { field: 'durationDays', headerName: 'Duration', width: 145, renderCell: p => txt(`${p.row.durationDays}d`, c.neutralSecondary) },
    { field: 'date', headerName: 'Date', width: 150, renderCell: p => txt(fmtDate(p.row.date), c.neutralSecondary) }
  ]

  // Animal-wise: separate Symptoms / Clinical Assessments tag columns on All; a single-domain
  // tab drops the other column. Widths sized so NO header ever truncates.
  const chipCol = (field: 'symChips' | 'asmChips', headerName: string, domain: Domain): GridColDef => ({
    field,
    headerName,
    flex: 1,
    minWidth: 250,
    sortable: false,
    renderCell: p => (p.row[field].length ? <ChipsCell chips={p.row[field]} domain={domain} /> : txt('—', c.neutralSecondary))
  })
  const animalColumns: GridColDef[] = [
    { field: 'sl_no', headerName: 'No', width: 72, sortable: false, renderCell: p => txt(p.row.sl_no, c.neutralSecondary) },
    { field: 'name', headerName: 'Animal', width: 260, renderCell: p => animalCell(p.row.name, p.row.site) },
    ...(domainTab !== 'assessment' ? [chipCol('symChips', 'Symptoms', 'symptom')] : []),
    ...(domainTab !== 'symptom' ? [chipCol('asmChips', 'Clinical Assessments', 'assessment')] : []),
    { field: 'count', headerName: 'Records', width: 160, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.count, c.neutralSecondary) },
    { field: 'active', headerName: 'Active', width: 140, align: 'center', headerAlign: 'center', renderCell: p => txt(p.row.active, p.row.active ? c.Tertiary : c.neutralSecondary, 700) },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: p => (p.row.active ? <StatusChip label='Active' tone='error' /> : <StatusChip label='Recovered' tone='success' />)
    }
  ]

  /* ── table header: left domain tabs (CoL table-tab pattern) + active filter chips ── */
  const DOMAIN_TABS: { key: DomainTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'mdi:format-list-bulleted' },
    { key: 'symptom', label: 'Symptoms', icon: DOMAIN_META.symptom.icon },
    { key: 'assessment', label: 'Assessments', icon: DOMAIN_META.assessment.icon }
  ]
  const accents: Record<DomainTab, string> = { all: c.OnSurfaceVariant, symptom: c.Tertiary, assessment: theme.palette.secondary.main }
  const domainTabs = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', minWidth: 0, ...thinScrollbarSx(theme) }}>
      {DOMAIN_TABS.map(m => {
        const active = domainTab === m.key
        const accent = accents[m.key]

        return (
          <Box
            key={m.key}
            onClick={() => {
              setDomainTab(m.key)
              if (m.key === 'all') setView('animal') // All has no view toggle — Animal-wise only
            }}
            role='tab'
            aria-selected={active}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 0.5,
              flexShrink: 0,
              borderBottom: '2.5px solid',
              borderColor: active ? accent : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: active ? accent : c.OutlineVariant }
            }}
          >
            <Icon icon={m.icon} fontSize='1.25rem' color={active ? accent : c.Outline} />
            <Typography variant='body1' sx={{ fontWeight: 600, color: active ? accent : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {m.label}
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: active ? accent : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
              {counts[m.key].toLocaleString()}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )

  // Active-filter chips live in their own row UNDER the tabs header, never beside the tabs.
  const filterChipsRow = (typeFilter || monthFilter || statusFilter || sevFilter || progFilter) && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      {statusFilter && <FilterChip label={statusFilter === 'active' ? 'Active' : 'Resolved'} onClear={() => setStatusFilter(null)} />}
      {typeFilter && <FilterChip label={typeFilter.name} onClear={() => setTypeFilter(null)} />}
      {monthFilter && <FilterChip label={monthFilter.label} onClear={() => setMonthFilter(null)} />}
      {sevFilter && <FilterChip label={`Severity: ${sevFilter}`} onClear={() => setSevFilter(null)} />}
      {progFilter && <FilterChip label={`Prognosis: ${progFilter}`} onClear={() => setProgFilter(null)} />}
      <Typography
        variant='caption'
        onClick={() => {
          setTypeFilter(null)
          setMonthFilter(null)
          setStatusFilter(null)
          setSevFilter(null)
          setProgFilter(null)
        }}
        sx={{ color: theme.palette.secondary.main, cursor: 'pointer', fontWeight: 600 }}
      >
        Clear
      </Typography>
    </Box>
  )

  // All tab: Animal-wise only, no dropdowns — just search. Symptoms tab: Severity dropdown;
  // Assessments tab: Prognosis dropdown; both domain tabs keep the Animal/Record toggle.
  // Landscape: tabs left, controls right (one row). Portrait: tabs row, then full-width
  // search running into the right-aligned dropdown + toggle (shipped two-row grammar).
  const levelCtl =
    domainTab === 'symptom' ? (
      <CategoryFilter
        options={SEVERITY_ORDER}
        value={sevFilter}
        onChange={onSev}
        width={165}
        placeholder='Severity'
        icon={DOMAIN_META.symptom.icon}
      />
    ) : domainTab === 'assessment' ? (
      <CategoryFilter
        options={[...PROGNOSIS_ORDER].reverse()}
        value={progFilter}
        onChange={onProg}
        width={180}
        placeholder='Prognosis'
        icon={DOMAIN_META.assessment.icon}
      />
    ) : null
  const toggleCtl = domainTab !== 'all' && <ViewToggle view={view} onChange={setView} />
  const searchCtl = <TableSearch value={q} onChange={onQ} placeholder='Search animal, site…' grow={portrait} />
  const tableAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {levelCtl}
      {toggleCtl}
      {searchCtl}
    </Box>
  )
  const stackedTableHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
      {domainTabs}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {searchCtl}
        {levelCtl}
        {toggleCtl}
      </Box>
    </Box>
  )

  /* ── one ranked-types panel (heading + Category dropdown + search share the row) ── */
  const typePanel = (
    domain: Domain,
    title: string,
    types: { name: string; count: number; animals: number; category: string }[],
    shown: { name: string; count: number; animals: number; category: string }[],
    cat: string | null,
    setCat: (v: string | null) => void,
    cats: string[]
  ) => (
    <SectionCard
      title={
        <Typography sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {title}{' '}
          <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
            • {types.length} types
          </Box>
        </Typography>
      }
      action={<CategoryFilter options={cats} value={cat} onChange={setCat} width={185} height={36} />}
      titleMb={3}
    >
      {shown.length ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {shown.slice(0, PILL_LIMIT).map(t => (
            <ChipTag
              key={t.name}
              label={t.name}
              value={t.animals.toLocaleString()}
              valueColor={c.OnSurfaceVariant}
              tint={(() => {
                const lv = worstLevel(domain, t.name)

                return lv ? tagColors[lv] : undefined
              })()}
              onClick={() => pickType(domain, t.name)}
            />
          ))}
          <Box
            onClick={() => setViewAll(domain)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 4,
              py: 1.25,
              borderRadius: '999px',
              border: `1px dashed ${c.Outline}`,
              cursor: 'pointer',
              transition: 'border-color .15s ease',
              '&:hover': { borderColor: theme.palette.primary.main }
            }}
          >
            <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
              {shown.length > PILL_LIMIT ? `+${shown.length - PILL_LIMIT} more` : 'View all'}
            </Typography>
            <Icon icon='mdi:chevron-right' fontSize={16} color={theme.palette.primary.dark} />
          </Box>
        </Box>
      ) : (
        <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
          No records.
        </Typography>
      )}
    </SectionCard>
  )

  const sheetTypeCol = typeSheet?.domain === 'assessment' ? 'Clinical Assessment' : 'Symptom'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Row 1 · ONE stat band across both domains — tiles scope the table below */}
      <StatsRow cols={4}>
        <StatTile label='Animals Affected' value={affected.toLocaleString()} tone='neutral' onClick={() => scopeTable('all', null)} />
        <StatTile label='Active Symptoms' value={symActive.toLocaleString()} tone='error' onClick={() => scopeTable('symptom', 'active')} />
        <StatTile label='Active Assessments' value={diagActive.toLocaleString()} tone='error' onClick={() => scopeTable('assessment', 'active')} />
        <StatTile label='Resolved' value={`${recoveredPct}%`} tone='success' onClick={() => scopeTable('all', 'resolved')} />
      </StatsRow>

      {/* Row 2 · Top symptoms | Top conditions side by side */}
      <ChartsRow md='repeat(2, 1fr)'>
        {typePanel('symptom', 'Top Symptoms', symTypes, symShown, symCat, setSymCat, symCats)}
        {typePanel('assessment', 'Clinical Assessments', condTypes, condShown, condCat, setCondCat, condCats)}
      </ChartsRow>

      {/* Row 3 · ONE combined table */}
      <Box ref={tableRef}>
        <SectionCard title={portrait ? stackedTableHeader : domainTabs} action={portrait ? undefined : tableAction} titleMb={2}>
          {filterChipsRow}
          {view === 'animal' ? (
            <DetailTable
              columns={animalColumns}
              rows={atbl.rows}
              total={atbl.total}
              paginationModel={atbl.paginationModel}
              setPaginationModel={atbl.setPaginationModel}
              sortModel={atbl.sortModel}
              handleSortModel={atbl.handleSortModel}
              onRowClick={(p: { row: AniGroup }) => openAnimal(p.row.aid)}
              rowHeight={88}
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
              onRowClick={(p: { row: MergedRec }) => openAnimal(p.row.aid)}
            />
          )}
        </SectionCard>
      </Box>

      <AnimalRecordsDrawer group={animalDrill} onClose={() => setAnimalDrill(null)} />

      {/* side sheet · full type list for a panel ("View all N") */}
      <SheetDrawer
        open={!!viewAll}
        onClose={() => setViewAll(null)}
        PaperProps={{ sx: sheetPaperSx('xl') }}
      >
        {viewAll && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: SHEET_PX, py: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', color: c.OnSurfaceVariant }} noWrap>
                {viewAll === 'symptom' ? 'All Symptoms' : 'All Clinical Assessments'}
              </Typography>
              <IconButton onClick={() => setViewAll(null)} size='small'>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, py: 3 }}>
              <TypeTable
                items={viewAll === 'symptom' ? symShown : condShown}
                noun={viewAll === 'symptom' ? 'symptoms' : 'assessments'}
                onPick={name => {
                  const dom = viewAll
                  setViewAll(null)
                  pickType(dom, name)
                }}
              />
            </Box>
          </Box>
        )}
      </SheetDrawer>

      {/* wide side sheet · per-type 12-month graph (distinct animals affected) */}
      <SheetDrawer
        open={!!typeSheet}
        onClose={() => setTypeSheet(null)}
        PaperProps={{ sx: sheetPaperSx('xxl') }}
      >
        {typeSheet && sheetSeries && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: SHEET_PX, py: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='caption' sx={{ color: c.neutralSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  {sheetTypeCol}
                </Typography>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', color: c.OnSurfaceVariant }} noWrap>
                  {typeSheet.name}
                </Typography>
              </Box>
              <IconButton onClick={() => setTypeSheet(null)} size='small'>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, py: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 4 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Animals affected
                </Typography>
                <TrendRangeTabs value={sheetRange} onPick={setSheetRange} color={theme.palette.secondary.main} />
              </Box>
              <SeasonalColumnChart
                values={sheetSeries.series.map(s => s.value)}
                labels={sheetSeries.series.map(s => s.label)}
                color={theme.palette.secondary.main}
                name='Animals affected'
                height={240}
                padLeft={0}
                onBarClick={(_label, i) => onSheetBar(i)}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mt: 5 }}>
                <StatTile label='Animals Affected' value={sheetSeries.totalAnimals.toLocaleString()} tone='info' />
                <StatTile label='Total Cases' value={sheetSeries.totalEpisodes.toLocaleString()} tone='neutral' />
                <StatTile label='Peak Month' value={sheetSeries.peakLabel} tone='neutral' />
              </Box>
              <Box
                onClick={onSheetViewAll}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 4, cursor: 'pointer', color: theme.palette.secondary.main }}
              >
                <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                  View all months in table
                </Typography>
                <Icon icon='mdi:chevron-right' fontSize={16} />
              </Box>
            </Box>
          </Box>
        )}
      </SheetDrawer>
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
  // curative-medicine rollup, derived once from the clinical episodes (same source as Lab/Hospital)
  const rx = useMemo(() => buildPrescriptionProgram(clinical), [clinical])

  const renderPanel = () => {
    if (tab === 'overview')
      return <OverviewPanel preventive={preventive} clinical={clinical} range={range} onRange={setRange} onGoToTab={setTab} />

    if (tab === 'insights') return <InsightsPanel clinical={clinical} preventive={preventive} range={range} />

    if (tab === 'clinical') {
      const sym = clinical?.programs?.symptoms
      const diag = clinical?.programs?.diagnosis
      const has = (p?: ClinicalProgram) => !!p && (p.records.length > 0 || p.summary.animalsAffected > 0)
      if (!has(sym) && !has(diag)) return <EmptyState message='No clinical data for this species' />

      return <ClinicalMergedPanel symptoms={sym} diagnosis={diag} range={range} />
    }

    if (tab === 'prescription') {
      if (!rx || !rx.medicines.length) return <EmptyState message='No prescription data for this species' />

      return <PrescriptionPanel rx={rx} />
    }

    const prog = preventive?.programs?.[tab]
    if (!prog || !prog.summary.animalsTracked) return <EmptyState message='No preventive-care data for this species' />

    return <PreventivePanel key={tab} tab={tab} prog={prog} months={preventive?.months ?? []} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', borderBottom: `1px solid ${c.SurfaceVariant}` }}>
        <SubTabs tab={tab} onChange={setTab} />
        {/* Overview carries the period control on its headline row instead */}
        {tab !== 'overview' && (
          <Box sx={{ pb: 1.5 }}>
            <DashboardDateRange value={range} onChange={setRange} />
          </Box>
        )}
      </Box>
      {renderPanel()}
    </Box>
  )
}

export default MedicalTab
