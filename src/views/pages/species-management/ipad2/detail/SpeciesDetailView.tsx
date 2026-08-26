'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Box, Card, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import type { SpeciesDetailHeader, SpeciesDetailTab } from 'src/types/species-management/detail'
import { StatusChip } from 'src/views/pages/species-management/ipad2/detail/detailUi'

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
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const h = header

  // Tab layout: 'rail' (sticky left rail, default) or 'horizontal' (current top bar). Persisted.
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

  // Band 1 — species stat band (Animals + sex-composition bar + housing/coverage)
  const m = h?.males ?? 0
  const f = h?.females ?? 0
  const mfTotal = m + f
  const malePct = mfTotal > 0 ? (m / mfTotal) * 100 : 0
  const femalePct = mfTotal > 0 ? (f / mfTotal) * 100 : 0
  const ratioStr =
    h?.sexRatio ||
    (m > 0 && f > 0 ? (m <= f ? `1 : ${(f / m).toFixed(1)}` : `${(m / f).toFixed(1)} : 1`) : '—')

  const wLabel = 'rgba(255, 255, 255, 0.70)'
  const wFaint = 'rgba(255, 255, 255, 0.13)'
  const lblSx = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: wLabel }
  const numSx = { fontSize: '24px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }

  // Circular progress ring (track + green fill) for percentage stats.
  const Ring: React.FC<{ pct: number }> = ({ pct }) => {
    const size = 40
    const stroke = 4
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const clamped = Math.max(0, Math.min(100, pct))
    return (
      <Box component='svg' viewBox={`0 0 ${size} ${size}`} sx={{ width: size, height: size, flexShrink: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='rgba(255,255,255,0.16)' strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke={cc.PrimaryContainer}
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped / 100)}
        />
      </Box>
    )
  }

  // Compact mini stat strip for the sticky header.
  // Ratio lives WITH the sex counts (M · F · ratio = one section), housing after.
  const mini: ({ v: string; l: string; c: string } | { divider: true })[] = [
    { v: (h?.total ?? 0).toLocaleString(), l: 'animals', c: cc.PrimaryContainer },
    { divider: true },
    { v: m.toLocaleString(), l: 'M', c: cc.antzInfo60 },
    { v: f.toLocaleString(), l: 'F', c: cc.AntzTertiary },
    { v: ratioStr, l: 'ratio', c: theme.palette.warning.main },
    { divider: true },
    { v: (h?.sites ?? 0).toLocaleString(), l: 'sites', c: 'common.white' },
    { v: (h?.enclosures ?? 0).toLocaleString(), l: 'encl', c: 'common.white' }
  ]

  const trail: { label: string; value: string; green?: boolean; pct?: number }[] = [
    { label: 'Sites', value: (h?.sites ?? 0).toLocaleString() },
    { label: 'Enclosures', value: (h?.enclosures ?? 0).toLocaleString() },
    ...(typeof h?.sexedPct === 'number' ? [{ label: 'Sexed', value: `${h.sexedPct}%`, green: true, pct: h.sexedPct }] : []),
    ...(typeof h?.chippedPct === 'number' ? [{ label: 'Chipped', value: `${h.chippedPct}%`, green: true, pct: h.chippedPct }] : [])
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
  const toneColor = (t: 'high' | 'med') => (t === 'high' ? cc.Tertiary : theme.palette.warning.main)

  return (
    <Box>
      {/* Sticky top stack — zero-height sticky wrapper so it overlays content
          without ever reflowing it. Horizontal view: tabs pin whenever scrolled,
          compact header slides in above them on scroll-up. Rail view: the rail
          is already sticky, so only the scroll-up header applies. */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, height: 0 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: `1px solid ${cc.SurfaceVariant}`,
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(31,81,91,0.12)',
            overflow: 'hidden',
            // Hide via visibility+opacity, NOT a big translate: a translated bar parks in
            // the space above the wrapper's flow slot and stays visible on screen at load.
            ...(scrolled && (view === 'horizontal' || headerRevealed)
              ? { transform: 'translateY(0)', opacity: 1, visibility: 'visible' as const, pointerEvents: 'auto' as const }
              : { transform: 'translateY(-12px)', opacity: 0, visibility: 'hidden' as const, pointerEvents: 'none' as const }),
            transition: 'transform 0.25s ease, opacity 0.2s ease, visibility 0.25s'
          }}
        >
          {/* Compact header — back + name (left), mini stat strip (right). Collapses while scrolling down. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: headerRevealed ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.25s ease'
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
                  borderBottom: view === 'horizontal' ? `1px solid ${cc.SurfaceVariant}` : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0 }}>
                  <IconButton onClick={onBack} sx={{ p: 0.5, color: cc.OnSurfaceVariant }}>
                    <Icon icon='mdi:arrow-left' />
                  </IconButton>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='h5' sx={{ fontWeight: 700 }} noWrap>
                      {h?.commonName || `Species #${speciesId}`}
                    </Typography>
                    {h?.scientificName && (
                      <Typography variant='subtitle2' sx={{ fontStyle: 'italic', color: cc.neutralSecondary, display: 'block' }} noWrap>
                        {h.scientificName}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '30px', bgcolor: 'customColors.chatBubbleSent', borderRadius: '10px', px: '32px', py: '16px', flexWrap: 'wrap' }}>
                  {mini.map((s, i) =>
                    'divider' in s ? (
                      <Box key={i} sx={{ width: '1px', height: 26, bgcolor: wFaint }} />
                    ) : (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: s.c }}>
                          {s.v}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: wLabel }}>
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
            <TabsWithMenu
              tabs={TABS}
              selectedTab={activeTab}
              onTabChange={(_e, v) => onTabChange(v as SpeciesDetailTab)}
            />
          )}
        </Box>
      </Box>

      {/* Breadcrumb — on the plain background, above the card */}
      {(h?.class || h?.order || h?.family || h?.genus) && (
        <Typography variant='caption' sx={{ color: cc.neutralSecondary, display: 'block', mb: 2 }}>
          {[h?.class, h?.order, h?.family, h?.genus].filter(Boolean).join('  ›  ')}
        </Typography>
      )}

      <Card sx={{ mb: 4 }}>
        {/* Hero */}
        <Box sx={{ p: 5, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <IconButton onClick={onBack} sx={{ p: 0.5, ml: -1, color: cc.OnSurfaceVariant }}>
                <Icon icon='mdi:arrow-left' />
              </IconButton>
              <Box>
                <Typography variant='h5'>{h?.commonName || `Species #${speciesId}`}</Typography>
                {h?.scientificName && (
                  <Typography variant='subtitle2' sx={{ fontStyle: 'italic', color: cc.neutralSecondary }}>
                    {h.scientificName}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {h?.iucnStatus && (
                <StatusChip label={`IUCN: ${stripParen(h.iucnStatus)}`} tone='warning' fg={cc.Tertiary} size='medium' />
              )}
              {h?.citesAppendix && (
                <StatusChip label={`CITES: ${stripParen(h.citesAppendix)}`} tone='info' fg={cc.antzInfo60} size='medium' />
              )}
              {/* View toggle — horizontal tabs vs. side rail */}
              <Box sx={{ display: 'inline-flex', border: `1px solid ${cc.OutlineVariant}`, borderRadius: '8px', overflow: 'hidden', ml: 0.5 }}>
                {([['horizontal', 'mdi:view-sequential'], ['rail', 'mdi:view-split-vertical']] as const).map(([v, icon], i) => {
                  const on = view === v
                  return (
                    <Box
                      key={v}
                      onClick={() => changeView(v)}
                      title={v === 'rail' ? 'Side rail' : 'Horizontal tabs'}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.25,
                        py: 0.75,
                        cursor: 'pointer',
                        borderLeft: i ? `1px solid ${cc.OutlineVariant}` : 'none',
                        bgcolor: on ? cc.OnBackground : 'background.paper',
                        color: on ? theme.palette.primary.dark : cc.Outline,
                        transition: '0.15s'
                      }}
                    >
                      <Icon icon={icon} fontSize='1.15rem' />
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>

          {/* Band 1 — Stats (composition band) */}
          <Box
            sx={{
              mt: 3,
              bgcolor: 'customColors.chatBubbleSent',
              borderRadius: '12px',
              color: 'common.white',
              px: '24px',
              py: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Row 1 — Animals + sex composition */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
            {/* Animals */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <Typography sx={lblSx}>Animals</Typography>
              <Typography sx={{ ...numSx, color: 'customColors.PrimaryContainer' }}>
                {(h?.total ?? 0).toLocaleString()}
              </Typography>
            </Box>

            {/* Sex composition block */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <Box sx={{ width: `${malePct}%`, bgcolor: 'customColors.antzInfo60' }} />
                <Box sx={{ width: `${femalePct}%`, bgcolor: 'customColors.AntzTertiary' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'customColors.antzInfo60' }}>
                    {m.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: wLabel }}>Male</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'common.white' }}>
                    {(h?.unsexed ?? 0).toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: wLabel }}>Unsexed</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'customColors.AntzTertiary' }}>
                    {f.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: wLabel }}>Female</Typography>
                </Box>
              </Box>
            </Box>


            {/* Sex ratio — belongs with the sex composition */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <Typography sx={lblSx}>Sex Ratio</Typography>
              <Typography sx={{ ...numSx, color: 'common.white' }}>{ratioStr}</Typography>
            </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ height: '1px', bgcolor: wFaint }} />

            {/* Row 2 — trailing stats, aligned grid (3-up portrait, 5-up landscape) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: '16px', rowGap: '20px', alignItems: 'center' }}>
              {trail.map(s =>
                typeof s.pct === 'number' ? (
                  <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Ring pct={s.pct} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography sx={{ ...numSx, fontSize: '22px', color: 'customColors.PrimaryContainer' }}>
                        {s.value}
                      </Typography>
                      <Typography sx={lblSx}>{s.label}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box key={s.label} sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Typography sx={lblSx}>{s.label}</Typography>
                    <Typography sx={{ ...numSx, color: s.green ? 'customColors.PrimaryContainer' : 'common.white' }}>
                      {s.value}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Box>

        {/* Band 2 — Notifications & Alerts */}
        {alerts && alertChips.length > 0 && (
          <Box sx={{ px: 5, pb: 4 }}>
            <Box
              sx={{
                border: `1px solid ${cc.Tertiary}40`,
                bgcolor: `${cc.Tertiary}14`,
                borderRadius: '10px',
                px: 3.5,
                py: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Icon icon='mdi:bell-alert-outline' fontSize='1.35rem' color={cc.Tertiary} />
                  <Typography variant='subtitle1' sx={{ fontWeight: 700, color: cc.Tertiary }} noWrap>
                    Notifications &amp; Alerts
                  </Typography>
                </Box>
                {/* Single row — swipes horizontally when chips overflow (scrollbar hidden, touch-first) */}
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
                      gap: 1.25,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      bgcolor: 'background.paper',
                      border: `1px solid ${toneColor(c.tone)}40`,
                      borderRadius: '10px',
                      px: 2.25,
                      py: 1.25,
                      cursor: 'pointer',
                      transition: '0.15s',
                      '&:hover': { borderColor: toneColor(c.tone), boxShadow: `0 2px 8px ${toneColor(c.tone)}1F` }
                    }}
                  >
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: toneColor(c.tone), lineHeight: 1 }}>
                      {c.count}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: cc.OnSurfaceVariant }}>
                      {c.label}
                    </Typography>
                  </Box>
                ))}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Band 3 — Tabs (horizontal view only). The ref anchors the sticky-stack trigger. */}
        {view === 'horizontal' && (
          <Box ref={tabsAnchorRef}>
            <TabsWithMenu
              tabs={TABS}
              selectedTab={activeTab}
              onTabChange={(_e, v) => onTabChange(v as SpeciesDetailTab)}
            />
          </Box>
        )}
      </Card>

      {/* Active tab content */}
      {view === 'horizontal' ? (
        <Box sx={{ pb: 10 }}>{children}</Box>
      ) : (
        <Box sx={{ display: 'flex', gap: '24px', alignItems: 'flex-start', pb: 10 }}>
          {/* Sticky left tab rail */}
          <Box
            sx={{
              flex: '0 0 240px',
              width: 240,
              position: 'sticky',
              top: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              bgcolor: 'background.paper',
              border: `1px solid ${cc.SurfaceVariant}`,
              borderRadius: '10px',
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
                    fontSize: '14px',
                    fontWeight: on ? 600 : 500,
                    color: on ? theme.palette.primary.dark : cc.OnSurfaceVariant,
                    bgcolor: on ? cc.OnBackground : 'transparent',
                    borderLeft: `3px solid ${on ? theme.palette.primary.main : 'transparent'}`,
                    transition: '0.15s',
                    '&:hover': { bgcolor: on ? cc.OnBackground : cc.Surface }
                  }}
                >
                  <Icon
                    icon={TAB_ICONS[t.value] || 'mdi:circle-small'}
                    fontSize='1.25rem'
                    color={on ? theme.palette.primary.main : cc.Outline}
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
