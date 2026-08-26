'use client'

// iPad 2 species detail shell — the CC SpeciesPage grammar. The hero is the ONE dark
// surface in the language: the emerald ramp with mint-white inks, no border, identity +
// lineage + glass standing pills, and the holding figures inside the same surface on a
// hairline grid. The tabs are ONE white track with a sliding emerald pill (never ten
// floating pills, never wrapping — the row scrolls). Our flows stay: rail/horizontal view
// toggle, the direction-aware sticky stack, alert chips, and all tab wiring.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { SpeciesDetailHeader, SpeciesDetailTab } from 'src/types/species-management/detail'

export interface DetailAlerts {
  up: number
  stable: number
  down: number
  overdue: number
  neverAssessed: number
  gained: number
  lost: number
  underMonitored: number
  thresholdMonths: number
}

interface SpeciesDetailViewProps {
  header?: SpeciesDetailHeader
  speciesId: string
  activeTab: SpeciesDetailTab
  onTabChange: (tab: SpeciesDetailTab) => void
  onBack: () => void
  showEggs?: boolean
  alerts?: DetailAlerts | null
  onAlertClick?: (key: string) => void
  children: React.ReactNode
}

/** Drop a trailing parenthetical, e.g. "Endangered (Very High Risk)" → "Endangered". */
const stripParen = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim()

const BASE_TABS: { labelKey: string; value: SpeciesDetailTab }[] = [
  { labelKey: 'Overview', value: 'overview' },
  { labelKey: 'Profile', value: 'profile' },
  { labelKey: 'Pairing', value: 'pairing' },
  { labelKey: 'Housing', value: 'housing' },
  { labelKey: 'Circle of Life', value: 'circle' },
  { labelKey: 'Assessments', value: 'assessments' },
  { labelKey: 'Medical', value: 'medical' },
  { labelKey: 'Hospital', value: 'hospital' },
  { labelKey: 'Lab Module', value: 'lab' },
  { labelKey: 'Identification', value: 'identification' },
  { labelKey: 'Breeds', value: 'breeds' }
]

const TAB_ICONS: Record<string, string> = {
  overview: 'mdi:view-dashboard-outline',
  profile: 'mdi:card-account-details-outline',
  pairing: 'mdi:heart-outline',
  housing: 'mdi:home-outline',
  circle: 'mdi:autorenew',
  assessments: 'mdi:clipboard-check-outline',
  medical: 'mdi:medical-bag',
  hospital: 'mdi:hospital-building',
  lab: 'mdi:flask-outline',
  identification: 'mdi:identifier',
  breeds: 'mdi:dna',
  eggs: 'mdi:egg-outline'
}

type TabView = 'rail' | 'horizontal'
const VIEW_STORAGE_KEY = 'speciesDetailTabView'
const LANDSCAPE = '@media (orientation: landscape)'

/* ── the CC tab strip — one white track, a sliding emerald pill ─────────────
   The active pill is ONE element that moves, not a background each tab paints
   for itself: eleven buttons toggling their own fill read as a flicker; one
   pill translating between them reads as "the selection moved". Measured off
   the active button in a layout effect so the first paint never slides;
   re-measured on tab change and resize. Scrolls, never wraps — a wrapped
   second row of tabs reads as a second, different control. */
const CCTabs: React.FC<{
  tabs: { labelKey: string; value: SpeciesDetailTab }[]
  active: SpeciesDetailTab
  onChange: (tab: SpeciesDetailTab) => void
}> = ({ tabs, active, onChange }) => {
  const btns = useRef(new Map<string, HTMLElement | null>())
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const el = btns.current.get(active)
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active, tabs])

  useEffect(() => {
    const remeasure = () => {
      const el = btns.current.get(active)
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }
    window.addEventListener('resize', remeasure)
    // A tab picked at the clipped end of the rail slides itself into view.
    btns.current.get(active)?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })

    return () => window.removeEventListener('resize', remeasure)
  }, [active])

  return (
    <Box
      role='tablist'
      sx={{
        position: 'relative',
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        p: '6px',
        boxShadow: skin.TAB_TRACK_INSET,
        // the partly-clipped last tab is the affordance that says there is more
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {pill && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '6px',
            bottom: '6px',
            left: `${pill.left}px`,
            width: `${pill.width}px`,
            borderRadius: '8px',
            backgroundColor: skin.HERO_MID,
            transition: `left 300ms ${skin.EASE}, width 300ms ${skin.EASE}`
          }}
        />
      )}
      {tabs.map(t => {
        const on = t.value === active

        return (
          <Box
            key={t.value}
            ref={(el: HTMLElement | null) => {
              btns.current.set(t.value, el)
            }}
            role='tab'
            aria-selected={on}
            onClick={() => onChange(t.value)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
              px: '16px',
              py: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '16px',
              fontWeight: 500,
              color: on ? '#ffffff' : '#55524a',
              ...skin.cardPressSx,
              transition: `transform ${skin.DUR_STD} ${skin.EASE}, color 300ms ${skin.EASE}`,
              // the emerald lives on the sliding pill — this paints only the frame
              // before the first measurement lands
              ...(on && !pill && { backgroundColor: skin.HERO_MID }),
              ...(!on && { '&:hover': { backgroundColor: '#f4f3ef' } })
            }}
          >
            <Icon
              icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
              fontSize='1.1rem'
              color={on ? skin.HERO_MINT : skin.ACCENT_INK}
            />
            {t.labelKey}
          </Box>
        )
      })}
    </Box>
  )
}

/* ── the hero's sprig — the only decoration the surface is allowed ──────────
   A thin branch fragment with a handful of small leaves, light ink at low
   opacity, pinned past a corner and clipped by the card. */
const Sprig: React.FC<{ sx?: object; opacity?: number; flip?: boolean }> = ({ sx, opacity = 0.12, flip }) => (
  <Box
    component='svg'
    viewBox='0 0 220 140'
    aria-hidden
    sx={{
      width: 220,
      height: 140,
      position: 'absolute',
      pointerEvents: 'none',
      userSelect: 'none',
      color: '#dff0e6',
      opacity,
      transform: flip ? 'scaleX(-1)' : undefined,
      ...sx
    }}
  >
    <g stroke='currentColor' strokeWidth={1.4} fill='none' strokeLinecap='round'>
      <path d='M10 134 Q 86 100 204 16' />
      <path d='M92 82 q 24 -2 40 12' />
      <path d='M146 46 q 20 -14 40 -14' />
    </g>
    <g fill='currentColor'>
      <path d='M58 112 q 0 -18 12 -26 q 4 16 -12 26 Z' />
      <path d='M96 86 q -2 -18 10 -27 q 5 16 -10 27 Z' />
      <path d='M132 60 q -2 -17 10 -25 q 4 15 -10 25 Z' />
      <path d='M124 92 q 16 -8 28 -2 q -12 12 -28 2 Z' />
      <path d='M168 40 q 14 -10 27 -7 q -9 13 -27 7 Z' />
      <path d='M176 26 q -1 -14 9 -21 q 3 13 -9 21 Z' />
    </g>
  </Box>
)

const SpeciesDetailView: React.FC<SpeciesDetailViewProps> = ({
  header,
  speciesId,
  activeTab,
  onTabChange,
  onBack,
  showEggs,
  alerts,
  onAlertClick,
  children
}) => {
  const h = header

  // Tab layout: 'rail' (sticky left rail, default) or 'horizontal' (top track). Persisted.
  const [view, setView] = useState<TabView>('rail')
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(VIEW_STORAGE_KEY) : null
    if (saved === 'horizontal' || saved === 'rail') setView(saved)
  }, [])
  const changeView = (v: TabView) => {
    setView(v)
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
  }

  // Sticky top stack, direction-aware: once the hero scrolls away (`scrolled`),
  // the tabs bar stays pinned; the compact name+stats header additionally
  // reveals on any upward scroll gesture (`headerRevealed`) and hides again on
  // downward scroll — the mobile-browser-toolbar pattern. Back at the top,
  // everything unpins (the in-flow hero is visible again).
  const [scrolled, setScrolled] = useState(false)
  const [headerRevealed, setHeaderRevealed] = useState(false)

  // Anchor on the in-flow tabs row (Band 3): the pinned stack engages exactly
  // when that row crosses the top of the viewport, so the sticky tabs take over
  // seamlessly. Rail view has no in-flow tabs row → fall back to the hero threshold.
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const anchor = tabsAnchorRef.current
      // y > 0 guard: at the very top nothing may pin, whatever the anchor measures
      // during first paint (fixes the pinned-tabs-on-fresh-load glitch).
      const past = y > 0 && (anchor ? anchor.getBoundingClientRect().top <= 0 : y > 220)
      setScrolled(past)
      if (!past) setHeaderRevealed(false)
      else if (y < lastY - 4) setHeaderRevealed(true)
      else if (y > lastY + 4) setHeaderRevealed(false)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const TABS = showEggs
    ? BASE_TABS.flatMap(t => (t.value === 'circle' ? [t, { labelKey: 'Eggs', value: 'eggs' as SpeciesDetailTab }] : [t]))
    : BASE_TABS

  // ── The holding, as CC states it: every figure filtered, not listed. ──
  const m = h?.males ?? 0
  const f = h?.females ?? 0
  // THE SEXES ARE NAMED IN THE VALUE — "1 M : 1.2 F" — so the ratio can be checked
  // and nobody "fixes" the order and silently inverts the fact. Dropped where
  // either sex is zero, because absence is not an assessment.
  const ratioStr = m > 0 && f > 0 ? `1 M : ${(f / m).toFixed(1)} F` : null

  const stats: { icon: string; label: string; value: string; sub?: string }[] = [
    { icon: 'mdi:paw', label: 'Animals', value: (h?.total ?? 0).toLocaleString() },
    ...(ratioStr ? [{ icon: 'mdi:layers-outline', label: 'Sex ratio', value: ratioStr }] : []),
    { icon: 'mdi:map-marker-outline', label: 'Sites', value: (h?.sites ?? 0).toLocaleString() },
    ...((h?.enclosures ?? 0) > 0
      ? [{ icon: 'mdi:cube-outline', label: 'Enclosures', value: (h?.enclosures ?? 0).toLocaleString() }]
      : []),
    ...(typeof h?.sexedPct === 'number'
      ? [
          {
            icon: 'mdi:shield-check-outline',
            label: 'Sexed',
            value: `${h.sexedPct}%`,
            sub: `${(m + f).toLocaleString()} of ${(h?.total ?? 0).toLocaleString()}`
          }
        ]
      : []),
    ...(typeof h?.chippedPct === 'number'
      ? [{ icon: 'mdi:barcode-scan', label: 'Chipped', value: `${h.chippedPct}%` }]
      : [])
  ]

  // The lineage, as far as the data has it — class › order › family › genus.
  // Assembled from whatever ranks are filled: a chain padded with dashes reads
  // as missing data where it is simply a shorter lineage.
  const lineage = [h?.class, h?.order, h?.family, h?.genus].filter(Boolean).join(' › ')

  // The IUCN pill's dot carries the Red List category's own published fill — the
  // sanctioned exception on a surface that otherwise stays in the green family.
  const iucnName = h?.iucnStatus ? stripParen(h.iucnStatus) : ''
  const iucnEntry = skin.RED_LIST.find(r => r.name === iucnName)

  // Compact mini stat strip for the sticky header — warm inks on white.
  // Ratio lives WITH the sex counts (M · F · ratio = one section), housing after.
  const mini: ({ v: string; l: string; c: string } | { divider: true })[] = [
    { v: (h?.total ?? 0).toLocaleString(), l: 'animals', c: skin.ACCENT_INK },
    { divider: true },
    { v: m.toLocaleString(), l: 'M', c: skin.VALUE },
    { v: f.toLocaleString(), l: 'F', c: skin.VALUE },
    ...(ratioStr ? [{ v: ratioStr, l: 'ratio', c: skin.VALUE }] : []),
    { divider: true },
    { v: (h?.sites ?? 0).toLocaleString(), l: 'sites', c: skin.VALUE },
    { v: (h?.enclosures ?? 0).toLocaleString(), l: 'encl', c: skin.VALUE }
  ]

  // Band 2 — alert chips (only those with a count)
  const alertChips = alerts
    ? [
        { key: 'overdue_assessment', label: 'overdue assessment', count: alerts.overdue, tone: 'high' as const },
        { key: 'never_assessed', label: 'never assessed', count: alerts.neverAssessed, tone: 'med' as const },
        { key: 'weight_gain', label: 'gained >10%', count: alerts.gained, tone: 'med' as const },
        { key: 'weight_loss', label: 'lost >10%', count: alerts.lost, tone: 'high' as const },
        { key: 'under_monitored', label: 'under-monitored', count: alerts.underMonitored, tone: 'med' as const }
      ].filter(c => c.count > 0)
    : []
  // On the emerald, severity is a MARK (the dot's fill) — the words stay in hero inks.
  const toneDot = (t: 'high' | 'med') => (t === 'high' ? skin.TONE_FILL.bad : skin.TONE_FILL.warn)

  const glassPillSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1.5,
    borderRadius: '999px',
    px: 3,
    py: 1,
    backgroundColor: skin.HERO_GLASS,
    color: skin.HERO_SOFT,
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const
  }

  return (
    <Box>
      {/* Sticky top stack — zero-height sticky wrapper so it overlays content
          without ever reflowing it. Horizontal view: tabs pin whenever scrolled,
          compact header slides in above them on scroll-up. Rail view: the rail
          is already sticky, so only the scroll-up header applies. */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, height: 0 }}>
        <Box
          sx={{
            bgcolor: '#ffffff',
            border: `1px solid ${skin.HAIR}`,
            borderRadius: skin.CARD_RADIUS,
            boxShadow: skin.SHADOW_RAISED,
            overflow: 'hidden',
            // Hide via visibility+opacity, NOT a big translate: a translated bar parks in
            // the space above the wrapper's flow slot and stays visible on screen at load.
            ...(scrolled && (view === 'horizontal' || headerRevealed)
              ? { transform: 'translateY(0)', opacity: 1, visibility: 'visible' as const, pointerEvents: 'auto' as const }
              : { transform: 'translateY(-12px)', opacity: 0, visibility: 'hidden' as const, pointerEvents: 'none' as const }),
            transition: `transform ${skin.DUR_STD} ${skin.EASE}, opacity ${skin.DUR_STD} ${skin.EASE}, visibility ${skin.DUR_STD}`
          }}
        >
          {/* Compact header — back + name (left), mini stat strip (right). Collapses while scrolling down. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: headerRevealed ? '1fr' : '0fr',
              transition: `grid-template-rows ${skin.DUR_STD} ${skin.EASE}`
            }}
          >
            <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 3,
                  py: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  borderBottom: view === 'horizontal' ? `1px solid ${skin.HAIR}` : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0 }}>
                  <IconButton onClick={onBack} sx={{ p: 0.5, color: skin.INK2 }}>
                    <Icon icon='mdi:arrow-left' />
                  </IconButton>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: skin.INK }} noWrap>
                      {h?.commonName || `Species #${speciesId}`}
                    </Typography>
                    {h?.scientificName && (
                      <Typography variant='body2' sx={{ fontStyle: 'italic', color: skin.FAINT, display: 'block' }} noWrap>
                        {h.scientificName}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', px: 2 }}>
                  {mini.map((s, i) =>
                    'divider' in s ? (
                      <Box key={i} sx={{ width: '1px', height: 26, bgcolor: skin.HAIR }} />
                    ) : (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                        <Typography sx={{ fontSize: '22px', fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: s.c }}>
                          {s.v}
                        </Typography>
                        <Typography
                          sx={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: skin.FAINT }}
                        >
                          {s.l}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Pinned tabs — horizontal view only (rail view keeps its own sticky rail) */}
          {view === 'horizontal' && (
            <Box sx={{ p: 2, '& > div': { boxShadow: 'none' } }}>
              <CCTabs tabs={TABS} active={activeTab} onChange={onTabChange} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── The hero — identity and holding as ONE composition, on one emerald surface.
          No border (a dark card on the sage separates itself); the shadow is the house
          lift. Every ink here is in the green family; nothing draws an outline. ── */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: skin.CARD_RADIUS,
          background: skin.HERO_RAMP,
          boxShadow: skin.HERO_SHADOW,
          p: 5,
          mb: 4
        }}
      >
        <Sprig sx={{ top: -16, right: -20 }} opacity={0.14} />
        <Sprig sx={{ bottom: -28, left: -20 }} opacity={0.1} flip />

        {/* Identity: back, the name once, binomial + lineage under it, the standing opposite. */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, minWidth: 0 }}>
            {/* Back — a soft glass square, no stroke, no fill heavier than glass. */}
            <Box
              onClick={onBack}
              aria-label='Back'
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '10px',
                cursor: 'pointer',
                backgroundColor: skin.HERO_GLASS,
                transition: `background-color ${skin.DUR_FAST} ${skin.EASE}`,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                '&:active': { backgroundColor: 'rgba(255,255,255,0.2)' },
                mt: 0.5
              }}
            >
              <Icon icon='mdi:arrow-left' fontSize='1.15rem' color={skin.HERO_SOFT} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: '26px', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.4px', color: skin.HERO_ON }}
                noWrap
              >
                {h?.commonName || `Species #${speciesId}`}
              </Typography>
              {h?.scientificName && (
                <Typography sx={{ fontSize: '16px', fontStyle: 'italic', color: skin.HERO_SOFT, mt: 0.5 }}>
                  {h.scientificName}
                </Typography>
              )}
              {lineage && (
                <Typography sx={{ fontSize: '14px', color: skin.HERO_MUTE, mt: 1 }}>{lineage}</Typography>
              )}
            </Box>
          </Box>

          {/* The published listings as glass pills; the view toggle rides with them. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
            {h?.iucnStatus && (
              <Box sx={glassPillSx} title={iucnName}>
                {iucnEntry && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: iucnEntry.fill,
                      boxShadow: iucnEntry.outline ? `inset 0 0 0 1px ${iucnEntry.outline}` : undefined
                    }}
                  />
                )}
                IUCN · {iucnEntry?.code || iucnName}
              </Box>
            )}
            {h?.citesAppendix && <Box sx={glassPillSx}>CITES · {stripParen(h.citesAppendix)}</Box>}

            {/* View toggle — horizontal tabs vs. side rail, as glass squares. */}
            <Box sx={{ display: 'inline-flex', gap: '2px', borderRadius: '10px', overflow: 'hidden' }}>
              {([['horizontal', 'mdi:view-sequential'], ['rail', 'mdi:view-split-vertical']] as const).map(([v, icon]) => {
                const on = view === v

                return (
                  <Box
                    key={v}
                    onClick={() => changeView(v)}
                    title={v === 'rail' ? 'Side rail' : 'Horizontal tabs'}
                    sx={{
                      width: 36,
                      height: 36,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: on ? 'rgba(255,255,255,0.3)' : skin.HERO_GLASS,
                      transition: `background-color ${skin.DUR_FAST} ${skin.EASE}`,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <Icon icon={icon} fontSize='1.1rem' color={on ? skin.HERO_MINT : skin.HERO_SOFT} />
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {/* The figures, inside the same surface — a hairline above them and hairlines
            between them, nothing heavier. Equal columns once there is room. */}
        <Box sx={{ position: 'relative', mt: 5, pt: 4, borderTop: `1px solid ${skin.HERO_HAIR}` }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              rowGap: 4,
              columnGap: 6,
              [LANDSCAPE]: { gridTemplateColumns: `repeat(${stats.length}, 1fr)`, columnGap: 0 }
            }}
          >
            {stats.map((s, i) => (
              <Box
                key={s.label}
                sx={{
                  minWidth: 0,
                  [LANDSCAPE]: i > 0 ? { borderLeft: `1px solid ${skin.HERO_HAIR}`, pl: 5, pr: 3 } : { pr: 3 }
                }}
              >
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '14px', color: skin.HERO_MUTE }}>
                  <Icon icon={s.icon} fontSize='0.95rem' color={skin.HERO_MINT} />
                  {s.label}
                </Typography>
                <Typography
                  sx={{ mt: 0.5, fontSize: '24px', fontWeight: 600, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: skin.HERO_ON }}
                >
                  {s.value}
                  {s.sub && (
                    <Box component='span' sx={{ ml: 1.5, fontSize: '12px', fontWeight: 400, color: skin.HERO_MUTE }}>
                      {s.sub}
                    </Box>
                  )}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Alerts, inside the same surface — glass pills on a hairline row, so the page
            does not stack a second white strip under the hero. Severity is the dot's
            fill; the words stay in the hero's own inks. Swipes when it overflows. */}
        {alerts && alertChips.length > 0 && (
          <Box
            sx={{
              position: 'relative',
              mt: 4,
              pt: 3.5,
              borderTop: `1px solid ${skin.HERO_HAIR}`,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: skin.HERO_MUTE
              }}
            >
              <Icon icon='mdi:bell-alert-outline' fontSize='1.05rem' color={skin.HERO_MINT} />
              Alerts
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flex: 1,
                minWidth: 0,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              }}
            >
              {alertChips.map(c => (
                <Box
                  key={c.key}
                  onClick={() => onAlertClick?.(c.key)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    borderRadius: '999px',
                    px: 3,
                    py: 1.25,
                    cursor: 'pointer',
                    backgroundColor: skin.HERO_GLASS,
                    transition: `background-color ${skin.DUR_FAST} ${skin.EASE}`,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' },
                    '&:active': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <Box sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', bgcolor: toneDot(c.tone) }} />
                  <Typography sx={{ fontSize: '15px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.HERO_ON, lineHeight: 1 }}>
                    {c.count}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: skin.HERO_SOFT }}>{c.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Band 3 — Tabs (horizontal view only). The ref anchors the sticky-stack trigger. */}
      {view === 'horizontal' && (
        <Box ref={tabsAnchorRef} sx={{ mb: 4 }}>
          <CCTabs tabs={TABS} active={activeTab} onChange={onTabChange} />
        </Box>
      )}

      {/* Active tab content */}
      {view === 'horizontal' ? (
        <Box sx={{ pb: 10 }}>{children}</Box>
      ) : (
        <Box sx={{ display: 'flex', gap: '24px', alignItems: 'flex-start', pb: 10 }}>
          {/* Sticky left tab rail — the white track, vertical; the active item is the
              same emerald pill the horizontal track slides. */}
          <Box
            sx={{
              flex: '0 0 240px',
              width: 240,
              position: 'sticky',
              top: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              ...skin.cardSx,
              p: 1.5
            }}
          >
            {TABS.map(t => {
              const on = t.value === activeTab

              return (
                <Box
                  key={t.value}
                  onClick={() => onTabChange(t.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    px: '14px',
                    py: '11px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: on ? 600 : 500,
                    color: on ? '#ffffff' : skin.INK2,
                    bgcolor: on ? skin.HERO_MID : 'transparent',
                    ...skin.cardPressSx,
                    transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}, color ${skin.DUR_FAST} ${skin.EASE}`,
                    '&:hover': { bgcolor: on ? skin.HERO_MID : '#f4f3ef' }
                  }}
                >
                  <Icon
                    icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
                    fontSize='1.2rem'
                    color={on ? skin.HERO_MINT : skin.ACCENT_INK}
                  />
                  {t.labelKey}
                </Box>
              )
            })}
          </Box>
          {/* Right content panel */}
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>{children}</Box>
        </Box>
      )}
    </Box>
  )
}

export default SpeciesDetailView
