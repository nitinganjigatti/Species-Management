'use client'

/*
 * Hospital tab — species-scoped hospitalisation rollup, derived from the clinical sidecar
 * (see ./hospital/hospital.ts). Management lens: how many of THIS species' animals are in
 * hospital care now, how many keep coming back, who's a long-stay, mortality, which hospital
 * carries the load, which origin sites feed re-admissions, and surgery (hospital + field).
 * Built entirely from the detailUi kit + the shared SignalDrawer (kit-first, no new sheet).
 */
import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical } from 'src/lib/api/species-management/detail'
import {
  EmptyState,
  SectionCard,
  StatTile
} from 'src/views/pages/species-management/detail3/detailUi'
import DashboardDateRange, {
  resolveRange,
  type RangeSelection
} from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import SignalDrawer, { type SignalDrawerPayload } from './medical/SignalDrawer'
import type { SignalAnimal } from './medical/signals'
import { computeHospital, type Admission, type HospAnimal, type HospitalRollup } from './hospital/hospital'

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
  enclosure: `${a.enclosure} · ${a.hospital}`,
  condition: a.condition,
  detail: '',
  date: a.admittedOn,
  pill: a.outcome === 'died' ? 'Died' : a.status === 'active' ? `Admitted · ${a.durationDays} d` : `Discharged · ${a.durationDays} d`,
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

/* ── hospital hotspot band (mirrors the Medical site-hotspots band) ──────── */
const HotspotBand: React.FC<{ rollup: HospitalRollup; onHospital: (name: string) => void }> = ({ rollup, onHospital }) => {
  const c = cc(useTheme() as any)
  const hot = rollup.byHospital.filter(h => h.hot)
  const top = rollup.byHospital.slice(0, 3)
  const others = rollup.byHospital.slice(3)

  return (
    <SectionCard title='By hospital — who carries the load' titleMb={2}>
      <Typography sx={{ fontSize: '14px', color: c.OnSurfaceVariant, mb: 2 }}>
        {hot.length ? (
          <>
            <b style={{ color: c.Tertiary }}>{hot.length} hospital{hot.length > 1 ? 's' : ''}</b> running above average
          </>
        ) : (
          'Caseload is even across hospitals'
        )}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
        {top.map(h => (
          <Box
            key={h.name}
            onClick={() => onHospital(h.name)}
            sx={{
              border: `1px solid ${c.SurfaceVariant}`,
              borderRadius: '10px',
              p: 3,
              cursor: 'pointer',
              transition: 'box-shadow .15s ease',
              '&:hover': { boxShadow: 2 }
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
              {h.name}
            </Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 700, color: h.hot ? c.Tertiary : c.OnSurface, lineHeight: 1, mt: 1 }}>
              {h.animals}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mt: 0.5 }}>
              animals · {h.longStay} long-stay · {h.deaths} died
            </Typography>
            {h.hot && (
              <Box sx={{ display: 'inline-block', mt: 1, px: 2, py: 0.5, borderRadius: '20px', bgcolor: c.BgTeritary }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: c.Tertiary }}>above average</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      {others.length > 0 && (
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '4px 40px' }}>
          {others.map(h => (
            <Box key={h.name} onClick={() => onHospital(h.name)} sx={{ display: 'flex', py: 1, cursor: 'pointer' }}>
              <Typography sx={{ fontSize: '13px', color: c.OnSurfaceVariant }}>{h.name}</Typography>
              <Typography sx={{ ml: 'auto', fontSize: '13px', color: c.neutralSecondary }}>{h.animals} animals</Typography>
            </Box>
          ))}
        </Box>
      )}
    </SectionCard>
  )
}

/* ── signals band — the four animal-level signals ────────────────────────── */
const SIGNAL_ICON = { repeat: 'mdi:repeat', long: 'mdi:timer-sand', site: 'mdi:map-marker-alert', mortality: 'mdi:heart-pulse' } as const
const SignalsRow: React.FC<{ rollup: HospitalRollup; onOpen: (key: 'repeat' | 'long' | 'mortality') => void; onSite: () => void }> = ({
  rollup,
  onOpen,
  onSite
}) => {
  const c = cc(useTheme() as any)
  const items: { key: keyof typeof SIGNAL_ICON; n: number; title: string; d: string; onClick: () => void }[] = [
    { key: 'repeat', n: rollup.repeatCount, title: 'Repeatedly hospitalised', d: `2+ admissions · worst ${rollup.repeatWorst} times`, onClick: () => onOpen('repeat') },
    { key: 'long', n: rollup.longStay.length, title: 'Long stay > 7 days', d: rollup.longStay.length ? `still admitted · longest ${rollup.longStay[0].currentStayDays} d` : 'none currently', onClick: () => onOpen('long') },
    { key: 'site', n: rollup.repeatBySite.length, title: 'Sites sending repeat cases', d: 'same sites feed re-admissions', onClick: onSite },
    { key: 'mortality', n: rollup.mortality.length, title: 'Mortality this period', d: `rate ${rollup.mortalityRate}%`, onClick: () => onOpen('mortality') }
  ]

  return (
    <Box sx={{ bgcolor: c.BgTeritary, borderRadius: '12px', p: 3 }}>
      <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.OnSurface, mb: 0.25 }}>
        <b style={{ color: c.Tertiary }}>{rollup.repeatCount} animals keep coming back</b> — repeat hospitalisation concentrates in a few sites
      </Typography>
      <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mb: 2 }}>Highest-risk animals for this species · click any signal for the list</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '0 40px' }}>
        {items.map((it, i) => (
          <Box
            key={it.key}
            onClick={it.onClick}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              py: 2,
              cursor: 'pointer',
              borderBottom: i < items.length - (items.length % 2 === 0 ? 2 : 1) ? '0.5px solid rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Box sx={{ width: 38, height: 38, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon icon={SIGNAL_ICON[it.key]} fontSize={18} color={c.OnSurfaceVariant} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '15px', color: c.OnSurfaceVariant }}>
                <b style={{ fontSize: '19px', color: c.OnSurface }}>{it.n}</b>&nbsp;&nbsp;
                <Box component='span' sx={{ fontWeight: 600 }}>{it.title}</Box>
              </Typography>
              <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mt: 0.25 }}>{it.d}</Typography>
            </Box>
            <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} style={{ alignSelf: 'center' }} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/* ── surgery split (hospital + field) ────────────────────────────────────── */
const SurgeryCard: React.FC<{ rollup: HospitalRollup; onOpen: (loc: 'hospital' | 'field') => void }> = ({ rollup, onOpen }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const s = rollup.surgery
  const rate = (compl: number, total: number) => (total ? Math.round((compl / total) * 100) : 0)

  return (
    <SectionCard title='Surgery' titleMb={1}>
      <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mb: 2 }}>
        Across hospital + field · {s.total} performed
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box onClick={() => onOpen('hospital')} sx={{ flex: 1, border: `1px solid ${c.SurfaceVariant}`, borderRadius: '10px', p: 2.5, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.secondary.main }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: c.OnSurfaceVariant }}>In hospital</Typography>
          </Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, color: c.OnSurface, mt: 0.5 }}>{s.hospital}</Typography>
          <Typography sx={{ fontSize: '12px', color: c.neutralSecondary }}>
            complications <b style={{ color: c.Tertiary }}>{s.hospitalComplications}</b> · {rate(s.hospitalComplications, s.hospital)}%
          </Typography>
        </Box>
        <Box onClick={() => onOpen('field')} sx={{ flex: 1, bgcolor: c.antzSecondaryBg, borderRadius: '10px', p: 2.5, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.Tertiary }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: c.OnSurfaceVariant }}>On-site (field)</Typography>
          </Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, color: c.OnSurface, mt: 0.5 }}>{s.field}</Typography>
          <Typography sx={{ fontSize: '12px', color: c.neutralSecondary }}>
            complications <b style={{ color: c.Tertiary }}>{s.fieldComplications}</b> · {rate(s.fieldComplications, s.field)}%
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mt: 2 }}>
        Field surgery = the doctor travelled to the enclosure. Same surgery record + medical history as a hospital surgery.
      </Typography>
    </SectionCard>
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
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)
  const inWin = useWindow(range)

  const rollup = useMemo(() => computeHospital(clinical, inWin), [clinical, range])

  const openRepeat = () =>
    setDrill({
      title: 'Repeatedly hospitalised',
      explainer: 'Animals admitted 2 or more times — fragile animals that keep needing hospital care.',
      icon: 'mdi:repeat',
      tone: 'warning',
      animals: (rollup?.animals ?? [])
        .filter(a => a.admissionCount >= 2)
        .sort((x, y) => y.admissionCount - x.admissionCount)
        .map(a => animalRow(a, `${a.admissionCount} admissions`, `${a.admissionCount} times`, 'error'))
    })

  const openLong = () =>
    setDrill({
      title: 'Long stay — over 7 days',
      explainer: 'Animals currently admitted longer than 7 days — not recovering on the current course, or overdue a review.',
      icon: 'mdi:timer-sand',
      tone: 'warning',
      animals: (rollup?.longStay ?? []).map(a => animalRow(a, `admitted ${a.currentStayDays} days`, `${a.currentStayDays} d`, 'warning'))
    })

  const openMortality = () =>
    setDrill({
      title: 'Mortality this period',
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

  const openSite = () =>
    setDrill({
      title: 'Sites sending repeat cases',
      explainer: 'Origin sites whose animals keep returning to hospital — an upstream welfare signal worth investigating.',
      icon: 'mdi:map-marker-alert',
      tone: 'warning',
      animals: (rollup?.animals ?? [])
        .filter(a => a.admissionCount >= 2)
        .sort((x, y) => y.admissionCount - x.admissionCount)
        .map(a => animalRow(a, `${a.admissionCount} admissions · ${a.site}`, `${a.admissionCount} times`, 'error'))
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: `1px solid ${c.SurfaceVariant}`, pb: 1.5 }}>
        <DashboardDateRange value={range} onChange={setRange} />
      </Box>

      {/* headline: population in care now */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        <StatTile label='Hospitalised now' value={rollup.hospitalisedNow} sub={`${rollup.inpatientNow} inpatient · ${rollup.outpatientNow} outpatient`} />
        <StatTile label='Repeatedly hospitalised' value={rollup.repeatCount} sub='2+ admissions' tone={rollup.repeatCount ? 'error' : 'neutral'} onClick={openRepeat} />
        <StatTile
          label='Long stay > 7 days'
          value={rollup.longStay.length}
          sub={rollup.longStay.length ? `longest ${rollup.longStay[0].currentStayDays} d` : 'none'}
          tone={rollup.longStay.length ? 'warning' : 'neutral'}
          onClick={openLong}
        />
        <StatTile label='Mortality rate' value={`${rollup.mortalityRate}%`} sub={`${rollup.mortality.length} died`} tone={rollup.mortality.length ? 'error' : 'neutral'} onClick={openMortality} />
      </Box>

      {/* signals band */}
      <SignalsRow rollup={rollup} onOpen={key => (key === 'repeat' ? openRepeat() : key === 'long' ? openLong() : openMortality())} onSite={openSite} />

      {/* by hospital */}
      <HotspotBand rollup={rollup} onHospital={openHospital} />

      {/* repeat by site + surgery */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <SectionCard title='Repeat hospitalisation by site' titleMb={1}>
          <Typography sx={{ fontSize: '12px', color: c.neutralSecondary, mb: 2 }}>Which origin sites keep sending the same animals back</Typography>
          {rollup.repeatBySite.length === 0 && <Typography sx={{ fontSize: '13px', color: c.neutralSecondary }}>No repeat admissions in this period.</Typography>}
          {rollup.repeatBySite.map((s, i) => (
            <Box key={s.site} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: i < rollup.repeatBySite.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none' }}>
              <Typography sx={{ fontSize: '14px', color: c.OnSurfaceVariant }}>{s.site}</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: i < 2 ? c.Tertiary : c.neutralSecondary }}>
                {s.animals} animals · {s.admissions} admissions
              </Typography>
            </Box>
          ))}
        </SectionCard>

        <SurgeryCard rollup={rollup} onOpen={openSurgery} />
      </Box>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} />
    </Box>
  )
}

export default HospitalTab
