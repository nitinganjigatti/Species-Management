'use client'

/*
 * Per-animal analyte trend — one repeated test on one animal, every completed reading
 * plotted over time (the "diabetes chart", user call 2026-09-02). Hand-rolled SVG per the
 * v2 chart standard: shaded reference band = the normal range, dots colored by result
 * (normal green / high-low coral), value labels on every point, two-line date labels
 * (dd MMM over bare 2-digit year — never an apostrophe). Occurrences are evenly spaced
 * (each test a slot, like month buckets); the real dates live on the axis.
 * Qualitative results never reach this chart — trend-only scope (user, 2026-09-02).
 */
import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { LabTestResult } from './lab'
import type { TestMeasure } from './lab'

export interface TrendPoint {
  date: string // ISO yyyy-mm-dd
  value: number
  result: LabTestResult
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const dateLines = (iso: string): [string, string] => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return [iso, '']

  return [`${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`, String(d.getFullYear()).slice(2)]
}

const fmtVal = (v: number, decimals: number) => v.toFixed(decimals)

const ResultTrendChart: React.FC<{ points: TrendPoint[]; measure: TestMeasure; height?: number }> = ({
  points,
  measure,
  height = 220
}) => {
  // container-measured width so the svg fills whatever card/sheet holds it
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setWidth(entries[0]?.contentRect.width ?? 0))
    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  const PAD = { l: 52, r: 20, t: 30, b: 40 } // symmetric breathing room — edge labels never clip
  const plotW = Math.max(0, width - PAD.l - PAD.r)
  const plotH = height - PAD.t - PAD.b

  // y domain: the reference band always in view, values padded 10%
  const vals = points.map(p => p.value)
  const rawLo = Math.min(measure.refLow, ...vals)
  const rawHi = Math.max(measure.refHigh, ...vals)
  const span = rawHi - rawLo || 1
  const lo = rawLo - span * 0.1
  const hi = rawHi + span * 0.1
  const y = (v: number) => PAD.t + plotH - ((v - lo) / (hi - lo)) * plotH
  const x = (i: number) => (points.length === 1 ? PAD.l + plotW / 2 : PAD.l + (i / (points.length - 1)) * plotW)

  const abnormal = (r: LabTestResult) => r === 'high' || r === 'low'
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')

  return (
    <Box ref={wrapRef} sx={{ width: '100%' }}>
      {width > 0 && (
        <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
          {/* reference band — the normal range */}
          <rect
            x={PAD.l}
            y={y(measure.refHigh)}
            width={plotW}
            height={Math.max(0, y(measure.refLow) - y(measure.refHigh))}
            fill={skin.TONE_SOFT.good}
            opacity={0.65}
          />
          {/* band edges, dashed + labeled with the range values */}
          {[measure.refHigh, measure.refLow].map(v => (
            <g key={v}>
              <line x1={PAD.l} x2={PAD.l + plotW} y1={y(v)} y2={y(v)} stroke={skin.TRACK} strokeDasharray='4 4' />
              <text
                x={PAD.l - 8}
                y={y(v) + 4}
                textAnchor='end'
                fontSize={12}
                fontWeight={600}
                fill={skin.FAINT}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmtVal(v, measure.decimals)}
              </text>
            </g>
          ))}

          {/* the trend line */}
          {points.length > 1 && <polyline points={line} fill='none' stroke={skin.CARD_ID_INK} strokeWidth={2} strokeLinejoin='round' />}

          {/* readings — dot per test, value label above, two-line date below */}
          {points.map((p, i) => {
            const bad = abnormal(p.result)
            const [dl1, dl2] = dateLines(p.date)

            return (
              <g key={`${p.date}-${i}`}>
                <circle cx={x(i)} cy={y(p.value)} r={5} fill={bad ? skin.CORAL : skin.ACCENT_FILL} stroke='#ffffff' strokeWidth={2} />
                <text
                  x={x(i)}
                  y={y(p.value) - 12}
                  textAnchor='middle'
                  fontSize={12}
                  fontWeight={bad ? 700 : 600}
                  fill={bad ? skin.CORAL : skin.INK2}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmtVal(p.value, measure.decimals)}
                </text>
                <text x={x(i)} y={PAD.t + plotH + 18} textAnchor='middle' fontSize={12} fill={skin.FAINT}>
                  {dl1}
                </text>
                <text x={x(i)} y={PAD.t + plotH + 33} textAnchor='middle' fontSize={12} fill={skin.FAINT}>
                  {dl2}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {/* what the numbers are + what the band means — the chart's one caption */}
      <Typography variant='caption' sx={{ color: skin.FAINT, display: 'block', mt: 1 }}>
        {measure.measure} in {measure.unit} · shaded band = normal range
      </Typography>
    </Box>
  )
}

export default ResultTrendChart
