'use client'

/*
 * Hospital tab — species-scoped hospitalisation rollup, derived from the clinical sidecar
 * (see ./hospital/hospital.ts). Management lens: how many of THIS species' animals are in
 * hospital care now, the admissions trend over time, who keeps coming back, which hospital
 * carries the load, length-of-stay + outcome shape, and surgery (hospital + field).
 * Kit-first: detailUi charts + the Medical SignalsBand/SignalDrawer/AnimalHealthRecord flow.
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical } from 'src/lib/api/species-management/detail'
import type { GridColDef } from '@mui/x-data-grid'
import {
  SiteFilterSelect,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  CollapsibleSearch,
  DetailTable,
  EmptyState,
  HeroPhotoContext,
  SectionCard,
  synthAnimalIdentity,
  thinScrollbarSx,
  TrendAreaChart,
  ViewToggle
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { CTRL_H, RangeSelect, yearItemsFor } from 'src/views/pages/species-management/ipad3/detail/tabs/CircleOfLifeTab'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'
import DashboardDateRange, {
  resolveRange,
  type RangeSelection
} from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
import SignalsBand from './medical/SignalsBand'
import AnimalHealthRecord from './medical/AnimalHealthRecord'
import type { SignalAnimal } from './medical/signals'
import {
  buildAdmissions,
  computeHospital,
  losBuckets,
  monthlyAdmissions,
  type Admission,
  type HospAnimal
} from './hospital/hospital'

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

/* ── admission / animal → SignalAnimal drill row ─────────────────────────── */
const admissionRow = (a: Admission): SignalAnimal => ({
  aid: a.aid,
  name: a.name,
  site: a.site,
  enclosure: `${a.enclosure} • ${a.hospital}`,
  condition: a.condition,
  detail: '',
  date: a.admittedOn,
  pill: a.outcome === 'died' ? 'Died' : a.status === 'active' ? `Admitted • ${a.durationDays} D` : `Discharged • ${a.durationDays} D`,
  pillTone: a.outcome === 'died' ? 'error' : a.status === 'active' ? 'warning' : 'success'
})

const animalRow = (g: HospAnimal, detail: string, pill: string, tone: SignalAnimal['pillTone']): SignalAnimal => ({
  aid: g.aid,
  name: g.name,
  site: g.site,
  enclosure: g.enclosure,
  condition: g.admissions[g.admissions.length - 1]?.condition,
  detail,
  date: g.admissions[g.admissions.length - 1]?.admittedOn,
  pill,
  pillTone: tone
})

/* ── mock-style area sparkline (filled, primary) — the kit Sparkline is too thin here ── */
const AreaSpark: React.FC<{ values: number[]; color: string; width?: number; height?: number }> = ({ values, color, width = 120, height = 48 }) => {
  if (!values || values.length < 2) return null
  const max = Math.max(1, ...values)
  const min = Math.min(...values)
  const span = Math.max(1, max - min)
  const step = width / (values.length - 1)
  const pts = values.map((v, i) => `${Math.round(i * step)},${Math.round(height - 6 - ((v - min) / span) * (height - 12))}`)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts.join(' ')} fill='none' stroke={color} strokeWidth='2.5' strokeLinejoin='round' />
      <polygon points={`${pts.join(' ')} ${width},${height} 0,${height}`} fill={color} opacity='0.12' />
    </svg>
  )
}

const fmtDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)

  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * 86400000).toISOString().slice(0, 10)

/* ── Hospitalised Animals — the tab's working list (user call 2026-09-02, replacing the
 *  Outcomes donut + Admissions-by-Hospital rollup): Admitted / Discharged / Mortality tabs
 *  over the standard animal-card table. Search + Site + Hospital dropdowns filter every
 *  tab; counts follow the filters; the recovery ledger keeps the donut's one real fact.
 *  Row → the animal's full health record. */
type AdmTab = 'admitted' | 'discharged' | 'mortality'

const AdmissionsSection: React.FC<{ admissions: Admission[]; portrait: boolean; onAnimal: (aid: string) => void }> = ({
  admissions,
  portrait,
  onAnimal
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const heroPhoto = React.useContext(HeroPhotoContext)
  const [tab, setTab] = useState<AdmTab>('admitted')
  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [hospital, setHospital] = useState<string | null>(null)
  // the section's OWN period filter (user call 2026-09-02) — defaults to All time and works
  // on the full admission history, independent of the page window up top
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })
  const inWin = useWindow(range)

  const sites = useMemo(() => Array.from(new Set(admissions.map(a => a.site).filter(Boolean))).sort(), [admissions])
  const hospitals = useMemo(() => Array.from(new Set(admissions.map(a => a.hospital).filter(Boolean))).sort(), [admissions])

  // search + dropdowns scope EVERY tab — the tab counts follow so a tab never lies about its rows
  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase()

    return admissions.filter(
      a =>
        inWin(a.admittedOn) &&
        (!site || a.site === site) &&
        (!hospital || a.hospital === hospital) &&
        (!needle || `${a.name} ${a.aid} ${a.site} ${a.hospital} ${a.condition}`.toLowerCase().includes(needle))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admissions, site, hospital, q, range])

  const statusOf = (a: Admission): AdmTab => (a.outcome === 'died' ? 'mortality' : a.status === 'active' ? 'admitted' : 'discharged')
  const counts = useMemo(() => {
    const n: Record<AdmTab, number> = { admitted: 0, discharged: 0, mortality: 0 }
    for (const a of scoped) n[statusOf(a)]++

    return n
  }, [scoped])

  const rows = useMemo(
    () =>
      scoped
        .filter(a => statusOf(a) === tab)
        .map((a, i) => ({
          id: `${a.aid}-${a.admittedOn}-${i}`,
          ...a,
          endDate: a.status === 'resolved' ? addDays(a.admittedOn, a.durationDays) : undefined
        })),
    [scoped, tab]
  )
  const tbl = useSortableTable(rows, { field: 'admittedOn', sort: 'desc' })
  const resetPage = () => tbl.setPaginationModel(p => ({ ...p, page: 0 }))

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  // TABLE-VIEW minimal card = the Population grammar (user call 2026-09-05): EXACTLY
  // 3 text rows — two identifiers + ONE location line (SITE while the visible list
  // spans sites, ENCLOSURE once a single site is picked / all rows share one); 94 → 75.
  const showCardSite = !site && new Set(rows.map(r => r.site)).size > 1
  const animalCardCell = (a: Admission) => {
    const syn = synthAnimalIdentity(a.aid)

    return (
      <AnimalIdCard
        identifiers={syn.identifiers}
        enclosure={showCardSite ? undefined : a.enclosure || syn.enclosure}
        site={showCardSite ? a.site : undefined}
        tag={tab === 'mortality' ? 'mortality' : syn.tag}
        size={75}
        photo={syn.hasPhoto ? heroPhoto?.src : undefined}
        photoPos={heroPhoto?.bgPos}
      />
    )
  }

  // Long names never truncate — wrap to a second line inside the tall card rows.
  const wrapCell = (v: React.ReactNode, color?: string, weight = 500) => (
    <Typography
      sx={{
        fontSize: '1rem',
        fontWeight: weight,
        color: color || c.OnSurfaceVariant,
        whiteSpace: 'normal',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {v}
    </Typography>
  )

  const columns: GridColDef[] = [
    // column order (user call 2026-09-02): Animal · Admitted · [Discharged/Died] · Stay · Condition · Hospital
    { field: 'name', headerName: 'Animal', flex: 1, minWidth: 380, renderCell: p => animalCardCell(p.row) },
    { field: 'admittedOn', headerName: 'Admitted', width: 150, renderCell: p => txt(fmtDate(p.row.admittedOn), c.neutralSecondary) },
    ...(tab === 'discharged'
      ? [{ field: 'endDate', headerName: 'Discharged', width: 150, renderCell: (p: any) => txt(fmtDate(p.row.endDate), c.neutralSecondary) } as GridColDef]
      : []),
    ...(tab === 'mortality'
      ? [{ field: 'endDate', headerName: 'Died', width: 150, renderCell: (p: any) => txt(fmtDate(p.row.endDate), skin.TONE_TYPE.bad) } as GridColDef]
      : []),
    {
      field: 'durationDays',
      headerName: 'Stay',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: p => txt(`${Number(p.row.durationDays).toLocaleString()} D`, tab === 'admitted' && p.row.durationDays > 7 ? skin.CORAL : c.neutralSecondary, 600)
    },
    { field: 'condition', headerName: 'Condition', width: 180, renderCell: p => wrapCell(p.row.condition, c.OnSurfaceVariant, 600) },
    { field: 'hospital', headerName: 'Hospital', width: 200, renderCell: p => wrapCell(p.row.hospital, c.neutralSecondary) }
  ]

  const TABS: { key: AdmTab; label: string }[] = [
    // "Currently Admitted" (demo review 2026-09-04) — the tab lists animals in care NOW
    { key: 'admitted', label: 'Currently Admitted' },
    { key: 'discharged', label: 'Discharged' },
    { key: 'mortality', label: 'Mortality' }
  ]
  const statusTabs = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', ...thinScrollbarSx(theme) }}>
      {TABS.map(m => {
        const active = tab === m.key

        return (
          <Box
            key={m.key}
            onClick={() => {
              setTab(m.key)
              resetPage()
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

  const controls = (
    // ONE row (user calls 2026-09-02): search FIRST as a compact dropdown-width pill, then
    // Site · Hospital · Period. Tapping the search expands it over this whole row (hence
    // position:relative); leaving it collapses back, keeping a live query visible.
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, width: portrait ? '100%' : undefined }}>
      <CollapsibleSearch
        value={q}
        onChange={v => {
          setQ(v)
          resetPage()
        }}
        placeholder='Search animals…'
        grow
      />
      {sites.length > 1 && (
        // THE standard site dropdown (2026-09-02): bottom-sheet picker with per-site counts
        <SiteFilterSelect
          sites={sites.map(name => ({ site: name, caption: `${admissions.filter(a => a.site === name).length.toLocaleString()} admissions` }))}
          value={site}
          onChange={v => {
            setSite(v)
            resetPage()
          }}
          allCaption={`${admissions.length.toLocaleString()} admissions`}
        />
      )}
      {hospitals.length > 1 && (
        <CategoryFilter
          options={hospitals}
          value={hospital}
          onChange={v => {
            setHospital(v)
            resetPage()
          }}
          icon='mdi:hospital-building'
          placeholder='All Hospitals'
        />
      )}
      <DashboardDateRange
        value={range}
        onChange={r => {
          setRange(r)
          resetPage()
        }}
      />
    </Box>
  )

  const stackedHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
      {statusTabs}
      {controls}
    </Box>
  )

  return (
    <SectionCard title={portrait ? stackedHeader : statusTabs} action={portrait ? undefined : controls} titleMb={2}>
      {rows.length ? (
        <DetailTable
          columns={columns}
          rows={tbl.rows}
          total={tbl.total}
          paginationModel={tbl.paginationModel}
          setPaginationModel={tbl.setPaginationModel}
          sortModel={tbl.sortModel}
          handleSortModel={tbl.handleSortModel}
          rowHeight={128} // 75px minimal-card block + breathing room (Population standard, 2026-09-05)
          stickyFields={['name']} // HARD RULE: identity columns pinned when the table scrolls
          onRowClick={(p: { row: Admission }) => onAnimal(p.row.aid)}
        />
      ) : (
        <EmptyState
          message={
            tab === 'admitted' ? 'No animals admitted right now' : tab === 'discharged' ? 'No discharges in this period' : 'No deaths in care this period'
          }
        />
      )}
    </SectionCard>
  )
}

/* ── main tab ────────────────────────────────────────────────────────────── */
interface Props {
  clinical?: SpeciesClinical | null
}

const HospitalTab: React.FC<Props> = ({ clinical }) => {
  const theme = useTheme() as any

  // Portrait-only reshape (2026-08-24): trend chart full width, then Outcomes ·
  // By Hospital side by side, then Length of Stay · Surgery side by side (Surgery
  // becomes its own card). Landscape keeps the original two-row 1.3fr/1fr layout.
  const portrait = useMediaQuery('(orientation: portrait)')
  const c = cc(theme)
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })

  /* THE standard period control (user call 2026-09-06): 1Y | 2Y | 3Y | Custom — the CoL
     grammar; 'All' retired (demo review 2026-09-04). Custom = year From/To, cap 5. */
  const [trendRange, setTrendRange] = useState<'last_1y' | 'last_2y' | 'last_3y' | 'custom'>('last_1y')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [recordAid, setRecordAid] = useState<string | null>(null)
  const NOW = useMemo(() => new Date(), [])
  const inWin = useWindow(range)

  const rollup = useMemo(() => computeHospital(clinical, inWin), [clinical, range])
  const allAdmissions = useMemo(() => buildAdmissions(clinical), [clinical])

  // Years the data actually covers — from the all-time trend's span back from today.
  const years = useMemo(() => {
    const span = monthlyAdmissions(allAdmissions, null, NOW).labels.length
    const first = new Date(NOW.getFullYear(), NOW.getMonth() - (span - 1), 1).getFullYear()

    return Array.from({ length: NOW.getFullYear() - first + 1 }, (_, i) => NOW.getFullYear() - i)
  }, [allAdmissions, NOW])
  const CAP = 5
  const enterCustom = () => {
    setTrendRange('custom')
    if (yearFrom == null && yearTo == null) {
      setYearFrom(Math.max(years[years.length - 1] ?? NOW.getFullYear(), NOW.getFullYear() - (CAP - 1)))
      setYearTo(NOW.getFullYear())
    }
  }

  const trend = useMemo(() => {
    if (trendRange === 'custom') {
      const to = yearTo ?? NOW.getFullYear()
      const from = yearFrom ?? to
      // anchor at the window's end (or today when it ends this year); span = whole years
      const anchor = to >= NOW.getFullYear() ? NOW : new Date(to, 11, 31)
      const months = (to - from) * 12 + anchor.getMonth() + 1

      return monthlyAdmissions(allAdmissions, Math.max(1, months), anchor)
    }

    return monthlyAdmissions(allAdmissions, trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12, NOW)
  }, [allAdmissions, trendRange, yearFrom, yearTo, NOW])
  const buckets = useMemo(() => losBuckets(rollup?.admissions ?? []), [rollup])

  /* ── drawer openers ── */
  const openNow = () =>
    setDrill({
      title: 'Hospitalised Now',
      explainer: 'Animals with an active admission right now — inpatient and outpatient.',
      icon: 'mdi:hospital-box-outline',
      tone: 'neutral',
      animals: (rollup?.animals ?? [])
        .filter(a => a.currentlyAdmitted)
        .sort((x, y) => y.currentStayDays - x.currentStayDays)
        .map(a => animalRow(a, `admitted ${a.currentStayDays} days`, `${a.currentStayDays} D`, 'warning'))
    })

  const openRepeat = () =>
    setDrill({
      title: 'Repeatedly Hospitalised',
      explainer: 'Animals admitted 2 or more times — fragile animals that keep needing hospital care.',
      icon: 'mdi:repeat',
      tone: 'error',
      animals: (rollup?.animals ?? [])
        .filter(a => a.admissionCount >= 2)
        .sort((x, y) => y.admissionCount - x.admissionCount)
        .map(a => animalRow(a, `${a.admissionCount} admissions`, `${a.admissionCount} times`, 'error'))
    })

  const openLong = () =>
    setDrill({
      title: 'Long Stay — Over 7 Days',
      explainer: 'Animals currently admitted longer than 7 days — not recovering on the current course, or overdue a review.',
      icon: 'mdi:timer-sand',
      tone: 'warning',
      animals: (rollup?.longStay ?? []).map(a => animalRow(a, `admitted ${a.currentStayDays} days`, `${a.currentStayDays} D`, 'warning'))
    })

  const openMortality = () =>
    setDrill({
      title: 'Mortality This Period',
      explainer: 'Admissions that ended in death rather than discharge — case review recommended.',
      icon: 'mdi:heart-pulse',
      tone: 'error',
      animals: (rollup?.mortality ?? []).map(admissionRow)
    })

  const openMonth = (i: number) => {
    const list = trend.perMonth[i]
    if (!list?.length) return
    setDrill({
      title: `${trend.labels[i]} — admissions`,
      explainer: `${list.length} admissions started in ${trend.labels[i]}.`,
      icon: 'mdi:chart-line',
      tone: 'neutral',
      animals: list.map(admissionRow)
    })
  }

  const openBucket = (label: string) => {
    const b = buckets.find(x => x.label === label)
    if (!b?.items.length) return
    setDrill({
      title: `Length of stay ${label}`,
      explainer: 'Admissions whose stay falls in this band. Long bands = recovery is dragging.',
      icon: 'mdi:timer-sand',
      tone: 'neutral',
      animals: b.items.map(admissionRow)
    })
  }

  const openAdmissions = () =>
    setDrill({
      title: 'Admissions This Period',
      explainer: 'Every admission of this species in the selected window, newest first.',
      icon: 'mdi:hospital-box-outline',
      tone: 'neutral',
      animals: [...(rollup?.admissions ?? [])]
        .sort((x, y) => new Date(y.admittedOn).getTime() - new Date(x.admittedOn).getTime())
        .map(admissionRow)
    })

  const openStays = () =>
    setDrill({
      title: 'Length of Stay',
      explainer: 'The same admissions sorted longest stay first — what the average is made of.',
      icon: 'mdi:timer-sand',
      tone: 'neutral',
      animals: [...(rollup?.admissions ?? [])].sort((x, y) => y.durationDays - x.durationDays).map(admissionRow)
    })

  const openSurgery = (loc: 'hospital' | 'field') =>
    setDrill({
      title: loc === 'field' ? 'On-site (field) surgery' : 'In-hospital surgery',
      explainer:
        loc === 'field'
          ? 'Surgeries performed at the animal’s enclosure — the doctor travelled to the site.'
          : 'Surgeries performed inside a hospital during an admission.',
      icon: 'mdi:medical-bag',
      tone: loc === 'field' ? 'warning' : 'neutral',
      animals: (rollup?.admissions ?? []).filter(a => a.surgery === loc).map(admissionRow)
    })

  if (!rollup || (rollup.admissions.length === 0 && rollup.animalCount === 0)) {
    return <EmptyState message='No hospital data for this species' />
  }

  /* ── triage board chips — Hospital's OWN band (dark teal, NOT the Medical signals band) ── */
  const triage = [
    {
      key: 'repeat',
      urgent: rollup.repeatCount > 0,
      icon: 'mdi:repeat',
      count: rollup.repeatCount,
      label: 'Repeatedly Hospitalised',
      hint: `2+ admissions • worst ${rollup.repeatWorst}×`,
      onClick: openRepeat
    },
    {
      key: 'mortality',
      urgent: rollup.mortality.length > 0,
      icon: 'mdi:heart-pulse',
      count: rollup.mortality.length,
      label: 'Died in Care',
      hint: `mortality rate ${rollup.mortalityRate}%`,
      onClick: openMortality
    },
    {
      key: 'long',
      urgent: false,
      icon: 'mdi:timer-sand',
      count: rollup.longStay.length,
      label: 'Long Stay > 7 Days',
      hint: rollup.longStay.length ? `longest ${rollup.longStay[0].currentStayDays} D` : 'none currently',
      onClick: openLong
    }
  ]

  const adms = rollup.admissions

  /* ── flow-strip derivations (V1: capacity/flow stats, NOT the risk signals) ── */
  const durations = adms.map(a => a.durationDays).filter(d => d > 0).sort((x, y) => x - y)
  const avgStay = durations.length ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10 : 0
  const medianStay = durations.length ? durations[Math.floor(durations.length / 2)] : 0

  const spark12 = monthlyAdmissions(allAdmissions, 12, new Date()).values

  /* ── flow-card styles (V1 strip) ── */
  // CC card language (iPad 3 reskin 2026-09-02): white on sage, HAIR hairline, no shadow;
  // StatBand type ramp — 13px caps FAINT label over the warm VALUE figure.
  const flowCardSx = {
    ...skin.cardSx,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    p: 3.5
  }
  const flowLabelSx = { fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: skin.FAINT, whiteSpace: 'nowrap' }
  const flowValueSx = { fontSize: '28px', fontWeight: 800, color: skin.VALUE, lineHeight: 1.2, mt: 0.5, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }

  const s = rollup.surgery
  const rate = (compl: number, total: number) => (total ? Math.round((compl / total) * 100) : 0)

  const losTotal = Math.max(1, buckets.reduce((n, b) => n + b.items.length, 0))
  const past14Pct = Math.round((((buckets[3]?.items.length ?? 0) + (buckets[4]?.items.length ?? 0)) / losTotal) * 100)

  const segStrip = (
    segs: { key: string; pct: number; color: string; text?: string; onClick?: () => void }[],
    labels: { pct: number; text: React.ReactNode }[]
  ) => (
    <>
      <Box sx={{ display: 'flex', height: 30, borderRadius: '8px', overflow: 'hidden' }}>
        {segs.map(g => (
          <Box
            key={g.key}
            onClick={g.onClick}
            sx={{
              width: `${g.pct}%`,
              backgroundColor: g.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: theme.palette.common.white,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              cursor: g.onClick ? 'pointer' : 'default',
              '&:hover': g.onClick ? { filter: 'brightness(1.08)' } : undefined
            }}
          >
            {g.pct >= 4 ? g.text : ''}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', mt: 1 }}>
        {labels.map((l, i) => (
          <Typography
            key={i}
            // overflow visible: narrow segments (e.g. "1–3 d", "30 d +") keep their full
            // label, spilling symmetrically past the segment instead of ellipsizing.
            sx={{ width: `${l.pct}%`, fontSize: '14px', color: c.neutralSecondary, textAlign: 'center', px: '2px', whiteSpace: 'nowrap', overflow: 'visible' }}
          >
            {l.text}
          </Typography>
        ))}
      </Box>
    </>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Row 1 · section header — heading left, time window right (no orphan control row) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        {/* plain title — the verdict headline pattern was retired with the Medical reskin
            (2026-09-01); the signals band below carries the story */}
        <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
          Hospital Overview
        </Typography>
        <DashboardDateRange value={range} onChange={setRange} />
      </Box>

      {/* Row 1b · triage signals — the standard StatBand strip (the dark V5 band retired
          with the iPad 3 reskin, 2026-09-02); counts wear CORAL, hints stay as quiet lines */}
      <SignalsBand
        cells={triage.map(t => ({ key: t.key, label: t.label, count: t.count, onOpen: t.onClick }))}
      />

      {/* Row 2 · FLOW strip — capacity/flow stats with micro-viz (risk lives on the triage board).
          Always one row of three, matching the triage strip above. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
        {/* In care now */}
        <Box
          onClick={openNow}
          sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>In care now</Typography>
            <Typography sx={flowValueSx}>{rollup.hospitalisedNow}</Typography>
          </Box>
        </Box>

        {/* Admissions + sparkline */}
        <Box onClick={openAdmissions} sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>Admissions</Typography>
            <Typography sx={flowValueSx}>{adms.length.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ ml: 'auto', flexShrink: 0 }}>
            <AreaSpark values={spark12} color={skin.ACCENT_FILL} />
          </Box>
        </Box>

        {/* Avg stay + stay-mix bars */}
        <Box onClick={openStays} sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>Avg stay</Typography>
            <Typography sx={flowValueSx}>{avgStay} D</Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'flex-end', gap: 1, height: 46, flexShrink: 0 }}>
            {buckets.map((b, i) => {
              const maxB = Math.max(1, ...buckets.map(x => x.items.length))
              const color = i <= 1 ? skin.ACCENT_FILL : i === 2 ? skin.TONE_FILL.warn : skin.CORAL

              return (
                <Box
                  key={b.label}
                  sx={{ width: 12, height: `${Math.max(4, (b.items.length / maxB) * 46)}px`, borderRadius: '3px 3px 0 0', backgroundColor: color }}
                />
              )
            })}
          </Box>
        </Box>

      </Box>

      {/* Row 3 · admissions trend — full width (Outcomes + By-Hospital cards retired
          2026-09-02: their lists live in the Hospitalised Animals section below) */}
      {(() => {
        const losContent = (
          <>
          <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, mb: 3 }}>
            <Box component='span' sx={{ fontWeight: 700, color: skin.CORAL }}>
              {past14Pct}%
            </Box>{' '}
            of the {losTotal.toLocaleString()} admissions run past 14 days
          </Typography>
          {segStrip(
            buckets.map((b, i) => ({
              key: b.label,
              pct: (b.items.length / losTotal) * 100,
              color: [skin.ACCENT_FILL, skin.ACCENT_FILL, skin.TONE_FILL.warn, skin.CORAL, skin.TONE_TYPE.bad][i],
              text: String(b.items.length),
              onClick: () => openBucket(b.label)
            })),
            buckets.map(b => ({ pct: (b.items.length / losTotal) * 100, text: b.label }))
          )}
          </>
        )

        const surgeryTitle = `Surgery • ${s.total.toLocaleString()}`
        // Complications metric dropped (user 2026-08-24: not decision-useful) —
        // the card is just the count + where surgeries happen.
        const surgeryBody = (
          <>
          <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, mb: 3 }}>
            Where this species&apos; surgeries happen
          </Typography>
          {segStrip(
            [
              { key: 'hospital', pct: rate(s.hospital, s.total), color: skin.TAB_PILL, text: `In hospital • ${s.hospital}`, onClick: () => openSurgery('hospital') },
              { key: 'field', pct: rate(s.field, s.total), color: skin.ACCENT_FILL, text: `Field • ${s.field}`, onClick: () => openSurgery('field') }
            ],
            [
              { pct: rate(s.hospital, s.total), text: `${rate(s.hospital, s.total)}%` },
              { pct: rate(s.field, s.total), text: `${rate(s.field, s.total)}%` }
            ]
          )}
          </>
        )

        return (
          <>
            <SectionCard
              title='Admissions Trend • Per Month'
              // THE standard period control (user call 2026-09-06): pill 1Y|2Y|3Y|Custom +
              // capped year From/To — the CoL/Eggs grammar (SickTrendCard verbatim).
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
              titleMb={4}
            >
              <TrendAreaChart values={trend.values} labels={trend.labels} color={skin.ACCENT_FILL} name='Admissions' height={230} onPointClick={openMonth} />
            </SectionCard>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 4, alignItems: 'stretch' }}>
              <SectionCard title='Length of Stay' titleMb={2}>
                {losContent}
              </SectionCard>
              <SectionCard title={surgeryTitle} titleMb={2}>
                {surgeryBody}
              </SectionCard>
            </Box>
          </>
        )
      })()}

      {/* Row 4 · the patients themselves — Admitted / Discharged / Mortality (user call
          2026-09-02, replacing the Outcomes donut + by-hospital rollup) */}
      <AdmissionsSection admissions={allAdmissions} portrait={portrait} onAnimal={aid => setRecordAid(aid)} />

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} onClose={() => setRecordAid(null)} />
    </Box>
  )
}

export default HospitalTab
