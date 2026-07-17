'use client'

/*
 * "Attention signals" band on the Medical Overview — V5.1 spotlight design (user-picked from the
 * sigband_1–5 mockups): the CRITICAL signals live in a red "Act now" zone on the left — the only
 * severity color on the band; every other non-zero signal is a quiet neutral row on the right,
 * rows stretched to fill the spotlight's height so both sides read as one aligned block.
 * Zero signals renders a single quiet all-clear strip. Click → SignalDrawer.
 */
import React from 'react'
import { Box, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { SectionCard } from 'src/views/pages/species-management/detail2/detailUi'
import type { HealthSignal } from './signals'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

/** One quiet row on the right side — neutral teal chip, bold count inline before the label. */
const QuietRow: React.FC<{ sig: HealthSignal; last: boolean; onOpen: (s: HealthSignal) => void }> = ({
  sig,
  last,
  onOpen
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      onClick={() => onOpen(sig)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        py: 3,
        px: 1,
        borderBottom: last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        cursor: 'pointer',
        '&:hover': { backgroundColor: c.Surface }
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: '9px',
          backgroundColor: c.displaybgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon icon={sig.icon} fontSize={16} color={c.OnPrimaryContainer} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          <Box component='span' sx={{ fontSize: '15px', fontWeight: 800, mr: 1.5, fontVariantNumeric: 'tabular-nums' }}>
            {sig.count.toLocaleString()}
          </Box>
          {sig.label}
        </Typography>
        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: '2px' }} noWrap>
          {sig.hint}
        </Typography>
      </Box>
      <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} style={{ flexShrink: 0 }} />
    </Box>
  )
}

const SignalsBand: React.FC<{ signals: HealthSignal[]; onOpen: (s: HealthSignal) => void }> = ({ signals, onOpen }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const live = signals.filter(s => s.count > 0)
  const urgent = live.filter(s => s.severity === 'critical')
  const quiet = live.filter(s => s.severity !== 'critical')

  return (
    <SectionCard title='Attention signals' titleMb={3.5}>
      {live.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: urgent.length && quiet.length ? '340px 1fr' : '1fr' },
            gap: 5
          }}
        >
          {/* ── Act now spotlight — the only severity color on the band ── */}
          {urgent.length > 0 && (
            <Box sx={{ backgroundColor: c.BgTeritary, borderRadius: '14px', p: 4.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: c.Tertiary }}>
                <Icon icon='mdi:alarm-light-outline' fontSize={15} />
                <Typography
                  sx={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}
                >
                  Act now · {urgent.length}
                </Typography>
              </Box>
              {urgent.map(sig => (
                <Box
                  key={sig.key}
                  onClick={() => onOpen(sig)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 3,
                    mt: 3,
                    p: 3.5,
                    borderRadius: '10px',
                    backgroundColor: alpha(theme.palette.common.white, 0.72),
                    cursor: 'pointer',
                    transition: 'background .12s ease',
                    '&:hover': { backgroundColor: theme.palette.common.white }
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '22px',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: c.Tertiary,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {sig.count.toLocaleString()}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: c.OnSurfaceVariant }}>
                      {sig.label}
                    </Typography>
                    <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: '3px', lineHeight: 1.45 }}>
                      {sig.hint}
                    </Typography>
                  </Box>
                  <Icon
                    icon='mdi:chevron-right'
                    fontSize={16}
                    color={c.Tertiary}
                    style={{ flexShrink: 0, alignSelf: 'center' }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* ── everything else — quiet neutral rows, stretched to match the spotlight height ── */}
          {quiet.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                columnGap: 10,
                gridAutoRows: '1fr'
              }}
            >
              {quiet.map((sig, i) => (
                <QuietRow
                  key={sig.key}
                  sig={sig}
                  // last row per column: no divider under the bottom two
                  last={i >= quiet.length - 2}
                  onOpen={onOpen}
                />
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 3,
            borderRadius: '8px',
            backgroundColor: c.Surface,
            border: `1px solid ${c.SurfaceVariant}`
          }}
        >
          <Icon icon='mdi:check-circle-outline' fontSize={20} color={theme.palette.primary.dark} />
          <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }}>
            No active health signals in this window.
          </Typography>
        </Box>
      )}
    </SectionCard>
  )
}

export default SignalsBand
