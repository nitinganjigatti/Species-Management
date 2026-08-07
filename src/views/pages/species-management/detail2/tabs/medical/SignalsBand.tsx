'use client'

/*
 * Attention signals on the Medical Overview — V6 (2026-07-30 review): exactly three big
 * cards (repeat-sick, undiagnosed, severe), mobile-safe, no severity-zoned layout. Big
 * count + one-line hint + "View animals"; click → SignalDrawer. All three render even at
 * zero (a quiet confirmation), the whole band collapses to an all-clear strip only when
 * there is no clinical data at all.
 */
import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { HealthSignal } from './signals'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const BigCard: React.FC<{ sig: HealthSignal; onOpen: (s: HealthSignal) => void }> = ({ sig, onOpen }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const live = sig.count > 0

  return (
    <Box
      onClick={live ? () => onOpen(sig) : undefined}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: '10px',
        border: `1px solid ${c.SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 5,
        ...(live && {
          cursor: 'pointer',
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(31,81,91,0.12)',
            '& .sig-go': { backgroundColor: c.BgTeritary, color: c.Tertiary, borderColor: c.BgTeritary }
          }
        })
      }}
    >
      {live && (
        <Box
          className='sig-go'
          sx={{
            position: 'absolute',
            top: 18,
            right: 16,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${c.SurfaceVariant}`,
            backgroundColor: c.Surface,
            color: c.OnSurfaceVariant,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background .15s ease, color .15s ease'
          }}
        >
          <Icon icon='mdi:chevron-right' fontSize={20} />
        </Box>
      )}
      <Typography
        sx={{
          fontSize: '40px',
          fontWeight: 800,
          lineHeight: 1,
          color: live ? c.Tertiary : c.neutralSecondary,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {sig.count.toLocaleString()}
      </Typography>
      <Typography sx={{ fontSize: '18px', fontWeight: 700, color: c.OnSurfaceVariant, mt: 3 }}>{sig.label}</Typography>
      <Typography sx={{ fontSize: '16px', color: c.neutralSecondary, mt: 1, lineHeight: 1.5 }}>
        {live ? sig.hint : 'None in this window'}
      </Typography>
    </Box>
  )
}

const SignalsBand: React.FC<{ signals: HealthSignal[]; onOpen: (s: HealthSignal) => void }> = ({ signals, onOpen }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, alignItems: 'stretch' }}>
    {signals.map(sig => (
      <BigCard key={sig.key} sig={sig} onOpen={onOpen} />
    ))}
  </Box>
)

export default SignalsBand
