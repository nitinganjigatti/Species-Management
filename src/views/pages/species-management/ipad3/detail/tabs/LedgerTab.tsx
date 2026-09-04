'use client'

// iPad 3 Ledger tab (2026-09-03; drill-sheet rework 2026-09-04) — the species inventory
// ledger, designed in the mockup round (.superdesign/design_iterations/ledger_tab_v1.html):
// 1. Verdict strip (SignalsBand anatomy) — Opening · Additions · Reductions · Closing.
// 2. Monthly Movement — the diverging additions/reductions columns (MovementChart, the
//    BarColumns grammar) on the 2026-09-03 time-axis standard: Last-12-Months is
//    chronological; 2Y/3Y/All go cumulative Jan–Dec and drills group by year.
// 3. Reconciliation — the gender-wise DetailTable grid (M · F · UD · ID · G · Total):
//    Opening + Additions − Reductions = Closing; Closing wears the inset verdict panel.
// EVERY number opens THE ONE DrillSheet — the tab's list surface (2026-09-04 rework; the
// old bottom Ledger table is deleted). The sheet's title stays a GENERIC "Ledger Records"
// (the tapped context is a FILTER OBJECT the user can edit, so a specific title would
// lie): taps pre-select filters, the standard SpeciesFilterSheet (Event / Sex / Site /
// Duration) edits them, applied filters ride as removable FilterChips — a chart-bar month
// is a chip too, never a facet. TRANSFERS (synthesized in ledger.ts) surface only under
// a site scope: one site = directional Transfer In/Out (counted in grid + chart),
// several = neutral "Transfer" rows w/ From:+To: meta (boundary-crossing moves count).

import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord } from 'src/types/species-management/detail'
import {
  AnimalCardRow,
  CategoryFilter,
  CellText,
  DetailTable,
  DrillSheet,
  EmptyState,
  FilterChip,
  RowMetaText,
  SectionCard,
  SHEET_PX,
  SheetSearch,
  SiteFilterSelect,
  synthAnimalIdentity
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, AnimalTagKind } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
import type { FilterSheetSection } from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
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
  presetStart,
  resolveEvents,
  signed,
  stockRows
} from './ledger/ledger'
import type { ClassCounts, LedgerClass, LedgerEvent, LedgerEventKind, LedgerPreset } from './ledger/ledger'

interface LedgerTabProps {
  animals?: AnimalRecord[]
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* ── the drill filter object — the sheet lists whatever this says, live ─────── */

interface MonthScope {
  monthIndex: number
  /** Absent = the cumulative "this month across all years" scope. */
  year?: number
}

interface DrillFilter {
  kinds: LedgerEventKind[]
  classes: LedgerClass[]
  sites: string[]
  preset: LedgerPreset
  /** Chart-bar scope — always a removable CHIP, never a facet. */
  month?: MonthScope
  /** Stock mode: the membership list at a boundary (Event facet omitted). */
  stock?: 'opening' | 'closing'
}

// The Event facet's fixed vocabulary; transfer directions join only under a site scope.
const EVENT_FACET_BASE: LedgerEventKind[] = ['birth', 'acquisition', 'census', 'reclass', 'death', 'disposal']
const isTransferKind = (k: LedgerEventKind) => k === 'transfer' || k === 'transfer_in' || k === 'transfer_out'

const tagOf = (e: LedgerEvent): AnimalTagKind => (e.kind === 'death' ? 'mortality' : e.cls)

// Real identifiers beat synthesis (the Population rule): chip > ring, AID always included.
const idsOf = (e: LedgerEvent): AnimalCardId[] => {
  const aidId = { label: 'AID', value: e.aid }
  if (e.chip) return [{ label: 'Chip', value: e.chip }, aidId]
  if (e.ring) return [{ label: 'Ring', value: e.ring }, aidId]

  return synthAnimalIdentity(e.aid).identifiers
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
    census: { bg: skin.TONE_SOFT.neutral, ink: skin.TONE_TYPE.neutral },
    // site-scope semantics: In IS an addition there (green), Out a reduction (orange);
    // the neutral grey Transfer carries multi-site moves where direction would lie.
    transfer_in: { bg: skin.TONE_SOFT.good, ink: skin.ACCENT_INK },
    transfer_out: { bg: cc.BgTeritary, ink: skin.strokeOf(cc.Tertiary) },
    transfer: { bg: skin.TONE_SOFT.neutral, ink: skin.TONE_TYPE.neutral }
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

  const all = useMemo(() => animals || [], [animals])
  const events = useMemo(() => deriveLedgerEvents(all), [all])

  const [preset, setPreset] = useState<LedgerPreset>('last_1y')
  // Site scope is MULTI-select on this tab (user call 2026-09-04); [] = all sites.
  const [siteSel, setSiteSel] = useState<string[]>([])
  const sites = useMemo(() => Array.from(new Set(all.map(a => a.site).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  const led = useMemo(() => computeLedger(events, preset, siteSel), [events, preset, siteSel])
  const periodLabel = LEDGER_PRESETS.find(p => p.key === preset)!.label

  /* ── drill state = a FILTER OBJECT — rows recompute live from events ── */

  const [drill, setDrill] = useState<DrillFilter | null>(null)
  const [drillQ, setDrillQ] = useState('')
  const [drillFiltersOpen, setDrillFiltersOpen] = useState(false)

  // Entry points PRE-SELECT filters (the core ask — never "go back to change"):
  // the sheet opens scoped to whatever was tapped, seeded with the page's period + sites.
  const openDrill = (partial: Partial<DrillFilter>) => {
    setDrillQ('')
    setDrill({ kinds: [], classes: [], sites: [...siteSel], preset, ...partial })
  }

  const patchDrill = (patch: Partial<DrillFilter>) =>
    setDrill(d => {
      if (!d) return d
      const next = { ...d, ...patch }
      // site scope gone → transfer facets go with it (they only resolve against sites)
      if (!next.sites.length) next.kinds = next.kinds.filter(k => !isTransferKind(k))

      return next
    })

  /** The list a filter object yields — the ONE row source for the sheet, the chips'
   *  live counts and the facet counts, so every number always matches its list. */
  const rowsFor = React.useCallback(
    (f: DrillFilter): LedgerEvent[] => {
      const scope = f.sites.length ? f.sites : null
      if (f.stock) {
        const rows = stockRows(events, f.preset, scope, f.stock)

        return f.classes.length ? rows.filter(r => f.classes.includes(r.cls)) : rows
      }
      const start = presetStart(f.preset, new Date())

      return resolveEvents(events, scope)
        .filter(r => {
          if (start && r.date < start) return false
          if (f.kinds.length) {
            if (!f.kinds.includes(r.kind)) return false
          } else {
            // the unfiltered list: neutral transfers show only inside a multi-site scope,
            // and a month bar scopes MOVEMENT — delta-0 rows (reclass/neutral) sit out
            // so the list count matches the bar the user tapped.
            if (r.kind === 'transfer' && f.sites.length < 2) return false
            if (f.month && r.delta === 0) return false
          }
          if (
            f.classes.length &&
            !(f.classes.includes(r.cls) || (r.kind === 'reclass' && r.fromCls && f.classes.includes(r.fromCls)))
          ) {
            return false
          }
          if (f.month) {
            if (r.date.getMonth() !== f.month.monthIndex) return false
            if (f.month.year != null && r.date.getFullYear() !== f.month.year) return false
          }

          return true
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [events]
  )

  const kindDrill = (kind: LedgerEventKind, cls?: LedgerClass) => openDrill({ kinds: [kind], classes: cls ? [cls] : [] })
  const stockDrill = (boundary: 'opening' | 'closing', cls?: LedgerClass) =>
    openDrill({ stock: boundary, classes: cls ? [cls] : [] })

  const monthDrill = (i: number) => {
    const b = led.months[i]
    openDrill({ month: led.cumulative ? { monthIndex: b.monthIndex } : { monthIndex: b.monthIndex, year: b.start!.getFullYear() } })
  }

  /* ── controls (the Population/Housing header grammar) ── */

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

  // The row sitting directly above the Closing verdict panel — its bottom hairline is
  // the "rule above the panel", so it goes; with a site scope that row is Transfer Out.
  const lastCutId = siteSel.length ? 'cut-transfer_out' : 'cut-disposal'

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

    return <CountPill value={v} tone={v >= 0 ? 'pos' : 'neg'} onClick={() => kindDrill(row.kind!, cls)} />
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

  /* ── drill sheet — rows, chips, facets ── */

  const drillBase = drill ? rowsFor(drill) : []
  const needle = drillQ.trim().toLowerCase()
  const drillRows = needle ? drillBase.filter(r => `${r.name || ''} ${r.aid}`.toLowerCase().includes(needle)) : drillBase

  const drillGroups: { label: string; rows: LedgerEvent[] }[] = []
  drillRows.forEach(r => {
    const label = monthYearLabel(r.date)
    const last = drillGroups[drillGroups.length - 1]
    if (last && last.label === label) last.rows.push(r)
    else drillGroups.push({ label, rows: [r] })
  })
  const drillMultiSite = new Set(drillRows.map(r => r.site).filter(Boolean)).size > 1
  // Direction only holds inside ONE site — a multi-site scope wears the neutral chip.
  const neutralTransfers = (drill?.sites.length ?? 0) > 1

  const monthChipLabel = (m: MonthScope) =>
    m.year != null ? `${MONTH_ABBR[m.monthIndex]} ${m.year}` : `${MONTH_FULL[m.monthIndex]} · All years`

  const drillChips = !drill
    ? []
    : [
        ...(drill.stock
          ? [{ key: 'stock', label: drill.stock === 'opening' ? 'Opening Stock' : 'Closing Stock', onClear: () => patchDrill({ stock: undefined }) }]
          : []),
        ...(drill.month ? [{ key: 'month', label: monthChipLabel(drill.month), onClear: () => patchDrill({ month: undefined }) }] : []),
        ...drill.kinds.map(k => ({ key: `kind:${k}`, label: EVENT_LABEL[k], onClear: () => patchDrill({ kinds: drill.kinds.filter(x => x !== k) }) })),
        ...drill.classes.map(c => ({ key: `cls:${c}`, label: CLASS_LABEL[c], onClear: () => patchDrill({ classes: drill.classes.filter(x => x !== c) }) })),
        ...drill.sites.map(s => ({ key: `site:${s}`, label: s, onClear: () => patchDrill({ sites: drill.sites.filter(x => x !== s) }) })),
        ...(drill.preset !== 'all'
          ? [{ key: 'preset', label: LEDGER_PRESETS.find(p => p.key === drill.preset)!.label, onClear: () => patchDrill({ preset: 'all' }) }]
          : [])
      ]

  // All facets live-counted: each option's figure = the list you'd get picking JUST it
  // (other sections stay applied). Stock mode omits the Event facet (membership, not
  // events). Takes ANY filter — the sheet resolves against its staged DRAFT, so Transfer
  // In/Out appear the moment a Site is staged, before Apply (user-caught 2026-09-04).
  const sectionsFor = (f: DrillFilter): FilterSheetSection[] => [
    ...(!f.stock
      ? [
          {
            key: 'event',
            label: 'Event',
            options: [...EVENT_FACET_BASE, ...(f.sites.length ? (['transfer_in', 'transfer_out'] as LedgerEventKind[]) : [])].map(k => ({
              value: k,
              label: EVENT_LABEL[k],
              count: rowsFor({ ...f, kinds: [k] }).length
            }))
          }
        ]
      : []),
    {
      key: 'sex',
      label: 'Sex',
      options: LEDGER_CLASSES.map(c => ({ value: c, label: CLASS_LABEL[c], count: rowsFor({ ...f, classes: [c] }).length }))
    },
    ...(multiSite
      ? [{ key: 'site', label: 'Site', options: sites.map(s => ({ value: s, label: s, count: rowsFor({ ...f, sites: [s] }).length })) }]
      : []),
    {
      key: 'duration',
      label: 'Duration',
      options: LEDGER_PRESETS.map(p => ({ value: p.key, label: p.label, count: rowsFor({ ...f, preset: p.key }).length }))
    }
  ]

  // The sheet's staged draft, read back as a filter object (mirror of applyDrillFilters).
  const draftToFilter = (draft: Record<string, string[]>): DrillFilter => {
    const dur = draft.duration || []

    return {
      ...(drill as DrillFilter),
      kinds: drill?.stock ? [] : ((draft.event || []) as LedgerEventKind[]),
      classes: (draft.sex || []) as LedgerClass[],
      sites: draft.site || [],
      preset: (dur.length ? dur[dur.length - 1] : 'all') as LedgerPreset
    }
  }

  const facetSections: FilterSheetSection[] = drill ? sectionsFor(drill) : []

  const applyDrillFilters = (sel: Record<string, string[]>) => {
    const dur = sel.duration || []
    patchDrill({
      kinds: drill?.stock ? [] : ((sel.event || []) as LedgerEventKind[]),
      classes: (sel.sex || []) as LedgerClass[],
      sites: sel.site || [],
      // Duration is SINGLE-choice — on apply the last-added value wins; none = All Time.
      preset: (dur.length ? dur[dur.length - 1] : 'all') as LedgerPreset
    })
  }

  const drillFilterCount = drill ? drill.kinds.length + drill.classes.length + drill.sites.length : 0

  // The standard Filters trigger, header-round-button form (DrillSheet action slot).
  const drillFiltersBtn = (
    <Box
      onClick={() => setDrillFiltersOpen(true)}
      aria-label='Filters'
      sx={{
        position: 'relative',
        width: 40,
        height: 40,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: `1px solid ${skin.HAIR}`,
        cursor: 'pointer',
        transition: `background-color ${skin.DUR_FAST} ${skin.EASE}`,
        '&:hover': { backgroundColor: '#f7f6f3' },
        '&:active': { backgroundColor: '#f2f1ed' }
      }}
    >
      <Icon icon='mage:filter' fontSize='1.1rem' color={skin.INK2} />
      {drillFilterCount > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            px: 1,
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '11px',
            fontWeight: 700,
            bgcolor: skin.ACCENT_FILL,
            color: '#ffffff'
          }}
        >
          {drillFilterCount}
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* headline + scope controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: skin.INK, mr: 'auto' }}>Ledger</Typography>
        {periodCtl}
        {siteCtl}
      </Box>

      {/* verdict strip — every stat drill-opens its list, filters pre-set */}
      <SignalsBand
        cells={[
          { key: 'open', label: 'Opening Stock', count: led.openingTotal, tone: 'neutral', onOpen: () => openDrill({ stock: 'opening' }) },
          {
            key: 'add',
            label: 'Additions',
            count: led.additionsTotal,
            display: `+${led.additionsTotal.toLocaleString()}`,
            tone: 'good',
            onOpen: () => openDrill({ kinds: siteSel.length ? ['birth', 'acquisition', 'census', 'transfer_in'] : ['birth', 'acquisition', 'census'] })
          },
          {
            key: 'cut',
            label: 'Reductions',
            count: led.reductionsTotal,
            display: `−${led.reductionsTotal.toLocaleString()}`,
            onOpen: () => openDrill({ kinds: siteSel.length ? ['death', 'disposal', 'transfer_out'] : ['death', 'disposal'] })
          },
          { key: 'close', label: 'Closing Stock', count: led.closingTotal, tone: 'neutral', onOpen: () => openDrill({ stock: 'closing' }) }
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
            // own gap separates it from the last reduction row. Hover deepens the panel.
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
            // no rule ABOVE the panel (that line is the last cut row's bottom hairline) and
            // no pinned-column vertical divider beside "Closing Stock" — the panel floats clean
            [`&& .MuiDataGrid-row[data-id="${lastCutId}"] .MuiDataGrid-cell`]: { borderBottom: 'none' },
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
              else if (r.kind) kindDrill(r.kind)
            }}
          />
        </Box>
      </SectionCard>

      {/* THE list surface — one DrillSheet, generic title (the tapped context is an
          EDITABLE filter, so a specific title would lie — the chips carry the query).
          WHITE body; search, chips and rows share ONE horizontal inset (SHEET_PX). */}
      <DrillSheet
        open={!!drill}
        onClose={() => setDrill(null)}
        eyebrow={drill ? `${drillRows.length.toLocaleString()} ${drillRows.length === 1 ? 'record' : 'records'}` : undefined}
        title='Ledger Records'
        action={drill ? drillFiltersBtn : undefined}
        size='lg'
        ground={false}
        bodySx={{ px: 0 }}
      >
        <SheetSearch value={drillQ} onChange={setDrillQ} placeholder='Search animals…' />
        {drillChips.length > 0 && (
          <Box sx={{ px: SHEET_PX, pt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {drillChips.map(c => (
              <FilterChip key={c.key} label={c.label} onClear={c.onClear} />
            ))}
          </Box>
        )}
        {drillGroups.length === 0 && (
          <Typography sx={{ py: 6, textAlign: 'center', fontSize: '14px', color: skin.FAINT }}>No records.</Typography>
        )}
        {drillGroups.map(g => (
          <Box key={g.label} sx={{ px: SHEET_PX }}>
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
            {g.rows.map((r, i) => {
              const tKind = isTransferKind(r.kind)

              return (
                <AnimalCardRow
                  key={r.id}
                  aid={r.aid}
                  identifiers={r.chip || r.ring ? idsOf(r) : undefined}
                  enclosure={r.enclosure}
                  site={drillMultiSite ? r.site : undefined}
                  tag={tagOf(r)}
                  name={r.name && r.name !== r.aid ? r.name : undefined}
                  trailing={<EventChip kind={tKind && neutralTransfers ? 'transfer' : r.kind} />}
                  meta={
                    // stacked RowMetaText lines — ONE item per line (card hard rule):
                    // date, then the transfer's From:/To: (single site = one directional
                    // line; multi-site = both, the neutral chip doesn't say the direction)
                    <>
                      <RowMetaText>{ddMMMyyyy(r.date)}</RowMetaText>
                      {tKind && (neutralTransfers || r.kind === 'transfer_in') && r.fromSite && (
                        <RowMetaText>From: {r.fromSite}</RowMetaText>
                      )}
                      {tKind && (neutralTransfers || r.kind === 'transfer_out') && r.toSite && (
                        <RowMetaText>To: {r.toSite}</RowMetaText>
                      )}
                    </>
                  }
                  last={i === g.rows.length - 1}
                />
              )
            })}
          </Box>
        ))}
      </DrillSheet>

      {/* the drill's editable filters — the standard sheet, facets pre-selected from
          the tap (page + 2 sheets cap: this is sheet #2, it stacks over the drill) */}
      <SpeciesFilterSheet
        open={drillFiltersOpen}
        onClose={() => setDrillFiltersOpen(false)}
        title='Filters'
        sections={facetSections}
        resolveSections={draft => (drill ? sectionsFor(draftToFilter(draft)) : [])}
        selected={drill ? { event: drill.kinds, sex: drill.classes, site: drill.sites, duration: [drill.preset] } : {}}
        onApply={applyDrillFilters}
      />
    </Box>
  )
}

export default LedgerTab
