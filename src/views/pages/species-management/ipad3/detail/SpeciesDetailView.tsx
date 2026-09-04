'use client'

// iPad 3 species detail shell — the CC SpeciesPage grammar. The hero is the ONE dark
// surface in the language: the emerald ramp with mint-white inks, no border, identity +
// lineage + glass standing pills, and the holding figures inside the same surface on a
// hairline grid. The tabs are ONE white track with a sliding emerald pill (never ten
// floating pills, never wrapping — the row scrolls). Our flows stay: rail/horizontal view
// toggle, the direction-aware sticky stack, alert chips, and all tab wiring.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import {
  HERO_PHOTOS,
  Sheet,
  SheetDrawer,
  SheetHeader,
  SheetRow,
  SheetSearch,
  sheetPaperSx,
  SHEET_PX
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
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
  { labelKey: 'Ledger', value: 'ledger' },
  { labelKey: 'Population', value: 'population' },
  { labelKey: 'Enclosure Demographics', value: 'pairing' },
  { labelKey: 'Housing', value: 'housing' },
  { labelKey: 'Circle of Life', value: 'circle' },
  { labelKey: 'Assessments', value: 'assessments' },
  { labelKey: 'Medical', value: 'medical' },
  { labelKey: 'Hospital', value: 'hospital' },
  { labelKey: 'Lab Module', value: 'lab' },
  { labelKey: 'Mortality', value: 'mortality' },
  { labelKey: 'Necropsy', value: 'necropsy' }
]

const TAB_ICONS: Record<string, string> = {
  overview: 'mdi:view-dashboard-outline',
  profile: 'mdi:card-account-details-outline',
  ledger: 'mdi:notebook-outline',
  population: 'mdi:paw',
  pairing: 'mdi:heart-outline',
  housing: 'mdi:home-outline',
  circle: 'mdi:autorenew',
  assessments: 'mdi:clipboard-check-outline',
  medical: 'mdi:medical-bag',
  hospital: 'mdi:hospital-building',
  lab: 'mdi:flask-outline',
  mortality: 'mdi:grave-stone',
  necropsy: 'mdi:file-search-outline',
  eggs: 'mdi:egg-outline'
}

type TabView = 'rail' | 'horizontal'
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
  /** Opens the tab-navigator sheet — rendered as a STICKY first item so it stays reachable
   *  however far the rail is scrolled (user call 2026-09-02). */
  onMenu?: () => void
}> = ({ tabs, active, onChange, onMenu }) => {
  const btns = useRef(new Map<string, HTMLElement | null>())
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  // true once the rail is horizontally scrolled — tabs are sliding under the menu button
  const [railScrolled, setRailScrolled] = useState(false)

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
    // The mount-time measurement can land before the webfont swaps in, leaving the
    // pill narrower than the text it sits under — observe the active button so any
    // size change (font load included) re-syncs the pill.
    const el = btns.current.get(active)
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(remeasure) : null
    if (ro && el) ro.observe(el)
    // A tab picked at the clipped end of the rail slides itself into view.
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })

    return () => {
      window.removeEventListener('resize', remeasure)
      ro?.disconnect()
    }
  }, [active])

  return (
    <Box
      role='tablist'
      onScroll={e => setRailScrolled((e.target as HTMLElement).scrollLeft > 0)}
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
      {onMenu && (
        <Box
          onClick={onMenu}
          role='button'
          aria-label='All tabs'
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            px: '14px',
            mr: 1,
            cursor: 'pointer',
            // ::before is the button's real surface: it bleeds over the track's 6px padding
            // on every side, so the block runs edge-to-edge (no gap for tabs to peek
            // through) and carries the scrolled-under shadow once tabs slide beneath.
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -6,
              bottom: -6,
              left: -6,
              right: 0,
              zIndex: -1,
              backgroundColor: '#ffffff',
              borderRadius: '10px 0 0 10px',
              boxShadow: railScrolled ? '10px 0 12px -8px rgba(0,0,0,0.28)' : 'none',
              transition: `background-color ${skin.DUR_FAST} ${skin.EASE}, box-shadow ${skin.DUR_FAST} ${skin.EASE}`
            },
            '&:hover::before': { backgroundColor: '#f4f3ef' }
          }}
        >
          <Icon icon='mdi:menu' fontSize='1.25rem' color={skin.TAB_ICON_OFF} />
        </Box>
      )}
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
            backgroundColor: skin.TAB_PILL,
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
              // the pill fill lives on the sliding pill — this paints only the frame
              // before the first measurement lands
              ...(on && !pill && { backgroundColor: skin.TAB_PILL }),
              ...(!on && { '&:hover': { backgroundColor: '#f4f3ef' } })
            }}
          >
            <Icon
              icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
              fontSize='1.1rem'
              color={on ? skin.TAB_ICON_ON : skin.TAB_ICON_OFF}
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

  // iPad 3 keeps ONE tab layout: horizontal tabs, always. The rail view and its
  // toggle are retired here (iPad 1 still has both) — the TabView plumbing stays
  // so the rail can come back with one line if ever asked for.
  const view: TabView = 'horizontal'

  // Sticky top stack, direction-aware: once the hero scrolls away (`scrolled`),
  // the tabs bar stays pinned; the compact name+stats header additionally
  // reveals on any upward scroll gesture (`headerRevealed`) and hides again on
  // downward scroll — the mobile-browser-toolbar pattern. Back at the top,
  // everything unpins (the in-flow hero is visible again).
  const [scrolled, setScrolled] = useState(false)
  const [headerRevealed, setHeaderRevealed] = useState(false)

  // Tab-navigator sheet (menu button in the rail): all tabs, searchable, tap to jump.
  const [navOpen, setNavOpen] = useState(false)
  const [navQ, setNavQ] = useState('')
  const openNav = () => {
    setNavQ('')
    setNavOpen(true)
  }

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

  // Banner stat cells — THREE (user call 2026-08-28: sex counts moved to the tag row
  // below): Animals = antzNotes80 yellow, Site = PrimaryContainer green (inherited from
  // the retired sex cells), Enclosure = Secondary teal.
  const bannerCells: { label: string; value: string; color: string }[] = [
    { label: 'Animals', value: (h?.total ?? 0).toLocaleString(), color: skin.BANNER_YELLOW },
    { label: 'Site', value: (h?.sites ?? 0).toLocaleString(), color: skin.BANNER_GREEN },
    { label: 'Enclosure', value: (h?.enclosures ?? 0).toLocaleString(), color: skin.BANNER_TEAL }
  ]

  // Species with a real hero photo — everything else gets the antz logomark card.
  // Single copy in detailUi (the animal card's photo variant resolves there too).
  const heroPhoto = HERO_PHOTOS[String(speciesId)]

  // The IUCN pill's dot carries the Red List category's own published fill — the
  // sanctioned exception on a surface that otherwise stays in the green family.
  const iucnName = h?.iucnStatus ? stripParen(h.iucnStatus) : ''
  const iucnEntry = skin.RED_LIST.find(r => r.name === iucnName)

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
          {/* Compact header — back + name only (the mini stat strip was removed 2026-09-04,
              user call: the reveal shows identity + tabs, never stats). Collapses while scrolling down. */}
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
              </Box>
            </Box>
          </Box>

          {/* Pinned tabs — horizontal view only (rail view keeps its own sticky rail) */}
          {view === 'horizontal' && (
            <Box sx={{ p: 2, '& > div': { boxShadow: 'none' } }}>
              <CCTabs tabs={TABS} active={activeTab} onChange={onTabChange} onMenu={openNav} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── The hero BANNER — 1:1 port of Figma 23:371 (2026-08-27): photo card left,
          identity + semantic stat strip + one-line stats right, on its own gradient.
          Portrait scales the same layout down (photo/figures smaller), landscape is
          the Figma reference exactly. ── */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          // Banner radius = the photo card's radius exactly (user call 2026-08-31).
          borderRadius: '14px',
          background: skin.BANNER_GRAD,
          p: '24px',
          mb: 4,
          [LANDSCAPE]: { p: '32px', borderRadius: '16px' }
        }}
      >
        {/* Figma 23:471 — the species photo runs full-bleed BEHIND the banner, the
            gradient sits over it at 90% so the image only ghosts through. */}
        {heroPhoto && (
          <>
            <Box
              component='img'
              src={heroPhoto.src}
              alt=''
              aria-hidden
              // Per-photo vertical anchor so the animal's face lands mid-banner
              // (gazelle 38% — 50% showed only body, 22% overshot to the trees).
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPhoto.bgPos }}
            />
            <Box sx={{ position: 'absolute', inset: 0, background: skin.BANNER_GRAD_SCRIM }} />
          </>
        )}

        {/* Photo card — white ground, 40px radius, the Figma shadow, 40% scrim over
            the image. No-photo species carry the antz logomark on the deep green. */}
        <Box
          sx={{
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            backgroundColor: heroPhoto ? '#ffffff' : 'transparent',
            boxShadow: skin.BANNER_PHOTO_SHADOW,
            width: 212,
            height: 216,
            borderRadius: '14px',
            [LANDSCAPE]: { width: 284, height: 289, borderRadius: '16px' }
          }}
        >
          {heroPhoto ? (
            <>
              <Box
                component='img'
                src={heroPhoto.src}
                alt={h?.commonName || 'Species'}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </>
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                // no-photo card: a glass portrait — lighter tile of the banner's own
                // surface with a soft mint spotlight behind the logomark, so it carries
                // the same visual weight as a photo instead of punching a light hole.
                backgroundColor: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                backgroundImage: `radial-gradient(circle at 50% 44%, ${skin.HERO_MINT}59 0%, transparent 68%)`
              }}
            >
              <Box
                component='img'
                src='/images/branding/Antz_logomark_h_color.svg'
                alt=''
                // brightness(0) invert(1) renders the colored mark pure white on the glass
                sx={{ width: '52%', opacity: 0.95, filter: 'brightness(0) invert(1) drop-shadow(0 6px 18px rgba(0,0,0,0.30))' }}
              />
            </Box>
          )}
        </Box>

        {/* Right column — name row / stat strip / one-line stats */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            // Pinned to the photo's height (2026-08-31): the column used to run ~20px
            // taller (its own py + row heights), so it drove the banner height and the
            // centered photo picked up extra top/bottom space — the four insets only
            // read equal when the photo alone sets the banner's height.
            justifyContent: 'space-between',
            gap: '16px',
            height: 216,
            [LANDSCAPE]: { gap: '24px', height: 289 }
          }}
        >
          {/* Row 1 — name + binomial left, listing pills right */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              // pr 0 (2026-08-31): rows end on the banner padding itself so the right
              // inset equals the left/top/bottom (was padding+16 ≠ 24 everywhere else).
              pl: '16px',
              pr: 0,
              [LANDSCAPE]: { pl: '24px', pr: 0, height: 51 }
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 600, lineHeight: 'normal', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', [LANDSCAPE]: { fontSize: '24px' } }}>
                {h?.commonName || `Species #${speciesId}`}
              </Typography>
              {h?.scientificName && (
                <Typography sx={{ fontSize: '16px', fontWeight: 400, lineHeight: 'normal', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.scientificName}
                </Typography>
              )}
            </Box>
            {h?.iucnStatus && (
              <Box
                title={iucnName}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  flexShrink: 0,
                  px: '14px',
                  py: '8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  whiteSpace: 'nowrap'
                }}
              >
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
                <Typography sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 'normal', color: '#ffffff' }}>
                  IUCN · {iucnEntry?.code || iucnName}
                </Typography>
              </Box>
            )}
            {h?.citesAppendix && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  px: '14px',
                  py: '8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 'normal', color: '#ffffff' }}>
                  CITES · {stripParen(h.citesAppendix)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Stat strip — five equal cells, semantic figure inks, 16px radius clip */}
          <Box sx={{ pl: '16px', pr: '8px', [LANDSCAPE]: { pl: '24px', pr: '16px' } }}>
            <Box sx={{ display: 'flex', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
              {bannerCells.map((c, i) => (
                <Box
                  key={c.label}
                  sx={{
                    flex: '1 0 0',
                    minWidth: '1px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: skin.BANNER_CELL,
                    borderRight: i < bannerCells.length - 1 ? `1px solid ${skin.BANNER_CELL_HAIR}` : 'none',
                    height: 96,
                    px: '10px',
                    pt: '16px',
                    pb: '15px',
                    [LANDSCAPE]: { height: 122, px: '24px' }
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: 400, lineHeight: 'normal', color: '#ffffff', opacity: 0.78, [LANDSCAPE]: { fontSize: '16px' } }}>
                    {c.label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '28px', fontWeight: 700, lineHeight: 'normal', fontVariantNumeric: 'tabular-nums', color: c.color, [LANDSCAPE]: { fontSize: '36px' } }}
                  >
                    {c.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Tag row (user call 2026-08-28, replaces the one-line stats): Male · Female ·
              Unsexed (hidden at zero) · Chipped as LIGHT pills — the style the IUCN/CITES
              pills wore (swapped by user call: identity pills went glass, stats went light). */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', pl: '16px', pr: 0, [LANDSCAPE]: { pl: '24px', pr: 0 } }}>
            {(
              [
                { text: `M - ${m.toLocaleString()}`, color: skin.BANNER_TAG_MALE },
                { text: `F - ${f.toLocaleString()}`, color: skin.BANNER_TAG_FEMALE },
                ...((h?.total ?? 0) - m - f > 0
                  ? [{ text: `U - ${((h?.total ?? 0) - m - f).toLocaleString()}`, color: skin.BANNER_TAG_UNSEXED }]
                  : []),
                ...(typeof h?.chippedPct === 'number'
                  ? [
                      {
                        // 100% stands alone; anything less carries the (derived) head-count too.
                        text:
                          h.chippedPct >= 100
                            ? 'Chipped - 100%'
                            : `Chipped - ${h.chippedPct}% (${Math.round(((h?.total ?? 0) * h.chippedPct) / 100).toLocaleString()})`,
                        color: skin.INK2
                      }
                    ]
                  : [])
              ] as { text: string; color: string }[]
            ).map(t => (
              <Box
                key={t.text}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  px: '14px',
                  py: '7px',
                  borderRadius: '999px',
                  backgroundColor: skin.ROW_HOVER,
                  border: `1px solid ${skin.HAIR}`
                }}
              >
                <Typography sx={{ fontSize: '15px', fontWeight: 700, lineHeight: 'normal', fontVariantNumeric: 'tabular-nums', color: t.color }}>
                  {t.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Band 3 — Tabs (horizontal view only). The ref anchors the sticky-stack trigger. */}
      {view === 'horizontal' && (
        <Box ref={tabsAnchorRef} sx={{ mb: 4 }}>
          <CCTabs tabs={TABS} active={activeTab} onChange={onTabChange} onMenu={openNav} />
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
                    bgcolor: on ? skin.TAB_PILL : 'transparent',
                    ...skin.cardPressSx,
                    transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}, color ${skin.DUR_FAST} ${skin.EASE}`,
                    '&:hover': { bgcolor: on ? skin.TAB_PILL : '#f4f3ef' }
                  }}
                >
                  <Icon
                    icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
                    fontSize='1.2rem'
                    color={on ? skin.TAB_ICON_ON : skin.TAB_ICON_OFF}
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

      {/* Tab navigator — the rail's menu button opens every tab as a searchable list. */}
      <SheetDrawer open={navOpen} onClose={() => setNavOpen(false)} PaperProps={{ sx: sheetPaperSx('md') }}>
        <Sheet>
          {/* No leading icon chip — with one it reads as the first list item, not a header
              (user call 2026-09-02). Title + count line only. */}
          <SheetHeader title='All Tabs' stats={[{ label: 'Tabs', value: TABS.length }]} onClose={() => setNavOpen(false)} />
          <SheetSearch value={navQ} onChange={setNavQ} placeholder='Search tabs…' />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, mt: 1 }}>
            {TABS.filter(t => !navQ.trim() || t.labelKey.toLowerCase().includes(navQ.trim().toLowerCase())).map(
              (t, i, arr) => {
                const on = t.value === activeTab

                return (
                  <SheetRow
                    key={t.value}
                    icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
                    title={t.labelKey}
                    trailing={on ? <Icon icon='mdi:check-circle' fontSize='1.4rem' color={skin.ACCENT_FILL} /> : undefined}
                    last={i === arr.length - 1}
                    onClick={() => {
                      onTabChange(t.value)
                      setNavOpen(false)
                    }}
                  />
                )
              }
            )}
          </Box>
        </Sheet>
      </SheetDrawer>
    </Box>
  )
}

export default SpeciesDetailView
