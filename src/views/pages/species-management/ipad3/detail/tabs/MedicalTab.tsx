'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Autocomplete, Box, IconButton, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
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
  AnimalIdCard,
  AnimalCardRow,
  SiteFilterSelect,
  RowMetaText,
  HeroPhotoContext,
  synthAnimalIdentity,
  HERO_PHOTOS,
  CellText,
  DetailTable,
  sheetPaperSx,
  SHEET_PX,
  EmptyState,
  FilterChip,
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
  StatusChip,
  thinScrollbarSx,
  TrendAreaChart
, HeaderSubTabs, SearchPill, SheetDrawer, UnderlineTabs, ViewToggle, YearLinesChart} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { YearSeries } from 'src/views/pages/species-management/ipad3/detail/detailUi'
// THE standard period control's pieces (SickTrendCard grammar — CoL owns them)
import { CTRL_H, RangeSelect, yearItemsFor } from 'src/views/pages/species-management/ipad3/detail/tabs/CircleOfLifeTab'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { BarColumns } from 'src/views/pages/species-management/ipad3/marks'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'
// App-standard filter drawer (the hospital Add-Patient animal-picker filter) — reused as-is.
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { FilterButton } from 'src/views/utility/render-snippets'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'
import { computeOverviewSignals, type HealthSignal } from './medical/signals'
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

type TabKey = 'overview' | 'clinical' | 'vaccination' | 'deworming' | 'supplements' | 'prescription'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ── merged Clinical domain model (Symptoms + Clinical Assessment in one tab) ── */
type Domain = 'symptom' | 'assessment'
interface MergedRec extends ClinicalRecord {
  domain: Domain
}

const DOMAIN_META: Record<Domain, { label: string; icon: string }> = {
  symptom: { label: 'Symptom', icon: 'mdi:emoticon-sad-outline' },
  assessment: { label: 'Assessment', icon: 'mdi:stethoscope' }
}

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

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'vaccination', label: 'Vaccination' },
  { key: 'deworming', label: 'Deworming' },
  { key: 'supplements', label: 'Supplements' },
  { key: 'prescription', label: 'Prescription' }
]

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

// Data → display level names (Figma 67600:24868 scale, user-confirmed 2026-09-01):
// severity Low/Medium/High shows as Mild/Moderate/High; Extreme is the 5th level, defined
// but with no data yet; a missing level shows as "Not Assessed".
const LEVEL_DISPLAY: Record<string, string> = { Low: 'Mild', Medium: 'Moderate' }

/**
 * Severity/prognosis tag — the exact Figma 67600:24868 pill (8px radius, 0.5px border,
 * tinted fill, the level hue as border AND text; "Not Assessed" alone is a solid fill with
 * white text). One color pair per rung, shared by the two scales:
 * Mild=Favourable teal · Moderate=Guarded gold · High=Doubtful orange · Extreme=Poor red ·
 * Grave maroon. Overdue/Upcoming/Died keep their pre-existing quiet pills.
 */
const medTagSpec = (c: Record<string, string>): Record<string, { bg: string; hue: string; fg?: string }> => {
  const teal = { bg: `${c.SecondaryContainer}66`, hue: c.addPrimary } // 40% #AFEFEB
  const gold = { bg: `${c.Notes}33`, hue: c.moderateSecondary } // 20% #FCF4AE
  const orange = { bg: `${c.TertiaryContainer}26`, hue: c.Tertiary } // 15% #FFBDA8
  const red = { bg: `${c.ErrorContainer}66`, hue: c.Error } // 40% #FFD3D3

  return {
    'Not Assessed': { bg: c.Outline, hue: c.OnSurfaceVariant, fg: c.OnPrimary },
    Mild: teal,
    Moderate: gold,
    High: orange,
    Extreme: red,
    Favourable: teal,
    Guarded: gold,
    Doubtful: orange,
    Poor: red,
    Grave: { bg: `${c.medTagMaroonBorder}0F`, hue: c.medTagMaroonBorder }, // 6% #4A0415
    Overdue: { bg: c.medTagOrangeBg, hue: c.medTagOrangeBorder, fg: c.OnSurfaceVariant },
    Upcoming: { bg: c.medTagTealBg, hue: c.medTagTealBorder, fg: c.OnSurfaceVariant }
  }
}

/** The tag pill itself — pass the RAW data level ('Low', 'Guarded', …); display mapping is internal. */
const MedTagPill: React.FC<{ label?: string }> = ({ label }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const shown = label ? (LEVEL_DISPLAY[label] ?? label) : 'Not Assessed'
  const spec = medTagSpec(c)[shown] ?? { bg: c.Surface, hue: c.OutlineVariant, fg: c.OnSurfaceVariant }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: '12px',
        py: '7px',
        borderRadius: '8px',
        backgroundColor: spec.bg,
        border: `0.5px solid ${spec.hue}`,
        whiteSpace: 'nowrap'
      }}
    >
      <Typography sx={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.1px', color: spec.fg ?? spec.hue }}>
        {shown}
      </Typography>
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

  return { txt, c, theme }
}

// Animal-card identity synthesis (DEMO) lives in the kit — synthAnimalIdentity(aid).

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

/** One animal row inside the clinical type sheet (Active/Resolved lists). */
interface SheetAnimalRow {
  aid: string
  name: string
  site: string
  enclosure: string
  times: number
  days?: number // active bout's running days
  resolvedOn?: string // latest resolved date (resolved list)
  date?: string // sort key: onset (active) / resolved date (resolved)
  chronic?: boolean // assessments: any bout flagged chronic → tag on the title line
}

/** Compact inline "Chronic" tag — rides the title line after the animal's name (both status
 *  tabs). Grave-family maroon per the Figma 67600:24868 scale; renders only when the data
 *  says chronic (field not shipped yet — see ClinicalRecord.chronic). */
const ChronicTag: React.FC = () => {
  const c = cc(useTheme() as any)

  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        ml: 1.5,
        px: '8px',
        py: '2px',
        borderRadius: '6px',
        backgroundColor: `${c.medTagMaroonBorder}0F`,
        border: `0.5px solid ${c.medTagMaroonBorder}`,
        verticalAlign: 'middle'
      }}
    >
      <Typography component='span' sx={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.1px', color: c.medTagMaroonBorder }}>
        Chronic
      </Typography>
    </Box>
  )
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

/** Table search box — thin wrapper over the kit SearchPill (2026-09-05), keeping this
 *  tab's width/grow call-site API. */
export const TableSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; width?: number; height?: number; grow?: boolean }> = ({
  value,
  onChange,
  placeholder = 'Search…',
  width = 240,
  height = TABLE_CTRL_H,
  // grow: fill the available row width (portrait two-row headers) instead of the fixed width.
  grow = false
}) => (
  <SearchPill
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    height={height}
    sx={{ ...(grow ? { flex: '1 1 auto', minWidth: 0 } : { width }), maxWidth: '100%' }}
  />
)

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
  status: 'Healthy' | 'Needs Attention'
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
    // 'Critical' RETIRED everywhere in Medical (user call 2026-09-06 — not data-backed):
    // the rollup knows two states only.
    g.status = g.activeClinical > 0 || g.overdue > 0 ? 'Needs Attention' : 'Healthy'
    g.score = g.activeClinical * 10 + g.overdue
  }

  return [...m.values()]
}

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
                <StatusChip label={group.status} tone={group.status === 'Needs Attention' ? 'warning' : 'success'} />
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
  rx?: RxProgram | null
  range: RangeSelection
  onRange: (r: RangeSelection) => void
  onGoToTab: (t: TabKey) => void
}> = ({ preventive, clinical, rx, range, onRange, onGoToTab }) => {
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
      // Structured state (user call 2026-09-06): the drawer renders Active·N + first
      // condition "+N more" — no Critical (not data-backed), no "N active conditions" line.
      animals: sickNow.map(g => ({
        aid: g.aid,
        name: g.name,
        site: g.site,
        enclosure: g.enclosure,
        detail: '',
        state: 'active' as const,
        activeConditions: g.activeTypes,
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

  /* the standard table columns (Housing anatomy + CoL grammar): No serial · Program ·
     right-aligned numbers, em dash for zero, CORAL on the overdue total and the 90+ column */
  const otxt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )
  const bucketCol = (field: string, header: string, hot = false): GridColDef => ({
    width: 130,
    sortable: false,
    align: 'right',
    headerAlign: 'right',
    field,
    headerName: header,
    renderCell: (p: GridRenderCellParams) => {
      const n = Number(p.row[field] || 0)
      if (!n) return otxt('—', skin.DASH_INK, 400)

      return otxt(n.toLocaleString(), hot ? skin.CORAL : undefined, hot ? 700 : 600)
    }
  })
  const overdueColumns: GridColDef[] = [
    { minWidth: 200, flex: 1, sortable: false, field: 'program', headerName: 'Program', renderCell: p => otxt(p.row.program, c.OnSurfaceVariant, 600) },
    {
      width: 195,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      field: 'animals',
      headerName: 'Overdue Animals',
      renderCell: (p: GridRenderCellParams) => {
        const n = Number(p.row.animals || 0)
        if (!n) return otxt('—', skin.DASH_INK, 400)

        return otxt(n.toLocaleString(), skin.CORAL, 700)
      }
    },
    bucketCol('d30', '0–30 Days'),
    bucketCol('d31', '31–60 Days'),
    bucketCol('d61', '61–90 Days'),
    bucketCol('d90', '90+ Days', true)
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1 · one plain title (the verdict headline retired, 2026-09-01 review) —
          the period control rides this row (Hospital pattern), not the tab bar. */}
      <Box sx={{ pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
          Medical Overview
        </Typography>
        <DashboardDateRange value={range} onChange={onRange} />
      </Box>

      {/* 2 · the stat strip — Sick Right Now · Repeat Sick · Under Medication (demo
          review 2026-09-04: Undiagnosed → Under Medication = animals on an active
          prescription — distinct animals dosed in the last 30 days; Severe RETIRED). */}
      <SignalsBand
        cells={[
          { key: 'sickNow', label: 'Sick Right Now', count: sickNow.length, onOpen: openSickNow },
          ...signals.map(sig => ({ key: sig.key, label: sig.label, count: sig.count, onOpen: () => openSignal(sig) })),
          {
            key: 'underMedication',
            label: 'Under Medication',
            count: rx?.summary.given30 ?? 0,
            onOpen: () => onGoToTab('prescription')
          }
        ]}
      />

      {/* 3 · overdue preventive care — the standard table (Housing SectionCard anatomy +
          CoL column grammar): No serial, right-aligned numbers, em dash for zero, the
          overdue total + hot 90+ column in CORAL; each row opens its program tab. */}
      <SectionCard title='Overdue Preventive Care'>
        <DetailTable
          columns={overdueColumns}
          rows={overdueRows.map((row, i) => ({
            id: row.key,
            sl_no: i + 1,
            program: row.label,
            animals: row.animals,
            d30: row.b.d30,
            d31: row.b.d31,
            d61: row.b.d61,
            d90: row.b.d90
          }))}
          total={overdueRows.length}
          hideFooter
          onRowClick={(params: { row: Record<string, any> }) => onGoToTab(params.row.id as TabKey)}
        />
      </SectionCard>

      {/* 4 · sickness trend (+ conditional site-concentration strip) */}
      <SickTrendCard clinical={clinical} preventive={preventive} />

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
    // "due"/"due on" is BANNED for future items — future = "upcoming" (user rule 2026-07-14).
    // Window widened 30 → 60 days (demo review 2026-09-04 / user call 2026-09-06).
    dueLabel: 'Upcoming in 60 Days',
    dueShort: 'Upcoming',
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
 *  removed per the 2026-07-30 review ("how will that number help?"); coverage lives per-vaccine.
 *  3 stats (demo review 2026-09-04): Overdue · Given in Last 60 Days (distinct animals with an
 *  administered dose in the trailing 60 days) · Upcoming in 60 Days (window widened from 30).
 *  Counts derive from the SAME animal rows the drill sheet lists — a tile must open a sheet
 *  showing exactly its number (the sidecar's precomputed summary has disagreed before). */
const PreventiveStatStrip: React.FC<{
  counts: { overdue: number; given60: number; upcoming60: number }
  w: ReturnType<typeof wordingFor>
  onPick: (t: StatusSheetTab) => void
}> = ({ counts, w, onPick }) => (
  // CC StatBand strip (2026-09-01 reskin sweep); Never Given removed same day.
  <SignalsBand
    cells={[
      { key: 'overdue', label: w.overdueLabel, count: counts.overdue, onOpen: () => onPick('overdue') },
      { key: 'given', label: 'Given in Last 60 Days', count: counts.given60, tone: 'neutral', onOpen: () => onPick('given') },
      { key: 'due', label: w.dueLabel, count: counts.upcoming60, tone: 'neutral', onOpen: () => onPick('due') }
    ]}
  />
)

/* ── Most Used section — top 10 medicines by animals given; scrollable tabs + monthly trend ── */
// Monthly-bucketed data can't honor "Today / Last week / Last 30 days" — offer month-valid presets only.
const MOST_USED_PRESETS: RangePreset[] = ['last_6m', 'last_1y', 'last_2y', 'last_3y', 'all']
const presetMonths = (p: RangePreset, total: number) =>
  p === 'last_6m' ? 6 : p === 'last_1y' ? 12 : p === 'last_2y' ? 24 : p === 'last_3y' ? 36 : total

/** Pad the sidecar month axis ("Aug '23"…) with empty months up to TODAY — the punch-list
 *  rolling rule: "Last 1 year" anchors at the current month, never at the last data month. */
const padMonthsToNow = (months: string[]): string[] => {
  if (!months.length) return months
  const last = /^([A-Za-z]{3})\s*'(\d{2})$/.exec(months[months.length - 1].trim())
  if (!last) return months
  let y = 2000 + Number(last[2])
  let m = MONTHS.indexOf(last[1])
  if (m < 0) return months
  const now = new Date()
  const out = [...months]
  while (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth())) {
    m++
    if (m > 11) {
      m = 0
      y++
    }
    out.push(`${MONTHS[m]} '${String(y).slice(-2)}`)
  }

  return out
}

/** Zero-fill a per-month series to the padded axis length. */
const padSeries = (s: number[], len: number) => (s.length >= len ? s : [...s, ...Array(len - s.length).fill(0)])

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

  // Card location rule (HARD, 2026-09-06): site line only while the VISIBLE list spans >1 site.
  const multiSite = !site && new Set(shown.map(x => x.a.site)).size > 1

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
              <AnimalCardRow
                key={x.a.aid}
                aid={x.a.aid}
                site={multiSite ? x.a.site : undefined}
                meta={<RowMetaText>{fmtDate(x.date)}</RowMetaText>}
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

  // Rolling windows anchor at TODAY (padded axis, zero-filled series).
  const axisMonths = padMonthsToNow(months)
  const n = Math.min(presetMonths(range.preset, axisMonths.length), axisMonths.length)

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
                sx={{ fontWeight: 600, color: active ? skin.ACCENT_INK : c.neutralSecondary, whiteSpace: 'nowrap' }}
              >
                {x.t.name}
              </Typography>
              <Typography
                variant='body1'
                sx={{ fontWeight: 700, color: active ? skin.ACCENT_INK : c.Outline, fontVariantNumeric: 'tabular-nums' }}
              >
                {x.given.toLocaleString()}
              </Typography>
            </Box>
          )
        })}
      </Box>
      <TrendAreaChart
        values={padSeries(sel.series, axisMonths.length).slice(-n)}
        labels={axisMonths.slice(-n)}
        color={theme.palette.primary.main}
        name={w.doseNoun}
        height={260}
        onPointClick={i => {
          const label = axisMonths.slice(-n)[i]
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

  // Strip counts from the SAME animal rows the drill sheet lists (tile == sheet).
  const stripStats = useMemo(() => stripCounts(types), [types])

  const num = (v: number, color: string, weight = 600) => (
    <Typography sx={{ fontSize: '1rem', fontWeight: weight, color, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
  )

  const columns: GridColDef[] = [
    // single-line name, no schedule subtitle (2026-07-31: headers and cells stay one line).
    // 2026-09-01: Sites Affected dropped, name column widened, bucket columns slimmed and
    // right-aligned (the 2026-08-27 numbers-right rule), zeros → the pale em dash.
    { field: 'name', headerName: w.typeCol, flex: 1, minWidth: 280, renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    // renderHeader forces ONE line (the kit's wrap-friendly header style breaks even at an
    // en-dash); widths sized to fit header + sort arrow + cell pad so nothing clips.
    ...([
      ['d30', '0–30 D'],
      ['d31', '31–60 D'],
      ['d61', '61–90 D'],
      ['d90', '90+ D']
    ] as const).map(([field, headerName]): GridColDef => ({
      field,
      headerName,
      renderHeader: () => (
        <Typography component='span' sx={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: skin.TABLE_HEAD_INK, whiteSpace: 'nowrap' }}>
          {headerName}
        </Typography>
      ),
      width: field === 'd90' ? 115 : 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => {
        const v = Number(p.row[field] || 0)
        if (!v) return txt('—', skin.DASH_INK)

        return num(v, field === 'd90' ? skin.CORAL : c.neutralSecondary, field === 'd90' ? 700 : 600)
      }
    }))
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PreventiveStatStrip counts={stripStats} w={w} onPick={setStatusSheet} />
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
/** Medical's site dropdown — a thin adapter over the kit's SiteFilterSelect (THE standard
 *  site dropdown, 2026-09-02): supplies the coverage • overdue captions, keeps its old API
 *  so Medical + Eggs call sites stay untouched. */
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

  return (
    <SiteFilterSelect
      value={value}
      onChange={onChange}
      sitesTotal={sitesTotal}
      allCaption={`${tracked.toLocaleString()} animals`}
      sites={sites.map(st => ({
        site: st.site,
        caption: caption ? (
          caption(st)
        ) : (
          <>
            <Box component='span' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{st.coveragePct}%</Box>
            {' • '}
            <Box component='span' sx={{ color: st.overdue ? c.Tertiary : c.neutralSecondary, fontWeight: st.overdue ? 700 : 600 }}>
              {st.overdue} {overdueWord}
            </Box>
          </>
        )
      }))}
    />
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
              {/* the PENDING dose leads (2026-09-01): scheduled date + how it stands today —
                  the question an overdue/upcoming drill arrives with. Prescriptions have no
                  schedule (showLate=false), so they never render this row. */}
              {showLate && animal.nextDue && (animal.status === 'overdue' || animal.status === 'due') && (
                <SheetRow
                  icon={icon}
                  iconSize={32}
                  title={`Scheduled ${fmtDate(animal.nextDue)}`}
                  caption={
                    <Box
                      component='span'
                      sx={{ color: animal.status === 'overdue' ? skin.CORAL : c.OnSurfaceVariant, fontWeight: 600 }}
                    >
                      {animal.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                    </Box>
                  }
                  trailing={
                    <>
                      {animal.status === 'overdue' ? (
                        <StatusChip label={`${animal.days ?? 0} d`} tone='error' bg={skin.mixOverWhite(skin.TONE_FILL.bad, 0.12)} />
                      ) : (
                        <StatusChip
                          label={animal.days == null ? 'Upcoming' : animal.days <= 0 ? 'Today' : `In ${animal.days} d`}
                          tone={animal.days != null && animal.days <= 7 ? 'caution' : 'neutral'}
                        />
                      )}
                      {/* the dose that's due — same fact the table's Scheduled column carries */}
                      {rate && (
                        <Typography variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
                          {rate}
                        </Typography>
                      )}
                    </>
                  }
                  last={animal.doses.length === 0}
                />
              )}
              {animal.doses.map((d, i) => {
                const amt = animal.amounts?.[i]

                return (
                  // ADMINISTERED DATES ONLY (user call 2026-09-06): the delayed-vs-scheduled
                  // comparison retired — no per-dose delay counts, no scheduled-date math.
                  // The overdue-since fact lives in the pending row above.
                  <SheetRow
                    key={i}
                    icon={icon}
                    iconSize={32}
                    title={`Administered ${fmtDate(d)}`}
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
  // animal-card-list sheet → the standard search + site facet (user call 2026-09-06)
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  // each month opens on Administered with a clean slate
  useEffect(() => {
    if (data) {
      setTab('given')
      setQ('')
      setSite(null)
    }
  }, [data])
  const rows = data?.rows ?? []
  const query = q.trim().toLowerCase()
  const matchQ = (r: MonthRow) =>
    !query ||
    r.a.name.toLowerCase().includes(query) ||
    r.a.aid.toLowerCase().includes(query) ||
    r.a.site.toLowerCase().includes(query)
  const given = rows.filter(r => r.kind === 'given' && matchQ(r))
  const missed = rows.filter(r => r.kind === 'missed' && matchQ(r))
  // Site facet options = sites in the ACTIVE tab's rows (pre-site-filter), labelled "Site (N)".
  const siteCounts = new Map<string, number>()
  for (const r of tab === 'given' ? given : missed) siteCounts.set(r.a.site, (siteCounts.get(r.a.site) ?? 0) + 1)
  if (site && !siteCounts.has(site)) siteCounts.set(site, 0)
  const siteOpts = [...siteCounts.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([s, n]) => ({ site: s, label: `${s} (${n.toLocaleString()})` }))
  const bySite = (rs: MonthRow[]) => (site ? rs.filter(r => r.a.site === site) : rs)
  const shownGiven = bySite(given)
  const shownMissed = bySite(missed)
  const shown = tab === 'given' ? shownGiven : shownMissed
  // Card location rule (HARD, 2026-09-06): site line only while the VISIBLE list spans >1 site;
  // a single site (picked or the only one left) → the enclosure line instead.
  const multiSite = !site && new Set(shown.map(r => r.a.site)).size > 1
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
              { label: 'Administered', value: shownGiven.length },
              { label: 'Overdue', value: shownMissed.length }
            ]}
            onClose={onClose}
          />
          <SheetTabs tabs={tabs} value={tab} onPick={setTab} />
          <SheetFilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder='Search animals…'
            facetOptions={siteOpts.map(o => o.label)}
            facetValue={site ? siteOpts.find(o => o.site === site)?.label ?? null : null}
            onFacet={v => setSite(v ? siteOpts.find(o => o.label === v)?.site ?? null : null)}
            facetPlaceholder='All Sites'
            facetIcon='mdi:map-marker-outline'
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
            {/* Standard animal-card rows (user call 2026-09-02): AnimalIdCard left, status chip
                + ONE date right (administered date only — the "Scheduled • given" pair retired;
                Overdue rows keep their scheduled date since nothing was given). */}
            {shown.map((r, i) => (
              <AnimalCardRow
                key={`${r.a.aid}-${r.date}`}
                aid={r.a.aid}
                site={multiSite ? r.a.site : undefined}
                trailing={
                  r.kind === 'missed' ? (
                    // no "overdue" word — the tab already says it
                    <StatusChip label={`${r.gap} d`} tone='error' bg={skin.mixOverWhite(skin.TONE_FILL.bad, 0.12)} />
                  ) : r.gap > 0 ? (
                    // late but ADMINISTERED — yellow, never the overdue coral ('warning' maps
                    // to the same Tertiary as 'error' in this kit; 'caution' is the yellow)
                    <StatusChip label={`${r.gap}d late`} tone='caution' />
                  ) : (
                    <StatusChip label='On Time' tone='success' />
                  )
                }
                meta={<RowMetaText>{r.kind === 'missed' ? `Scheduled ${fmtDate(r.due)}` : fmtDate(r.date)}</RowMetaText>}
                last={i === shown.length - 1}
                onClick={() => onAnimal(r.a)}
                chevron
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

  // animal-card-list sheet → the standard search + site facet (user call 2026-09-06)
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  useEffect(() => {
    if (data) {
      setQ('')
      setSite(null)
    }
  }, [data])

  const animals = data?.animals ?? []
  const query = q.trim().toLowerCase()
  const matched = animals.filter(
    a => !query || a.name.toLowerCase().includes(query) || a.aid.toLowerCase().includes(query) || a.site.toLowerCase().includes(query)
  )
  // Site facet options = sites in the sheet's (search-filtered) rows, labelled "Site (N)".
  const siteCounts = new Map<string, number>()
  for (const a of matched) siteCounts.set(a.site, (siteCounts.get(a.site) ?? 0) + 1)
  if (site && !siteCounts.has(site)) siteCounts.set(site, 0)
  const siteOpts = [...siteCounts.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([s, n]) => ({ site: s, label: `${s} (${n.toLocaleString()})` }))
  const shown = site ? matched.filter(a => a.site === site) : matched
  // Card location rule (HARD, 2026-09-06): site line only while the VISIBLE list spans >1 site.
  const multiSite = !site && new Set(shown.map(x => x.site)).size > 1

  return (
    <SheetDrawer open={!!data} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      {data && (
        <Sheet>
          <SheetHeader
            icon={icon}
            iconTone={{ bg: c.BgTeritary, fg: c.Tertiary }}
            title={`Overdue ${data.label} • ${typeName}`}
            stats={[{ label: 'Animals', value: shown.length }]}
            onClose={onClose}
          />
          <SheetFilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder='Search animals…'
            facetOptions={siteOpts.map(o => o.label)}
            facetValue={site ? siteOpts.find(o => o.site === site)?.label ?? null : null}
            onFacet={v => setSite(v ? siteOpts.find(o => o.label === v)?.site ?? null : null)}
            facetPlaceholder='All Sites'
            facetIcon='mdi:map-marker-outline'
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
            {shown.map((a, i) => (
              <AnimalCardRow
                key={a.aid}
                aid={a.aid}
                site={multiSite ? a.site : undefined}
                last={i === shown.length - 1}
                onClick={() => onAnimal(a)}
                chevron
                trailing={<StatusChip label={`${a.days ?? 0} d`} tone='error' bg={skin.mixOverWhite(skin.TONE_FILL.bad, 0.12)} />}
              />
            ))}
            {!shown.length && <SheetEmpty>No animals in this bucket.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/* ── species-level status sheet — stat-tile click → Overdue / Given 60 / Upcoming (Never
   Given removed from every screen/scenario, user call 2026-09-01) ── */
type StatusSheetTab = 'overdue' | 'given' | 'due'
type StatusSheetRow = {
  a: PreventiveTypeAnimal
  type: PreventiveType
  days: number
  /** Given tab: the latest administered date inside the 60-day window. */
  date?: string
  /** Given tab: how many medicines this animal received in the window (rows are distinct animals). */
  meds?: number
}
const STATUS_DAY_MS = 86400000
/** The one upcoming horizon (user call 2026-09-06): everything "upcoming" looks 60 days out. */
const UPCOMING_CAP_DAYS = 60
/** "Given in Last 60 Days" — the trailing administered-dose window (mirrors the upcoming cap). */
const GIVEN_WINDOW_DAYS = 60

/** Upcoming-sheet window presets (user call 2026-09-06: a DROPDOWN beside the site
 *  dropdown — Next 7/15/30/60 Days, NO custom; default = the full 60). */
type UpcomingPreset = 'w7' | 'w15' | 'w30' | 'w60'
const UPCOMING_WINDOW_ITEMS: { key: UpcomingPreset; label: string }[] = [
  { key: 'w7', label: 'Next 7 Days' },
  { key: 'w15', label: 'Next 15 Days' },
  { key: 'w30', label: 'Next 30 Days' },
  { key: 'w60', label: 'Next 60 Days' }
]
const startOfDayMs = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Resolve the upcoming window to concrete [lo..hi] ms bounds inside today..+60 d. */
const upcomingBounds = (preset: UpcomingPreset, now: Date) => {
  const lo0 = startOfDayMs(now)
  const days = preset === 'w7' ? 7 : preset === 'w15' ? 15 : preset === 'w30' ? 30 : UPCOMING_CAP_DAYS

  return { lo: lo0, hi: lo0 + days * STATUS_DAY_MS + (STATUS_DAY_MS - 1) }
}

/** Has this animal an administered dose inside the trailing given-window? (dose dates first,
 *  lastGiven as the fallback where the record carries no dose list). */
const givenInWindow = (a: PreventiveTypeAnimal, cutMs: number): string | null => {
  let latest: string | null = null
  for (const d of a.doses) {
    const t = new Date(d).getTime()
    if (!isNaN(t) && t >= cutMs && (!latest || d > latest)) latest = d
  }
  if (!latest && a.lastGiven && new Date(a.lastGiven).getTime() >= cutMs) latest = a.lastGiven

  return latest
}

/** The stat strip's three counts, derived from the SAME animal rows the sheet lists:
 *  overdue = animal × medicine rows; upcoming60 = rows with the next dose inside 60 days;
 *  given60 = DISTINCT animals with an administered dose in the last 60 days. */
const stripCounts = (types: PreventiveType[]) => {
  const now = new Date()
  const { lo, hi } = upcomingBounds('w60', now)
  const givenCut = now.getTime() - GIVEN_WINDOW_DAYS * STATUS_DAY_MS
  let overdue = 0
  let upcoming60 = 0
  const given = new Set<string>()
  for (const t of types) {
    for (const a of t.animals) {
      if (a.status === 'overdue') overdue++
      else if (a.status !== 'never' && a.nextDue) {
        const dueT = new Date(a.nextDue).getTime()
        if (!isNaN(dueT) && dueT >= lo && dueT <= hi) upcoming60++
      }
      if (givenInWindow(a, givenCut)) given.add(a.aid)
    }
  }

  return { overdue, given60: given.size, upcoming60 }
}

// same buckets as the medicine table's overdue-age columns
const OVERDUE_BUCKETS = [
  { label: '0–30 Days', value: 'd30', min: 0, max: 30 },
  { label: '31–60 Days', value: 'd31', min: 31, max: 60 },
  { label: '61–90 Days', value: 'd61', min: 61, max: 90 },
  { label: '90+ Days', value: 'd90', min: 91, max: Infinity }
]

/** Stat-strip drill: one sheet, three tabs — Overdue / Given (last 60 d) / Upcoming (next
 *  60 d) — the clicked tile lands on its tab. Overdue/Upcoming rows are animal × medicine
 *  (an animal overdue for two vaccines = two missed doses = two rows); the Given tab lists
 *  DISTINCT animals. Search + site facet (SheetFilterBar) + the app-standard
 *  CustomFilterDrawer (medicine / overdue-age multi-select). Row → dose history. */
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

  // site facet (task 2026-09-06): dropdown beside the search, default All Sites
  const [siteSel, setSiteSel] = useState<string | null>(null)

  // Upcoming window (user call 2026-09-06): a dropdown beside the site dropdown —
  // Next 7/15/30/60 Days, no custom; default = the full 60-day window
  const [upPreset, setUpPreset] = useState<UpcomingPreset>('w60')

  // applied filters (chips) + the drawer's working copy (committed on Apply)
  const [vaccines, setVaccines] = useState<string[]>([])
  const [ageBuckets, setAgeBuckets] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMenu, setFilterMenu] = useState<string>(w.typeCol)
  const [filterQ, setFilterQ] = useState('')
  const [pendVaccines, setPendVaccines] = useState<string[]>([])
  const [pendBuckets, setPendBuckets] = useState<string[]>([])

  // each open lands on the clicked tile's tab with a clean slate
  useEffect(() => {
    if (openTab) {
      setTab(openTab)
      setQ('')
      setSiteSel(null)
      setUpPreset('w60')
    }
  }, [openTab])

  const types = prog.types ?? []
  const typeItems = useMemo(() => types.map(t => ({ label: t.name, value: t.name })), [types])

  const lists = useMemo(() => {
    const query = q.trim().toLowerCase()
    const now = new Date()
    const nowMs = now.getTime()
    const matchQ = (a: PreventiveTypeAnimal, t: PreventiveType) =>
      !query || a.name.toLowerCase().includes(query) || t.name.toLowerCase().includes(query) || a.site.toLowerCase().includes(query)
    // Upcoming = the next dose falls inside the picked window — always within today..+60 d.
    const { lo, hi } = upcomingBounds(upPreset, now)
    const mk = (tb: 'overdue' | 'due') => {
      const out: StatusSheetRow[] = []
      for (const t of types) {
        if (vaccines.length && !vaccines.includes(t.name)) continue
        for (const a of t.animals) {
          let days = a.days ?? 0
          if (tb === 'due') {
            if (a.status === 'overdue' || a.status === 'never' || !a.nextDue) continue
            const dueT = new Date(a.nextDue).getTime()
            if (isNaN(dueT) || dueT < lo || dueT > hi) continue
            days = Math.ceil((dueT - nowMs) / STATUS_DAY_MS)
          } else if (a.status !== tb) continue
          if (
            tb === 'overdue' &&
            ageBuckets.length &&
            !OVERDUE_BUCKETS.some(b => ageBuckets.includes(b.value) && days >= b.min && days <= b.max)
          )
            continue
          if (!matchQ(a, t)) continue
          out.push({ a, type: t, days })
        }
      }

      return out.sort(
        tb === 'overdue'
          ? (x, y) => y.days - x.days // longest overdue first
          : (x, y) => x.days - y.days // soonest first
      )
    }
    // Given in Last 60 Days — DISTINCT animals (the tile's definition): one row per animal,
    // stamped with its latest administered date in the window; `meds` = medicines received.
    const mkGiven = () => {
      const cut = nowMs - GIVEN_WINDOW_DAYS * STATUS_DAY_MS
      const byAid = new Map<string, StatusSheetRow>()
      for (const t of types) {
        if (vaccines.length && !vaccines.includes(t.name)) continue
        for (const a of t.animals) {
          const latest = givenInWindow(a, cut)
          if (!latest || !matchQ(a, t)) continue
          const prev = byAid.get(a.aid)
          if (!prev) {
            byAid.set(a.aid, { a, type: t, days: 0, date: latest, meds: 1 })
          } else {
            prev.meds = (prev.meds ?? 1) + 1
            if (latest > (prev.date ?? '')) {
              prev.a = a
              prev.type = t
              prev.date = latest
            }
          }
        }
      }

      return [...byAid.values()].sort((x, y) => ((x.date ?? '') < (y.date ?? '') ? 1 : -1)) // newest first
    }

    return { overdue: mk('overdue'), given: mkGiven(), due: mk('due') }
  }, [types, q, vaccines, ageBuckets, upPreset])

  // Site facet options = sites present in the ACTIVE tab's rows (pre-site-filter), with counts.
  const siteOpts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of lists[tab]) m.set(r.a.site, (m.get(r.a.site) ?? 0) + 1)
    if (siteSel && !m.has(siteSel)) m.set(siteSel, 0)

    return [...m.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([site, n]) => ({ site, label: `${site} (${n.toLocaleString()})` }))
  }, [lists, tab, siteSel])
  const bySite = (rows: StatusSheetRow[]) => (siteSel ? rows.filter(r => r.a.site === siteSel) : rows)
  const shown = bySite(lists[tab])
  // Card location rule (HARD, 2026-09-06): >1 site in the list → SITE line (no enclosure);
  // a single site (picked in the facet, or the only one present) → ENCLOSURE line (no site).
  const multiSite = !siteSel && new Set(shown.map(x => x.a.site)).size > 1

  const tabs: { key: StatusSheetTab; label: string }[] = [
    { key: 'overdue', label: `${w.overdueLabel} • ${bySite(lists.overdue).length}` },
    { key: 'given', label: `Given • ${bySite(lists.given).length}` },
    { key: 'due', label: `${w.dueShort} • ${bySite(lists.due).length}` }
  ]

  const ageMenu = `${w.overdueLabel} Age`
  const appliedCount = vaccines.length + ageBuckets.length

  const openFilter = () => {
    setPendVaccines(vaccines)
    setPendBuckets(ageBuckets)
    setFilterMenu(w.typeCol)
    setFilterQ('')
    setFilterOpen(true)
  }
  const applyFilters = () => {
    setVaccines(pendVaccines)
    setAgeBuckets(pendBuckets)
    setFilterOpen(false)
  }
  const clearAll = () => {
    setPendVaccines([])
    setPendBuckets([])
  }

  const filteredTypeItems = filterQ.trim()
    ? typeItems.filter(i => i.label.toLowerCase().includes(filterQ.trim().toLowerCase()))
    : typeItems

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
          {/* the shared sheet search + site facet; on Upcoming the WINDOW dropdown rides
              beside the site dropdown (user call 2026-09-06): Next 7/15/30/60 Days, no
              custom — default the full 60. */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SheetFilterBar
              search={q}
              onSearch={setQ}
              searchPlaceholder={`Search animals, ${w.typeNoun}, sites…`}
              facetOptions={siteOpts.map(o => o.label)}
              facetValue={siteSel ? siteOpts.find(o => o.site === siteSel)?.label ?? null : null}
              onFacet={v => setSiteSel(v ? siteOpts.find(o => o.label === v)?.site ?? null : null)}
              facetPlaceholder='All Sites'
              facetIcon='mdi:map-marker-outline'
              {...(tab === 'due'
                ? {
                    facet2Options: UPCOMING_WINDOW_ITEMS.map(i => i.label),
                    facet2Value: UPCOMING_WINDOW_ITEMS.find(i => i.key === upPreset)?.label ?? null,
                    onFacet2: (v: string | null) =>
                      setUpPreset((UPCOMING_WINDOW_ITEMS.find(i => i.label === v)?.key ?? 'w60') as UpcomingPreset),
                    facet2Placeholder: 'Next 60 Days',
                    facet2Icon: 'mdi:calendar-range-outline'
                  }
                : {})}
            />
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
          </Box>
        )}
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {/* THE minimal animal card (2026-09-06): 75px block, EXACTLY 3 text rows — two
              identifiers + ONE location line (site XOR enclosure per the multiSite rule). */}
          {shown.map((r, i) => {
            const s = synthAnimalIdentity(r.a.aid)

            return (
              <AnimalCardRow
                key={`${r.type.name}-${r.a.aid}`}
                aid={r.a.aid}
                size={75}
                identifiers={s.identifiers}
                tag={s.tag}
                site={multiSite ? r.a.site : undefined}
                enclosure={multiSite ? undefined : s.enclosure}
                last={i === shown.length - 1}
                onClick={() => setDrill(r)}
                chevron
                trailing={
                  tab === 'overdue' ? (
                    <StatusChip label={`${r.days} d`} tone='error' bg={skin.mixOverWhite(skin.TONE_FILL.bad, 0.12)} />
                  ) : tab === 'due' ? (
                    // imminent = yellow attention, never coral — these doses aren't a failure
                    <StatusChip label={r.days <= 0 ? 'Today' : `In ${r.days}d`} tone={r.days <= 7 ? 'caution' : 'neutral'} />
                  ) : undefined
                }
                // medicine + date (Upcoming: the scheduled date · Given: the administered date)
                meta={
                  tab === 'given' ? (
                    <>
                      <RowMetaText strong>{(r.meds ?? 1) > 1 ? `${r.meds} medicines` : r.type.name}</RowMetaText>
                      {r.date && <RowMetaText>{fmtDate(r.date)}</RowMetaText>}
                    </>
                  ) : (
                    <>
                      <RowMetaText strong>{r.type.name}</RowMetaText>
                      {tab === 'due' && r.a.nextDue && <RowMetaText>{fmtDate(r.a.nextDue)}</RowMetaText>}
                    </>
                  )
                }
              />
            )
          })}
          {!shown.length && <SheetEmpty>No animals in this group.</SheetEmpty>}
        </Box>
      </Sheet>

      <CustomFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        onClearAll={clearAll}
        filterLists={[w.typeCol, ageMenu]}
        selectedOptions={{
          [w.typeCol]: pendVaccines,
          [ageMenu]: pendBuckets
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
  speciesId?: number | string
  onBack: () => void
}> = ({ type, months, w, icon, speciesId, onBack }) => {
  const { txt, c, theme } = useCells()

  // Portrait: the status tabs + site filter + search don't fit one header row —
  // stack as two deliberate rows (tabs / full-width search + right-aligned filter).
  const portrait = useMediaQuery('(orientation: portrait)')
  /* THE standard period control for the doses chart (user call 2026-09-06): pill
     1Y | 2Y | 3Y | Custom + capped year From/To — the CoL/SickTrendCard grammar;
     TrendRangeTabs' 'All' retired (demo review 2026-09-04). */
  const [trendRange, setTrendRange] = useState<'last_1y' | 'last_2y' | 'last_3y' | 'custom'>('last_1y')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const NOW = useMemo(() => new Date(), [])
  const [statusTab, setStatusTab] = useState<'overdue' | 'due'>('overdue')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [drill, setDrill] = useState<PreventiveTypeAnimal | null>(null)
  const [monthDrill, setMonthDrill] = useState<{ label: string; rows: MonthRow[] } | null>(null)
  const [bucketDrill, setBucketDrill] = useState<{ label: string; animals: PreventiveTypeAnimal[] } | null>(null)

  // Years the dose data actually covers (for the Custom From/To pickers) — dose dates
  // back from today; the chart always has this year available.
  const years = useMemo(() => {
    let first = NOW.getFullYear()
    for (const a of type.animals)
      for (const d of a.doses) {
        const y = Number(d.slice(0, 4))
        if (Number.isFinite(y) && y >= 1900 && y < first) first = y
      }

    return Array.from({ length: NOW.getFullYear() - first + 1 }, (_, i) => NOW.getFullYear() - i)
  }, [type, NOW])
  const CAP = 5
  const enterCustom = () => {
    setTrendRange('custom')
    if (yearFrom == null && yearTo == null) {
      setYearFrom(Math.max(years[years.length - 1] ?? NOW.getFullYear(), NOW.getFullYear() - (CAP - 1)))
      setYearTo(NOW.getFullYear())
    }
  }

  // Doses Administered as the kit YearLinesChart (demo review 2026-09-04): one line per
  // calendar year over Jan–Dec, ≤5 lines. Values derive from the SAME dose records the
  // month drill lists (the sidecar's precomputed dosesPerMonth doesn't reconcile — a dot
  // that says 8 must open a sheet that shows 8). The picked window filters WHICH doses
  // count (CoL semantics): presets = last 12/24/36 months anchored at today; Custom =
  // whole years [from..to], anchored at the range's end (today when it ends this year).
  const doseSeries = useMemo<YearSeries[]>(() => {
    let winStart: Date
    let winEnd: Date
    if (trendRange === 'custom') {
      const to = yearTo ?? NOW.getFullYear()
      const from = yearFrom ?? to
      winEnd = to >= NOW.getFullYear() ? NOW : new Date(to, 11, 31, 23, 59, 59)
      winStart = new Date(from, 0, 1)
    } else {
      const n = trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12
      winStart = new Date(NOW.getFullYear(), NOW.getMonth() - (n - 1), 1)
      winEnd = NOW
    }
    const lo = winStart.getTime()
    const hi = winEnd.getTime()
    const by = new Map<number, number[]>()
    for (const a of type.animals) {
      for (const d of a.doses) {
        const t = new Date(d).getTime()
        if (isNaN(t) || t < lo || t > hi) continue
        const y = Number(d.slice(0, 4))
        const m = Number(d.slice(5, 7)) - 1
        if (!Number.isFinite(y) || m < 0 || m > 11) continue
        const arr = by.get(y) ?? Array(12).fill(0)
        arr[m]++
        by.set(y, arr)
      }
    }

    // newest year first — drives the chart's lightness ladder; ≤5 lines (the kit rule)
    return [...by.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, CAP)
      .map(([year, values]) => ({ year, values }))
  }, [type, trendRange, yearFrom, yearTo, NOW])

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

  // Two tabs only — Overdue · Upcoming (All/Covered dropped 2026-09-01: the work lives here;
  // coverage is the header ledger's job). Counts come from the ACTUAL animal list, never the
  // sidecar's precomputed rollup (seen disagreeing: 90 vs 30) — tabs must match their rows.
  const counts: Record<'due' | 'overdue', number> = {
    due: type.animals.filter(a => a.status === 'due').length,
    overdue: type.animals.filter(a => a.status === 'overdue').length
  }
  const STATUS_TABS: { key: 'due' | 'overdue'; label: string }[] = [
    { key: 'overdue', label: w.statusLabels.overdue },
    { key: 'due', label: w.statusLabels.due }
  ]

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()

    return type.animals
      .filter(a => a.status === statusTab && (!siteFilter || a.site === siteFilter) && (!query || `${a.name} ${a.aid} ${a.site}`.toLowerCase().includes(query)))
      .map(a => ({ id: a.aid, ...a, doseCount: a.doses.length }))
  }, [type.animals, statusTab, siteFilter, q])
  const tbl = useSortableTable(rows, { field: 'nextDue', sort: 'asc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
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

  // Scheduled cell — date on top, the standard dose to give beneath (mirrors Last Dose).
  const scheduledCell = (a: PreventiveTypeAnimal) => {
    if (!a.nextDue) return txt('—', skin.DASH_INK)
    const sub = doseRate(type.dose)

    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '1rem', color: c.OnSurfaceVariant, whiteSpace: 'nowrap' }}>{fmtDate(a.nextDue)}</Typography>
        {sub && (
          <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, display: 'block', fontVariantNumeric: 'tabular-nums' }} noWrap>
            {sub}
          </Typography>
        )}
      </Box>
    )
  }

  // The tab says the status, so no chip column; Overdue adds Delayed (days late, coral);
  // Doses closes the row (user call 2026-09-01).
  // Animal card (Figma Antz-Mobile 38280:31073) — THIS table is the pilot surface
  // (user call 2026-09-02): photo/placeholder block + max-2 identifiers + Encl + Site.
  // Identity fields are deterministic demo synthesis until the API carries them.
  const heroPhoto = HERO_PHOTOS[String(speciesId ?? '')]
  // HARD RULE: the card's Site row only when the list spans >1 site — a specific site
  // filter (or a single-site species) already says the site once, above the table.
  const showCardSite = !siteFilter && (type.sites?.length ?? 0) > 1
  const animalCardCell = (a: PreventiveTypeAnimal) => {
    const s = synthAnimalIdentity(a.aid)

    return (
      <AnimalIdCard
        identifiers={s.identifiers}
        enclosure={s.enclosure}
        site={showCardSite ? a.site : undefined}
        tag={s.tag}
        photo={s.hasPhoto ? heroPhoto?.src : undefined}
        photoPos={heroPhoto?.bgPos}
      />
    )
  }

  const columns: GridColDef[] = [
    // the animal card carries encl + site — the site lives here, not in its own column
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 380, renderCell: p => animalCardCell(p.row) },
    // column order (user call 2026-09-02): No · Animal · Delayed · Scheduled · Last Dose
    ...(statusTab === 'overdue'
      ? [
          {
            field: 'days',
            headerName: 'Delayed',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p: GridRenderCellParams) =>
              p.row.days != null ? txt(`${Number(p.row.days).toLocaleString()} d`, skin.CORAL, 700) : txt('—', skin.DASH_INK)
          } as GridColDef
        ]
      : []),
    { field: 'nextDue', headerName: 'Scheduled', width: 180, renderCell: p => scheduledCell(p.row) },
    { field: 'lastGiven', headerName: 'Last Dose', width: 190, renderCell: p => lastDoseCell(p.row) }
  ]

  const statusTabs = (
    // Never wraps: one row, overflow scrolls (the kit's underline-tab pattern).
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', ...thinScrollbarSx(theme) }}>
      {STATUS_TABS.map(m => {
        const active = statusTab === m.key

        return (
          <Box
            key={m.key}
            onClick={() => {
              setStatusTab(m.key)
              tbl.setPaginationModel(p => ({ ...p, page: 0 }))
            }}
            role='tab'
            aria-selected={active}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5, flexShrink: 0, borderBottom: '2.5px solid', borderColor: active ? skin.ACCENT_FILL : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { borderColor: active ? skin.ACCENT_FILL : c.OutlineVariant } }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: active ? skin.ACCENT_INK : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {m.label}
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: active ? skin.ACCENT_INK : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
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
            • {type.due} {w.dueWord}
          </Typography>
        </Box>
      </Box>

      {/* Administered ONLY (2026-08-27 punch-list): the kit YearLinesChart (LINE, one line
          per year, Jan–Dec axis, standard tooltip — demo review 2026-09-04); overdue never
          rides the plot — it has its own section below (user call 2026-09-01). The period
          control is THE standard: pill 1Y|2Y|3Y|Custom + capped-5 year From/To. Dot tap →
          that year-month's schedule sheet (given + missed). */}
      <SectionCard
        title='Doses Administered'
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', flexShrink: 0, '& > *': { flexShrink: 0 } }}>
            <ViewToggle
              height={CTRL_H}
              items={[
                { key: 'last_1y', label: '1Y' },
                { key: 'last_2y', label: '2Y' },
                { key: 'last_3y', label: '3Y' },
                { key: 'custom', label: 'Custom' }
              ]}
              value={trendRange}
              onChange={k => (k === 'custom' ? enterCustom() : setTrendRange(k as 'last_1y' | 'last_2y' | 'last_3y'))}
            />
            {trendRange === 'custom' && (
              <>
                <RangeSelect value={yearFrom} onPick={setYearFrom} items={yearItemsFor(years, yearTo, CAP, 'from')} anyLabel='From' />
                <Typography sx={{ color: skin.FAINT }}>–</Typography>
                <RangeSelect value={yearTo} onPick={setYearTo} items={yearItemsFor(years, yearFrom, CAP, 'to')} anyLabel='To' />
              </>
            )}
          </Box>
        }
        titleMb={3}
      >
        {doseSeries.length ? (
          <YearLinesChart
            series={doseSeries}
            accent={skin.ACCENT_FILL}
            noun='doses'
            height={280}
            onPoint={(year, monthIdx) => onDoseMonth(`${MONTHS[monthIdx]} '${String(year).slice(-2)}`)}
          />
        ) : (
          <EmptyState message='No doses administered in this period' />
        )}
      </SectionCard>

      {/* How Long Overdue (renamed from "Overdue by Age", user call 2026-09-06 — same
          aging-bucket data): animal-wise lateness buckets counted from today, as StatBand
          cells (2026-09-01 — the bare-row layout was rejected). Cell tap → that bucket's
          animal list. NOTE: cells count the per-vaccine animal list; the sidecar's
          precomputed type.overdue can disagree (90 vs 30 seen in review) — total
          intentionally NOT shown here until that pipeline is reconciled. */}
      <SectionCard title='How Long Overdue' titleMb={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`, gap: 3 }}>
          {buckets.map((b, i) => {
            const live = b.animals.length > 0

            return (
              // each bucket = its own quiet tile (2026-09-01: hairline cells read too empty)
              <Box
                key={b.label}
                onClick={live ? () => setBucketDrill({ label: b.label, animals: b.animals }) : undefined}
                sx={{
                  px: '18px',
                  py: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '9px',
                  borderRadius: '12px',
                  backgroundColor: skin.FIELD_BG,
                  border: `1px solid ${skin.HAIR}`,
                  ...(live && { cursor: 'pointer', ...skin.cardPressSx, '&:hover': { backgroundColor: skin.ROW_HOVER } })
                }}
              >
                <Typography sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: skin.FAINT }}>
                  {b.label}
                </Typography>
                {/* chevron = the house "this opens something" affordance (Overview card grammar) */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '24px',
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: '-0.6px',
                      fontVariantNumeric: 'tabular-nums',
                      color: !live ? skin.DASH_INK : i === buckets.length - 1 ? skin.CORAL : skin.VALUE
                    }}
                  >
                    {b.animals.length.toLocaleString()}
                  </Typography>
                  {live && <Icon icon='mdi:chevron-right' fontSize={20} color={skin.FAINT} />}
                </Box>
              </Box>
            )
          })}
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
            rowHeight={146} // 94px animal-card block + 26px top/bottom breathing room
            stickyFields={['name']} // HARD RULE: identity columns pinned when the table scrolls
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

const PreventivePanel: React.FC<{ tab: TabKey; prog: PreventiveProgram; months: string[]; speciesId?: number | string }> = ({
  tab,
  prog,
  months,
  speciesId
}) => {
  const [selected, setSelected] = useState<string | null>(null)
  const w = wordingFor(tab, prog.kind)
  const icon = PROGRAM_ICON[tab] ?? 'mdi:medical-bag'
  const sel = (prog.types ?? []).find(t => t.name === selected)

  if (!prog.types?.length) return <EmptyState message={`No ${w.typeNoun} data for this species`} />

  return sel ? (
    <PreventiveDetail key={sel.name} type={sel} months={months} w={w} icon={icon} speciesId={speciesId} onBack={() => setSelected(null)} />
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
              <AnimalCardRow
                key={`${cr.aid}-${cr.medicine}-${cr.start}`}
                aid={cr.aid}
                site={new Set(lists.courses.map(x => x.site)).size > 1 ? cr.site : undefined}
                last={i === lists.courses.length - 1}
                onClick={() => drillCourse(cr.aid, cr.medicine)}
                chevron
                trailing={countText(cr.doses, cr.doses === 1 ? 'dose' : 'doses')}
                meta={
                  <>
                    <RowMetaText strong>{cr.medicine}</RowMetaText>
                    <RowMetaText>Started {fmtDate(cr.start)}</RowMetaText>
                  </>
                }
              />
            ))}
          {tab === 'animals' &&
            lists.animals.map((a, i) => (
              <AnimalCardRow
                key={a.aid}
                aid={a.aid}
                site={new Set(lists.animals.map(x => x.site)).size > 1 ? a.site : undefined}
                last={i === lists.animals.length - 1}
                onClick={() => setAnimalDrill(a)}
                chevron
                trailing={countText(a.courses, a.courses === 1 ? 'prescription' : 'prescriptions')}
                meta={
                  <>
                    <RowMetaText strong>{a.medicines.length === 1 ? a.medicines[0] : `${a.medicines.length} medicines`}</RowMetaText>
                    <RowMetaText>Last given {fmtDate(a.lastGiven)}</RowMetaText>
                  </>
                }
              />
            ))}
          {(tab === 'd30' || tab === 'd60') &&
            lists[tab].map((r, i) => (
              <AnimalCardRow
                key={`${r.med.name}-${r.a.aid}`}
                aid={r.a.aid}
                site={new Set(lists[tab].map(x => x.a.site)).size > 1 ? r.a.site : undefined}
                last={i === lists[tab].length - 1}
                onClick={() => setDrill({ a: r.a, med: r.med })}
                chevron
                meta={
                  <>
                    <RowMetaText strong>{r.med.name}</RowMetaText>
                    <RowMetaText>{fmtDate(r.a.lastGiven)}</RowMetaText>
                  </>
                }
              />
            ))}
          {tab === 'missed' &&
            lists.missed.map((x, i) => (
              <AnimalCardRow
                key={`${x.med.name}-${x.m.aid}-${x.m.date}`}
                aid={x.m.aid}
                site={new Set(lists.missed.map(y => y.m.site)).size > 1 ? x.m.site : undefined}
                meta={
                  // one item per row (card-list hard rule)
                  <>
                    <RowMetaText strong>{x.med.name}</RowMetaText>
                    <RowMetaText>{x.m.reason}</RowMetaText>
                    <RowMetaText>{fmtDate(x.m.date)}</RowMetaText>
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

  // Card location rule (HARD, 2026-09-06): site line only while the VISIBLE list spans >1 site.
  const shownSites = tab === 'given' ? shownGiven.map(g => g.a.site) : shownMissed.map(m => m.site)
  const multiSite = !site && new Set(shownSites).size > 1

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
                <AnimalCardRow
                  key={`${g.a.aid}-${g.date}`}
                  aid={g.a.aid}
                  site={multiSite ? g.a.site : undefined}
                  meta={<RowMetaText>{fmtDate(g.date)}</RowMetaText>}
                  last={i === shownGiven.length - 1}
                  onClick={() => setDrill(g.a)}
                  chevron
                />
              ))}
            {tab === 'missed' &&
              shownMissed.map((m, i) => (
                <AnimalCardRow
                  key={`${m.aid}-${m.date}`}
                  aid={m.aid}
                  site={multiSite ? m.site : undefined}
                  meta={
                    <>
                      <RowMetaText strong>{m.reason}</RowMetaText>
                      <RowMetaText>{fmtDate(m.date)}</RowMetaText>
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
  const { txt, c, theme } = useCells()
  const heroPhoto = React.useContext(HeroPhotoContext)
  const portrait = useMediaQuery('(orientation: portrait)')
  /* THE standard period control (mirror of the vaccine detail, user call 2026-09-06):
     pill 1Y | 2Y | 3Y | Custom + capped year From/To; TrendRangeTabs' 'All' retired. */
  const [trendRange, setTrendRange] = useState<'last_1y' | 'last_2y' | 'last_3y' | 'custom'>('last_1y')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const NOW = useMemo(() => new Date(), [])
  const [q, setQ] = useState('')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
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
      .filter(a => (!siteFilter || a.site === siteFilter) && (!query || `${a.name} ${a.aid} ${a.site}`.toLowerCase().includes(query)))
      .map(a => ({ id: a.aid, ...a, courses: coursesByAid.get(a.aid) ?? 1, doseCount: a.doses.length }))
  }, [med.animals, q, siteFilter, coursesByAid])
  const tbl = useSortableTable(rows, { field: 'lastGiven', sort: 'desc' })
  const onQ = (v: string) => {
    setQ(v)
    tbl.setPaginationModel(p => ({ ...p, page: 0 }))
  }

  // Standard animal-card column (2026-09-02): site line only while the VISIBLE list
  // spans >1 site — a site pick flips the card to its enclosure line (2026-09-06 rule).
  const showCardSite = !siteFilter && new Set(med.animals.map(a => a.site)).size > 1
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Animal',
      flex: 1,
      minWidth: 380,
      renderCell: p => {
        const s = synthAnimalIdentity(p.row.aid)

        return (
          <AnimalIdCard
            identifiers={s.identifiers}
            enclosure={s.enclosure}
            site={showCardSite ? p.row.site : undefined}
            tag={s.tag}
            photo={s.hasPhoto ? heroPhoto?.src : undefined}
            photoPos={heroPhoto?.bgPos}
          />
        )
      }
    },
    { field: 'courses', headerName: 'Prescriptions', width: 180, renderCell: p => txt(p.row.courses, c.neutralSecondary, 600) },
    { field: 'doseCount', headerName: 'Doses', width: 120, renderCell: p => txt(p.row.doseCount, c.neutralSecondary, 600) },
    // date only — the given amount lives in the dose-history sheet, not this table
    { field: 'lastGiven', headerName: 'Last Given', width: 170, renderCell: p => txt(p.row.lastGiven ? fmtDate(p.row.lastGiven) : '—', c.neutralSecondary) }
  ]

  // Years this medicine's dose dates cover — for the Custom From/To pickers.
  const years = useMemo(() => {
    let first = NOW.getFullYear()
    for (const a of med.animals)
      for (const d of a.doses) {
        const y = Number(d.slice(0, 4))
        if (Number.isFinite(y) && y >= 1900 && y < first) first = y
      }

    return Array.from({ length: NOW.getFullYear() - first + 1 }, (_, i) => NOW.getFullYear() - i)
  }, [med, NOW])
  const CAP = 5
  const enterCustom = () => {
    setTrendRange('custom')
    if (yearFrom == null && yearTo == null) {
      setYearFrom(Math.max(years[years.length - 1] ?? NOW.getFullYear(), NOW.getFullYear() - (CAP - 1)))
      setYearTo(NOW.getFullYear())
    }
  }

  // Doses Administered as the kit YearLinesChart (vaccine-detail mirror): one line per
  // calendar year over Jan–Dec, ≤5 lines, counted from the SAME dose records the month
  // drill lists. Presets = last 12/24/36 months anchored at today; Custom = whole years
  // [from..to], anchored at the range's end (today when it ends this year).
  const doseSeries = useMemo<YearSeries[]>(() => {
    let winStart: Date
    let winEnd: Date
    if (trendRange === 'custom') {
      const to = yearTo ?? NOW.getFullYear()
      const from = yearFrom ?? to
      winEnd = to >= NOW.getFullYear() ? NOW : new Date(to, 11, 31, 23, 59, 59)
      winStart = new Date(from, 0, 1)
    } else {
      const n = trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12
      winStart = new Date(NOW.getFullYear(), NOW.getMonth() - (n - 1), 1)
      winEnd = NOW
    }
    const lo = winStart.getTime()
    const hi = winEnd.getTime()
    const by = new Map<number, number[]>()
    for (const a of med.animals) {
      for (const d of a.doses) {
        const t = new Date(d).getTime()
        if (isNaN(t) || t < lo || t > hi) continue
        const y = Number(d.slice(0, 4))
        const m = Number(d.slice(5, 7)) - 1
        if (!Number.isFinite(y) || m < 0 || m > 11) continue
        const arr = by.get(y) ?? Array(12).fill(0)
        arr[m]++
        by.set(y, arr)
      }
    }

    // newest year first — drives the chart's lightness ladder; ≤5 lines (the kit rule)
    return [...by.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, CAP)
      .map(([year, values]) => ({ year, values }))
  }, [med, trendRange, yearFrom, yearTo, NOW])

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

      {/* Prescriptions total dropped here too (demo review 2026-09-04 stat rule). */}
      <SignalsBand
        cells={[
          { key: 'animals', label: 'Animals Treated', count: med.tracked, tone: 'neutral' },
          { key: 'given', label: 'Doses Given', count: med.dosesGiven, tone: 'neutral' },
          { key: 'missed', label: 'Doses Missed', count: med.dosesMissed }
        ]}
      />

      {/* Administered ONLY (2026-08-27 punch-list pattern) — missed lives in the stat strip
          and the month drill, not in the plot. Kit YearLinesChart + THE standard period
          control (vaccine-detail mirror); dot tap → that year-month's dose sheet. */}
      <SectionCard
        title='Doses Administered'
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', flexShrink: 0, '& > *': { flexShrink: 0 } }}>
            <ViewToggle
              height={CTRL_H}
              items={[
                { key: 'last_1y', label: '1Y' },
                { key: 'last_2y', label: '2Y' },
                { key: 'last_3y', label: '3Y' },
                { key: 'custom', label: 'Custom' }
              ]}
              value={trendRange}
              onChange={k => (k === 'custom' ? enterCustom() : setTrendRange(k as 'last_1y' | 'last_2y' | 'last_3y'))}
            />
            {trendRange === 'custom' && (
              <>
                <RangeSelect value={yearFrom} onPick={setYearFrom} items={yearItemsFor(years, yearTo, CAP, 'from')} anyLabel='From' />
                <Typography sx={{ color: skin.FAINT }}>–</Typography>
                <RangeSelect value={yearTo} onPick={setYearTo} items={yearItemsFor(years, yearFrom, CAP, 'to')} anyLabel='To' />
              </>
            )}
          </Box>
        }
        titleMb={3}
      >
        {doseSeries.length ? (
          <YearLinesChart
            series={doseSeries}
            accent={skin.ACCENT_FILL}
            noun='doses'
            height={280}
            onPoint={(year, monthIdx) => setMonthDrill({ label: `${MONTHS[monthIdx]} '${String(year).slice(-2)}` })}
          />
        ) : (
          <EmptyState message='No doses administered in this period' />
        )}
      </SectionCard>

      {/* Site filter (THE standard dropdown, 2026-09-02) lives beside search. Portrait:
          title row, then full-width search + right-aligned filter (two-row grammar). */}
      {(() => {
        const siteFilterCtl = (
          <SiteFilterControl
            sites={med.sites ?? []}
            sitesTotal={med.sitesTotal ?? 0}
            tracked={med.tracked}
            value={siteFilter}
            onChange={v => {
              setSiteFilter(v)
              tbl.setPaginationModel(p => ({ ...p, page: 0 }))
            }}
            overdueWord='missed'
            caption={st => `${st.animals.toLocaleString()} animal${st.animals === 1 ? '' : 's'} treated`}
          />
        )
        const searchCtl = <TableSearch value={q} onChange={onQ} placeholder='Search animals…' grow={portrait} />

        return (
      <SectionCard
        title={
          <Box sx={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: 4, width: portrait ? '100%' : undefined, minWidth: 0 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Animals{' '}
              <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
                • {med.tracked.toLocaleString()}
              </Box>
            </Typography>
            {portrait && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {searchCtl}
                {siteFilterCtl}
              </Box>
            )}
          </Box>
        }
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {searchCtl}
            </Box>
          )
        }
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
            rowHeight={146} // 94px animal-card block + breathing room (table standard)
            stickyFields={['name']} // HARD RULE: identity columns pinned when the table scrolls
            onRowClick={(p: { row: PreventiveTypeAnimal }) => setDrill(p.row)}
          />
        ) : (
          <EmptyState message='No animals match this search' />
        )}
      </SectionCard>
        )
      })()}

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
    <Typography sx={{ fontSize: '1rem', fontWeight: weight, color, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
  )

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Medicine', flex: 1, minWidth: 200, renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    { field: 'animalsN', headerName: 'Animals', width: 130, align: 'right', headerAlign: 'right', renderCell: p => (p.row.animalsN ? num(p.row.animalsN, c.neutralSecondary) : txt('—', skin.DASH_INK)) },
    { field: 'courses', headerName: 'Prescriptions', width: 180, align: 'right', headerAlign: 'right', renderCell: p => (p.row.courses ? num(p.row.courses, c.neutralSecondary) : txt('—', skin.DASH_INK)) },
    {
      field: 'given30',
      headerName: 'Last 30 Days',
      width: 160,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => (p.row.given30 ? num(p.row.given30, p.row.given30 >= hot30 ? skin.CORAL : c.OnSurfaceVariant, p.row.given30 >= hot30 ? 700 : 600) : txt('—', skin.DASH_INK))
    },
    { field: 'given60', headerName: 'Last 60 Days', width: 160, align: 'right', headerAlign: 'right', renderCell: p => (p.row.given60 ? num(p.row.given60, c.neutralSecondary) : txt('—', skin.DASH_INK)) },
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
      {/* Total-prescriptions stat retired (demo review 2026-09-04: "Animals treated yes,
          total prescriptions NO") — the prescription list stays reachable as a sheet tab. */}
      <SignalsBand
        cells={[
          { key: 'animals', label: 'Animals Treated', count: rx.summary.animalsTreated, tone: 'neutral', onOpen: () => setStatusSheet('animals') },
          { key: 'd30', label: 'Given in Last 30 Days', count: rx.summary.given30, tone: 'neutral', onOpen: () => setStatusSheet('d30') },
          { key: 'd60', label: 'Given in Last 60 Days', count: rx.summary.given60, tone: 'neutral', onOpen: () => setStatusSheet('d60') },
          { key: 'missed', label: 'Doses Missed', count: rx.summary.dosesMissed, onOpen: () => setStatusSheet('missed') }
        ]}
      />
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

const ClinicalMergedPanel: React.FC<{
  symptoms?: ClinicalProgram
  diagnosis?: ClinicalProgram
  range: RangeSelection
  onRange: (r: RangeSelection) => void
}> = ({ symptoms, diagnosis, range, onRange }) => {
  const { txt, c } = useCells()
  const portrait = useMediaQuery('(orientation: portrait)')

  // 2026-08-27 stakeholder restructure: TWO sub-tabs (Symptoms / Clinical Assessment),
  // each ONE condition-wise table. Top chips, overview cards, animal/record toggle,
  // status column and level dropdowns all retired.
  const [domain, setDomain] = useState<Domain>('symptom')
  const [q, setQ] = useState('')
  // bottom sheet (row tap): month graph + conditional Active/Resolved animal tabs
  const [typeSheet, setTypeSheet] = useState<{ domain: Domain; name: string } | null>(null)
  /* THE standard period control (user call 2026-09-06): pill 1Y | 2Y | 3Y | Custom +
     capped year From/To — the CoL/SickTrendCard grammar; 'All' retired (demo review 2026-09-04). */
  const [sheetRange, setSheetRange] = useState<'last_1y' | 'last_2y' | 'last_3y' | 'custom'>('last_1y')
  const [sheetYearFrom, setSheetYearFrom] = useState<number | null>(null)
  const [sheetYearTo, setSheetYearTo] = useState<number | null>(null)
  const [sheetTab, setSheetTab] = useState<'active' | 'resolved'>('active')
  const [sheetMonth, setSheetMonth] = useState<{ y: number; m: number; label: string } | null>(null)
  // animal-card-list sheet → the standard search + site facet (user call 2026-09-06)
  const [sheetQ, setSheetQ] = useState('')
  const [sheetSite, setSheetSite] = useState<string | null>(null)
  const [animalDrill, setAnimalDrill] = useState<AniGroup | null>(null)

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

  // Recurring Animals per type — animals with 2+ bouts of that symptom/assessment in the
  // window (the ×N animals the sheet already marks; the column ranks where it concentrates).
  const recurringOf = useMemo(() => {
    const perType = new Map<string, Map<string, number>>()
    for (const r of windowed) {
      const k = `${r.domain}|${r.type}`
      const m = perType.get(k) ?? new Map<string, number>()
      m.set(r.aid, (m.get(r.aid) ?? 0) + 1)
      perType.set(k, m)
    }
    const out = new Map<string, number>()
    for (const [k, m] of perType) out.set(k, [...m.values()].filter(n => n >= 2).length)

    return out
  }, [windowed])

  // ── condition-wise rows: ONE row per symptom/assessment (the 2026-08-27 pivot) ──
  const types = domain === 'symptom' ? symTypes : condTypes
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()

    return query ? types.filter(t => t.name.toLowerCase().includes(query)) : types
  }, [types, q])
  const rows = useMemo(
    () =>
      shown.map(t => ({
        id: t.name,
        name: t.name,
        animals: t.animals,
        count: t.count,
        recurring: recurringOf.get(`${domain}|${t.name}`) ?? 0
      })),
    [shown, domain, recurringOf]
  )
  const table = useSortableTable(rows, { field: 'animals', sort: 'desc' })

  // Row click (either view) → that animal's FULL clinical timeline, rebuilt from the
  // un-chip-filtered window. Filters find the animal; the drawer shows the whole story —
  // the filtered record appears in place among the animal's other symptoms/assessments.
  const openAnimal = (aid: string) => {
    const g = groupByAnimal(windowed.filter(r => r.aid === aid), 'date', 'active')[0]
    if (g) setAnimalDrill(g)
  }

  // Row tap → the bottom sheet, fresh at 1Y with no month scope and a clean filter bar.
  const openType = (name: string) => {
    setSheetRange('last_1y')
    setSheetYearFrom(null)
    setSheetYearTo(null)
    setSheetMonth(null)
    setSheetTab('active')
    setSheetQ('')
    setSheetSite(null)
    setTypeSheet({ domain, name })
  }

  // Years the open type's records cover — for the Custom From/To pickers (cap 5).
  const sheetYears = useMemo(() => {
    const today = new Date()
    let first = today.getFullYear()
    if (typeSheet) {
      for (const r of (typeSheet.domain === 'symptom' ? symptoms : diagnosis)?.records ?? []) {
        if (r.type !== typeSheet.name) continue
        const y = Number(r.date.slice(0, 4))
        if (Number.isFinite(y) && y >= 1900 && y < first) first = y
      }
    }

    return Array.from({ length: today.getFullYear() - first + 1 }, (_, i) => today.getFullYear() - i)
  }, [typeSheet, symptoms, diagnosis])

  // Per-type graph sheet: distinct animals affected per month. The sheet has its own
  // standard period control (pill 1Y|2Y|3Y|Custom), so it reads the RAW program records,
  // not the page window. Custom = whole years [from..to], anchored at the range's end
  // (today when it ends this year) — the CoL/SickTrendCard semantics.
  const sheetSeries = useMemo(() => {
    if (!typeSheet) return null
    const today = new Date()
    const src = (typeSheet.domain === 'symptom' ? symptoms : diagnosis)?.records ?? []
    const recs = src.filter(r => r.type === typeSheet.name)
    const to = sheetYearTo ?? today.getFullYear()
    const from = sheetYearFrom ?? to
    const now = sheetRange === 'custom' && to < today.getFullYear() ? new Date(to, 11, 31) : today
    const n =
      sheetRange === 'custom' ? Math.max(1, (to - from) * 12 + now.getMonth() + 1) : sheetRange === 'last_2y' ? 24 : sheetRange === 'last_3y' ? 36 : 12
    const winStart = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1)
    const winEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const inRange = recs.filter(r => {
      const d = new Date(r.date)

      return d >= winStart && d < winEnd
    })
    // Kit YearLinesChart series (THE line standard, demo review 2026-09-04): distinct
    // animals per (year, month), newest year first, ≤5 lines.
    const perYM = new Map<number, Set<string>[]>()
    for (const r of inRange) {
      const d = new Date(r.date)
      const arr = perYM.get(d.getFullYear()) ?? Array.from({ length: 12 }, () => new Set<string>())
      arr[d.getMonth()].add(r.aid)
      perYM.set(d.getFullYear(), arr)
    }
    const yearSeries: YearSeries[] = [...perYM.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 5)
      .map(([year, sets]) => ({ year, values: sets.map(s => s.size) }))

    return {
      yearSeries,
      totalAnimals: new Set(inRange.map(r => r.aid)).size,
      totalEpisodes: inRange.length
    }
  }, [typeSheet, symptoms, diagnosis, sheetRange, sheetYearFrom, sheetYearTo])

  // Animal groups for the open type — same range window as the chart, further scoped by a
  // bar-picked month. Active = a bout still running (an animal with mixed bouts is Active —
  // currently sick is the operative fact); Resolved = every bout closed, stamped with the
  // latest resolved date (onset + duration; the data has no clock time).
  const sheetAnimals = useMemo(() => {
    if (!typeSheet) return null
    const now = new Date()
    const src = (typeSheet.domain === 'symptom' ? symptoms : diagnosis)?.records ?? []
    let recs = src.filter(r => r.type === typeSheet.name)
    // Same window as the chart (presets anchored at today; Custom = whole years [from..to]).
    const to = sheetYearTo ?? now.getFullYear()
    const from = sheetYearFrom ?? to
    const anchor = sheetRange === 'custom' && to < now.getFullYear() ? new Date(to, 11, 31) : now
    const n =
      sheetRange === 'custom'
        ? Math.max(1, (to - from) * 12 + anchor.getMonth() + 1)
        : sheetRange === 'last_2y'
        ? 24
        : sheetRange === 'last_3y'
        ? 36
        : 12
    const winStart = new Date(anchor.getFullYear(), anchor.getMonth() - (n - 1), 1)
    const winEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
    recs = recs.filter(r => {
      const d = new Date(r.date)

      return d >= winStart && d < winEnd
    })
    if (sheetMonth) {
      recs = recs.filter(r => {
        const d = new Date(r.date)

        return d.getFullYear() === sheetMonth.y && d.getMonth() === sheetMonth.m
      })
    }
    const byAid = new Map<string, { name: string; site: string; enclosure: string; recs: ClinicalRecord[] }>()
    for (const r of recs) {
      const g = byAid.get(r.aid) ?? { name: r.name, site: r.site, enclosure: r.enclosure, recs: [] }
      g.recs.push(r)
      byAid.set(r.aid, g)
    }
    const active: SheetAnimalRow[] = []
    const resolved: SheetAnimalRow[] = []
    for (const [aid, g] of byAid) {
      const chronic = g.recs.some(r => !!r.chronic)
      const act = [...g.recs.filter(r => r.status === 'active')].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      if (act) {
        active.push({ aid, name: g.name, site: g.site, enclosure: g.enclosure, times: g.recs.length, days: act.durationDays, date: act.date, chronic })
      } else {
        const end = g.recs.map(r => addDays(r.date, r.durationDays)).sort().pop()!
        resolved.push({ aid, name: g.name, site: g.site, enclosure: g.enclosure, times: g.recs.length, resolvedOn: end, date: end, chronic })
      }
    }
    active.sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1))
    resolved.sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1))

    return { active, resolved }
  }, [typeSheet, symptoms, diagnosis, sheetRange, sheetYearFrom, sheetYearTo, sheetMonth])

  /* ── the ONE table's columns (Housing anatomy + CoL grammar): No serial · type name ·
     right-aligned counts · quiet severity/prognosis type. No status column (2026-08-27). ── */
  const nameHeader = domain === 'symptom' ? 'Symptom' : 'Clinical Assessment'
  const columns: GridColDef[] = [
    { minWidth: 240, flex: 1, field: 'name', headerName: nameHeader, renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    {
      width: 130,
      align: 'right',
      headerAlign: 'right',
      field: 'animals',
      headerName: 'Animals',
      renderCell: (p: GridRenderCellParams) => txt(Number(p.row.animals || 0).toLocaleString(), undefined, 700)
    },
    {
      width: 130,
      align: 'right',
      headerAlign: 'right',
      field: 'count',
      headerName: 'Records',
      renderCell: (p: GridRenderCellParams) => txt(Number(p.row.count || 0).toLocaleString(), c.neutralSecondary, 600)
    },
    {
      // narrow by user call — the header wraps to two right-aligned lines (kit handles it)
      width: 140,
      align: 'right',
      headerAlign: 'right',
      field: 'recurring',
      headerName: 'Recurring Animals',
      renderCell: (p: GridRenderCellParams) => {
        const n = Number(p.row.recurring || 0)
        if (!n) return txt('—', skin.DASH_INK)

        return txt(n.toLocaleString(), skin.CORAL, 700)
      }
    }
  ]

  /* ── card header: the two underline sub-tabs (Necropsy pattern) + the standard search pill ── */
  const domainTabs = (
    <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <UnderlineTabs
        tabs={[
          { key: 'symptom', label: `Symptoms (${symTypes.length.toLocaleString()})` },
          { key: 'assessment', label: `Clinical Assessment (${condTypes.length.toLocaleString()})` }
        ]}
        value={domain}
        onChange={k => setDomain(k as Domain)}
      />
    </Box>
  )

  const search = (
    <SearchPill
      value={q}
      onChange={setQ}
      placeholder={domain === 'symptom' ? 'Search symptoms…' : 'Search assessments…'}
      sx={portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 260 }}
    />
  )

  const stackedHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
      {domainTabs}
      {search}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* headline row — title left, period control right (the Medical Overview pattern;
          moved off the tab bar on user call 2026-09-02) */}
      <Box sx={{ pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
          Clinical
        </Typography>
        <DashboardDateRange value={range} onChange={onRange} />
      </Box>

      {/* the ONE table per sub-tab (2026-08-27 restructure) */}
      <SectionCard title={portrait ? stackedHeader : domainTabs} action={portrait ? undefined : search} titleMb={2}>
        {table.total ? (
          <DetailTable
            columns={columns}
            rows={table.rows}
            total={table.total}
            paginationModel={table.paginationModel}
            setPaginationModel={table.setPaginationModel}
            sortModel={table.sortModel}
            handleSortModel={table.handleSortModel}
            onRowClick={(p: { row: { name: string } }) => openType(p.row.name)}
          />
        ) : (
          <EmptyState
            message={
              q.trim()
                ? 'Nothing matches your search'
                : domain === 'symptom'
                  ? 'No symptoms recorded for this species'
                  : 'No clinical assessments recorded for this species'
            }
          />
        )}
      </SectionCard>

      <AnimalRecordsDrawer group={animalDrill} onClose={() => setAnimalDrill(null)} />

      {/* row tap → bottom sheet: month-wise graph on top, conditional Active/Resolved animal list below */}
      <SheetDrawer open={!!typeSheet} onClose={() => setTypeSheet(null)} PaperProps={{ sx: sheetPaperSx('xxl') }}>
        {typeSheet &&
          sheetSeries &&
          sheetAnimals &&
          (() => {
            // Search + site facet (user call 2026-09-06): filter the VISIBLE lists; the
            // tab structure (mix vs quiet ledger line) follows the UNfiltered statuses so
            // typing a query never collapses the tabs.
            const query = sheetQ.trim().toLowerCase()
            const matchQ = (a: SheetAnimalRow) =>
              !query ||
              a.name.toLowerCase().includes(query) ||
              a.aid.toLowerCase().includes(query) ||
              a.site.toLowerCase().includes(query) ||
              a.enclosure.toLowerCase().includes(query)
            const act0 = sheetAnimals.active
            const res0 = sheetAnimals.resolved
            // Tabs render ONLY when the statuses mix (Necropsy rule); otherwise a quiet ledger line.
            const shownTab: 'active' | 'resolved' = act0.length && res0.length ? sheetTab : act0.length ? 'active' : 'resolved'
            // Site facet options = sites in the ACTIVE tab's (search-filtered) rows, "Site (N)".
            const tabRows = (shownTab === 'active' ? act0 : res0).filter(matchQ)
            const siteCounts = new Map<string, number>()
            for (const a of tabRows) siteCounts.set(a.site, (siteCounts.get(a.site) ?? 0) + 1)
            if (sheetSite && !siteCounts.has(sheetSite)) siteCounts.set(sheetSite, 0)
            const siteOpts = [...siteCounts.entries()]
              .sort((x, y) => x[0].localeCompare(y[0]))
              .map(([s, n]) => ({ site: s, label: `${s} (${n.toLocaleString()})` }))
            const bySite = (rs: SheetAnimalRow[]) => (sheetSite ? rs.filter(a => a.site === sheetSite) : rs)
            const act = bySite(act0.filter(matchQ))
            const res = bySite(res0.filter(matchQ))
            const list = shownTab === 'active' ? act : res
            const filtered = !!query || !!sheetSite
            // Card location rule (HARD, 2026-09-06): site line only while the VISIBLE list
            // spans >1 site; a single site → the enclosure line instead (kit suppresses it).
            const multiSite = !sheetSite && new Set(list.map(x => x.site)).size > 1

            return (
              <Sheet>
                <SheetHeader
                  title={typeSheet.name}
                  subtitle={`${sheetSeries.totalAnimals.toLocaleString()} animals • ${sheetSeries.totalEpisodes.toLocaleString()} records`}
                  onClose={() => setTypeSheet(null)}
                />
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {/* pb keeps clear air between the month axis and the status tabs */}
                  <Box sx={{ px: SHEET_PX, pt: 4, pb: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600, color: skin.INK }}>
                        Animals Affected by Month
                      </Typography>
                      {/* THE standard period control (user call 2026-09-06): pill 1Y|2Y|3Y|Custom +
                          capped year From/To — TrendRangeTabs' 'All' retired. */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', flexShrink: 0, '& > *': { flexShrink: 0 } }}>
                        <ViewToggle
                          height={CTRL_H}
                          items={[
                            { key: 'last_1y', label: '1Y' },
                            { key: 'last_2y', label: '2Y' },
                            { key: 'last_3y', label: '3Y' },
                            { key: 'custom', label: 'Custom' }
                          ]}
                          value={sheetRange}
                          onChange={k => {
                            setSheetMonth(null)
                            if (k === 'custom') {
                              setSheetRange('custom')
                              if (sheetYearFrom == null && sheetYearTo == null) {
                                const today = new Date()
                                setSheetYearFrom(Math.max(sheetYears[sheetYears.length - 1] ?? today.getFullYear(), today.getFullYear() - 4))
                                setSheetYearTo(today.getFullYear())
                              }
                            } else {
                              setSheetRange(k as 'last_1y' | 'last_2y' | 'last_3y')
                            }
                          }}
                        />
                        {sheetRange === 'custom' && (
                          <>
                            <RangeSelect
                              value={sheetYearFrom}
                              onPick={y => {
                                setSheetYearFrom(y)
                                setSheetMonth(null)
                              }}
                              items={yearItemsFor(sheetYears, sheetYearTo, 5, 'from')}
                              anyLabel='From'
                            />
                            <Typography sx={{ color: skin.FAINT }}>–</Typography>
                            <RangeSelect
                              value={sheetYearTo}
                              onPick={y => {
                                setSheetYearTo(y)
                                setSheetMonth(null)
                              }}
                              items={yearItemsFor(sheetYears, sheetYearFrom, 5, 'to')}
                              anyLabel='To'
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                    {/* Kit YearLinesChart (THE line standard) — one line per calendar year,
                        Jan–Dec axis; a dot tap scopes the animal list to that month. */}
                    <YearLinesChart
                      series={sheetSeries.yearSeries}
                      accent={skin.CORAL}
                      noun='animals'
                      height={220}
                      onPoint={(y, m) =>
                        setSheetMonth(prev => (prev && prev.y === y && prev.m === m ? null : { y, m, label: `${MONTHS[m]} ${y}` }))
                      }
                    />
                  </Box>
                  {act0.length && res0.length ? (
                    <SheetTabs
                      tabs={[
                        { key: 'active' as const, label: `Active (${act.length.toLocaleString()})` },
                        { key: 'resolved' as const, label: `Resolved (${res.length.toLocaleString()})` }
                      ]}
                      value={shownTab}
                      onPick={setSheetTab}
                    />
                  ) : (
                    <Box sx={{ px: SHEET_PX, pt: 3, pb: 2, borderBottom: `1px solid ${c.SurfaceVariant}` }}>
                      <Typography variant='body2' sx={{ color: skin.MUTED }}>
                        {shownTab === 'active'
                          ? `${act.length.toLocaleString()} active`
                          : `${filtered ? '' : 'All '}${res.length.toLocaleString()} resolved`}
                      </Typography>
                    </Box>
                  )}
                  <SheetFilterBar
                    search={sheetQ}
                    onSearch={setSheetQ}
                    searchPlaceholder='Search animals…'
                    facetOptions={siteOpts.map(o => o.label)}
                    facetValue={sheetSite ? siteOpts.find(o => o.site === sheetSite)?.label ?? null : null}
                    onFacet={v => setSheetSite(v ? siteOpts.find(o => o.label === v)?.site ?? null : null)}
                    facetPlaceholder='All Sites'
                    facetIcon='mdi:map-marker-outline'
                  />
                  {sheetMonth && (
                    <Box sx={{ px: SHEET_PX, pt: 3 }}>
                      <FilterChip label={sheetMonth.label} onClear={() => setSheetMonth(null)} />
                    </Box>
                  )}
                  <Box sx={{ px: SHEET_PX, pb: 3 }}>
                    {list.length ? (
                      list.map((a, i) => (
                        <AnimalCardRow
                          key={a.aid}
                          aid={a.aid}
                          enclosure={a.enclosure}
                          site={multiSite ? a.site : undefined}
                          titleExtra={
                            <>
                              {a.times > 1 && (
                                <Typography component='span' sx={{ fontSize: '0.9375rem', color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
                                  ×{a.times}
                                </Typography>
                              )}
                              {a.chronic ? <ChronicTag /> : null}
                            </>
                          }
                          trailing={
                            // Tones per user call 2026-09-01: Active = green, Resolved = grey.
                            shownTab === 'active' ? (
                              <StatusChip label={`Active · ${a.days ?? 0} d`} tone='success' />
                            ) : (
                              // Resolved: the tag rides the TITLE line, the date sits on the
                              // CAPTION line (encl • site) — SheetRow's trailing column stacks
                              // them; the 24px line-height pins the date to the second row.
                              // The sidecar has no clock time — dd MMM yyyy only.
                              <>
                                {/* chip pinned inside a 24px band = the title line's height;
                                    the date then starts exactly where the caption row starts
                                    (kit gap 3px + 1px = the caption's 4px top margin). */}
                                <Box sx={{ height: 24, display: 'flex', alignItems: 'center' }}>
                                  <StatusChip label='Resolved' tone='neutral' />
                                </Box>
                                <Typography sx={{ fontSize: '14px', lineHeight: '24px', mt: '1px', color: skin.FAINT, whiteSpace: 'nowrap' }}>
                                  {fmtDate(a.resolvedOn)}
                                </Typography>
                              </>
                            )
                          }
                          chevron
                          last={i === list.length - 1}
                          onClick={() => openAnimal(a.aid)}
                        />
                      ))
                    ) : (
                      <SheetEmpty>No animals in this month</SheetEmpty>
                    )}
                  </Box>
                </Box>
              </Sheet>
            )
          })()}
      </SheetDrawer>
    </Box>
  )
}

/* ═══════════════════════════════════════════════ Tab bar + shell */

interface Props {
  preventive?: SpeciesPreventive | null
  clinical?: SpeciesClinical | null
  /** Resolves the species hero photo for the AnimalCard's photo variant (demo). */
  speciesId?: number | string
}

const MedicalTab: React.FC<Props> = ({ preventive, clinical, speciesId }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<TabKey>('overview')
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })
  // curative-medicine rollup, derived once from the clinical episodes (same source as Lab/Hospital)
  const rx = useMemo(() => buildPrescriptionProgram(clinical), [clinical])

  const renderPanel = () => {
    if (tab === 'overview')
      return <OverviewPanel preventive={preventive} clinical={clinical} rx={rx} range={range} onRange={setRange} onGoToTab={setTab} />

    if (tab === 'clinical') {
      const sym = clinical?.programs?.symptoms
      const diag = clinical?.programs?.diagnosis
      const has = (p?: ClinicalProgram) => !!p && (p.records.length > 0 || p.summary.animalsAffected > 0)
      if (!has(sym) && !has(diag)) return <EmptyState message='No clinical data for this species' />

      return <ClinicalMergedPanel symptoms={sym} diagnosis={diag} range={range} onRange={setRange} />
    }

    if (tab === 'prescription') {
      if (!rx || !rx.medicines.length) return <EmptyState message='No prescription data for this species' />

      return <PrescriptionPanel rx={rx} />
    }

    const prog = preventive?.programs?.[tab]
    if (!prog || !prog.summary.animalsTracked) return <EmptyState message='No preventive-care data for this species' />

    return <PreventivePanel key={tab} tab={tab} prog={prog} months={preventive?.months ?? []} speciesId={speciesId} />
  }

  return (
    // Hero photo provided ONCE for every AnimalCardRow / AnimalIdCard in this tab's tree
    <HeroPhotoContext.Provider value={HERO_PHOTOS[String(speciesId ?? '')]}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Sub-tabs are DOCKED into the shell's main tab bar (user call 2026-09-05) —
            HeaderSubTabs publishes them to the header slot; nothing renders here.
            The period control never rides this tab bar (user call 2026-09-02): Overview and
            Clinical both carry it on their own headline row; preventive/prescription screens
            carry their own preset range tabs (1Y·2Y·3Y·All — the presets-only rule). */}
        <HeaderSubTabs tabs={TABS} value={tab} onChange={k => setTab(k as TabKey)} />
        {renderPanel()}
      </Box>
    </HeroPhotoContext.Provider>
  )
}

export default MedicalTab
