'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Autocomplete, Avatar, Box, Button, Checkbox, Drawer, IconButton, MenuItem, Select, TextField, Typography, Tooltip, useMediaQuery } from '@mui/material'
import type { DrawerProps } from '@mui/material'
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import NoDataFound from 'src/views/utility/NoDataFound'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import type { RangePreset } from 'src/views/pages/species-management/ipad3/dashboard/DashboardDateRange'
import type { AnimalRecord } from 'src/types/species-management/detail'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { BarColumns, Slices } from 'src/views/pages/species-management/ipad3/marks'

/**
 * Shared, on-system UI primitives for the Species Management detail tabs.
 * All visuals use theme tokens + Typography variants only (no hardcoded hex / font sizes).
 * The prototype hand-rolls SVG/CSS bars; we replicate with MUI Box + tokens (SSR-safe, on-system).
 */

/** V2-only typography floor (2026-07-27 readability feedback): lifts the MUI `caption`
 *  variant 12px → 13px for every surface wrapped by a v2 container. V1/V3 render outside
 *  this provider and keep the stock sizes. Tune the value here, not per-usage. */
export const V2TypeScale: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const outer = useTheme() as any
  const themed = React.useMemo(
    () =>
      createTheme(outer, {
        typography: {
          caption: { fontSize: '14px' },
          body2: { fontSize: '16px' },
          subtitle2: { fontSize: '16px' }
        },
        components: {
          // Every MUI hover tooltip in v2 — chips, bars, truncated text — reads at 14px.
          MuiTooltip: { styleOverrides: { tooltip: { fontSize: '16px' } } }
        }
      }),
    [outer]
  )

  return <ThemeProvider theme={themed}>{children}</ThemeProvider>
}

/** Side-sheet width standard — ONE knob for every right drawer in the module.
 *  Tiers raised 20% on 2026-07-28 ("sheets too small" feedback):
 *  sm 460 · md 580 · lg 700 · xl 820 · xxl 940 (previously 380 · 480–500 · 560–580 · 680 · 760–820). */
export const SHEET_WIDTH = { sm: 460, md: 580, lg: 700, xl: 820, xxl: 940 } as const

/** Side-sheet horizontal gutter — ONE knob for the left/right padding of every sheet
 *  (header, search, tabs, body, list drawers). 6 units = 24px (raised from 3/12px on 2026-07-29). */
export const SHEET_PX = 6

/** Paper sx for a standard side sheet: `PaperProps={{ sx: sheetPaperSx('md') }}` (or slotProps.paper).
 *  `pad` adds padding for sheets that lay out their own content (SHEET_PX gutter, py:4). */
export const sheetPaperSx = (size: keyof typeof SHEET_WIDTH = 'md', opts?: { pad?: boolean }) => ({
  width: { xs: '100%', sm: SHEET_WIDTH[size] },
  maxWidth: '100%',
  ...(opts?.pad ? { px: SHEET_PX, py: 4 } : {})
})

/** Orientation-adaptive sheet container — the ONE drawer wrapper for every sheet in
 *  the iPad tree (tablet feedback 2026-08-24: side sheets feel wrong held upright).
 *  Landscape: classic right side sheet — the call site's sheetPaperSx width applies.
 *  Portrait: bottom sheet — full width, 88dvh tall, rounded top, grab handle.
 *  Drop-in replacement for `<Drawer anchor='right'>`: keep passing sheetPaperSx via
 *  PaperProps or slotProps.paper as before; portrait overrides are appended after it. */
export const SheetDrawer: React.FC<DrawerProps> = ({ PaperProps, slotProps, children, ...rest }) => {
  const portrait = useMediaQuery('(orientation: portrait)')
  const theme = useTheme() as any

  // '&&' doubles specificity so these beat the call site's responsive
  // sheetPaperSx width rules (media queries would otherwise win over plain props).
  const portraitSx = {
    '&&': { width: '100%', maxWidth: '100%', height: '88dvh', borderRadius: '22px 22px 0 0' }
  }
  const paperConf: any = (slotProps as any)?.paper ?? PaperProps ?? {}
  const paperSx = paperConf.sx
  const mergedPaper = portrait
    ? { ...paperConf, sx: [...(Array.isArray(paperSx) ? paperSx : [paperSx]), portraitSx] }
    : paperConf

  return (
    <Drawer {...rest} anchor={portrait ? 'bottom' : 'right'} slotProps={{ ...(slotProps as any), paper: mergedPaper }}>
      {portrait && (
        <Box aria-hidden sx={{ pt: 3, pb: 1, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: '999px', bgcolor: 'rgba(22,21,15,0.10)' }} />
        </Box>
      )}
      {children}
    </Drawer>
  )
}

/** THE composed sheet for the iPad tree — the CC sheet grammar on our orientation
 *  geometry (portrait bottom sheet / landscape side sheet, via SheetDrawer).
 *  White header carrying an EYEBROW (the trail — a count, a window, a place) over the
 *  title, a round hairline close button, an optional back chevron; the body scrolls on
 *  the sage ground as a stack of cards. Build every new drill sheet from THIS, not from
 *  a bare SheetDrawer — hand-rolled headers are how sheets drift apart.
 *  (Named DrillSheet: `Sheet` is the v2 kit's in-drawer layout shell.) */
export const DrillSheet: React.FC<{
  open: boolean
  onClose: () => void
  /** Shows the back chevron — one gesture goes back one level; content swaps, never stacks. */
  onBack?: () => void
  /** One short line above the title — a count, a window, a status. Never a sentence. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  /** Optional control rendered between the title and the close button. */
  action?: React.ReactNode
  size?: keyof typeof SHEET_WIDTH
  zIndex?: number
  /** Sage scroller (CC default) — pass false for a white body (dense full-bleed tables). */
  ground?: boolean
  bodySx?: object
  children: React.ReactNode
}> = ({ open, onClose, onBack, eyebrow, title, action, size = 'md', zIndex, ground = true, bodySx, children }) => {
  const roundBtnSx = {
    width: 40,
    height: 40,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: `background-color ${skin.DUR_FAST} ${skin.EASE}`,
    '&:hover': { backgroundColor: '#f7f6f3' },
    '&:active': { backgroundColor: '#f2f1ed' }
  } as const

  return (
    <SheetDrawer
      open={open}
      onClose={onClose}
      sx={zIndex != null ? { zIndex } : undefined}
      slotProps={{
        paper: {
          sx: {
            ...sheetPaperSx(size),
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            boxShadow: skin.SHADOW_MODAL
          }
        }
      }}
    >
      {/* Header — white, hairline seam to the scroller. */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, px: 5, pt: 3, pb: 3, borderBottom: `1px solid ${skin.HAIR}` }}>
        {onBack && (
          <Box onClick={onBack} aria-label='Back' sx={{ ...roundBtnSx, ml: -2 }}>
            <Icon icon='mdi:chevron-left' fontSize='1.3rem' color='#55524a' />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {eyebrow != null && (
            <Typography
              sx={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: skin.FAINT }}
              noWrap
            >
              {eyebrow}
            </Typography>
          )}
          {title != null && (
            <Typography sx={{ mt: eyebrow != null ? '3px' : 0, fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: skin.INK }} noWrap>
              {title}
            </Typography>
          )}
        </Box>
        {action}
        <Box onClick={onClose} aria-label='Close' sx={{ ...roundBtnSx, border: `1px solid ${skin.HAIR}` }}>
          <Icon icon='mdi:close' fontSize='1.05rem' color='#55524a' />
        </Box>
      </Box>

      {/* Body — the sage scroller; content reads as a stack of cards. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          backgroundColor: ground ? skin.GROUND : '#ffffff',
          p: 4,
          pb: 'calc(env(safe-area-inset-bottom) + 32px)',
          ...bodySx
        }}
      >
        {children}
      </Box>
    </SheetDrawer>
  )
}

/** Thin always-visible horizontal scrollbar for scrollable charts/strips (v2 standard).
 *  NEVER pair with scrollbarWidth — Chrome then ignores these ::-webkit-scrollbar styles. */
export const thinScrollbarSx = (theme: any) => ({
  '&::-webkit-scrollbar': { height: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: cc(theme).OutlineVariant, borderRadius: '2px' },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: cc(theme).Outline }
})

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'danger' | 'caution'

/** Tone → the CC MARK fill (bars, slices, dots). Type beside a mark uses useTone().fg instead. */
export const TONE_MARK: Record<Tone, string> = {
  success: skin.TONE_FILL.good,
  warning: skin.TONE_FILL.warn,
  error: skin.TONE_FILL.bad,
  info: '#00abab',
  primary: skin.ACCENT_FILL,
  neutral: skin.TONE_FILL.neutral,
  danger: skin.TONE_FILL.bad,
  caution: skin.TONE_FILL.warn
}

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

/** V2 table-cell standard: every DataGrid row item reads at 16px. Tune HERE, not per-tab. */
export const CELL_FONT = '1rem'

/** Standard table cell text — 16px, weight 500 default, dark. All v2 tables use this. */
export const CellText: React.FC<{ children?: React.ReactNode; color?: string; weight?: number; noWrap?: boolean }> = ({
  children,
  color,
  weight = 500,
  noWrap
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography
      sx={{
        fontSize: CELL_FONT,
        color: color || skin.INK2,
        fontWeight: weight,
        // Grid cells are flex rows — without minWidth:0 the text keeps its one-line
        // width and CLIPS mid-word at the cell edge (user-caught 2026-09-05, Site
        // column). Long text wraps to a 2nd line instead, clamped so rows never grow.
        ...(noWrap
          ? {}
          : {
              minWidth: 0,
              lineHeight: 1.3,
              // The DataGrid puts white-space:nowrap on every CELL — the inherited value
              // forbids line breaks, so wrapping needs an explicit 'normal' here.
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'break-word'
            })
      }}
      noWrap={noWrap}
    >
      {children ?? '—'}
    </Typography>
  )
}

/** Synthetic approximate-death marker (demo review 2026-09-04: approximate death dates
 *  get a flag under the date). The dump carries NO such field — derived deterministically
 *  from the record like the module's other synth features; a REAL flag needs the backend. */
export const isApproxDeathDate = (aid?: string, d?: string) => {
  const s = `${aid || ''}|${d || ''}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h % 4 === 0
}

/** Death-date cell — the date with a quiet "Approximate" caption beneath when flagged.
 *  THE single copy: Mortality + Necropsy tables both render this. */
export const DeathDateCell: React.FC<{ date: string; approx?: boolean }> = ({ date, approx }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ minWidth: 0 }}>
      <CellText noWrap>{date}</CellText>
      {approx && (
        <Typography sx={{ fontSize: '0.9375rem', color: c.neutralSecondary, fontStyle: 'italic' }} noWrap>
          Approximate
        </Typography>
      )}
    </Box>
  )
}

/** Standard animal/entity identity cell — avatar + name (16px/600) over a light-grey 16px sub line.
 *  THE single copy: Assessments, Circle of Life, Medical (and any new tab) all render this. */
export const AnimalCell: React.FC<{ name?: string; sub?: string; avatar?: string; size?: number }> = ({
  name,
  sub,
  avatar = '/images/branding/Antz_logomark_h_color.svg',
  size = 36
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Avatar
        src={avatar}
        sx={{ width: size, height: size, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: CELL_FONT, fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {name || '—'}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: CELL_FONT, color: c.neutralSecondary, display: 'block' }} noWrap>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/* ── Animal identity card (Figma Antz-Mobile 38280:31073, adopted 2026-09-02) ──
 *  The mobile app's animal card, ported as THE richer identity cell: photo (or mint
 *  placeholder + logomark watermark) with a gender/status badge on its top-left corner,
 *  beside a text stack of max TWO identifiers (primary first, bold navy — AID counts
 *  toward the two) then Encl: and Site:. The photo's expand affordance is deliberately
 *  NOT built yet (user: "that expand option i will discuss later").
 *  HARD RULE (user, 2026-09-02): the Site row renders ONLY when the surrounding list
 *  spans more than one site (All-sites view / multi-site scope). A list already scoped
 *  to a single site must NOT repeat the site on every card — callers omit `site` then.
 *  First surface: Medical preventive detail tables; adopt elsewhere only on user call. */
export type AnimalTagKind = 'male' | 'female' | 'undetermined' | 'indetermined' | 'group' | 'mortality'

// Badge letter per tag — group renders "G {count}", mortality keeps the mobile "M".
const TAG_LETTER: Record<AnimalTagKind, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indetermined: 'ID',
  group: 'G',
  mortality: 'M'
}

/* ── enclosure sex composition — THE shared vocabulary (user call 2026-09-05) ──────────
   One function for every enclosure list (Enclosure Demographics, Housing) so the words
   never drift. Derived from COUNTS, never the dataset's type labels (those carry the
   banned "Breeding Ready" vocabulary). The aggregates carry ONE unsexed bucket, so
   callers that have the animal RECORDS pass `kinds` to split it into Undetermined /
   Indeterminate / Group (a group accession = ONE record: one AID, several identifiers
   maybe, but it counts as 1 — so a Group enclosure's figures stay honest). Without
   `kinds`, unsexed-only enclosures read Undetermined — the dominant reality (ID = 114
   animals in the whole dump, G = none yet). */
export interface EnclosureSexKinds {
  ud: number
  id: number
  grp: number
}

/* Dump-gap reconciliation (user call 2026-09-05): some species' housing sidecar counts
   animals in enclosures whose names appear on NO animal record — the dump's two parts
   disagree — so a tapped row showed counts over an empty sheet. THE RULE: a row that
   shows counts lists that many animals. The strict site+enclosure join stays the truth;
   any deficit against the row's counts tops up with DETERMINISTIC synthesized records
   (the lab/ledger/tags precedent — stable per site+enclosure+index): gender honoring
   the row's split, 6-digit AIDs shaped like the dump's real ones, ~2/3 wearing a ring
   or chip. */
const encHash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h
}

export const enclosureAnimalsOf = (
  animals: AnimalRecord[],
  site?: string,
  enclosure?: string,
  counts?: { male: number; female: number; unsexed: number }
): AnimalRecord[] => {
  const joined = animals.filter(a => a.site === site && a.enclosure === enclosure)
  if (!counts || !site || !enclosure) return joined

  const deficits: [string, number][] = [
    ['male', counts.male - joined.filter(a => a.gender === 'male').length],
    ['female', counts.female - joined.filter(a => a.gender === 'female').length],
    ['undetermined', counts.unsexed - joined.filter(a => a.gender !== 'male' && a.gender !== 'female').length]
  ]
  const synth: AnimalRecord[] = []
  for (const [gender, n] of deficits) {
    for (let i = 0; i < n; i++) {
      const h = encHash(`${site}|${enclosure}|${gender}|${i}`)
      synth.push({
        // 205000+ sits above every real AID in the dump (~200k) — no key collisions
        antzId: String(205000 + (h % 10000)),
        gender,
        site,
        enclosure,
        ...(h % 3 === 0 ? { ring: `R-${1000 + (h % 9000)}` } : h % 3 === 1 ? { chip: String(100000 + (h % 900000)) } : {})
      })
    }
  }

  return [...joined, ...synth]
}

/* ── ViewToggle — THE segmented view control (user call 2026-09-05: ONE component so a
   styling change lands everywhere; previously hand-rolled in Housing / CoL / Lab /
   Assessments). Sage TOGGLE_TRACK track, white active pill wearing the accent ink,
   optional leading icon and quiet tabular count. Scrolls, never wraps. */
export const ViewToggle: React.FC<{
  items: { key: string; label: string; icon?: string; count?: string | number }[]
  value: string
  onChange: (key: string) => void
  /** Fixed track height (the table-control 44); omit for content height (py-based). */
  height?: number
  /** Track corner radius — pill by default; Lab's request-kind toggle passes '10px'. */
  radius?: string
  sx?: Record<string, unknown>
}> = ({ items, value, onChange, height, radius = '999px', sx }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'stretch',
      alignSelf: 'flex-start',
      maxWidth: '100%',
      ...(height ? { height } : {}),
      p: '3px',
      gap: '2px',
      borderRadius: radius,
      bgcolor: skin.TOGGLE_TRACK,
      boxSizing: 'border-box',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': { display: 'none' },
      WebkitOverflowScrolling: 'touch',
      ...sx
    }}
  >
    {items.map(v => {
      const on = value === v.key

      return (
        <Box
          key={v.key}
          onClick={() => onChange(v.key)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            px: 3.5,
            ...(height ? {} : { py: 1.5 }),
            borderRadius: radius === '999px' ? '999px' : '8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            bgcolor: on ? '#ffffff' : 'transparent',
            ...skin.cardPressSx,
            transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}`
          }}
        >
          {v.icon && <Icon icon={v.icon} fontSize='1rem' color={on ? skin.TOGGLE_ON : skin.MUTED} />}
          <Typography sx={{ fontSize: '15px', fontWeight: 500, color: on ? skin.TOGGLE_ON : skin.MUTED, whiteSpace: 'nowrap' }}>
            {v.label}
          </Typography>
          {v.count != null && (
            <Typography
              component='span'
              sx={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: on ? skin.TOGGLE_ON : skin.FAINT }}
            >
              {v.count}
            </Typography>
          )}
        </Box>
      )
    })}
  </Box>
)

/* ── YearLinesChart — THE multi-year trend standard (demo review 2026-09-04): one line
   PER CALENDAR YEAR over a Jan–Dec axis, never a year in the axis labels, ≤5 lines
   (callers cap the series). One accent, lightness ladder by recency (latest = full);
   the year legend carries the identity. Tap → pinned tooltip with the YEAR-WISE breakup
   for that month; tap ON a dot → onPoint(year, month) drill (the sheet must match the
   dot's number). Hand-rolled SVG per the module chart standard (recharts is broken
   here; ApexCharts stays for the dashboard). */
export interface YearSeries {
  year: number
  /** 12 monthly sums, Jan..Dec. */
  values: number[]
}

const YL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const YearLinesChart: React.FC<{
  /** Newest year FIRST — index drives the lightness ladder. */
  series: YearSeries[]
  accent: string
  noun?: string
  height?: number
  onPoint?: (year: number, monthIdx: number) => void
}> = ({ series, accent, noun = 'records', height = 280, onPoint }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  const shade = (i: number) => skin.mixOverWhite(accent, [1, 0.72, 0.52, 0.36, 0.24][i] ?? 0.2)

  if (!series.length) return null

  return (
    <Box sx={{ ...apexTooltipSx(theme), ...(onPoint ? { '& .apexcharts-marker, & .apexcharts-series': { cursor: 'pointer' } } : {}) }}>
      {/* year legend — the ladder's identity (axis labels never carry the year) */}
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 1 }}>
        {series.map((sr, i) => (
          <Box key={sr.year} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 18, height: 4, borderRadius: '2px', backgroundColor: shade(i) }} />
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: skin.INK2 }}>{sr.year}</Typography>
          </Box>
        ))}
      </Box>

      <ReactApexcharts
        type='line'
        height={height}
        options={{
          chart: {
            toolbar: { show: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            zoom: { enabled: false },
            // Spread, never `events: undefined` — an explicit undefined clobbers Apex's
            // default events object (the TrendAreaChart lesson).
            ...(onPoint
              ? {
                  events: {
                    markerClick: (_e: any, _ctx: any, opts: any) => {
                      const sr = series[opts?.seriesIndex ?? -1]
                      if (sr && opts?.dataPointIndex >= 0) onPoint(sr.year, opts.dataPointIndex)
                    }
                  }
                }
              : {})
          },
          colors: series.map((_, i) => shade(i)),
          // the SAME smooth curve as TrendAreaChart — one chart family, no sharp elbows
          stroke: { curve: 'smooth', width: series.map((_, i) => (i === 0 ? 3 : 2)) },
          legend: { show: false },
          dataLabels: { enabled: false },
          markers: { size: 4, strokeWidth: 1.5, strokeColors: theme.palette.common.white, hover: { size: 6 } },
          // grid + axis type EXACTLY as TrendAreaChart — one chart family, one geometry
          grid: {
            borderColor: c.SurfaceVariant,
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 16, left: 12, right: 20 }
          },
          xaxis: {
            categories: YL_MONTHS,
            labels: { style: { colors: c.neutralSecondary, fontSize: '14px' }, rotate: 0, hideOverlappingLabels: false, trim: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false }
          },
          yaxis: {
            min: 0,
            tickAmount: 4,
            labels: {
              style: { colors: c.neutralSecondary, fontSize: '14px' },
              formatter: (v: number) => Math.round(v).toLocaleString(),
              minWidth: 26,
              align: 'left',
              offsetX: -12
            }
          },
          // THE platform tooltip (trendTooltipHTML — Surface header + dot rows, 16px):
          // shared, so the hovered month lists EVERY year's value (the year-wise breakup).
          tooltip: {
            shared: true,
            intersect: false,
            custom: ({ dataPointIndex }: any) =>
              trendTooltipHTML(
                theme,
                YL_MONTHS[dataPointIndex] ?? '',
                series.map((sr, i) => ({ color: shade(i), label: String(sr.year), value: (sr.values[dataPointIndex] || 0).toLocaleString() }))
              )
          }
        }}
        series={series.map(sr => ({ name: String(sr.year), data: sr.values }))}
      />
    </Box>
  )
}

/* ── UnderlineTabs — the in-card underline sub-tabs (Ledger/Lab/Medical anatomy;
   kit-level per user call 2026-09-05). Accent-ink active label over a 2.5px underline.
   TODO next consolidation pass: the icon+hover variant (Eggs/Hospital/Medical drills)
   and the per-tab-accent variant (CoL) fold in here via icon/accent props. */
export const UnderlineTabs: React.FC<{
  tabs: { key: string; label: React.ReactNode }[]
  value: string
  onChange: (k: string) => void
}> = ({ tabs, value, onChange }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const on = value === t.key

        return (
          <Box
            key={t.key}
            onClick={() => onChange(t.key)}
            role='tab'
            aria-selected={on}
            sx={{ py: 1.5, mb: '-1px', borderBottom: '2.5px solid', borderColor: on ? skin.ACCENT_FILL : 'transparent', cursor: 'pointer' }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: on ? skin.ACCENT_INK : c.neutralSecondary }}>
              {t.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

/* ── HeaderSubTabs — second-level tabs DOCKED onto the shell's main tab bar (user call
   2026-09-05): the screen's sub-tabs render as UnderlineTabs attached under the CC tab
   track (divider between), one connected navigation block — not floating in the page.
   A tab component declares its sub-tabs with <HeaderSubTabs .../>; the shell provides
   the slot via HeaderSubTabsProvider and paints the row. Outside a provider (or any
   shell that hasn't opted in) the component falls back to rendering inline, so the tabs
   never disappear. Only the current value + labels live in shell state — the onChange
   stays in a ref, so re-publishing an identical spec never re-renders the shell. */
export type HeaderSubTabsSpec = {
  tabs: { key: string; label: string }[]
  value: string
  onChange: (k: string) => void
  /** Optional settings trigger — the shell pins a gear at the row's right end (the
   *  main track's menu-button anatomy, mirrored) that fires this. */
  onSettings?: () => void
}

const HeaderSubTabsCtx = React.createContext<{ publish: (s: HeaderSubTabsSpec | null) => void } | null>(null)

/** Shell-side hook: owns the slot state and hands back [spec, providerValue]. */
export const useHeaderSubTabsSlot = () => {
  const [spec, setSpec] = useState<{ tabs: { key: string; label: string }[]; value: string; hasSettings: boolean } | null>(null)
  const onChangeRef = useRef<(k: string) => void>(() => undefined)
  const onSettingsRef = useRef<(() => void) | undefined>(undefined)
  const publish = React.useCallback((s: HeaderSubTabsSpec | null) => {
    if (!s) {
      setSpec(null)

      return
    }
    onChangeRef.current = s.onChange
    onSettingsRef.current = s.onSettings
    const hasSettings = !!s.onSettings
    // Content-compare so the per-render publish from HeaderSubTabs never loops the shell.
    setSpec(prev =>
      prev &&
      prev.value === s.value &&
      prev.hasSettings === hasSettings &&
      prev.tabs.length === s.tabs.length &&
      prev.tabs.every((t, i) => t.key === s.tabs[i].key && t.label === s.tabs[i].label)
        ? prev
        : { tabs: s.tabs, value: s.value, hasSettings }
    )
  }, [])
  const ctxValue = React.useMemo(() => ({ publish }), [publish])

  return { spec, onChange: (k: string) => onChangeRef.current(k), onSettings: () => onSettingsRef.current?.(), ctxValue }
}

export const HeaderSubTabsProvider = HeaderSubTabsCtx.Provider

export const HeaderSubTabs: React.FC<HeaderSubTabsSpec> = ({ tabs, value, onChange, onSettings }) => {
  const ctx = React.useContext(HeaderSubTabsCtx)

  // Publish after every render — the slot dedupes, so only real changes land.
  useEffect(() => {
    ctx?.publish({ tabs, value, onChange, onSettings })
  })

  // Leaving the screen clears the slot.
  useEffect(() => () => ctx?.publish(null), [ctx])

  if (!ctx) return <UnderlineTabs tabs={tabs} value={value} onChange={onChange} />

  return null
}

/* ── SearchPill — THE rounded search field (user call 2026-09-05: kit-first; was
   hand-rolled in nearly every tab). Two skin variants (skin.ts standard): on WHITE
   surfaces the quiet FIELD_BG fill w/ no outline; on the sage GROUND / sheet bodies
   (`ground`) the SEARCH_BG white fill w/ HAIR outline.

   COLLAPSING (user calls 2026-09-05): behavior is a CONDITION on the component —
   `collapsible` idles the search COLLAPSED (round icon button; with an active query a
   compact pill showing the text ellipsized). Tapping it expands the field over the
   FULL header row (overlay — the row's other controls sit beneath, unseen) and
   focuses it; blur/Escape collapses back. DEFAULT is the classic always-expanded
   field — screens opt IN per surface (CoL table header does; everywhere else stays
   expanded). */
export const SearchPill: React.FC<{
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Sage-ground/sheet variant: white fill + hairline outline; always expanded. */
  ground?: boolean
  /** Opt-IN: idle collapsed (icon / query pill), expand over the full row on tap. */
  collapsible?: boolean
  /** Opt-IN: elastic — always visible, GROWS on focus and shrinks back on blur. */
  elastic?: boolean
  height?: number
  sx?: Record<string, unknown>
}> = ({ value, onChange, placeholder = 'Search…', ground, collapsible, elastic, height = 44, sx }) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [ov, setOv] = useState<{ left: number; width: number } | null>(null)

  const fieldSx = {
    '& .MuiInputBase-root': {
      height,
      bgcolor: ground ? skin.SEARCH_BG : skin.FIELD_BG,
      borderRadius: '999px',
      fontSize: '15px'
    },
    '& .MuiOutlinedInput-notchedOutline': ground ? { border: `1px solid ${skin.HAIR}` } : { border: 'none' },
    '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
  }

  const field = (extra?: Record<string, unknown>, autoFocus?: boolean) => (
    <TextField
      size='small'
      placeholder={placeholder}
      value={value}
      autoFocus={autoFocus}
      onChange={e => onChange(e.target.value)}
      onBlur={autoFocus ? () => setOpen(false) : undefined}
      onKeyDown={autoFocus ? e => e.key === 'Escape' && setOpen(false) : undefined}
      sx={{ ...fieldSx, ...extra }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
    />
  )

  // Elastic (user calls 2026-09-05): a FLEX FILLER — takes the row's free space and
  // yields ONLY what the other controls need (down to a floor), never snapping to an
  // icon. When Custom's year selects appear, the field shrinks just enough to fit them.
  if (elastic && !ground) {
    return (
      <TextField
        size='small'
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        sx={{
          ...fieldSx,
          // '&&' beats ControlsRow's flexShrink:0-on-children rule
          '&&': { flex: '1 1 auto', minWidth: 130 },
          ...sx
        }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
      />
    )
  }

  // Default = the classic always-expanded field; collapsing is per-surface opt-in.
  if (!collapsible || ground) return field(sx)

  const expand = () => {
    const el = wrapRef.current
    const row = el?.parentElement
    if (el && row) {
      const a = el.getBoundingClientRect()
      const b = row.getBoundingClientRect()
      setOv({ left: b.left - a.left, width: b.width })
    } else {
      setOv(null)
    }
    setOpen(true)
  }

  return (
    <Box ref={wrapRef} sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
      {value ? (
        // collapsed WITH a query — the pill keeps the searched text visible, ellipsized
        <Box
          onClick={expand}
          sx={{
            height,
            maxWidth: 190,
            px: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: '999px',
            bgcolor: skin.FIELD_BG,
            cursor: 'pointer',
            minWidth: 0
          }}
        >
          <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ color: skin.FAINT, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '15px', color: skin.INK2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </Typography>
        </Box>
      ) : (
        // collapsed idle — the round icon button (the header Filters-button grammar)
        <Box
          onClick={expand}
          aria-label='Search'
          sx={{
            width: height,
            height,
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: skin.FIELD_BG,
            cursor: 'pointer',
            '&:hover': { bgcolor: skin.ROW_HOVER }
          }}
        >
          <Icon icon='mdi:magnify' fontSize='1.3rem' style={{ color: skin.INK2 }} />
        </Box>
      )}

      {open && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: ov ? `${ov.left}px` : 0,
            width: ov ? `${ov.width}px` : '100%',
            zIndex: 12,
            backgroundColor: '#ffffff',
            borderRadius: '999px'
          }}
        >
          {field({ width: '100%' }, true)}
        </Box>
      )}
    </Box>
  )
}

/* ── ControlsRow — ONE horizontal row of header controls that SCROLLS, never wraps
   (the platform rule — a wrapped second row of controls reads as a second component;
   user-caught on the CoL table header 2026-09-05). Children keep their size. */
export const ControlsRow: React.FC<{ children: React.ReactNode; sx?: Record<string, unknown> }> = ({ children, sx }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      width: '100%',
      minWidth: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': { display: 'none' },
      WebkitOverflowScrolling: 'touch',
      '& > *': { flexShrink: 0 },
      ...sx
    }}
  >
    {children}
  </Box>
)

/* ── PillSelect — compact required single-choice dropdown in the pill grammar (the
   space-saving stand-in for a ViewToggle when a header row is crowded — user call
   2026-09-05, CoL table's Animal/Site view). Always has a value; no empty option. */
export const PillSelect: React.FC<{
  value: string
  items: { value: string; label: string; icon?: string }[]
  onChange: (v: string) => void
  height?: number
  minWidth?: number
}> = ({ value, items, onChange, height = 44, minWidth = 150 }) => {
  const active = items.find(i => i.value === value)

  return (
    <Select
      size='small'
      value={value}
      onChange={e => onChange(String(e.target.value))}
      IconComponent={SelectChevron}
      renderValue={() => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {active?.icon && <Icon icon={active.icon} fontSize='1.1rem' color={skin.INK2} />}
          <Typography sx={{ fontSize: '15px', fontWeight: 500, color: skin.INK2 }} noWrap>
            {active?.label ?? value}
          </Typography>
        </Box>
      )}
      sx={{
        height,
        minWidth,
        bgcolor: '#ffffff',
        borderRadius: '999px',
        '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0 },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER_HOVER }
      }}
      MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320, borderRadius: '10px' } } } }}
    >
      {items.map(i => (
        <MenuItem key={i.value} value={i.value}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {i.icon && <Icon icon={i.icon} fontSize='1.1rem' color={skin.INK2} />}
            {i.label}
          </Box>
        </MenuItem>
      ))}
    </Select>
  )
}

/* ── ChipFilterRow — one scrolling row of multi-select filter chips w/ counts and a
   leading "All" (the Pairing composition strip, kit-level per user call 2026-09-05).
   Empty selection = all; the All chip shows selected then and clears on tap. */
export const ChipFilterRow: React.FC<{
  items: { key: string; label: string; count: number }[]
  values: string[]
  onChange: (values: string[]) => void
  /** Count shown on the leading All chip (typically the unfiltered row total). */
  allCount: number
  allLabel?: string
}> = ({ items, values, onChange, allCount, allLabel = 'All' }) => (
  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
    {[{ key: '__all__', label: allLabel, count: allCount }, ...items].map(it => {
      const isAll = it.key === '__all__'
      const on = isAll ? values.length === 0 : values.includes(it.key)

      return (
        <Box
          key={it.key}
          onClick={() => onChange(isAll ? [] : on ? values.filter(v => v !== it.key) : [...values, it.key])}
          sx={{
            height: 36,
            px: 3.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: '999px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: `1px solid ${on ? skin.LIST_GREEN : skin.HAIR}`,
            backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : '#ffffff',
            '&:hover': { backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER }
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: on ? 600 : 500, color: on ? skin.LIST_GREEN : skin.INK2 }}>{it.label}</Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: on ? skin.LIST_GREEN : skin.FAINT }}>
            {it.count.toLocaleString()}
          </Typography>
        </Box>
      )
    })}
  </Box>
)

/* ── TagPill — the neutral tag chip (Population Tags column + Animal Tags sheet). ── */
export const TagPill: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component='span'
    sx={{
      px: 2.5,
      height: 26,
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '999px',
      backgroundColor: skin.TONE_SOFT.neutral,
      fontSize: '13px',
      fontWeight: 600,
      color: skin.TONE_TYPE.neutral,
      whiteSpace: 'nowrap'
    }}
  >
    {label}
  </Box>
)

/** CellText shorthand — the per-tab `txt()` helpers, kit-level. */
export const txtCell = (v: React.ReactNode, color?: string, weight = 500) => (
  <CellText color={color} weight={weight}>
    {v}
  </CellText>
)

/** THE right-aligned count column (Pairing/Housing grammar): zeros print the pale em
 *  dash, `total` wears bold list-green (the scan anchor). */
export const countCol = (field: string, header: string, opts?: { total?: boolean; width?: number }): GridColDef => ({
  width: opts?.width ?? (opts?.total ? 96 : 64),
  sortable: false,
  align: 'right',
  headerAlign: 'right',
  field,
  headerName: header,
  renderCell: p => {
    const n = Number(p.row[field] || 0)
    if (opts?.total) return txtCell(n.toLocaleString(), skin.LIST_GREEN, 700)

    return n > 0 ? txtCell(n.toLocaleString(), undefined, 600) : txtCell('—', skin.DASH_INK, 400)
  }
})

/* ── NameSiteCell — table identity cell: bold name (wraps to 2 lines, never clips) with
   an optional faint sub-line (site under enclosure, etc.). ── */
export const NameSiteCell: React.FC<{ name: React.ReactNode; sub?: React.ReactNode }> = ({ name, sub }) => {
  const theme = useTheme() as any
  const c = theme.palette.customColors as Record<string, string>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: c.OnSurfaceVariant,
          lineHeight: 1.25,
          whiteSpace: 'normal', // cells inherit the grid's nowrap — re-allow breaks
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {name}
      </Typography>
      {sub ? (
        <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
          {sub}
        </Typography>
      ) : null}
    </Box>
  )
}

/* ── RealAnimalCardRow — the standard animal card row (2026-09-02) driven by the
   RECORD's real fields (was duplicated verbatim in Pairing + Housing; kit-level per
   user call 2026-09-05): gender → badge, ring/chip + AID → identifiers, name only when
   it isn't the AID; age/weight ride the card's own stat block; a chip crowded out by a
   ring rides as meta. Site + enclosure stay OFF the card — these rows live in sheets
   already scoped to one enclosure. */
export const RealAnimalCardRow: React.FC<{ a: AnimalRecord; last?: boolean }> = ({ a, last }) => {
  const primary: AnimalCardId | null = a.ring
    ? { label: 'Ring', value: a.ring }
    : a.chip
      ? { label: 'Chip', value: a.chip }
      : null
  const identifiers: AnimalCardId[] = primary
    ? [primary, { label: 'AID', value: a.antzId }]
    : [{ label: 'AID', value: a.antzId }]
  const meta = [a.ring && a.chip ? `Chip: ${a.chip}` : null].filter(Boolean) as string[]

  return (
    <AnimalCardRow
      aid={a.antzId}
      identifiers={identifiers}
      tag={genderTagOf(a.gender)}
      name={a.name && a.name !== a.antzId ? a.name : undefined}
      age={a.age}
      weight={a.weight}
      meta={
        meta.length > 0 ? (
          <>
            {meta.map((m, i) => (
              <RowMetaText key={i} strong={i === 0}>
                {m}
              </RowMetaText>
            ))}
          </>
        ) : undefined
      }
      last={last}
    />
  )
}

/** Clamp a record-derived kind split against an aggregate's single unsexed bucket —
 *  any unsexed remainder the records can't name stays UD, so a row ALWAYS sums to its
 *  Total (the table rule, user call 2026-09-05). Returns the display fields
 *  {ud, ind, grp} — `ind` because a grid data column must never be named `id` (the
 *  DataGrid reserves it). */
export const splitUnsexed = (unsexed: number, kinds?: EnclosureSexKinds) => {
  const ind = Math.min(kinds?.id || 0, unsexed)
  const grp = Math.min(kinds?.grp || 0, Math.max(unsexed - ind, 0))

  return { ud: Math.max(unsexed - ind - grp, 0), ind, grp }
}

/** Record gender → card badge kind. The dump's vocabulary is male / female /
 *  undetermined / indeterminate (114 records) / group (none yet) — before this helper
 *  every caller collapsed the last three into UD, so an indeterminate animal wore the
 *  wrong letter. */
export const genderTagOf = (g?: string): AnimalTagKind =>
  g === 'male' ? 'male' : g === 'female' ? 'female' : g === 'indeterminate' ? 'indetermined' : g === 'group' ? 'group' : 'undetermined'

export const ENCLOSURE_COMPOSITIONS = ['Male', 'Female', 'Male & Female', 'Undetermined', 'Indeterminate', 'Group', 'Mixed', 'Empty']

export const enclosureCompositionOf = (
  male: number,
  female: number,
  unsexed: number,
  total: number,
  kinds?: EnclosureSexKinds
): string => {
  /* THE composition ladder — EXHAUSTIVE, locked by the user 2026-09-05 (every scenario
   * named; do NOT re-derive):
   *   only M                          → Male
   *   only F                          → Female
   *   M + F and NOTHING else          → Male & Female
   *   any sex + any unsexed kind      → Mixed   (M+UD, M+F+ID, M+F+UD+ID+G, M+G, …)
   *   only UD                         → Undetermined
   *   only ID                         → Indeterminate
   *   only G                          → Group
   *   unsexed kinds blended (UD+ID…)  → Mixed
   *   nothing                         → Empty
   * Callers without record-level kinds (aggregates only) can't split UD/ID/G — their
   * unsexed-only enclosures read Undetermined, the dominant reality. */
  if (total <= 0) return 'Empty'

  if (male > 0 || female > 0) {
    if (unsexed > 0) return 'Mixed' // a sex plus ANY unsexed kind — never Male & Female
    if (male > 0 && female > 0) return 'Male & Female'

    return male > 0 ? 'Male' : 'Female'
  }

  // Only unsexed animals — the records (when given) say WHICH kind. A kind's name is
  // worn ONLY when pure; UD/ID/G blends read Mixed (UD and ID are two different things).
  const n = kinds ? kinds.ud + kinds.id + kinds.grp : 0
  if (kinds && n > 0) {
    if (kinds.grp === n) return 'Group'
    if (kinds.id === n) return 'Indeterminate'
    if (kinds.ud === n) return 'Undetermined'

    return 'Mixed'
  }

  return 'Undetermined'
}

export interface AnimalCardId {
  label: string // "Ear Tag" · "AID" · "Ring" · …
  value: string
}

export const AnimalIdCard: React.FC<{
  /** Ordered identifiers, PRIMARY FIRST — only the first two render (AID included). */
  identifiers: AnimalCardId[]
  enclosure?: string
  site?: string
  tag?: AnimalTagKind
  /** Group size — renders inside the badge ("G 12"); group tag only. */
  groupCount?: number
  photo?: string
  /** objectPosition framing for the photo crop (same idea as the banner's bgPos). */
  photoPos?: string
  /** Identity block edge — 94 default (mobile's 84 + 10 per user call 2026-09-02). */
  size?: number
  /** Inline extras after the primary identifier (×N repeat marker, Chronic tag …). */
  titleExtra?: React.ReactNode
  /** The animal's real display name. HARD RULE (user, 2026-09-02): shown ONLY when the
   *  card has a single identifier line (AID alone) — it then takes the second line.
   *  With two identifiers the name does not render at all. */
  name?: string
  /** Age / weight — the card's right-aligned stat block (user call 2026-09-02): age strong
   *  on top, weight quiet beneath as "N kg". A missing/empty value drops its OWN line —
   *  never an empty "kg" or a dash. Surfaces that don't need them simply omit the props. */
  age?: string
  weight?: string
}> = ({ identifiers, enclosure, site, tag, groupCount, photo, photoPos, size = 94, titleExtra, name, age, weight }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const ids = identifiers.slice(0, 2)
  const nameLine = ids.length < 2 && name && !ids.some(id => id.value === name) ? name : undefined
  const ageLine = (age || '').trim()
  // normalize the unit: some records carry "2169.59 kg", others a bare number — strip any
  // trailing "kg" so the card appends it exactly once
  const weightLine = String(weight ?? '')
    .trim()
    .replace(/\s*kgs?\.?$/i, '')
    .trim()

  return (
    // width 100% so the age/weight stat block can right-align inside table cells
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, width: '100%' }}>
      {/* identity block — photo or the mint placeholder with the logomark watermark */}
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: skin.CARD_PLACEHOLDER_BG
        }}
      >
        {photo ? (
          <Box
            component='img'
            src={photo}
            alt=''
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos || 'center', display: 'block' }}
          />
        ) : (
          // no-photo fallback: the logomark CENTERED in the mint block (user call 2026-09-02)
          <Box
            component='img'
            src='/images/branding/Antz_logomark_h_color.svg'
            alt=''
            sx={{
              position: 'absolute',
              inset: 0,
              m: 'auto',
              width: Math.round(size * 0.5),
              opacity: 0.5
            }}
          />
        )}
        {tag === 'mortality' ? (
          // the REAL mortality badge asset (SVG/Mortality Badge.svg — "M" + icon on the
          // maroon plate, straight from Figma), not a re-drawn letter chip
          <Box
            component='img'
            src='/images/species/mortality-badge.svg'
            alt='Mortality'
            sx={{ position: 'absolute', top: 4, left: 4, height: 24, display: 'block' }}
          />
        ) : tag ? (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              minWidth: 24,
              height: 24,
              px: tag === 'group' ? 1.25 : 0,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: skin.ANIMAL_TAG[tag]
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 600, lineHeight: 1, color: '#ffffff', whiteSpace: 'nowrap' }}>
              {tag === 'group' && groupCount != null ? `G ${groupCount}` : TAG_LETTER[tag]}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {/* identifier stack — primary bold navy, everything else the quiet dark green */}
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {ids.map((id, i) => (
          <Box key={id.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: i === 0 ? CELL_FONT : '0.9375rem',
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? skin.CARD_ID_INK : c.OnSurfaceVariant
              }}
              noWrap
            >
              {id.label}: {id.value}
            </Typography>
            {i === 0 && titleExtra}
          </Box>
        ))}
        {nameLine && (
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: c.OnSurfaceVariant }} noWrap>
            {nameLine}
          </Typography>
        )}
        {/* ONE location line, enforced here (user call 2026-09-06 — the 3-row rule is a
            COMPONENT guarantee, not caller discipline): site wins when both arrive. */}
        {enclosure && !site && (
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: c.OnSurfaceVariant }} noWrap>
            Encl: {enclosure}
          </Typography>
        )}
        {site && (
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: c.OnSurfaceVariant }} noWrap>
            Site: {site}
          </Typography>
        )}
      </Box>

      {/* age / weight stat block — right-aligned; each line only when it has a value */}
      {(ageLine || weightLine) && (
        <Box sx={{ ml: 'auto', pl: 2, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
          {ageLine && (
            <Typography sx={{ fontSize: CELL_FONT, fontWeight: 500, color: c.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
              {ageLine}
            </Typography>
          )}
          {weightLine && (
            <Typography sx={{ fontSize: '0.9375rem', color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
              {weightLine} kg
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

/** Species with a real hero photo (single copy — the detail banner AND the animal card's
 *  photo variant both resolve here). bgPos frames the crop on the face. */
export const HERO_PHOTOS: Record<string, { src: string; bgPos: string }> = {
  '2150': { src: '/images/species/2150.jpg', bgPos: 'center 38%' },
  '449': { src: '/images/species/449.jpg', bgPos: 'center 10%' }
}

/** Species hero photo for the AnimalIdCard photo variant — a tab provides it ONCE at its
 *  root (value = HERO_PHOTOS[speciesId]) and every card row below resolves it, so sheet
 *  components don't thread photo props four levels deep. */
export const HeroPhotoContext = React.createContext<{ src: string; bgPos: string } | undefined>(undefined)

/* ── AnimalIdCard identity synthesis (DEMO DATA, 2026-09-02) ─────────────────
 * The species sidecars are synthetic and carry no gender / extra identifiers, so the
 * card fields derive DETERMINISTICALLY from the aid (stable across renders and tabs).
 * Identifier rules (user spec): one identifier is primary and leads bold; max TWO show,
 * AID included — tag-primary → tag then AID · AID-primary → AID then tag · AID-only →
 * one line. A real API later replaces this helper with actual fields. */
const ENCL_POOL = ['North Paddock', 'Willow Yard', 'Cedar Hollow', 'Creek Run', 'Fern Grove', 'Basalt Ridge', 'Mangrove Walk', 'Sunrise Bay']
const aidHash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h
}
export const synthAnimalIdentity = (aid: string) => {
  const h = aidHash(aid)
  const g = h % 100
  const tag: AnimalTagKind = g < 42 ? 'male' : g < 84 ? 'female' : g < 94 ? 'undetermined' : 'indetermined'

  const aidId = { label: 'AID', value: aid }
  const mix = (h >> 4) % 10 // 0-5 tag primary · 6-7 AID primary + tag · 8-9 AID only
  const tagLabel = (h >> 2) % 3 === 0 ? 'Ring' : 'Ear Tag'
  const tagValue = tagLabel === 'Ring' ? `R-${1000 + (h % 9000)}` : String(100000 + (h % 900000))
  const identifiers =
    mix >= 8 ? [aidId] : mix >= 6 ? [aidId, { label: tagLabel, value: tagValue }] : [{ label: tagLabel, value: tagValue }, aidId]

  return { tag, identifiers, enclosure: ENCL_POOL[(h >> 3) % ENCL_POOL.length], hasPhoto: h % 10 < 6 }
}

/** Display label for an identifier type on the animal card — the data says "Micro chip" /
 *  "Microchip" / "Transponder", the card says "Chip" (user call 2026-09-02). */
export const idTypeLabel = (raw?: string): string => {
  const t = (raw || '').toLowerCase()
  if (t.includes('chip') || t.includes('transponder')) return 'Chip'
  if (t.includes('ring')) return 'Ring'

  return raw || 'ID'
}

/** Quiet right-aligned meta line for AnimalCardRow's trailing column (dates, medicine names). */
export const RowMetaText: React.FC<{ children?: React.ReactNode; strong?: boolean; wrap?: boolean }> = ({
  children,
  strong,
  wrap
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography
      sx={{
        fontSize: '0.9375rem',
        color: strong ? c.OnSurfaceVariant : c.neutralSecondary,
        textAlign: 'right',
        ...(wrap ? {} : { whiteSpace: 'nowrap' })
      }}
    >
      {children}
    </Typography>
  )
}

/** THE standard sheet/list row for animal listings (2026-09-02): AnimalIdCard left,
 *  trailing chip + quiet meta lines right-aligned, chevron for navigational rows.
 *  Identity fields come from synthAnimalIdentity(aid) — pass `enclosure`/`site` to
 *  override with REAL data where the record carries it. Site follows the card's hard
 *  rule: pass it only when the surrounding list spans more than one site. */
export const AnimalCardRow: React.FC<{
  aid: string
  site?: string
  enclosure?: string
  tag?: AnimalTagKind
  /** REAL identifiers override (max 2, primary first) — synthesis only fills the gap when
   *  the record carries no identifier data ("real fields beat synthesis"). */
  identifiers?: AnimalCardId[]
  titleExtra?: React.ReactNode
  /** Real display name — renders only when AID is the sole identifier (card's hard rule). */
  name?: string
  /** Age / weight — forwarded to the card's right stat block (empty values self-hide). */
  age?: string
  weight?: string
  /** Top-right chip(s). */
  trailing?: React.ReactNode
  /** Quiet lines under the chip (RowMetaText or any node), right-aligned.
   *  HARD RULE (user, 2026-09-02): ONE item per line — pass stacked RowMetaText lines,
   *  never bullet-joined strings. (List rows only; tables keep their column grammar.) */
  meta?: React.ReactNode
  chevron?: boolean
  last?: boolean
  onClick?: () => void
  size?: number
}> = ({ aid, site, enclosure, tag, identifiers, titleExtra, name, age, weight, trailing, meta, chevron, last, onClick, size = 75 }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const heroPhoto = React.useContext(HeroPhotoContext)
  const s = synthAnimalIdentity(aid)

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 4,
        borderBottom: last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        ...(onClick ? { cursor: 'pointer', '&:hover': { backgroundColor: c.Surface } } : {})
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AnimalIdCard
          identifiers={identifiers ?? s.identifiers}
          // HARD RULE, enforced at the COMPONENT (user call 2026-09-06 — callers kept
          // leaking a 4-row card): ONE location line only. A row that carries `site`
          // NEVER shows an enclosure (and the synth backfill is blocked); enclosure
          // renders only when no site rides the row. Default size = the 75px minimal
          // card — sheet lists are ALWAYS the minimal card.
          enclosure={site ? undefined : identifiers ? enclosure : enclosure ?? s.enclosure}
          site={site}
          tag={tag ?? s.tag}
          titleExtra={titleExtra}
          name={name}
          age={age}
          weight={weight}
          photo={s.hasPhoto ? heroPhoto?.src : undefined}
          photoPos={heroPhoto?.bgPos}
          size={size}
        />
      </Box>
      {(trailing != null || meta != null) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5, flexShrink: 0, maxWidth: '45%' }}>
          {trailing}
          {meta}
        </Box>
      )}
      {chevron && onClick && <Icon icon='mdi:chevron-right' fontSize='1.25rem' color={c.Outline} />}
    </Box>
  )
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-07" → "Jul '25"; passes through anything that isn't a YYYY-MM string. */
const fmtMonth = (v: any): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(v))
  if (!m) return String(v ?? '')

  return `${MONTH_ABBR[Number(m[2]) - 1] ?? m[2]} ${m[1]}`
}

/** Resolve a semantic tone to {bg, fg} token colors. */
export const useTone = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  // CC tone pairs: the SOFT wash carries the tint, the TYPE ink is always the tone's
  // readable partner — never the bright fill as text. This also un-collides warning
  // (amber family) from error (red family); they used to share the coral.
  return (tone: Tone): { bg: string; fg: string } => {
    switch (tone) {
      case 'success':
        return { bg: skin.TONE_SOFT.good, fg: skin.TONE_TYPE.good }
      case 'warning':
        return { bg: skin.TONE_SOFT.warn, fg: skin.TONE_TYPE.warn }
      case 'error':
        return { bg: skin.TONE_SOFT.bad, fg: skin.TONE_TYPE.bad }
      case 'danger':
        // Terminal/fatal states (e.g. died in care) — darker than 'error'.
        return { bg: `${c.rusticRed}1A`, fg: c.rusticRed }
      case 'caution':
        // Mid-severity between 'primary' and the warm tones. Text stays dark —
        // the gold moderateSecondary is unreadable on the pale-yellow Notes bg (2026-08-03).
        return { bg: c.Notes, fg: c.OnSurfaceVariant }
      case 'info':
        // Teal is a FILL — as type it wears its deep ink partner (CC strokeOf rule).
        return { bg: c.antzSecondaryBg, fg: skin.strokeOf('#00abab') }
      case 'primary':
        return { bg: c.OnBackground, fg: skin.ACCENT_INK }
      default:
        return { bg: skin.TONE_SOFT.neutral, fg: skin.TONE_TYPE.neutral }
    }
  }
}

export const SectionTitle: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => (
  <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2, ...sx }}>
    {children}
  </Typography>
)

const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'

/**
 * Render a "a · b · c" caption with the `·` separators as visible bullets (the plain middot is
 * too faint at caption size). Non-string captions (nodes) pass through unchanged.
 */
const withBullets = (caption: React.ReactNode): React.ReactNode => {
  if (typeof caption !== 'string' || !caption.includes('·')) return caption
  const parts = caption.split('·').map(p => p.trim())

  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {i > 0 && (
        <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
          •
        </Box>
      )}
      {part}
    </React.Fragment>
  ))
}

/**
 * THE standard side-sheet list row (Figma node 2:3) — one component for every drawer list in the
 * module. Never hand-roll a sheet row again; use this everywhere. Layout:
 *   [ leading ]  title (16/600)                                    [ trailing ]  ( ›)
 *                caption (grey; wraps freely when long)
 *                SUBLINE (11/600 uppercase — enclosure etc.)
 * py:4, 0.5px OutlineVariant divider (straight — no radius), hover bg only when clickable.
 *
 * Leading: `icon` → teal chip w/ that icon (default), or `avatar` → the ANTZ logomark avatar.
 * Trailing: TOP-aligned, flush-right, in its own fixed column so a long wrapping caption never
 *   slides under the chip (a gap is always kept). Pass MedTagPill / StatusChip / a date node.
 * `subline`: the small uppercase bottom line (e.g. enclosure). `emphasizeCaption` renders the
 *   caption a bit larger / darker (used where the caption is the condition name).
 */
export const SheetRow: React.FC<{
  title: React.ReactNode
  /** Quiet "×N" repeat marker after the title — rendered only when > 1 (e.g. a condition seen N times). */
  titleCount?: number
  caption?: React.ReactNode
  /** Date or date-range for the row — appended to the caption line after a bullet
   *  ("Symptom • 30 Jun 2026 → 02 Jul 2026"), NOT as a right-side trailing block. */
  when?: string
  /** Duration marker appended after `when` ("… • 2 d"). */
  durationLabel?: string
  subline?: React.ReactNode
  emphasizeCaption?: boolean
  icon?: string
  /** Opt-in smaller icon box (px). Default 40 — dense timeline rows (e.g. dose history) pass 32. */
  iconSize?: number
  avatar?: boolean
  trailing?: React.ReactNode
  chevron?: boolean // show a mdi:chevron-right after the trailing content (navigational rows)
  last?: boolean
  onClick?: () => void
}> = ({
  title,
  titleCount,
  caption,
  when,
  durationLabel,
  subline,
  emphasizeCaption,
  icon = 'mdi:medical-bag',
  iconSize = 40,
  avatar,
  trailing,
  chevron,
  last,
  onClick
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // Fold when/duration into the caption line (bullet-separated) — string captions merge so
  // withBullets renders the dots; node captions get the meta appended after a bullet.
  const metaStr = [when, durationLabel].filter(Boolean).join(' · ')
  if (metaStr) {
    caption =
      caption == null || caption === ''
        ? metaStr
        : typeof caption === 'string'
        ? `${caption} · ${metaStr}`
        : (
            <>
              {caption} • {metaStr}
            </>
          )
  }
  const hasCaption = caption != null && caption !== ''
  const hasSubline = subline != null && subline !== ''
  const multiLine = hasCaption || hasSubline // >1 line → top-align; single line → centre
  const hasTrailing = trailing != null
  const hasChevron = !!chevron && !!onClick

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        // top-align whenever either side can be taller than one line (multi-line text OR a
        // trailing block) so right-side items line up ROW-FOR-ROW with the left text lines;
        // plain single-line rows stay centred
        alignItems: multiLine || hasTrailing ? 'flex-start' : 'center',
        gap: 2,
        py: 5,
        borderBottom: last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        ...(onClick ? { cursor: 'pointer', '&:hover': { backgroundColor: c.Surface } } : {})
      }}
    >
      {avatar ? (
        <Avatar
          src={ANTZ_LOGO}
          alt=''
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            bgcolor: c.Surface,
            // on top-aligned single-line rows, centre the avatar against the 24px title line
            mt: !multiLine && hasTrailing ? '-8px' : 0,
            '& img': { objectFit: 'contain', padding: '5px' }
          }}
        />
      ) : (
        <Box
          sx={{
            width: iconSize,
            height: iconSize,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: c.displaybgPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // on top-aligned single-line rows, centre the icon against the 24px title line
            mt: !multiLine && hasTrailing ? `${(24 - iconSize) / 2}px` : 0
          }}
        >
          <Icon icon={icon} fontSize={iconSize / 2} color={c.OnPrimaryContainer} />
        </Box>
      )}
      {/* Text column is full-width. On MULTI-LINE rows the trailing chip/chevron float in the
          top-right corner (position:absolute) so the caption/subline flow UNDER them. On
          SINGLE-LINE rows the trailing renders IN FLOW (right-side sibling) so a tall trailing
          (e.g. dose total + rate) grows the row instead of crowding the divider. */}
      <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {(hasTrailing || hasChevron) && multiLine && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {hasTrailing && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>{trailing}</Box>
            )}
            {hasChevron && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} style={{ marginTop: 2 }} />}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: c.OnSurfaceVariant,
            // keep the title clear of the corner chip on its line
            pr: (hasTrailing || hasChevron) && multiLine ? 12 : 0
          }}
          noWrap
        >
          {title}
          {titleCount != null && titleCount > 1 && (
            <Box component='span' sx={{ fontSize: '14px', fontWeight: 500, color: c.neutralSecondary, ml: 1.5 }}>
              ×{titleCount}
            </Box>
          )}
        </Typography>
        {hasCaption &&
          (emphasizeCaption ? (
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: c.OnSurfaceVariant, mt: 1 }}>
              {withBullets(caption)}
            </Typography>
          ) : (
            // wraps freely across full width (flows under the corner chip); extra top-gap so a
            // long caption never crowds the title
            <Typography sx={{ fontSize: '16px', color: c.neutralSecondary, mt: 1 }}>{withBullets(caption)}</Typography>
          ))}
        {hasSubline && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.66px',
              color: c.neutralSecondary,
              mt: hasCaption ? '2px' : 1
            }}
            noWrap
          >
            {subline}
          </Typography>
        )}
      </Box>
      {/* single-line rows: trailing + chevron in flow, TOP-aligned — the trailing's first item
          rides the title line, its second lines up with where a caption would sit */}
      {(hasTrailing || hasChevron) && !multiLine && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexShrink: 0 }}>
          {hasTrailing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>{trailing}</Box>
          )}
          {hasChevron && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} style={{ marginTop: 4 }} />}
        </Box>
      )}
    </Box>
  )
}

/**
 * Stats subtitle for side-sheet headers — "LABEL value" pairs in small caps (value bolder),
 * separated by full bullets ("DOSES 7 • ANIMALS 7" — never the tiny middot, user rule).
 * Use ONLY when the subtitle is counts/stats; plain-text subtitles (a site name, a
 * description) stay as the standard grey caption.
 */
export const SheetStats: React.FC<{ items: { label: string; value: number | string }[]; sx?: object }> = ({
  items,
  sx
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography
      noWrap
      sx={{
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.66px',
        color: c.neutralSecondary,
        lineHeight: 1.4,
        ...sx
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && (
            <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 2, verticalAlign: '-1px' }}>
              •
            </Box>
          )}
          {it.label}{' '}
          <Box component='span' sx={{ fontWeight: 800, color: c.OnSurfaceVariant }}>
            {it.value}
          </Box>
        </React.Fragment>
      ))}
    </Typography>
  )
}

/**
 * Standard side-sheet HEADER — leading icon/avatar + title (optional chip beside it) + subtitle
 * + close button. `stats` renders the subtitle via SheetStats; else `subtitle` is plain grey
 * caption. One header for every drawer; never hand-roll again.
 *
 * The bottom divider is decided AUTOMATICALLY by the `Sheet` wrapper — it hides the divider when
 * a SheetSearch / SheetTabs follows (those draw their own boundary). Don't set `divider` by hand
 * unless the header is used outside a `Sheet`.
 */
export const SheetHeader: React.FC<{
  title: React.ReactNode
  subtitle?: React.ReactNode // plain-text subtitle (site name etc.)
  stats?: { label: string; value: number | string }[] // OR a stats subtitle (counts)
  chip?: React.ReactNode // pill/StatusChip shown beside the title
  icon?: string
  iconTone?: { bg: string; fg: string } // override the standard teal icon chip (e.g. severity-toned)
  avatar?: boolean
  leading?: React.ReactNode // fully custom leading node (wins over icon/avatar)
  divider?: boolean // set by the Sheet wrapper; defaults to true when used standalone
  onClose: () => void
}> = ({ title, subtitle, stats, chip, icon, iconTone, avatar, leading, divider = true, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const hasLeading = !!icon || avatar || leading != null

  return (
    <Box sx={{ px: SHEET_PX, py: 3, borderBottom: divider ? `1px solid ${c.SurfaceVariant}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      {leading ? (
        leading
      ) : avatar ? (
        <Avatar
          src={ANTZ_LOGO}
          alt=''
          sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }}
        />
      ) : icon ? (
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: iconTone?.bg ?? c.displaybgPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon icon={icon} fontSize={20} color={iconTone?.fg ?? c.OnPrimaryContainer} />
        </Box>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.4, color: c.OnSurfaceVariant }} noWrap>
            {title}
          </Typography>
          {chip}
        </Box>
        {stats ? (
          <SheetStats items={stats} sx={{ mt: 0.5 }} />
        ) : subtitle != null && subtitle !== '' ? (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', lineHeight: 1.4 }} noWrap>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <IconButton onClick={onClose} size='small' sx={{ flexShrink: 0, mt: hasLeading ? 0 : -0.5 }}>
        <Icon icon='mdi:close' />
      </IconButton>
    </Box>
  )
}
// role tags let the <Sheet> wrapper identify these parts among its children
;(SheetHeader as any).__sheet = 'header'

/** Standard side-sheet SEARCH box (rounded, magnify adornment). */
export const SheetSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  value,
  onChange,
  placeholder = 'Search…'
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ px: SHEET_PX, pt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 4,
          height: skin.CONTROL_H,
          borderRadius: '999px',
          // contextual search rule (fixed at source 2026-09-02): the fill follows the
          // SURFACE — sheet bodies are WHITE, so the search is the grey FIELD_BG
          // borderless pill (white+hairline is only for the mint ground).
          backgroundColor: skin.FIELD_BG
        }}
      >
        <Icon icon='mdi:magnify' fontSize={18} color={skin.FAINT} />
        <Box
          component='input'
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          sx={{
            border: 'none',
            outline: 'none',
            flex: 1,
            fontFamily: 'inherit',
            fontSize: '15px',
            color: c.OnSurfaceVariant,
            backgroundColor: 'transparent',
            '&::placeholder': { color: c.neutralSecondary }
          }}
        />
      </Box>
    </Box>
  )
}
;(SheetSearch as any).__sheet = 'search'

/** Shared dropdown caret (2026-09-01) — every dropdown trigger in iPad 3 wears the same
 *  mdi chevron as the Gender pill. Pass as `IconComponent` on Selects; CategoryFilter
 *  already uses it as `popupIcon`. */
export const SelectChevron: React.FC<any> = props => (
  <Icon {...props} icon='mdi:chevron-down' fontSize='1.25rem' color={skin.INK2} />
)

/**
 * Searchable facet dropdown — MUI Autocomplete with in-menu search (type to filter options).
 * Used for the site/category/enclosure pickers across the detail tabs. `value === null` shows
 * the placeholder (the "All …" state). Nothing bespoke — just the standard picker, tokenised.
 * Trigger wears the Gender-pill grammar (2026-09-01): white pill, hairline, chevron caret.
 */
export const CategoryFilter: React.FC<{
  options: string[]
  value: string | null
  onChange: (v: string | null) => void
  width?: number | string
  height?: number
  placeholder?: string
  icon?: string
  radius?: string
}> = ({ options, value, onChange, width = 210, height = 44, placeholder = 'All categories', radius = '999px' }) => {
  return (
    <Autocomplete
      size='small'
      options={options}
      value={value}
      onChange={(_e, v) => onChange(v)}
      sx={{ width }}
      popupIcon={<Icon icon='mdi:chevron-down' fontSize='1.25rem' color={skin.INK2} />}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={placeholder}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: radius,
            // The Gender-pill clone: ink text (placeholder too — it's a label, not a hint),
            // ink chevron, hairline, hover matches the Button pills. No leading icon.
            '& .MuiInputBase-root': { height, borderRadius: radius, fontSize: '15px', fontWeight: 500, color: skin.INK2 },
            '& .MuiInputBase-input::placeholder': { color: skin.INK2, opacity: 1 },
            '& .MuiAutocomplete-popupIndicator': { color: skin.INK2 },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER_HOVER },
            '&:hover .MuiInputBase-root': { backgroundColor: skin.ROW_HOVER }
          }}
        />
      )}
    />
  )
}

/**
 * Sheet filter bar — one row holding a COLLAPSIBLE search on the left and a facet dropdown on the
 * right. Collapsed: a "🔍 Search" pill on the left, the dropdown filling the rest. Click the pill
 * and the search input EXPANDS as an overlay covering the whole row (dropdown hidden beneath) with
 * a ✕ inside. Clicking away with an empty query — or hitting ✕ — collapses back and clears. A
 * non-empty query keeps it open so the active search stays visible. Pure presentation; the parent
 * owns `search`/`facet` values and does the actual filtering.
 *
 * TWO-FACET mode: pass the optional `facet2*` props (rendered FIRST — e.g. Site before Enclosure)
 * and the search collapses to an icon-only square at the row's end so both dropdowns share the row.
 * The expanded search still overlays everything.
 */
/** THE standard site dropdown (user call 2026-09-02, promoted from Medical's
 *  SiteFilterControl): a Gender-pill trigger that opens a BOTTOM-SHEET picker — searchable
 *  site list, per-site caption (each surface supplies its own count wording), "All Sites"
 *  row, check-circle selected state. Every screen-level site filter in iPad 3 renders
 *  this; sheet-internal facets keep SheetFilterBar. */
export interface SiteFilterOption {
  site: string
  caption?: React.ReactNode
}

export const SiteFilterSelect: React.FC<{
  sites: SiteFilterOption[]
  value?: string | null
  onChange?: (v: string | null) => void
  /** Caption under the "All Sites" row (e.g. "246 animals"). */
  allCaption?: React.ReactNode
  /** Total shown in the sheet header stat (defaults to the option count). */
  sitesTotal?: number
  /** MULTI mode (Ledger, 2026-09-04; STAGED 2026-09-05 user call): site rows toggle a
   *  DRAFT — nothing applies until the footer's Apply; Clear All resets the draft to the
   *  default (All Sites). "All Sites" row stages the empty selection. The trigger reads
   *  the site name (1 picked) or "N Sites". State lives in `multiValue`/`onMultiChange` —
   *  `value`/`onChange` are ignored in this mode. Empty selection = all sites. */
  multiple?: boolean
  multiValue?: string[]
  onMultiChange?: (v: string[]) => void
}> = ({ sites, value, onChange, allCaption, sitesTotal, multiple, multiValue, onMultiChange }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [open, setOpen] = useState(false)
  const [siteQ, setSiteQ] = useState('')

  const sel = multiple ? multiValue ?? [] : []
  const applied = multiple ? sel.length > 0 : value != null
  const triggerLabel = multiple
    ? sel.length === 0
      ? 'All sites'
      : sel.length === 1
      ? sel[0]
      : `${sel.length} Sites`
    : value ?? 'All sites'

  // Multi mode: sites already selected when the sheet OPENS ride to the top, right under
  // "All Sites" (user call 2026-09-04) — snapshotted at open so rows don't reshuffle while
  // toggling mid-visit; a fresh open re-pins the latest selection. Picks stage into a
  // DRAFT (2026-09-05) and commit only on Apply.
  const [pinned, setPinned] = useState<string[]>([])
  const [draft, setDraft] = useState<string[]>([])
  const openSheet = () => {
    setPinned(multiple ? sel : [])
    setDraft(multiple ? [...sel] : [])
    setOpen(true)
  }

  const filtered = siteQ.trim() ? sites.filter(s => s.site.toLowerCase().includes(siteQ.trim().toLowerCase())) : sites
  const ordered =
    multiple && pinned.length
      ? [...filtered].sort((a, b) => (pinned.includes(b.site) ? 1 : 0) - (pinned.includes(a.site) ? 1 : 0))
      : filtered
  const pick = (v: string | null) => {
    onChange?.(v)
    setOpen(false)
    setSiteQ('')
  }
  const toggle = (s: string) => setDraft(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]))

  const row = (opts: { key: string; selected: boolean; onClick: () => void; icon: string; title: string; caption?: React.ReactNode; last: boolean }) => (
    <Box
      key={opts.key}
      onClick={opts.onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 4,
        borderBottom: opts.last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        cursor: 'pointer',
        '&:hover': { backgroundColor: c.Surface }
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '8px',
          backgroundColor: c.displaybgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon icon={opts.icon} fontSize={20} color={c.OnPrimaryContainer} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {opts.title}
        </Typography>
        {opts.caption != null && opts.caption !== '' && (
          <Typography
            sx={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.66px', color: c.neutralSecondary, mt: '2px' }}
            noWrap
          >
            {opts.caption}
          </Typography>
        )}
      </Box>
      {opts.selected ? (
        <Icon icon='mdi:check-circle' fontSize={20} color={theme.palette.primary.dark} />
      ) : (
        <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} />
      )}
    </Box>
  )

  return (
    <>
      {/* Trigger = the Gender-pill dropdown grammar (2026-09-01): ink label + ink chevron
          on a white hairline pill; the applied state wears Gender's green tint. */}
      <Box
        onClick={openSheet}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          height: 44,
          flexShrink: 0,
          borderRadius: '999px',
          border: `1px solid ${applied ? skin.mixOverWhite(skin.LIST_GREEN, 0.28) : skin.DROPDOWN_BORDER}`,
          backgroundColor: applied ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : '#ffffff',
          cursor: 'pointer',
          transition: 'border-color .15s ease, background-color .15s ease',
          '&:hover': {
            borderColor: applied ? skin.mixOverWhite(skin.LIST_GREEN, 0.4) : skin.DROPDOWN_BORDER_HOVER,
            backgroundColor: applied ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER
          }
        }}
      >
        <Typography sx={{ fontSize: '15px', fontWeight: 500, maxWidth: 180, color: applied ? skin.LIST_GREEN : skin.INK2 }} noWrap>
          {triggerLabel}
        </Typography>
        <Icon icon='mdi:chevron-down' fontSize='1.25rem' color={applied ? skin.LIST_GREEN : skin.INK2} />
      </Box>

      <SheetDrawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: sheetPaperSx('md') }}>
        <Sheet>
          <SheetHeader title='Sites' stats={[{ label: 'Sites', value: sitesTotal ?? sites.length }]} onClose={() => setOpen(false)} />
          <SheetSearch value={siteQ} onChange={setSiteQ} placeholder='Search sites…' />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, mt: 1 }}>
            {!siteQ.trim() &&
              row({
                key: '__all',
                selected: multiple ? draft.length === 0 : value == null,
                // multi: All Sites STAGES the default (empty) — Apply commits it
                onClick: () => (multiple ? setDraft([]) : pick(null)),
                icon: 'mdi:map-marker-multiple-outline',
                title: 'All Sites',
                caption: allCaption,
                last: filtered.length === 0
              })}
            {ordered.map((s, i) =>
              row({
                key: s.site,
                selected: multiple ? draft.includes(s.site) : value === s.site,
                // multi: toggle the DRAFT in place, sheet stays open for the next pick
                onClick: () => (multiple ? toggle(s.site) : pick(value === s.site ? null : s.site)),
                icon: 'mdi:map-marker-outline',
                title: s.site,
                caption: s.caption,
                last: i === ordered.length - 1
              })
            )}
            {filtered.length === 0 && siteQ.trim() && (
              <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
                No sites match.
              </Typography>
            )}
          </Box>
          {/* Multi mode footer (2026-09-05) — the CustomFilterDrawer button pair: Clear All
              resets the draft to the DEFAULT (All Sites), only Apply commits + closes. */}
          {multiple && (
            <Box sx={{ display: 'flex', gap: 2, px: SHEET_PX, py: 3, borderTop: `1px solid ${skin.HAIR}`, flexShrink: 0, backgroundColor: '#ffffff' }}>
              <Button
                size='large'
                fullWidth
                color='inherit'
                onClick={() => setDraft([])}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '999px',
                  color: skin.INK2,
                  border: `1px solid ${skin.TRACK}`,
                  ...skin.cardPressSx,
                  '&:hover': { bgcolor: skin.ROW_HOVER }
                }}
              >
                Clear All
              </Button>
              <Button
                size='large'
                fullWidth
                variant='contained'
                disableElevation
                onClick={() => {
                  onMultiChange?.(draft)
                  setOpen(false)
                  setSiteQ('')
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '999px',
                  color: '#ffffff',
                  bgcolor: skin.LIST_GREEN,
                  ...skin.cardPressSx,
                  '&:hover': { bgcolor: skin.ACCENT_INK, color: '#ffffff' }
                }}
              >
                Apply
              </Button>
            </Box>
          )}
        </Sheet>
      </SheetDrawer>
    </>
  )
}

/* ── table settings sheet (demo-review HARD RULE 2026-09-04; railed rework 2026-09-05
   user calls) ─────────────────────────────────────────────────────────────────
   Every table offers a Settings control, in the FILTER SHEET's anatomy (left menu
   rail + right panel + staged draft + footer). Rail sections:
   · "Selected Columns" — the table's columns in ORDER; checkbox stages removal IN
     PLACE (greyed, undoable until Apply); the mdi:drag grip reorders — order changes
     ONLY here, never by dragging table headers (glass scroll conflict).
   · "Add Columns" — searchable master list, tap to add (lands at the END).
   · "Card Identity" (optional) — the card shows EXACTLY two identity lines: the user
     picks PRIMARY and SECONDARY from ALL identifier types (never the same twice);
     an animal missing the chosen type falls back per animal.
   Footer = Reset Default | Apply. Persistence is the CALLER's job. */

export interface ColumnPref {
  key: string
  on: boolean
}

export interface CardIdentityValue {
  primary: string
  secondary: string
}

const COL_ROW_H = 56

export const ColumnSettingsSheet: React.FC<{
  open: boolean
  onClose: () => void
  title?: string
  /** Label for every column key that can appear. */
  labels: Record<string, string>
  /** Applied ordered prefs — the sheet stages a draft and commits on Apply. */
  value: ColumnPref[]
  defaults: ColumnPref[]
  /** Optional Card Identity section — ALL identifier types, user picks primary + secondary. */
  identityOptions?: { value: string; label: string }[]
  identity?: CardIdentityValue
  identityDefaults?: CardIdentityValue
  /** What the rows ARE — rail sections read "Selected {noun}" / "Add {noun}" (default Columns;
   *  Assessments passes its own noun). */
  noun?: string
  onApply: (cols: ColumnPref[], identity?: CardIdentityValue) => void
}> = ({ open, onClose, title = 'Table Settings', labels, value, defaults, identityOptions, identity, identityDefaults, noun = 'Columns', onApply }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  const [section, setSection] = useState<'cols' | 'add' | 'identity'>('cols')
  const [order, setOrder] = useState<string[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [prim, setPrim] = useState('')
  const [sec, setSec] = useState('')
  const orderRef = useRef<string[]>([])
  const setOrderSynced = (next: string[]) => {
    orderRef.current = next
    setOrder(next)
  }

  useEffect(() => {
    if (open) {
      const on = value.filter(p => p.on).map(p => p.key)
      setOrderSynced(on)
      setChecked(new Set(on))
      setSection('cols')
      setQ('')
      setPrim(identity?.primary || '')
      setSec(identity?.secondary || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggle = (key: string) =>
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)

      return next
    })

  const add = (key: string) => {
    setOrderSynced([...orderRef.current, key])
    setChecked(prev => new Set(prev).add(key))
  }

  /* drag-to-reorder — the HANDLE owns the gesture (touchAction none + pointer capture),
     so scrolling the panel never reorders; fixed-height rows make the math exact. */
  const [dragKey, setDragKey] = useState<string | null>(null)
  const dragAnchor = useRef(0)
  const startDrag = (key: string) => (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragAnchor.current = e.clientY
    setDragKey(key)
  }
  const moveDrag = (key: string) => (e: React.PointerEvent) => {
    if (dragKey !== key) return
    const cur = orderRef.current
    const i = cur.indexOf(key)
    const steps = Math.round((e.clientY - dragAnchor.current) / COL_ROW_H)
    const j = Math.max(0, Math.min(cur.length - 1, i + steps))
    if (i < 0 || j === i) return
    dragAnchor.current += (j - i) * COL_ROW_H
    const next = [...cur]
    next.splice(i, 1)
    next.splice(j, 0, key)
    setOrderSynced(next)
  }
  const endDrag = () => setDragKey(null)

  const applyDraft = () => {
    const kept = order.filter(k => checked.has(k))
    onApply(
      [
        ...kept.map(k => ({ key: k, on: true })),
        ...Object.keys(labels)
          .filter(k => !kept.includes(k))
          .map(k => ({ key: k, on: false }))
      ],
      identityOptions ? { primary: prim, secondary: sec } : undefined
    )
    onClose()
  }

  const resetDraft = () => {
    const on = defaults.filter(d => d.on).map(d => d.key)
    setOrderSynced(on)
    setChecked(new Set(on))
    if (identityDefaults) {
      setPrim(identityDefaults.primary)
      setSec(identityDefaults.secondary)
    }
  }

  const needle = q.trim().toLowerCase()
  const addable = Object.keys(labels)
    .filter(k => !order.includes(k))
    .filter(k => !needle || (labels[k] ?? k).toLowerCase().includes(needle))
    .sort((a, b) => (labels[a] ?? a).localeCompare(labels[b] ?? b))

  const railItems: { key: 'cols' | 'add' | 'identity'; label: string; badge?: number }[] = [
    { key: 'cols', label: `Selected ${noun}`, badge: checked.size },
    { key: 'add', label: `Add ${noun}` },
    ...(identityOptions ? ([{ key: 'identity', label: 'Card Identity' }] as { key: 'identity'; label: string }[]) : [])
  ]

  /* ONE list, pick exactly TWO (user call 2026-09-05 — two slot-lists was too much):
     first pick = primary, second = secondary; the secondary row offers "Make Primary"
     to swap; unchecking the primary promotes the remaining one; a third pick is locked. */
  const toggleIdent = (v: string) => {
    if (v === prim) {
      setPrim(sec)
      setSec('')
    } else if (v === sec) {
      setSec('')
    } else if (!prim) {
      setPrim(v)
    } else if (!sec) {
      setSec(v)
    }
    // two already picked → locked (rows render disabled)
  }
  const identityList = (
    <>
      <Typography sx={{ pb: 2, fontSize: '14px', color: c.neutralSecondary }}>
        Pick two — the card shows the primary on top, the secondary under it.
      </Typography>
      {(identityOptions || []).map(o => {
        const isPrim = o.value === prim
        const isSec = o.value === sec
        const on = isPrim || isSec
        const locked = !on && !!prim && !!sec

        return (
          <Box
            key={o.value}
            onClick={() => !locked && toggleIdent(o.value)}
            sx={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: '10px',
              opacity: locked ? 0.35 : 1,
              cursor: locked ? 'default' : 'pointer',
              '&:hover': locked ? {} : { backgroundColor: c.Surface }
            }}
          >
            <Checkbox
              checked={on}
              disabled={locked}
              onChange={() => !locked && toggleIdent(o.value)}
              onClick={e => e.stopPropagation()}
              sx={{ color: skin.DASH_INK, '&.Mui-checked': { color: skin.LIST_GREEN } }}
            />
            <Typography variant='body1' sx={{ flex: 1, minWidth: 0, color: c.OnSurfaceVariant, fontWeight: on ? 600 : 400 }} noWrap>
              {o.label}
            </Typography>
            {isPrim && (
              <Box
                component='span'
                sx={{
                  px: 2.5,
                  height: 26,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  bgcolor: skin.LIST_GREEN,
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                Primary
              </Box>
            )}
            {isSec && (
              <Box
                component='span'
                onClick={e => {
                  e.stopPropagation()
                  // swap — the secondary takes the lead
                  setSec(prim)
                  setPrim(o.value)
                }}
                sx={{
                  px: 2.5,
                  height: 26,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: `1px solid ${skin.TRACK}`,
                  color: skin.INK2,
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: skin.ROW_HOVER }
                }}
              >
                Make Primary
              </Box>
            )}
          </Box>
        )
      })}
    </>
  )

  return (
    <SheetDrawer
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 560 }, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }
        }
      }}
    >
      {/* Header — the filter sheet's anatomy (icon + title + close) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 3 }}>
          <Icon icon='mdi:cog-outline' fontSize={26} color={skin.LIST_GREEN} />
          <Typography sx={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.3px', color: skin.INK }}>{title}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      {/* Body — left menu rail + panel */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', px: 5, minHeight: 0 }}>
        <Box sx={{ width: 200, flexShrink: 0, overflowY: 'auto' }}>
          {railItems.map(r => {
            const on = section === r.key

            return (
              <Box
                key={r.key}
                onClick={() => {
                  setSection(r.key)
                  setQ('')
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 3,
                  mb: 0.5,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : 'transparent',
                  '&:hover': { backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER }
                }}
              >
                <Typography sx={{ fontSize: '16px', fontWeight: on ? 600 : 400, color: on ? skin.LIST_GREEN : skin.INK2 }}>
                  {r.label}
                </Typography>
                {r.badge != null && r.badge > 0 && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      px: 1,
                      borderRadius: '999px',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      bgcolor: skin.LIST_GREEN,
                      color: '#ffffff'
                    }}
                  >
                    {r.badge}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        <Box sx={{ borderLeft: `1px solid ${skin.HAIR}`, pl: 5, pr: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {section === 'add' && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, px: 4, height: skin.CONTROL_H, flexShrink: 0, borderRadius: '999px', backgroundColor: skin.FIELD_BG }}>
              <Icon icon='mdi:magnify' fontSize={18} color={skin.FAINT} />
              <Box
                component='input'
                value={q}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                placeholder='Search columns…'
                sx={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontFamily: 'inherit',
                  fontSize: '15px',
                  color: c.OnSurfaceVariant,
                  backgroundColor: 'transparent',
                  '&::placeholder': { color: c.neutralSecondary }
                }}
              />
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', pb: 3 }}>
            {section === 'cols' && (
              <>
                {order.map((key, i) => {
                  const on = checked.has(key)
                  const dragging = dragKey === key

                  return (
                    <Box
                      key={key}
                      onClick={() => toggle(key)}
                      sx={{
                        height: COL_ROW_H,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderBottom: i === order.length - 1 ? 'none' : `0.5px solid ${c.OutlineVariant}`,
                        cursor: 'pointer',
                        borderRadius: '10px',
                        backgroundColor: dragging ? c.Surface : 'transparent',
                        boxShadow: dragging ? skin.SHADOW_MODAL : 'none',
                        position: 'relative',
                        zIndex: dragging ? 1 : 0,
                        '&:hover': { backgroundColor: c.Surface }
                      }}
                    >
                      <Checkbox
                        checked={on}
                        onChange={() => toggle(key)}
                        onClick={e => e.stopPropagation()}
                        sx={{ color: skin.DASH_INK, '&.Mui-checked': { color: skin.LIST_GREEN } }}
                      />
                      <Typography
                        variant='body1'
                        sx={{ flex: 1, minWidth: 0, color: on ? c.OnSurfaceVariant : c.neutralSecondary, fontWeight: on ? 600 : 400 }}
                        noWrap
                      >
                        {labels[key] ?? key}
                      </Typography>
                      {/* the drag grip — order only, never removal */}
                      <Box
                        aria-label='Reorder'
                        onClick={e => e.stopPropagation()}
                        onPointerDown={startDrag(key)}
                        onPointerMove={moveDrag(key)}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        sx={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          display: 'grid',
                          placeItems: 'center',
                          touchAction: 'none',
                          cursor: dragging ? 'grabbing' : 'grab',
                          color: c.Outline,
                          '&:hover': { color: c.OnSurfaceVariant }
                        }}
                      >
                        <Icon icon='mdi:drag' fontSize={22} />
                      </Box>
                    </Box>
                  )
                })}
                {order.length === 0 && <SheetEmpty>No columns selected — add them from Add Columns.</SheetEmpty>}
              </>
            )}

            {section === 'add' && (
              <>
                {addable.map((key, i) => (
                  <Box
                    key={key}
                    onClick={() => add(key)}
                    sx={{
                      height: COL_ROW_H,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderBottom: i === addable.length - 1 ? 'none' : `0.5px solid ${c.OutlineVariant}`,
                      cursor: 'pointer',
                      borderRadius: '10px',
                      px: 1,
                      '&:hover': { backgroundColor: c.Surface }
                    }}
                  >
                    <Icon icon='mdi:plus-circle-outline' fontSize={22} color={skin.LIST_GREEN} />
                    <Typography variant='body1' sx={{ flex: 1, minWidth: 0, color: c.OnSurfaceVariant }} noWrap>
                      {labels[key] ?? key}
                    </Typography>
                  </Box>
                ))}
                {addable.length === 0 && <SheetEmpty>{needle ? 'No columns match.' : 'All columns are on the table.'}</SheetEmpty>}
              </>
            )}

            {section === 'identity' && identityOptions && identityList}
          </Box>
        </Box>
      </Box>

      {/* Footer — the standard staged pair */}
      <Box sx={{ display: 'flex', gap: 2, px: 4, py: 4, borderTop: `1px solid ${skin.HAIR}`, flexShrink: 0, backgroundColor: '#ffffff' }}>
        <Button
          size='large'
          fullWidth
          color='inherit'
          onClick={resetDraft}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '999px',
            color: skin.INK2,
            border: `1px solid ${skin.TRACK}`,
            ...skin.cardPressSx,
            '&:hover': { bgcolor: skin.ROW_HOVER }
          }}
        >
          Reset Default
        </Button>
        <Button
          size='large'
          fullWidth
          variant='contained'
          disableElevation
          onClick={applyDraft}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '999px',
            color: '#ffffff',
            bgcolor: skin.LIST_GREEN,
            ...skin.cardPressSx,
            '&:hover': { bgcolor: skin.ACCENT_INK, color: '#ffffff' }
          }}
        >
          Apply
        </Button>
      </Box>
    </SheetDrawer>
  )
}

/** Collapsible card-header search (user calls 2026-09-02): rests as a COMPACT pill the
 *  same width as the dropdowns beside it (never a bare icon), sits FIRST in its controls
 *  row; on tap it expands to cover the WHOLE row (the row must be position:relative), and
 *  collapses back when the user leaves it — a live query stays visible, truncated, in the
 *  compact pill so an active filter is never hidden. In-card grammar: FIELD_BG borderless. */
export const CollapsibleSearch: React.FC<{
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Resting pill width — match the neighbouring dropdown (CategoryFilter default 210). */
  collapsedWidth?: number
  /** Elastic mode (user call 2026-09-02): the resting pill FILLS the row's spare width —
   *  dropdowns keep their content size and the search absorbs/yields the remainder. */
  grow?: boolean
  /** Fill follows the SURFACE BEHIND the search (the fixed contextual rule): default =
   *  FIELD_BG grey borderless for WHITE surfaces (cards, white sheet bodies); 'ground' =
   *  white + hairline for the mint/sage ground (page ground, sage drill sheets). */
  variant?: 'card' | 'ground'
}> = ({ value, onChange, placeholder = 'Search…', collapsedWidth = 210, grow = false, variant = 'card' }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fillSx =
    variant === 'ground'
      ? { backgroundColor: skin.SEARCH_BG, border: `1px solid ${skin.HAIR}` }
      : { backgroundColor: skin.FIELD_BG }

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // leaving the search collapses it — the query itself survives in the compact pill
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)

    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <>
      {/* resting pill — dropdown-sized, keeps the row's rhythm */}
      <Box
        onClick={() => setOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: 44,
          ...(grow ? { flex: '1 1 auto', minWidth: 160 } : { width: collapsedWidth }),
          maxWidth: '100%',
          px: 3,
          borderRadius: '999px',
          ...fillSx,
          cursor: 'pointer',
          flexShrink: 0,
          visibility: open ? 'hidden' : 'visible'
        }}
      >
        <Icon icon='mdi:magnify' fontSize={20} color={skin.FAINT} style={{ flexShrink: 0 }} />
        <Typography sx={{ fontSize: '15px', color: value ? c.OnSurfaceVariant : c.neutralSecondary, minWidth: 0 }} noWrap>
          {value || placeholder}
        </Typography>
        {value && (
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onChange('')
            }}
            sx={{ ml: 'auto', color: c.Outline, p: 0.25 }}
          >
            <Icon icon='mdi:close' fontSize={16} />
          </IconButton>
        )}
      </Box>

      {/* expanded — covers the WHOLE controls row (row provides position:relative) */}
      {open && (
        <Box
          ref={wrapRef}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 3,
            borderRadius: '999px',
            ...fillSx,
            '&:focus-within': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
          }}
        >
          <Icon icon='mdi:magnify' fontSize={20} color={skin.FAINT} style={{ flexShrink: 0 }} />
          <Box
            component='input'
            ref={inputRef}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={placeholder}
            sx={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 0,
              fontFamily: 'inherit',
              fontSize: '15px',
              color: c.OnSurfaceVariant,
              backgroundColor: 'transparent',
              '&::placeholder': { color: c.neutralSecondary }
            }}
          />
          <IconButton
            size='small'
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            sx={{ color: c.Outline }}
          >
            <Icon icon='mdi:close' fontSize={18} />
          </IconButton>
        </Box>
      )}
    </>
  )
}

export const SheetFilterBar: React.FC<{
  search: string
  onSearch: (v: string) => void
  searchPlaceholder?: string
  facetOptions: string[]
  facetValue: string | null
  onFacet: (v: string | null) => void
  facetPlaceholder?: string
  facetIcon?: string
  /** Optional second facet, shown before the primary one (e.g. Site, then Enclosure). */
  facet2Options?: string[]
  facet2Value?: string | null
  onFacet2?: (v: string | null) => void
  facet2Placeholder?: string
  facet2Icon?: string
}> = ({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  facetOptions,
  facetValue,
  onFacet,
  facetPlaceholder = 'All',
  facetIcon = 'mdi:shape-outline',
  facet2Options,
  facet2Value = null,
  onFacet2,
  facet2Placeholder = 'All',
  facet2Icon = 'mdi:map-marker-outline'
}) => {
  const twoFacets = !!facet2Options && !!onFacet2

  return (
    // ONE row, the Hospital-table grammar (user call 2026-09-02): the ELASTIC search pill
    // leads and fills the spare width; the facet dropdowns sit content-sized on the right.
    // Tapping the search expands it over the whole row (hence position:relative).
    <Box sx={{ px: SHEET_PX, pt: 2 }}>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Sheet bodies are WHITE (background.paper) → the on-white search grammar applies:
            the quiet FIELD_BG grey pill, borderless — same as the card tables. */}
        <CollapsibleSearch value={search} onChange={onSearch} placeholder={searchPlaceholder} grow />
        {twoFacets && (
          <CategoryFilter
            options={facet2Options!}
            value={facet2Value}
            onChange={onFacet2!}
            icon={facet2Icon}
            placeholder={facet2Placeholder}
          />
        )}
        <CategoryFilter options={facetOptions} value={facetValue} onChange={onFacet} icon={facetIcon} placeholder={facetPlaceholder} />
      </Box>
    </Box>
  )
}

/**
 * A titled SECTION inside a sheet — a small heading (optional chip beside it) with its rows
 * beneath. Use to group rows by site/category; stack several in one scroll area.
 */
export const SheetSection: React.FC<{
  /** Omit for a label-less section (rare — e.g. content that explains itself, like a legend-led list). */
  label?: React.ReactNode
  chip?: React.ReactNode
  first?: boolean
  noDivider?: boolean // suppress the section-end divider (rare — e.g. the only section in a sheet)
  children: React.ReactNode
}> = ({ label, chip, first, noDivider, children }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ mt: first ? 3 : 4 }}>
      {(label || chip) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
            {label}
          </Typography>
          {chip}
        </Box>
      )}
      {children}
      {/* full-width edge-to-edge divider closes the section (rows own thin inset dividers between
          themselves; this heavier one reads the whole group as one block, like the header rule).
          mx:-SHEET_PX cancels the sheet body's px:SHEET_PX so it spans the full width. */}
      {!noDivider && <Box sx={{ borderBottom: `1px solid ${c.SurfaceVariant}`, mx: -SHEET_PX, mt: 4 }} />}
    </Box>
  )
}

/**
 * In-sheet status/filter tab row (underline style, sits under the header). Generic over a key
 * string; each tab shows a label. Use for All / Covered / Not-covered style filters in a sheet.
 */
export function SheetTabs<K extends string>({
  tabs,
  value,
  onPick
}: {
  tabs: { key: K; label: React.ReactNode }[]
  value: K
  onPick: (k: K) => void
}) {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ px: SHEET_PX, pt: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', borderBottom: `1px solid ${c.SurfaceVariant}` }}>
      {tabs.map(t => {
        const active = value === t.key

        return (
          <Box
            key={t.key}
            onClick={() => onPick(t.key)}
            role='tab'
            aria-selected={active}
            sx={{
              pb: 1.5,
              borderBottom: '2.5px solid',
              borderColor: active ? theme.palette.primary.main : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: active ? theme.palette.primary.main : c.OutlineVariant }
            }}
          >
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, color: active ? theme.palette.primary.main : c.neutralSecondary, whiteSpace: 'nowrap' }}
            >
              {t.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
;(SheetTabs as any).__sheet = 'tabs'

/**
 * Sheet BODY WRAPPER — put the whole drawer content inside this. It owns the one piece of logic a
 * header can't decide alone: whether the header shows its bottom divider. If a SheetSearch or
 * SheetTabs immediately follows the SheetHeader, they already draw their own boundary, so the
 * header divider is dropped automatically. Callers never set the divider by hand.
 *
 *   <Sheet><SheetHeader …/><SheetSearch …/> …rows… </Sheet>
 */
export const Sheet: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => {
  const kids = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[]
  const headerIdx = kids.findIndex(k => (k.type as any)?.__sheet === 'header')

  const patched = kids.map((k, i) => {
    if (i !== headerIdx) return k
    const next = kids[i + 1]
    const nextRole = next ? (next.type as any)?.__sheet : undefined
    const followedByOwnBoundary = nextRole === 'search' || nextRole === 'tabs'

    // only override when the caller hasn't set divider explicitly
    return k.props.divider === undefined ? React.cloneElement(k, { divider: !followedByOwnBoundary }) : k
  })

  return <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>{patched}</Box>
}

/** Centered empty-state line for a sheet body. */
export const SheetEmpty: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
      {children}
    </Typography>
  )
}

/** One row of a ListSheet. `isAnimal` rows render in the project's sheet animal-list style
 *  (the Vaccination pattern): ANTZ avatar • name • context caption • trailing • chevron.
 *  Non-animal rows (months, reasons, records) get an icon chip instead. */
export type ListRow = {
  key: string
  isAnimal?: boolean
  title: string
  caption?: string
  subline?: string
  trailing?: React.ReactNode
  onOpen?: () => void
  /** Animal-card upgrade (2026-09-02): when an animal row carries `aid`, ListSheet renders
   *  the standard AnimalCardRow instead of the avatar SheetRow — caption/subline become the
   *  right-aligned meta lines. `tag` overrides the synth gender badge (e.g. 'mortality' on
   *  death lists); `enclosure`/`site` override synth with real data (site only when the
   *  list spans >1 site — the card's hard rule). Rows WITHOUT aid (group/unnamed events)
   *  keep the classic avatar row. */
  aid?: string
  enclosure?: string
  site?: string
  tag?: AnimalTagKind
  /** REAL identifiers override — same contract as AnimalCardRow's. */
  identifiers?: AnimalCardId[]
  titleExtra?: React.ReactNode
  /** Real display name — renders only when AID is the sole identifier (card's hard rule). */
  name?: string
}

export type SheetView = {
  title: string
  icon: string
  stats?: { label: string; value: number | string }[]
  tabs?: { key: string; label: React.ReactNode }[]
  tab?: string
  onTab?: (k: string) => void
  rowIcon?: string
  rows: ListRow[]
}

/** THE generic list side sheet (promoted from EggsTab 2026-08-07): standard header
 *  (+ optional tabs) over a SheetRow list. Use this for every "chart datapoint → list"
 *  drill; never hand-roll a list drawer again. */
export const ListSheet: React.FC<{ view: SheetView | null; onClose: () => void }> = ({ view, onClose }) => (
  <SheetDrawer open={!!view} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
    {view && (
      <Sheet>
        <SheetHeader icon={view.icon} title={view.title} stats={view.stats} onClose={onClose} />
        {view.tabs && view.tab && view.onTab && <SheetTabs tabs={view.tabs} value={view.tab} onPick={view.onTab} />}
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {view.rows.length ? (
            view.rows.map((r, i) =>
              r.isAnimal && r.aid ? (
                <AnimalCardRow
                  key={r.key}
                  aid={r.aid}
                  enclosure={r.enclosure}
                  site={r.site}
                  tag={r.tag}
                  identifiers={r.identifiers}
                  titleExtra={r.titleExtra}
                  // animal ListRows carry the display name as `title` — same hard rule applies
                  name={r.name ?? r.title}
                  // HARD RULE (user, 2026-09-02): card LIST rows show ONE item per right-side
                  // row — bullet-joined caption strings are split into stacked lines (first
                  // line strong). Tables are exempt (columns are their finalized grammar).
                  meta={
                    <>
                      {[...(r.caption ? r.caption.split(' • ') : []), ...(r.subline ? r.subline.split(' • ') : [])].map((line, li) => (
                        <RowMetaText key={li} strong={li === 0} wrap>
                          {line}
                        </RowMetaText>
                      ))}
                    </>
                  }
                  last={i === view.rows.length - 1}
                  trailing={r.trailing}
                  onClick={r.onOpen}
                  chevron={!!r.onOpen}
                />
              ) : (
                <SheetRow
                  key={r.key}
                  {...(r.isAnimal ? { avatar: true } : { icon: view.rowIcon ?? 'mdi:egg-outline' })}
                  title={r.title}
                  caption={r.caption}
                  subline={r.subline}
                  last={i === view.rows.length - 1}
                  trailing={r.trailing}
                  onClick={r.onOpen}
                  chevron={!!r.onOpen}
                />
              )
            )
          ) : (
            <EmptyState message='Nothing to list here.' />
          )}
        </Box>
      </Sheet>
    )}
  </SheetDrawer>
)

export const SectionCard: React.FC<{
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  sx?: object
  titleMb?: number
  /** When set, the whole card becomes clickable (pointer + subtle lift on hover). */
  onClick?: () => void
}> = ({ title, action, children, sx, titleMb = 3, onClick }) => {
  // CC skin: white on the sage ground, hairline border, 16px radius, NO shadow —
  // pressables get the card-press scale instead of a hover lift.
  return (
    <Box
      onClick={onClick}
      sx={{
        ...skin.cardSx,
        p: 4,
        // Grid/flex items default to min-width:auto — a wide chart body (BarColumns
        // minSlot) would grow the card past its track instead of scrolling inside it.
        minWidth: 0,
        ...(onClick && { cursor: 'pointer', ...skin.cardPressSx, '&:hover': { backgroundColor: '#fcfcfb' } }),
        ...sx
      }}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: titleMb }}>
          {typeof title === 'string' ? (
            <Typography variant='subtitle1' sx={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.2px', color: skin.INK }}>
              {title}
            </Typography>
          ) : (
            title
          )}
          {action}
        </Box>
      )}
      {children}
    </Box>
  )
}

/** A single label → value pair (used heavily across Profile / detail sections). */
export const LabelValue: React.FC<{ label: string; value?: React.ReactNode; icon?: string }> = ({
  label,
  value,
  icon
}) => {
  const theme = useTheme() as any
  if (value === undefined || value === null || value === '' || value === '-') return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && <Icon icon={icon} fontSize={16} color={cc(theme).Outline} />}
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant='body1' sx={{ color: cc(theme).OnSurfaceVariant }}>
        {value}
      </Typography>
    </Box>
  )
}

/** Big metric tile (overview cards). */
export const StatTile: React.FC<{
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  onClick?: () => void
  /** Soft mode (eggs outcome tiles, 2026-08-07): whisper tint of the tone across the tile,
      the icon in a stronger tinted chip carries the color, value stays ink. Requires `icon`. */
  icon?: string
  soft?: boolean
  /** Soft mode only: override the tone-derived hue with a style-guide hex (tile tint + chip
      derive from it; the icon uses `colorDeep`, defaulting to this). */
  color?: string
  colorDeep?: string
  /** Soft mode only: exact style-guide background token for the tile (skips the alpha-tint
      derivation — needed when the hue is too light for `${color}14` to stay visible). */
  colorBg?: string
}> = ({ label, value, sub, tone = 'neutral', onClick, icon, soft, color, colorDeep, colorBg }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)

  if (soft && icon) {
    // strong/deep pair — explicit style-guide `color` wins; else derived from the tone
    const strong =
      color ??
      (tone === 'success' ? theme.palette.primary.main : tone === 'caution' ? cc(theme).moderateSecondary : cc(theme).Tertiary)
    const deep = colorDeep ?? (color ? color : tone === 'success' ? theme.palette.primary.dark : strong)

    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          p: '20px 22px',
          borderRadius: '10px',
          backgroundColor: colorBg ?? `${strong}14`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'filter .15s ease',
          // darken, not brighten — pale tints, brightening reads as nothing
          '&:hover': onClick ? { filter: 'brightness(0.97)' } : undefined
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            backgroundColor: `${strong}29`
          }}
        >
          <Icon icon={icon} fontSize={24} color={deep} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: skin.FAINT }}
          >
            {label}
          </Typography>
          <Typography
            sx={{ mt: 0.5, fontSize: '25px', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: skin.VALUE, whiteSpace: 'nowrap' }}
          >
            {value}
          </Typography>
          {sub != null && (
            <Typography sx={{ fontSize: 15, color: skin.FAINT, mt: 0.5 }} noWrap>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 3,
        minWidth: 130,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease',
        '&:hover': onClick ? { boxShadow: 2 } : undefined
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: cc(theme).neutralSecondary
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '30px',
          fontWeight: 800,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          color: tone === 'neutral' ? cc(theme).OnSurface : fg,
          mt: 1,
          whiteSpace: 'nowrap'
        }}
      >
        {value}
      </Typography>
      {sub != null && (
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

/** Status / category chip in a semantic tone. */
export const StatusChip: React.FC<{
  label: React.ReactNode
  tone?: Tone
  fg?: string
  /** Optional wash override — e.g. a paler mix when the tone's standard soft reads too loud. */
  bg?: string
  size?: 'small' | 'medium'
}> = ({ label, tone = 'neutral', fg: fgOverride, bg: bgOverride, size = 'small' }) => {
  const tones = useTone()
  const { bg: toneBg, fg } = tones(tone)
  const bg = bgOverride ?? toneBg

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: size === 'medium' ? 2.5 : 1.5,
        py: size === 'medium' ? 1 : 0.5,
        borderRadius: size === 'medium' ? '8px' : '6px',
        backgroundColor: bg
      }}
    >
      <Typography variant={size === 'medium' ? 'body2' : 'caption'} sx={{ fontWeight: 600, color: fgOverride || fg }}>
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Standard animal-card list for side sheets — one AnimalCard per row, with a hairline divider
 * and breathing space between each. Use this EVERYWHERE an animal-card list appears in a sheet
 * (Housing / Pairing / Assessments …) so the styling stays consistent. Pass pre-mapped card data.
 */
export const AnimalCardList: React.FC<{ cards: any[]; onClick?: (index: number) => void }> = ({ cards, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {cards.map((data, i) => (
        <Box
          key={i}
          onClick={onClick ? () => onClick(i) : undefined}
          sx={{
            py: 2.5,
            borderBottom: i < cards.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none',
            ...(onClick ? { cursor: 'pointer', transition: '0.15s', '&:hover': { bgcolor: c.Surface } } : {})
          }}
        >
          <AnimalCard data={data} />
        </Box>
      ))}
    </Box>
  )
}

/**
 * Standard data-table styling for the detail tabs — tall rows (so every table matches), aligned
 * L/R padding (header lines up with cells), and a slightly larger header. Use this as the
 * `externalTableStyle` on every CommonTable in the module; spread it and add table-specific rules.
 */
/** Uniform row height for every detail data table (use DetailTable below). */
export const DETAIL_TABLE_ROW_H = 72 // raised with the 16px cell standard — 64 was cramped

/**
 * THE single padding source for every v2 DataGrid. Spread into BOTH the `.MuiDataGrid-cell`
 * AND `.MuiDataGrid-columnHeader` rules of any table style. The antz theme pads cells and
 * headers through different nested selectors, so a table that overrides one side alone gets
 * values misaligned from their column titles. Never hand-write grid paddings again.
 */
export const GRID_CELL_PAD = { paddingLeft: '20px !important', paddingRight: '16px !important' }

/**
 * The standard data table for the detail module. Wraps CommonTable with consistent tall rows,
 * aligned padding and header. USE THIS for every table here (and any new one) so they all match.
 * Pass already-indexed rows (each with `id` + `sl_no`).
 */
export const DetailTable: React.FC<{
  columns: GridColDef[]
  rows: any[]
  total: number
  /** Omit both pagination props (and pass `hideFooter`) for a short static table — e.g. a
   *  capped card table with its own "View all" toggle. */
  paginationModel?: { page: number; pageSize: number }
  setPaginationModel?: (m: any) => void
  /** Drop the "Rows per page / 1–N of N" footer entirely (short card tables). */
  hideFooter?: boolean
  onRowClick?: (params: any) => void
  rowHeight?: number
  /** Enable header sorting: pass a controlled sort model + change handler. Omit for a static table. */
  sortModel?: { field: string; sort: 'asc' | 'desc' | null | undefined }[]
  handleSortModel?: (model: any) => void
  /** Pin this column to the left while the rest scrolls horizontally (species-list pattern). */
  stickyField?: string
  /** Pin SEVERAL leading columns (in column order) while the rest scrolls — offsets are
   *  computed from the columns' width/minWidth. HARD RULE (user, 2026-09-02): any table
   *  that can scroll horizontally pins its No + Animal/identity columns this way. */
  stickyFields?: string[]
  /** NAVEEN'S RULE: a table never stands on the sage — pass `framed` when the table sits
   *  directly on the page/sheet ground so it gets its own white surface. Tables already
   *  inside a white card stay frameless (a frame-in-frame reads boxed). */
  framed?: boolean
}> = ({
  columns,
  rows,
  total,
  paginationModel = { page: 0, pageSize: 100 },
  setPaginationModel = () => {},
  hideFooter = false,
  onRowClick,
  rowHeight = DETAIL_TABLE_ROW_H,
  sortModel,
  handleSortModel,
  stickyField,
  stickyFields,
  framed = false
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // Pinned-left columns: the multi-column `stickyFields` (legacy single `stickyField`
  // folds into the same path). Left offsets accumulate the pinned columns' declared
  // width/minWidth in COLUMN order; only the last pinned column wears the hairline.
  const pinFields = stickyFields?.length ? stickyFields : stickyField ? [stickyField] : []
  // NO serial numbers — demo-review HARD rule 2026-09-04, enforced at the COMPONENT so
  // it can never quietly return: any 'sl_no' column a caller still passes is dropped
  // (before pinning, so sticky offsets never count a dropped column).
  const noSerials = columns.filter(c => c.field !== 'sl_no')

  const pinned = pinFields.length ? noSerials.filter(col => pinFields.includes(col.field)) : []

  // Scrolled-under cue: once the table is horizontally scrolled, columns slide BENEATH
  // the pinned ones. ONE continuous gradient strip is overlaid along the pinned edge
  // (headers + all rows as a single piece) — never per-cell boxShadow, which reads as a
  // shadow on every row separately. Position is MEASURED from the last pinned header
  // cell so flex-width identity columns stay accurate.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [shadowRect, setShadowRect] = useState<{ left: number; top: number; height: number } | null>(null)
  useEffect(() => {
    if (!pinned.length) return
    const wrap = wrapRef.current
    const scroller = wrap?.querySelector('.MuiDataGrid-virtualScroller')
    const main = wrap?.querySelector('.MuiDataGrid-main')
    const lastField = pinned[pinned.length - 1].field
    if (!wrap || !scroller || !main) return
    const measure = () => {
      if ((scroller as HTMLElement).scrollLeft > 0) {
        const cell = wrap.querySelector(`.MuiDataGrid-columnHeader[data-field="${lastField}"]`)
        const wr = wrap.getBoundingClientRect()
        const mr = main.getBoundingClientRect()
        const cr = cell?.getBoundingClientRect()
        setShadowRect(cr ? { left: cr.right - wr.left, top: mr.top - wr.top, height: mr.height } : null)
      } else {
        setShadowRect(null)
      }
    }
    measure()
    scroller.addEventListener('scroll', measure, { passive: true })

    return () => scroller.removeEventListener('scroll', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned.length, rows])

  const stickyStyle: Record<string, any> = {}
  if (pinned.length) {
    let left = 0
    pinned.forEach((col, i) => {
      const last = i === pinned.length - 1
      const edge = last ? { borderRight: `1px solid ${skin.ROW_LINE}` } : {}
      stickyStyle[`& .MuiDataGrid-cell[data-field="${col.field}"]`] = {
        position: 'sticky',
        left,
        zIndex: 3,
        backgroundColor: '#ffffff',
        ...edge
      }
      stickyStyle[`& .MuiDataGrid-columnHeader[data-field="${col.field}"]`] = {
        position: 'sticky',
        left,
        zIndex: 5,
        backgroundColor: skin.TABLE_HEAD_BG,
        ...edge
      }
      stickyStyle[`& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="${col.field}"]`] = { backgroundColor: skin.ROW_HOVER }
      left += col.width ?? col.minWidth ?? 100
    })
  }

  // The LAST column gets extra right padding (user call 2026-09-05: a right-aligned
  // Total sat flush against the table edge) — tagged by class so the rule survives
  // flexed widths and the grid's own scrollbar filler elements.
  const lastPadded = noSerials.map((c, i) =>
    i === noSerials.length - 1 && typeof c.cellClassName !== 'function' && typeof (c as any).headerClassName !== 'function'
      ? {
          ...c,
          cellClassName: [c.cellClassName, 'dg-col-last'].filter(Boolean).join(' '),
          headerClassName: [(c as any).headerClassName, 'dg-col-last'].filter(Boolean).join(' ')
        }
      : c
  )

  // Identity columns sort A→Z on the FIRST tap (user call 2026-09-05): the grid-level
  // desc-first cycle fits figures (biggest first), not names — override per column.
  const ascFirstIdentity = lastPadded.map(c =>
    (c.field === 'name' || c.field === 'animal') && handleSortModel && !(c as any).sortingOrder
      ? { ...c, sortingOrder: ['asc', 'desc'] as any }
      : c
  )

  const table = (
    <CommonTable
      columns={ascFirstIdentity}
      indexedRows={rows}
      total={total}
      loading={false}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      handleSortModel={handleSortModel ?? (() => {})}
      sortModel={sortModel}
      sortingOrder={handleSortModel ? ['desc', 'asc'] : undefined}
      searchValue=''
      getRowHeight={() => rowHeight}
      onRowClick={onRowClick}
      // HARD RULE (2026-07-31): pagination earns its footer only past 10 rows — a short table
      // paginating is noise. Callers can still force-hide via `hideFooter`.
      hideFooter={hideFooter || total <= 10}
      externalTableStyle={{
        mt: 0, // kill CommonTable's baked-in 20px top margin — the card title's mb is the spacing
        // CC table language: pale teal-green header, uppercase overline header type,
        // ONE row hairline (no vertical rules), quiet green row hover.
        '& .MuiDataGrid-columnHeaders': { backgroundColor: skin.TABLE_HEAD_BG },
        '& .MuiDataGrid-cell': { ...GRID_CELL_PAD, display: 'flex', alignItems: 'center', fontSize: '16px', borderBottomColor: skin.ROW_LINE },
        '& .MuiDataGrid-row:hover': { backgroundColor: skin.ROW_HOVER },
        '& .MuiDataGrid-columnHeader': { ...GRID_CELL_PAD, backgroundColor: skin.TABLE_HEAD_BG },
        // Never clip a header — let it wrap to two lines instead of showing "OVER…".
        '& .MuiDataGrid-columnHeaderTitle': {
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: skin.TABLE_HEAD_INK,
          whiteSpace: 'normal',
          lineHeight: 1.2,
          overflow: 'visible',
          textOverflow: 'clip'
        },
        '& .MuiDataGrid-columnHeaderTitleContainerContent': { overflow: 'visible' },
        // A wrapped header ignores headerAlign (it only positions the container) — keep
        // right-aligned columns' header TEXT right-aligned too when it breaks to two lines.
        '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitle': { textAlign: 'right' },
        '& .dg-col-last': { paddingRight: '28px !important' },
        ...(onRowClick ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {}),
        ...stickyStyle
      }}
    />
  )

  // The scrolled-under cue — one uninterrupted strip spanning header + every row.
  const edgeShadow = shadowRect ? (
    <Box
      sx={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 6,
        width: 14,
        left: shadowRect.left,
        top: shadowRect.top,
        height: shadowRect.height,
        background: 'linear-gradient(to right, rgba(0,0,0,0.14), rgba(0,0,0,0))'
      }}
    />
  ) : null

  return framed ? (
    <Box
      ref={wrapRef}
      sx={{ position: 'relative', backgroundColor: '#ffffff', border: `1px solid ${skin.HAIR}`, borderRadius: '12px', overflow: 'hidden', p: 2 }}
    >
      {table}
      {edgeShadow}
    </Box>
  ) : (
    <Box ref={wrapRef} sx={{ position: 'relative' }}>
      {table}
      {edgeShadow}
    </Box>
  )
}

/** Pill used for taxonomy / link badges. */
export const Pill: React.FC<{ label: React.ReactNode; onClick?: () => void; icon?: string }> = ({
  label,
  onClick,
  icon
}) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        border: `1px solid ${cc(theme).OutlineVariant}`,
        backgroundColor: cc(theme).Surface,
        color: cc(theme).OnSurfaceVariant,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {icon && <Icon icon={icon} fontSize={14} />}
      <Typography variant='caption'>{label}</Typography>
    </Box>
  )
}

/** PLATFORM-STANDARD applied-filter chip: bare outlined pill — NO fill, NO leading icon —
 *  with a trailing ✕ that clears just this filter. Every "selected filter" chip anywhere in
 *  the app must be this component (never Pill, never a hand-rolled Box).
 *  iPad sizing: tap-target scale — 32px tall, roomy side padding, 18px ✕. */
export const FilterChip: React.FC<{ label: React.ReactNode; onClear: () => void }> = ({ label, onClear }) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3,
        minHeight: 32,
        borderRadius: '999px',
        border: `1px solid ${cc(theme).OutlineVariant}`,
        color: cc(theme).OnSurfaceVariant
      }}
    >
      <Typography variant='body2'>{label}</Typography>
      <Icon
        icon='mdi:close'
        fontSize={18}
        style={{ cursor: 'pointer', color: cc(theme).Outline, flexShrink: 0 }}
        onClick={onClear}
        role='button'
        aria-label='Clear filter'
      />
    </Box>
  )
}

/** Horizontal value bar (faithful to the prototype's CSS distribution bars). Optionally clickable. */
export const MiniBarRow: React.FC<{
  label: React.ReactNode
  value: number
  max: number
  tone?: Tone
  trailing?: React.ReactNode
  onClick?: () => void
}> = ({ label, value, max, tone = 'primary', trailing, onClick }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        px: onClick ? 1 : 0,
        mx: onClick ? -1 : 0,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: skin.ROW_HOVER } : undefined
      }}
    >
      <Typography variant='body2' sx={{ fontSize: '16px', width: 210, color: skin.INK2, flexShrink: 0 }} noWrap>
        {label}
      </Typography>
      {/* CC meter: sage track, rounded-full, the fill fading to its lightness-step partner. */}
      <Box sx={{ flex: 1, height: 8, borderRadius: '999px', backgroundColor: skin.TRACK, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${fg} 0%, ${skin.mixOverWhite(fg, 0.72)} 100%)`
          }}
        />
      </Box>
      <Typography
        variant='caption'
        sx={{ fontSize: '16px', fontWeight: 600, width: 56, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}
      >
        {trailing ?? value.toLocaleString()}
      </Typography>
      {onClick && <Icon icon='mdi:chevron-right' fontSize={16} color={skin.FAINT} />}
    </Box>
  )
}

/**
 * Drawer listing the entities (animals) behind a chart datapoint — makes graphs drillable.
 * Rows whose id is "real" (resolvable via onItemClick) are clickable into a deeper view;
 * synthetic/boost entries render as plain rows.
 */
export const EntityListDrawer: React.FC<{
  open: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
  unit?: string
  items?: { id: string; name?: string; value?: number; sub?: string }[]
  isClickable?: (id: string) => boolean
  onItemClick?: (id: string) => void
  onClose: () => void
}> = ({ open, title, subtitle, unit, items = [], isClickable, onItemClick, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const heroPhoto = React.useContext(HeroPhotoContext)
  // `sub` is the item's site — the card wears it only when the list spans >1 (hard rule)
  const multiSite = new Set(items.map(it => it.sub).filter(Boolean)).size > 1

  return (
    <DrillSheet open={open} onClose={onClose} title={title} eyebrow={subtitle} size='md'>
      {/* One white card holding the rows — the sheet's sage ground frames it. */}
      <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
        {items.map((it, i) => {
          const clickable = !!onItemClick && (!isClickable || isClickable(it.id))
          const s = synthAnimalIdentity(it.id)

          return (
            <Box
              key={i}
              onClick={clickable ? () => onItemClick?.(it.id) : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 3,
                borderBottom: `1px solid ${skin.HAIR}`,
                '&:last-of-type': { borderBottom: 'none' },
                cursor: clickable ? 'pointer' : 'default',
                ...(clickable && { ...skin.cardPressSx, mx: -2, px: 2, borderRadius: '10px', '&:hover': { backgroundColor: skin.ROW_HOVER } })
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {/* the standard animal card (2026-09-02) — synth identity from the id;
                    the display name renders only when AID is the sole identifier */}
                <AnimalIdCard
                  identifiers={s.identifiers}
                  enclosure={s.enclosure}
                  site={multiSite ? it.sub : undefined}
                  tag={s.tag}
                  name={it.name && it.name !== it.id ? it.name : undefined}
                  photo={s.hasPhoto ? heroPhoto?.src : undefined}
                  photoPos={heroPhoto?.bgPos}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                {it.value != null && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE, lineHeight: 1.2 }}>
                      {it.value}
                    </Typography>
                    {unit && (
                      <Typography sx={{ fontSize: '12px', fontWeight: 500, color: skin.FAINT, display: 'block' }}>
                        {unit}
                      </Typography>
                    )}
                  </Box>
                )}
                {clickable && <Icon icon='mdi:chevron-right' fontSize={18} color={skin.FAINT} />}
              </Box>
            </Box>
          )
        })}
        {!items.length && <EmptyState message='No animals in this group' />}
      </Box>
    </DrillSheet>
  )
}

/** Stacked horizontal bar of segments (gender split, survival buckets, ID distribution).
 * Pass `legend` to show a dot/label/value key beneath — without it the colors are opaque. */
export const StackedBar: React.FC<{ segments: { label: string; value: number; tone: Tone }[]; legend?: boolean }> = ({
  segments,
  legend = false
}) => {
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', height: 10, borderRadius: '5px', overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const { fg } = tones(seg.tone)
          const pct = (seg.value / total) * 100
          if (pct <= 0) return null

          return (
            <Tooltip key={i} title={`${seg.label}: ${seg.value.toLocaleString()} (${Math.round(pct)}%)`} arrow>
              <Box sx={{ width: `${pct}%`, backgroundColor: fg, height: '100%' }} />
            </Tooltip>
          )
        })}
      </Box>
      {legend && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', mt: 1.5 }}>
          {segments
            .filter(s => s.value > 0)
            .map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: tones(s.tone).fg, flexShrink: 0 }} />
                <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant' }}>
                  {s.label}{' '}
                  <Box component='span' sx={{ color: 'customColors.neutralSecondary' }}>
                    {s.value.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  )
}

/** Vertical column trend (year-month / seasonal). `baseline` lifts the floor so small
 * variations read clearly (e.g. weight trend anchored at the species minimum). */
/** The 1Y·2Y·3Y·All underline range tabs used on trend-chart headers (Circle of Life, Clinical sheets). */
export const TREND_RANGES: { key: RangePreset; label: string }[] = [
  { key: 'last_1y', label: '1Y' },
  { key: 'last_2y', label: '2Y' },
  { key: 'last_3y', label: '3Y' },
  { key: 'all', label: 'All' }
]

export const TrendRangeTabs: React.FC<{ value: RangePreset; onPick: (p: RangePreset) => void; color: string }> = ({ value, onPick, color }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    // flexShrink 0 + nowrap: the tabs must NEVER be squeezed/cut by a long card title —
    // in a flex header the title gives way (wraps), not the range control.
    <Box sx={{ display: 'flex', flexShrink: 0, whiteSpace: 'nowrap', borderBottom: `2px solid ${c.SurfaceVariant}` }}>
      {TREND_RANGES.map(r => {
        const active = value === r.key

        return (
          <Box
            key={r.key}
            onClick={() => onPick(r.key)}
            sx={{
              px: '14px',
              py: '4px',
              cursor: 'pointer',
              mb: '-2px',
              borderBottom: `2.5px solid ${active ? color : 'transparent'}`,
              transition: 'all .15s ease'
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 700, color: active ? color : c.neutralSecondary }}>
              {r.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export const ColumnTrend: React.FC<{
  data: { label: string; value: number }[]
  tone?: Tone
  height?: number
  baseline?: number
  /** When provided, bars become clickable (cursor + hover highlight) and fire with the bar index. */
  onBarClick?: (index: number) => void
  /** Index of the currently selected bar — others dim so the active month reads at a glance. */
  activeIndex?: number | null
  /** Print the value above each bar so the chart is legible without hovering. */
  showValues?: boolean
  /** Show only every Nth axis caption (long series); tooltips keep the full label. */
  labelEvery?: number
}> = ({ data, tone = 'primary', height = 120, baseline, onBarClick, activeIndex = null, showValues, labelEvery = 1 }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const max = Math.max(1, ...data.map(d => d.value))
  const base = baseline != null ? baseline : 0
  const denom = Math.max(1, max - base)
  const clickable = !!onBarClick
  const plotH = height - 24 - (showValues ? 14 : 0)

  // Scroll standard: every bar gets a slot wide enough for its label at 14px (dates need
  // more than "Jan"), overflow scrolls behind a thin always-visible bar.
  const maxLen = Math.max(1, ...data.map(d => String(d.label).length))
  const slotW = Math.min(96, Math.max(40, maxLen * 8 + 12))

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        height: height + 8,
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: '8px',
        ...thinScrollbarSx(theme)
      }}
    >
      {data.map((d, i) => {
        const isActive = activeIndex === i
        const dim = activeIndex != null && !isActive

        return (
          <Box
            key={i}
            onClick={clickable ? () => onBarClick!(i) : undefined}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: slotW, flex: 1, cursor: clickable ? 'pointer' : 'default' }}
          >
            {showValues && (
              <Typography variant='caption' sx={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: cc(theme).neutralSecondary, mb: 0.5, height: 18 }}>
                {d.value || ''}
              </Typography>
            )}
            <Tooltip title={`${d.label}: ${d.value.toLocaleString()}`} arrow>
              <Box
                sx={{
                  width: '70%',
                  height: `${Math.max(2, (Math.max(0, d.value - base) / denom) * plotH)}px`,
                  backgroundColor: fg,
                  opacity: dim ? 0.32 : 1,
                  borderRadius: '3px 3px 0 0',
                  transition: 'opacity .15s ease, filter .15s ease',
                  ...(clickable ? { '&:hover': { filter: 'brightness(0.88)', opacity: 1 } } : {})
                }}
              />
            </Tooltip>
            <Typography
              variant='caption'
              sx={{ color: isActive ? fg : cc(theme).neutralSecondary, fontWeight: isActive ? 700 : 400, mt: 0.5, fontSize: 14 }}
              noWrap
            >
              {isActive || i % labelEvery === 0 ? d.label : ' '}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

/** Min–avg–max range bar: a track from min→max with an avg marker. For numeric assessment types. */
export const RangeBar: React.FC<{ min: number; avg: number; max: number; tone?: Tone }> = ({
  min,
  avg,
  max,
  tone = 'info'
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const span = max - min
  const avgPct = span > 0 ? Math.min(100, Math.max(0, ((avg - min) / span) * 100)) : 50

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height: 6, borderRadius: '999px', backgroundColor: skin.TRACK }}>
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: `${avgPct}%`,
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: fg,
            border: `2px solid ${theme.palette.background.paper}`
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant='caption' sx={{ color: skin.FAINT }}>
          {min}
        </Typography>
        <Typography variant='caption' sx={{ color: skin.FAINT }}>
          {max}
        </Typography>
      </Box>
    </Box>
  )
}

/** Signed delta chip: e.g. "+12%" green / "-8%" orange, neutral near zero. */
export const DeltaChip: React.FC<{ pct: number; suffix?: string }> = ({ pct, suffix = '%' }) => {
  const tone: Tone = pct > 1 ? 'success' : pct < -1 ? 'warning' : 'neutral'

  return <StatusChip label={`${pct > 0 ? '+' : ''}${pct}${suffix}`} tone={tone} />
}

/** Compact inline trend bars (for type cards — smaller than ColumnTrend). */
export const SparkBars: React.FC<{ values: number[]; tone?: Tone; height?: number }> = ({
  values,
  tone = 'info',
  height = 28
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  if (!values.length) return null
  const max = Math.max(1, ...values)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height }}>
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            minWidth: 3,
            height: `${Math.max(2, (v / max) * height)}px`,
            backgroundColor: fg,
            borderRadius: '2px 2px 0 0',
            opacity: 0.35 + 0.65 * (i / Math.max(1, values.length - 1))
          }}
        />
      ))}
    </Box>
  )
}

/**
 * Compact inline line sparkline (SVG, no chart lib) for table trend cells — a thin trend line
 * with a dot on the latest point. `tone` sets the stroke: up = green, down = orange, flat/info = neutral/teal.
 * Fixed size so it sits cleanly inside a DataGrid cell; needs ≥2 points.
 */
export const Sparkline: React.FC<{ values: number[]; tone?: 'up' | 'down' | 'flat' | 'info'; width?: number; height?: number }> = ({
  values,
  tone = 'flat',
  width = 150,
  height = 30
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  if (!values || values.length < 2) return null
  // A 1.5px stroke is TYPE-thin — brand brights fail contrast there, so the line
  // wears each tone's deep ink partner (CC strokeOf rule).
  const color =
    tone === 'up'
      ? skin.ACCENT_INK
      : tone === 'down'
        ? skin.CORAL
        : tone === 'info'
          ? skin.strokeOf('#00abab')
          : skin.FAINT
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 4
  const n = values.length
  const px = (i: number) => pad + (i / (n - 1)) * (width - 2 * pad)
  const py = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad)
  const pts = values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth={1.5} strokeLinejoin='round' strokeLinecap='round' />
      <circle cx={px(n - 1)} cy={py(values[n - 1])} r={2.75} fill={color} />
    </svg>
  )
}

/**
 * Vertical column histogram (SVG-free, CSS bars) for score/range buckets — colored per-bar by tone,
 * count label on top, bucket label under, optional legend. Bars are clickable to drill. Attractive +
 * interactive: hover lifts the bar. Use for numeric distributions (BCS scores, weight ranges).
 */
export const VBarChart: React.FC<{
  bars: { label: string; count: number; tone?: Tone }[]
  legend?: { label: string; tone: Tone }[]
  height?: number
  onSelect?: (label: string) => void
}> = ({ bars, legend, height = 210, onSelect }) => {
  // Naveen's columns mark — 1-2-5 gridline ladder, whole-slot tap targets, the white
  // ChartTip, grow-in on scroll. Semantic buckets keep their tone as the bar's FILL.
  if (!bars.length) return null

  return (
    <Box>
      <BarColumns
        bars={bars.map(b => [b.label, b.count] as [string, number])}
        fills={bars.map(b => (b.tone ? TONE_MARK[b.tone] : skin.ACCENT_FILL))}
        noun='animals'
        height={height - 46}
        onSelect={onSelect ? label => onSelect(String(label)) : undefined}
      />
      {legend?.length ? (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center' }}>
          {legend.map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '2.5px', backgroundColor: TONE_MARK[l.tone], flexShrink: 0 }} />
              <Typography variant='caption' sx={{ fontSize: '13px', color: skin.INK2 }}>
                {l.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

export const Donut: React.FC<{
  segments: { label: string; value: number; tone: Tone }[]
  centerValue: React.ReactNode
  centerSub?: string
  centerColor?: string
  size?: number
  /** Denominator override — pass to draw segments as a fraction of a larger whole (the grey
   *  track shows the remainder), e.g. a single completed-share ring. */
  total?: number
  /** Per-segment click — the ring slices become tappable (legend rows usually mirror this). */
  onSegmentClick?: (label: string) => void
}> = ({ segments, centerValue, centerSub, centerColor, size = 150, total: totalProp, onSegmentClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = totalProp || segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 54
  const SW = 16
  const CIRC = 2 * Math.PI * R
  let acc = 0

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox='0 0 140 140'>
        <g transform='rotate(-90 70 70)'>
          <circle cx='70' cy='70' r={R} fill='none' stroke={c.SurfaceVariant} strokeWidth={SW} />
          {segments.map((s, i) => {
            const len = (s.value / total) * CIRC
            const node = (
              <circle
                key={i}
                cx='70'
                cy='70'
                r={R}
                fill='none'
                stroke={tones(s.tone).fg}
                strokeWidth={SW}
                strokeDasharray={`${len} ${CIRC - len}`}
                strokeDashoffset={-acc}
                onClick={onSegmentClick ? () => onSegmentClick(s.label) : undefined}
                style={onSegmentClick ? { cursor: 'pointer', pointerEvents: 'visibleStroke' } : undefined}
              />
            )
            acc += len

            return node
          })}
        </g>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant='h5' sx={{ color: centerColor || cc(theme).OnSurfaceVariant, lineHeight: 1 }}>
          {centerValue}
        </Typography>
        {centerSub && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase' }}>
            {centerSub}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/** "Intelligence" card: donut + legend (value + %) + optional insight lines (icon · label · value). */
export const IntelligenceCard: React.FC<{
  title: string
  segments: { label: string; value: number; tone: Tone }[]
  centerValue: React.ReactNode
  centerSub?: string
  centerColor?: string
  insights?: { icon: string; tone: Tone; label: string; value: React.ReactNode }[]
}> = ({ title, segments, centerValue, centerSub, centerColor, insights }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <SectionCard title={title}>
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Naveen's Slices ring — semantic tones ride as explicit slice FILLS; the centre
            reading is the mark's own (VALUE ink), and the tooltip is the white ChartTip. */}
        <Slices
          items={segments.filter(s => s.value > 0).map(s => ({ label: s.label, value: s.value }))}
          fills={segments.filter(s => s.value > 0).map(s => TONE_MARK[s.tone])}
          centre={[centerSub || '', String(centerValue)]}
          size={168}
        />
        <Box sx={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {segments.map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '2.5px', backgroundColor: TONE_MARK[s.tone], flexShrink: 0 }} />
              <Typography variant='body2' sx={{ color: skin.INK2, flex: 1 }} noWrap>
                {s.label}
              </Typography>
              <Typography variant='subtitle2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
                {s.value.toLocaleString()}
              </Typography>
              <Typography variant='caption' sx={{ color: skin.FAINT, width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round((s.value / total) * 100)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {insights?.length ? (
        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${skin.HAIR}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {insights.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon={it.icon} fontSize={16} color={tones(it.tone).fg} />
              <Typography variant='caption' sx={{ fontWeight: 600, color: tones(it.tone).fg }}>
                {it.label}
              </Typography>
              <Typography variant='caption' sx={{ color: c.OnSurfaceVariant }}>
                {it.value}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </SectionCard>
  )
}

/**
 * Clean horizontal distribution bars (CSS flexbox — no chart lib). One row per category:
 * label · track-with-fill · count. Sorted high→low, single accent color, rounded bars.
 * Click a row to drill in. Replaces the prior Recharts vertical layout, which collapsed
 * bars and detached axis labels inside narrow card columns.
 */
export const DistributionBarChart: React.FC<{
  data: { label: string; count: number }[]
  tone?: Tone
  onSelect?: (label: string) => void
}> = ({ data, tone = 'primary', onSelect }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const { fg } = tones(tone)
  if (!data.length) return null
  const rows = [...data].sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...rows.map(d => d.count))

  return (
    <Box>
      {rows.map(d => (
        <Box
          key={d.label}
          onClick={() => onSelect?.(d.label)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 0.75,
            cursor: onSelect ? 'pointer' : 'default',
            '&:hover': onSelect ? { opacity: 0.85 } : undefined
          }}
        >
          <Typography variant='body2' noWrap sx={{ width: 150, flexShrink: 0, color: c.OnSurfaceVariant }}>
            {d.label}
          </Typography>
          <Box sx={{ flex: 1, height: 10, bgcolor: c.Surface, borderRadius: 5, overflow: 'hidden', minWidth: 0 }}>
            <Box sx={{ width: `${(d.count / max) * 100}%`, height: '100%', bgcolor: fg, borderRadius: 5, transition: '0.2s' }} />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 44, textAlign: 'right', fontWeight: 700, color: c.OnSurfaceVariant }}>
            {d.count.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

interface TrendSeries {
  values: number[]
  color: string
  /** unique gradient id within the page */
  gradId: string
}

/**
 * Hand-rolled SVG trend engine (1..N filled series on shared axes). recharts 2.4.3 renders
 * area charts with broken/swapped axes in this app — category X-axis emits no ticks and the
 * Y-axis falls into category mode — so we draw the chart directly. viewBox coords scale with
 * the container; strokes use non-scaling-stroke so they stay crisp. X labels are the data
 * labels (months), thinned to avoid crowding; Y labels are a 3-stop gutter.
 */
const SvgTrend: React.FC<{ labels: string[]; series: TrendSeries[]; height: number }> = ({ labels, series, height }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const VBW = 1000
  const VBH = 260
  const W_GUTTER = 40
  const n = labels.length
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const px = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * VBW)
  const py = (v: number) => VBH - (v / max) * VBH
  const linePath = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
  const areaPath = (vals: number[]) => `${linePath(vals)} L${VBW},${VBH} L0,${VBH} Z`
  const yLabels = [max, Math.round(max / 2), 0]
  const step = Math.ceil(n / 12) // show ~12 x-labels max

  return (
    <>
      <Box sx={{ position: 'relative', height }}>
        {/* Y-axis labels */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: W_GUTTER,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pr: 1
          }}
        >
          {yLabels.map(v => (
            <Typography key={v} variant='caption' sx={{ color: c.neutralSecondary, lineHeight: 1 }}>
              {v.toLocaleString()}
            </Typography>
          ))}
        </Box>
        {/* Plot */}
        <Box sx={{ position: 'absolute', left: W_GUTTER, right: 0, top: 0, bottom: 0 }}>
          <svg width='100%' height='100%' viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio='none'>
            <defs>
              {series.map(s => (
                <linearGradient key={s.gradId} id={s.gradId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor={s.color} stopOpacity={0.28} />
                  <stop offset='100%' stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {[0, VBH / 2, VBH].map(gy => (
              <line key={gy} x1='0' y1={gy} x2={VBW} y2={gy} stroke={c.SurfaceVariant} strokeWidth='1' vectorEffect='non-scaling-stroke' />
            ))}
            {series.map(s => (
              <path key={`a-${s.gradId}`} d={areaPath(s.values)} fill={`url(#${s.gradId})`} stroke='none' />
            ))}
            {series.map(s => (
              <path key={`l-${s.gradId}`} d={linePath(s.values)} fill='none' stroke={s.color} strokeWidth='2' vectorEffect='non-scaling-stroke' strokeLinejoin='round' />
            ))}
          </svg>
        </Box>
      </Box>
      {/* X axis */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: `${W_GUTTER}px`, mt: 0.75 }}>
        {labels.map((label, i) => (
          <Typography key={`${label}-${i}`} variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
            {i % step === 0 || i === n - 1 ? fmtMonth(label) : ''}
          </Typography>
        ))}
      </Box>
    </>
  )
}

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data available' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
    <NoDataFound />
    <Typography variant='body2' sx={{ color: skin.MUTED, mt: 1 }}>
      {message}
    </Typography>
  </Box>
)

/** Grid wrapper for stat tiles / cards. */
export const TileGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
    {children}
  </Box>
)

// ── Trend area chart (v2 Circle of Life "Over Time" charts) ─────────────────────
// Fork of the dashboard SmoothAreaChart with the prototype's calmer axis: the x-axis
// thins to at most ~12 ticks, each a two-line month-over-year label ("Jan" / "46"),
// and the point value labels follow the same rhythm so dense ranges stay readable.

/** v2 Apex tooltip shell — replaces Apex's default grey border + 5px radius (the header band's
 *  bg poked past those corners and read as a clipped top edge). Overflow hidden keeps the
 *  header inside the rounded shell. */
const apexTooltipSx = (theme: any) => ({
  '& .apexcharts-tooltip.apexcharts-theme-light': {
    border: 'none',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.14)',
    background: theme.palette.background.paper
  }
})

// Same tooltip HTML as the dashboard charts (kept v2-local so v1 files stay untouched).
const trendTooltipHTML = (theme: any, title: string, rows: { color?: string; label: string; value: string }[]) => {
  const c = cc(theme)
  const head = `<div style="padding:12px 18px;background:${c.Surface};border-bottom:1px solid ${c.SurfaceVariant};font-weight:600;color:${c.OnSurfaceVariant};">${title}</div>`
  const body = rows
    .map(r =>
      r.color
        ? `<div style="display:flex;align-items:center;gap:8px;padding:8px 18px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block;flex:none;"></span>
        <span style="color:${c.neutralSecondary};">${r.label}:</span>
        <span style="font-weight:700;color:${c.OnSurfaceVariant};">${r.value}</span>
      </div>`
        : // no color = a TOTAL row — no series dot, divider above, value pushed right
          `<div style="display:flex;align-items:center;gap:8px;padding:9px 18px 8px;margin-top:6px;border-top:1px solid ${c.SurfaceVariant};min-width:180px;">
        <span style="color:${c.OnSurfaceVariant};font-weight:600;">${r.label}</span>
        <span style="font-weight:800;color:${c.OnSurfaceVariant};margin-left:auto;">${r.value}</span>
      </div>`
    )
    .join('')

  return `<div style="font-size:16px;font-family:inherit;background:${theme.palette.background.paper};">${head}<div style="padding:8px 0;">${body}</div></div>`
}

/** THE standard chart tooltip on custom DOM charts (non-Apex bars, bands, cells): wraps the
 *  hovered element in a MUI Tooltip whose bubble is restyled to the Apex shell (10px radius,
 *  paper bg, same shadow) and whose body IS `trendTooltipHTML` — so every chart in v2 shows
 *  the identical card (header band = x-label, rows = dot + label + bold value). Never put a
 *  plain string tooltip on a chart; use this. */
export const ChartHoverCard: React.FC<{
  title: string
  rows: { color?: string; label: string; value: string }[]
  /** No data at this x — renders the child bare, no hover card. */
  disabled?: boolean
  children: React.ReactElement
}> = ({ title, rows, disabled, children }) => {
  const theme = useTheme() as any
  if (disabled) return children

  return (
    <Tooltip
      followCursor
      placement='top'
      slotProps={{
        tooltip: {
          sx: {
            p: 0,
            maxWidth: 'none',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.14)',
            backgroundColor: theme.palette.background.paper,
            color: 'inherit'
          }
        }
      }}
      title={<Box dangerouslySetInnerHTML={{ __html: trendTooltipHTML(theme, title, rows) }} />}
    >
      {children}
    </Tooltip>
  )
}

/** THE month/year axis standard (user-locked, matches "Doses given per month"): labels like
 *  "Aug '25" / "Aug 2025" render as TWO lines (month over 2-digit year), long ranges thin to
 *  ≤12 visible ticks (tooltips/clicks keep full labels), and two-line axes get a PINNED 44px
 *  reserve so side-by-side charts share a baseline. Every chart with a month+year x-axis —
 *  bar or line, card or side sheet, any module — must run its labels through this. */
export const monthYearAxis = (labels: string[]) => {
  const every = Math.max(1, Math.ceil(labels.length / 12))
  let hasTwoLine = false
  const categories = labels.map((l, i) => {
    if (i % every !== 0) return ''
    const m = /^([A-Za-z]{3})\s*'?(\d{2}|\d{4})$/.exec(String(l).trim())
    if (m) {
      hasTwoLine = true

      return [m[1], m[2].slice(-2)]
    }

    // "Word N" labels ("Day 12"): ALWAYS two lines — otherwise narrow slots wrap only the
    // wide labels and the axis mixes one- and two-line ticks.
    const d = /^([A-Za-z]+)\s+(\d+)$/.exec(String(l).trim())
    if (d) {
      hasTwoLine = true

      return [d[1], d[2]]
    }

    return l
  })

  return { categories, every, hasTwoLine }
}

export function TrendAreaChart({
  values,
  labels,
  color,
  name,
  height = 260,
  unit = '',
  onPointClick,
  flush = false,
  series2,
  corridor
}: {
  /** Nulls allowed in corridor mode only — a not-yet-measured day; the line stops there. */
  values: (number | null)[]
  labels: string[]
  color: string
  name: string
  height?: number
  /** Appended to axis/label/tooltip values (e.g. '%'). */
  unit?: string
  /** When provided, clicking a point marker fires with its index (month drill). */
  onPointClick?: (index: number) => void
  /** Card-edge mode: cancels the parent SectionCard padding so the scrollbar runs
   *  edge-to-edge. Use ONLY when the chart is the card's LAST child. */
  flush?: boolean
  /** Second series → STACKED areas: `values` renders as the base band, `series2` on top.
   *  Value labels then show the stack TOTAL (on the top series only); tooltip lists both + total. */
  series2?: { values: number[]; name: string; color: string }
  /** Ideal-vs-actual mode (e.g. egg weight loss): draws a dashed ideal line plus an
   *  acceptable band behind `values`. Y-axis starts at the data floor instead of 0,
   *  per-point value labels switch off (dense decimal tracks), and the tooltip lists
   *  actual • ideal • corridor. `values` may contain nulls (not yet measured).
   *  Mutually exclusive with `series2`. The band is carved out by re-filling below the
   *  lower bound in the card background, so grid lines inside the band are masked. */
  corridor?: { ideal: number[]; upper: number[]; lower: number[]; idealName?: string; breachIndex?: number }
}) {
  const theme = useTheme() as any
  const c = cc(theme)
  const n = values.length
  const cor = corridor
  const stacked = !!series2 && !cor

  // Shared month/year axis standard — two-line labels + ≤12 visible ticks; value labels
  // thin to the same indices.
  const { categories, every } = monthYearAxis(labels)

  const totalAt = (i: number) => (values[i] ?? 0) + (series2?.values[i] ?? 0)

  // Integer y ticks — capping at the series max avoids duplicate rounded labels (e.g. "1 1 2 2").
  const nums = values.filter((v): v is number => v != null)
  const yMax = stacked ? Math.max(0, ...values.map((_, i) => totalAt(i))) : Math.max(0, ...nums)
  const yTicks = Math.max(1, Math.min(4, yMax))

  // Corridor mode: the y-domain hugs the data (weights never start at 0g).
  const corMin = cor ? Math.floor(Math.min(...cor.lower, ...nums) * 0.995) : 0
  const corMax = cor ? Math.ceil(Math.max(...cor.upper, ...nums) * 1.005) : undefined

  return (
    // hand cursor on the clickable point markers (Apex doesn't set one for markerClick)
    <Box
      sx={{
        ...(flush ? { mx: -4, mb: -4 } : {}),
        ...apexTooltipSx(theme),
        ...(onPointClick ? { '& .apexcharts-marker, & .apexcharts-series': { cursor: 'pointer' } } : {})
      }}
    >
      <ReactApexcharts
        type='area'
        height={height}
        options={{
          chart: {
            toolbar: { show: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            stacked,
            // Spread, never `events: undefined` — an explicit undefined clobbers Apex's default
            // events object and every chart update crashes on `config.chart.events.beforeMount`.
            ...(onPointClick
              ? { events: { markerClick: (_e: any, _ctx: any, opts: any) => onPointClick(opts?.dataPointIndex ?? -1) } }
              : {})
          },
          colors: cor
            ? [theme.palette.primary.main, theme.palette.background.paper, c.neutralSecondary, color]
            : stacked
              ? [color, series2!.color]
              : [color],
          stroke: cor
            ? { curve: 'smooth', width: [0, 0, 2, 3], dashArray: [0, 0, 6, 0] }
            : { curve: 'smooth', width: stacked ? 2 : 3 },
          legend: { show: false },
          dataLabels: {
            enabled: !cor,
            // Stacked: one label per point — the TOTAL, rendered on the top series (index 1)
            // where the stack peaks; the base series stays label-free.
            formatter: (v: number, opts: any) => {
              if (opts.dataPointIndex % every !== 0) return ''
              if (!stacked) return v ? `${v.toLocaleString()}${unit}` : ''
              if (opts.seriesIndex !== 1) return ''
              const t = totalAt(opts.dataPointIndex)

              return t ? `${t.toLocaleString()}${unit}` : ''
            },
            offsetY: -5,
            style: { fontSize: '14px', fontWeight: 700, colors: stacked ? [color, cc(theme).OnSurfaceVariant] : [color] },
            background: { enabled: false }
          },
          markers: cor
            ? {
                // dots on the measured track only; the band/ideal stay clean
                size: [0, 0, 0, n > 24 ? 3 : 4],
                colors: [theme.palette.primary.main, theme.palette.background.paper, c.neutralSecondary, color],
                strokeColors: theme.palette.common.white,
                strokeWidth: 1,
                hover: { size: 6 },
                ...(cor.breachIndex != null
                  ? { discrete: [{ seriesIndex: 3, dataPointIndex: cor.breachIndex, fillColor: c.Tertiary, strokeColor: theme.palette.common.white, size: 5 }] }
                  : {})
              }
            : {
                // Dense series: hide the per-point dots — 100+ markers overlap the stroke and the
                // line reads as dotted. Hover still shows a marker.
                size: n > 24 ? 0 : 4,
                colors: stacked ? [color, series2!.color] : [color],
                strokeColors: theme.palette.common.white,
                strokeWidth: 1.5,
                hover: { size: 6 }
              },
          fill: cor
            ? { type: 'solid', opacity: [0.15, 1, 1, 1] }
            : { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0, stops: [0, 100] } },
          grid: {
            borderColor: c.SurfaceVariant,
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            // Side padding so first/last points (and their value labels) don't clip against the
            // plot edges — left stays small so the plot hugs the y-axis labels.
            padding: { top: 16, left: 12, right: 20 }
          },
          xaxis: {
            categories,
            labels: {
              style: { colors: c.neutralSecondary, fontSize: '14px' },
              rotate: 0,
              hideOverlappingLabels: false,
              trim: false,
              // Pin the axis reserve to a FIXED height (min = max) instead of letting Apex measure
              // it from the data — measurement is data-shape-dependent and made the side-by-side
              // Births/Deaths plots come out different heights. 52px fits the two-line 14px labels.
              minHeight: 52,
              maxHeight: 52
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false }
          },
          yaxis: {
            min: corMin,
            ...(corMax != null ? { max: corMax } : {}),
            tickAmount: cor ? 4 : yTicks,
            labels: {
              style: { colors: c.neutralSecondary, fontSize: '14px' },
              formatter: (v: number) => `${Math.round(v).toLocaleString()}${unit}`,
              // Same gutter width on every trend chart so side-by-side plots align. Left-anchored
              // so the tick column lines up with the card title's left edge. -12 measured against
              // the rendered app (2026-08-07): -24 made the labels overhang ~12px LEFT of the
              // card title — screenshot-measured, don't re-derive from bare-Apex harnesses (the
              // template's global chart styles shift the axis geometry).
              minWidth: 26,
              align: 'left',
              offsetX: -12
            }
          },
          tooltip: {
            ...(stacked || cor ? { shared: true, intersect: false } : {}),
            custom: ({ series, seriesIndex, dataPointIndex }: any) =>
              trendTooltipHTML(
                theme,
                labels[dataPointIndex] ?? '',
                cor
                  ? [
                      ...(values[dataPointIndex] != null
                        ? [{ color, label: name, value: `${Math.round((values[dataPointIndex] as number) * 10) / 10}${unit}` }]
                        : []),
                      { color: c.neutralSecondary, label: cor.idealName ?? 'Ideal', value: `${Math.round((cor.ideal[dataPointIndex] ?? 0) * 10) / 10}${unit}` },
                      {
                        color: `${theme.palette.primary.main}66`,
                        label: 'Corridor',
                        value: `${Math.round((cor.lower[dataPointIndex] ?? 0) * 10) / 10} – ${Math.round((cor.upper[dataPointIndex] ?? 0) * 10) / 10}${unit}`
                      }
                    ]
                  : stacked
                  ? [
                      {
                        color: series2!.color,
                        label: series2!.name,
                        value: `${Number(series[1]?.[dataPointIndex] ?? 0).toLocaleString()}${unit}`
                      },
                      {
                        color,
                        label: name,
                        value: `${Number(series[0]?.[dataPointIndex] ?? 0).toLocaleString()}${unit}`
                      },
                      {
                        color: cc(theme).OnSurfaceVariant,
                        label: 'Total',
                        value: `${totalAt(dataPointIndex).toLocaleString()}${unit}`
                      }
                    ]
                  : [
                      {
                        color,
                        label: name,
                        value: `${Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString()}${unit}`
                      }
                    ]
              )
          }
        }}
        series={
          cor
            ? [
                { name: 'bandUpper', type: 'area', data: cor.upper },
                { name: 'bandLower', type: 'area', data: cor.lower },
                { name: cor.idealName ?? 'Ideal', type: 'line', data: cor.ideal },
                { name, type: 'line', data: values }
              ]
            : stacked
              ? [{ name, data: values }, { name: series2!.name, data: series2!.values }]
              : [{ name, data: values }]
        }
      />
    </Box>
  )
}

/** Seasonal 12-month column chart — one look for Breeding AND Mortality so the side-by-side
 *  cards align; optional per-month click (mortality month drill). */
export function SeasonalColumnChart({
  values,
  labels,
  color,
  name,
  height = 220,
  onBarClick,
  tooltipLabels,
  tooltipSeries,
  tooltipRows,
  padLeft = -8,
  series2,
  scroll: scrollProp
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
  onBarClick?: (label: string, index: number) => void
  /** Full labels for tooltips/clicks if `labels` was pre-thinned by the caller (legacy —
   *  pass FULL labels and let the axis standard thin them instead). */
  tooltipLabels?: string[]
  /** Show a DIFFERENT series in the hover tooltip than the bars plot (e.g. bars = doses,
   *  tooltip = distinct animals). `values` is parallel to `labels`. */
  tooltipSeries?: { label: string; values: number[] }
  /** Full control of the tooltip body: rows per bar index (rendered in the standard shell).
   *  Wins over `tooltipSeries` and the default series row. */
  tooltipRows?: (index: number) => { color?: string; label: string; value: string }[]
  /** Plot left padding. Default -8 = flush-left at the 14px axis-label size (was -22 at 11px);
   *  wide labels ("Aug '25") overhang further — pass 0. Re-measure if the axis font changes. */
  padLeft?: number
  /** Second series → STACKED columns: `values` is the base segment, `series2` stacks on top.
   *  The per-bar value label then shows series2's count only (its color), skipping zeros. */
  series2?: { values: number[]; name: string; color: string }
  /** Force the 72px-per-month scroll window on/off. Default: on only for dense two-line
   *  month-year ranges — a plain 12-month chart in a card must never scroll (2026-08-07,
   *  Circle-of-Life regression). The Eggs female drawer passes `scroll` explicitly: its
   *  12-month chart lives in a narrow sheet and was approved WITH the scroll window. */
  scroll?: boolean
}) {
  const theme = useTheme() as any
  const c = cc(theme)
  const tipLabels = tooltipLabels ?? labels

  // Keep the cursor-anchored tooltip card fully visible: Apex clamps it against the FULL
  // chart width, using a width measured BEFORE the card's content is injected — so near a
  // card/sheet edge (or when this wrapper scrolls) the card escapes and gets clipped by the
  // container. After Apex positions it on each move, re-clamp `left`/`top` to the wrapper's
  // visible window (rAF = runs after every mousemove listener, before paint).
  const tooltipScrollRef = useRef<HTMLDivElement | null>(null)
  const clampTooltip = () => {
    requestAnimationFrame(() => {
      const wrap = tooltipScrollRef.current
      const tt = wrap?.querySelector('.apexcharts-tooltip') as HTMLElement | null
      if (!wrap || !tt) return
      const minX = wrap.scrollLeft + 2
      const maxX = Math.max(minX, wrap.scrollLeft + wrap.clientWidth - tt.offsetWidth - 2)
      const left = parseFloat(tt.style.left) || 0
      if (left < minX || left > maxX) tt.style.left = `${Math.min(Math.max(left, minX), maxX)}px`
      const maxY = Math.max(0, wrap.clientHeight - tt.offsetHeight - 2)
      const top = parseFloat(tt.style.top) || 0
      if (top < 0 || top > maxY) tt.style.top = `${Math.min(Math.max(top, 0), maxY)}px`
    })
  }

  // Shared month/year axis standard — two-line "Aug '25" labels, ≤12 visible ticks on long
  // ranges — same treatment as TrendAreaChart so a side-by-side pair reads as one system.
  // Plain "Jan" / "2024" labels pass through single-line, unthinned (12-bucket series).
  const { categories, hasTwoLine } = monthYearAxis(labels)

  // Scroll standard applies to DENSE ranges only (two-line month-year labels, i.e. >12 buckets):
  // each visible month gets a 72px slot and overflow scrolls behind a thin bar. A plain
  // 12-month seasonal chart must NEVER scroll — forcing the slot width on it overflowed the
  // half-width Circle-of-Life cards and regressed a correct screen (2026-08-07).
  const scroll = scrollProp ?? hasTwoLine
  const visTicks = Math.max(1, categories.filter((x: any) => x !== '').length)

  const chart = (
    <Box
      sx={{
        ...(scroll
          ? { minWidth: `${visTicks * 72}px` }
          : // Edge axis labels (first/last month) are centred under their bars and can extend
            // past the SVG bounds — let them render into the card padding instead of clipping.
            { '& .apexcharts-svg': { overflow: 'visible' } }),
        ...apexTooltipSx(theme),
        ...(onBarClick ? { '& .apexcharts-bar-area': { cursor: 'pointer' } } : {})
      }}
    >
      <ReactApexcharts
        type='bar'
        height={height}
        options={{
          chart: {
            toolbar: { show: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            stacked: !!series2,
            // Always a populated events object, never `events: undefined` — an explicit
            // undefined wipes Apex's internal event defaults and the chart silently renders empty.
            events: {
              mouseMove: clampTooltip,
              ...(onBarClick
                ? {
                    dataPointSelection: (_e: any, _ctx: any, cfg: any) => {
                      const i = cfg?.dataPointIndex
                      // tipLabels: axis labels may be thinned to '' on long ranges — always
                      // hand the handler the FULL month label (+ its index for month math).
                      if (i != null && i >= 0 && (values[i] || (series2?.values[i] ?? 0))) onBarClick(tipLabels[i] ?? labels[i], i)
                    }
                  }
                : {})
            }
          },
          states: { active: { filter: { type: 'none' } } },
          colors: series2 ? [color, series2.color] : [color],
          plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, dataLabels: { position: 'top' } } },
          dataLabels: {
            enabled: true,
            offsetY: -20,
            // Stacked: label ONLY the top segment's own count (e.g. missed doses), zeros stay silent.
            formatter: series2
              ? (v: number, opts: any) => (opts.seriesIndex === 1 && v ? v.toLocaleString() : '')
              : (v: number) => (v ? v.toLocaleString() : ''),
            style: { fontSize: '14px', fontWeight: 700, colors: series2 ? [color, series2.color] : [color] }
          },
          legend: { show: false },
          // Negative left padding pulls the first bar flush with the card heading —
          // with the y-axis hidden Apex still indents the plot ~22px for nothing.
          // Right padding mirrors left (when left ≥ 0) so the plot sits symmetrically in
          // the card instead of leaving Apex's default dead space on the right.
          grid: { show: false, padding: { top: 20, left: padLeft, ...(padLeft >= 0 ? { right: padLeft } : {}) } },
          xaxis: {
            categories,
            labels: {
              style: { colors: c.neutralSecondary, fontSize: '14px' },
              rotate: 0,
              hideOverlappingLabels: false,
              trim: false,
              // Two-line labels get the same PINNED axis reserve as TrendAreaChart (44px) so
              // side-by-side pairs share a baseline; single-line labels keep Apex's measure.
              ...(hasTwoLine ? { minHeight: 52, maxHeight: 52 } : {})
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: { show: false },
          tooltip: {
            custom: ({ series, seriesIndex, dataPointIndex }: any) =>
              trendTooltipHTML(
                theme,
                tipLabels[dataPointIndex] ?? '',
                tooltipRows
                  ? tooltipRows(dataPointIndex)
                  : [
                      tooltipSeries
                        ? { color, label: tooltipSeries.label, value: Number(tooltipSeries.values[dataPointIndex] ?? 0).toLocaleString() }
                        : { color, label: name, value: Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString() }
                    ]
              )
          },
          fill: { opacity: 1 }
        }}
        series={series2 ? [{ name, data: values }, { name: series2.name, data: series2.values }] : [{ name, data: values }]}
      />
    </Box>
  )

  // Dense ranges: the chart rides inside the scroll window; the tooltip clamp keeps the
  // hover card within the visible strip. Plain 12-month charts render bare — no wrapper.
  return scroll ? (
    <Box sx={{ position: 'relative', height: height + 12 }}>
      <Box
        ref={tooltipScrollRef}
        sx={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden', ...thinScrollbarSx(theme) }}
      >
        {chart}
      </Box>
    </Box>
  ) : (
    <Box ref={tooltipScrollRef}>{chart}</Box>
  )
}
