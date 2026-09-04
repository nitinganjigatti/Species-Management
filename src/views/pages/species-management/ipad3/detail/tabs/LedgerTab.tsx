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
  SheetSearch,
  SiteFilterSelect,
  synthAnimalIdentity
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
import type { ClassCounts, LedgerClass, LedgerEvent, LedgerEventKind, LedgerPreset } from './ledger/ledger'

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

/* Chip color carries the KIND of number: green = addition · orange = reduction ·
 * grey = stock baseline (Opening). The ONE exception is the VERDICT treatment
 * (user direction 2026-09-04): Closing Stock wears SOLID slate-navy chips with white
 * figures on a light navy row wash — navy is the system's identity/verdict ink, the
 * only strong hue with no add/reduce meaning, so the row shouts without lying. */
const CountPill: React.FC<{
  value: number
  tone: 'pos' | 'neg' | 'grey' | 'navy'
  onClick?: () => void
}> = ({ value, tone, onClick }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  if (value === 0 && tone !== 'grey' && tone !== 'navy') {
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
      : tone === 'navy'
      ? { bg: skin.TAB_PILL, ink: '#ffffff' }
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
        // ONE fixed chip width (user call 2026-09-04) — columns read as aligned blocks
        // instead of ragged pills; 64px seats the widest figure ("+121") comfortably.
        width: 64,
        py: 1.25,
        borderRadius: '8px',
        backgroundColor: look.bg,
        fontSize: '15px',
        fontWeight: tone === 'grey' || tone === 'navy' ? 700 : 600,
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
  // Site scope is MULTI-select on this tab (user call 2026-09-04); [] = all sites.
  const [siteSel, setSiteSel] = useState<string[]>([])
  const sites = useMemo(() => Array.from(new Set(all.map(a => a.site).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  const led = useMemo(() => computeLedger(events, preset, siteSel), [events, preset, siteSel])
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
    const rows = stockRows(events, preset, siteSel, boundary, cls)
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

  // Site rides the animal card only when the visible list spans more than one site
  // (holds with multi-select too: picking exactly one site hides the row).
  const showSite = useMemo(() => new Set(tableData.map(r => r.site).filter(Boolean)).size > 1, [tableData])

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
      multiple
      multiValue={siteSel}
      onMultiChange={setSiteSel}
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

  /* ── reconciliation — THE standard DetailTable (user call 2026-09-04: no hand-built
     tables). One static grid: Opening → additions → reductions → Closing; direction
     reads from the pill tones (green +, orange −, grey anchors), so the old
     ADDITIONS/REDUCTIONS block-label rows are retired with the hand-rolled markup. ── */

  interface ReconRow {
    id: string
    label: string
    anchor?: boolean
    boundary?: 'opening' | 'closing'
    kind?: LedgerEventKind
    byClass: ClassCounts
    total: number
  }

  const reconRows: ReconRow[] = [
    { id: 'opening', label: 'Opening Stock', anchor: true, boundary: 'opening', byClass: led.opening, total: led.openingTotal },
    ...led.addRows.map(r => ({ id: `add-${r.kind}`, label: EVENT_LABEL[r.kind], kind: r.kind, byClass: r.byClass, total: r.total })),
    ...led.cutRows.map(r => ({ id: `cut-${r.kind}`, label: EVENT_LABEL[r.kind], kind: r.kind, byClass: r.byClass, total: r.total })),
    { id: 'closing', label: 'Closing Stock', anchor: true, boundary: 'closing', byClass: led.closing, total: led.closingTotal }
  ]

  const dashSpan = (
    <Typography component='span' sx={{ fontSize: '15px', color: skin.DASH_INK }}>
      —
    </Typography>
  )

  const reconPill = (row: ReconRow, cls?: LedgerClass) => {
    const v = cls ? row.byClass[cls] : row.total
    if (row.anchor) {
      // Opening = quiet grey baseline · Closing = the solid-navy verdict chips.
      return v > 0 ? (
        <CountPill value={v} tone={row.boundary === 'closing' ? 'navy' : 'grey'} onClick={() => stockDrill(row.boundary!, cls)} />
      ) : (
        dashSpan
      )
    }
    if (v === 0 || (!cls && row.kind === 'reclass')) return dashSpan

    return (
      <CountPill value={v} tone={v >= 0 ? 'pos' : 'neg'} onClick={() => kindDrill([row.kind!], row.label, cls)} />
    )
  }

  const reconColumns: GridColDef[] = [
    {
      flex: 1,
      minWidth: 200,
      field: 'label',
      headerName: 'Event',
      sortable: false,
      renderCell: (p: any) => <CellText weight={(p.row as ReconRow).anchor ? 700 : 500}>{(p.row as ReconRow).label}</CellText>
    },
    ...LEDGER_CLASSES.map(c => ({
      minWidth: 96,
      field: c,
      headerName: CLASS_SHORT[c],
      sortable: false,
      renderCell: (p: any) => reconPill(p.row as ReconRow, c)
    })),
    {
      minWidth: 110,
      field: 'total',
      headerName: 'Total',
      sortable: false,
      renderCell: (p: any) => reconPill(p.row as ReconRow)
    }
  ]

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

      {/* reconciliation — the standard frameless DetailTable inside the white card.
          Closing Stock = the VERDICT row (user direction 2026-09-04): light navy wash
          across the row (incl. the pinned label cell, on hover too), solid #1F515B chips
          w/ white figures, heavier rule above. Navy = identity ink, not add/reduce. */}
      <SectionCard title='Reconciliation'>
        <Box
          sx={{
            // Closing wash = an INSET ROUNDED PANEL, not a full-bleed row (user reference
            // 2026-09-04): #AFEFEB @ 30% flattened over white, floating with padding
            // around it via a ::before under the cell content; no rule line, the panel's
            // own gap separates it from Disposal. Hover deepens the panel, never the row.
            '&& .MuiDataGrid-row[data-id="closing"]': { position: 'relative', backgroundColor: 'transparent' },
            '&& .MuiDataGrid-row[data-id="closing"]::before': {
              content: '""',
              position: 'absolute',
              inset: '8px 10px',
              borderRadius: '12px',
              backgroundColor: skin.mixOverWhite('#afefeb', 0.3),
              pointerEvents: 'none'
            },
            '&& .MuiDataGrid-row[data-id="closing"]:hover::before': {
              backgroundColor: skin.mixOverWhite('#afefeb', 0.4)
            },
            '&& .MuiDataGrid-row[data-id="closing"] .MuiDataGrid-cell': {
              backgroundColor: 'transparent',
              borderBottom: 'none',
              position: 'relative'
            },
            // no rule ABOVE the panel (that line is Disposal's bottom hairline) and no
            // pinned-column vertical divider beside "Closing Stock" — the panel floats clean
            '&& .MuiDataGrid-row[data-id="cut-disposal"] .MuiDataGrid-cell': { borderBottom: 'none' },
            '&& .MuiDataGrid-row[data-id="closing"] .MuiDataGrid-cell[data-field="label"]': { borderRight: 'none' }
          }}
        >
        <DetailTable
          columns={reconColumns}
          rows={reconRows}
          total={reconRows.length}
          hideFooter
          stickyFields={['label']}
          onRowClick={(p: any) => {
            const r = p.row as ReconRow
            if (r.anchor) stockDrill(r.boundary!)
            else if (r.kind) kindDrill([r.kind], r.label)
          }}
        />
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
      {/* WHITE body (ground={false}) — the standard animal-list surface; rows on the sage
          ground read off-system (user-flagged 2026-09-04). */}
      <DrillSheet
        open={!!drill}
        onClose={() => setDrill(null)}
        eyebrow={drill ? `${drillRows.length.toLocaleString()} ${drillRows.length === 1 ? 'record' : 'records'}` : undefined}
        title={drill?.title}
        size='lg'
        ground={false}
      >
        <Box sx={{ mb: 2 }}>
          <SheetSearch value={drillQ} onChange={setDrillQ} placeholder='Search animals…' />
        </Box>
        {drillGroups.length === 0 && (
          <Typography sx={{ py: 6, textAlign: 'center', fontSize: '14px', color: skin.FAINT }}>No records.</Typography>
        )}
        {drillGroups.map(g => (
          <Box key={g.label} sx={{ px: 2 }}>
            <Typography
              sx={{
                pt: 4,
                pb: 1,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: skin.FAINT
              }}
            >
              {g.label} · {g.rows.length}
            </Typography>
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
          </Box>
        ))}
      </DrillSheet>
    </Box>
  )
}

export default LedgerTab
