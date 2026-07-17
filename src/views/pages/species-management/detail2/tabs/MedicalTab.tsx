'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Autocomplete, Avatar, Box, Drawer, IconButton, TextField, Tooltip, Typography } from '@mui/material'
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
  DetailTable,
  Donut,
  EmptyState,
  FilterChip,
  SeasonalColumnChart,
  SectionCard,
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetRow,
  SheetSearch,
  SheetSection,
  SheetStats,
  SheetTabs,
  StatTile,
  StatusChip,
  TrendRangeTabs
} from 'src/views/pages/species-management/detail2/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/detail2/useSortableTable'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { computeSignals, type HealthSignal } from './medical/signals'
import SignalsBand from './medical/SignalsBand'
import SickTrendCard from './medical/SickTrendCard'
import SiteHotspotsCard from './medical/SiteHotspotsCard'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
import InsightsPanel from './medical/InsightsPanel'

type TabKey = 'overview' | 'insights' | 'clinical' | 'vaccination' | 'deworming' | 'supplements'

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
  { key: 'supplements', label: 'Supplements' }
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
      <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: text }}>{label}</Typography>
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
    <Tooltip title={`${meta.label}${level ? ' · ' + level : ''}`} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: '10px', py: '4px', borderRadius: 999, backgroundColor: bg, border: `0.5px solid ${border}`, whiteSpace: 'nowrap' }}>
        <Icon icon={meta.icon} fontSize='0.95rem' color={text} />
        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: text }}>{name}</Typography>
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
const TableSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; width?: number; height?: number }> = ({
  value,
  onChange,
  placeholder = 'Search…',
  width = 240,
  height = TABLE_CTRL_H
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <TextField
      size='small'
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      sx={{ width, maxWidth: '100%', '& .MuiInputBase-root': { height, bgcolor: theme.palette.background.paper } }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: c.neutralSecondary }} /> }}
    />
  )
}

/** Searchable facet dropdown — the site-picker Autocomplete pattern (in-menu search, nothing new). */
const CategoryFilter: React.FC<{
  options: string[]
  value: string | null
  onChange: (v: string | null) => void
  width?: number
  height?: number
  placeholder?: string
  icon?: string
}> = ({ options, value, onChange, width = 210, height = TABLE_CTRL_H, placeholder = 'All categories', icon = 'mdi:shape-outline' }) => {
  const c = cc(useTheme() as any)

  return (
    <Autocomplete
      size='small'
      options={options}
      value={value}
      onChange={(_e, v) => onChange(v)}
      sx={{ width }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, color: c.Outline }}>
                <Icon icon={icon} fontSize='1.15rem' />
              </Box>
            )
          }}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '8px',
            '& .MuiInputBase-root': { height },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: c.SurfaceVariant }
          }}
        />
      )}
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

/** Per-animal side sheet: that animal's full clinical timeline (symptoms + assessments). */
const AnimalRecordsDrawer: React.FC<{
  group: AniGroup | null
  onClose: () => void
}> = ({ group, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const sorted = group ? [...group.records].sort((a, b) => (a.date < b.date ? 1 : -1)) : []

  return (
    <Drawer anchor='right' open={!!group} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {group && (
        <Sheet>
          <SheetHeader avatar title={group.name} subtitle={`${group.site} · ${group.enclosure}`} onClose={onClose} />
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${c.Surface}` }}>
            <SheetStats
              items={[
                { label: 'Records', value: group.count },
                { label: 'Active', value: group.active }
              ]}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
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
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: r.status === 'active' ? c.Tertiary : theme.palette.primary.dark }}>
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
  const pillFor = (e: OviAnimal['events'][number]): string | null => {
    if (META[e.domain]?.preventive) return e.status === 'overdue' ? 'Overdue' : 'Upcoming'
    if (e.domain === 'Symptom') return e.severity || null // severity: Low/Medium/High
    return e.prognosis || null // Clinical Assessment → prognosis
  }
  // Only ACTIVE items belong here: active clinical/symptom, and all preventive (overdue/upcoming).
  const shown = events.filter(e => META[e.domain]?.preventive || e.status === 'active')

  return (
    <Drawer anchor='right' open={!!group} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, maxWidth: '100%' } }}>
      {group && (
        <Sheet>
          <SheetHeader avatar title={group.name} subtitle={`${group.site} · ${group.enclosure}`} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 1 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: c.OnSurfaceVariant }}>
                Active care &amp; health
              </Typography>
              <StatusChip
                label={group.status}
                tone={group.status === 'Critical' ? 'error' : group.status === 'Needs attention' ? 'warning' : 'success'}
              />
            </Box>
            {shown.map((e, i) => {
              const m = META[e.domain]
              const label = pillFor(e)

              return (
                <SheetRow
                  key={i}
                  icon={m?.icon || 'mdi:medical-bag'}
                  title={e.type}
                  caption={e.domain}
                  last={i === shown.length - 1}
                  trailing={
                    <>
                      {label && <MedTagPill label={label} />}
                      <Typography sx={{ fontSize: '12px', color: c.Outline }}>{fmtDate(e.date)}</Typography>
                    </>
                  }
                />
              )
            })}
            {shown.length === 0 && <SheetEmpty>No active care or health items.</SheetEmpty>}
          </Box>
        </Sheet>
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
  const [signalDrill, setSignalDrill] = useState<SignalDrawerPayload | null>(null)
  const [q, setQ] = useState('')

  const total = preventive?.animalCount ?? clinical?.animalCount ?? 0
  const groups = useMemo(() => buildRollup(clinical, preventive, inWin), [clinical, preventive, range])

  const signals = useMemo(() => computeSignals(clinical, inWin), [clinical, range])

  // Sickness rate (morbidity): distinct animals with any episode in the window / population,
  // plus the delta vs the previous equal-length window (hidden on "All time").
  const morbidity = useMemo(() => {
    const now = new Date()
    const { from, to } = resolveRange(range, now)
    const lo = from ? from.getTime() : null
    const hi = to.getTime()
    const cur = new Set<string>()
    const prev = new Set<string>()
    for (const key of ['symptoms', 'diagnosis'] as const) {
      for (const r of clinical?.programs?.[key]?.records ?? []) {
        const t = new Date(r.date).getTime()
        if (isNaN(t)) continue
        if ((lo == null || t >= lo) && t <= hi) cur.add(r.aid)
        else if (lo != null && t >= lo - (hi - lo) && t < lo) prev.add(r.aid)
      }
    }
    const pct = total ? Math.round((cur.size / total) * 1000) / 10 : 0
    const delta = lo != null && total ? Math.round((pct - (prev.size / total) * 100) * 10) / 10 : null

    return { pct, delta, sick: cur.size }
  }, [clinical, range, total])

  const openSignal = (sig: HealthSignal) =>
    setSignalDrill({
      title: sig.label,
      explainer: sig.explainer,
      icon: sig.icon,
      // Band color logic (V5.1): red is reserved for the Act-now zone; every other signal is
      // neutral — the drawer header must match the row the user clicked, so no amber here.
      tone: sig.severity === 'critical' ? 'error' : 'neutral',
      actionPill: sig.key === 'spreading' ? 'Contain' : undefined,
      animals: sig.animals
    })

  // Signal drawer row → the animal's combined care/health timeline (stacks over the signal sheet).
  const openSignalAnimal = (aid: string) => {
    const g = groups.find(x => x.aid === aid)
    if (g) setDrill(g)
  }

  const currentlySick = groups.filter(g => g.activeClinical > 0).length
  const overduePrev = groups.filter(g => g.overdue > 0).length
  const affected = groups.filter(g => g.status !== 'Healthy').length
  const healthy = Math.max(0, total - affected)

  const load = [
    { label: 'Active symptoms', value: countBy(clinical?.programs?.symptoms, 'active', 'date', inWin), tab: 'clinical' as TabKey },
    { label: 'Active clinical assessments', value: countBy(clinical?.programs?.diagnosis, 'active', 'date', inWin), tab: 'clinical' as TabKey },
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
        <StatTile
          label='Sickness Rate'
          value={`${morbidity.pct}%`}
          tone={morbidity.delta != null && morbidity.delta > 0 ? 'error' : 'neutral'}
          sub={
            morbidity.delta != null
              ? `${morbidity.delta > 0 ? '▲ +' : morbidity.delta < 0 ? '▼ ' : ''}${morbidity.delta} pt vs previous`
              : `${morbidity.sick.toLocaleString()} of ${total.toLocaleString()} animals`
          }
        />
      </Box>

      {/* Row 1.5 · attention signals (health patterns detected in this window) */}
      <SignalsBand signals={signals} onOpen={openSignal} />

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

      {/* Row 2.5 · sickness trend + site hotspots (moved from Insights — below Health status) */}
      <SickTrendCard clinical={clinical} preventive={preventive} />
      <SiteHotspotsCard clinical={clinical} preventive={preventive} range={range} />

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

      <SignalDrawer payload={signalDrill} onClose={() => setSignalDrill(null)} onAnimal={openSignalAnimal} />
      <OverviewAnimalDrawer group={drill} onClose={() => setDrill(null)} />
    </Box>
  )
}

/* ═══════════════════════════════════════════════ Preventive panel — vaccine-wise (index → detail) */
const wordingFor = (key: TabKey, kind: string) => {
  const ongoing = kind === 'ongoing'

  return {
    coverageLabel: ongoing ? 'On Schedule' : 'Coverage',
    overdueLabel: ongoing ? 'Lapsed' : 'Overdue',
    overdueWord: ongoing ? 'lapsed' : 'overdue',
    // "due"/"due on" is BANNED for future items — future = "upcoming" (user rule 2026-07-14)
    dueLabel: ongoing ? 'Upcoming Renewals' : 'Upcoming in 30 Days',
    dueWord: ongoing ? 'renewals upcoming' : 'upcoming',
    doseNoun: ongoing ? 'Renewals' : 'Doses given',
    statusLabels: (ongoing
      ? { covered: 'On schedule', due: 'Upcoming renewal', overdue: 'Lapsed', never: 'Never started' }
      : { covered: 'Covered', due: 'Upcoming', overdue: 'Overdue', never: 'Never' }) as Record<PreventiveTypeStatus, string>,
    typeNoun: key === 'vaccination' ? 'vaccines' : key === 'deworming' ? 'dewormers' : 'supplements',
    typeCol: key === 'vaccination' ? 'Vaccine' : key === 'deworming' ? 'Dewormer' : 'Supplement'
  }
}
const PROGRAM_ICON: Record<string, string> = { vaccination: 'mdi:needle', deworming: 'mdi:pill', supplements: 'mdi:water' }

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

/** Coverage bar + % for a vaccine index row (bar goes orange under 70%). */
const CoverageCell: React.FC<{ pct: number }> = ({ pct }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const low = pct < 70
  const fill = low ? c.Tertiary : theme.palette.primary.main

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box sx={{ width: 120, height: 8, flexShrink: 0, borderRadius: 999, backgroundColor: c.SurfaceVariant, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: fill }} />
      </Box>
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: low ? c.Tertiary : c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </Typography>
    </Box>
  )
}

/** Screen 1 — the vaccine index: stat strip + one row per medicine, worst coverage first. */
const PreventiveIndex: React.FC<{
  prog: PreventiveProgram
  w: ReturnType<typeof wordingFor>
  programLabel: string
  onPick: (name: string) => void
}> = ({ prog, w, programLabel, onPick }) => {
  const { txt, c } = useCells()
  const [q, setQ] = useState('')
  const types = prog.types ?? []

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = query ? types.filter(t => t.name.toLowerCase().includes(query)) : types

    return list.map(t => ({ id: t.name, ...t }))
  }, [types, q])
  const tbl = useSortableTable(rows, { field: 'coveragePct', sort: 'asc' })

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: w.typeCol,
      flex: 1.2,
      minWidth: 250,
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
            {p.row.name}
          </Typography>
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }} noWrap>
            {p.row.schedule}
          </Typography>
        </Box>
      )
    },
    { field: 'coveragePct', headerName: w.coverageLabel, width: 230, renderCell: p => <CoverageCell pct={p.row.coveragePct} /> },
    {
      field: 'overdue',
      headerName: 'Pending',
      width: 250,
      renderCell: p => (
        <Typography variant='body2' sx={{ color: c.neutralSecondary }} noWrap>
          <Box component='span' sx={{ fontSize: '1.05rem', fontWeight: 700, color: p.row.overdue ? c.Tertiary : c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>
            {p.row.overdue}
          </Box>{' '}
          {w.overdueWord} · {p.row.due} {w.dueWord}
        </Typography>
      )
    },
    {
      field: 'sitesAffected',
      headerName: 'Sites Affected',
      width: 210,
      renderCell: p => txt(`${p.row.sitesAffected} of ${p.row.sitesTotal} site${p.row.sitesTotal === 1 ? '' : 's'}`, c.neutralSecondary)
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PreventiveStatStrip s={prog.summary} programLabel={programLabel} w={w} nSites={prog.sites?.length ?? 0} />
      <SectionCard
        title={
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            {w.typeCol}s{' '}
            <Box component='span' sx={{ fontSize: '0.8rem', fontWeight: 500, color: c.neutralSecondary }}>
              · {types.length}
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
            rowHeight={72}
          />
        ) : (
          <EmptyState message={`No ${w.typeNoun} match this search`} />
        )}
      </SectionCard>
    </Box>
  )
}

/** Per-site chips — stats AND the site filter in one. Sorted worst coverage first. */
/** Site filter — dropdown-style trigger beside the table search; opens a standard side sheet
 *  listing every site (coverage % + overdue) with search. Picking a row filters the table. */
const SiteFilterControl: React.FC<{
  sites: PreventiveTypeSite[]
  sitesTotal: number
  tracked: number
  value: string | null
  onChange: (v: string | null) => void
  overdueWord: string
}> = ({ sites, sitesTotal, tracked, value, onChange, overdueWord }) => {
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
          sx={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.66px', color: c.neutralSecondary, mt: '2px' }}
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
          height: 40,
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

      <Drawer anchor='right' open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
        <Sheet>
          <SheetHeader title='Sites' stats={[{ label: 'Sites', value: sitesTotal }]} onClose={() => setOpen(false)} />
          <SheetSearch value={siteQ} onChange={setSiteQ} placeholder='Search sites…' />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3, mt: 1 }}>
            {!siteQ.trim() &&
              row({
                key: '__all',
                selected: value == null,
                onClick: () => pick(null),
                icon: 'mdi:map-marker-multiple-outline',
                title: 'All sites',
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
                caption: (
                  <>
                    <Box component='span' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.coveragePct}%</Box>
                    {' · '}
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
      </Drawer>
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
      <Box component='span' sx={{ fontSize: '12.5px', fontWeight: 600, color: c.neutralSecondary }}>
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
  onClose: () => void
}> = ({ animal, typeName, icon, dose, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const rate = doseRate(dose)

  return (
    <Drawer anchor='right' open={!!animal} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {animal && (
        <Sheet>
          <SheetHeader avatar title={animal.name} subtitle={animal.site} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            <SheetSection label={typeName} first noDivider>
              {animal.doses.map((d, i) => {
                const amt = animal.amounts?.[i]
                const late = doseLateDays(animal.aid, typeName, d)

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
                        <Box component='span' sx={{ color: c.Tertiary, fontWeight: 600 }}>
                          Late · {late}d
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
    </Drawer>
  )
}

/** Month drill for the doses-per-month chart — who received THIS medicine that month.
 *  Standard side-sheet list: avatar · name+id · site caption · dose-count pill; row → dose history. */
const MonthDosesDrawer: React.FC<{
  data: { label: string; rows: { a: PreventiveTypeAnimal; count: number }[]; doses: number } | null
  typeName: string
  icon: string
  onAnimal: (a: PreventiveTypeAnimal) => void
  onClose: () => void
}> = ({ data, typeName, icon, onAnimal, onClose }) => {
  return (
    <Drawer anchor='right' open={!!data} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {data && (
        <Sheet>
          <SheetHeader
            icon={icon}
            title={`${data.label} · ${typeName}`}
            stats={[{ label: 'Animals', value: data.rows.length }]}
            onClose={onClose}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {data.rows.map((r, i) => (
              <SheetRow
                key={r.a.aid}
                avatar
                title={r.a.name}
                caption={r.a.site}
                last={i === data.rows.length - 1}
                onClick={() => onAnimal(r.a)}
                chevron
              />
            ))}
            {data.rows.length === 0 && <SheetEmpty>No dose records for this month.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </Drawer>
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

/** Delayed-doses bar click → that month's animals: Given / On time / Late stats, status tabs,
 *  delay-days chips; row → the animal's dose history. Built entirely from the sheet kit. */
type LateMonthRow = { a: PreventiveTypeAnimal; lateDays: number }
const LateMonthDrawer: React.FC<{
  data: { label: string; rows: LateMonthRow[] } | null
  typeName: string
  icon: string
  onAnimal: (a: PreventiveTypeAnimal) => void
  onClose: () => void
}> = ({ data, typeName, icon, onAnimal, onClose }) => {
  const [tab, setTab] = useState<'all' | 'on' | 'late'>('all')

  const rows = data?.rows ?? []
  const lateN = rows.filter(r => r.lateDays > 0).length
  const onN = rows.length - lateN
  const shown = rows.filter(r => (tab === 'late' ? r.lateDays > 0 : tab === 'on' ? r.lateDays === 0 : true))
  const tabs: { key: 'all' | 'on' | 'late'; label: string }[] = [
    { key: 'all', label: `All · ${rows.length}` },
    { key: 'on', label: `On time · ${onN}` },
    { key: 'late', label: `Late · ${lateN}` }
  ]

  return (
    <Drawer anchor='right' open={!!data} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {data && (
        <Sheet>
          <SheetHeader
            icon={icon}
            title={`${data.label} · ${typeName}`}
            stats={[
              { label: 'Given', value: rows.length },
              { label: 'On time', value: onN },
              { label: 'Late', value: lateN }
            ]}
            onClose={onClose}
          />
          <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {shown.map((r, i) => (
              <SheetRow
                key={r.a.aid}
                avatar
                title={r.a.name}
                caption={r.a.site}
                last={i === shown.length - 1}
                onClick={() => onAnimal(r.a)}
                chevron
                trailing={
                  r.lateDays > 0 ? <StatusChip label={`Late · ${r.lateDays}d`} tone='error' /> : <StatusChip label='On time' tone='success' />
                }
              />
            ))}
            {!shown.length && <SheetEmpty>No animals in this group.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </Drawer>
  )
}

/** Deterministic administered-time for a synthetic dose (data has dates only; a real API's
 *  timestamp replaces this). Stable per aid+medicine+date so re-renders never shift it. */
const doseTimeOf = (aid: string, medicine: string, date: string): string => {
  let h = 0
  const s = `${aid}|${medicine}|${date}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const hour = 8 + (h % 9) // clinic hours 08:00–16:59
  const min = h % 60
  const h12 = hour > 12 ? hour - 12 : hour

  return `${h12}:${String(min).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

/** Sheet 2 of the month drill — what ONE animal received in that month, across ALL medicines
 *  of the program. Rows = medicine name + administered date · time. Animal identity lives in
 *  the header only. */
interface MonthAdmin {
  medicine: string
  date: string
  time: string
  /** Given amount (+unit); weight-based medicines also carry their rate for the sub-line. */
  amount?: number
  unit?: string
  rate?: string | null
}
const MonthAdminsDrawer: React.FC<{
  data: { animal: PreventiveTypeAnimal; monthLabel: string; admins: MonthAdmin[] } | null
  icon: string
  onClose: () => void
}> = ({ data, icon, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Drawer anchor='right' open={!!data} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100%' } }}>
      {data && (
        <Sheet>
          <SheetHeader avatar title={data.animal.name} subtitle={data.animal.site} onClose={onClose} />
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            <SheetSection label={data.monthLabel} first noDivider>
              {data.admins.map((ad, i) => (
                <SheetRow
                  key={`${ad.medicine}-${ad.date}-${i}`}
                  icon={icon}
                  title={ad.medicine}
                  caption={`${fmtDate(ad.date)} · ${ad.time}`}
                  last={i === data.admins.length - 1}
                  // total given rides the title line; the weight-based rate sits beneath it
                  trailing={
                    ad.amount != null && ad.unit ? (
                      <>
                        <DoseAmount value={ad.amount} unit={ad.unit} />
                        {ad.rate && (
                          <Typography variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
                            {ad.rate}
                          </Typography>
                        )}
                      </>
                    ) : undefined
                  }
                />
              ))}
              {data.admins.length === 0 && <SheetEmpty>No administrations recorded in {data.monthLabel}.</SheetEmpty>}
            </SheetSection>
          </Box>
        </Sheet>
      )}
    </Drawer>
  )
}

/** Screen 2 — per-vaccine detail: header, trend pair, site chips, status-tab animal table. */
const PreventiveDetail: React.FC<{
  type: PreventiveType
  allTypes: PreventiveType[] // every medicine in the program — the month-drill admin log is cross-medicine
  months: string[]
  w: ReturnType<typeof wordingFor>
  icon: string
  onBack: () => void
}> = ({ type, allTypes, months, w, icon, onBack }) => {
  const { txt, animalCell, c, theme } = useCells()
  // ONE range drives both dose-administration panels (given | delayed) — they tell one story.
  const [doseRange, setDoseRange] = useState<RangePreset>('last_1y')
  const [statusTab, setStatusTab] = useState<'all' | PreventiveTypeStatus>('all')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)
  const [monthDrill, setMonthDrill] = useState<{ label: string; year: number; mi: number; rows: { a: PreventiveTypeAnimal; count: number }[]; doses: number } | null>(null)
  const [monthAnimal, setMonthAnimal] = useState<{
    animal: PreventiveTypeAnimal
    monthLabel: string
    admins: MonthAdmin[]
  } | null>(null)
  const [lateDrill, setLateDrill] = useState<{ label: string; rows: LateMonthRow[] } | null>(null)

  // Month sheet → animal: everything this animal received THAT month, across all medicines.
  const openMonthAnimal = (a: PreventiveTypeAnimal) => {
    if (!monthDrill) return
    const { year, mi, label } = monthDrill
    const admins: MonthAdmin[] = []
    for (const t of allTypes) {
      const rec = t.animals.find(x => x.aid === a.aid)
      if (!rec) continue
      rec.doses.forEach((d, k) => {
        const dd = new Date(d)
        if (dd.getFullYear() === year && dd.getMonth() === mi) {
          admins.push({
            medicine: t.name,
            date: d,
            time: doseTimeOf(a.aid, t.name, d),
            amount: rec.amounts?.[k],
            unit: t.dose?.unit,
            rate: t.dose?.perKg ? doseRate(t.dose) : null
          })
        }
      })
    }
    admins.sort((x, y) => (x.date < y.date ? 1 : -1))
    setMonthAnimal({ animal: a, monthLabel: label, admins })
  }

  // Chart values derived from the SAME dose records the month drill lists — the sidecar's
  // precomputed dosesPerMonth doesn't reconcile with the decoded per-animal dose dates, and a
  // bar that says 8 must open a sheet that shows 8. Lateness comes from doseLateDays (same
  // helper the sheets/chips use) so the Delayed chart reconciles too.
  const { derivedDosesPerMonth, derivedAnimalsPerMonth, derivedLatePerMonth, monthDelays } = useMemo(() => {
    const counts = new Map<string, number>()
    const animalSets = new Map<string, Set<string>>()
    const lateCounts = new Map<string, number>()
    const delays = new Map<string, number[]>()
    for (const a of type.animals)
      for (const d of a.doses) {
        const key = d.slice(0, 7)
        counts.set(key, (counts.get(key) ?? 0) + 1)
        ;(animalSets.get(key) ?? animalSets.set(key, new Set()).get(key)!).add(a.aid)
        const late = doseLateDays(a.aid, type.name, d)
        if (late > 0) {
          lateCounts.set(key, (lateCounts.get(key) ?? 0) + 1)
          ;(delays.get(key) ?? delays.set(key, []).get(key)!).push(late)
        }
      }
    const keyOf = (label: string) => {
      const m = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(label.trim())
      const mi = m ? MONTHS.indexOf(m[1]) : -1

      return m && mi >= 0 ? `20${m[2]}-${String(mi + 1).padStart(2, '0')}` : null
    }

    return {
      derivedDosesPerMonth: months.map(l => counts.get(keyOf(l) ?? '') ?? 0),
      // hover answers "how many ANIMALS were dosed" — distinct animals, not dose events
      derivedAnimalsPerMonth: months.map(l => animalSets.get(keyOf(l) ?? '')?.size ?? 0),
      derivedLatePerMonth: months.map(l => lateCounts.get(keyOf(l) ?? '') ?? 0),
      monthDelays: months.map(l => (delays.get(keyOf(l) ?? '') ?? []).sort((x, y) => x - y))
    }
  }, [type, months])

  // Doses-per-month bar → who received this medicine that month (label like "Mar '26").
  const onDoseMonth = (label: string) => {
    const m = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(label.trim())
    const mi = m ? MONTHS.indexOf(m[1]) : -1
    if (!m || mi < 0) return
    const year = 2000 + Number(m[2])
    const rows = type.animals
      .map(a => ({
        a,
        count: a.doses.filter(d => {
          const dd = new Date(d)

          return dd.getFullYear() === year && dd.getMonth() === mi
        }).length
      }))
      .filter(r => r.count > 0)
      .sort((x, y) => y.count - x.count || (x.a.name < y.a.name ? -1 : 1))
    setMonthDrill({ label: `${m[1]} ${year}`, year, mi, rows, doses: rows.reduce((s, r) => s + r.count, 0) })
  }

  // Delayed-doses bar → that month's animals with on-time/late per dose (same doseLateDays the
  // chart counted with, so the bar's number equals the sheet's Late stat).
  const onLateMonth = (label: string) => {
    const m = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(label.trim())
    const mi = m ? MONTHS.indexOf(m[1]) : -1
    if (!m || mi < 0) return
    const year = 2000 + Number(m[2])
    const rows: LateMonthRow[] = []
    for (const a of type.animals)
      for (const d of a.doses) {
        const dd = new Date(d)
        if (dd.getFullYear() === year && dd.getMonth() === mi) rows.push({ a, lateDays: doseLateDays(a.aid, type.name, d) })
      }
    rows.sort((x, y) => y.lateDays - x.lateDays || (x.a.name < y.a.name ? -1 : 1))
    setLateDrill({ label: `${m[1]} ${year}`, rows })
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
    const sub = amt != null && type.dose ? `${amt.toLocaleString()} ${type.dose.unit}${type.dose.perKg ? ` · ${doseRate(type.dose)}` : ''}` : null

    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }}>{fmtDate(a.lastGiven)}</Typography>
        {sub && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5, borderBottom: '2.5px solid', borderColor: active ? accent : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { borderColor: active ? accent : c.OutlineVariant } }}
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
            {type.coveragePct}% {w.coverageLabel.toLowerCase()} ·{' '}
            <Box component='span' sx={{ color: type.overdue ? c.Tertiary : c.neutralSecondary, fontWeight: type.overdue ? 700 : 400 }}>
              {type.overdue} {w.overdueWord}
            </Box>{' '}
            · {type.due} {w.dueWord} · {type.never} {w.statusLabels.never.toLowerCase()} · {type.tracked.toLocaleString()} animals tracked · {type.schedule}
          </Typography>
        </Box>
      </Box>

      {/* Dose administration — ONE card, ONE range filter, two panels: given | delayed-only.
          The delayed panel shows ONLY late doses (Coverage-over-time retired: it barely moved
          and the table already answers who is uncovered now). */}
      <SectionCard
        title='Dose administration'
        action={<TrendRangeTabs value={doseRange} onPick={setDoseRange} color={theme.palette.secondary.main} />}
        titleMb={3}
      >
        {(() => {
          const givenSlice = slice(derivedDosesPerMonth, doseRange)
          const lateSlice = slice(derivedLatePerMonth, doseRange)
          const delaysSlice = monthDelays.slice(-monthsOf(doseRange))
          const givenTotal = givenSlice.reduce((s, v) => s + v, 0)
          const lateTotal = lateSlice.reduce((s, v) => s + v, 0)
          const latePct = givenTotal ? Math.round((100 * lateTotal) / givenTotal) : 0
          const allDelays = delaysSlice.flat().sort((x, y) => x - y)
          const medianDelay = allDelays.length ? allDelays[Math.floor(allDelays.length / 2)] : 0
          const panelLabel = (text: string, color: string, findings?: string) => (
            <Typography variant='body2' sx={{ fontWeight: 600, color, mb: 2 }}>
              {text}
              {findings && (
                <Box component='span' sx={{ fontWeight: 400, color: c.neutralSecondary }}>
                  {' '}
                  · {findings}
                </Box>
              )}
            </Typography>
          )

          return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1px 1fr' }, gap: 5, alignItems: 'stretch' }}>
              <Box sx={{ minWidth: 0 }}>
                {panelLabel(`${w.doseNoun}s given per month`, c.OnSurfaceVariant)}
                <SeasonalColumnChart
                  values={givenSlice}
                  labels={sliceLabels(doseRange)}
                  color={theme.palette.secondary.main}
                  name={w.doseNoun}
                  height={230}
                  padLeft={0}
                  onBarClick={onDoseMonth}
                  tooltipSeries={{ label: 'Animals', values: slice(derivedAnimalsPerMonth, doseRange) }}
                />
              </Box>
              <Box sx={{ backgroundColor: c.SurfaceVariant, display: { xs: 'none', md: 'block' } }} />
              <Box sx={{ minWidth: 0 }}>
                {panelLabel(
                  `Delayed ${w.doseNoun.toLowerCase()}s`,
                  c.Tertiary,
                  lateTotal ? `${latePct}% ran late · median delay ${medianDelay}d` : 'none ran late in this window'
                )}
                <SeasonalColumnChart
                  values={lateSlice}
                  labels={sliceLabels(doseRange)}
                  color={c.Tertiary}
                  name='Late'
                  height={230}
                  padLeft={0}
                  onBarClick={onLateMonth}
                  // the base travels with the number: "Late 5" of "14 given" — 5-of-14 ≠ 5-of-5
                  tooltipRows={i => {
                    const given = givenSlice[i] ?? 0
                    const late = lateSlice[i] ?? 0
                    const ds = delaysSlice[i] ?? []
                    const med = ds.length ? ds[Math.floor(ds.length / 2)] : 0

                    return [
                      { color: c.Tertiary, label: 'Late', value: `${late} of ${given} given${given ? ` · ${Math.round((100 * late) / Math.max(1, given))}%` : ''}` },
                      ...(med ? [{ color: c.Outline, label: 'Median delay', value: `${med}d` }] : [])
                    ]
                  }}
                />
              </Box>
            </Box>
          )
        })()}
      </SectionCard>

      {/* animal table — site filter (dropdown → side sheet) + search live together in the header */}
      <SectionCard
        title={statusTabs}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            <TableSearch value={q} onChange={onQ} placeholder='Search animals…' />
          </Box>
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

      <MonthDosesDrawer
        data={monthDrill}
        typeName={type.name}
        icon={icon}
        onAnimal={openMonthAnimal}
        onClose={() => setMonthDrill(null)}
      />
      <MonthAdminsDrawer data={monthAnimal} icon={icon} onClose={() => setMonthAnimal(null)} />
      <LateMonthDrawer data={lateDrill} typeName={type.name} icon={icon} onAnimal={a => setDrill(a)} onClose={() => setLateDrill(null)} />
      <DoseHistoryDrawer animal={drill} typeName={type.name} icon={icon} dose={type.dose} onClose={() => setDrill(null)} />
    </Box>
  )
}

const PreventivePanel: React.FC<{ tab: TabKey; prog: PreventiveProgram; months: string[] }> = ({ tab, prog, months }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const w = wordingFor(tab, prog.kind)
  const programLabel = TABS.find(t => t.key === tab)?.label ?? ''
  const icon = PROGRAM_ICON[tab] ?? 'mdi:medical-bag'
  const sel = (prog.types ?? []).find(t => t.name === selected)

  if (!prog.types?.length) return <EmptyState message={`No ${w.typeNoun} data for this species`} />

  return sel ? (
    <PreventiveDetail key={sel.name} type={sel} allTypes={prog.types ?? []} months={months} w={w} icon={icon} onBack={() => setSelected(null)} />
  ) : (
    <PreventiveIndex prog={prog} w={w} programLabel={programLabel} onPick={setSelected} />
  )
}

/** Rounded pill: type name + a metric value. Optional `dot` = worst-active-prognosis marker. */
const ChipTag: React.FC<{ label: string; value: React.ReactNode; valueColor: string; dot?: string; onClick?: () => void }> = ({
  label,
  value,
  valueColor,
  dot,
  onClick
}) => {
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
        border: `1px solid ${c.SurfaceVariant}`,
        backgroundColor: c.Surface,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s ease, background .15s ease',
        '&:hover': onClick ? { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.background.paper } : undefined
      }}
    >
      {dot && <Box sx={{ width: 9, height: 9, flexShrink: 0, borderRadius: '50%', backgroundColor: dot }} />}
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

  // table scoping
  const [domainTab, setDomainTab] = useState<DomainTab>('all')
  const [typeFilter, setTypeFilter] = useState<{ domain: Domain; name: string } | null>(null)
  const [monthFilter, setMonthFilter] = useState<{ idx: number; y: number; m: number; label: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved' | null>(null)
  const [sevFilter, setSevFilter] = useState<string | null>(null)
  const [progFilter, setProgFilter] = useState<string | null>(null)
  const [view, setView] = useState<'animal' | 'record'>('animal')
  const [q, setQ] = useState('')
  // ranked panels (Top symptoms | Top conditions)
  const [symCat, setSymCat] = useState<string | null>(null)
  const [symQ, setSymQ] = useState('')
  const [condCat, setCondCat] = useState<string | null>(null)
  const [condQ, setCondQ] = useState('')
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

  // Worst ACTIVE prognosis per condition type (falls back to worst overall) → the pill dot colour.
  const worstProg = useMemo(() => {
    const act: Record<string, number> = {}
    const any: Record<string, number> = {}
    for (const r of windowed) {
      if (r.domain !== 'assessment' || !r.prognosis) continue
      const rk = PROGNOSIS_ORDER.indexOf(r.prognosis)
      if (rk < 0) continue
      if (any[r.type] == null || rk < any[r.type]) any[r.type] = rk
      if (r.status === 'active' && (act[r.type] == null || rk < act[r.type])) act[r.type] = rk
    }

    return (type: string): string | undefined => {
      const rk = act[type] ?? any[type]

      return rk == null ? undefined : tagColors[PROGNOSIS_ORDER[rk]]?.[1]
    }
  }, [windowed])

  const catsOf = (list: { category: string }[]) => Array.from(new Set(list.map(t => t.category))).sort()
  const symCats = useMemo(() => catsOf(symTypes), [symTypes])
  const condCats = useMemo(() => catsOf(condTypes), [condTypes])

  const filterTypes = <T extends { name: string; category: string }>(list: T[], cat: string | null, tq: string): T[] =>
    list.filter(t => (!cat || t.category === cat) && (!tq.trim() || t.name.toLowerCase().includes(tq.trim().toLowerCase())))
  const symShown = useMemo(() => filterTypes(symTypes, symCat, symQ), [symTypes, symCat, symQ])
  const condShown = useMemo(() => filterTypes(condTypes, condCat, condQ), [condTypes, condCat, condQ])

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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
  const tableAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {domainTab === 'symptom' && (
        <CategoryFilter
          options={SEVERITY_ORDER}
          value={sevFilter}
          onChange={onSev}
          width={165}
          placeholder='Severity'
          icon={DOMAIN_META.symptom.icon}
        />
      )}
      {domainTab === 'assessment' && (
        <CategoryFilter
          options={[...PROGNOSIS_ORDER].reverse()}
          value={progFilter}
          onChange={onProg}
          width={180}
          placeholder='Prognosis'
          icon={DOMAIN_META.assessment.icon}
        />
      )}
      {domainTab !== 'all' && <ViewToggle view={view} onChange={setView} />}
      <TableSearch value={q} onChange={onQ} placeholder='Search animal, site…' />
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
    cats: string[],
    tq: string,
    setTq: (v: string) => void
  ) => (
    <SectionCard
      title={
        <Typography variant='subtitle1' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {title}{' '}
          <Box component='span' sx={{ fontSize: '0.8rem', fontWeight: 500, color: c.neutralSecondary }}>
            · {types.length} types
          </Box>
        </Typography>
      }
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
          <CategoryFilter options={cats} value={cat} onChange={setCat} width={185} height={36} />
          <TableSearch value={tq} onChange={setTq} placeholder='Search…' width={150} height={36} />
        </Box>
      }
      titleMb={3}
    >
      {shown.length ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {shown.slice(0, PILL_LIMIT).map(t => (
            <ChipTag
              key={t.name}
              label={t.name}
              value={t.animals.toLocaleString()}
              valueColor={c.OnSurfaceVariant}
              dot={domain === 'assessment' ? worstProg(t.name) : undefined}
              onClick={() => pickType(domain, t.name)}
            />
          ))}
          {shown.length > PILL_LIMIT && (
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
                View all {shown.length}
              </Typography>
              <Icon icon='mdi:chevron-down' fontSize={16} color={theme.palette.primary.dark} />
            </Box>
          )}
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
        <StatTile label='Recovered' value={`${recoveredPct}%`} tone='success' onClick={() => scopeTable('all', 'resolved')} />
      </StatsRow>

      {/* Row 2 · Top symptoms | Top conditions side by side */}
      <ChartsRow md='repeat(2, 1fr)'>
        {typePanel('symptom', 'Top symptoms', symTypes, symShown, symCat, setSymCat, symCats, symQ, setSymQ)}
        {typePanel('assessment', 'Top conditions', condTypes, condShown, condCat, setCondCat, condCats, condQ, setCondQ)}
      </ChartsRow>

      {/* Row 3 · ONE combined table */}
      <Box ref={tableRef}>
        <SectionCard title={domainTabs} action={tableAction} titleMb={2}>
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
      <Drawer
        anchor='right'
        open={!!viewAll}
        onClose={() => setViewAll(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 680 }, maxWidth: '100%' } }}
      >
        {viewAll && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 5, py: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', color: c.OnSurfaceVariant }} noWrap>
                {viewAll === 'symptom' ? 'All symptoms' : 'All conditions'}
              </Typography>
              <IconButton onClick={() => setViewAll(null)} size='small'>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 3 }}>
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
      </Drawer>

      {/* wide side sheet · per-type 12-month graph (distinct animals affected) */}
      <Drawer
        anchor='right'
        open={!!typeSheet}
        onClose={() => setTypeSheet(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 760 }, maxWidth: '100%' } }}
      >
        {typeSheet && sheetSeries && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 5, py: 3, borderBottom: `1px solid ${c.SurfaceVariant}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
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
            <Box sx={{ flex: 1, overflowY: 'auto', px: 5, py: 4 }}>
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

    if (tab === 'insights') return <InsightsPanel clinical={clinical} preventive={preventive} range={range} />

    if (tab === 'clinical') {
      const sym = clinical?.programs?.symptoms
      const diag = clinical?.programs?.diagnosis
      const has = (p?: ClinicalProgram) => !!p && (p.records.length > 0 || p.summary.animalsAffected > 0)
      if (!has(sym) && !has(diag)) return <EmptyState message='No clinical data for this species' />

      return <ClinicalMergedPanel symptoms={sym} diagnosis={diag} range={range} />
    }

    const prog = preventive?.programs?.[tab]
    if (!prog || !prog.summary.animalsTracked) return <EmptyState message='No preventive-care data for this species' />

    return <PreventivePanel key={tab} tab={tab} prog={prog} months={preventive?.months ?? []} />
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
