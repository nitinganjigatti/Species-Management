'use client'

/*
 * Animal health record — the level-4 surface of the hotspot flow (band → sites sheet → site
 * sheet → THIS). A full-width overlay (large dialog, NOT another stacked side sheet): identity
 * header + status, KPI strip, an action column (Active now / Overdue care / Upcoming) and the
 * full filterable timeline. Un-windowed on purpose — the record answers "what is going on with
 * THIS animal", not "this period".
 */
import React, { useMemo, useState } from 'react'
import { Avatar, Box, Dialog, IconButton, MenuItem, Select, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { ClinicalRecord, SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { EmptyState, SelectChevron, StatusChip } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { fmtDate } from './signals'
import { buildAdmissions } from '../hospital/hospital'
import { buildLabRequests } from '../lab/lab'
import { openSurgeryReport } from './surgeryReport'

const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'
const DAY_MS = 86400000
const PROGRAM_LABEL: Record<string, string> = { vaccination: 'vaccination', deworming: 'deworming', supplements: 'supplement' }

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

type EvKind = 'active' | 'resolved' | 'died' | 'care' | 'overdue' | 'hospital' | 'surgery' | 'lab'
interface TimelineEvent {
  date: string
  kind: EvKind
  title: string
  /** Status chip after the title. Absent on open hospital stays — those use `boldLead` instead. */
  chip?: string
  when: string // the rendered date line ("29 May 2026 → 12 Jun 2026" for resolved spans)
  sub?: string
  /** "Label ● Value" second line (Severity ● Medium / Prognosis ● Guarded) — rendered with the big dot separator. */
  subParts?: { label: string; value: string }
  /** Bold text lead on the sub line (episode view: "Inpatient" for a not-yet-discharged stay). */
  boldLead?: string
  /** Nested sub-events of this episode (a surgery during a hospital stay). */
  children?: TimelineEvent[]
  /** Rendered muted — the item is only shown as parent context for a filtered child. */
  isContext?: boolean
  /** Coral alert line (surgery complications). */
  alert?: string
  /** Click-through (surgery → print-styled report in a new tab). */
  onOpen?: () => void
}

const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString().slice(0, 10)

const AnimalHealthRecord: React.FC<{
  aid: string | null
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
  onClose: () => void
}> = ({ aid, clinical, preventive, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [tab, setTab] = useState<'all' | 'active' | 'resolved' | 'hospital' | 'surgery' | 'lab' | 'care'>('all')

  const data = useMemo(() => {
    if (!aid) return null
    const symRecs: ClinicalRecord[] = (clinical?.programs?.symptoms?.records ?? []).filter(r => r.aid === aid)
    const diagRecs: ClinicalRecord[] = (clinical?.programs?.diagnosis?.records ?? []).filter(r => r.aid === aid)
    const clin: ClinicalRecord[] = [...symRecs, ...diagRecs]

    const overdue: { program: string; type: string; due: string; days: number }[] = []
    const upcoming: { program: string; type: string; due: string }[] = []
    const care: { date: string; title: string; program: string; sub?: string }[] = []
    let identity: { name: string; site: string; enclosure: string } | null = clin.length
      ? { name: clin[0].name, site: clin[0].site, enclosure: clin[0].enclosure }
      : null

    for (const key of ['vaccination', 'deworming', 'supplements'] as const) {
      const prog = preventive?.programs?.[key]
      for (const r of prog?.records ?? []) {
        if (r.aid !== aid) continue
        identity = identity ?? { name: r.name, site: r.site, enclosure: r.enclosure }
        if (r.status === 'overdue') overdue.push({ program: PROGRAM_LABEL[key], type: r.type, due: r.due, days: r.days })
        else upcoming.push({ program: PROGRAM_LABEL[key], type: r.type, due: r.due })
      }

      // given-dose history rides the per-medicine animal samples (capped — show what's there)
      for (const t of prog?.types ?? []) {
        const an = t.animals.find(a => a.aid === aid)
        if (!an) continue
        an.doses.forEach((d, i) => {
          const amt = an.amounts?.[i]
          care.push({
            date: d,
            title: `${t.name} given`,
            program: PROGRAM_LABEL[key],
            sub: amt != null && t.dose ? `${amt} ${t.dose.unit}${t.dose.perKg ? ` · ${t.dose.qty} ${t.dose.unit}/kg` : ''}` : undefined
          })
        })
      }
    }
    overdue.sort((a, b) => b.days - a.days)
    upcoming.sort((a, b) => (a.due < b.due ? -1 : 1))

    const byDateDesc = (a: ClinicalRecord, b: ClinicalRecord) => (a.date < b.date ? 1 : -1)
    const activeSymptoms = symRecs.filter(r => r.status === 'active').sort(byDateDesc)
    const activeAssessments = diagRecs.filter(r => r.status === 'active').sort(byDateDesc)
    const active = [...activeSymptoms, ...activeAssessments].sort(byDateDesc)
    const resolved = clin.filter(r => r.status === 'resolved')

    // Hospitalisations — the SAME derivation the Hospital tab uses, so the record and the tab
    // always agree. Each admission (and each surgery) is its OWN timeline item, dated by the
    // activity date (no range).
    const hospAdms = buildAdmissions(clinical).filter(a => a.aid === aid)

    // Lab requests — the SAME derivation the Lab Module tab uses, so the record and the tab
    // always agree. One timeline item per request; the chip shows the result when one exists.
    const labReqs = buildLabRequests(clinical, new Date()).filter(r => r.aid === aid)

    const events: TimelineEvent[] = [
      ...active.map(r => ({
        date: r.date,
        kind: 'active' as EvKind,
        title: r.type,
        chip: `Active · ${r.durationDays} d`,
        when: fmtDate(r.date),
        // clinical assessments carry a prognosis — lead with that; symptoms show severity
        subParts: r.prognosis
          ? { label: 'Prognosis', value: r.prognosis }
          : r.severity
          ? { label: 'Severity', value: `${r.severity}${r.severityFrom ? ` (started ${r.severityFrom})` : ''}` }
          : undefined
      })),
      ...resolved.map(r => ({
        date: r.date,
        kind: (r.outcome === 'died' ? 'died' : 'resolved') as EvKind,
        title: r.type,
        chip: r.outcome === 'died' ? 'Died' : `Resolved in ${r.durationDays} days`,
        when: r.outcome === 'died' ? fmtDate(r.date) : `${fmtDate(r.date)} → ${fmtDate(addDays(r.date, r.durationDays))}`,
        subParts: r.prognosis
          ? { label: 'Prognosis', value: r.prognosis }
          : r.severity
          ? { label: 'Severity', value: r.severity }
          : undefined
      })),
      // Hospital stays — EPISODE view: range once discharged; open stays show the admitted
      // date with a bold "Inpatient" lead (no chip). An in-hospital surgery nests as a CHILD
      // of its stay; a field surgery (no stay) is its own top-level item.
      ...hospAdms.map(a => {
        const discharged = a.status !== 'active'

        return {
          date: a.admittedOn,
          kind: 'hospital' as EvKind,
          title: `Hospitalised — ${a.hospital}`,
          chip: a.outcome === 'died' ? 'Died in care' : discharged ? `Discharged · ${a.durationDays} d` : undefined,
          when: discharged ? `${fmtDate(a.admittedOn)} → ${fmtDate(addDays(a.admittedOn, a.durationDays))}` : fmtDate(a.admittedOn),
          boldLead: discharged ? undefined : 'Inpatient',
          sub: discharged ? `For ${a.condition}` : `admitted ${a.durationDays} d · For ${a.condition}`,
          children:
            a.surgery === 'hospital' && a.surgeryDetail
              ? [
                  {
                    date: a.admittedOn,
                    kind: 'surgery' as EvKind,
                    title: `${a.surgeryDetail.name} · in hospital`,
                    chip: 'Surgery',
                    when: fmtDate(a.admittedOn),
                    sub: `Surgeon ${a.surgeryDetail.surgeon} · ${a.surgeryDetail.durationMin} min · ${a.surgeryDetail.approach} approach`,
                    alert: a.surgeryDetail.complications,
                    onOpen: () => openSurgeryReport(a)
                  }
                ]
              : undefined
        }
      }),
      ...hospAdms
        .filter(a => a.surgery === 'field' && a.surgeryDetail)
        .map(a => ({
          date: a.admittedOn,
          kind: 'surgery' as EvKind,
          title: `${a.surgeryDetail!.name} · on-site (field)`,
          chip: 'Surgery',
          when: fmtDate(a.admittedOn),
          sub: `Surgeon ${a.surgeryDetail!.surgeon} · ${a.surgeryDetail!.durationMin} min · at enclosure · for ${a.condition}`,
          alert: a.surgeryDetail!.complications,
          onOpen: () => openSurgeryReport(a)
        })),
      // Lab requests — dated by the request date; chip = result when completed, status otherwise.
      ...labReqs.map(r => {
        const testsLabel = r.tests.length === 1 ? r.tests[0].name : `${r.tests[0].name} +${r.tests.length - 1}`
        const results = r.tests.map(t => t.result).filter(Boolean) as string[]
        const detection = results.find(x => x === 'positive' || x === 'detected')
        const offRange = results.find(x => x === 'high' || x === 'low')
        const chip =
          r.status === 'completed'
            ? detection
              ? detection === 'positive'
                ? 'Positive'
                : 'Detected'
              : offRange
              ? offRange === 'high'
                ? 'High'
                : 'Low'
              : 'Normal'
            : r.status === 'cancelled'
            ? 'Cancelled'
            : r.status === 'in_progress'
            ? 'In progress'
            : 'Pending'

        return {
          date: r.date,
          kind: 'lab' as EvKind,
          title: `Lab request — ${testsLabel}`,
          chip,
          when: fmtDate(r.date),
          sub: `${r.id} • ${r.doctor} • ${r.hospital ? `from ${r.hospital}` : 'routine screening'} • ${r.lab}`
        }
      }),
      ...care.map(e => ({ date: e.date, kind: 'care' as EvKind, title: e.title, chip: e.program, when: fmtDate(e.date), sub: e.sub })),
      ...overdue.map(o => ({
        date: o.due,
        kind: 'overdue' as EvKind,
        title: `${o.type} missed`,
        chip: `Overdue · ${o.days} d`,
        when: fmtDate(o.due)
      }))
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    const lastUpdate = events[0]

    // status rollup (same thresholds as the Overview attention table)
    const poor = active.some(r => r.prognosis === 'Poor' || r.prognosis === 'Grave')
    const status =
      active.length >= 2 || overdue.length >= 3 || poor
        ? { label: 'Critical', tone: 'error' as const }
        : active.length || overdue.length
        ? { label: 'Needs Attention', tone: 'warning' as const }
        : { label: 'Healthy', tone: 'success' as const }

    return { clin, active, activeSymptoms, activeAssessments, resolved, overdue, upcoming, events, identity, status, lastUpdate }
  }, [aid, clinical, preventive])

  const events = data?.events ?? []
  const careCount = events.filter(e => e.kind === 'care' || e.kind === 'overdue').length
  const hospCount = events.filter(e => e.kind === 'hospital').length
  const labCount = events.filter(e => e.kind === 'lab').length
  const surgeryCount =
    events.filter(e => e.kind === 'surgery').length + events.reduce((s, e) => s + (e.children?.length ?? 0), 0)

  /* Filter rule: a filter never orphans a child — Surgery shows in-stay surgeries WITH their
     parent stay rendered muted (isContext); Hospitalised keeps nested surgeries intact. */
  const shownEvents: TimelineEvent[] =
    tab === 'all'
      ? events
      : tab === 'active'
      ? events.filter(e => e.kind === 'active')
      : tab === 'resolved'
      ? events.filter(e => e.kind === 'resolved' || e.kind === 'died')
      : tab === 'hospital'
      ? events.filter(e => e.kind === 'hospital')
      : tab === 'surgery'
      ? events
          .filter(e => e.kind === 'surgery' || (e.kind === 'hospital' && e.children?.length))
          .map(e => (e.kind === 'hospital' ? { ...e, isContext: true } : e))
      : tab === 'lab'
      ? events.filter(e => e.kind === 'lab')
      : events.filter(e => e.kind === 'care' || e.kind === 'overdue')

  const dotColor: Record<EvKind, string> = {
    active: c.Tertiary,
    resolved: theme.palette.primary.main,
    died: c.OnSurfaceVariant,
    care: theme.palette.secondary.main,
    overdue: theme.palette.warning.dark,
    hospital: c.OnPrimaryContainer,
    surgery: c.Tertiary,
    lab: theme.palette.secondary.main
  }
  const chipSx: Record<EvKind, { bg: string; fg: string }> = {
    active: { bg: c.BgTeritary, fg: c.Tertiary },
    resolved: { bg: c.OnBackground, fg: theme.palette.primary.dark },
    died: { bg: c.SurfaceVariant, fg: c.OnSurfaceVariant },
    care: { bg: c.antzSecondaryBg, fg: theme.palette.secondary.dark },
    overdue: { bg: `${theme.palette.warning.main}29`, fg: theme.palette.warning.dark },
    hospital: { bg: c.displaybgPrimary, fg: c.OnPrimaryContainer },
    surgery: { bg: c.BgTeritary, fg: c.Tertiary },
    lab: { bg: c.antzSecondaryBg, fg: theme.palette.secondary.dark }
  }

  const kpi = (value: React.ReactNode, label: string, bad?: boolean) => (
    <Box
      sx={{
        backgroundColor: bad ? c.BgTeritary : c.displaybgPrimary,
        border: `1px solid ${bad ? 'transparent' : c.SurfaceVariant}`,
        borderRadius: '12px',
        px: 4,
        py: 3
      }}
    >
      <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: bad ? c.Tertiary : c.OnSurfaceVariant }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}>
        {label}
      </Typography>
    </Box>
  )

  const sectionHead = (icon: string, label: string, count: number, color: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, px: 3.5 }}>
      <Icon icon={icon} fontSize={15} color={color} />
      <Typography sx={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.66px', textTransform: 'uppercase', color }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, ml: 'auto' }}>{count}</Typography>
    </Box>
  )

  const Dot = () => (
    <Box
      component='span'
      sx={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', backgroundColor: c.Outline, mx: 1.75, verticalAlign: 'middle' }}
    />
  )

  // Menu-style row — mirrors the main-menu VerticalNavLink (borderRadius 8, icon + label,
  // active item = primary.light fill with white text). Replaces the old bordered mini-cards.
  const navRow = (icon: string, title: string, sub: React.ReactNode, active?: boolean) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        borderRadius: '8px',
        px: 3.5,
        py: 3.5,
        mb: 2,
        backgroundColor: active ? theme.palette.primary.light : 'transparent',
        '&:hover': { backgroundColor: active ? theme.palette.primary.light : c.Surface }
      }}
    >
      <Icon
        icon={icon}
        fontSize={22}
        color={active ? theme.palette.common.white : c.neutralSecondary}
        style={{ flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: active ? theme.palette.common.white : c.OnSurfaceVariant }} noWrap>
          {title}
        </Typography>
        <Typography
          sx={{ fontSize: '15px', color: active ? alpha(theme.palette.common.white, 0.85) : c.neutralSecondary, mt: '2px', lineHeight: 1.5 }}
        >
          {sub}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Dialog
      open={!!aid}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      PaperProps={{ sx: { borderRadius: '14px', height: '92vh', backgroundColor: 'common.white', backgroundImage: 'none' } }}
    >
      {data && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 6, pt: 5, pb: 4 }}>
            <Avatar
              src={ANTZ_LOGO}
              alt=''
              sx={{ width: 56, height: 56, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '7px' } }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: c.OnSurfaceVariant }} noWrap>
                {data.identity?.name ?? aid}
              </Typography>
              <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }}>
                {data.identity ? `${data.identity.site} · ${data.identity.enclosure}` : ''}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', textAlign: 'right', flexShrink: 0 }}>
              <StatusChip label={data.status.label} tone={data.status.tone} />
              {data.clin.length > 0 && (
                <Typography variant='caption' sx={{ display: 'block', color: c.neutralSecondary, mt: 1 }}>
                  Sick{' '}
                  <Box component='span' sx={{ fontWeight: 700, color: c.Tertiary }}>
                    {data.clin.length} times
                  </Box>{' '}
                  on record
                </Typography>
              )}
            </Box>
            <IconButton onClick={onClose} size='small' sx={{ alignSelf: 'flex-start' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>

          {/* KPI strip — pinned repeat(4,1fr) in BOTH orientations (stat bands never wrap) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, px: 6, pb: 5 }}>
            {kpi(data.active.length, 'Active conditions', data.active.length > 0)}
            {kpi(data.overdue.length, 'Overdue care', data.overdue.length > 0)}
            {kpi(data.resolved.length, 'Resolved')}
            {kpi(data.lastUpdate ? fmtDate(data.lastUpdate.date) : '—', 'Last update')}
          </Box>

          {/* body — orientation-driven: landscape keeps the rail | timeline columns,
              portrait stacks them as two independently-scrolling rows (rail on top) */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gridTemplateRows: 'minmax(0, 5fr) minmax(0, 7fr)',
              borderTop: `1px solid ${c.SurfaceVariant}`,
              '@media (orientation: landscape)': { gridTemplateColumns: '340px 1fr', gridTemplateRows: '1fr' }
            }}
          >
            {/* action column */}
            <Box
              sx={{
                overflowY: 'auto',
                px: 5,
                py: 4,
                borderBottom: `1px solid ${c.SurfaceVariant}`,
                '@media (orientation: landscape)': { borderBottom: 'none', borderRight: `1px solid ${c.SurfaceVariant}` }
              }}
            >
              {sectionHead('mdi:heart-pulse', 'Active now', data.active.length, c.Tertiary)}
              {data.activeSymptoms.length > 0 && (
                <>
                  <Typography
                    sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.neutralSecondary, px: 3.5, mb: 1.5 }}
                  >
                    Symptoms
                  </Typography>
                  {data.activeSymptoms.map(r =>
                    navRow(
                      'mdi:emoticon-sad-outline',
                      r.type,
                      <>
                        {fmtDate(r.date)}
                        <Dot />
                        <b>{r.durationDays} D</b>
                        {r.severity && (
                          <>
                            <Dot />
                            <b>{r.severity}</b>
                          </>
                        )}
                      </>,
                      true
                    )
                  )}
                </>
              )}
              {data.activeAssessments.length > 0 && (
                <>
                  {data.activeSymptoms.length > 0 && <Box sx={{ height: 12 }} />}
                  <Typography
                    sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.neutralSecondary, px: 3.5, mb: 1.5 }}
                  >
                    Clinical assessments
                  </Typography>
                  {data.activeAssessments.map(r =>
                    navRow(
                      'mdi:stethoscope',
                      r.type,
                      <>
                        {fmtDate(r.date)}
                        <Dot />
                        <b>{r.durationDays} D</b>
                        {r.prognosis && (
                          <>
                            <Dot />
                            <b>{r.prognosis}</b>
                          </>
                        )}
                      </>,
                      true
                    )
                  )}
                </>
              )}

              <Box sx={{ height: 20 }} />
              {sectionHead('mdi:clock-alert-outline', 'Overdue care', data.overdue.length, theme.palette.warning.dark)}
              {data.overdue.length ? (
                data.overdue.map((o, i) => (
                  <React.Fragment key={`${o.type}-${i}`}>
                    {navRow(
                      'mdi:clock-alert-outline',
                      o.type,
                      <>
                        {fmtDate(o.due)}
                        <Dot />
                        <b>{o.days} D late</b>
                      </>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Typography sx={{ fontSize: '15px', color: c.neutralSecondary, display: 'block', mb: 2, px: 3.5 }}>
                  No care is overdue.
                </Typography>
              )}

              {data.upcoming.length > 0 && (
                <>
                  <Box sx={{ height: 20 }} />
                  {sectionHead('mdi:calendar-outline', 'Upcoming', data.upcoming.length, theme.palette.secondary.dark)}
                  {data.upcoming.map((u, i) => (
                    <React.Fragment key={`${u.type}-${i}`}>
                      {navRow('mdi:calendar-outline', u.type, <>Scheduled {fmtDate(u.due)}</>)}
                    </React.Fragment>
                  ))}
                </>
              )}
            </Box>

            {/* timeline */}
            <Box sx={{ overflowY: 'auto', px: 6, py: 4 }}>
              {/* activity filter — dropdown (never orphans a child: Surgery keeps its parent stay as context) */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Select
                  size='small'
                  value={tab}
                  onChange={ev => setTab(ev.target.value as typeof tab)}
                  IconComponent={SelectChevron}
                  sx={{
                    height: skin.CONTROL_H,
                    minWidth: 280,
                    borderRadius: '999px',
                    bgcolor: '#ffffff',
                    fontSize: '16px',
                    '& .MuiSelect-select': { color: skin.INK2, fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER_HOVER },
                    // portrait: the filter spans the full timeline width (two-row header grammar)
                    '@media (orientation: portrait)': { width: '100%' }
                  }}
                >
                  {(
                    [
                      { key: 'all', label: 'All activity', n: data.events.length },
                      { key: 'active', label: 'Active conditions', n: data.active.length },
                      { key: 'resolved', label: 'Resolved', n: data.resolved.length },
                      { key: 'hospital', label: 'Hospitalised', n: hospCount },
                      { key: 'surgery', label: 'Surgery', n: surgeryCount },
                      { key: 'lab', label: 'Lab requests', n: labCount },
                      { key: 'care', label: 'Preventive care', n: careCount }
                    ] as const
                  ).map(t => (
                    <MenuItem key={t.key} value={t.key} sx={{ fontSize: '16px' }}>
                      {t.label}&nbsp;·&nbsp;<b>{t.n}</b>
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {shownEvents.length ? (
                <Box sx={{ position: 'relative', ml: 1, '&:before': { content: '""', position: 'absolute', left: 8, top: 10, bottom: 10, width: '2px', backgroundColor: c.SurfaceVariant } }}>
                  {shownEvents.map((e, i) => (
                    <Box key={`${e.date}-${e.title}-${i}`} sx={{ position: 'relative', pl: 8, pb: i === shownEvents.length - 1 ? 0 : 11 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 4,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `3px solid ${theme.palette.common.white}`,
                          boxShadow: `0 0 0 2px ${e.isContext ? c.Outline : dotColor[e.kind]}`,
                          backgroundColor: e.isContext ? c.Outline : dotColor[e.kind]
                        }}
                      />
                      {/* parent content — muted when only shown as context for a filtered child */}
                      <Box
                        onClick={e.onOpen}
                        sx={{
                          opacity: e.isContext ? 0.55 : 1,
                          ...(e.onOpen ? { cursor: 'pointer' } : {}),
                          // surgery entries read as a CARD on their own timeline dot — one
                          // dot + card per surgery, so multiple surgeries in one visit stack cleanly
                          ...(e.kind === 'surgery'
                            ? { backgroundColor: theme.palette.background.paper, border: `1px solid ${c.OutlineVariant}`, boxShadow: 1, borderRadius: '10px', p: 3.5, maxWidth: 560 }
                            : {})
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}>
                            {e.when}
                          </Typography>
                          {/* hospital stays + surgeries: the tag rides the DATE line (next to the range) */}
                          {(e.kind === 'hospital' || e.kind === 'surgery') && e.chip && (
                            <Box
                              component='span'
                              sx={{
                                px: 2.25,
                                py: 0.4,
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 700,
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                                backgroundColor: chipSx[e.kind].bg,
                                color: chipSx[e.kind].fg
                              }}
                            >
                              {e.chip}
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 2.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '17px', fontWeight: 700, color: c.OnSurfaceVariant }}>{e.title}</Typography>
                          {e.chip && e.kind !== 'hospital' && e.kind !== 'surgery' && (
                            <Box
                              component='span'
                              sx={{
                                px: 2.25,
                                py: 0.4,
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 700,
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                                backgroundColor: chipSx[e.kind].bg,
                                color: chipSx[e.kind].fg
                              }}
                            >
                              {e.chip}
                            </Box>
                          )}
                        </Box>
                        {e.subParts ? (
                          <Typography sx={{ fontSize: '16px', color: c.neutralSecondary, display: 'block', mt: 2.5 }}>
                            {e.subParts.label}
                            <Dot />
                            <Box component='span' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                              {e.subParts.value}
                            </Box>
                          </Typography>
                        ) : e.sub || e.boldLead ? (
                          <Typography sx={{ fontSize: '16px', color: c.neutralSecondary, display: 'block', mt: 2.5 }}>
                            {e.boldLead && (
                              <>
                                <Box component='span' sx={{ fontWeight: 800, color: c.OnSurfaceVariant }}>
                                  {e.boldLead}
                                </Box>
                                {e.sub && <Dot />}
                              </>
                            )}
                            {e.sub?.split(' · ').map((part, pi, arr) => (
                              <React.Fragment key={pi}>
                                {part}
                                {pi < arr.length - 1 && <Dot />}
                              </React.Fragment>
                            ))}
                          </Typography>
                        ) : null}
                        {e.alert && (
                          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.Tertiary, display: 'block', mt: 1.5 }}>
                            ⚠ {e.alert}
                          </Typography>
                        )}
                        {e.onOpen && (
                          <Typography sx={{ fontSize: '15px', fontWeight: 700, color: theme.palette.primary.dark, display: 'block', mt: 1.5 }}>
                            View surgical report ↗
                          </Typography>
                        )}
                      </Box>
                      {/* nested sub-events — a surgery during THIS stay */}
                      {e.children?.map((ch, ci) => (
                        <Box
                          key={`${ch.date}-${ch.title}-${ci}`}
                          onClick={ch.onOpen}
                          sx={{
                            position: 'relative',
                            mt: 7,
                            ml: 2,
                            pl: 7,
                            pb: 1,
                            borderLeft: `2px solid ${c.SurfaceVariant}`,
                            ...(ch.onOpen ? { cursor: 'pointer' } : {})
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '-7px',
                              top: 4,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              border: `2px solid ${theme.palette.common.white}`,
                              boxShadow: `0 0 0 2px ${dotColor[ch.kind]}`,
                              backgroundColor: dotColor[ch.kind]
                            }}
                          />
                          <Box sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${c.OutlineVariant}`, boxShadow: 1, borderRadius: '10px', p: 3.5, maxWidth: 560 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}>
                                {ch.when}
                              </Typography>
                              {ch.chip && (
                                <Box
                                  component='span'
                                  sx={{
                                    px: 2.25,
                                    py: 0.4,
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    letterSpacing: '0.4px',
                                    textTransform: 'uppercase',
                                    backgroundColor: chipSx[ch.kind].bg,
                                    color: chipSx[ch.kind].fg
                                  }}
                                >
                                  {ch.chip}
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: c.OnSurfaceVariant, mt: 1.5 }}>{ch.title}</Typography>
                            {ch.sub && (
                              <Typography sx={{ fontSize: '16px', color: c.neutralSecondary, mt: 0.75 }}>{ch.sub}</Typography>
                            )}
                            {ch.alert && (
                              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.Tertiary, mt: 1 }}>⚠ {ch.alert}</Typography>
                            )}
                            {ch.onOpen && (
                              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: theme.palette.primary.dark, mt: 1.5 }}>
                                View surgical report ↗
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              ) : (
                <EmptyState message='No records in this view.' />
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}

export default AnimalHealthRecord
