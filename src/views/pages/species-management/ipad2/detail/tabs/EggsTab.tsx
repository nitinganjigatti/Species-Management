'use client'

import React, { useMemo, useState } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import type { SpeciesEggs } from 'src/types/species-management/detail'
import {
  AnimalCell,
  ChartHoverCard,
  DetailTable,
  EmptyState,
  SectionCard,
  SeasonalColumnChart,
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetSection,
  SHEET_PX,
  sheetPaperSx,
  StatTile,
  StatusChip,
  TrendAreaChart,
  ListSheet,
  SheetDrawer,
  thinScrollbarSx
} from 'src/views/pages/species-management/ipad2/detail/detailUi'
import type { ListRow, SheetView } from 'src/views/pages/species-management/ipad2/detail/detailUi'
import { SiteFilterControl, TableSearch } from 'src/views/pages/species-management/ipad2/detail/tabs/MedicalTab'
import { getFemaleDetail } from 'src/lib/api/species-management/breeding-eggs'
import type { EggFate, FemaleDetail, FemaleRow, SpeciesFunnel } from 'src/lib/api/species-management/breeding-eggs'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

/* ============================================================ breeding analytics (top zone) */

/** Plain proportion bar — no target tick; targets were rejected (2026-07-30 review). */
const PlainBar: React.FC<{ pct: number }> = ({ pct }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ position: 'relative', height: 9, width: 92, borderRadius: 5, bgcolor: c.Surface, border: `1px solid ${c.SurfaceVariant}` }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, width: `${Math.min(100, pct)}%`, bgcolor: theme.palette.primary.main }} />
    </Box>
  )
}

/** Clutch-bar sparkline: one bar per clutch, height = egg count. */
const ClutchBars: React.FC<{ sizes: number[] }> = ({ sizes }) => {
  const theme = useTheme() as any
  const max = Math.max(1, ...sizes)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 22 }}>
      {sizes.map((s, i) => (
        <Box key={i} sx={{ width: 6, borderRadius: '1px 1px 0 0', bgcolor: theme.palette.secondary.main, opacity: 0.85, height: `${Math.max(14, (s / max) * 100)}%` }} />
      ))}
    </Box>
  )
}

/** Egg-fate dot — hatched green, infertile grey, discarded (died in shell / cracked) coral (2026-08-05). */
const fateColor = (f: EggFate, theme: any) => {
  const c = cc(theme)

  return f === 'hatched' ? theme.palette.primary.main : f === 'infertile' ? c.OutlineVariant : f === 'incubating' ? theme.palette.secondary.main : c.Tertiary
}

const MONTH_L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* ------------------------------------------------------ drill sheets (every stat opens one) */

type SheetSpec =
  | { kind: 'fertility' }
  | { kind: 'hatchOfFertile' }
  | { kind: 'eggsByFemale' }
  | { kind: 'femalesLaid' }
  | { kind: 'month'; m: number }
  | { kind: 'outcome'; outcome: 'hatched' | 'died' | 'infertile' }

// ListRow / SheetView / ListSheet were promoted to detailUi (2026-08-07) — one generic
// list sheet for every tab; imported above.

/** The season month by month — laid › fertile › hatched NESTED in one column per month.
 *  A thick light band = infertile eggs that month (pairing problem); a thick middle band =
 *  fertile eggs that died (incubation problem). Click a month for its detail. */
const NestedSeasonChart: React.FC<{ s: SpeciesFunnel; onMonth: (m: number) => void }> = ({ s, onMonth }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const max = Math.max(1, ...s.monthlyLaid)
  const H = 220
  const px = (v: number) => Math.round((v / max) * (H - 10))
  const layers = (m: number) => [
    { v: s.monthlyLaid[m], col: `${theme.palette.primary.main}26` },
    { v: s.monthlyFertile[m], col: `${theme.palette.primary.main}99` },
    { v: s.monthlyHatched[m], col: theme.palette.primary.main }
  ]

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: H + 30 }}>
      {MONTH_L.map((ml, m) => (
        <ChartHoverCard
          key={ml}
          title={ml}
          disabled={s.monthlyLaid[m] === 0}
          rows={layers(m).map((b, i) => ({ color: b.col, label: ['Laid', 'Fertile', 'Hatched'][i], value: b.v.toLocaleString() }))}
        >
          <Box
            onClick={() => s.monthlyLaid[m] > 0 && onMonth(m)}
            sx={{
              flex: 1,
              position: 'relative',
              borderRadius: '6px 6px 0 0',
              cursor: s.monthlyLaid[m] > 0 ? 'pointer' : 'default',
              '&:hover': s.monthlyLaid[m] > 0 ? { backgroundColor: `${theme.palette.primary.main}0D` } : undefined
            }}
          >
            {layers(m).map((b, i) =>
              b.v > 0 ? (
                <Box
                  key={i}
                  sx={{ position: 'absolute', left: '16%', right: '16%', bottom: 30, height: Math.max(3, px(b.v)), borderRadius: '4px 4px 0 0', backgroundColor: b.col }}
                />
              ) : null
            )}
            <Typography sx={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 14, color: c.neutralSecondary }}>
              {ml}
            </Typography>
          </Box>
        </ChartHoverCard>
      ))}
    </Box>
  )
}

/** Per-female detail drawer (L3): clutch-by-clutch, monthly, egg weight-loss vs ideal corridor. */
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
              { label: 'Hatched', value: `${row.hatched} • ${row.hatchPct}%` }
            ]}
            onClose={onClose}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {loading || !detail ? (
              <SheetEmpty>Loading…</SheetEmpty>
            ) : (
              <>
                <SheetSection first>
                  {/* the legend leads — it is the section's key, not a trailing row item.
                      three fates only — died-in-shell / cracked read as one "Discarded" (2026-08-05) */}
                  <Box sx={{ display: 'flex', gap: 4, pb: 1, fontSize: 14, color: c.neutralSecondary }}>
                    {[
                      ['Hatched', theme.palette.primary.main],
                      ['Infertile', c.OutlineVariant],
                      ['Discarded', c.Tertiary]
                    ].map(([lbl, col]) => (
                      <Box key={lbl as string} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 11, height: 13, borderRadius: '50%', bgcolor: col as string }} />
                        {lbl}
                      </Box>
                    ))}
                  </Box>
                  {detail.clutches.map((cl, ci) => (
                    <Box
                      key={cl.clutchId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        py: 4,
                        borderBottom: ci < detail.clutches.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none'
                      }}
                    >
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none' }}>
                        {cl.clutchId}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {cl.fates.map((f, i) => (
                          <Box key={i} sx={{ width: 12, height: 15, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', bgcolor: fateColor(f, theme) }} />
                        ))}
                      </Box>
                      <Typography sx={{ ml: 'auto', fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {cl.size} • {cl.hatched} hatched
                      </Typography>
                    </Box>
                  ))}
                </SheetSection>

                <SheetSection label='Monthly Laying Rhythm'>
                  <SeasonalColumnChart scroll values={detail.monthly} labels={detail.monthlyLabels} color={theme.palette.secondary.main} name='Eggs laid' height={200} />
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

/** The whole breeding-analytics zone that sits ABOVE the operational egg list. */


const BreedingAnalytics: React.FC<{ breeding: SpeciesFunnel }> = ({ breeding: s }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // Portrait: roster tabs + site filter + search stack as two rows (Medical-tab pattern).
  const portrait = useMediaQuery('(orientation: portrait)')
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
  const clutchTotal = s.females_rows.reduce((t, f) => t + f.clutches, 0)
  const laidPct = s.totalFemales ? Math.round((s.laidFemales / s.totalFemales) * 100) : 0

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

  /* laying-calendar peak: the best consecutive 3-month window */
  const peak = useMemo(() => {
    const m = s.monthlyLaid
    const total = m.reduce((a, b) => a + b, 0)
    if (!total) return null
    let best = { i: 0, sum: -1 }
    for (let i = 0; i < 12; i++) {
      const sum = m[i] + m[(i + 1) % 12] + m[(i + 2) % 12]
      if (sum > best.sum) best = { i, sum }
    }

    return { label: `${MONTH_L[best.i]}–${MONTH_L[(best.i + 2) % 12]}`, pct: Math.round((best.sum / total) * 100) }
  }, [s.monthlyLaid]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const layers = s.females_rows.filter(f => f.eggs > 0)
    // The project's sheet animal-row convention (Vaccination pattern): avatar • name •
    // enclosure · site caption • trailing • chevron. Unnamed animals get the ID-type subline
    // so a bare transponder number is labelled.
    const row = (f: FemaleRow, trailing?: React.ReactNode): ListRow => ({
      key: f.antzId,
      isAnimal: true,
      title: f.name,
      caption: f.site, // site only — enclosure comes back when a drill needs it (2026-08-05)
      subline: f.name === f.identifier ? f.idType : undefined, // only when no mock name exists — label the bare identifier
      trailing,
      onOpen: () => setOpenFemale(f)
    })

    switch (sheet.kind) {
      case 'fertility':
        return {
          title: 'Fertility by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Fertile', value: `${s.fertile} of ${s.laid}` },
            { label: 'Rate', value: `${s.fertilityPct}%` }
          ],
          // no % in sheet rows (2026-08-05) — the count pair is enough; coral ONLY for total failure
          rows: [...layers]
            .sort((a, b) => a.fertile / a.eggs - b.fertile / b.eggs)
            .map(f => row(f, trail(`${f.fertile} of ${f.eggs}`, f.fertile === 0)))
        }
      case 'hatchOfFertile':
        return {
          title: 'Hatch of Fertile by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Hatched', value: `${s.hatched} of ${s.fertile} fertile` },
            { label: 'Rate', value: `${s.hatchOfFertilePct}%` }
          ],
          // no % in sheet rows (2026-08-05) — the count pair is enough; coral ONLY for total failure
          rows: layers
            .filter(f => f.fertile > 0)
            .sort((a, b) => a.hatched / a.fertile - b.hatched / b.fertile)
            .map(f => row(f, trail(`${f.hatched} of ${f.fertile}`, f.hatched === 0)))
        }
      case 'eggsByFemale':
        return {
          title: 'Eggs & Clutches by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: s.laid },
            { label: 'Clutches', value: clutchTotal },
            { label: 'Avg / clutch', value: s.avgClutchSize }
          ],
          rows: [...layers].sort((a, b) => b.eggs - a.eggs).map(f => row(f, trail(`${f.eggs} eggs • ${f.clutches} clutches`)))
        }
      case 'femalesLaid': {
        const list = femTab === 'laid' ? s.females_rows.filter(f => f.laid) : s.females_rows.filter(f => !f.laid)

        return {
          title: 'Females This Season',
          icon: 'mdi:gender-female',          stats: [
            { label: 'Laid at least once', value: s.laidFemales },
            { label: 'Laid nothing', value: s.neverLaid }
          ],
          tabs: [
            { key: 'laid', label: `Laid (${s.laidFemales})` },
            { key: 'none', label: `Laid nothing (${s.neverLaid})` }
          ],
          tab: femTab,
          onTab: setFemTab,
          rows: list.map(f => row(f, femTab === 'laid' ? trail(`${f.eggs} eggs`) : undefined))
        }
      }
      case 'month': {
        const m = sheet.m
        const list = s.females_rows
          .filter(f => (f.monthly[m] || 0) > 0)
          .sort((a, b) => (b.monthly[m] || 0) - (a.monthly[m] || 0))

        return {
          title: `${MONTH_FULL[m]} — Eggs`,
          icon: 'mdi:calendar-month-outline',          stats: [
            { label: 'Laid', value: s.monthlyLaid[m] },
            { label: 'Fertile', value: s.monthlyFertile[m] },
            { label: 'Hatched', value: s.monthlyHatched[m] }
          ],
          rows: list.map(f => row(f, trail(`laid ${f.monthly[m]} • hatched ${f.monthlyHatched[m] || 0}`)))
        }
      }
      case 'outcome': {
        const oc = sheet.outcome
        const val = (f: FemaleRow) =>
          oc === 'hatched' ? f.hatched : oc === 'died' ? Math.max(0, f.fertile - f.hatched) : Math.max(0, f.eggs - f.fertile)
        const total = oc === 'hatched' ? s.hatched : oc === 'died' ? s.fertile - s.hatched : s.laid - s.fertile
        const title = oc === 'hatched' ? 'Hatched — by Female' : oc === 'died' ? 'Died Developing — by Female' : 'Infertile — by Female'
        const list = layers.filter(f => val(f) > 0).sort((a, b) => val(b) - val(a))

        return {
          title,
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: total },
            { label: 'Share of laid', value: `${s.laid ? Math.round((total / s.laid) * 100) : 0}%` }
          ],
          // neutral ink — this sheet IS a loss list, colouring every row coral says nothing
          rows: list.map(f =>
            row(
              f,
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
  }, [sheet, femTab, s, clutchTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const femaleCols: GridColDef[] = [
    {
      minWidth: 260,
      flex: 2,
      sortable: false,
      field: 'name',
      headerName: 'Female',
      renderCell: (p: GridRenderCellParams) => <AnimalCell name={p.row.name} sub={`${p.row.enclosure} • ${p.row.site}`} size={40} />
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
      minWidth: 180,
      flex: 1.1,
      sortable: false,
      field: 'hatchPct',
      headerName: 'Hatch %',
      renderCell: (p: GridRenderCellParams) =>
        p.row.eggs ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PlainBar pct={p.row.hatchPct} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.row.hatchPct}%</Typography>
          </Box>
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

  /* ── the merged hero — FOUR soft stat tiles (2026-08-10): the old 5-cell strip and the
     outcome-tiles section became ONE section in the soft-tile UI. Hatched • Fertility •
     Females Laid • Died Developing; every tile opens its sheet. Whisper tint, the icon
     chip carries the color, numbers stay ink. No green hues except Hatched's light-green
     BG token (user, 2026-08-10) — the chart below owns the solid green. */
  const died = s.failureSplit.deadInShell + s.failureSplit.earlyCracked
  const outPct = (n: number) => (s.laid ? Math.round((n / s.laid) * 100) : 0)
  const pctSpan = (txt: string) => (
    <Box component='span' sx={{ fontSize: 17, fontWeight: 700, color: c.neutralSecondary, ml: 1.75 }}>
      {txt}
    </Box>
  )
  const heroTiles: { key: string; label: string; color: string; colorDeep?: string; colorBg?: string; icon: string; value: React.ReactNode; sub: React.ReactNode; open: () => void }[] = [
    {
      key: 'hatched',
      label: 'Hatched',
      // light-green tile: the style guide's green BG token (OnBackground) — the pale
      // PrimaryContainer hue vanished at the alpha-tint derivation. Chip = standard green.
      color: theme.palette.primary.main,
      colorBg: c.OnBackground,
      colorDeep: theme.palette.primary.dark,
      icon: 'mdi:egg-outline',
      value: (
        <>
          {s.hatched}
          {pctSpan(`• ${outPct(s.hatched)}%`)}
        </>
      ),
      sub: `of ${s.laid} laid`,
      open: () => setSheet({ kind: 'outcome', outcome: 'hatched' })
    },
    {
      key: 'fertility',
      label: 'Fertility',
      color: c.antzInfo60,
      icon: 'mdi:heart-outline',
      value: `${s.fertilityPct}%`,
      sub: (
        <>
          <b>{s.fertile}</b> of {s.laid} fertile
        </>
      ),
      open: () => setSheet({ kind: 'fertility' })
    },
    {
      key: 'femalesLaid',
      label: 'Females Laid',
      color: c.moderateSecondary,
      icon: 'mdi:gender-female',
      value: (
        <>
          {s.laidFemales}/{s.totalFemales}
          {pctSpan(`• ${laidPct}%`)}
        </>
      ),
      sub: (
        <Box component='span' sx={{ color: s.neverLaid ? c.Tertiary : undefined, fontWeight: s.neverLaid ? 600 : undefined }}>
          {s.neverLaid} laid nothing
        </Box>
      ),
      open: () => {
        setFemTab('laid')
        setSheet({ kind: 'femalesLaid' })
      }
    },
    {
      key: 'died',
      label: 'Died Developing',
      color: c.Tertiary,
      colorDeep: c.TertiaryDark,
      icon: 'mdi:egg-off-outline',
      value: (
        <>
          {died}
          {pctSpan(`• ${outPct(died)}%`)}
        </>
      ),
      sub: 'review incubation',
      open: () => setSheet({ kind: 'outcome', outcome: 'died' })
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── ZONE 1 · the season at a glance — four soft stat tiles, every tile opens a sheet ── */}
      <SectionCard>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 4 }}>
          {heroTiles.map(t => (
            <StatTile key={t.key} soft icon={t.icon} color={t.color} colorDeep={t.colorDeep} colorBg={t.colorBg} label={t.label} value={t.value} sub={t.sub} onClick={t.open} />
          ))}
        </Box>
      </SectionCard>

      {/* ── ZONE 2 · the season, month by month — laid › fertile › hatched nested ── */}
      <SectionCard title='Laid › Fertile › Hatched — Month by Month' titleMb={3}>
        <NestedSeasonChart s={s} onMonth={m => setSheet({ kind: 'month', m })} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 3, flexWrap: 'wrap' }}>
          {[
            { l: 'Laid', col: `${theme.palette.primary.main}26` },
            { l: 'Fertile', col: `${theme.palette.primary.main}99` },
            { l: 'Hatched', col: theme.palette.primary.main }
          ].map(lg => (
            <Box key={lg.l} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '4px', backgroundColor: lg.col }} />
              <Typography sx={{ fontSize: 15, color: c.OnSurfaceVariant }}>{lg.l}</Typography>
            </Box>
          ))}
          {peak && (
            <Typography sx={{ fontSize: 15, color: c.neutralSecondary, ml: 'auto' }}>
              Peak <b style={{ color: c.OnSurfaceVariant }}>{peak.label}</b> • {peak.pct}% of the season's eggs
            </Typography>
          )}
        </Box>
      </SectionCard>

      {/* ── the losses: every discard reason as a tag — reason + egg count, nothing else ── */}
      <SectionCard title='Why Eggs Were Discarded' titleMb={2}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {s.discardReasons.map(d => (
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
                transition: 'all .15s ease',
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
          then full-width search up to the right-aligned site filter. ── */}
      {(() => {
        const siteFilterCtl = (
          <SiteFilterControl
            sites={siteOpts as any}
            sitesTotal={siteOpts.length}
            tracked={s.totalFemales}
            value={siteFilter}
            onChange={pickSite}
            overdueWord='overdue'
            caption={(x: any) => `${x.n} females`}
          />
        )
        const searchCtl = <TableSearch value={q} onChange={setQ} placeholder='Search females…' grow={portrait} />
        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            {rosterTabs}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {searchCtl}
              {siteFilterCtl}
            </Box>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : rosterTabs}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {searchCtl}
            </Box>
          )
        }
        titleMb={2}
      >
        <DetailTable
          columns={femaleCols}
          rows={femaleRows}
          total={roster.length}
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

/* ---------------------------------------------------------------- section divider heading */
const EggsTab: React.FC<{ eggs?: SpeciesEggs; breeding?: SpeciesFunnel | null }> = ({ eggs, breeding }) => {
  // Operational egg list removed (user, 2026-08-10) — the tab IS the breeding analytics zone.
  const isEggLayer = !!breeding || !!eggs?.isEggLayer
  if (!isEggLayer) return <EmptyState message='Eggs are tracked for egg-laying species only.' />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {breeding ? <BreedingAnalytics breeding={breeding} /> : <EmptyState message='No breeding data recorded for this species.' />}
    </Box>
  )
}

export default EggsTab
