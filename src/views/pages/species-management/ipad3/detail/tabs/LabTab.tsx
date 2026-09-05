'use client'

/*
 * Lab Module tab — species-scoped LIMS rollup for management users, derived from the clinical
 * sidecar (see ./lab/lab.ts). Post-feedback layout (lab_8_1_3 mock, stakeholder 2026-07-30;
 * Tests by Lab retired 2026-09-02): pulse (request stats + trend) → Recurring Tests card
 * (Frequently Repeated | Long-term Monitoring underline sub-tabs) → All Tests, all on the
 * standard pagination (footer only past 10 rows) → drill sheets ending in per-animal result
 * trends. Tests are THE primary cut. Every drill is the 2026-09-02 sheet anatomy (animal
 * cards → trend / request detail) — SignalDrawer + AnimalHealthRecord retired from this tab.
 */
import React, { useMemo, useState } from 'react'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical } from 'src/lib/api/species-management/detail'
import type { GridColDef } from '@mui/x-data-grid'
import {
  AnimalCardRow,
  AnimalIdCard,
  CellText,
  FilterChip,
  HeroPhotoContext,
  synthAnimalIdentity,
  DetailTable,
  EmptyState,
  RowMetaText,
  SectionCard,
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetRow,
  SheetSection,
  SheetTabs,
  sheetPaperSx,
  SHEET_PX,
  StatusChip,
  ViewToggle,
  TrendAreaChart,
  TrendRangeTabs
, SheetDrawer} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
import {
  buildLabRequests,
  computeLab,
  MONITORED_CONDITION,
  monitoredAnimals,
  monthlyLabRequests,
  TEST_MEASURES,
  type LabRequest,
  type LabTestResult,
  type MonitoredAnimal,
  type RepeatSameTest
} from './lab/lab'
import ResultTrendChart from './lab/ResultTrendChart'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

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

const STATUS_LABEL: Record<LabRequest['status'], string> = {
  completed: 'Completed',
  pending: 'Pending'
}
type PillTone = 'success' | 'warning' | 'error' | 'neutral'
const STATUS_TONE: Record<LabRequest['status'], PillTone> = {
  completed: 'success',
  pending: 'neutral'
}
const RESULT_LABEL: Record<LabTestResult, string> = {
  normal: 'Normal',
  high: 'High',
  low: 'Low',
  positive: 'Positive',
  detected: 'Detected'
}
const RESULT_TONE: Record<LabTestResult, 'success' | 'warning' | 'error'> = {
  normal: 'success',
  high: 'warning',
  low: 'warning',
  positive: 'error',
  detected: 'error'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDMY = (iso: string): string => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso

  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* Standard in-card search pill (grey FIELD_BG — the contextual rule for searches inside white
 * cards). Rendered only when a table holds enough rows to need one (>10, the pagination bar). */
const SearchPill: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({
  value,
  onChange,
  placeholder
}) => (
  <TextField
    size='small'
    placeholder={placeholder}
    value={value}
    onChange={e => onChange(e.target.value)}
    sx={{
      width: 260,
      flexShrink: 0,
      '& .MuiInputBase-root': { height: 44, bgcolor: skin.FIELD_BG, borderRadius: '999px', fontSize: '15px' },
      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
      '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
    }}
    InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
  />
)

/** "Since Feb 2025" — monitored-from meta line. */
const fmtMY = (iso: string): string => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso

  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const pageSlice = <T,>(rows: T[], pm: { page: number; pageSize: number }): T[] =>
  rows.slice(pm.page * pm.pageSize, (pm.page + 1) * pm.pageSize)

/* ── scope page — stat cells + trend months open THIS, not a sheet (user call 2026-09-02:
 * list-level drills are pages with a back button, the Vaccination pattern; sheets are for
 * leaves only). Animal Wise | Request Wise underline tabs; Request Wise splits Single / Pool
 * (a pool = ONE request covering several animals, its result counted for every member).
 * Animal row → that animal's requests in a bottom sheet (no further click); request rows are
 * NOT wired — the real app's lab-request detail page owns that navigation. */
/* ── shared table identity cells (scope page + test sheet) ─────────────────── */
const AnimalIdCell: React.FC<{ aid: string; name?: string; site?: string; enclosure?: string; showSite?: boolean }> = ({
  aid,
  name,
  site,
  enclosure,
  showSite
}) => {
  const heroPhoto = React.useContext(HeroPhotoContext)
  const s = synthAnimalIdentity(aid)

  return (
    <AnimalIdCard
      identifiers={s.identifiers}
      enclosure={enclosure || s.enclosure}
      site={showSite ? site : undefined}
      tag={s.tag}
      name={name && name !== aid ? name : undefined}
      photo={s.hasPhoto ? heroPhoto?.src : undefined}
      photoPos={heroPhoto?.bgPos}
    />
  )
}

/* the REQUEST identity cell (user design 2026-09-02): lab icon chip left; request id on
 * top, lab name second, created-by · date third. */
const RequestIdCell: React.FC<{ r: LabRequest }> = ({ r }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
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
        <Icon icon='mdi:flask-outline' fontSize={20} color={c.OnPrimaryContainer} />
      </Box>
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: skin.CARD_ID_INK }} noWrap>
          {r.id}
        </Typography>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: c.OnSurfaceVariant }} noWrap>
          {r.lab}
        </Typography>
        <Typography sx={{ fontSize: '0.9375rem', color: c.neutralSecondary }} noWrap>
          {r.doctor} · {fmtDMY(r.date)}
        </Typography>
      </Box>
    </Box>
  )
}

type StatusFilter = 'all' | LabRequest['status']

const ScopePage: React.FC<{
  title: string
  /** The FULL request universe — the scope the user arrived with is just the initial filter. */
  requests: LabRequest[]
  initialStatus: StatusFilter
  initialRange: RangeSelection
  /** Extra pre-applied facets (e.g. a tapped test → { test: ['Glucose'] }). */
  initialExtra?: Record<string, string[]>
  /** When exactly ONE numeric test is filtered, an animal row opens its result trend here. */
  onTrend?: (aid: string, test: string) => void
  onBack: () => void
}> = ({ title, requests: universe, initialStatus, initialRange, initialExtra, onTrend, onBack }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const heroPhoto = React.useContext(HeroPhotoContext)
  const [tab, setTab] = useState<'animals' | 'requests'>('animals')
  const [reqKind, setReqKind] = useState<'single' | 'pool'>('single')
  const [q, setQ] = useState('')
  const [animPm, setAnimPm] = useState({ page: 0, pageSize: 10 })
  const [reqPm, setReqPm] = useState({ page: 0, pageSize: 10 })
  const [animalSheet, setAnimalSheet] = useState<{ aid: string; name?: string; items: LabRequest[] } | null>(null)

  /* filters — ALL facets live inside the ONE Filters sheet beside the search (user call
   * 2026-09-02: no upfront dropdowns). The arrival scope pre-fills status/period; the period
   * shows as a clearable chip. */
  const [range, setRange] = useState<RangeSelection>(initialRange)
  const [extra, setExtra] = useState<Record<string, string[]>>(() => ({
    ...(initialStatus === 'all' ? {} : { status: [STATUS_LABEL[initialStatus]] }),
    ...(initialExtra ?? {})
  }))
  const [sheetOpen, setSheetOpen] = useState(false)
  const resetPages = () => {
    setAnimPm(p => ({ ...p, page: 0 }))
    setReqPm(p => ({ ...p, page: 0 }))
  }

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  /* status + period first (the scope), then site, then the sheet facets */
  const { from: rFrom, to: rTo } = resolveRange(range, new Date())
  const inRange = (s: string) => {
    const t = new Date(s).getTime()
    if (isNaN(t)) return true

    return (!rFrom || t >= rFrom.getTime()) && t <= rTo.getTime()
  }
  const scoped = universe.filter(r => inRange(r.date))
  const statusSel = extra.status || []
  const siteSel = extra.site || []
  const testSel = extra.test || []
  const labSel = extra.lab || []
  const items = scoped.filter(
    r =>
      (!statusSel.length || statusSel.includes(STATUS_LABEL[r.status])) &&
      (!siteSel.length || siteSel.includes(r.site)) &&
      (!testSel.length || r.tests.some(t => testSel.includes(t.name))) &&
      (!labSel.length || labSel.includes(r.lab))
  )

  /* the ONE filter sheet's facets — all counted from the period-scoped universe */
  const facets = (() => {
    const count = (vals: string[]) => {
      const m = new Map<string, number>()
      vals.forEach(v => m.set(v, (m.get(v) ?? 0) + 1))

      return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, n]) => ({ value, label: value, count: n }))
    }

    return [
      { key: 'status', label: 'Status', options: count(scoped.map(r => STATUS_LABEL[r.status])) },
      { key: 'site', label: 'Site', options: count(scoped.map(r => r.site)) },
      { key: 'test', label: 'Test', options: count(scoped.flatMap(r => r.tests.map(t => t.name))) },
      { key: 'lab', label: 'Lab', options: count(scoped.map(r => r.lab)) }
    ]
  })()
  const filterCount = statusSel.length + siteSel.length + testSel.length + labSel.length
  const clearOf = (key: string, v: string) => () => setExtra(e => ({ ...e, [key]: (e[key] || []).filter(x => x !== v) }))
  const periodLabel =
    range.preset === 'all'
      ? null
      : range.preset === 'custom' && range.start
      ? `Period: ${MONTHS[new Date(range.start).getMonth()]} ${new Date(range.start).getFullYear()}`
      : `Period: ${String(range.preset).replace('last_', 'Last ').replace('y', ' year(s)')}`
  const chips = [
    ...(periodLabel ? [{ key: 'period', label: periodLabel, onClear: () => setRange({ preset: 'all', start: null, end: null }) }] : []),
    ...statusSel.map(v => ({ key: `status-${v}`, label: `Status: ${v}`, onClear: clearOf('status', v) })),
    ...siteSel.map(v => ({ key: `site-${v}`, label: `Site: ${v}`, onClear: clearOf('site', v) })),
    ...testSel.map(v => ({ key: `test-${v}`, label: `Test: ${v}`, onClear: clearOf('test', v) })),
    ...labSel.map(v => ({ key: `lab-${v}`, label: `Lab: ${v}`, onClear: clearOf('lab', v) }))
  ]

  const multiSite = new Set(universe.map(r => r.site)).size > 1
  const needle = q.trim().toLowerCase()

  /* animal-wise rollup — POOL requests count for EVERY member animal (the shared result
   * applies to each of them). */
  const animalsAll = (() => {
    const membersOf = (r: LabRequest) => r.pool ?? [{ aid: r.aid, name: r.name, site: r.site, enclosure: r.enclosure }]
    const m = new Map<string, LabRequest[]>()
    const meta = new Map<string, { name: string; site: string; enclosure: string }>()
    for (const r of items)
      for (const a of membersOf(r)) {
        const list = m.get(a.aid)
        if (list) list.push(r)
        else m.set(a.aid, [r])
        if (!meta.has(a.aid)) meta.set(a.aid, a)
      }

    return [...m.entries()]
      .map(([aid, rs]) => {
        const sorted = [...rs].sort((a, b) => (a.date < b.date ? 1 : -1))
        const a = meta.get(aid)!

        return {
          id: aid,
          aid,
          name: a.name,
          site: a.site,
          enclosure: a.enclosure,
          requests: rs.length,
          tests: rs.reduce((s2, r) => s2 + r.tests.length, 0),
          last: sorted[0].date,
          items: sorted
        }
      })
      .sort((a, b) => b.requests - a.requests)
  })()
  const animals = needle
    ? animalsAll.filter(a => a.aid.toLowerCase().includes(needle) || (a.name || '').toLowerCase().includes(needle))
    : animalsAll

  const requestsAll = [...items].sort((a, b) => (a.date < b.date ? 1 : -1))
  const singles = requestsAll.filter(r => !r.pool)
  const pools = requestsAll.filter(r => r.pool)
  const kindAll = reqKind === 'single' ? singles : pools
  const requests = needle
    ? kindAll.filter(
        r =>
          r.id.toLowerCase().includes(needle) ||
          r.aid.toLowerCase().includes(needle) ||
          (r.name || '').toLowerCase().includes(needle) ||
          r.lab.toLowerCase().includes(needle) ||
          r.doctor.toLowerCase().includes(needle)
      )
    : kindAll

  const animalCols: GridColDef[] = [
    { field: 'aid', headerName: 'Animal', flex: 1, minWidth: 380, sortable: false, renderCell: p => <AnimalIdCell {...p.row} showSite={multiSite} /> },
    { field: 'requests', headerName: 'Requests', width: 140, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.requests, undefined, 700) },
    { field: 'tests', headerName: 'Tests', width: 110, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.tests) },
    { field: 'last', headerName: 'Last Request', width: 180, sortable: false, renderCell: p => txt(fmtDMY(p.row.last)) }
  ]

  const reqCardCol: GridColDef = { field: 'id', headerName: 'Request', flex: 1, minWidth: 340, sortable: false, renderCell: p => <RequestIdCell r={p.row} /> }
  const testsCol: GridColDef = { field: 'tests', headerName: 'Tests', width: 100, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.tests.length) }
  const statusCol: GridColDef = {
    field: 'status',
    headerName: 'Status',
    width: 170,
    sortable: false,
    renderCell: p => <StatusChip label={STATUS_LABEL[p.row.status as LabRequest['status']]} tone={STATUS_TONE[p.row.status as LabRequest['status']]} />
  }
  /* Single = one animal per request → animal leads; Pool = one request, many animals →
   * request leads with the member count. */
  const singleCols: GridColDef[] = [
    { field: 'aid', headerName: 'Animal', flex: 1, minWidth: 380, sortable: false, renderCell: p => <AnimalIdCell {...p.row} showSite={multiSite} /> },
    reqCardCol,
    testsCol,
    statusCol
  ]
  const poolCols: GridColDef[] = [
    reqCardCol,
    { field: 'animals', headerName: 'Animals', width: 130, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.pool?.length ?? 1, undefined, 700) },
    testsCol,
    statusCol
  ]

  const filtersBtn = (
    <Box
      onClick={() => setSheetOpen(true)}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3.5,
        height: 44,
        flexShrink: 0,
        borderRadius: '999px',
        bgcolor: '#ffffff',
        border: `1px solid ${skin.DROPDOWN_BORDER}`,
        cursor: 'pointer',
        userSelect: 'none',
        ...skin.cardPressSx,
        '&:hover': { bgcolor: skin.ROW_HOVER }
      }}
    >
      <Icon icon='mage:filter' fontSize='1.25rem' color={skin.INK2} />
      <Typography sx={{ fontSize: '15px', fontWeight: 500, color: skin.INK2, whiteSpace: 'nowrap' }}>Filters</Typography>
      {filterCount > 0 && (
        <Box
          sx={{
            minWidth: 20,
            height: 20,
            px: 1,
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '12px',
            fontWeight: 700,
            bgcolor: skin.ACCENT_FILL,
            color: '#ffffff'
          }}
        >
          {filterCount}
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* header — back + scope title (the Vaccination inner-page grammar) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconButton onClick={onBack} sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${c.OutlineVariant}` }}>
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h5' sx={{ fontWeight: 600 }} noWrap>
            {title}
          </Typography>
          <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
            {requestsAll.length} requests • {animalsAll.length} animals
          </Typography>
        </Box>
      </Box>

      <SectionCard
        titleMb={3}
        title={
          <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'animals', label: 'Animal Wise', n: animalsAll.length },
                { key: 'requests', label: 'Request Wise', n: requestsAll.length }
              ] as { key: 'animals' | 'requests'; label: string; n: number }[]
            ).map(t => {
              const on = tab === t.key

              return (
                <Box
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  role='tab'
                  aria-selected={on}
                  sx={{ py: 1.5, mb: '-1px', borderBottom: '2.5px solid', borderColor: on ? skin.ACCENT_FILL : 'transparent', cursor: 'pointer' }}
                >
                  <Typography variant='body1' sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: on ? skin.ACCENT_INK : c.neutralSecondary }}>
                    {t.label} ({t.n.toLocaleString()})
                  </Typography>
                </Box>
              )
            })}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {filtersBtn}
            <SearchPill
              value={q}
              onChange={v => {
                setQ(v)
                setAnimPm(p => ({ ...p, page: 0 }))
                setReqPm(p => ({ ...p, page: 0 }))
              }}
              placeholder='Search animal or request…'
            />
          </Box>
        }
      >
        {chips.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {chips.map(ch => (
              <FilterChip key={ch.key} label={ch.label} onClear={ch.onClear} />
            ))}
          </Box>
        )}
        {tab === 'animals' ? (
          animals.length ? (
            <DetailTable
              columns={animalCols}
              rows={pageSlice(animals, animPm)}
              total={animals.length}
              paginationModel={animPm}
              setPaginationModel={setAnimPm}
              rowHeight={146}
              onRowClick={(p: any) => {
                const soloTest = testSel.length === 1 ? testSel[0] : null
                if (soloTest && TEST_MEASURES[soloTest] && onTrend) onTrend(p.row.aid, soloTest)
                else setAnimalSheet(p.row)
              }}
            />
          ) : (
            <EmptyState message='No animals match your search' />
          )
        ) : (
          <>
            {/* Single | Pool — a pool is ONE request for several animals, one shared
                result. The kit ViewToggle (2026-09-05), keeping this toggle's square corners. */}
            <ViewToggle
              radius='10px'
              sx={{ mb: 3 }}
              items={[
                { key: 'single', label: 'Single', count: singles.length },
                { key: 'pool', label: 'Pool', count: pools.length }
              ]}
              value={reqKind}
              onChange={k => {
                setReqKind(k as typeof reqKind)
                setReqPm({ page: 0, pageSize: 10 })
              }}
            />
            {requests.length ? (
              // Rows deliberately NOT wired — the real app's lab-request detail page owns this tap.
              <DetailTable
                columns={reqKind === 'single' ? singleCols : poolCols}
                rows={pageSlice(requests, reqPm)}
                total={requests.length}
                paginationModel={reqPm}
                setPaginationModel={setReqPm}
                rowHeight={146}
              />
            ) : (
              <EmptyState message={needle ? 'No requests match your search' : `No ${reqKind} requests in this scope`} />
            )}
          </>
        )}
      </SectionCard>

      {/* Animal row tap → that animal's requests, one bottom sheet, read-only (no click). */}
      <SheetDrawer open={!!animalSheet} onClose={() => setAnimalSheet(null)} PaperProps={{ sx: sheetPaperSx('lg') }}>
        {animalSheet && (
          <Sheet>
            <SheetHeader
              avatar
              title={animalSheet.name && animalSheet.name !== animalSheet.aid ? animalSheet.name : `AID: ${animalSheet.aid}`}
              stats={[{ label: 'Requests', value: animalSheet.items.length }]}
              onClose={() => setAnimalSheet(null)}
            />
            <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, mt: 1 }}>
              {animalSheet.items.map((r, i) => {
                return (
                  <SheetRow
                    key={r.id}
                    icon='mdi:flask-outline'
                    title={r.id}
                    caption={`${r.doctor} · ${r.lab}${r.pool ? ` · Pool of ${r.pool.length}` : ''}`}
                    when={fmtDMY(r.date)}
                    trailing={<StatusChip label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />}
                    last={i === animalSheet.items.length - 1}
                  />
                )
              })}
            </Box>
          </Sheet>
        )}
      </SheetDrawer>

      <SpeciesFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title='Filters'
        sections={facets}
        selected={extra}
        onApply={sel => {
          setExtra(sel)
          resetPages()
        }}
      />
    </Box>
  )
}

/* ── main tab ────────────────────────────────────────────────────────────── */
interface Props {
  clinical?: SpeciesClinical | null
}

const LabTab: React.FC<Props> = ({ clinical }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })
  const [trendRange, setTrendRange] = useState<RangePreset>('last_1y')
  // Request drills (pulse stats + trend months): scope PAGE (back button) with its own filter
  // bar — the arrival scope is just the pre-applied status/period (user call 2026-09-02).
  const [scope, setScope] = useState<{ status: StatusFilter; range: RangeSelection; extra?: Record<string, string[]> } | null>(null)
  const [trendEntry, setTrendEntry] = useState<RepeatSameTest | null>(null)
  const [monitorTest, setMonitorTest] = useState<string | null>(null)
  // Test drill sheet — bottom sheet with the PAGE-STYLE tables inside (user call 2026-09-02):
  // Animal Wise / Request Wise tabs, standard pagination; an animal row opens its trend.
  const [testSheet, setTestSheet] = useState<string | null>(null)
  const [testSheetTab, setTestSheetTab] = useState<'animals' | 'requests'>('animals')
  const [testAnimPm, setTestAnimPm] = useState({ page: 0, pageSize: 10 })
  const [testReqPm, setTestReqPm] = useState({ page: 0, pageSize: 10 })
  const openTestSheet = (test: string) => {
    setTestSheetTab('animals')
    setTestAnimPm({ page: 0, pageSize: 10 })
    setTestReqPm({ page: 0, pageSize: 10 })
    setTestSheet(test)
  }
  // Recurring Tests card — underline sub-tabs (Necropsy pattern) + standard pagination
  // (footer shows itself only past 10 rows — DetailTable's built-in rule).
  const [chronicTab, setChronicTab] = useState<'repeat' | 'monitor'>('repeat')
  const [testsPm, setTestsPm] = useState({ page: 0, pageSize: 10 })
  const [repeatPm, setRepeatPm] = useState({ page: 0, pageSize: 10 })
  const [monitorPm, setMonitorPm] = useState({ page: 0, pageSize: 10 })
  // Table searches (shown only past 10 rows) — typing resets the page.
  const [testsQ, setTestsQ] = useState('')
  const [chronicQ, setChronicQ] = useState('')
  const inWin = useWindow(range)

  const now = useMemo(() => new Date(), [])
  const rollup = useMemo(() => computeLab(clinical, inWin, now), [clinical, range, now])
  const allRequests = useMemo(() => buildLabRequests(clinical, now), [clinical, now])
  // Long-term monitoring pairs — UNWINDOWED on purpose (a lifelong signal must not drop off
  // the table because the page period is "Last 1 year"); test-wise rollup happens below.
  const monitoring = useMemo(() => monitoredAnimals(allRequests, now), [allRequests, now])
  const trend = useMemo(
    () =>
      monthlyLabRequests(
        allRequests,
        trendRange === 'all' ? null : trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12,
        now
      ),
    [allRequests, trendRange, now]
  )

  /* ── scope openers — stat cells + trend months open the inner PAGE; the tapped thing
   * becomes the page's pre-applied filter (status or a custom month range) ── */
  const openMonth = (i: number) => {
    if (!trend.perMonth[i]?.length) return
    const [mon, yr] = trend.labels[i].split(' ')
    const mi = MONTHS.indexOf(mon)
    const y = Number(yr)
    if (mi < 0 || !y) return
    setScope({ status: 'all', range: { preset: 'custom', start: new Date(y, mi, 1), end: new Date(y, mi + 1, 0) } })
  }

  const openStatus = (k: LabRequest['status']) => setScope({ status: k, range })

  if (!rollup) {
    return <EmptyState message='No lab data for this species' />
  }

  const reqTotal = rollup.requests.length

  /* THE primary cut — every test used on this species: unique animals + test count, busiest
   * first. items = requests carrying the test (deduped) for the drill sheet. */
  const allTests = (() => {
    const m = new Map<string, { animals: Set<string>; tests: number; items: LabRequest[] }>()
    for (const r of rollup.requests) {
      const seenInReq = new Set<string>()
      for (const t of r.tests) {
        let e = m.get(t.name)
        if (!e) {
          e = { animals: new Set(), tests: 0, items: [] }
          m.set(t.name, e)
        }
        e.tests++
        e.animals.add(r.aid)
        if (!seenInReq.has(t.name)) {
          e.items.push(r)
          seenInReq.add(t.name)
        }
      }
    }

    return [...m.entries()]
      .map(([test, e]) => ({ test, animals: e.animals.size, tests: e.tests, items: e.items }))
      .sort((a, b) => b.tests - a.tests)
  })()

  /* Frequently repeated tests — the rollup's repeatSameTest signal (same test ≥3 times on one
   * animal inside the rolling window) aggregated TEST-wise. Numeric analytes only: the drill
   * ends in a per-animal result TREND, and only measured tests can trend (user call 2026-09-02 —
   * trend-only scope; qualitative repeats deliberately out until asked for). */
  const repeatTests = (() => {
    const m = new Map<string, RepeatSameTest[]>()
    for (const e of rollup.repeatSameTest) {
      if (!TEST_MEASURES[e.test]) continue
      const list = m.get(e.test)
      if (list) list.push(e)
      else m.set(e.test, [e])
    }

    return [...m.entries()]
      .map(([test, entries]) => {
        let tests = 0
        let abnormal = 0
        let last = ''
        for (const e of entries) {
          tests += e.times
          for (const r of e.requests) {
            const t = r.tests.find(x => x.name === test)
            if (t?.result && t.result !== 'normal') abnormal++
            if (r.date > last) last = r.date
          }
        }
        const dept = entries[0]?.requests[0]?.tests.find(t => t.name === test)?.dept ?? ''

        return { test, dept, animals: entries.length, tests, abnormal, last, entries }
      })
      .sort((a, b) => b.animals - a.animals || b.tests - a.tests)
  })()
  /* ONE animal's full (unwindowed) history for one test — feeds the trend leaf from the
   * scope page. Pool requests count when the animal is a member (shared result). */
  const animalTestEntry = (aid: string, test: string): RepeatSameTest | null => {
    const items = allRequests.filter(
      r => (r.aid === aid || r.pool?.some(a2 => a2.aid === aid)) && r.tests.some(t => t.name === test)
    )
    if (!items.length) return null
    const sorted = [...items].sort((a2, b2) => (a2.date < b2.date ? -1 : 1))
    const dates = sorted.map(r => new Date(r.date).getTime())
    let lastResult: LabTestResult | undefined
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = sorted[i].tests.find(x => x.name === test)
      if (t?.result) {
        lastResult = t.result
        break
      }
    }
    const rec = sorted[sorted.length - 1]

    return {
      aid,
      name: rec.pool ? rec.pool.find(a2 => a2.aid === aid)?.name ?? rec.name : rec.name,
      site: rec.site,
      enclosure: rec.enclosure,
      test,
      times: sorted.length,
      spanDays: Math.max(1, Math.round((dates[dates.length - 1] - dates[0]) / 86400000)),
      lastResult,
      requests: sorted
    }
  }

  /* Long-term monitoring — chronic-case tests, TEST-wise (pairs derived above, unwindowed).
   * Condition = reference map (what the analyte classically monitors), never a per-animal
   * diagnosis (the Medical no-synth-chronic rule). */
  const monitorTests = (() => {
    const m = new Map<string, MonitoredAnimal[]>()
    for (const e of monitoring) {
      const list = m.get(e.test)
      if (list) list.push(e)
      else m.set(e.test, [e])
    }

    return [...m.entries()]
      .map(([test, entries]) => ({
        test,
        measure: TEST_MEASURES[test],
        condition: MONITORED_CONDITION[test] ?? '—',
        animals: entries.length,
        outOfRange: entries.filter(e => e.lastResult === 'high' || e.lastResult === 'low').length,
        tests: entries.reduce((s2, e) => s2 + e.times, 0),
        entries
      }))
      .sort((a, b) => b.animals - a.animals)
  })()
  const monitorSel = monitorTest ? monitorTests.find(t => t.test === monitorTest) ?? null : null

  /* Δ vs the previous window of equal length (hidden on "All time"). */
  const { from: winFrom, to: winTo } = resolveRange(range, new Date())
  let deltaPct: number | null = null
  if (winFrom) {
    const span = winTo.getTime() - winFrom.getTime()
    const prevCount = allRequests.filter(r => {
      const t = new Date(r.date).getTime()

      return !isNaN(t) && t >= winFrom.getTime() - span && t < winFrom.getTime()
    }).length
    if (prevCount > 0) deltaPct = Math.round(((reqTotal - prevCount) / prevCount) * 100)
  }

  /* ── summary band cells — requests, then TEST counts by status (lab_strip_4 layout) ── */
  const statCells: { key: string; count: number; label: string; pct?: number; onClick: () => void }[] = [
    {
      key: 'requests',
      count: reqTotal,
      label: 'Requests',
      onClick: () => setScope({ status: 'all', range })
    },
    { key: 'pending', count: rollup.totals.pending, label: 'Pending', onClick: () => openStatus('pending') }
  ]

  /* ── act header — optional `action` renders at the row's right edge (e.g. date range) ── */
  // Standard headline row (the Medical Overview grammar) — plain 20px/600 title, control
  // at the right edge; the uppercase act-header treatment retired with the iPad 3 reskin.
  const ActHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
      <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
        {title}
      </Typography>
      {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
    </Box>
  )

  /* ── tables — standard DetailTable columns; FULL row sets with the standard pagination
   * (DetailTable shows the footer only past 10 rows). View-all caps retired (user 2026-09-02). */
  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  const testAvg = allTests.length ? allTests.reduce((s2, t) => s2 + t.tests, 0) / allTests.length : 0
  const testCols: GridColDef[] = [
    { minWidth: 180, flex: 1, sortable: false, field: 'test', headerName: 'Test', renderCell: p => txt(p.row.test, c.OnSurfaceVariant, 600) },
    { width: 175, sortable: false, field: 'animals', headerName: 'Unique Animals', renderCell: p => txt(p.row.animals) },
    { width: 100, sortable: false, field: 'tests', headerName: 'Tests', renderCell: p => txt(p.row.tests, p.row.tests >= testAvg * 1.3 ? skin.CORAL : undefined, 700) }
  ]
  const testRowsAll = allTests.map((t, i) => ({ ...t, id: i }))
  const testsNeedle = testsQ.trim().toLowerCase()
  const testRows = testsNeedle ? testRowsAll.filter(t => t.test.toLowerCase().includes(testsNeedle)) : testRowsAll


  /* Frequently Repeated Tests — number columns right-aligned (stakeholder table rule),
   * department as the quiet sub-line under the test name, dash for zero abnormal. */
  const repeatCols: GridColDef[] = [
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'test',
      headerName: 'Test',
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <CellText color={c.OnSurfaceVariant} weight={600}>
            {p.row.test}
          </CellText>
          <Typography sx={{ fontSize: '0.9375rem', color: c.neutralSecondary }} noWrap>
            {p.row.dept}
          </Typography>
        </Box>
      )
    },
    { width: 130, sortable: false, field: 'animals', headerName: 'Animals', align: 'right', headerAlign: 'right', renderCell: p => txt(p.row.animals, undefined, 700) },
    { width: 110, sortable: false, field: 'tests', headerName: 'Tests', align: 'right', headerAlign: 'right', renderCell: p => txt(p.row.tests) },
    {
      width: 140,
      sortable: false,
      field: 'abnormal',
      headerName: 'Abnormal',
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(p.row.abnormal || '—', p.row.abnormal ? skin.CORAL : skin.DASH_INK, 700)
    },
    { width: 170, sortable: false, field: 'last', headerName: 'Last Tested', renderCell: p => txt(fmtDMY(p.row.last)) }
  ]
  const chronicNeedle = chronicQ.trim().toLowerCase()
  const repeatRowsAll = repeatTests.map((t, i) => ({ ...t, id: i }))
  const repeatRows = chronicNeedle
    ? repeatRowsAll.filter(r => r.test.toLowerCase().includes(chronicNeedle) || r.dept.toLowerCase().includes(chronicNeedle))
    : repeatRowsAll

  /* Long-term Monitoring — test-wise chronic table: analyte sub-line under the test, the
   * condition it classically monitors, then the control read (Out of Range = latest reading
   * abnormal). Numbers right-aligned, dash for zero, coral only on the health column. */
  const monitorCols: GridColDef[] = [
    {
      minWidth: 170,
      flex: 1,
      sortable: false,
      field: 'test',
      headerName: 'Test',
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <CellText color={c.OnSurfaceVariant} weight={600}>
            {p.row.test}
          </CellText>
          <Typography sx={{ fontSize: '0.9375rem', color: c.neutralSecondary }} noWrap>
            {p.row.measure ? `${p.row.measure.measure} · ${p.row.measure.unit}` : ''}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 220,
      flex: 1.2,
      sortable: false,
      field: 'condition',
      headerName: 'Condition Monitored',
      renderCell: p => txt(p.row.condition)
    },
    { width: 130, sortable: false, field: 'animals', headerName: 'Animals', align: 'right', headerAlign: 'right', renderCell: p => txt(p.row.animals, undefined, 700) },
    {
      width: 155,
      sortable: false,
      field: 'outOfRange',
      headerName: 'Out of Range',
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(p.row.outOfRange || '—', p.row.outOfRange ? skin.CORAL : skin.DASH_INK, 700)
    },
    { width: 110, sortable: false, field: 'tests', headerName: 'Tests', align: 'right', headerAlign: 'right', renderCell: p => txt(p.row.tests) }
  ]
  const monitorRowsAll = monitorTests.map((t, i) => ({ ...t, id: i }))
  const monitorRows = chronicNeedle
    ? monitorRowsAll.filter(
        r =>
          r.test.toLowerCase().includes(chronicNeedle) ||
          r.condition.toLowerCase().includes(chronicNeedle) ||
          (r.measure?.measure ?? '').toLowerCase().includes(chronicNeedle)
      )
    : monitorRowsAll


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {scope && (
        <ScopePage
          key={`${scope.status}|${scope.range.preset}|${scope.range.start ?? ''}|${JSON.stringify(scope.extra ?? {})}`}
          title='Lab Requests'
          requests={allRequests}
          initialStatus={scope.status}
          initialRange={scope.range}
          initialExtra={scope.extra}
          onTrend={(aid, test) => {
            const e = animalTestEntry(aid, test)
            if (e) setTrendEntry(e)
          }}
          onBack={() => setScope(null)}
        />
      )}

      {!scope && (
        <>
      {/* ACT 1 • THE PULSE — act header carries the date range; the card stacks stats → chart
          title + range tabs → chart (no separate strip; the page already opens with the dark
          hero band, so the summary stays light and merged) */}
      <ActHeader title='Lab Request Volume' action={<DashboardDateRange value={range} onChange={setRange} />} />
      <SectionCard>
        {/* summary stats — requests, then tests by status; numbers in the deep hero teal */}
        <Box
          sx={{
            display: 'grid',
            // Always one row — the summary is a single band, never a wrap.
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4,
            pb: 5,
            mb: 5,
            borderBottom: `1px solid ${skin.HAIR}`
          }}
        >
          {statCells.map((s, i) => (
            <Box
              key={s.key}
              onClick={s.onClick}
              sx={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                cursor: 'pointer',
                borderLeft: i === 0 ? 'none' : `1px solid ${skin.HAIR}`,
                pl: i === 0 ? 0 : 5,
                '&:hover .lab-stat-lbl': { color: skin.INK }
              }}
            >
              <Typography
                className='lab-stat-lbl'
                sx={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: skin.FAINT,
                  whiteSpace: 'nowrap',
                  transition: 'color .15s ease'
                }}
              >
                {s.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  color: s.count === 0 ? skin.DASH_INK : skin.VALUE
                }}
              >
                {s.count.toLocaleString()}
                {s.pct != null && (
                  <Box component='span' sx={{ fontSize: '16px', fontWeight: 700, color: skin.ACCENT_INK, ml: 2 }}>
                    {s.pct}%
                  </Box>
                )}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* chart title + range tabs — below the stats, right above the plot they control */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', mb: 4 }}>
          <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600 }}>
            Lab requests raised per month
            {deltaPct != null && (
              <Box component='span' sx={{ fontSize: '15px', fontWeight: 700, color: skin.ACCENT_INK, ml: 3 }}>
                {deltaPct > 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs previous
              </Box>
            )}
          </Typography>
          <TrendRangeTabs value={trendRange} onPick={setTrendRange} color={skin.ACCENT_INK} />
        </Box>

        <TrendAreaChart values={trend.values} labels={trend.labels} color={skin.ACCENT_FILL} name='Lab requests' height={230} onPointClick={openMonth} />
      </SectionCard>

      {/* RECURRING TESTS — one card, two underline sub-tabs (user call 2026-09-02):
          Frequently Repeated (dense bursts = unresolved illness) | Long-term Monitoring
          (year+ cadence = managed chronic case). Row → drill sheet → per-animal trend. */}
      {(repeatTests.length > 0 || monitorTests.length > 0) && (
        <>
          <ActHeader title='Recurring Tests' />
          <SectionCard
            titleMb={3}
            action={
              <SearchPill
                value={chronicQ}
                onChange={v => {
                  setChronicQ(v)
                  setRepeatPm(p => ({ ...p, page: 0 }))
                  setMonitorPm(p => ({ ...p, page: 0 }))
                }}
                placeholder='Search tests…'
              />
            }
            title={
              <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(
                  [
                    { key: 'repeat', label: 'Frequently Repeated', n: repeatTests.length },
                    { key: 'monitor', label: 'Long-term Monitoring', n: monitorTests.length }
                  ] as { key: 'repeat' | 'monitor'; label: string; n: number }[]
                ).map(t => {
                  const on = chronicTab === t.key

                  return (
                    <Box
                      key={t.key}
                      onClick={() => setChronicTab(t.key)}
                      role='tab'
                      aria-selected={on}
                      sx={{
                        py: 1.5,
                        mb: '-1px',
                        borderBottom: '2.5px solid',
                        borderColor: on ? skin.ACCENT_FILL : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <Typography variant='body1' sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: on ? skin.ACCENT_INK : c.neutralSecondary }}>
                        {t.label} ({t.n.toLocaleString()})
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            }
          >
            {chronicTab === 'repeat' ? (
              repeatRows.length ? (
                <DetailTable
                  columns={repeatCols}
                  rows={pageSlice(repeatRows, repeatPm)}
                  total={repeatRows.length}
                  paginationModel={repeatPm}
                  setPaginationModel={setRepeatPm}
                  onRowClick={(p: any) => openTestSheet(p.row.test)}
                />
              ) : (
                <EmptyState message={chronicNeedle ? 'No tests match your search' : 'No frequently repeated tests in this period'} />
              )
            ) : monitorRows.length ? (
              <DetailTable
                columns={monitorCols}
                rows={pageSlice(monitorRows, monitorPm)}
                total={monitorRows.length}
                paginationModel={monitorPm}
                setPaginationModel={setMonitorPm}
                onRowClick={(p: any) => setMonitorTest(p.row.test)}
              />
            ) : (
              <EmptyState message={chronicNeedle ? 'No tests match your search' : 'No animals on long-term monitoring'} />
            )}
          </SectionCard>
        </>
      )}

      {/* ALL TESTS — the primary cut (stakeholder 2026-07-30). Tests by Lab RETIRED and the
          top-5 + View-all cap replaced by the standard pagination (user calls 2026-09-02). */}
      <ActHeader title='Tests Done for This Species' />
      <SectionCard
        title='All Tests'
        titleMb={2}
        action={
          <SearchPill
            value={testsQ}
            onChange={v => {
              setTestsQ(v)
              setTestsPm(p => ({ ...p, page: 0 }))
            }}
            placeholder='Search tests…'
          />
        }
      >
        {testRows.length ? (
          <DetailTable
            columns={testCols}
            rows={pageSlice(testRows, testsPm)}
            total={testRows.length}
            paginationModel={testsPm}
            setPaginationModel={setTestsPm}
            onRowClick={(p: any) => openTestSheet(p.row.test)}
          />
        ) : (
          <EmptyState message='No tests match your search' />
        )}
      </SectionCard>
        </>
      )}

      {/* Test drill sheet — the page-style TABLES inside a bottom sheet (user call
          2026-09-02): Animal Wise / Request Wise tabs; animal row → result trend. */}
      <SheetDrawer open={!!testSheet} onClose={() => setTestSheet(null)} PaperProps={{ sx: sheetPaperSx('xl') }}>
        {testSheet &&
          (() => {
            const items = rollup.requests.filter(r => r.tests.some(t => t.name === testSheet))
            const multiSite = new Set(items.map(r => r.site)).size > 1

            /* animal-wise — pool members each count the shared result */
            const membersOf = (r: LabRequest) => r.pool ?? [{ aid: r.aid, name: r.name, site: r.site, enclosure: r.enclosure }]
            const am = new Map<string, LabRequest[]>()
            const meta = new Map<string, { name: string; site: string; enclosure: string }>()
            for (const r of items)
              for (const a of membersOf(r)) {
                const list = am.get(a.aid)
                if (list) list.push(r)
                else am.set(a.aid, [r])
                if (!meta.has(a.aid)) meta.set(a.aid, a)
              }
            const animalRows = [...am.entries()]
              .map(([aid, rs]) => {
                const sorted = [...rs].sort((a, b) => (a.date < b.date ? 1 : -1))
                let lastResult: LabTestResult | undefined
                for (const r of sorted) {
                  const t = r.tests.find(x => x.name === testSheet)
                  if (t?.result) {
                    lastResult = t.result
                    break
                  }
                }

                return { id: aid, aid, ...meta.get(aid)!, tests: rs.length, lastResult, last: sorted[0].date }
              })
              .sort((a, b) => b.tests - a.tests)

            const requestRows = [...items].sort((a, b) => (a.date < b.date ? 1 : -1))

            const animalCols: GridColDef[] = [
              { field: 'aid', headerName: 'Animal', flex: 1, minWidth: 320, sortable: false, renderCell: p => <AnimalIdCell {...p.row} showSite={multiSite} /> },
              { field: 'tests', headerName: 'Tests', width: 100, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.tests, undefined, 700) },
              {
                field: 'lastResult',
                headerName: 'Last Result',
                width: 160,
                sortable: false,
                renderCell: p =>
                  p.row.lastResult ? (
                    <StatusChip label={RESULT_LABEL[p.row.lastResult as LabTestResult]} tone={RESULT_TONE[p.row.lastResult as LabTestResult]} />
                  ) : (
                    <StatusChip label='Awaiting Result' tone='neutral' />
                  )
              },
              { field: 'last', headerName: 'Last Tested', width: 170, sortable: false, renderCell: p => txt(fmtDMY(p.row.last)) }
            ]
            const requestCols: GridColDef[] = [
              { field: 'id', headerName: 'Request', flex: 1, minWidth: 320, sortable: false, renderCell: p => <RequestIdCell r={p.row} /> },
              { field: 'tests', headerName: 'Tests', width: 100, align: 'right', headerAlign: 'right', sortable: false, renderCell: p => txt(p.row.tests.length) },
              {
                field: 'status',
                headerName: 'Status',
                width: 160,
                sortable: false,
                renderCell: p => (
                  <StatusChip label={STATUS_LABEL[p.row.status as LabRequest['status']]} tone={STATUS_TONE[p.row.status as LabRequest['status']]} />
                )
              }
            ]

            return (
              <Sheet>
                <SheetHeader
                  title={testSheet}
                  icon='mdi:chart-line-variant'
                  iconTone={{ bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }}
                  stats={[
                    { label: 'Animals', value: animalRows.length },
                    { label: 'Tests', value: items.length }
                  ]}
                  onClose={() => setTestSheet(null)}
                />
                <SheetTabs
                  tabs={[
                    { key: 'animals' as const, label: `Animal Wise (${animalRows.length})` },
                    { key: 'requests' as const, label: `Request Wise (${requestRows.length})` }
                  ]}
                  value={testSheetTab}
                  onPick={setTestSheetTab}
                />
                <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 3 }}>
                  {testSheetTab === 'animals' ? (
                    <DetailTable
                      columns={animalCols}
                      rows={pageSlice(animalRows, testAnimPm)}
                      total={animalRows.length}
                      paginationModel={testAnimPm}
                      setPaginationModel={setTestAnimPm}
                      rowHeight={146}
                      onRowClick={(p: any) => {
                        const entry = animalTestEntry(p.row.aid, testSheet)
                        if (entry) setTrendEntry(entry)
                      }}
                    />
                  ) : (
                    // Rows deliberately NOT wired — the real app's lab-request detail page owns this tap.
                    <DetailTable
                      columns={requestCols}
                      rows={pageSlice(requestRows, testReqPm)}
                      total={requestRows.length}
                      paginationModel={testReqPm}
                      setPaginationModel={setTestReqPm}
                      rowHeight={146}
                    />
                  )}
                </Box>
              </Sheet>
            )
          })()}
      </SheetDrawer>

      {/* Monitoring drill sheet — the animals on lifelong monitoring for ONE test; an animal
          opens the shared per-animal trend sheet. */}
      <SheetDrawer open={!!monitorSel} onClose={() => setMonitorTest(null)} PaperProps={{ sx: sheetPaperSx('lg') }}>
        {monitorSel &&
          (() => {
            const multiSite = new Set(monitorSel.entries.map(e => e.site)).size > 1

            return (
              <Sheet>
                <SheetHeader
                  title={monitorSel.test}
                  chip={<StatusChip label={monitorSel.condition} tone='neutral' />}
                  icon='mdi:heart-pulse'
                  iconTone={{ bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }}
                  stats={[
                    { label: 'Animals', value: monitorSel.animals },
                    { label: 'Out of Range', value: monitorSel.outOfRange },
                    { label: 'Tests', value: monitorSel.tests }
                  ]}
                  onClose={() => setMonitorTest(null)}
                />
                <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
                  {monitorSel.entries.map((e, i) => (
                    <AnimalCardRow
                      key={e.aid}
                      aid={e.aid}
                      site={multiSite ? e.site : undefined}
                      enclosure={e.enclosure}
                      trailing={
                        e.lastResult ? (
                          <StatusChip label={RESULT_LABEL[e.lastResult]} tone={RESULT_TONE[e.lastResult]} />
                        ) : (
                          <StatusChip label='Awaiting Result' tone='neutral' />
                        )
                      }
                      meta={
                        <>
                          {e.lastValue != null && (
                            <RowMetaText strong>
                              {e.lastValue} {monitorSel.measure?.unit}
                            </RowMetaText>
                          )}
                          <RowMetaText>Since {fmtMY(e.firstDate)}</RowMetaText>
                          <RowMetaText>{e.times} times</RowMetaText>
                          <RowMetaText>every ~{Math.max(1, Math.round(e.cadenceDays / 7))} wk</RowMetaText>
                        </>
                      }
                      chevron
                      last={i === monitorSel.entries.length - 1}
                      onClick={() =>
                        setTrendEntry({
                          aid: e.aid,
                          name: e.name,
                          site: e.site,
                          enclosure: e.enclosure,
                          test: e.test,
                          times: e.times,
                          spanDays: e.spanDays,
                          lastResult: e.lastResult,
                          requests: e.requests
                        })
                      }
                    />
                  ))}
                </Box>
              </Sheet>
            )
          })()}
      </SheetDrawer>


      {/* Per-animal result trend — the leaf of the repeat drill: every completed reading of
          ONE test on ONE animal over time, then that animal's requests for the test. */}
      <SheetDrawer open={!!trendEntry} onClose={() => setTrendEntry(null)} PaperProps={{ sx: sheetPaperSx('lg') }}>
        {trendEntry &&
          (() => {
            // Qualitative tests (no measure) still get the sheet — request history without a chart.
            const measure = TEST_MEASURES[trendEntry.test]
            const seq = [...trendEntry.requests].sort((a, b) => (a.date < b.date ? -1 : 1))
            const pts = seq
              .map(r => ({ r, t: r.tests.find(x => x.name === trendEntry.test) }))
              .filter(x => x.t?.result && x.t.value != null)
              .map(x => ({ date: x.r.date, value: x.t!.value!, result: x.t!.result! }))

            return (
              <Sheet>
                {/* Title = the TEST alone (user calls 2026-09-02) — no chip, no stat strip;
                    the trend and the request list below carry the numbers. */}
                <SheetHeader
                  icon='mdi:chart-line-variant'
                  iconTone={{ bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }}
                  title={trendEntry.test}
                  onClose={() => setTrendEntry(null)}
                />
                <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
                  {/* Qualitative tests have nothing to trend — the section itself goes. */}
                  {measure && (
                    <SheetSection label='Result Trend' first noDivider>
                      {pts.length >= 2 ? (
                        <ResultTrendChart points={pts} measure={measure} />
                      ) : (
                        <SheetEmpty>Not enough completed results to draw a trend.</SheetEmpty>
                      )}
                    </SheetSection>
                  )}
                  <SheetSection label='Lab Requests' chip={<StatusChip label={seq.length} tone='neutral' />} first={!measure} noDivider>
                    {[...seq].reverse().map((r, i) => {
                      const t = r.tests.find(x => x.name === trendEntry.test)

                      return (
                        <SheetRow
                          key={r.id}
                          icon='mdi:flask-outline'
                          title={r.id}
                          caption={`${r.doctor} · ${r.lab}`}
                          when={fmtDMY(r.date)}
                          trailing={
                            t?.result ? (
                              <>
                                <StatusChip label={RESULT_LABEL[t.result]} tone={RESULT_TONE[t.result]} />
                                {t.value != null && (
                                  <RowMetaText strong>
                                    {t.value} {measure?.unit}
                                  </RowMetaText>
                                )}
                              </>
                            ) : (
                              <StatusChip label='Awaiting Result' tone='neutral' />
                            )
                          }
                          last={i === seq.length - 1}
                        />
                      )
                    })}
                  </SheetSection>
                </Box>
              </Sheet>
            )
          })()}
      </SheetDrawer>

    </Box>
  )
}

export default LabTab
