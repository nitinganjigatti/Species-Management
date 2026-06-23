'use client'

import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SpeciesHousing } from 'src/types/species-management/detail'
import { EmptyState, SectionCard, StatTile, StatusChip, TileGrid } from 'src/views/pages/species-management/detail/detailUi'

/** Map an enclosure classification label to a readiness group + tone. */
const groupFor = (type: string): { group: 'Both Sexes' | 'Needs Sexing' | 'Single Sex'; tone: 'success' | 'warning' | 'error' } => {
  const t = type.toLowerCase()
  if (t.includes('breeding ready')) return { group: 'Both Sexes', tone: 'success' }
  if (t.includes('needs sexing') || t.includes('unsexed') || t.includes('mixed'))
    return { group: 'Needs Sexing', tone: 'warning' }

  return { group: 'Single Sex', tone: 'error' }
}

const PairingTab: React.FC<{ housing?: SpeciesHousing }> = ({ housing }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  const breakdown = useMemo(() => {
    const counts = new Map<string, { count: number; group: string; tone: 'success' | 'warning' | 'error' }>()
    let both = 0
    let sexing = 0
    let single = 0
    for (const site of housing?.sites || []) {
      for (const enc of site.enclosures) {
        const { group, tone } = groupFor(enc.type)
        if (group === 'Both Sexes') both++
        else if (group === 'Needs Sexing') sexing++
        else single++
        const cur = counts.get(enc.type) || { count: 0, group, tone }
        cur.count++
        counts.set(enc.type, cur)
      }
    }

    return {
      both,
      sexing,
      single,
      rows: Array.from(counts.entries())
        .map(([type, v]) => ({ type, ...v }))
        .sort((a, b) => b.count - a.count)
    }
  }, [housing])

  if (!housing || !housing.sites?.length) return <EmptyState message='No pairing data available' />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='Both Sexes Available' value={breakdown.both} sub='enclosures' tone='success' />
        <StatTile label='Sexing Required' value={breakdown.sexing} sub='enclosures' tone='warning' />
        <StatTile label='Single Sex Only' value={breakdown.single} sub='enclosures' tone='error' />
        <StatTile label='Total Pairs' value={housing.nPairs} tone='primary' />
      </TileGrid>

      <SectionCard title='Enclosure Readiness Breakdown'>
        {breakdown.rows.map((r, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: i < breakdown.rows.length - 1 ? `1px solid ${cc.SurfaceVariant}` : 'none'
            }}
          >
            <StatusChip label={r.type} tone={r.tone} />
            <Typography variant='body2' sx={{ fontWeight: 600, color: cc.OnSurfaceVariant }}>
              {r.count.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </SectionCard>
    </Box>
  )
}

export default PairingTab
