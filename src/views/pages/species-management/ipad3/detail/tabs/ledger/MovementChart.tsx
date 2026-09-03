'use client'

// Ledger — Monthly Movement: the diverging additions/reductions columns. No kit primitive
// draws a two-direction column chart (BarColumns is single-direction), so this component
// COPIES the BarColumns grammar verbatim rather than inventing one: same slot/tap anatomy,
// same 52%-width centered bars, same gradient recipe (mixOverWhite ramp into the full
// accent AT THE AXIS — user call 2026-09-03: both directions anchor strong at the
// baseline and fade outward), same 11px value labels in the fill's deep-ink partner,
// same 12/11px two-line month/year axis, and the ONE standard tooltip (useChartTip).
// Reductions wear the ORANGE accent (customColors.Tertiary), not the coral/alarm red
// (user call 2026-09-03).

import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import { useChartTip, fmt } from 'src/views/pages/species-management/ipad3/marks'
import type { MonthBucket } from './ledger'

// play-on-scroll — the marks.tsx usePlay idiom (private there, restated locally)
function usePlay<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [play, setPlay] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
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

const UP_H = 128
const DOWN_H = 72

export const MovementChart: React.FC<{
  months: MonthBucket[]
  /** Reductions accent — pass theme customColors.Tertiary (no hardcoded hues here). */
  cutFill: string
  /** Cumulative view: tooltip drops the closing-stock row, titles say "· all years". */
  cumulative?: boolean
  onSelect?: (index: number) => void
}> = ({ months, cutFill, cumulative, onSelect }) => {
  const { ref, play } = usePlay<HTMLDivElement>()
  const { show, hide, node } = useChartTip()

  const upPeak = Math.max(...months.map(m => m.adds), 1)
  const downPeak = Math.max(...months.map(m => m.cuts), 1)
  const addFill = skin.ACCENT_FILL

  return (
    <Box ref={ref}>
      {/* legend — the two directions, nothing else (user call 2026-09-03) */}
      <Box sx={{ display: 'flex', gap: 5, mb: 3 }}>
        {[
          { label: 'Additions', fill: addFill },
          { label: 'Reductions', fill: cutFill }
        ].map(k => (
          <Box key={k.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: k.fill }} />
            <Typography sx={{ fontSize: '14px', color: skin.MUTED }}>{k.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ position: 'relative' }}>
        {/* the axis line the two directions grow from */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: UP_H,
            height: '1px',
            background: skin.mixOverWhite(skin.INK, 0.12)
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 2 }}>
          {months.map((m, i) => {
            const upH = Math.max(m.adds > 0 ? 4 : 0, (m.adds / upPeak) * (UP_H - 26))
            const downH = Math.max(m.cuts > 0 ? 4 : 0, (m.cuts / downPeak) * (DOWN_H - 26))
            const title = cumulative ? `${m.label} · all years` : `${m.label} ${m.year ? `20${m.year}` : ''}`.trim()
            const tip = (e: React.PointerEvent) =>
              show(e, title, [
                { label: 'Additions', value: `+${fmt(m.adds)}`, fill: addFill },
                { label: 'Reductions', value: `−${fmt(m.cuts)}`, fill: cutFill },
                ...(m.closing != null ? [{ label: 'Closing stock', value: fmt(m.closing) }] : [])
              ])

            return (
              <Box
                key={i}
                onPointerEnter={tip}
                onPointerDown={tip}
                onPointerMove={tip}
                onPointerLeave={hide}
                onClick={onSelect ? () => onSelect(i) : undefined}
                sx={{
                  position: 'relative',
                  maxWidth: 104,
                  flex: 1,
                  minWidth: 0,
                  ...(onSelect && {
                    cursor: 'pointer',
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: 'rgba(22,21,15,0.04)' }
                  })
                }}
              >
                {/* additions — grow up from the axis */}
                <Box sx={{ height: UP_H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {m.adds > 0 ? (
                    <>
                      <Typography
                        component='span'
                        sx={{
                          mb: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                          color: skin.strokeOf(addFill)
                        }}
                      >
                        +{fmt(m.adds)}
                      </Typography>
                      <Box
                        component='span'
                        sx={{
                          display: 'block',
                          width: '52%',
                          borderRadius: '4px 4px 0 0',
                          height: `${upH}px`,
                          background: `linear-gradient(180deg, ${skin.mixOverWhite(addFill, 0.58)} 0%, ${addFill} 100%)`,
                          transformOrigin: 'bottom',
                          transform: play ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform ${skin.DUR_REVEAL} ${skin.EASE}`,
                          transitionDelay: `${i * 40}ms`
                        }}
                      />
                    </>
                  ) : (
                    <Typography component='span' sx={{ mb: '4px', fontSize: '12px', color: skin.DASH_INK }}>
                      —
                    </Typography>
                  )}
                </Box>

                {/* reductions — grow down from the axis */}
                <Box sx={{ height: DOWN_H, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {m.cuts > 0 && (
                    <>
                      <Box
                        component='span'
                        sx={{
                          display: 'block',
                          width: '52%',
                          borderRadius: '0 0 4px 4px',
                          height: `${downH}px`,
                          background: `linear-gradient(180deg, ${cutFill} 0%, ${skin.mixOverWhite(cutFill, 0.42)} 100%)`,
                          transformOrigin: 'top',
                          transform: play ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform ${skin.DUR_REVEAL} ${skin.EASE}`,
                          transitionDelay: `${i * 40}ms`
                        }}
                      />
                      <Typography
                        component='span'
                        sx={{
                          mt: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                          color: skin.strokeOf(cutFill)
                        }}
                      >
                        −{fmt(m.cuts)}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* the standard two-line month / year axis */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography
                    component='span'
                    sx={{ display: 'block', fontSize: '12px', lineHeight: '16px', fontVariantNumeric: 'tabular-nums', color: skin.MUTED }}
                    noWrap
                  >
                    {m.label}
                  </Typography>
                  {m.year && (
                    <Typography
                      component='span'
                      sx={{ display: 'block', fontSize: '11px', lineHeight: '14px', fontVariantNumeric: 'tabular-nums', color: skin.FAINT }}
                      noWrap
                    >
                      {m.year}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
      {node}
    </Box>
  )
}

export default MovementChart
