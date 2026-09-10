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
  PillSelect,
  TrendAreaChart,
  ViewToggle,
  YearLinesChart,
  ListSheet,
  SheetDrawer,
  ColumnSettingsSheet,
  thinScrollbarSx
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import Icon from 'src/@core/components/icon'
import { CTRL_H, RangeSelect, yearItemsFor } from 'src/views/pages/species-management/ipad3/detail/tabs/CircleOfLifeTab'
import type { ColumnPref, ListRow, SheetView, YearSeries } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import SignalsBand from 'src/views/pages/species-management/ipad3/detail/tabs/medical/SignalsBand'
import { SiteFilterControl } from 'src/views/pages/species-management/ipad3/detail/tabs/MedicalTab'
import { getFemaleDetail } from 'src/lib/api/species-management/breeding-eggs'
import type { EggDetail, EggStatus, FemaleDetail, FemaleRow, SpeciesFunnel } from 'src/lib/api/species-management/breeding-eggs'

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

// Per-egg fate wording in the clutch list (dots + legend stay retired — text only).
const FATE_LABEL: Record<string, string> = {
  hatched: 'Hatched',
  infertile: 'Infertile',
  dead_in_shell: 'Dead in shell',
  early_cracked: 'Cracked early',
  incubating: 'Incubating'
}

const MONTH_L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// dd MMM yyyy — the module's hard date rule.
const fmtD = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)

  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── settings-driven roster columns (platform rule: every table gets the column
   picker — Population pattern, user call 2026-09-07). The Female card column is
   fixed; the picker chooses WHICH data columns ride beside it and their ORDER,
   saved per user in localStorage and sanitized against the registry so new keys
   append with their default state. */

const EGG_COL_LABELS: Record<string, string> = {
  clutches: 'Clutches',
  eggs: 'Eggs',
  fertile: 'Fertile',
  hatched: 'Hatched',
  prevHatchPct: 'Vs Her Last Season',
  site: 'Site',
  enclosure: 'Enclosure'
}

const EGG_DEFAULT_COLS: ColumnPref[] = [
  { key: 'clutches', on: true },
  { key: 'eggs', on: true },
  { key: 'fertile', on: false },
  { key: 'hatched', on: true },
  { key: 'prevHatchPct', on: true },
  // site/enclosure OFF by default — the card's 3rd row already carries the location
  { key: 'site', on: false },
  { key: 'enclosure', on: false }
]

const EGG_PREFS_STORE = 'ipad3:eggs:tableprefs:v1'

const loadEggColPrefs = (): ColumnPref[] => {
  try {
    const raw = window.localStorage.getItem(EGG_PREFS_STORE)
    if (!raw) return EGG_DEFAULT_COLS
    const saved = (JSON.parse(raw) as ColumnPref[]).filter(p => EGG_COL_LABELS[p.key] && typeof p.on === 'boolean')
    const missing = EGG_DEFAULT_COLS.filter(d => !saved.some(p => p.key === d.key))

    return saved.length ? [...saved, ...missing] : EGG_DEFAULT_COLS
  } catch {
    return EGG_DEFAULT_COLS
  }
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

/* ══════════════════════════════════════════════════════════════════════════════
   FEMALE PAGE + EGG SHEET (2026-09-10 rebuild, locked mockups egg_detail_flow_1_1
   [white page] + _1_2 [dark sheet hero]): the drawer is RETIRED — tapping a female
   swaps the tab to her full page; tapping any egg opens the per-egg bottom sheet
   copied from the antz egg-detail anatomy (AEID primary / UEID quiet, stat tiles,
   facts, per-egg weight log + corridor). Sparse rule: a chart needs 3 points.
   ══════════════════════════════════════════════════════════════════════════════ */

/** Status → the whole presentation vocabulary (plate/chip/wording). Color = semantics. */
const eggLook = (theme: any) => {
  const c = cc(theme)

  return {
    received: { label: 'Received', plate: c.antzSecondaryBg, glyph: theme.palette.secondary.main, ink: skin.TAB_PILL },
    incubating: { label: 'In Incubation', plate: skin.TONE_SOFT.good, glyph: skin.ACCENT_FILL, ink: skin.ACCENT_INK },
    hatched: { label: 'Hatched', plate: skin.TONE_SOFT.good, glyph: skin.ACCENT_FILL, ink: skin.ACCENT_INK },
    to_be_discarded: { label: 'To Be Discarded', plate: skin.TONE_SOFT.warn, glyph: skin.TONE_TYPE.warn, ink: skin.TONE_TYPE.warn },
    discarded: { label: 'Discarded', plate: c.BgTeritary, glyph: c.Tertiary, ink: skin.strokeOf(c.Tertiary) }
  } as Record<EggStatus, { label: string; plate: string; glyph: string; ink: string }>
}

/** The egg mark — hatched wears the crack line. */
const EggGlyph: React.FC<{ fill: string; plate: string; hatched?: boolean; size?: number; glass?: boolean }> = ({ fill, plate, hatched, size = 44, glass }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: size >= 80 ? '16px' : '12px',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      bgcolor: glass ? skin.HERO_GLASS : plate
    }}
  >
    <svg width={size * 0.5} height={size * 0.6} viewBox='0 0 22 26'>
      <path d='M11 1C6 1 1 10 1 16.5 1 21.7 5.5 25 11 25s10-3.3 10-8.5C21 10 16 1 11 1z' fill={fill} />
      {hatched && <path d='M4 12.5l3 2 3-3 4 4 4-2.5' stroke='#fff' strokeWidth='2' fill='none' />}
    </svg>
  </Box>
)

/** One egg row — plate + AEID (navy identity ink) + quiet meta, toned fate right. */
const EggListRow: React.FC<{ egg: EggDetail; divider: boolean; onOpen: () => void }> = ({ egg, divider, onOpen }) => {
  const theme = useTheme() as any
  const look = eggLook(theme)[egg.status]
  const last = egg.weighings[egg.weighings.length - 1]

  const meta =
    egg.status === 'incubating'
      ? `Day ${egg.dayNow} of ${egg.incubationDays} · last ${last?.grams} g`
      : egg.status === 'hatched'
      ? `Hatched ${fmtD(egg.hatchDate)}`
      : egg.status === 'discarded'
      ? `Discarded ${fmtD(egg.discardDate)}`
      : egg.status === 'to_be_discarded'
      ? `Requested ${fmtD(last?.date || egg.collectedDate)}`
      : `Collected ${fmtD(egg.collectedDate)}`
  const sub =
    egg.status === 'hatched'
      ? `→ ${egg.hatchlingId}`
      : egg.status === 'incubating'
      ? egg.breachDay != null
        ? 'Below corridor'
        : 'On track'
      : egg.discardReason || (egg.status === 'received' ? 'Fresh · awaiting allocation' : '')

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3.5,
        py: 3,
        px: 2,
        cursor: 'pointer',
        borderRadius: '12px',
        borderTop: divider ? `1px solid ${skin.ROW_LINE}` : 'none',
        transition: `background ${skin.DUR_FAST} ${skin.EASE}, transform ${skin.DUR_STD} ${skin.EASE}`,
        '&:hover': { bgcolor: skin.ROW_HOVER },
        '&:active': { transform: 'scale(0.98)', transitionDuration: skin.DUR_FAST }
      }}
    >
      <EggGlyph fill={look.glyph} plate={look.plate} hatched={egg.status === 'hatched'} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '15.5px', fontWeight: 700, color: skin.CARD_ID_INK, fontVariantNumeric: 'tabular-nums' }}>{egg.aeid}</Typography>
        <Typography sx={{ fontSize: 14, color: skin.FAINT, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>{meta}</Typography>
      </Box>
      <Box sx={{ ml: 'auto', textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '14.5px', fontWeight: 600, color: look.ink }}>{look.label}</Typography>
        {sub && (
          <Typography sx={{ fontSize: '14px', color: egg.status === 'hatched' ? skin.ACCENT_INK : skin.FAINT, fontWeight: egg.status === 'hatched' ? 600 : 400, mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Box>
      <Typography sx={{ color: skin.DASH_INK, fontSize: 19, flexShrink: 0 }}>›</Typography>
    </Box>
  )
}

/** Clutch group header — the species-table teal wash band. */
const ClutchHead: React.FC<{ title: string; caption?: string; outcome?: React.ReactNode }> = ({ title, caption, outcome }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, bgcolor: skin.TABLE_HEAD_BG, borderRadius: '12px', px: 4, py: 2.75, mt: 3, mb: 1 }}>
    <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.TABLE_HEAD_INK, whiteSpace: 'nowrap' }}>
      {title}
    </Typography>
    {caption && (
      <Typography sx={{ fontSize: 14, color: skin.TABLE_HEAD_INK, opacity: 0.85, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{caption}</Typography>
    )}
    {outcome && <Box sx={{ ml: 'auto' }}>{outcome}</Box>}
  </Box>
)

/** The FEMALE PAGE (in-tab, replaces the retired drawer). White grammar (mockup _1_1). */
const FemalePage: React.FC<{ speciesId: number; className?: string; row: FemaleRow; onBack: () => void }> = ({ speciesId, className, row, onBack }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const heroPhoto = React.useContext(HeroPhotoContext)
  const [detail, setDetail] = useState<FemaleDetail | null>(null)
  const [openEgg, setOpenEgg] = useState<EggDetail | null>(null)

  // the roster's identifier rule verbatim: real chip/ring beats synthesis, AID rides
  const femaleIdentifiers = useMemo(() => {
    const syn = synthAnimalIdentity(row.antzId)
    const hasRealId = !!row.identifier && row.identifier !== row.antzId
    const t = (row.idType || '').toLowerCase()
    const idLabel = t.includes('ring') ? 'Ring' : t.includes('chip') || t.includes('transponder') ? 'Chip' : row.idType || 'ID'

    return hasRealId
      ? [
          { label: idLabel, value: row.identifier as string },
          { label: 'AID', value: row.antzId }
        ]
      : syn.identifiers
  }, [row])

  React.useEffect(() => {
    let alive = true
    getFemaleDetail(speciesId, row.antzId, className).then(d => alive && setDetail(d))

    return () => {
      alive = false
    }
  }, [speciesId, row.antzId, className])

  const seasonYear = new Date().getFullYear()
  const eggs = detail?.eggDetails ?? []
  const live = eggs.filter(e => e.status === 'incubating')
  const loose = eggs.filter(e => !e.clutchId)
  const populatedMonths = (detail?.monthly ?? []).filter(v => v > 0).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* back pill */}
      <Box
        onClick={onBack}
        sx={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#ffffff',
          border: `1px solid ${skin.HAIR}`,
          borderRadius: '999px',
          px: 4,
          py: 2,
          cursor: 'pointer',
          ...skin.cardPressSx,
          '&:hover': { bgcolor: skin.ROW_HOVER }
        }}
      >
        <Typography sx={{ fontSize: 19, lineHeight: 1, color: skin.ACCENT_INK }}>‹</Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: skin.TAB_PILL }}>Eggs</Typography>
      </Box>

      {/* identity + season verdicts as ONE card (user call 2026-09-10): the kit
          AnimalIdCard — THE animal-card rule, never hand-rolled — with the verdict
          cells riding the same white card behind a hairline. Every figure derives
          from the ONE eggDetails list so the band can never disagree with the rows. */}
      <SectionCard>
        <Box sx={{ pb: 4, borderBottom: `1px solid ${skin.HAIR}` }}>
          <AnimalIdCard
            identifiers={femaleIdentifiers}
            enclosure={detail?.enclosure}
            site={detail?.site}
            tag='female'
            name={row.name !== row.identifier && row.name !== row.antzId ? row.name : undefined}
            photo={synthAnimalIdentity(row.antzId).hasPhoto ? heroPhoto?.src : undefined}
            photoPos={heroPhoto?.bgPos}
          />
        </Box>
        <Box sx={{ display: 'flex', minWidth: 0, pt: 4 }}>
          {[
              { label: 'Eggs', value: detail ? `${eggs.length}` : `${row.eggs}`, ink: skin.VALUE },
              {
                label: 'Fertile',
                value: detail ? `${detail.fertile} of ${eggs.length}` : `${row.fertile} of ${row.eggs}`,
                ink: skin.VALUE
              },
              {
                label: 'Hatched',
                value: detail
                  ? `${eggs.filter(e => e.status === 'hatched').length} of ${eggs.length}`
                  : `${row.hatched} of ${row.eggs}`,
                ink: skin.LIST_GREEN
              },
              { label: 'In incubation', value: `${live.length}`, ink: skin.ACCENT_INK }
            ].map((cell, i) => (
              <Box key={cell.label} sx={{ flex: 1, pl: i > 0 ? 5 : 0, pr: 5, py: 2, minWidth: 0, borderLeft: i > 0 ? `1px solid ${skin.HAIR}` : 'none' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.FAINT, whiteSpace: 'nowrap' }}>
                  {cell.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: cell.ink, mt: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {cell.value}
                </Typography>
              </Box>
            ))}
        </Box>
      </SectionCard>

      {/* NOW — the attention section */}
      {live.length > 0 && (
        <SectionCard title={<Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.FAINT }}>In Incubation · {live.length}</Typography>} titleMb={1}>
          {live.map((e, i) => (
            <EggListRow key={e.aeid} egg={e} divider={i > 0} onOpen={() => setOpenEgg(e)} />
          ))}
        </SectionCard>
      )}

      {/* the season archive: clutches + loose eggs, per-egg rows all tappable */}
      <SectionCard
        title={
          <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.FAINT }}>
            This Season · {detail?.clutches.length ?? row.clutches} {(detail?.clutches.length ?? row.clutches) === 1 ? 'clutch' : 'clutches'}
            {loose.length > 0 && ` · ${loose.length} loose ${loose.length === 1 ? 'egg' : 'eggs'}`}
          </Typography>
        }
        titleMb={1}
      >
        {(detail?.clutches ?? []).map(cl => {
          const clutchEggs = eggs.filter(e => e.clutchId === cl.clutchId)

          return (
            <React.Fragment key={cl.clutchId}>
              <ClutchHead
                title={`Clutch ${cl.clutchId}`}
                caption={`${fmtD(cl.laidDate)} · ${cl.size} ${cl.size === 1 ? 'egg' : 'eggs'}`}
                outcome={
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                    {cl.hatched} <Box component='span' sx={{ fontWeight: 500, fontSize: 14, opacity: 0.8 }}>of {cl.size} hatched</Box>
                  </Typography>
                }
              />
              {clutchEggs.map((e, i) => (
                <EggListRow key={e.aeid} egg={e} divider={i > 0} onOpen={() => setOpenEgg(e)} />
              ))}
            </React.Fragment>
          )
        })}
        {loose.length > 0 && (
          <>
            <ClutchHead title='Without Clutch' caption={`${loose.length} ${loose.length === 1 ? 'egg' : 'eggs'}`} />
            {loose.map((e, i) => (
              <EggListRow key={e.aeid} egg={e} divider={i > 0} onOpen={() => setOpenEgg(e)} />
            ))}
          </>
        )}
        {!detail && <EmptyState message='Loading…' />}
      </SectionCard>

      {/* rhythm — the kit year line, sparse guard at 3 (CoL rule) */}
      <SectionCard title='Monthly Laying Rhythm' titleMb={3}>
        {detail ? (
          populatedMonths >= 3 ? (
            <YearLinesChart series={[{ year: seasonYear, values: detail.monthly }]} accent={skin.ACCENT_FILL} noun='eggs' height={220} />
          ) : (
            <Box>
              {detail.monthly.map((v, m) =>
                v > 0 ? (
                  <Box key={m} sx={{ display: 'flex', justifyContent: 'space-between', py: 2, borderBottom: `1px solid ${skin.ROW_LINE}` }}>
                    <Typography sx={{ fontSize: 15, color: skin.MUTED }}>{MONTH_FULL[m]} {seasonYear}</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: skin.VALUE, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
                  </Box>
                ) : null
              )}
            </Box>
          )
        ) : (
          <EmptyState message='Loading…' />
        )}
      </SectionCard>

      <EggSheet egg={openEgg} onClose={() => setOpenEgg(null)} />
    </Box>
  )
}

/** THE EGG SHEET — the antz egg-detail anatomy in our skin, dark banner hero (mockup _1_2). */
const EggSheet: React.FC<{ egg: EggDetail | null; onClose: () => void }> = ({ egg, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [showAllWeights, setShowAllWeights] = useState(false)

  React.useEffect(() => {
    setShowAllWeights(false)
  }, [egg?.aeid])

  const look = egg ? eggLook(theme)[egg.status] : null
  const last = egg?.weighings[egg.weighings.length - 1]
  const lossPct = egg && last ? Math.round(((last.grams - egg.initialWeight) / egg.initialWeight) * 1000) / 10 : 0

  // full-length actual array for the corridor chart, from the sampled weighings
  const actual = useMemo(() => {
    if (!egg) return []
    const arr: (number | null)[] = Array(egg.incubationDays + 1).fill(null)
    egg.weighings.forEach(w => {
      if (w.day <= egg.incubationDays) arr[w.day] = w.grams
    })

    return arr
  }, [egg])

  const capsSx = { fontSize: 14, fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.FAINT } as const

  const tile = (label: string, value: React.ReactNode, sub?: React.ReactNode, subColor?: string, meterPct?: number) => (
    <Box sx={{ flex: 1, bgcolor: skin.GROUND, borderRadius: '14px', px: 4, py: 3.5, minWidth: 0 }}>
      <Typography sx={capsSx}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: skin.VALUE, mt: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Typography>
      {sub && (
        <Typography sx={{ fontSize: 14, mt: 0.5, color: subColor || skin.MUTED, fontWeight: subColor ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{sub}</Typography>
      )}
      {meterPct != null && (
        <Box sx={{ height: 6, borderRadius: '99px', bgcolor: skin.TRACK, mt: 2.5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${meterPct}%`, borderRadius: '99px', bgcolor: skin.ACCENT_FILL }} />
        </Box>
      )}
    </Box>
  )

  const fact = (k: string, v: React.ReactNode) => (
    <Box sx={{ display: 'flex', gap: 3, py: 2, borderBottom: `1px solid ${skin.ROW_LINE}`, fontSize: 15, minWidth: 0 }}>
      <Typography sx={{ width: 118, flexShrink: 0, color: skin.FAINT, fontSize: 15 }}>{k}</Typography>
      <Typography sx={{ color: skin.INK2, fontWeight: 500, fontSize: 15, fontVariantNumeric: 'tabular-nums', minWidth: 0 }}>{v}</Typography>
    </Box>
  )

  const chipSx = (bg: string, ink: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    height: 30,
    px: 3,
    borderRadius: '999px',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    bgcolor: bg,
    color: ink
  })

  const of = (t: string) => <Box component='span' sx={{ fontSize: '14.5px', fontWeight: 500, color: skin.NEUTRAL_SEC }}>{t}</Box>

  const shownWeights = egg ? (showAllWeights ? [...egg.weighings].reverse() : [...egg.weighings].reverse().slice(0, 3)) : []

  return (
    <SheetDrawer open={!!egg} onClose={onClose} PaperProps={{ sx: sheetPaperSx('lg') }}>
      {egg && look && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* ── dark banner hero (the species-banner ramp — the identity anchor) ── */}
          <Box sx={{ background: skin.BANNER_GRAD, px: 7, pt: 5, pb: 5, display: 'flex', gap: 4.5, alignItems: 'flex-start', flexShrink: 0 }}>
            <EggGlyph fill={look.glyph} plate={look.plate} hatched={egg.status === 'hatched'} size={92} glass />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 27, fontWeight: 700, color: skin.HERO_ON, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{egg.aeid}</Typography>
              <Typography sx={{ fontSize: 15, color: skin.HERO_MUTE, mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                <Box component='span' sx={{ color: skin.HERO_SOFT, fontWeight: 600 }}>UEID :</Box> {egg.ueid}
              </Typography>
              <Typography sx={{ fontSize: '13.5px', color: skin.HERO_MUTE, mt: 2 }}>Updated {fmtD(last?.date || egg.collectedDate)}</Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2.5, flexShrink: 0 }}>
              <Box
                onClick={onClose}
                sx={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: skin.HERO_GLASS, color: skin.HERO_ON, cursor: 'pointer', fontSize: 15 }}
              >
                ✕
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={chipSx(look.plate, look.ink)}>{look.label}</Box>
                {egg.condition && egg.condition !== look.label && <Box sx={chipSx(skin.HERO_GLASS, skin.HERO_SOFT)}>{egg.condition}</Box>}
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 7, pb: 8, minHeight: 0 }}>
            {/* ── stat tiles (the antz hero cards → mint StatTiles) ── */}
            <Box sx={{ display: 'flex', gap: 3, py: 4.5, borderBottom: `1px solid ${skin.HAIR}` }}>
              {egg.status === 'received' && (
                <>
                  {tile('Age', <>{Math.max(1, Math.round((Date.now() - new Date(egg.collectedDate).getTime()) / 86400000))} {of('days')}</>, `Found ${fmtD(egg.collectedDate)}`)}
                  {tile('Weight', `${egg.initialWeight} g`, 'Initial weighing')}
                  {tile('Condition', 'Fresh', 'State: Received')}
                </>
              )}
              {egg.status === 'incubating' && (
                <>
                  {tile('Incubation', <>Day {egg.dayNow} {of(`of ~${egg.incubationDays}`)}</>, undefined, undefined, Math.round(((egg.dayNow || 0) / egg.incubationDays) * 100))}
                  {tile('Weight', `${last?.grams} g`, `${lossPct}% vs initial`, egg.breachDay != null ? skin.TONE_TYPE.warn : skin.TONE_TYPE.good)}
                  {tile('Condition', egg.condition, (egg.dayNow || 0) >= 9 ? 'Candled Day 9' : 'Candling due Day 9')}
                </>
              )}
              {egg.status === 'hatched' && (
                <>
                  {tile('Incubation', <>{egg.incubationDays} {of('days')}</>, `${fmtD(egg.laidDate)} – ${fmtD(egg.hatchDate)}`)}
                  {tile('Weight loss', `${lossPct}%`, `${egg.initialWeight} → ${last?.grams} g`, skin.TONE_TYPE.good)}
                  {tile('Hatch', egg.hatchMethod || 'Natural', `${egg.hatchWeight} g at hatch`)}
                </>
              )}
              {egg.status === 'to_be_discarded' && (
                <>
                  {tile('Incubation', <>Day {egg.incubationDays} {of(`of ~${egg.incubationDays}`)}</>, undefined, undefined, 100)}
                  {tile('Weight', `${last?.grams} g`, `${lossPct}% vs initial`)}
                  {tile('Condition', egg.discardReason || egg.condition, `Confirmed Day ${last?.day ?? egg.incubationDays}`)}
                </>
              )}
              {egg.status === 'discarded' && (
                <>
                  {tile('In system', <>{Math.max(1, last?.day ?? 1)} {of('days')}</>, `${fmtD(egg.laidDate)} – ${fmtD(egg.discardDate)}`)}
                  {tile('Last weight', `${last?.grams} g`, `Recorded ${fmtD(last?.date)}`)}
                  {tile('Reason', egg.discardReason || '—', egg.discardReason === 'Infertile on candling' ? 'On candling · Day 9' : undefined)}
                </>
              )}
            </Box>

            {/* ── details (the antz left card: provenance, location, parents, initials) ── */}
            <Box sx={{ py: 4, borderBottom: `1px solid ${skin.HAIR}` }}>
              <Typography sx={capsSx}>Details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 8, mt: 2 }}>
                {fact('Laid', fmtD(egg.laidDate))}
                {fact('Collected', fmtD(egg.collectedDate))}
                {fact('Clutch', egg.clutchId || 'No clutch')}
                {fact('Site', egg.site || '—')}
                {fact('Nursery', egg.nursery ? `${egg.nursery} · Incubator ${egg.incubator}` : 'Not allocated')}
                {fact('Mother', egg.motherLabel)}
                {fact(
                  'Father',
                  egg.probableFathers ? (
                    <Box component='span' sx={{ color: skin.ACCENT_INK, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      Probable ({egg.probableFathers})
                    </Box>
                  ) : (
                    egg.fatherLabel
                  )
                )}
                {fact('Initial weight', `${egg.initialWeight} g`)}
                {fact('Initial size', `${egg.lengthMm} mm × ${egg.widthMm} mm`)}
              </Box>
            </Box>

            {/* ── weight — per-egg log + corridor (3-point sparse rule) ── */}
            {egg.status !== 'received' && (
              <Box sx={{ pt: 4 }}>
                <Typography sx={capsSx}>
                  {egg.weighings.length >= 3
                    ? `Weight vs ideal loss · target ${egg.targetLossPct}%`
                    : `Weight · ${egg.weighings.length} ${egg.weighings.length === 1 ? 'weighing' : 'weighings'} — the chart appears from the 3rd`}
                </Typography>
                {egg.weighings.length >= 3 && (
                  <Box sx={{ mt: 2 }}>
                    <TrendAreaChart
                      values={actual}
                      labels={egg.ideal.map((_, d) => `Day ${d}`)}
                      color={theme.palette.secondary.main}
                      name='This egg'
                      unit=' g'
                      height={230}
                      corridor={{
                        ideal: egg.ideal,
                        upper: egg.bandUpper,
                        lower: egg.bandLower,
                        idealName: `Ideal (${egg.targetLossPct}% loss)`,
                        breachIndex: egg.breachDay ?? undefined
                      }}
                    />
                    {egg.breachDay != null && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={chipSx(skin.TONE_SOFT.warn, skin.TONE_TYPE.warn)}>⚠ Below corridor since Day {egg.breachDay}</Box>
                      </Box>
                    )}
                  </Box>
                )}
                <Box sx={{ mt: 3, border: `1px solid ${skin.HAIR}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 4, py: 2.5, bgcolor: skin.TABLE_HEAD_BG }}>
                    <Typography sx={{ width: 150, fontSize: '13.5px', fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.TABLE_HEAD_INK }}>Date</Typography>
                    <Typography sx={{ width: 100, fontSize: '13.5px', fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.TABLE_HEAD_INK }}>Time</Typography>
                    <Typography sx={{ ml: 'auto', mr: 10, fontSize: '13.5px', fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.TABLE_HEAD_INK }}>Change</Typography>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 700, letterSpacing: skin.TRACK_CAPS, textTransform: 'uppercase', color: skin.TABLE_HEAD_INK }}>Weight</Typography>
                  </Box>
                  {shownWeights.map((w, i) => {
                    const idx = egg.weighings.findIndex(x => x.day === w.day)
                    const prev = idx > 0 ? egg.weighings[idx - 1] : undefined
                    const delta = prev ? Math.round((w.grams - prev.grams) * 10) / 10 : null

                    return (
                      <Box key={w.day} sx={{ display: 'flex', alignItems: 'center', px: 4, py: 2.75, borderTop: i === 0 ? 'none' : `1px solid ${skin.ROW_LINE}` }}>
                        <Typography sx={{ width: 150, fontSize: 15, fontWeight: 500, color: skin.INK2, fontVariantNumeric: 'tabular-nums' }}>{fmtD(w.date)}</Typography>
                        <Typography sx={{ width: 100, fontSize: 15, color: skin.MUTED, fontVariantNumeric: 'tabular-nums' }}>{w.time}</Typography>
                        <Typography sx={{ ml: 'auto', mr: 10, fontSize: 14, color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
                          {delta == null ? '' : `${delta > 0 ? '+' : ''}${delta} g`}
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: skin.VALUE, fontVariantNumeric: 'tabular-nums' }}>{w.grams} g</Typography>
                      </Box>
                    )
                  })}
                </Box>
                {egg.weighings.length > 3 && !showAllWeights && (
                  <Typography
                    onClick={() => setShowAllWeights(true)}
                    sx={{ textAlign: 'center', pt: 3, fontSize: '14.5px', fontWeight: 600, color: skin.ACCENT_INK, cursor: 'pointer' }}
                  >
                    View all {egg.weighings.length} weighings ›
                  </Typography>
                )}
              </Box>
            )}

            {/* ── outcome / next — structural emphasis on a tone plate ── */}
            {egg.status === 'received' && (
              <Box sx={{ mt: 4.5, borderRadius: '14px', bgcolor: skin.GROUND, px: 5, py: 4 }}>
                <Typography sx={{ ...capsSx, color: skin.ON_SURFACE, opacity: 0.75 }}>Next</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: skin.INK, mt: 1.5 }}>Awaiting allocation to incubation</Typography>
                <Typography sx={{ fontSize: '14.5px', color: skin.MUTED, mt: 1 }}>The weight log starts with the first incubation weighing</Typography>
              </Box>
            )}
            {egg.status === 'hatched' && (
              <Box sx={{ mt: 4.5, borderRadius: '14px', bgcolor: skin.TONE_SOFT.good, px: 5, py: 4 }}>
                <Typography sx={{ ...capsSx, color: skin.ON_SURFACE, opacity: 0.75 }}>Outcome</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: skin.INK, mt: 1.5, fontVariantNumeric: 'tabular-nums' }}>
                  Hatched {fmtD(egg.hatchDate)} → <Box component='span' sx={{ color: skin.ACCENT_INK }}>{egg.hatchlingId}</Box>
                </Typography>
                <Typography sx={{ fontSize: '14.5px', color: skin.MUTED, mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {egg.hatchWeight} g at hatch · {egg.hatchMethod}
                </Typography>
              </Box>
            )}
            {egg.status === 'to_be_discarded' && (
              <Box sx={{ mt: 4.5, borderRadius: '14px', bgcolor: skin.TONE_SOFT.warn, px: 5, py: 4 }}>
                <Typography sx={{ ...capsSx, color: skin.ON_SURFACE, opacity: 0.75 }}>Pending</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: skin.INK, mt: 1.5 }}>Discard requested · {egg.discardReason}</Typography>
                <Typography sx={{ fontSize: '14.5px', color: skin.MUTED, mt: 1 }}>Security check pending · Necropsy: sample to be taken</Typography>
              </Box>
            )}
            {egg.status === 'discarded' && (
              <Box sx={{ mt: 4.5, borderRadius: '14px', bgcolor: c.BgTeritary, px: 5, py: 4 }}>
                <Typography sx={{ ...capsSx, color: skin.ON_SURFACE, opacity: 0.75 }}>Outcome</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: skin.INK, mt: 1.5, fontVariantNumeric: 'tabular-nums' }}>
                  Discarded {fmtD(egg.discardDate)} · {egg.discardReason}
                </Typography>
                <Typography sx={{ fontSize: '14.5px', color: skin.MUTED, mt: 1 }}>Batch {egg.discardBatch} · Sample taken</Typography>
              </Box>
            )}
          </Box>
        </Box>
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
  const [rosterTab, setRosterTabRaw] = useState<'all' | 'laid'>('all')
  // Clutch segmentation is a FILTER, not tabs (user call 2026-09-06 — the 1/2+ clutch
  // tabs read as confusing; clutch counts live on the laid rows themselves).
  const [clutchFilter, setClutchFilterRaw] = useState<'all' | 'one' | 'twoPlus'>('all')
  const [q, setQRaw] = useState('')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetSpec | null>(null)
  const [femTab, setFemTab] = useState<string>('laid')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  // any roster re-scope (tab / search / site) lands back on page 1
  const setRosterTab = (v: 'all' | 'laid') => {
    setRosterTabRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const setClutchFilter = (v: 'all' | 'one' | 'twoPlus') => {
    setClutchFilterRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const setQ = (v: string) => {
    setQRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const pickSite = (v: string | null) => {
    setSiteFilter(v)
    setRosterSiteRaw(null) // a page-scope change can strand a narrower table pick
    setPm(p => ({ ...p, page: 0 }))
  }

  // Roster-local site dropdown (user call 2026-09-07 — the table row: clutch filter,
  // site, settings; the animal-table grammar). Scopes the TABLE only; the page strip's
  // site pick still scopes everything, so this one offers the sites left within it.
  const [rosterSite, setRosterSiteRaw] = useState<string | null>(null)
  const setRosterSite = (v: string | null) => {
    setRosterSiteRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }

  // Column picker (Population pattern) — load AFTER mount (localStorage in the
  // initializer would break hydration).
  const [colsOpen, setColsOpen] = useState(false)
  const [colPrefs, setColPrefs] = useState<ColumnPref[]>(EGG_DEFAULT_COLS)
  React.useEffect(() => setColPrefs(loadEggColPrefs()), [])
  const applyColPrefs = (cols: ColumnPref[]) => {
    setColPrefs(cols)
    try {
      // NB: `window` here is the component's period window — use the global explicitly
      globalThis.localStorage.setItem(EGG_PREFS_STORE, JSON.stringify(cols))
    } catch {
      /* private mode etc. — prefs just don't persist */
    }
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

    const inTab = (f: FemaleRow) => (rosterTab === 'all' ? true : f.laid)
    const inClutch = (f: FemaleRow) =>
      clutchFilter === 'all' ? true : clutchFilter === 'one' ? f.clutches === 1 : f.clutches >= 2

    return s.females_rows.filter(
      f =>
        inTab(f) &&
        inClutch(f) &&
        (!siteFilter || f.site === siteFilter) &&
        (!rosterSite || f.site === rosterSite) &&
        (!query || `${f.name} ${f.identifier} ${f.site} ${f.enclosure}`.toLowerCase().includes(query))
    )
  }, [s.females_rows, rosterTab, clutchFilter, siteFilter, rosterSite, q])

  /* site dropdown options — every site that holds a female, biggest first */
  const siteOpts = useMemo(() => {
    const m = new Map<string, number>()
    s.females_rows.forEach(f => f.site && m.set(f.site, (m.get(f.site) ?? 0) + 1))

    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([site, n]) => ({ site, n }))
  }, [s.females_rows])

  /* roster site dropdown options — the sites left inside the page scope, biggest first */
  const rosterSiteOpts = useMemo(() => {
    const m = new Map<string, number>()
    scopedFemales.forEach(f => f.site && m.set(f.site, (m.get(f.site) ?? 0) + 1))

    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([site, n]) => ({ site, n }))
  }, [scopedFemales])
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

  /* seasonal laying = the kit YearLinesChart (LINE, year-per-line, Jan–Dec — the
     2026-09-04 standard). Year lines built from the EGG RECORDS' lay dates (site-scoped),
     so every season with data gets its own line and the 1Y|2Y|3Y|Custom window actually
     windows years — the CoL Births behavior (user call 2026-09-10). The funnel's single
     current-season array is the fallback when no records ride the payload. */
  const seasonYear = Number(s.season) || new Date().getFullYear()
  const layingSeries: YearSeries[] = useMemo(() => {
    // Current season = the funnel's REAL monthly array (the same numbers the stat band
    // shows). Prior seasons: deterministic synthesis scaled off it (the static-data
    // rule — the per-egg records only cover the current season and are a subset, so
    // deriving year lines from them broke number coherence). Zero months stay zero,
    // preserving the species' laying season shape.
    const rnd = (n: number) => {
      const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453

      return x - Math.floor(x)
    }
    const priors: YearSeries[] = Array.from({ length: 4 }, (_, i) => {
      const year = seasonYear - (i + 1)

      return { year, values: scoped.monthly.map((v, m) => Math.round(v * (0.6 + 0.35 * rnd(year * 100 + m)))) }
    })

    // latest first — the window math reads seriesYears[0] as the latest year
    return [{ year: seasonYear, values: scoped.monthly }, ...priors]
  }, [seasonYear, scoped.monthly])

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

  /* data-column registry — the settings picker (EGG_COL_LABELS) decides which of
     these ride beside the fixed Female card column, and in what order */
  const eggColDefs: Record<string, GridColDef> = {
    clutches: {
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
    eggs: {
      minWidth: 110,
      flex: 0.7,
      sortable: false,
      field: 'eggs',
      headerName: 'Eggs',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.eggs}</Typography>
      )
    },
    fertile: {
      minWidth: 110,
      flex: 0.7,
      sortable: false,
      field: 'fertile',
      headerName: 'Fertile',
      renderCell: (p: GridRenderCellParams) =>
        p.row.eggs ? (
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.fertile}</Typography>
        ) : (
          <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }}>—</Typography>
        )
    },
    hatched: {
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
    prevHatchPct: {
      minWidth: 190,
      flex: 1,
      sortable: false,
      field: 'prevHatchPct',
      headerName: 'Vs Her Last Season',
      renderCell: (p: GridRenderCellParams) => prevPill(p.row)
    },
    site: {
      minWidth: 160,
      flex: 1,
      sortable: false,
      field: 'site',
      headerName: 'Site',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', color: p.row.site ? c.OnSurfaceVariant : c.neutralSecondary }}>{p.row.site || '—'}</Typography>
      )
    },
    enclosure: {
      minWidth: 170,
      flex: 1,
      sortable: false,
      field: 'enclosure',
      headerName: 'Enclosure',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', color: p.row.enclosure ? c.OnSurfaceVariant : c.neutralSecondary }}>
          {p.row.enclosure || '—'}
        </Typography>
      )
    }
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
    ...colPrefs.filter(p => p.on).map(p => eggColDefs[p.key]).filter(Boolean)
  ]

  /* roster tabs — vaccination statusTabs pattern: tabs in the card title slot, per-tab underline */
  const rosterTabs = (
    // Never wraps: one row, overflow scrolls (the kit's underline-tab pattern).
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', ...thinScrollbarSx(theme) }}>
      {/* TWO tabs only (user call 2026-09-06): All Females | Laid — the laid-nothing and
          clutch-bucket tabs retired; clutch segmentation moved to the PillSelect filter. */}
      {[
        { key: 'all' as const, label: 'All Females', n: scopedFemales.length, accent: theme.palette.primary.dark },
        { key: 'laid' as const, label: 'Laid', n: scoped.laidFemales, accent: theme.palette.primary.dark }
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

  // Tapping a female SWAPS the tab to her full page (user call 2026-09-10 — too much
  // detail for a sheet; the egg sheet then stacks as the only overlay). Back restores
  // the roster exactly as left — all state lives up here.
  if (openFemale) {
    return <FemalePage speciesId={s.speciesId} className={s.className} row={openFemale} onBack={() => setOpenFemale(null)} />
  }

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
              // month sheet holds CURRENT-season data only — prior-year dots stay quiet
              onPoint={(y, m) => y === seasonYear && scoped.monthly[m] > 0 && setSheet({ kind: 'month', m })}
            />
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
        // roster controls (user call 2026-09-07): clutch FILTER (kit PillSelect), the
        // roster's OWN site dropdown (table-local — the page strip still scopes the
        // whole tab), then the column-settings gear; search rides along.
        const clutchCtl = (
          <PillSelect
            value={clutchFilter}
            onChange={v => setClutchFilter(v as 'all' | 'one' | 'twoPlus')}
            items={[
              { value: 'all', label: 'All Clutches', icon: 'mdi:egg-outline' },
              { value: 'one', label: '1 Clutch', icon: 'mdi:egg-outline' },
              { value: 'twoPlus', label: '2+ Clutches', icon: 'mdi:egg-outline' }
            ]}
          />
        )
        const rosterSiteCtl =
          rosterSiteOpts.length > 1 ? (
            <SiteFilterControl
              sites={rosterSiteOpts as any}
              sitesTotal={rosterSiteOpts.length}
              tracked={scopedFemales.length}
              value={rosterSite}
              onChange={setRosterSite}
              overdueWord='overdue'
              caption={(x: any) => `${x.n} females`}
            />
          ) : null
        // Settings — the column-picker trigger, always beside the filters (demo call rule)
        const settingsBtn = (
          <Box
            onClick={() => setColsOpen(true)}
            aria-label='Table columns'
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: '#ffffff',
              border: `1px solid ${skin.HAIR}`,
              cursor: 'pointer',
              ...skin.cardPressSx,
              '&:hover': { bgcolor: skin.ROW_HOVER }
            }}
          >
            <Icon icon='mdi:cog-outline' fontSize='1.25rem' color={skin.INK2} />
          </Box>
        )
        const searchCtl = <SearchPill elastic value={q} onChange={setQ} placeholder='Search females…' />
        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            {/* portrait: tabs + gear on line one (Population grammar), controls scroll below */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              {rosterTabs}
              {settingsBtn}
            </Box>
            <ControlsRow>
              {searchCtl}
              {clutchCtl}
              {rosterSiteCtl}
            </ControlsRow>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : rosterTabs}
        action={
          portrait ? undefined : (
            <ControlsRow sx={{ width: 'auto', flex: '1 1 auto', justifyContent: 'flex-end', ml: 3, maxWidth: 640 }}>
              {clutchCtl}
              {rosterSiteCtl}
              {settingsBtn}
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

      <ListSheet view={sheetView} onClose={() => setSheet(null)} />

      {/* Settings — data columns (choose + order), saved per user (Population pattern) */}
      <ColumnSettingsSheet
        open={colsOpen}
        onClose={() => setColsOpen(false)}
        labels={EGG_COL_LABELS}
        value={colPrefs}
        defaults={EGG_DEFAULT_COLS}
        onApply={cols => applyColPrefs(cols)}
      />
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
