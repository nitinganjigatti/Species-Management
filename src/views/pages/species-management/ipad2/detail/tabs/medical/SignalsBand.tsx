'use client'

/*
 * Medical Overview stat strip — the listing StatBand anatomy verbatim (one white CC card,
 * full-height hairline dividers, 10px caps label over the 24px figure). Sick Right Now
 * leads, then the three attention signals. Counts wear CORAL (the critical-figure ink,
 * never the alarm red); zeros go quiet in the dash ink. Cell tap → SignalDrawer.
 * Replaces the old verdict headline + big-card band (2026-09-01 review).
 */
import React from 'react'
import { Box, Typography } from '@mui/material'
import * as skin from 'src/views/pages/species-management/ipad2/skin'

export interface SignalCell {
  key: string
  label: string
  count: number
  /** 'critical' (default) inks the figure CORAL; 'neutral' keeps the warm VALUE ink —
   *  for plain volume stats (doses given, animals treated) that aren't an alarm. */
  tone?: 'critical' | 'neutral'
  onOpen?: () => void
}

const SignalsBand: React.FC<{ cells: SignalCell[] }> = ({ cells }) => (
  <Box
    sx={{
      ...skin.cardSx,
      overflow: 'hidden',
      display: 'grid',
      gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`
    }}
  >
    {cells.map((cell, i) => {
      const live = cell.count > 0

      return (
        <Box
          key={cell.key}
          onClick={live ? cell.onOpen : undefined}
          sx={{
            px: '24px',
            py: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            borderLeft: i === 0 ? 'none' : `1px solid ${skin.HAIR}`,
            ...(live &&
              cell.onOpen && {
                cursor: 'pointer',
                ...skin.cardPressSx,
                '&:hover': { backgroundColor: skin.ROW_HOVER }
              })
          }}
        >
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: skin.FAINT
            }}
          >
            {cell.label}
          </Typography>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.6px',
              fontVariantNumeric: 'tabular-nums',
              color: !live ? skin.DASH_INK : cell.tone === 'neutral' ? skin.VALUE : skin.CORAL
            }}
          >
            {cell.count.toLocaleString()}
          </Typography>
        </Box>
      )
    })}
  </Box>
)

export default SignalsBand
