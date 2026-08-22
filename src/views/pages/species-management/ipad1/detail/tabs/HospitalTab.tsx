'use client'

/*
 * Hospital tab — species-scoped hospitalisation rollup, derived from the clinical sidecar
 * (see ./hospital/hospital.ts). Management lens: how many of THIS species' animals are in
 * hospital care now, the admissions trend over time, who keeps coming back, which hospital
 * carries the load, length-of-stay + outcome shape, and surgery (hospital + field).
 * Kit-first: detailUi charts + the Medical SignalsBand/SignalDrawer/AnimalHealthRecord flow.
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { alpha, lighten, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical } from 'src/lib/api/species-management/detail'
import type { GridColDef } from '@mui/x-data-grid'
import {
  CellText,
  DetailTable,
  Donut,
  EmptyState,
  SectionCard,
  TrendAreaChart,
  TrendRangeTabs,
  useTone
} from 'src/views/pages/species-management/ipad1/detail/detailUi'
import DashboardDateRange, {
  resolveRange,
  type RangePreset,
  type RangeSelection
} from 'src/views/pages/species-management/ipad1/dashboard/DashboardDateRange'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
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
  pill: a.outcome === 'died' ? 'Died' : a.status === 'active' ? `Admitted • ${a.durationDays} d` : `Discharged • ${a.durationDays} d`,
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

/* ── donut legend row (count + share, tone dot) ──────────────────────────── */
const LegendRow: React.FC<{ tone: Parameters<ReturnType<typeof useTone>>[0]; label: string; value: number; total: number; sub?: string }> = ({
  tone,
  label,
  value,
  total,
  sub
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const pct = total ? Math.round((value / total) * 100) : 0

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.25 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: tones(tone).fg, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '16px', color: c.OnSurfaceVariant, flex: 1, minWidth: 0 }} noWrap>
        {label}
        {sub && (
          <Box component='span' sx={{ color: c.neutralSecondary }}>
            {' '}
            • {sub}
          </Box>
        )}
      </Typography>
      <Typography sx={{ fontSize: '16px', fontWeight: 700, color: c.OnSurfaceVariant }}>{value.toLocaleString()}</Typography>
      <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, width: 44, textAlign: 'right' }}>{pct}%</Typography>
    </Box>
  )
}

/* ── main tab ────────────────────────────────────────────────────────────── */
interface Props {
  clinical?: SpeciesClinical | null
}

const HospitalTab: React.FC<Props> = ({ clinical }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [range, setRange] = useState<RangeSelection>({ preset: 'all', start: null, end: null })
  const [trendRange, setTrendRange] = useState<RangePreset>('last_1y')
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const [recordAid, setRecordAid] = useState<string | null>(null)
  const inWin = useWindow(range)

  const rollup = useMemo(() => computeHospital(clinical, inWin), [clinical, range])
  const allAdmissions = useMemo(() => buildAdmissions(clinical), [clinical])
  const trend = useMemo(
    () =>
      monthlyAdmissions(
        allAdmissions,
        trendRange === 'all' ? null : trendRange === 'last_2y' ? 24 : trendRange === 'last_3y' ? 36 : 12,
        new Date()
      ),
    [allAdmissions, trendRange]
  )
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
        .map(a => animalRow(a, `admitted ${a.currentStayDays} days`, `${a.currentStayDays} d`, 'warning'))
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
      animals: (rollup?.longStay ?? []).map(a => animalRow(a, `admitted ${a.currentStayDays} days`, `${a.currentStayDays} d`, 'warning'))
    })

  const openMortality = () =>
    setDrill({
      title: 'Mortality This Period',
      explainer: 'Admissions that ended in death rather than discharge — case review recommended.',
      icon: 'mdi:heart-pulse',
      tone: 'error',
      animals: (rollup?.mortality ?? []).map(admissionRow)
    })

  const openHospital = (name: string) =>
    setDrill({
      title: name,
      explainer: 'Every admission of this species treated at this hospital in the period.',
      icon: 'mdi:hospital-building',
      tone: 'neutral',
      animals: (rollup?.admissions ?? []).filter(a => a.hospital === name).map(admissionRow)
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

  const openOutcome = (kind: 'recovered' | 'died') => {
    const adms = rollup?.admissions ?? []
    const list = kind === 'died' ? adms.filter(a => a.outcome === 'died') : adms.filter(a => a.status === 'resolved' && a.outcome !== 'died')
    setDrill({
      title: kind === 'died' ? 'Died in Care' : 'Recovered & discharged',
      icon: kind === 'died' ? 'mdi:heart-pulse' : 'mdi:check-circle-outline',
      tone: kind === 'died' ? 'error' : 'neutral',
      animals: list.map(admissionRow)
    })
  }

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
      hint: rollup.longStay.length ? `longest ${rollup.longStay[0].currentStayDays} d` : 'none currently',
      onClick: openLong
    }
  ]

  /* ── outcome shape ── */
  const adms = rollup.admissions
  const died = adms.filter(a => a.outcome === 'died').length
  const stillIn = adms.filter(a => a.status === 'active').length
  const recovered = Math.max(0, adms.length - died - stillIn)
  const closed = recovered + died
  const recoveryPct = closed ? Math.round((recovered / closed) * 100) : 0

  /* ── flow-strip derivations (V1: capacity/flow stats, NOT the risk signals) ── */
  const durations = adms.map(a => a.durationDays).filter(d => d > 0).sort((x, y) => x - y)
  const avgStay = durations.length ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10 : 0
  const medianStay = durations.length ? durations[Math.floor(durations.length / 2)] : 0

  // Δ vs the previous window of equal length (hidden on "All time" — no previous period).
  const { from: winFrom, to: winTo } = resolveRange(range, new Date())
  let deltaPct: number | null = null
  if (winFrom) {
    const span = winTo.getTime() - winFrom.getTime()
    const prevCount = allAdmissions.filter(a => {
      const t = new Date(a.admittedOn).getTime()

      return !isNaN(t) && t >= winFrom.getTime() - span && t < winFrom.getTime()
    }).length
    if (prevCount > 0) deltaPct = Math.round(((adms.length - prevCount) / prevCount) * 100)
  }
  const spark12 = monthlyAdmissions(allAdmissions, 12, new Date()).values

  /* ── flow-card styles (V1 strip) ── */
  const flowCardSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    borderRadius: '10px',
    border: `1px solid ${c.SurfaceVariant}`,
    backgroundColor: theme.palette.background.paper,
    p: 3.5,
    transition: 'box-shadow .15s ease'
  }
  const flowLabelSx = { fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.neutralSecondary, whiteSpace: 'nowrap' }
  const flowValueSx = { fontSize: '28px', fontWeight: 800, color: c.OnSurface, lineHeight: 1.2, mt: 0.5, whiteSpace: 'nowrap' }
  const flowSubSx = { fontSize: '15px', color: c.neutralSecondary, mt: '2px', whiteSpace: 'nowrap' }

  const s = rollup.surgery
  const rate = (compl: number, total: number) => (total ? Math.round((compl / total) * 100) : 0)

  /* ── V9 “Ops tables” — standard DetailTable columns (Load/Share bars dropped per user) ── */
  const losTotal = Math.max(1, buckets.reduce((n, b) => n + b.items.length, 0))
  const past14Pct = Math.round((((buckets[3]?.items.length ?? 0) + (buckets[4]?.items.length ?? 0)) / losTotal) * 100)
  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )
  const pillSx = (bg: string, fg: string) =>
    ({ display: 'inline-block', fontSize: '14px', fontWeight: 700, borderRadius: '20px', px: '10px', py: '3px', backgroundColor: bg, color: fg, lineHeight: 1.4 }) as const

  const TABLE_CAP = 5
  const hospCols: GridColDef[] = [
    { minWidth: 180, flex: 1, sortable: false, field: 'name', headerName: 'Hospital', renderCell: p => txt(p.row.name, c.OnSurfaceVariant, 600) },
    { width: 170, sortable: false, field: 'animals', headerName: 'Admissions', renderCell: p => txt(p.row.animals, p.row.hot ? c.Tertiary : undefined, 700) },
    {
      width: 110,
      sortable: false,
      field: 'deaths',
      headerName: 'Died',
      renderCell: p =>
        p.row.deaths ? (
          <Box component='span' sx={pillSx(alpha(c.rusticRed, 0.1), c.rusticRed)}>
            {p.row.deaths}
          </Box>
        ) : (
          txt('—')
        )
    }
  ]
  const hospRows = rollup.byHospital.slice(0, TABLE_CAP).map((h, i) => ({ ...h, id: i }))

  /* "View all" lives in the card's title row, right corner — opens the side sheet (Lab pattern). */
  const viewAllSx = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.primary.dark,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': { textDecoration: 'underline' }
  } as const
  const ViewAllAction: React.FC<{ count: number; noun: string; onOpen: () => void }> = ({ count, noun, onOpen }) =>
    count > TABLE_CAP ? (
      <Typography onClick={onOpen} sx={viewAllSx}>
        View all {count} {noun} →
      </Typography>
    ) : null
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
            sx={{ width: `${l.pct}%`, fontSize: '14px', color: c.neutralSecondary, textAlign: 'center', px: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: c.OnSurfaceVariant, lineHeight: 1.35 }}>
          {rollup.repeatCount ? (
            <>
              <Box component='span' sx={{ color: c.Tertiary }}>
                {rollup.repeatCount} Animals
              </Box>{' '}
              Keep Coming Back
            </>
          ) : (
            'No Repeat Cases This Period'
          )}
        </Typography>
        <DashboardDateRange value={range} onChange={setRange} />
      </Box>

      {/* Row 1b · slim dark triage strip (V5 style) — number · label/hint · chevron, divided segments */}
      <Box
        sx={{
          bgcolor: 'customColors.chatBubbleSent',
          borderRadius: '12px',
          px: 6,
          py: 4.5,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
          gap: 4
        }}
      >
        {triage.map((t, i) => (
          <Box
            key={t.key}
            onClick={t.onClick}
            sx={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 3.5,
              cursor: 'pointer',
              borderLeft: { lg: i === 0 ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.12)}` },
              pl: { lg: i === 0 ? 0 : 5 },
              '&:hover .triage-arr': { color: theme.palette.common.white }
            }}
          >
            <Typography
              sx={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.1, color: t.urgent ? lighten(c.Tertiary, 0.3) : theme.palette.common.white }}
            >
              {t.count}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.common.white, lineHeight: 1.3 }} noWrap>
                {t.label}
              </Typography>
              <Typography sx={{ fontSize: '14px', color: alpha(theme.palette.common.white, 0.6), mt: '1px' }} noWrap>
                {t.hint}
              </Typography>
            </Box>
            <Box
              className='triage-arr'
              sx={{ ml: 'auto', display: 'flex', color: alpha(theme.palette.common.white, 0.45), transition: 'color .15s ease', flexShrink: 0 }}
            >
              <Icon icon='mdi:chevron-right' fontSize={20} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Row 2 · FLOW strip — capacity/flow stats with micro-viz (risk lives on the triage board) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {/* In care now */}
        <Box
          onClick={openNow}
          sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>In care now</Typography>
            <Typography sx={flowValueSx}>{rollup.hospitalisedNow}</Typography>
            <Typography sx={flowSubSx}>of {rollup.animalCount.toLocaleString()} animals</Typography>
          </Box>
        </Box>

        {/* Admissions + sparkline */}
        <Box onClick={openAdmissions} sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>Admissions</Typography>
            <Typography sx={flowValueSx}>{adms.length.toLocaleString()}</Typography>
            {deltaPct != null ? (
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: theme.palette.primary.dark, whiteSpace: 'nowrap' }}>
                {deltaPct > 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs prev period
              </Typography>
            ) : (
              <Typography sx={flowSubSx}>this period</Typography>
            )}
          </Box>
          <Box sx={{ ml: 'auto', flexShrink: 0 }}>
            <AreaSpark values={spark12} color={theme.palette.primary.main} />
          </Box>
        </Box>

        {/* Avg stay + stay-mix bars */}
        <Box onClick={openStays} sx={{ ...flowCardSx, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={flowLabelSx}>Avg stay</Typography>
            <Typography sx={flowValueSx}>{avgStay} d</Typography>
            <Typography sx={flowSubSx}>median {medianStay} d</Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'flex-end', gap: 1, height: 46, flexShrink: 0 }}>
            {buckets.map((b, i) => {
              const maxB = Math.max(1, ...buckets.map(x => x.items.length))
              const color = i <= 1 ? theme.palette.primary.main : i === 2 ? theme.palette.warning.main : c.Tertiary

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

      {/* Row 3 · admissions trend + outcomes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 4 }}>
        <SectionCard
          title='Admissions Trend • Per Month'
          action={<TrendRangeTabs value={trendRange} onPick={setTrendRange} color={theme.palette.primary.dark} />}
          titleMb={4}
        >
          <TrendAreaChart values={trend.values} labels={trend.labels} color={theme.palette.primary.main} name='Admissions' height={230} onPointClick={openMonth} />
        </SectionCard>

        <SectionCard title='Outcomes' titleMb={2}>
          <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, mb: 3 }}>
            How the {closed.toLocaleString()} completed cases in this period ended
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <Donut
              segments={[
                { label: 'Recovered', value: recovered, tone: 'success' },
                { label: 'Died', value: died, tone: 'danger' }
              ]}
              centerValue={`${recoveryPct}%`}
              centerSub='recovered'
              size={160}
            />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box onClick={() => openOutcome('recovered')} sx={{ cursor: 'pointer', borderRadius: '6px', px: 1, mx: -1, '&:hover': { backgroundColor: c.Surface } }}>
                <LegendRow tone='success' label='Recovered' value={recovered} total={closed} />
              </Box>
              <Box onClick={() => openOutcome('died')} sx={{ cursor: 'pointer', borderRadius: '6px', px: 1, mx: -1, '&:hover': { backgroundColor: c.Surface } }}>
                <LegendRow tone='danger' label='Died' value={died} total={closed} />
              </Box>
            </Box>
          </Box>
        </SectionCard>
      </Box>

      {/* Row 4 · by hospital + length of stay / surgery */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 4 }}>
        <SectionCard
          title='Admissions by Hospital'
          titleMb={2}
          action={
            <ViewAllAction
              count={rollup.byHospital.length}
              noun='hospitals'
              onOpen={() =>
                setDrill({
                  title: 'Admissions by Hospital',
                  explainer: 'Every admission of this species this period, across all treating hospitals.',
                  icon: 'mdi:hospital-building',
                  tone: 'neutral',
                  animals: rollup.admissions.map(admissionRow)
                })
              }
            />
          }
        >
          <DetailTable
            columns={hospCols}
            rows={hospRows}
            total={hospRows.length}
            hideFooter
            onRowClick={(p: any) => openHospital(p.row.name)}
          />
        </SectionCard>

        <SectionCard title='Length of Stay' titleMb={2}>
          <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, mb: 3 }}>
            <Box component='span' sx={{ fontWeight: 700, color: c.Tertiary }}>
              {past14Pct}%
            </Box>{' '}
            of the {losTotal.toLocaleString()} admissions run past 14 days
          </Typography>
          {segStrip(
            buckets.map((b, i) => ({
              key: b.label,
              pct: (b.items.length / losTotal) * 100,
              color: [theme.palette.primary.main, theme.palette.primary.main, c.moderateSecondary, c.Tertiary, c.TertiaryDark][i],
              text: String(b.items.length),
              onClick: () => openBucket(b.label)
            })),
            buckets.map(b => ({ pct: (b.items.length / losTotal) * 100, text: b.label }))
          )}

          <Box sx={{ mt: 10 }} />

          <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, mb: 2 }}>
            {`Surgery • ${s.total.toLocaleString()}`}
          </Typography>
          <Typography component='div' sx={{ fontSize: '15px', color: c.neutralSecondary, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            Complications — hospital
            <Box component='span' sx={pillSx(c.Notes, c.OnSurfaceVariant)}>
              {s.hospitalComplications} of {s.hospital} • {rate(s.hospitalComplications, s.hospital)}%
            </Box>
            field
            <Box component='span' sx={pillSx(alpha(theme.palette.primary.main, 0.12), theme.palette.primary.dark)}>
              {s.fieldComplications} of {s.field} • {rate(s.fieldComplications, s.field)}%
            </Box>
          </Typography>
          {segStrip(
            [
              { key: 'hospital', pct: rate(s.hospital, s.total), color: c.chatBubbleSent, text: `In hospital • ${s.hospital}`, onClick: () => openSurgery('hospital') },
              { key: 'field', pct: rate(s.field, s.total), color: theme.palette.primary.main, text: `Field • ${s.field}`, onClick: () => openSurgery('field') }
            ],
            [
              { pct: rate(s.hospital, s.total), text: `${rate(s.hospital, s.total)}%` },
              { pct: rate(s.field, s.total), text: `${rate(s.field, s.total)}%` }
            ]
          )}
        </SectionCard>
      </Box>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} onAnimal={aid => setRecordAid(aid)} />
      <AnimalHealthRecord aid={recordAid} clinical={clinical} onClose={() => setRecordAid(null)} />
    </Box>
  )
}

export default HospitalTab
