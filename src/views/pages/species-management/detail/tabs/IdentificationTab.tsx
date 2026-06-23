'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SpeciesIdentification } from 'src/types/species-management/detail'
import {
  EmptyState,
  MiniBarRow,
  SectionCard,
  StackedBar,
  StatusChip
} from 'src/views/pages/species-management/detail/detailUi'

const TONES = ['primary', 'info', 'warning', 'error', 'success', 'neutral'] as const

const IdentificationTab: React.FC<{ ident?: SpeciesIdentification }> = ({ ident }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  if (!ident || !ident.idTypes?.length) return <EmptyState message='No identification data available' />

  const total = ident.total || ident.idTypes.reduce((s, t) => s + t.count, 0)
  const max = Math.max(1, ...ident.idTypes.map(t => t.count))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionCard title='Identification Methods'>
        <Box sx={{ mb: 3 }}>
          <StackedBar
            segments={ident.idTypes.map((t, i) => ({ label: t.type, value: t.count, tone: TONES[i % TONES.length] }))}
          />
        </Box>
        {ident.idTypes
          .slice()
          .sort((a, b) => b.count - a.count)
          .map((t, i) => (
            <MiniBarRow
              key={i}
              label={t.type}
              value={t.count}
              max={max}
              tone={TONES[i % TONES.length]}
              trailing={`${t.count} · ${total ? Math.round((t.count / total) * 100) : 0}%`}
            />
          ))}
      </SectionCard>

      {ident.siteCoverage && ident.siteCoverage.length > 0 && (
        <SectionCard title='Site-wise ID Coverage'>
          {ident.siteCoverage.map((s, i) => {
            const tone = s.pct >= 80 ? 'success' : s.pct >= 40 ? 'warning' : 'error'
            const label = s.pct >= 80 ? 'Good' : s.pct >= 40 ? 'Partial' : 'Low'

            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.75 }}>
                <Typography variant='body2' sx={{ width: 180, color: cc.OnSurfaceVariant }} noWrap>
                  {s.site}
                </Typography>
                <Box sx={{ flex: 1, height: 8, borderRadius: '4px', backgroundColor: cc.SurfaceVariant }}>
                  <Box
                    sx={{
                      width: `${Math.min(100, s.pct)}%`,
                      height: '100%',
                      borderRadius: '4px',
                      backgroundColor:
                        tone === 'success' ? theme.palette.primary.main : tone === 'warning' ? cc.Tertiary : cc.Tertiary
                    }}
                  />
                </Box>
                <Typography variant='caption' sx={{ width: 44, textAlign: 'right', color: cc.neutralSecondary }}>
                  {Math.round(s.pct)}%
                </Typography>
                <StatusChip label={label} tone={tone} />
              </Box>
            )
          })}
        </SectionCard>
      )}
    </Box>
  )
}

export default IdentificationTab
