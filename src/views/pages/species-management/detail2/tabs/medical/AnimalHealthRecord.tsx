'use client'

/*
 * Animal health record — the level-4 surface of the hotspot flow (band → sites sheet → site
 * sheet → THIS). A full-width overlay (large dialog, NOT another stacked side sheet): identity
 * header + status, KPI strip, an action column (Active now / Overdue care / Upcoming) and the
 * full filterable timeline. Un-windowed on purpose — the record answers "what is going on with
 * THIS animal", not "this period".
 */
import React, { useMemo, useState } from 'react'
import { Avatar, Box, Dialog, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { ClinicalRecord, SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { EmptyState, StatusChip } from 'src/views/pages/species-management/detail2/detailUi'
import { fmtDate } from './signals'

const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'
const DAY_MS = 86400000
const PROGRAM_LABEL: Record<string, string> = { vaccination: 'vaccination', deworming: 'deworming', supplements: 'supplement' }

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

type EvKind = 'active' | 'resolved' | 'died' | 'care' | 'overdue'
interface TimelineEvent {
  date: string
  kind: EvKind
  title: string
  chip: string
  when: string // the rendered date line ("29 May 2026 → 12 Jun 2026" for resolved spans)
  sub?: string
  /** "Label ● Value" second line (Severity ● Medium / Prognosis ● Guarded) — rendered with the big dot separator. */
  subParts?: { label: string; value: string }
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
  const [tab, setTab] = useState<'all' | 'active' | 'resolved' | 'care'>('all')

  const data = useMemo(() => {
    if (!aid) return null
    const clin: ClinicalRecord[] = [
      ...(clinical?.programs?.symptoms?.records ?? []),
      ...(clinical?.programs?.diagnosis?.records ?? [])
    ].filter(r => r.aid === aid)

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

    const active = clin.filter(r => r.status === 'active').sort((a, b) => (a.date < b.date ? 1 : -1))
    const resolved = clin.filter(r => r.status === 'resolved')

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
        ? { label: 'Needs attention', tone: 'warning' as const }
        : { label: 'Healthy', tone: 'success' as const }

    return { clin, active, resolved, overdue, upcoming, events, identity, status, lastUpdate }
  }, [aid, clinical, preventive])

  const careCount = data ? data.events.filter(e => e.kind === 'care' || e.kind === 'overdue').length : 0
  const shownEvents = data
    ? data.events.filter(e =>
        tab === 'all'
          ? true
          : tab === 'active'
          ? e.kind === 'active'
          : tab === 'resolved'
          ? e.kind === 'resolved' || e.kind === 'died'
          : e.kind === 'care' || e.kind === 'overdue'
      )
    : []

  const dotColor: Record<EvKind, string> = {
    active: c.Tertiary,
    resolved: theme.palette.primary.main,
    died: c.OnSurfaceVariant,
    care: theme.palette.secondary.main,
    overdue: theme.palette.warning.dark
  }
  const chipSx: Record<EvKind, { bg: string; fg: string }> = {
    active: { bg: c.BgTeritary, fg: c.Tertiary },
    resolved: { bg: c.OnBackground, fg: theme.palette.primary.dark },
    died: { bg: c.SurfaceVariant, fg: c.OnSurfaceVariant },
    care: { bg: c.antzSecondaryBg, fg: theme.palette.secondary.dark },
    overdue: { bg: `${theme.palette.warning.main}29`, fg: theme.palette.warning.dark }
  }

  const kpi = (value: React.ReactNode, label: string, bad?: boolean) => (
    <Box sx={{ backgroundColor: bad ? c.BgTeritary : c.Surface, borderRadius: '12px', px: 4, py: 3 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: bad ? c.Tertiary : c.OnSurfaceVariant }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}>
        {label}
      </Typography>
    </Box>
  )

  const sectionHead = (icon: string, label: string, count: number, color: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Icon icon={icon} fontSize={14} color={color} />
      <Typography sx={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.66px', textTransform: 'uppercase', color }}>
        {label}
      </Typography>
      <Typography variant='caption' sx={{ color: c.neutralSecondary, ml: 'auto' }}>
        {count}
      </Typography>
    </Box>
  )

  const Dot = () => (
    <Box
      component='span'
      sx={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', backgroundColor: c.Outline, mx: 1.75, verticalAlign: 'middle' }}
    />
  )

  const actionCard = (title: string, sub: React.ReactNode, accent: string, bg?: string) => (
    <Box
      sx={{
        border: `1px solid ${c.SurfaceVariant}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: '10px',
        px: 3.5,
        py: 2.75,
        mb: 2.25,
        backgroundColor: bg ?? 'transparent'
      }}
    >
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: c.OnSurfaceVariant }}>{title}</Typography>
      <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: '2px', lineHeight: 1.5 }}>
        {sub}
      </Typography>
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
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
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

          {/* KPI strip */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, px: 6, pb: 5 }}>
            {kpi(data.active.length, 'Active conditions', data.active.length > 0)}
            {kpi(data.overdue.length, 'Overdue care', data.overdue.length > 0)}
            {kpi(data.resolved.length, 'Resolved')}
            {kpi(data.lastUpdate ? fmtDate(data.lastUpdate.date) : '—', 'Last update')}
          </Box>

          {/* body */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
              borderTop: `1px solid ${c.SurfaceVariant}`
            }}
          >
            {/* action column */}
            <Box sx={{ overflowY: 'auto', px: 5, py: 4, borderRight: { md: `1px solid ${c.SurfaceVariant}` } }}>
              {sectionHead('mdi:heart-pulse', 'Active now', data.active.length, c.Tertiary)}
              {data.active.length ? (
                data.active.map(r =>
                  actionCard(
                    r.type,
                    <>
                      {fmtDate(r.date)}
                      <Dot />
                      <b>{r.durationDays} D</b>
                      {r.severity ? (
                        <>
                          <Dot />
                          {r.severity}
                        </>
                      ) : null}
                    </>,
                    c.Tertiary
                  )
                )
              ) : (
                <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mb: 2 }}>
                  Nothing active right now.
                </Typography>
              )}

              <Box sx={{ height: 12 }} />
              {sectionHead('mdi:clock-alert-outline', 'Overdue care', data.overdue.length, theme.palette.warning.dark)}
              {data.overdue.length ? (
                data.overdue.map((o, i) => (
                  <React.Fragment key={`${o.type}-${i}`}>
                    {actionCard(
                      o.type,
                      <>
                        {fmtDate(o.due)}
                        <Dot />
                        <b>{o.days} D late</b>
                      </>,
                      theme.palette.warning.dark,
                      `${theme.palette.warning.main}14`
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mb: 2 }}>
                  No care is overdue.
                </Typography>
              )}

              {data.upcoming.length > 0 && (
                <>
                  <Box sx={{ height: 12 }} />
                  {sectionHead('mdi:calendar-outline', 'Upcoming', data.upcoming.length, theme.palette.secondary.dark)}
                  {data.upcoming.map((u, i) => (
                    <React.Fragment key={`${u.type}-${i}`}>
                      {actionCard(u.type, <>Scheduled {fmtDate(u.due)}</>, theme.palette.secondary.main)}
                    </React.Fragment>
                  ))}
                </>
              )}
            </Box>

            {/* timeline */}
            <Box sx={{ overflowY: 'auto', px: 6, py: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                {(
                  [
                    { key: 'all', label: 'All', n: data.events.length },
                    { key: 'active', label: 'Active', n: data.active.length },
                    { key: 'resolved', label: 'Resolved', n: data.resolved.length },
                    { key: 'care', label: 'Preventive', n: careCount }
                  ] as const
                ).map(t => (
                  <Box
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    sx={{
                      px: 3.5,
                      py: 1.25,
                      borderRadius: '16px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${tab === t.key ? c.OnSurfaceVariant : c.OutlineVariant}`,
                      backgroundColor: tab === t.key ? c.OnSurfaceVariant : 'transparent',
                      color: tab === t.key ? theme.palette.common.white : c.neutralSecondary
                    }}
                  >
                    {t.label}{' '}
                    <Box component='span' sx={{ fontWeight: 700 }}>
                      {t.n}
                    </Box>
                  </Box>
                ))}
              </Box>

              {shownEvents.length ? (
                <Box sx={{ position: 'relative', ml: 1, '&:before': { content: '""', position: 'absolute', left: 8, top: 10, bottom: 10, width: '2px', backgroundColor: c.SurfaceVariant } }}>
                  {shownEvents.map((e, i) => (
                    <Box key={`${e.date}-${e.title}-${i}`} sx={{ position: 'relative', pl: 8, pb: i === shownEvents.length - 1 ? 0 : 4.5 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 3,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `3px solid ${theme.palette.common.white}`,
                          boxShadow: `0 0 0 2px ${dotColor[e.kind]}`,
                          backgroundColor: dotColor[e.kind]
                        }}
                      />
                      <Typography sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}>
                        {e.when}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 0.75, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '14.5px', fontWeight: 700, color: c.OnSurfaceVariant }}>{e.title}</Typography>
                        <Box
                          component='span'
                          sx={{
                            px: 2.25,
                            py: 0.4,
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                            backgroundColor: chipSx[e.kind].bg,
                            color: chipSx[e.kind].fg
                          }}
                        >
                          {e.chip}
                        </Box>
                      </Box>
                      {e.subParts ? (
                        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: 0.5 }}>
                          {e.subParts.label}
                          <Dot />
                          <Box component='span' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                            {e.subParts.value}
                          </Box>
                        </Typography>
                      ) : e.sub ? (
                        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: 0.5 }}>
                          {e.sub.split(' · ').map((part, pi, arr) => (
                            <React.Fragment key={pi}>
                              {part}
                              {pi < arr.length - 1 && <Dot />}
                            </React.Fragment>
                          ))}
                        </Typography>
                      ) : null}
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
