'use client'

/*
 * Lab Module tab — species-scoped LIMS rollup for management users, derived from the clinical
 * sidecar (see ./lab/lab.ts). Post-feedback layout (lab_8_1_3 mock, stakeholder 2026-07-30):
 * pulse (request stats + trend) → tests-first row (All Tests + Tests by Lab, symmetric cards)
 * → drill sheets. Tests are THE primary cut; site lives as a filter inside every sheet, and a
 * test click shows its animals with a result-distribution strip. Kit-first: detailUi + the
 * Medical SignalDrawer/AnimalHealthRecord drill flow, same as the Hospital tab.
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SpeciesClinical } from 'src/lib/api/species-management/detail'
import type { GridColDef } from '@mui/x-data-grid'
import {
  CellText,
  DetailTable,
  EmptyState,
  SectionCard,
  Sheet,
  SheetHeader,
  SheetRow,
  sheetPaperSx,
  SHEET_PX,
  TrendAreaChart,
  TrendRangeTabs
, SheetDrawer} from 'src/views/pages/species-management/ipad1/detail/detailUi'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/ipad1/dashboard/DashboardDateRange'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
import AnimalHealthRecord from './medical/AnimalHealthRecord'
import type { SignalAnimal } from './medical/signals'
import { buildLabRequests, computeLab, monthlyLabRequests, type LabRequest, type LabTestResult } from './lab/lab'

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
  in_progress: 'In Progress',
  pending: 'Pending',
  cancelled: 'Cancelled'
}
const STATUS_TONE: Record<LabRequest['status'], SignalAnimal['pillTone']> = {
  completed: 'success',
  in_progress: 'warning',
  pending: 'neutral',
  cancelled: 'error'
}
const RESULT_LABEL: Record<LabTestResult, string> = {
  normal: 'Normal',
  high: 'High',
  low: 'Low',
  positive: 'Positive',
  detected: 'Detected'
}

/* ── request → drawer drill row ──────────────────────────────────────────── */
/* Pill shows the RESULT when one exists (the management-relevant word); lifecycle status
 * otherwise. Doctor/source stay out of the row — they live in the health record. */
const requestPill = (r: LabRequest): { pill: string; tone: SignalAnimal['pillTone'] } => {
  if (r.status === 'completed') {
    const results = r.tests.map(t => t.result).filter(Boolean) as LabTestResult[]
    const detection = results.find(x => x === 'positive' || x === 'detected')
    if (detection) return { pill: RESULT_LABEL[detection], tone: 'error' }
    const offRange = results.find(x => x === 'high' || x === 'low')
    if (offRange) return { pill: RESULT_LABEL[offRange], tone: 'warning' }

    return { pill: 'Normal', tone: 'success' }
  }
  if (r.urgent && (r.status === 'pending' || r.status === 'in_progress')) {
    return { pill: `Urgent • ${STATUS_LABEL[r.status]}`, tone: 'error' }
  }

  return { pill: STATUS_LABEL[r.status], tone: STATUS_TONE[r.status] }
}

const requestRow = (r: LabRequest): SignalAnimal => {
  const { pill, tone } = requestPill(r)

  return {
    aid: r.aid,
    name: r.name,
    site: r.site,
    enclosure: r.enclosure,
    condition: r.id,
    detail: '',
    date: r.date,
    chip: {
      label: r.tests.length === 1 ? r.tests[0].name : `${r.tests.length} tests`,
      items: r.tests.map(t => `${t.name} — ${STATUS_LABEL[t.status]}${t.result ? ` • ${RESULT_LABEL[t.result]}` : ''}`)
    },
    pill,
    pillTone: tone
  }
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
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [listSheet, setListSheet] = useState<'tests' | 'labs' | null>(null)
  const [recordAid, setRecordAid] = useState<string | null>(null)
  const inWin = useWindow(range)

  const now = useMemo(() => new Date(), [])
  const rollup = useMemo(() => computeLab(clinical, inWin, now), [clinical, range, now])
  const allRequests = useMemo(() => buildLabRequests(clinical, now), [clinical, now])
  const trend = useMemo(
    () =>
      monthlyLabRequests(
        allRequests,
        trendRange === 'all' ? null : trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12,
        now
      ),
    [allRequests, trendRange, now]
  )

  /* ── drawer openers ── */
  const openList = (title: string, explainer: string, icon: string, tone: SignalDrawerPayload['tone'], items: LabRequest[], initialSite?: string) =>
    setDrill({ title, explainer, icon, tone, animals: items.map(requestRow), initialSite })

  /* Test drill — one row per request that carried the test. ONE pill vocabulary: the RESULT
   * (Normal/High/Low/Positive/Detected); tests still moving read "Awaiting Result". Cancelled
   * requests stay out — they'll never produce a result. */
  const testDrillRow = (r: LabRequest, test: string): SignalAnimal => {
    const t = r.tests.find(x => x.name === test)
    let pill = 'Awaiting Result'
    let tone: SignalAnimal['pillTone'] = 'neutral'
    if (t?.status === 'completed' && t.result) {
      pill = RESULT_LABEL[t.result]
      tone = t.result === 'positive' || t.result === 'detected' ? 'error' : t.result === 'normal' ? 'success' : 'warning'
    }

    return { aid: r.aid, name: r.name, site: r.site, enclosure: r.enclosure, condition: r.id, detail: '', date: r.date, pill, pillTone: tone }
  }

  const openTest = (test: string) => {
    const items = (rollup?.requests ?? []).filter(r => r.status !== 'cancelled' && r.tests.some(t => t.name === test))
    setDrill({
      title: test,
      explainer: `Every animal given ${test} this period — results follow the filters above.`,
      icon: 'mdi:test-tube',
      tone: 'neutral',
      animals: items.map(r => testDrillRow(r, test)),
      distribution: [
        { label: 'Normal', color: theme.palette.primary.main },
        { label: 'High', color: c.moderateSecondary },
        { label: 'Low', color: c.moderateSecondary },
        { label: 'Positive', color: c.Tertiary },
        { label: 'Detected', color: c.TertiaryDark }
      ]
    })
  }

  const openMonth = (i: number) => {
    const list = trend.perMonth[i]
    if (!list?.length) return
    openList(`${trend.labels[i]} — lab requests`, `${list.length} requests raised in ${trend.labels[i]}.`, 'mdi:chart-line', 'neutral', list)
  }

  const openStatus = (k: LabRequest['status']) =>
    openList(STATUS_LABEL[k], `Requests currently ${STATUS_LABEL[k].toLowerCase()} in this period.`, 'mdi:flask-outline', 'neutral', (rollup?.requests ?? []).filter(r => r.status === k))

  if (!rollup) {
    return <EmptyState message='No lab data for this species' />
  }

  const reqTotal = rollup.requests.length

  /* Strip counts are TESTS, not requests — one request can carry several tests. */
  const testTotals = (() => {
    const t = { total: 0, completed: 0, inProgress: 0, pending: 0, cancelled: 0 }
    for (const r of rollup.requests)
      for (const x of r.tests) {
        t.total++
        if (x.status === 'completed') t.completed++
        else if (x.status === 'in_progress') t.inProgress++
        else if (x.status === 'pending') t.pending++
        else if (x.status === 'cancelled') t.cancelled++
      }

    return t
  })()
  const testsCompletedPct = testTotals.total ? Math.round((testTotals.completed / testTotals.total) * 100) : 0

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

  /* Lab-wise — same three-column read as All Tests (name • animals • tests). */
  const byLab = rollup.byLab.map(l => ({ name: l.name, animals: new Set(l.items.map(r => r.aid)).size, tests: l.tests, items: l.items }))

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
      onClick: () => openList('Lab requests', 'Every lab request raised this period.', 'mdi:flask-outline', 'neutral', rollup.requests)
    },
    { key: 'in_progress', count: testTotals.inProgress, label: 'In Progress', onClick: () => openStatus('in_progress') },
    { key: 'pending', count: testTotals.pending, label: 'Pending', onClick: () => openStatus('pending') },
    { key: 'cancelled', count: testTotals.cancelled, label: 'Cancelled', onClick: () => openStatus('cancelled') },
    { key: 'completed', count: testTotals.completed, label: 'Completed', pct: testsCompletedPct, onClick: () => openStatus('completed') }
  ]

  /* ── act header — optional `action` renders at the row's right edge (e.g. date range) ── */
  const ActHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
      <Typography sx={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.OnSurface, whiteSpace: 'nowrap' }}>
        {title}
      </Typography>
      {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
    </Box>
  )

  /* ── tests row tables — standard DetailTable columns (Hospital ops-table pattern).
   * Module standard: top-5 rows, "View all →" in the title row → side sheet. Both cards show
   * the same row count so the section reads symmetric. */
  const ROWS_CAP = 5
  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  const testAvg = allTests.length ? allTests.reduce((s2, t) => s2 + t.tests, 0) / allTests.length : 0
  const testCols: GridColDef[] = [
    { minWidth: 180, flex: 1, sortable: false, field: 'test', headerName: 'Test', renderCell: p => txt(p.row.test, c.OnSurfaceVariant, 600) },
    { width: 175, sortable: false, field: 'animals', headerName: 'Unique Animals', renderCell: p => txt(p.row.animals) },
    { width: 100, sortable: false, field: 'tests', headerName: 'Tests', renderCell: p => txt(p.row.tests, p.row.tests >= testAvg * 1.3 ? c.Tertiary : undefined, 700) }
  ]
  const testRows = allTests.slice(0, ROWS_CAP).map((t, i) => ({ ...t, id: i }))

  const labCols: GridColDef[] = [
    { minWidth: 180, flex: 1, sortable: false, field: 'name', headerName: 'Lab', renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    { width: 175, sortable: false, field: 'animals', headerName: 'Unique Animals', renderCell: p => txt(p.row.animals) },
    { width: 100, sortable: false, field: 'tests', headerName: 'Tests', renderCell: p => txt(p.row.tests, undefined, 700) }
  ]
  const labRows = byLab.slice(0, ROWS_CAP).map((l, i) => ({ ...l, id: i }))

  /* "View all" lives in the card's title row, right corner — opens the side sheet. */
  const viewAllSx = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.primary.dark,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': { textDecoration: 'underline' }
  } as const
  const ViewAllAction: React.FC<{ count: number; noun: string; onOpen: () => void }> = ({ count, noun, onOpen }) =>
    count > ROWS_CAP ? (
      <Typography onClick={onOpen} sx={viewAllSx}>
        View all {count} {noun} →
      </Typography>
    ) : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* ACT 1 • THE PULSE — act header carries the date range; the card stacks stats → chart
          title + range tabs → chart (no separate strip; the page already opens with the dark
          hero band, so the summary stays light and merged) */}
      <ActHeader title='Lab request volume' action={<DashboardDateRange value={range} onChange={setRange} />} />
      <SectionCard>
        {/* summary stats — requests, then tests by status; numbers in the deep hero teal */}
        <Box
          sx={{
            display: 'grid',
            // Always one row of five — the summary is a single band, never a 3+2 wrap.
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
            pb: 5,
            mb: 5,
            borderBottom: `1px solid ${c.SurfaceVariant}`
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
                borderLeft: i === 0 ? 'none' : `1px solid ${c.SurfaceVariant}`,
                pl: i === 0 ? 0 : 5,
                '&:hover .lab-stat-lbl': { color: c.OnSurface }
              }}
            >
              <Typography
                sx={{
                  fontSize: '28px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  color: s.count === 0 ? c.neutralSecondary : c.chatBubbleSent
                }}
              >
                {s.count.toLocaleString()}
                {s.pct != null && (
                  <Box component='span' sx={{ fontSize: '16px', fontWeight: 700, color: theme.palette.primary.dark, ml: 2 }}>
                    {s.pct}%
                  </Box>
                )}
              </Typography>
              <Typography
                className='lab-stat-lbl'
                sx={{ fontSize: '16px', fontWeight: 500, color: c.neutralSecondary, whiteSpace: 'nowrap', transition: 'color .15s ease' }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* chart title + range tabs — below the stats, right above the plot they control */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', mb: 4 }}>
          <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600 }}>
            Lab requests raised per month
            {deltaPct != null && (
              <Box component='span' sx={{ fontSize: '15px', fontWeight: 700, color: theme.palette.primary.dark, ml: 3 }}>
                {deltaPct > 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs previous
              </Box>
            )}
          </Typography>
          <TrendRangeTabs value={trendRange} onPick={setTrendRange} color={theme.palette.primary.dark} />
        </Box>

        <TrendAreaChart values={trend.values} labels={trend.labels} color={theme.palette.primary.main} name='Lab requests' height={230} onPointClick={openMonth} />
      </SectionCard>

      {/* TESTS ROW — the primary cut (stakeholder 2026-07-30): All Tests + Tests by Lab as
          symmetric cards. Site/hospital cards are gone — site is a filter inside every sheet. */}
      <ActHeader title='Tests done for this species' />
      {/* Orientation-driven: the two tables stack full-width in portrait, pair up in landscape. */}
      <Box
        sx={{
          display: 'grid',
          gap: 4,
          alignItems: 'stretch',
          gridTemplateColumns: '1fr',
          '@media (orientation: landscape)': { gridTemplateColumns: '1fr 1fr' }
        }}
      >
        <SectionCard
          title='All Tests'
          titleMb={2}
          action={<ViewAllAction count={allTests.length} noun='tests' onOpen={() => setListSheet('tests')} />}
        >
          <DetailTable
            columns={testCols}
            rows={testRows}
            total={testRows.length}
            hideFooter
            onRowClick={(p: any) => openTest(p.row.test)}
          />
        </SectionCard>

        <SectionCard
          title='Tests by Lab'
          titleMb={2}
          action={<ViewAllAction count={byLab.length} noun='labs' onOpen={() => setListSheet('labs')} />}
        >
          <DetailTable
            columns={labCols}
            rows={labRows}
            total={labRows.length}
            hideFooter
            onRowClick={(p: any) => openList(p.row.name, `Lab requests processed at ${p.row.name} this period.`, 'mdi:flask-outline', 'neutral', p.row.items)}
          />
        </SectionCard>
      </Box>

      {/* View-all list sheet — the FULL test/lab list (name • unique animals • tests); a row
          click closes it and opens that entry's drill sheet. */}
      <SheetDrawer open={!!listSheet} onClose={() => setListSheet(null)} PaperProps={{ sx: sheetPaperSx('md') }}>
        {listSheet && (
          <Sheet>
            <SheetHeader
              title={listSheet === 'tests' ? 'All Tests' : 'Tests by Lab'}
              icon={listSheet === 'tests' ? 'mdi:test-tube' : 'mdi:flask-outline'}
              iconTone={{ bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }}
              stats={[
                { label: listSheet === 'tests' ? 'Tests' : 'Labs', value: (listSheet === 'tests' ? allTests : byLab).length },
                { label: 'Tests Done', value: (listSheet === 'tests' ? allTests : byLab).reduce((s2, x) => s2 + x.tests, 0) }
              ]}
              onClose={() => setListSheet(null)}
            />
            <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, mt: 3 }}>
              {listSheet === 'tests'
                ? allTests.map((t, i) => (
                    <SheetRow
                      key={t.test}
                      title={t.test}
                      caption={`${t.animals} unique animals`}
                      last={i === allTests.length - 1}
                      chevron
                      onClick={() => {
                        setListSheet(null)
                        openTest(t.test)
                      }}
                      trailing={
                        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: theme.palette.primary.dark, fontVariantNumeric: 'tabular-nums' }}>
                          {t.tests}
                        </Typography>
                      }
                    />
                  ))
                : byLab.map((l, i) => (
                    <SheetRow
                      key={l.name}
                      title={l.name}
                      caption={`${l.animals} unique animals`}
                      last={i === byLab.length - 1}
                      chevron
                      onClick={() => {
                        setListSheet(null)
                        openList(l.name, `Lab requests processed at ${l.name} this period.`, 'mdi:flask-outline', 'neutral', l.items)
                      }}
                      trailing={
                        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: theme.palette.primary.dark, fontVariantNumeric: 'tabular-nums' }}>
                          {l.tests}
                        </Typography>
                      }
                    />
                  ))}
            </Box>
          </Sheet>
        )}
      </SheetDrawer>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} onClose={() => setRecordAid(null)} />
    </Box>
  )
}

export default LabTab
