'use client'

import React, { useMemo, useState } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import type { SpeciesEgg, SpeciesEggs } from 'src/types/species-management/detail'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import {
  AnimalIdCard,
  HeroPhotoContext,
  synthAnimalIdentity,
  ControlsRow,
  DetailTable,
  EmptyState,
  SearchPill,
  SectionCard,
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetSection,
  SHEET_PX,
  sheetPaperSx,
  StatusChip,
  TrendAreaChart,
  ViewToggle,
  YearLinesChart,
  ListSheet,
  SheetDrawer,
  thinScrollbarSx
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { CTRL_H, RangeSelect, yearItemsFor } from 'src/views/pages/species-management/ipad3/detail/tabs/CircleOfLifeTab'
import type { ListRow, SheetView, YearSeries } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import SignalsBand from 'src/views/pages/species-management/ipad3/detail/tabs/medical/SignalsBand'
import { SiteFilterControl } from 'src/views/pages/species-management/ipad3/detail/tabs/MedicalTab'
import { getFemaleDetail } from 'src/lib/api/species-management/breeding-eggs'
import type { FemaleDetail, FemaleRow, SpeciesFunnel } from 'src/lib/api/species-management/breeding-eggs'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

/* ============================================================ breeding analytics (top zone) */

/** Clutch-bar sparkline: one bar per clutch, height = egg count ("egg count per clutch"). */
const ClutchBars: React.FC<{ sizes: number[] }> = ({ sizes }) => {
  const max = Math.max(1, ...sizes)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 22 }}>
      {sizes.map((s, i) => (
        <Box key={i} sx={{ width: 6, borderRadius: '1px 1px 0 0', bgcolor: skin.ACCENT_FILL, opacity: 0.85, height: `${Math.max(14, (s / max) * 100)}%` }} />
      ))}
    </Box>
  )
}

const MONTH_L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// dd MMM yyyy — the module's hard date rule.
const fmtD = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)

  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ------------------------------------------------------ drill sheets (every stat opens one) */

type SheetSpec =
  | { kind: 'fertility' }
  | { kind: 'eggsByFemale' }
  | { kind: 'femalesLaid' }
  | { kind: 'month'; m: number }
  | { kind: 'outcome'; outcome: 'hatched' | 'died' | 'infertile' }

// ListRow / SheetView / ListSheet were promoted to detailUi (2026-08-07) — one generic
// list sheet for every tab; imported above.

/** Per-female detail drawer (L3): clutch-by-clutch, monthly rhythm, egg weight-loss corridor. */
const FemaleDrawer: React.FC<{ speciesId: number; className?: string; row: FemaleRow | null; onClose: () => void }> = ({ speciesId, className, row, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [detail, setDetail] = useState<FemaleDetail | null>(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    let alive = true
    if (row) {
      setLoading(true)
      getFemaleDetail(speciesId, row.antzId, className).then(d => {
        if (alive) {
          setDetail(d)
          setLoading(false)
        }
      })
    } else setDetail(null)

    return () => {
      alive = false
    }
  }, [row, speciesId, className])

  const wt = detail?.weightTrack
  const seasonYear = new Date().getFullYear()

  return (
    <SheetDrawer open={!!row} onClose={onClose} PaperProps={{ sx: sheetPaperSx('lg') }}>
      {row && (
        <Sheet>
          <SheetHeader
            avatar
            title={row.name}
            stats={[
              { label: 'Eggs', value: row.eggs },
              { label: 'Clutches', value: row.clutches },
              // hatch outcome is a COUNT, never a percentage (demo review 2026-09-04)
              { label: 'Hatched', value: `${row.hatched} of ${row.eggs}` }
            ]}
            onClose={onClose}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {loading || !detail ? (
              <SheetEmpty>Loading…</SheetEmpty>
            ) : (
              <>
                {/* Clutch view SIMPLIFIED (demo review 2026-09-04): clutch + egg count,
                    hatch outcome as "2 of 3" — the per-egg fate dots and legend retired. */}
                <SheetSection first label='Clutches'>
                  {detail.clutches.map((cl, ci) => (
                    <Box
                      key={cl.clutchId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        py: 3.5,
                        borderBottom: ci < detail.clutches.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none'
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {cl.clutchId}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
                          {fmtD(cl.laidDate)} • {cl.size} {cl.size === 1 ? 'egg' : 'eggs'}
                        </Typography>
                      </Box>
                      <Typography sx={{ ml: 'auto', fontSize: '1rem', fontWeight: 600, color: cl.hatched === 0 ? c.neutralSecondary : c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {cl.hatched} of {cl.size} hatched
                      </Typography>
                    </Box>
                  ))}
                </SheetSection>

                {/* seasonal chart = the kit year-per-line LINE (one season here = one line) */}
                <SheetSection label='Monthly Laying Rhythm'>
                  <YearLinesChart series={[{ year: seasonYear, values: detail.monthly }]} accent={skin.ACCENT_FILL} noun='eggs' height={220} />
                </SheetSection>

                {wt && (
                  <SheetSection label={`Egg Weight Loss vs Ideal • ${wt.startWeight} g • ${wt.incubationDays}-day incubation`} noDivider>
                    <TrendAreaChart
                      values={wt.actual}
                      labels={wt.ideal.map((_, d) => `Day ${d}`)}
                      color={theme.palette.secondary.main}
                      name='This egg'
                      unit=' g'
                      height={240}
                      corridor={{
                        ideal: wt.ideal,
                        upper: wt.bandUpper,
                        lower: wt.bandLower,
                        idealName: `Ideal (${wt.targetLossPct}% loss)`,
                        breachIndex: wt.breachDay ?? undefined
                      }}
                    />
                  </SheetSection>
                )}
              </>
            )}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

/** The whole breeding-analytics zone — the tab's body. */

const BreedingAnalytics: React.FC<{
  breeding: SpeciesFunnel
  avgEggWeight?: { grams: number; n: number }
  /** Raw egg records — the only per-site source for avg weight + discard reasons. */
  eggRecords?: SpeciesEgg[]
}> = ({ breeding: s, avgEggWeight, eggRecords }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // Portrait: roster tabs + site filter + search stack as two rows (Medical-tab pattern).
  const portrait = useMediaQuery('(orientation: portrait)')
  const heroPhoto = React.useContext(HeroPhotoContext)
  const [openFemale, setOpenFemale] = useState<FemaleRow | null>(null)
  const [rosterTab, setRosterTabRaw] = useState<'all' | 'none' | 'one' | 'twoPlus'>('all')
  const [q, setQRaw] = useState('')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetSpec | null>(null)
  const [femTab, setFemTab] = useState<string>('laid')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  // any roster re-scope (tab / search / site) lands back on page 1
  const setRosterTab = (v: 'all' | 'none' | 'one' | 'twoPlus') => {
    setRosterTabRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const setQ = (v: string) => {
    setQRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const pickSite = (v: string | null) => {
    setSiteFilter(v)
    setPm(p => ({ ...p, page: 0 }))
  }

  /* ── page scope (user call 2026-09-06): ONE white control strip on top — the CoL
     grammar (period 1Y|2Y|3Y|Custom left, site right). Site scopes EVERYTHING below;
     the numbers re-derive EXACTLY from the per-female rows (eggs/fertile/hatched and
     the per-female monthly arrays), never scaled from species aggregates. ── */
  const [periodMode, setPeriodMode] = useState<'quick' | 'range'>('quick')
  const [preset, setPreset] = useState<'last_1y' | 'last_2y' | 'last_3y'>('last_1y')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const scopedFemales = useMemo(
    () => (siteFilter ? s.females_rows.filter(f => f.site === siteFilter) : s.females_rows),
    [s.females_rows, siteFilter]
  )
  const scoped = useMemo(() => {
    if (!siteFilter)
      return {
        laid: s.laid,
        fertile: s.fertile,
        hatched: s.hatched,
        laidFemales: s.laidFemales,
        neverLaid: s.neverLaid,
        monthly: s.monthlyLaid,
        monthlyHatched: s.monthlyHatched
      }

    return {
      laid: scopedFemales.reduce((t, f) => t + f.eggs, 0),
      fertile: scopedFemales.reduce((t, f) => t + f.fertile, 0),
      hatched: scopedFemales.reduce((t, f) => t + f.hatched, 0),
      laidFemales: scopedFemales.filter(f => f.laid).length,
      neverLaid: scopedFemales.filter(f => !f.laid).length,
      monthly: Array.from({ length: 12 }, (_, m) => scopedFemales.reduce((t, f) => t + (f.monthly?.[m] || 0), 0)),
      monthlyHatched: Array.from({ length: 12 }, (_, m) => scopedFemales.reduce((t, f) => t + (f.monthlyHatched?.[m] || 0), 0))
    }
  }, [siteFilter, s, scopedFemales])

  // Avg egg weight under a site pick — from the egg records themselves (they carry site).
  const scopedAvgWeight = useMemo(() => {
    if (!siteFilter) return avgEggWeight
    const ws = (eggRecords ?? [])
      .filter(e => e.site === siteFilter)
      .map(e => e.weight)
      .filter((w): w is number => typeof w === 'number' && w > 0)
    if (!ws.length) return undefined

    return { grams: Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10, n: ws.length }
  }, [siteFilter, eggRecords, avgEggWeight])

  // Discard reasons under a site pick — egg records are the only per-site reason source.
  const discardReasons = useMemo(() => {
    if (!siteFilter) return s.discardReasons
    const lost = (eggRecords ?? []).filter(e => e.site === siteFilter && e.discardReason)
    const m = new Map<string, number>()
    lost.forEach(e => m.set(e.discardReason as string, (m.get(e.discardReason as string) || 0) + 1))

    return [...m.entries()]
      .map(([reason, n]) => ({ reason, eggs: n, pct: lost.length ? Math.round((n / lost.length) * 100) : 0 }))
      .sort((a, b) => b.eggs - a.eggs)
  }, [siteFilter, s.discardReasons, eggRecords])

  const clutchTotal = scopedFemales.reduce((t, f) => t + f.clutches, 0)

  /* per-female roster — tab (all / laid nothing) + site + search scope the same table */
  const roster = useMemo(() => {
    const query = q.trim().toLowerCase()

    const inTab = (f: FemaleRow) =>
      rosterTab === 'all' ? true : rosterTab === 'none' ? !f.laid : rosterTab === 'one' ? f.clutches === 1 : f.clutches >= 2

    return s.females_rows.filter(
      f =>
        inTab(f) &&
        (!siteFilter || f.site === siteFilter) &&
        (!query || `${f.name} ${f.identifier} ${f.site} ${f.enclosure}`.toLowerCase().includes(query))
    )
  }, [s.females_rows, rosterTab, siteFilter, q])

  /* site dropdown options — every site that holds a female, biggest first */
  const siteOpts = useMemo(() => {
    const m = new Map<string, number>()
    s.females_rows.forEach(f => f.site && m.set(f.site, (m.get(f.site) ?? 0) + 1))

    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([site, n]) => ({ site, n }))
  }, [s.females_rows])
  const femaleRows = useMemo(() => {
    const start = pm.page * pm.pageSize

    return roster.slice(start, start + pm.pageSize).map(f => ({ ...f, id: f.antzId }))
  }, [roster, pm.page, pm.pageSize])

  /* site rides the card ONLY when the list the user sees spans >1 site (hard rule):
     a site-filtered roster — or a species held at one site — omits it */
  const rosterMultiSite = useMemo(
    () => !siteFilter && new Set(roster.map(f => f.site).filter(Boolean)).size > 1,
    [roster, siteFilter]
  )

  /* laying-calendar peak: the best consecutive 3-month window (site-scoped months) */
  const peak = useMemo(() => {
    const m = scoped.monthly
    const total = m.reduce((a, b) => a + b, 0)
    if (!total) return null
    let best = { i: 0, sum: -1 }
    for (let i = 0; i < 12; i++) {
      const sum = m[i] + m[(i + 1) % 12] + m[(i + 2) % 12]
      if (sum > best.sum) best = { i, sum }
    }

    return { label: `${MONTH_L[best.i]}–${MONTH_L[(best.i + 2) % 12]}`, pct: Math.round((best.sum / total) * 100) }
  }, [scoped.monthly]) // eslint-disable-line react-hooks/exhaustive-deps

  /* seasonal laying = the kit YearLinesChart (LINE, year-per-line, Jan–Dec — the
     2026-09-04 standard). The funnel carries monthly LAID counts for the current
     season only, so the ladder holds one line; more seasons join as the data grows. */
  const seasonYear = Number(s.season) || new Date().getFullYear()
  const layingSeries: YearSeries[] = useMemo(
    () => [{ year: seasonYear, values: scoped.monthly }],
    [seasonYear, scoped.monthly]
  )

  /* period window (the CoL 1Y|2Y|3Y|Custom grammar, cap 5): windows the year lines.
     One season of laid counts exists today, so every window shows the same single
     line — the wiring is real and more seasons join the ladder as their data lands. */
  const seriesYears = layingSeries.map(sr => sr.year)
  const latestYear = seriesYears[0]
  const CAP = 5
  const enterCustom = () => {
    setPeriodMode('range')
    if (yearFrom == null && yearTo == null && latestYear != null) {
      setYearFrom(Math.max(seriesYears[seriesYears.length - 1] ?? latestYear, latestYear - (CAP - 1)))
      setYearTo(latestYear)
    }
  }
  const window = periodMode === 'range'
    ? { from: yearFrom ?? (latestYear - (CAP - 1)), to: yearTo ?? latestYear }
    : { from: latestYear - (preset === 'last_1y' ? 0 : preset === 'last_2y' ? 1 : 2), to: latestYear }
  const visibleSeries = layingSeries.filter(sr => sr.year >= window.from && sr.year <= window.to)

  const prevPill = (f: FemaleRow) => {
    if (!f.laid) return <StatusChip label='No eggs this season' tone='neutral' />
    if (f.prevHatchPct == null) return <StatusChip label='No eggs last season' tone='neutral' />
    const d = Math.round(f.hatchPct - f.prevHatchPct)
    if (d >= 1) return <StatusChip label={`▲ ${d} pts`} tone='success' />
    if (d <= -10) return <StatusChip label={`▼ ${-d} pts`} tone='error' />
    if (d <= -1) return <StatusChip label={`▼ ${-d} pts`} tone='caution' />

    return <StatusChip label='Same as last season' tone='neutral' />
  }

  /* ---- what each drill sheet shows; every list sums back to the stat that opened it ---- */
  const trail = (txt: string, warn = false) => (
    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: warn ? c.Tertiary : c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {txt}
    </Typography>
  )
  const sheetView: SheetView | null = useMemo(() => {
    if (!sheet) return null
    // every sheet works the SAME scope the page shows (site-filtered when one is picked)
    const layers = scopedFemales.filter(f => f.eggs > 0)
    // Standard animal-card rows (2026-09-02): aid → AnimalCardRow in ListSheet; every
    // per-female list wears the female badge. Real enclosure rides the card; site only
    // when the list the user sees spans more than one site (the card's hard rule).
    const multiSite = (list: FemaleRow[]) => new Set(list.map(f => f.site).filter(Boolean)).size > 1
    const row = (f: FemaleRow, showSite: boolean, trailing?: React.ReactNode): ListRow => {
      // REAL identifier beats synthesis — same mapping as the roster table's card cell,
      // so a female's identity reads identically in the table and her drill sheets.
      const t = (f.idType || '').toLowerCase()
      const idLabel = t.includes('ring') ? 'Ring' : t.includes('chip') || t.includes('transponder') ? 'Chip' : f.idType || 'ID'
      const hasRealId = !!f.identifier && f.identifier !== f.antzId

      return {
        key: f.antzId,
        isAnimal: true,
        aid: f.antzId,
        tag: 'female',
        title: f.name,
        enclosure: f.enclosure,
        site: showSite ? f.site : undefined,
        identifiers: hasRealId
          ? [
              { label: idLabel, value: f.identifier },
              { label: 'AID', value: f.antzId }
            ]
          : undefined,
        // ListSheet passes `title` as the card's name — shown only when AID is the
        // sole identifier (the card's hard rule); with two identifiers it stays hidden.
        trailing,
        onOpen: () => setOpenFemale(f)
      }
    }

    switch (sheet.kind) {
      case 'fertility': {
        const list = [...layers].sort((a, b) => a.fertile / a.eggs - b.fertile / b.eggs)
        const ms = multiSite(list)

        return {
          title: 'Fertility by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Fertile', value: `${scoped.fertile} of ${scoped.laid}` },
            { label: 'Rate', value: `${scoped.laid ? Math.round((scoped.fertile / scoped.laid) * 100) : 0}%` }
          ],
          // no % in sheet rows (2026-08-05) — the count pair is enough; coral ONLY for total failure
          rows: list.map(f => row(f, ms, trail(`${f.fertile} of ${f.eggs}`, f.fertile === 0)))
        }
      }
      case 'eggsByFemale': {
        const list = [...layers].sort((a, b) => b.eggs - a.eggs)
        const ms = multiSite(list)

        return {
          title: 'Eggs & Clutches by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: scoped.laid },
            { label: 'Clutches', value: clutchTotal },
            { label: 'Avg / clutch', value: clutchTotal ? Math.round((scoped.laid / clutchTotal) * 10) / 10 : 0 }
          ],
          rows: list.map(f => row(f, ms, trail(`${f.eggs} eggs • ${f.clutches} clutches`)))
        }
      }
      case 'femalesLaid': {
        const list = femTab === 'laid' ? scopedFemales.filter(f => f.laid) : scopedFemales.filter(f => !f.laid)
        const ms = multiSite(list)

        return {
          title: 'Females This Season',
          icon: 'mdi:gender-female',          stats: [
            { label: 'Laid at least once', value: scoped.laidFemales },
            { label: 'Laid nothing', value: scoped.neverLaid }
          ],
          tabs: [
            { key: 'laid', label: `Laid (${scoped.laidFemales})` },
            { key: 'none', label: `Laid nothing (${scoped.neverLaid})` }
          ],
          tab: femTab,
          onTab: setFemTab,
          rows: list.map(f => row(f, ms, femTab === 'laid' ? trail(`${f.eggs} eggs`) : undefined))
        }
      }
      case 'month': {
        const m = sheet.m
        const list = scopedFemales
          .filter(f => (f.monthly[m] || 0) > 0)
          .sort((a, b) => (b.monthly[m] || 0) - (a.monthly[m] || 0))
        const ms = multiSite(list)

        return {
          title: `${MONTH_FULL[m]} — Eggs`,
          icon: 'mdi:calendar-month-outline',          stats: [
            { label: 'Laid', value: scoped.monthly[m] },
            // per-female monthly FERTILE doesn't exist — the species-wide figure only holds unscoped
            ...(siteFilter ? [] : [{ label: 'Fertile', value: s.monthlyFertile[m] }]),
            { label: 'Hatched', value: scoped.monthlyHatched[m] }
          ],
          rows: list.map(f => row(f, ms, trail(`laid ${f.monthly[m]} • hatched ${f.monthlyHatched[m] || 0}`)))
        }
      }
      case 'outcome': {
        const oc = sheet.outcome
        const val = (f: FemaleRow) =>
          oc === 'hatched' ? f.hatched : oc === 'died' ? Math.max(0, f.fertile - f.hatched) : Math.max(0, f.eggs - f.fertile)
        const total = oc === 'hatched' ? scoped.hatched : oc === 'died' ? scoped.fertile - scoped.hatched : scoped.laid - scoped.fertile
        const title = oc === 'hatched' ? 'Hatched — by Female' : oc === 'died' ? 'Died Developing — by Female' : 'Infertile — by Female'
        const list = layers.filter(f => val(f) > 0).sort((a, b) => val(b) - val(a))
        const ms = multiSite(list)

        return {
          title,
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: total },
            { label: 'Share of laid', value: `${scoped.laid ? Math.round((total / scoped.laid) * 100) : 0}%` }
          ],
          // neutral ink — this sheet IS a loss list, colouring every row coral says nothing
          rows: list.map(f =>
            row(
              f,
              ms,
              trail(
                oc === 'hatched'
                  ? `${f.hatched} of ${f.eggs} eggs`
                  : oc === 'died'
                    ? `${val(f)} of ${f.fertile} fertile`
                    : `${val(f)} of ${f.eggs} eggs`
              )
            )
          )
        }
      }
    }
  }, [sheet, femTab, s, clutchTotal, scopedFemales, scoped, siteFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  /* standard animal card cell (2026-09-02): real identifier (chip/ring) beats synthesis —
     AID always rides; the display name shows only when AID is the sole identifier */
  const femaleCardCell = (f: FemaleRow) => {
    const syn = synthAnimalIdentity(f.antzId)
    const hasRealId = !!f.identifier && f.identifier !== f.antzId
    const t = (f.idType || '').toLowerCase()
    const idLabel = t.includes('ring') ? 'Ring' : t.includes('chip') || t.includes('transponder') ? 'Chip' : f.idType || 'ID'
    const identifiers = hasRealId
      ? [
          { label: idLabel, value: f.identifier },
          { label: 'AID', value: f.antzId }
        ]
      : syn.identifiers

    return (
      // TABLE-VIEW minimal card = the Population grammar (user call 2026-09-05): EXACTLY
      // 3 text rows — two identifiers + ONE location line (site while the visible list
      // spans sites, enclosure once it doesn't); photo 94 → 75.
      <AnimalIdCard
        identifiers={identifiers}
        enclosure={rosterMultiSite ? undefined : f.enclosure ?? syn.enclosure}
        site={rosterMultiSite ? f.site : undefined}
        tag='female'
        name={f.name !== f.identifier && f.name !== f.antzId ? f.name : undefined}
        size={75}
        photo={syn.hasPhoto ? heroPhoto?.src : undefined}
        photoPos={heroPhoto?.bgPos}
      />
    )
  }

  const femaleCols: GridColDef[] = [
    {
      minWidth: 380,
      flex: 1,
      sortable: false,
      field: 'name',
      headerName: 'Female',
      renderCell: (p: GridRenderCellParams) => femaleCardCell(p.row as FemaleRow)
    },
    {
      minWidth: 170,
      flex: 1,
      sortable: false,
      field: 'clutches',
      headerName: 'Clutches',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.clutches}</Typography>
          {p.row.clutchSizes.length > 0 && <ClutchBars sizes={p.row.clutchSizes} />}
        </Box>
      )
    },
    {
      minWidth: 110,
      flex: 0.7,
      sortable: false,
      field: 'eggs',
      headerName: 'Eggs',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.eggs}</Typography>
      )
    },
    {
      // hatch outcome = a COUNT pair, never a percentage (demo review 2026-09-04)
      minWidth: 140,
      flex: 0.9,
      sortable: false,
      field: 'hatched',
      headerName: 'Hatched',
      renderCell: (p: GridRenderCellParams) =>
        p.row.eggs ? (
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {p.row.hatched} of {p.row.eggs}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }}>—</Typography>
        )
    },
    {
      minWidth: 190,
      flex: 1,
      sortable: false,
      field: 'prevHatchPct',
      headerName: 'Vs Her Last Season',
      renderCell: (p: GridRenderCellParams) => prevPill(p.row)
    }
  ]

  /* roster tabs — vaccination statusTabs pattern: tabs in the card title slot, per-tab underline */
  const rosterTabs = (
    // Never wraps: one row, overflow scrolls (the kit's underline-tab pattern).
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', ...thinScrollbarSx(theme) }}>
      {[
        { key: 'all' as const, label: 'All Females', n: s.totalFemales, accent: theme.palette.primary.dark },
        { key: 'none' as const, label: 'Laid Nothing', n: s.neverLaid, accent: c.Tertiary },
        { key: 'one' as const, label: '1 Clutch', n: s.clutchBuckets.one, accent: theme.palette.primary.dark },
        { key: 'twoPlus' as const, label: '2+ Clutches', n: s.clutchBuckets.twoPlus, accent: theme.palette.primary.dark }
      ].map(t => {
        const active = rosterTab === t.key

        return (
          <Box
            key={t.key}
            onClick={() => setRosterTab(t.key)}
            role='tab'
            aria-selected={active}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5, flexShrink: 0, borderBottom: '2.5px solid', borderColor: active ? t.accent : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { borderColor: active ? t.accent : c.OutlineVariant } }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: active ? t.accent : c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {t.label}
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 700, color: active ? t.accent : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
              {t.n.toLocaleString()}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )

  /* ── the headline strip = the standard SignalsBand (demo review 2026-09-04): Laid ·
     Fertile · Hatched stay; the Fertility-% and Died-Developing stats are RETIRED; Avg
     Egg Weight (from the weighed egg records) and Females (laying females) join. Counts
     are plain volume/growth figures — neutral warm ink, Hatched in the list green;
     zeros go quiet on their own. Every live cell opens its drill sheet. ── */
  // NO hint lines (user call 2026-09-06: two-line cells only — label + figure);
  // Females = the laying-females COUNT alone (no "2 of 10").
  const bandCells = [
    {
      key: 'laid',
      label: 'Laid',
      count: scoped.laid,
      tone: 'neutral' as const,
      onOpen: () => setSheet({ kind: 'eggsByFemale' })
    },
    {
      key: 'fertile',
      label: 'Fertile',
      count: scoped.fertile,
      tone: 'neutral' as const,
      onOpen: () => setSheet({ kind: 'fertility' })
    },
    {
      key: 'hatched',
      label: 'Hatched',
      count: scoped.hatched,
      tone: 'good' as const,
      onOpen: () => setSheet({ kind: 'outcome', outcome: 'hatched' })
    },
    ...(scopedAvgWeight
      ? [
          {
            key: 'avgWeight',
            label: 'Avg Egg Weight',
            count: scopedAvgWeight.n,
            display: `${scopedAvgWeight.grams} g`,
            tone: 'neutral' as const
          }
        ]
      : []),
    {
      key: 'females',
      label: 'Females',
      count: scoped.laidFemales,
      tone: 'neutral' as const,
      onOpen: () => {
        setFemTab('laid')
        setSheet({ kind: 'femalesLaid' })
      }
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── ZONE 0 · page scope — the CoL strip grammar (user call 2026-09-06):
          1Y|2Y|3Y|Custom left, site right, ONE white card. Site re-derives every
          number below from the per-female rows. ── */}
      <Box
        sx={{
          borderRadius: skin.CARD_RADIUS,
          border: `1px solid ${skin.HAIR}`,
          bgcolor: '#ffffff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', '& > *': { flexShrink: 0 } }}>
          <ViewToggle
            height={CTRL_H}
            items={[
              { key: 'last_1y', label: '1Y' },
              { key: 'last_2y', label: '2Y' },
              { key: 'last_3y', label: '3Y' },
              { key: 'custom', label: 'Custom' }
            ]}
            value={periodMode === 'range' ? 'custom' : preset}
            onChange={k => {
              if (k === 'custom') enterCustom()
              else {
                setPeriodMode('quick')
                setPreset(k as 'last_1y' | 'last_2y' | 'last_3y')
              }
            }}
          />
          {periodMode === 'range' && (
            <>
              <RangeSelect value={yearFrom} onPick={setYearFrom} items={yearItemsFor(seriesYears, yearTo, CAP, 'from')} anyLabel='From' />
              <Typography sx={{ color: c.neutralSecondary }}>–</Typography>
              <RangeSelect value={yearTo} onPick={setYearTo} items={yearItemsFor(seriesYears, yearFrom, CAP, 'to')} anyLabel='To' />
            </>
          )}
        </Box>
        <Box sx={{ flex: 1 }} />
        {siteOpts.length > 1 && (
          <SiteFilterControl
            sites={siteOpts as any}
            sitesTotal={siteOpts.length}
            tracked={s.totalFemales}
            value={siteFilter}
            onChange={pickSite}
            overdueWord='overdue'
            caption={(x: any) => `${x.n} females`}
          />
        )}
      </Box>

      {/* ── ZONE 1 · the season at a glance — ONE white SignalsBand card ── */}
      <SignalsBand cells={bandCells} />

      {/* ── ZONE 2 · seasonal laying — kit YearLinesChart (LINE, year-per-line, Jan–Dec) ── */}
      <SectionCard title='Eggs Laid — Month by Month' titleMb={3}>
        {scoped.laid === 0 ? (
          <EmptyState message='No eggs laid this season.' />
        ) : (
          <>
            <YearLinesChart
              series={visibleSeries}
              accent={skin.ACCENT_FILL}
              noun='eggs'
              onPoint={(_y, m) => scoped.monthly[m] > 0 && setSheet({ kind: 'month', m })}
            />
            {peak && (
              <Typography sx={{ fontSize: 15, color: c.neutralSecondary, mt: 1 }}>
                Peak <b style={{ color: c.OnSurfaceVariant }}>{peak.label}</b> • {peak.pct}% of the season's eggs — tap a month for its
                fertile / hatched breakup
              </Typography>
            )}
          </>
        )}
      </SectionCard>

      {/* ── the losses: every discard reason as a tag — reason + egg count, nothing else ── */}
      <SectionCard title='Why Eggs Were Discarded' titleMb={2}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {discardReasons.map(d => (
            <Box
              key={d.reason}
              onClick={() => setSheet({ kind: 'outcome', outcome: d.reason === 'Infertile on candling' ? 'infertile' : 'died' })}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 1.25,
                borderRadius: '20px',
                border: `1px solid ${c.OutlineVariant}`,
                cursor: 'pointer',
                transition: `all ${skin.DUR_FAST} ${skin.EASE}`,
                '&:hover': { borderColor: theme.palette.primary.dark, backgroundColor: c.Surface }
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: c.OnSurfaceVariant }}>{d.reason}</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: theme.palette.primary.dark, fontVariantNumeric: 'tabular-nums' }}>
                {d.eggs}
              </Typography>
            </Box>
          ))}
        </Box>
      </SectionCard>

      {/* ── per-female performance — tabbed table (vaccination pattern): tabs in the title,
          site dropdown + search in the action slot. Landscape: one row. Portrait: tabs row,
          then ONE scrolling controls row (the ControlsRow rule — never a wrapped second line). ── */}
      {(() => {
        // site moved to the page-scope strip (2026-09-06) — the roster keeps tabs + search
        const searchCtl = <SearchPill elastic value={q} onChange={setQ} placeholder='Search females…' />
        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            {rosterTabs}
            <ControlsRow>{searchCtl}</ControlsRow>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : rosterTabs}
        action={
          portrait ? undefined : (
            <ControlsRow sx={{ width: 'auto', flex: '1 1 auto', justifyContent: 'flex-end', ml: 3, maxWidth: 520 }}>
              {searchCtl}
            </ControlsRow>
          )
        }
        titleMb={2}
      >
        <DetailTable
          columns={femaleCols}
          rows={femaleRows}
          total={roster.length}
          rowHeight={128} // 75px minimal-card block + breathing room (Population standard, 2026-09-05)
          stickyFields={['name']}
          paginationModel={pm}
          setPaginationModel={setPm}
          onRowClick={(p: any) => setOpenFemale(p.row)}
        />
      </SectionCard>
        )
      })()}

      <FemaleDrawer speciesId={s.speciesId} className={s.className} row={openFemale} onClose={() => setOpenFemale(null)} />
      <ListSheet view={sheetView} onClose={() => setSheet(null)} />
    </Box>
  )
}

/* ---------------------------------------------------------------- the tab */
const EggsTab: React.FC<{ eggs?: SpeciesEggs; breeding?: SpeciesFunnel | null }> = ({ eggs, breeding }) => {
  // Operational egg list removed (user, 2026-08-10) — the tab IS the breeding analytics zone.
  const isEggLayer = !!breeding || !!eggs?.isEggLayer

  // Avg egg weight — derived from the weighed egg records (SpeciesEgg.weight, grams).
  const avgEggWeight = useMemo(() => {
    const ws = (eggs?.eggs ?? []).map(e => e.weight).filter((w): w is number => typeof w === 'number' && w > 0)
    if (!ws.length) return undefined

    return { grams: Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10, n: ws.length }
  }, [eggs])

  if (!isEggLayer) return <EmptyState message='Eggs are tracked for egg-laying species only.' />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {breeding ? (
        <BreedingAnalytics breeding={breeding} avgEggWeight={avgEggWeight} eggRecords={eggs?.eggs} />
      ) : (
        <EmptyState message='No breeding data recorded for this species.' />
      )}
    </Box>
  )
}

export default EggsTab
