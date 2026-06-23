'use client'

import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import type {
  ConditionGroup,
  MedicalDateEvent,
  MedicineGroup,
  SpeciesConditions,
  SpeciesMedication
} from 'src/types/species-management/detail'
import type {
  SpeciesLab,
  SpeciesSurgery,
  SpeciesAnaesthesia,
  SpeciesPharmacy
} from 'src/lib/api/species-management/detail'
import { EmptyState, SectionCard, StatTile, StatusChip, TileGrid } from 'src/views/pages/species-management/detail/detailUi'

type SubTab = 'vaccination' | 'deworming' | 'lab' | 'pharmacy' | 'surgery' | 'complaints' | 'diagnosis'

interface MedicalTabProps {
  vaccination?: SpeciesMedication
  deworming?: SpeciesMedication
  complaints?: SpeciesConditions
  diagnosis?: SpeciesConditions
  lab?: SpeciesLab
  surgery?: SpeciesSurgery
  anaesthesia?: SpeciesAnaesthesia
  pharmacy?: SpeciesPharmacy
}

const INTERVAL_MONTHS = 12 // assumed vaccination cycle (data has no schedule); transparent default
const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/** Forecast next-due per vaccine = last administration + assumed cycle. Real dates, transparent assumption. */
const VaccinationEstimator: React.FC<{ data: SpeciesMedication }> = ({ data }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [win, setWin] = useState('3')
  const windowMonths = Number(win)

  const { rows, dueCount } = React.useMemo(() => {
    const now = new Date()
    const horizon = new Date(now)
    horizon.setMonth(horizon.getMonth() + windowMonths)

    const rows = (data.medicines || []).map(m => {
      const dates = (m.dateEvents || []).map(e => e.date).filter(Boolean).sort()
      const last = dates[dates.length - 1]
      const next = last ? new Date(last) : null
      if (next) next.setMonth(next.getMonth() + INTERVAL_MONTHS)
      const due = next ? next <= horizon : false

      return { name: m.name, last: last || '-', next: next ? fmtMonth(next) : '-', animals: m.completed || 0, due }
    })

    return { rows, dueCount: rows.filter(r => r.due).reduce((s, r) => s + r.animals, 0) }
  }, [data.medicines, windowMonths])

  const s = data.summary || {}

  return (
    <SectionCard
      title='Vaccination Estimator'
      action={
        <CustomSwitchTabs
          options={[
            { label: 'Next month', value: '1' },
            { label: 'Next 3 months', value: '3' },
            { label: 'Next 6 months', value: '6' }
          ]}
          value={win}
          onChange={(_e: React.SyntheticEvent, v: string | null) => v && setWin(v)}
        />
      }
    >
      <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant, mb: 2 }}>
        <strong style={{ color: dueCount ? cc.Tertiary : cc.OnSurfaceVariant }}>{dueCount}</strong> animals due in the next {windowMonths} month
        {windowMonths > 1 ? 's' : ''} · {s.uniqueAnimals ?? 0} vaccinated
        {s.neverTreated ? ` · ${s.neverTreated} never vaccinated` : ''}
        <Typography component='span' variant='caption' sx={{ color: cc.neutralSecondary, ml: 1 }}>
          (assumes ~{INTERVAL_MONTHS}-month cycle)
        </Typography>
      </Typography>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              {['Vaccine', 'Last given', 'Projected next due', 'Animals', 'Status'].map(h => (
                <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.last}</TableCell>
                <TableCell>{r.next}</TableCell>
                <TableCell>{r.animals}</TableCell>
                <TableCell>
                  <StatusChip label={r.due ? 'Due soon' : 'Upcoming'} tone={r.due ? 'warning' : 'success'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  )
}

const MedicalTab: React.FC<MedicalTabProps> = ({
  vaccination,
  deworming,
  complaints,
  diagnosis,
  lab,
  surgery,
  anaesthesia,
  pharmacy
}) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [sub, setSub] = useState<SubTab>('vaccination')

  const simpleTable = (head: string[], rows: (string | number | undefined)[][]) => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {head.map(h => (
              <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j}>{c ?? '-'}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const sampleChip = <StatusChip label='Sample data' tone='warning' />

  /* ---------- Lab / Pathology (test-wise values) ---------- */
  const renderLab = () => {
    if (!lab?.tests?.length) return <EmptyState message='No lab / pathology data available' />

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lab.sample && <Box>{sampleChip}</Box>}
        <TileGrid>
          <StatTile label='Tests' value={lab.tests.length} tone='primary' />
          <StatTile label='Records' value={lab.tests.reduce((s, t) => s + (t.count || 0), 0)} tone='neutral' />
          <StatTile label='Animals' value={lab.tests.reduce((s, t) => s + (t.animals || 0), 0)} tone='neutral' />
        </TileGrid>
        <SectionCard title='Test-wise values'>
          {simpleTable(
            ['Test', 'Animals', 'Records', 'Min', 'Avg', 'Max', 'Unit'],
            lab.tests.map(t => [t.test, t.animals, t.count, t.min, t.avg, t.max, t.unit])
          )}
        </SectionCard>
      </Box>
    )
  }

  /* ---------- Pharmacy (all medicines used) ---------- */
  const renderPharmacy = () => {
    if (!pharmacy?.medicines?.length) return <EmptyState message='No pharmacy data available' />

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TileGrid>
          <StatTile label='Medicines' value={pharmacy.medicines.length} tone='primary' />
          <StatTile label='Total Uses' value={pharmacy.total ?? 0} tone='neutral' />
        </TileGrid>
        <SectionCard title='Medicines used'>
          {simpleTable(
            ['Medicine', 'Animals', 'Uses', 'Route'],
            pharmacy.medicines.map(m => [m.name, m.animals, m.count, m.route])
          )}
        </SectionCard>
      </Box>
    )
  }

  /* ---------- Surgery & Anaesthesia ---------- */
  const renderSurgery = () => {
    if (!surgery?.procedures?.length && !anaesthesia?.agents?.length) {
      return <EmptyState message='No surgery / anaesthesia data available' />
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(surgery?.sample || anaesthesia?.sample) && <Box>{sampleChip}</Box>}
        <TileGrid>
          <StatTile label='Surgeries' value={surgery?.total ?? 0} tone='primary' />
          <StatTile label='Anaesthesia events' value={anaesthesia?.total ?? 0} tone='neutral' />
        </TileGrid>
        {surgery?.procedures?.length ? (
          <SectionCard title='Procedures'>
            {simpleTable(['Procedure', 'Count', 'Animals'], surgery.procedures.map(p => [p.name, p.count, p.animals]))}
          </SectionCard>
        ) : null}
        {anaesthesia?.agents?.length ? (
          <SectionCard title='Anaesthesia agents'>
            {simpleTable(['Agent', 'Count'], anaesthesia.agents.map(a => [a.name, a.count]))}
          </SectionCard>
        ) : null}
        {surgery?.recent?.length ? (
          <SectionCard title='Recent procedures'>
            {simpleTable(['Date', 'Animal', 'Procedure', 'Site'], surgery.recent.map(r => [r.date, r.animal, r.procedure, r.site]))}
          </SectionCard>
        ) : null}
      </Box>
    )
  }
  const [event, setEvent] = useState<{ title: string; ev: MedicalDateEvent } | null>(null)

  const eventRow = (ev: MedicalDateEvent, title: string) => (
    <TableRow key={ev.date} hover sx={{ cursor: 'pointer' }} onClick={() => setEvent({ title, ev })}>
      <TableCell>{ev.date}</TableCell>
      <TableCell>{ev.count}</TableCell>
      <TableCell>
        {ev.status ? (
          <StatusChip label={ev.status} tone={ev.status === 'completed' ? 'success' : ev.status === 'pending' ? 'error' : 'warning'} />
        ) : (
          <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
            {ev.active ?? 0} active · {ev.closed ?? 0} closed
          </Typography>
        )}
      </TableCell>
      <TableCell>{ev.sites?.join(', ') || '-'}</TableCell>
    </TableRow>
  )

  const dateEventsTable = (events: MedicalDateEvent[], title: string) => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {['Date', 'Animals', 'Status', 'Sites'].map(h => (
              <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{events.map(ev => eventRow(ev, title))}</TableBody>
      </Table>
    </TableContainer>
  )

  /* ---------- medicine-first (vaccination / deworming) ---------- */
  const renderMedication = (data?: SpeciesMedication, label = 'medicine') => {
    if (!data || !data.medicines?.length) return <EmptyState message={`No ${label} data available`} />
    const s = data.summary || {}

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TileGrid>
          <StatTile label='Medicines' value={s.uniqueMedicines ?? data.medicines.length} tone='primary' />
          <StatTile label='Completed' value={s.completed ?? 0} tone='success' />
          <StatTile label='Animals Treated' value={`${s.uniqueAnimals ?? 0}/${s.totalAnimals ?? 0}`} tone='neutral' />
          <StatTile label='Never Treated' value={s.neverTreated ?? 0} tone={s.neverTreated ? 'error' : 'success'} />
        </TileGrid>

        {label === 'vaccination' && <VaccinationEstimator data={data} />}

        {data.medicines.map((m: MedicineGroup, i) => (
          <Accordion key={i} disableGutters sx={{ borderRadius: '10px', border: `1px solid ${cc.SurfaceVariant}`, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<Icon icon='mdi:chevron-down' />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {m.name}
                </Typography>
                <StatusChip label={`${m.completed} completed`} tone='success' />
                <StatusChip label={`${m.pending} pending`} tone='error' />
                <StatusChip label={`${m.upcoming} upcoming`} tone='warning' />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {(m.dosageTypes?.length || m.unit) && (
                <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 2 }}>
                  {[
                    m.dosageTypes?.join(', '),
                    m.avgScheduledQty != null ? `avg ${m.avgScheduledQty}${m.unit || ''}` : '',
                    m.avgWastage != null ? `wastage ${m.avgWastage}` : '',
                    m.sites?.length ? `Sites: ${m.sites.join(', ')}` : ''
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Typography>
              )}
              {m.dateEvents?.length ? dateEventsTable(m.dateEvents, m.name) : <EmptyState message='No administration records' />}
            </AccordionDetails>
          </Accordion>
        ))}

        {data.neverTreated?.length > 0 && (
          <SectionCard title={`Never ${label === 'deworming' ? 'Dewormed' : 'Vaccinated'} (${data.neverTreated.length})`}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    {['Animal', 'Sex', 'Site', 'Enclosure'].map(h => (
                      <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.neverTreated.map((n, i) => (
                    <TableRow key={i}>
                      <TableCell>{n.name || n.id}</TableCell>
                      <TableCell>{n.sex || '-'}</TableCell>
                      <TableCell>{n.site || '-'}</TableCell>
                      <TableCell>{n.enclosure || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        )}
      </Box>
    )
  }

  /* ---------- type-first (complaints / diagnosis) ---------- */
  const renderConditions = (data?: SpeciesConditions, label = 'complaint') => {
    if (!data || !data.items?.length) return <EmptyState message={`No ${label} data available`} />
    const s = data.summary || {}

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TileGrid>
          <StatTile label='Types' value={s.uniqueTypes ?? data.items.length} tone='primary' />
          <StatTile label='Active' value={s.active ?? 0} tone='error' />
          <StatTile label='Closed' value={s.closed ?? 0} tone='success' />
          <StatTile label='Animals' value={`${s.uniqueAnimals ?? 0}/${s.totalAnimals ?? 0}`} tone='neutral' />
        </TileGrid>

        {data.items.map((c: ConditionGroup, i) => (
          <Accordion key={i} disableGutters sx={{ borderRadius: '10px', border: `1px solid ${cc.SurfaceVariant}`, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<Icon icon='mdi:chevron-down' />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {c.name}
                </Typography>
                <StatusChip label={`${c.active} active`} tone='error' />
                <StatusChip label={`${c.closed} closed`} tone='success' />
                {typeof c.avgResolutionDays === 'number' && (
                  <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                    avg {c.avgResolutionDays}d to close
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {c.dateEvents?.length ? dateEventsTable(c.dateEvents, c.name) : <EmptyState message='No records' />}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <CustomSwitchTabs
        options={[
          { label: 'Vaccination', value: 'vaccination' },
          { label: 'Deworming', value: 'deworming' },
          { label: 'Lab / Pathology', value: 'lab' },
          { label: 'Pharmacy', value: 'pharmacy' },
          { label: 'Surgery & Anaesthesia', value: 'surgery' },
          { label: 'Complaints', value: 'complaints' },
          { label: 'Diagnosis', value: 'diagnosis' }
        ]}
        value={sub}
        onChange={(_e: React.SyntheticEvent, v: string | null) => v && setSub(v as SubTab)}
      />

      {sub === 'vaccination' && renderMedication(vaccination, 'vaccination')}
      {sub === 'deworming' && renderMedication(deworming, 'deworming')}
      {sub === 'lab' && renderLab()}
      {sub === 'pharmacy' && renderPharmacy()}
      {sub === 'surgery' && renderSurgery()}
      {sub === 'complaints' && renderConditions(complaints, 'complaint')}
      {sub === 'diagnosis' && renderConditions(diagnosis, 'diagnosis')}

      {/* Date → animals drill-down */}
      <Drawer
        anchor='right'
        open={!!event}
        onClose={() => setEvent(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 4 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {event?.title}
            </Typography>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              {event?.ev.date} · {event?.ev.animals?.length || 0} animals
            </Typography>
          </Box>
          <IconButton onClick={() => setEvent(null)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        {event?.ev.animals?.length ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {['Animal', 'Site', 'Enclosure', 'Status'].map(h => (
                    <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {event.ev.animals.map((an, i) => (
                  <TableRow key={i}>
                    <TableCell>{an.name || an.id}</TableCell>
                    <TableCell>{an.site || '-'}</TableCell>
                    <TableCell>{an.enclosure || '-'}</TableCell>
                    <TableCell>{an.status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState message='No animal records' />
        )}
      </Drawer>
    </Box>
  )
}

export default MedicalTab
