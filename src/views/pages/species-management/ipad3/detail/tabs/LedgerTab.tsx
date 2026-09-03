'use client'

// iPad 3 Ledger tab (2026-09-03) — the species inventory ledger, designed in the mockup
// round (.superdesign/design_iterations/ledger_tab_v1.html) and built kit-first:
// 1. Verdict strip (SignalsBand anatomy) — Opening · Additions · Reductions · Closing.
//    Each stat taps → SCROLLS to the Ledger table with its category filter pre-set
//    (no bottom sheet — the Population-Bridge sheet was dropped, user call 2026-09-03).
// 2. Monthly Movement — the diverging additions/reductions columns (MovementChart, the
//    BarColumns grammar). Time buckets follow the 2026-09-03 time-axis standard: the
//    Last-12-Months preset is chronological; 2Y/3Y/All go cumulative Jan–Dec (each bar =
//    that calendar month summed across all selected years) and drills group by year.
// 3. Reconciliation — the gender-wise grid (M · F · UD · ID · G · Total): Opening +
//    Additions − Reductions = Closing. Every count is a tappable pill (8px radius, soft
//    tone fills), whole rows tap too; Opening/Closing wear the quiet grey boxes.
// 4. Ledger — every count-changing event as the standard DetailTable (AnimalIdCard
//    identity column sticky, Animal · Date · Event · Age · Weight · Total) with the pill
//    search + Total/Additions/Reductions category dropdown.
// Every number drill-opens the standard DrillSheet listing the exact animals behind it.

import React, { useMemo, useRef, useState } from 'react'
import { Box, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord } from 'src/types/species-management/detail'
import {
  AnimalCardRow,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  DetailTable,
  DrillSheet,
  EmptyState,
  HeroPhotoContext,
  RowMetaText,
  SectionCard,
  Sheet,
  SheetSearch,
  SiteFilterSelect,
  synthAnimalIdentity,
  thinScrollbarSx
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, AnimalTagKind } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'
import SignalsBand from 'src/views/pages/species-management/ipad3/detail/tabs/medical/SignalsBand'
import MovementChart from './ledger/MovementChart'
import {
  CLASS_LABEL,
  CLASS_SHORT,
  computeLedger,
  ddMMMyyyy,
  deriveLedgerEvents,
  EVENT_LABEL,
  LEDGER_CLASSES,
  LEDGER_PRESETS,
  monthYearLabel,
  signed,
  stockRows
} from './ledger/ledger'
import type { GridRow, LedgerClass, LedgerEvent, LedgerEventKind, LedgerPreset } from './ledger/ledger'

interface LedgerTabProps {
  animals?: AnimalRecord[]
}

type Category = 'total' | 'add' | 'cut'
const CAT_LABEL: Record<Category, string> = { total: 'Total', add: 'Additions', cut: 'Reductions' }
const CAT_KINDS: Record<Category, LedgerEventKind[] | null> = {
  total: null,
  add: ['birth', 'acquisition', 'census'],
  cut: ['death', 'disposal']
}

const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const tagOf = (e: LedgerEvent): AnimalTagKind => (e.kind === 'death' ? 'mortality' : e.cls)

// Real identifiers beat synthesis (the Population rule): chip > ring, AID always included.
const idsOf = (e: LedgerEvent): AnimalCardId[] => {
  const aidId = { label: 'AID', value: e.aid }
  if (e.chip) return [{ label: 'Chip', value: e.chip }, aidId]
  if (e.ring) return [{ label: 'Ring', value: e.ring }, aidId]

  return synthAnimalIdentity(e.aid).identifiers
}

const ageText = (age?: string) => {
  const n = Number(age)
  if (age && Number.isFinite(n)) return `${n % 1 === 0 ? n : n.toFixed(1)}y`

  return (age || '').trim()
}

const weightText = (w?: string) => {
  const v = String(w ?? '')
    .trim()
    .replace(/\s*kgs?\.?$/i, '')
    .trim()

  return v ? `${v} kg` : ''
}

/* ── event chip — the tone-soft fill + deep-ink pairing ─────────────────────── */

const EventChip: React.FC<{ kind: LedgerEventKind }> = ({ kind }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const look: Record<LedgerEventKind, { bg: string; ink: string }> = {
    birth: { bg: skin.TONE_SOFT.good, ink: skin.ACCENT_INK },
    acquisition: { bg: cc.antzSecondaryBg, ink: skin.TAB_PILL },
    death: { bg: skin.TONE_SOFT.bad, ink: skin.CORAL },
    disposal: { bg: skin.TONE_SOFT.warn, ink: skin.strokeOf(skin.TONE_FILL.warn) },
    reclass: { bg: skin.TONE_SOFT.neutral, ink: skin.TONE_TYPE.neutral },
    census: { bg: skin.TONE_SOFT.neutral, ink: skin.TONE_TYPE.neutral }
  }
  const { bg, ink } = look[kind]

  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 26,
        px: 2.75,
        borderRadius: '999px',
        backgroundColor: bg,
        whiteSpace: 'nowrap'
      }}
    >
      <Typography component='span' sx={{ fontSize: '13px', fontWeight: 600, color: ink, lineHeight: 1 }}>
        {EVENT_LABEL[kind]}
      </Typography>
    </Box>
  )
}

/* ── reconciliation count pill — tappable, 8px radius (user calls 2026-09-03) ── */

const CountPill: React.FC<{
  value: number
  tone: 'pos' | 'neg' | 'grey'
  onClick?: () => void
}> = ({ value, tone, onClick }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  if (value === 0 && tone !== 'grey') {
    return (
      <Typography component='span' sx={{ fontSize: '15px', color: skin.DASH_INK }}>
        —
      </Typography>
    )
  }
  const look =
    tone === 'pos'
      ? { bg: skin.TONE_SOFT.good, ink: skin.LIST_GREEN }
      : tone === 'neg'
      ? { bg: cc.BgTeritary, ink: skin.strokeOf(cc.Tertiary) }
      : { bg: skin.TONE_SOFT.neutral, ink: skin.TONE_TYPE.neutral }

  return (
    <Box
      component='span'
      onClick={
        onClick
          ? e => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 46,
        px: 2.75,
        py: 1.25,
        borderRadius: '8px',
        backgroundColor: look.bg,
        fontSize: '15px',
        fontWeight: tone === 'grey' ? 700 : 600,
        fontVariantNumeric: 'tabular-nums',
        color: look.ink,
        lineHeight: 1.2,
        ...(onClick && {
          cursor: 'pointer',
          transition: `box-shadow ${skin.DUR_FAST} ${skin.EASE}, transform ${skin.DUR_FAST} ${skin.EASE}`,
          '&:hover': { boxShadow: `inset 0 0 0 1.5px ${look.ink}` },
          '&:active': { transform: 'scale(0.95)' }
        })
      }}
    >
      {tone === 'grey' ? value.toLocaleString() : signed(value)}
    </Box>
  )
}

/* ── the tab ─────────────────────────────────────────────────────────────── */

const LedgerTab: React.FC<LedgerTabProps> = ({ animals }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const portrait = useMediaQuery('(orientation: portrait)')
  const heroPhoto = React.useContext(HeroPhotoContext)

  const all = useMemo(() => animals || [], [animals])
  const events = useMemo(() => deriveLedgerEvents(all), [all])

  const [preset, setPreset] = useState<LedgerPreset>('last_1y')
  const [site, setSite] = useState<string | null>(null)
  const sites = useMemo(() => Array.from(new Set(all.map(a => a.site).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  const led = useMemo(() => computeLedger(events, preset, site), [events, preset, site])
  const periodLabel = LEDGER_PRESETS.find(p => p.key === preset)!.label
  const scopeSuffix = preset === 'last_1y' ? String(new Date().getFullYear()) : preset === 'all' ? 'All time' : periodLabel

  /* ── ledger table state ── */
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category>('total')
  const tableRef = useRef<HTMLDivElement>(null)
  const goTable = (c: Category) => {
    setCat(c)
    // let the state land before the scroll measures the layout
    requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  /* ── drill sheet ── */
  const [drill, setDrill] = useState<{ title: string; rows: LedgerEvent[] } | null>(null)
  const [drillQ, setDrillQ] = useState('')
  const openDrill = (title: string, rows: LedgerEvent[]) => {
    setDrillQ('')
    setDrill({ title, rows })
  }

  const kindDrill = (kinds: LedgerEventKind[], label: string, cls?: LedgerClass) => {
    const rows = led.rows.filter(r => {
      if (!kinds.includes(r.kind)) return false
      if (cls) return r.kind === 'reclass' ? r.cls === cls || r.fromCls === cls : r.cls === cls

      return true
    })
    openDrill(cls ? `${label} — ${CLASS_LABEL[cls]} · ${scopeSuffix}` : `${label} — ${scopeSuffix}`, rows)
  }

  const stockDrill = (boundary: 'opening' | 'closing', cls?: LedgerClass) => {
    const rows = stockRows(events, preset, site, boundary, cls)
    const noun = boundary === 'opening' ? 'Opening Stock' : 'Closing Stock'
    openDrill(cls ? `${noun} — ${CLASS_LABEL[cls]}` : noun, rows)
  }

  const monthDrill = (i: number) => {
    const rows = led.rows.filter(r => {
      if (r.delta === 0) return false
      if (led.cumulative) return r.date.getMonth() === led.months[i].monthIndex
      const b = led.months[i]

      return b.start != null && r.date.getFullYear() === b.start.getFullYear() && r.date.getMonth() === b.start.getMonth()
    })
    const b = led.months[i]
    openDrill(
      led.cumulative ? `Movement — ${MONTH_FULL[b.monthIndex]} · All years` : `Movement — ${b.label} 20${b.year}`,
      rows
    )
  }

  /* ── ledger table rows ── */
  const tableData = useMemo(() => {
    const kinds = CAT_KINDS[cat]
    const needle = q.trim().toLowerCase()

    return led.rows
      .filter(r => (!kinds || kinds.includes(r.kind)) && (!needle || `${r.name || ''} ${r.aid}`.toLowerCase().includes(needle)))
      .map(r => ({
        ...r,
        animal: r.aid,
        dateMs: r.date.getTime(),
        event: EVENT_LABEL[r.kind]
      }))
  }, [led.rows, cat, q])

  const table = useSortableTable(tableData, { field: 'dateMs', sort: 'desc' }, 10)

  // Site rides the animal card only when the visible list spans more than one site.
  const showSite = useMemo(
    () => !site && new Set(tableData.map(r => r.site).filter(Boolean)).size > 1,
    [site, tableData]
  )

  const columns: GridColDef[] = useMemo(
    () => [
      {
        flex: 1,
        minWidth: 380,
        field: 'animal',
        headerName: 'Animal Name & ID',
        renderCell: (p: any) => {
          const r = p.row as LedgerEvent

          return (
            <AnimalIdCard
              identifiers={idsOf(r)}
              enclosure={r.enclosure}
              site={showSite ? r.site : undefined}
              tag={tagOf(r)}
              name={r.name && r.name !== r.aid ? r.name : undefined}
              photo={!r.former && synthAnimalIdentity(r.aid).hasPhoto ? heroPhoto?.src : undefined}
              photoPos={heroPhoto?.bgPos}
            />
          )
        }
      },
      {
        minWidth: 150,
        field: 'dateMs',
        headerName: 'Date',
        renderCell: (p: any) => <CellText>{ddMMMyyyy((p.row as LedgerEvent).date)}</CellText>
      },
      {
        minWidth: 180,
        field: 'event',
        headerName: 'Event',
        renderCell: (p: any) => <EventChip kind={(p.row as LedgerEvent).kind} />
      },
      {
        minWidth: 110,
        field: 'age',
        headerName: 'Age',
        renderCell: (p: any) => {
          const t = ageText((p.row as LedgerEvent).age)

          return t ? <CellText>{t}</CellText> : <CellText color={skin.DASH_INK}>—</CellText>
        }
      },
      {
        minWidth: 130,
        field: 'weight',
        headerName: 'Weight',
        renderCell: (p: any) => {
          const t = weightText((p.row as LedgerEvent).weight)

          return t ? <CellText>{t}</CellText> : <CellText color={skin.DASH_INK}>—</CellText>
        }
      },
      {
        minWidth: 110,
        field: 'balance',
        headerName: 'Total',
        renderCell: (p: any) => <CellText weight={600}>{(p.row as any).balance.toLocaleString()}</CellText>
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showSite, heroPhoto]
  )

  /* ── controls (the Population/Housing header grammar) ── */

  const search = (
    <TextField
      size='small'
      placeholder='Search animals…'
      value={q}
      onChange={e => setQ(e.target.value)}
      sx={{
        ...(portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 240 }),
        '& .MuiInputBase-root': { height: 44, bgcolor: skin.FIELD_BG, borderRadius: '999px', fontSize: '15px' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
      }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
    />
  )

  const categoryCtl = (
    <CategoryFilter
      options={['Total', 'Additions', 'Reductions']}
      value={CAT_LABEL[cat]}
      onChange={v => setCat(v === 'Additions' ? 'add' : v === 'Reductions' ? 'cut' : 'total')}
      width={180}
      placeholder='Total'
    />
  )

  const periodCtl = (
    <CategoryFilter
      options={LEDGER_PRESETS.map(p => p.label)}
      value={periodLabel}
      onChange={v => setPreset(LEDGER_PRESETS.find(p => p.label === v)?.key ?? 'last_1y')}
      width={200}
      placeholder='Last 12 Months'
    />
  )

  const siteCtl = multiSite && (
    <SiteFilterSelect
      sites={sites.map(name => ({ site: name, caption: `${all.filter(a => a.site === name).length.toLocaleString()} animals` }))}
      value={site}
      onChange={v => setSite(v)}
      allCaption={`${all.length.toLocaleString()} animals`}
    />
  )

  if (!all.length) {
    return (
      <SectionCard title='Ledger'>
        <EmptyState message='No animals recorded for this species' />
      </SectionCard>
    )
  }

  /* ── reconciliation grid rows ── */

  const gridHead = (label: React.ReactNode, first = false) => (
    <Box
      component='th'
      sx={{
        position: 'sticky',
        top: 0,
        backgroundColor: skin.TABLE_HEAD_BG,
        color: skin.TABLE_HEAD_INK,
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textAlign: first ? 'left' : 'right',
        whiteSpace: 'nowrap',
        px: 4.5,
        py: 3
      }}
    >
      {label}
    </Box>
  )

  const gridCell = (content: React.ReactNode, opts?: { first?: boolean; totalCol?: boolean; anchor?: boolean; key?: string }) => (
    <Box
      component='td'
      key={opts?.key}
      sx={{
        px: 4.5,
        py: 2.5,
        textAlign: opts?.first ? 'left' : 'right',
        borderBottom: `1px solid ${skin.ROW_LINE}`,
        ...(opts?.totalCol && { borderLeft: `1px solid ${skin.HAIR}` }),
        fontSize: '16px',
        fontWeight: opts?.anchor ? 700 : 500,
        fontVariantNumeric: 'tabular-nums',
        color: opts?.first ? skin.INK2 : skin.VALUE,
        whiteSpace: 'nowrap'
      }}
    >
      {content}
    </Box>
  )

  const blockRow = (label: string) => (
    <Box component='tr'>
      <Box
        component='td'
        colSpan={7}
        sx={{
          px: 4.5,
          pt: 3.5,
          pb: 1.5,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: skin.FAINT,
          borderBottom: `1px solid ${skin.ROW_LINE}`
        }}
      >
        {label}
      </Box>
    </Box>
  )

  const eventRow = (r: GridRow) => {
    const tone = (n: number): 'pos' | 'neg' => (n >= 0 ? 'pos' : 'neg')
    const kinds: LedgerEventKind[] = [r.kind]

    return (
      <Box
        component='tr'
        key={r.kind}
        onClick={() => kindDrill(kinds, EVENT_LABEL[r.kind])}
        sx={{ cursor: 'pointer', '&:hover td': { backgroundColor: skin.ROW_HOVER } }}
      >
        {gridCell(EVENT_LABEL[r.kind], { first: true })}
        {LEDGER_CLASSES.map(c =>
          gridCell(
            <CountPill
              value={r.byClass[c]}
              tone={tone(r.byClass[c])}
              onClick={r.byClass[c] !== 0 ? () => kindDrill(kinds, EVENT_LABEL[r.kind], c) : undefined}
            />,
            { key: c }
          )
        )}
        {gridCell(
          r.kind === 'reclass' ? (
            <Typography component='span' sx={{ fontSize: '15px', color: skin.DASH_INK }}>
              —
            </Typography>
          ) : (
            <CountPill value={r.total} tone={tone(r.total)} onClick={r.total !== 0 ? () => kindDrill(kinds, EVENT_LABEL[r.kind]) : undefined} />
          ),
          { totalCol: true }
        )}
      </Box>
    )
  }

  const anchorRow = (label: string, counts: Record<LedgerClass, number>, total: number, boundary: 'opening' | 'closing', closing?: boolean) => (
    <Box
      component='tr'
      onClick={() => stockDrill(boundary)}
      sx={{
        cursor: 'pointer',
        '&:hover td': { backgroundColor: skin.ROW_HOVER },
        ...(closing && { '& td': { borderTop: `1.5px solid ${skin.DROPDOWN_BORDER}`, borderBottom: 'none' } })
      }}
    >
      {gridCell(label, { first: true, anchor: true })}
      {LEDGER_CLASSES.map(c =>
        gridCell(
          counts[c] > 0 ? (
            <CountPill value={counts[c]} tone='grey' onClick={() => stockDrill(boundary, c)} />
          ) : (
            <Typography component='span' sx={{ fontSize: '15px', color: skin.DASH_INK }}>
              —
            </Typography>
          ),
          { key: c }
        )
      )}
      {gridCell(<CountPill value={total} tone='grey' onClick={() => stockDrill(boundary)} />, { totalCol: true, anchor: true })}
    </Box>
  )

  /* ── drill sheet body — grouped by month, searchable ── */

  const drillRows = (drill?.rows || []).filter(r => {
    const needle = drillQ.trim().toLowerCase()

    return !needle || `${r.name || ''} ${r.aid}`.toLowerCase().includes(needle)
  })
  const drillGroups: { label: string; rows: LedgerEvent[] }[] = []
  drillRows.forEach(r => {
    const label = monthYearLabel(r.date)
    const last = drillGroups[drillGroups.length - 1]
    if (last && last.label === label) last.rows.push(r)
    else drillGroups.push({ label, rows: [r] })
  })
  const drillMultiSite = new Set(drillRows.map(r => r.site).filter(Boolean)).size > 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* headline + scope controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: skin.INK, mr: 'auto' }}>Ledger</Typography>
        {periodCtl}
        {siteCtl}
      </Box>

      {/* verdict strip — stat tap scrolls to the table with its filter pre-set */}
      <SignalsBand
        cells={[
          { key: 'open', label: 'Opening Stock', count: led.openingTotal, tone: 'neutral', onOpen: () => goTable('total') },
          {
            key: 'add',
            label: 'Additions',
            count: led.additionsTotal,
            display: `+${led.additionsTotal.toLocaleString()}`,
            tone: 'good',
            onOpen: () => goTable('add')
          },
          {
            key: 'cut',
            label: 'Reductions',
            count: led.reductionsTotal,
            display: `−${led.reductionsTotal.toLocaleString()}`,
            onOpen: () => goTable('cut')
          },
          { key: 'close', label: 'Closing Stock', count: led.closingTotal, tone: 'neutral', onOpen: () => goTable('total') }
        ]}
      />

      {/* monthly movement */}
      <SectionCard title='Monthly Movement'>
        <MovementChart months={led.months} cumulative={led.cumulative} cutFill={cc.Tertiary} onSelect={monthDrill} />
      </SectionCard>

      {/* reconciliation */}
      <SectionCard title='Reconciliation'>
        <Box sx={{ overflowX: 'auto', ...thinScrollbarSx(theme) }}>
          <Box component='table' sx={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
            <Box component='thead'>
              <Box component='tr'>
                {gridHead('', true)}
                {LEDGER_CLASSES.map(c => (
                  <React.Fragment key={c}>{gridHead(CLASS_SHORT[c])}</React.Fragment>
                ))}
                {gridHead('Total')}
              </Box>
            </Box>
            <Box component='tbody'>
              {anchorRow('Opening Stock', led.opening, led.openingTotal, 'opening')}
              {blockRow('Additions')}
              {led.addRows.map(eventRow)}
              {blockRow('Reductions')}
              {led.cutRows.map(eventRow)}
              {anchorRow('Closing Stock', led.closing, led.closingTotal, 'closing', true)}
            </Box>
          </Box>
        </Box>
      </SectionCard>

      {/* the ledger table */}
      <Box ref={tableRef} sx={{ scrollMarginTop: 12 }}>
        <SectionCard
          title={`Ledger · ${table.total.toLocaleString()}`}
          action={
            portrait ? undefined : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {categoryCtl}
                {search}
              </Box>
            )
          }
        >
          {portrait && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              {search}
              {categoryCtl}
            </Box>
          )}
          {table.total ? (
            <DetailTable
              columns={columns}
              rows={table.rows}
              total={table.total}
              paginationModel={table.paginationModel}
              setPaginationModel={table.setPaginationModel}
              sortModel={table.sortModel}
              handleSortModel={table.handleSortModel}
              stickyFields={['animal']}
              rowHeight={146}
            />
          ) : (
            <EmptyState message='No events match your filters' />
          )}
        </SectionCard>
      </Box>

      {/* drill — the animals behind a number */}
      <DrillSheet
        open={!!drill}
        onClose={() => setDrill(null)}
        eyebrow={drill ? `${drillRows.length.toLocaleString()} ${drillRows.length === 1 ? 'record' : 'records'}` : undefined}
        title={drill?.title}
        size='lg'
      >
        <Box sx={{ mb: 3 }}>
          <SheetSearch value={drillQ} onChange={setDrillQ} placeholder='Search animals…' />
        </Box>
        {drillGroups.length === 0 && (
          <Sheet>
            <Typography sx={{ py: 6, textAlign: 'center', fontSize: '14px', color: skin.FAINT }}>No records.</Typography>
          </Sheet>
        )}
        {drillGroups.map(g => (
          <Box key={g.label} sx={{ mb: 4 }}>
            <Typography
              sx={{
                mb: 2,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: skin.FAINT
              }}
            >
              {g.label} · {g.rows.length}
            </Typography>
            <Sheet>
              {g.rows.map((r, i) => (
                <AnimalCardRow
                  key={r.id}
                  aid={r.aid}
                  identifiers={r.chip || r.ring ? idsOf(r) : undefined}
                  enclosure={r.enclosure}
                  site={drillMultiSite ? r.site : undefined}
                  tag={tagOf(r)}
                  name={r.name && r.name !== r.aid ? r.name : undefined}
                  trailing={<EventChip kind={r.kind} />}
                  meta={<RowMetaText>{ddMMMyyyy(r.date)}</RowMetaText>}
                  last={i === g.rows.length - 1}
                />
              ))}
            </Sheet>
          </Box>
        ))}
      </DrillSheet>
    </Box>
  )
}

export default LedgerTab
