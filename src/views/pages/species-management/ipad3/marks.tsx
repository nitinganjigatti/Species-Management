'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// iPad 3 CHART MARKS — faithful ports of the Command Centre's hand-rolled charts
// (command-centre-Naveen/src/v4/dashboard.tsx). Same geometry, same hue ladder,
// same gradients, same tooltip contract — translated from Tailwind to MUI sx.
// These replace ApexCharts on the iPad 3 surfaces so the marks are IDENTICAL to
// Naveen's, while the data and drill handlers stay ours.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import * as skin from 'src/views/pages/species-management/ipad3/skin'

export interface Slice {
  label: string
  value: number
  onSelect?: () => void
}

export const fmt = (n: number) => n.toLocaleString()

/* ── hue assignment (CC huesFor) ─────────────────────────────────────────────
   The chart order: primary green → sky → coral → gold → deep teal. "Absence"
   labels always take the held-back grey, never a slot in the ladder, and the
   ladder CLAMPS rather than wraps so two categories never share a hue. */
const ORDER = ['#37bd69', '#00afd6', '#fa6140', '#e4b819', '#00abab']
const ABSENT_FILL = '#afb6b5'
const ABSENT = /^(un(determined|sexed|known)|indeterminate|not recorded|unspecified)$/i

export function huesFor(labels: string[]): string[] {
  let next = 0

  return labels.map(l => (ABSENT.test(l.trim()) ? ABSENT_FILL : ORDER[Math.min(next++, ORDER.length - 1)]))
}

/** Cap a composition at the hues that can be told apart; fold the rest into "Other". */
export function foldTail(items: Slice[], max = 6): Slice[] {
  if (items.length <= max) return items
  const keep = items.slice(0, max - 1)
  const rest = items.slice(max - 1)

  return [...keep, { label: 'Other', value: rest.reduce((n, s) => n + s.value, 0) }]
}

/* ── play-on-scroll (CC usePlay) ────────────────────────────────────────────── */
function usePlay<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [play, setPlay] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlay(true)

      return
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setPlay(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)

    return () => io.disconnect()
  }, [])

  return { ref, play }
}

/* ── ribbon (CC Ribbon) ──────────────────────────────────────────────────────
   Segmented composition as one line — the atom of every part-to-whole mark.
   Segments carry a 2px gap (two adjacent steps otherwise read as one band) and
   a 0.8% sliver floor so a real but tiny part stays visible. Grows in on scroll,
   left-to-right, each segment 70ms behind the last. */
export function Ribbon({
  items,
  height = 10
}: {
  items: { label: string; value: number; color: string }[]
  height?: number
}) {
  const { ref, play } = usePlay<HTMLDivElement>()
  const total = items.reduce((n, i) => n + i.value, 0) || 1

  return (
    <Box ref={ref} aria-hidden sx={{ display: 'flex', width: '100%', gap: '2px', height }}>
      {items.map((it, i) => (
        <Box
          key={it.label}
          sx={{
            height: '100%',
            width: `${Math.max(0.8, (it.value / total) * 100)}%`,
            backgroundColor: it.color,
            transformOrigin: 'left',
            '&:first-of-type': { borderTopLeftRadius: '999px', borderBottomLeftRadius: '999px' },
            '&:last-of-type': { borderTopRightRadius: '999px', borderBottomRightRadius: '999px' },
            animation: play ? `ribbonGrowX ${skin.DUR_REVEAL} ${skin.EASE} both` : 'none',
            animationDelay: play ? `${i * 70}ms` : undefined,
            '@keyframes ribbonGrowX': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } }
          }}
        />
      ))}
    </Box>
  )
}

/* ── the one tooltip (CC ChartTip) ──────────────────────────────────────────
   Portalled to <body>, follows the pointer, 44px lift on touch / 12px on cursor,
   clamped to the window, flips under the pointer near the top edge. */
export interface TipRow {
  label: string
  value: string
  fill?: string
}

export function useChartTip() {
  const [tip, setTip] = useState<{ x: number; y: number; title: string; rows: TipRow[] } | null>(null)

  const show = (e: React.PointerEvent, title: string, rows: TipRow[]) => {
    setTip({ x: e.clientX, y: e.clientY, title, rows })
  }
  const hide = () => setTip(null)

  let node: React.ReactNode = null
  if (tip && typeof document !== 'undefined') {
    const lift = 12
    const maxW = Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 600) - 24)
    const below = tip.y < 96
    const left = Math.min(Math.max(tip.x - 60, 12), (typeof window !== 'undefined' ? window.innerWidth : 600) - maxW - 12)
    // THE platform tooltip anatomy (= detailUi trendTooltipHTML, user call 2026-09-05):
    // Surface-tinted header band + 16px dot rows — pies/bars read like the trend charts.
    node = createPortal(
      <Box
        sx={{
          position: 'fixed',
          left,
          top: below ? tip.y + lift : undefined,
          bottom: below ? undefined : `calc(100vh - ${tip.y - lift}px)`,
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: maxW,
          minWidth: 150,
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          overflow: 'hidden',
          p: 0,
          boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.14)'
        }}
      >
        <Box sx={{ px: '18px', py: '12px', backgroundColor: skin.TABLE_HEAD_BG, borderBottom: `1px solid ${skin.TRACK}` }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: skin.TABLE_HEAD_INK, lineHeight: 1.35 }}>{tip.title}</Typography>
        </Box>
        <Box sx={{ py: 1 }}>
          {tip.rows.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: '18px', py: 1 }}>
              {r.fill && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.fill, flexShrink: 0 }} />}
              <Typography sx={{ fontSize: '16px', color: skin.FAINT }}>{r.label}</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: skin.VALUE, ml: 'auto' }}>
                {r.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>,
      document.body
    )
  }

  return { show, hide, node }
}

/* ── columns (CC YearBars, generalised to any labels) ────────────────────────
   1-2-5 gridline ladder so lines land on countable numbers; gridlines are 1px
   divs (zero line darker); the WHOLE column slot is the tap/tip target; bars
   carry the house gradient (pale tip → full tone at the axis), 4px top radius,
   2px floor so a quiet slot is a mark rather than a gap. */
export function BarColumns({
  bars,
  fill = '#37bd69',
  fills,
  noun,
  height = 196,
  minSlot,
  smallLabels,
  valueLabels,
  onSelect
}: {
  bars: [string | number, number][]
  fill?: string
  /** Optional per-bar fills (semantic buckets — e.g. a BCS histogram); falls back to `fill`. */
  fills?: (string | undefined)[]
  noun: string
  height?: number
  /** When set, the chart scrolls horizontally with at least this many px per column. */
  minSlot?: number
  /** One point smaller axis labels — for charts that run two-up in a portrait row. */
  smallLabels?: boolean
  /** Print each bar's count above it (deep-ink partner of the fill); zeros stay silent. */
  valueLabels?: boolean
  onSelect?: (label: string | number, value: number) => void
}) {
  const { ref, play } = usePlay<HTMLDivElement>()
  const { show, hide, node } = useChartTip()

  if (!bars.length) {
    return (
      <Typography sx={{ py: 10, textAlign: 'center', fontSize: '14px', color: skin.FAINT }}>No {noun} recorded.</Typography>
    )
  }

  const peak = Math.max(...bars.map(([, v]) => v), 1)
  const raw = peak / 4
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)))
  const stepSize = (raw / mag <= 1 ? 1 : raw / mag <= 2 ? 2 : 5) * mag
  const top = Math.ceil(peak / stepSize) * stepSize
  const lines = Array.from({ length: Math.round(top / stepSize) + 1 }, (_, i) => i * stepSize)

  const body = (
    // pt keeps the TOP gridline's tick label inside the scroller — edge labels never clip.
    <Box sx={{ pl: '32px', pt: '12px', minWidth: minSlot ? `${bars.length * minSlot + 32}px` : undefined }}>
      <Box sx={{ position: 'relative', height, borderRadius: '8px' }}>
        {lines.map(v => (
          <Box
            key={v}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '1px',
              bottom: `${(v / top) * 100}%`,
              background: v === 0 ? skin.mixOverWhite(skin.INK, 0.12) : skin.HAIR
            }}
          >
            <Typography
              component='span'
              sx={{
                position: 'absolute',
                top: -8,
                left: -32,
                width: 24,
                textAlign: 'right',
                fontSize: '10px',
                lineHeight: '12px',
                fontVariantNumeric: 'tabular-nums',
                color: skin.FAINT
              }}
            >
              {v}
            </Typography>
          </Box>
        ))}

        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 2 }}>
          {bars.map(([label, v], i) => {
            const barFill = fills?.[i] ?? fill
            // Two-line axis labels ("Jan\n25") read as one phrase in the tip.
            const tip = (e: React.PointerEvent) => show(e, String(label).replace('\n', ' '), [{ label: noun, value: fmt(v), fill: barFill }])

            return (
              <Box
                key={String(label)}
                onPointerEnter={tip}
                onPointerDown={tip}
                onPointerMove={tip}
                onPointerLeave={hide}
                onClick={onSelect ? () => onSelect(label, v) : undefined}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  height: '100%',
                  maxWidth: 104,
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  ...(onSelect && {
                    cursor: 'pointer',
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: 'rgba(22,21,15,0.04)' }
                  })
                }}
              >
                {valueLabels && v > 0 && (
                  <Typography
                    component='span'
                    sx={{
                      textAlign: 'center',
                      mb: '3px',
                      fontSize: '11px',
                      fontWeight: 700,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                      color: skin.strokeOf(barFill)
                    }}
                  >
                    {fmt(v)}
                  </Typography>
                )}
                <Box
                  component='span'
                  sx={{
                    display: 'block',
                    // the painted bar takes ~half the slot, centered — the slot stays the tap target
                    width: '52%',
                    mx: 'auto',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.max(2, (v / top) * 100)}%`,
                    background: `linear-gradient(180deg, ${skin.mixOverWhite(barFill, 0.58)} 0%, ${barFill} 100%)`,
                    transformOrigin: 'bottom',
                    transform: play ? 'scaleY(1)' : 'scaleY(0)',
                    transition: `transform ${skin.DUR_REVEAL} ${skin.EASE}`,
                    transitionDelay: `${i * 40}ms`
                  }}
                />
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', gap: 2 }}>
        {bars.map(([label]) => {
          // "Jan\n25" renders as two stacked lines — month first, year beneath — so
          // twelve slots keep breathing space instead of cramming "Jan 2025" on one line.
          const [line1, line2] = String(label).split('\n')

          return (
            <Box key={String(label)} sx={{ maxWidth: 104, flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Typography
                component='span'
                sx={{ display: 'block', fontSize: smallLabels ? '11px' : '12px', lineHeight: '16px', fontVariantNumeric: 'tabular-nums', color: skin.MUTED }}
                noWrap
              >
                {line1}
              </Typography>
              {line2 && (
                <Typography
                  component='span'
                  sx={{ display: 'block', fontSize: smallLabels ? '10px' : '11px', lineHeight: '14px', fontVariantNumeric: 'tabular-nums', color: skin.FAINT }}
                  noWrap
                >
                  {line2}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )

  return (
    <Box ref={ref}>
      {minSlot ? <Box sx={{ overflowX: 'auto', overflowY: 'hidden', pb: 1 }}>{body}</Box> : body}
      {node}
    </Box>
  )
}

/* ── donut / pie (CC Slices) ─────────────────────────────────────────────────
   inner=0 draws a pie. A 1.6° gap separates neighbours (never a stroke); each
   slice is graded pale→full down its face; the centre carries a word + reading. */
export function Slices({
  items,
  inner = 0.62,
  centre,
  size = 188,
  fills,
  onSelect
}: {
  items: Slice[]
  inner?: number
  centre?: [string, string]
  size?: number
  /** Explicit fills, for a scale whose colours mean something outside the hue ladder. */
  fills?: string[]
  onSelect?: (slice: Slice) => void
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const { ref, play } = usePlay<HTMLDivElement>()
  const { show, hide, node } = useChartTip()
  const total = items.reduce((n, s) => n + s.value, 0)
  const hues = fills ?? huesFor(items.map(s => s.label))
  if (!total) return null

  const R = size / 2
  const ro = R - 4
  const ri = inner ? ro * inner : 0
  const GAP = 1.6
  let at = -90

  const rad = (d: number) => (d * Math.PI) / 180
  const pt = (r: number, d: number): [number, number] => [R + r * Math.cos(rad(d)), R + r * Math.sin(rad(d))]

  return (
    <Box ref={ref} sx={{ display: 'grid', placeItems: 'center', py: 1 }}>
      <Box
        component='svg'
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role='img'
        sx={{
          overflow: 'visible',
          opacity: play ? 1 : 0,
          transform: play ? 'translateY(0)' : 'translateY(6px)',
          transition: `opacity ${skin.DUR_EMPH} ${skin.EASE}, transform ${skin.DUR_EMPH} ${skin.EASE}`
        }}
      >
        <defs>
          {items.map((s, i) => (
            <linearGradient key={s.label} id={`${uid}-g${i}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={skin.mixOverWhite(hues[i], 0.82)} />
              <stop offset='100%' stopColor={hues[i]} />
            </linearGradient>
          ))}
        </defs>
        {items.map((s, i) => {
          const sweep = (s.value / total) * 360
          const a = at + GAP / 2
          const b = at + sweep - GAP / 2
          at += sweep
          if (b <= a) return null
          const big = b - a > 180 ? 1 : 0
          const [x1, y1] = pt(ro, a)
          const [x2, y2] = pt(ro, b)
          const d = ri
            ? (() => {
                const [x3, y3] = pt(ri, b)
                const [x4, y4] = pt(ri, a)

                return `M${x1} ${y1}A${ro} ${ro} 0 ${big} 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 ${big} 0 ${x4} ${y4}Z`
              })()
            : `M${R} ${R}L${x1} ${y1}A${ro} ${ro} 0 ${big} 1 ${x2} ${y2}Z`
          const pct = Math.round((s.value / total) * 100)
          const tip = (e: React.PointerEvent) =>
            show(e, s.label, [{ label: `${pct}% of ${fmt(total)}`, value: fmt(s.value), fill: hues[i] }])

          return (
            <path
              key={s.label}
              d={d}
              fill={`url(#${uid}-g${i})`}
              style={onSelect || s.onSelect ? { cursor: 'pointer' } : undefined}
              onPointerEnter={tip}
              onPointerDown={tip}
              onPointerMove={tip}
              onPointerLeave={hide}
              onClick={() => (s.onSelect ? s.onSelect() : onSelect?.(s))}
            >
              <title>{`${s.label}: ${fmt(s.value)} (${pct}%)`}</title>
            </path>
          )
        })}
        {centre && (
          <>
            <text x={R} y={R - 6} textAnchor='middle' fontSize='12' fill={skin.FAINT}>
              {centre[0]}
            </text>
            <text
              x={R}
              y={R + 21}
              textAnchor='middle'
              fontSize='20'
              fontWeight='700'
              letterSpacing='-0.6'
              style={{ fontVariantNumeric: 'tabular-nums' }}
              fill={skin.VALUE}
            >
              {centre[1]}
            </text>
          </>
        )}
      </Box>
      {node}
    </Box>
  )
}

/** The key under a composition — always present (identity is never colour alone).
 *  With handlers it is also the chart's reliable big target. */
export function SliceKey({ items, onSelect }: { items: Slice[]; onSelect?: (slice: Slice) => void }) {
  const hues = huesFor(items.map(s => s.label))

  return (
    <Box component='ul' sx={{ m: 0, p: 0, mt: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 4, rowGap: 1.5, listStyle: 'none' }}>
      {items.map((s, i) => {
        const clickable = !!(s.onSelect || onSelect)

        return (
          <Box
            component='li'
            key={s.label}
            onClick={() => (s.onSelect ? s.onSelect() : onSelect?.(s))}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: '13px',
              lineHeight: '18px',
              color: skin.INK2,
              ...(clickable && { cursor: 'pointer', borderRadius: '8px', px: 1, ...skin.cardPressSx, '&:hover': { backgroundColor: '#f6f7f6' } })
            }}
          >
            <Box sx={{ width: 9, height: 9, flexShrink: 0, borderRadius: '2.5px', background: hues[i] }} />
            <span>
              {s.label}{' '}
              <Box component='b' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
                {fmt(s.value)}
              </Box>
            </span>
          </Box>
        )
      })}
    </Box>
  )
}

/* ── ranked list with a track (CC RankRows) ─────────────────────────────────
   Label · bold value · share (never "0%" — "<1%") over a 6px pill track; the
   bar grades along its own length in the chart green; hairline row separators. */
export function RankRows({
  rows,
  total,
  onOpen
}: {
  rows: { key: string; label: string; value: number; fill?: string; onOpen?: () => void }[]
  total: number
  onOpen?: (key: string) => void
}) {
  const { ref, play } = usePlay<HTMLUListElement>()
  const peak = Math.max(...rows.map(r => r.value), 1)

  return (
    <Box component='ul' ref={ref} sx={{ m: 0, p: 0, display: 'flex', flexDirection: 'column', listStyle: 'none' }}>
      {rows.map((r, i) => {
        const share = (r.value / Math.max(1, total)) * 100
        const clickable = !!(r.onOpen || onOpen)

        return (
          <Box
            component='li'
            key={r.key}
            onClick={() => (r.onOpen ? r.onOpen() : onOpen?.(r.key))}
            sx={{
              // no row dividers (2026-08-27 review) — the rhythm alone separates rows
              py: 2.5,
              ...(clickable && { cursor: 'pointer', ...skin.cardPressSx, mx: -2, px: 2, borderRadius: '10px', '&:hover': { backgroundColor: '#fcfcfb' } })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <Typography sx={{ minWidth: 0, flex: 1, fontSize: '14px', lineHeight: '20px', color: skin.INK }} noWrap>
                {r.label}
              </Typography>
              <Typography sx={{ flexShrink: 0, fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
                {fmt(r.value)}
              </Typography>
              <Typography sx={{ width: 44, flexShrink: 0, textAlign: 'right', fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: skin.FAINT }}>
                {share >= 1 ? `${Math.round(share)}%` : '<1%'}
              </Typography>
            </Box>
            <Box sx={{ mt: '7px', display: 'block', height: 6, overflow: 'hidden', borderRadius: '999px', background: skin.TRACK }}>
              <Box
                sx={{
                  height: '100%',
                  borderRadius: '999px',
                  width: `${Math.max(2, (r.value / peak) * 100)}%`,
                  background: `linear-gradient(90deg, ${r.fill ?? skin.ACCENT_FILL} 0%, ${skin.mixOverWhite(r.fill ?? skin.ACCENT_FILL, 0.72)} 100%)`,
                  transformOrigin: 'left',
                  transform: play ? 'scaleX(1)' : 'scaleX(0)',
                  transition: `transform ${skin.DUR_REVEAL} ${skin.EASE}`,
                  transitionDelay: `${i * 40}ms`
                }}
              />
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

/** Label / value rows (CC FactRows). */
export function FactRows({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map(r => (
        <Box
          key={r.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 3, borderBottom: `1px solid ${skin.HAIR}`, '&:last-of-type': { borderBottom: 'none' }, py: 2.5 }}
        >
          <Typography sx={{ flex: 1, fontSize: '14px', lineHeight: '20px', color: skin.MUTED }}>{r.label}</Typography>
          <Typography sx={{ textAlign: 'right', fontSize: '14px', fontWeight: 600, color: skin.VALUE }}>{r.value}</Typography>
        </Box>
      ))}
    </Box>
  )
}
