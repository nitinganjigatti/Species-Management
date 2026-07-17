'use client'

/*
 * "View all sites" sheet for the Insights → Site hotspots band. Every site ranked by the share
 * of its animals that fell sick, split into "Above the average" / "At or below the average"
 * sections. Row click hands the site back to the caller (which opens the site's sick-animal
 * sheet on top).
 */
import React, { useMemo, useState } from 'react'
import { Box, Drawer, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import {
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetSearch,
  SheetSection
} from 'src/views/pages/species-management/detail2/detailUi'
import type { InsightBarRow } from './signals'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const SiteRow: React.FC<{ row: InsightBarRow; hot: boolean; last: boolean; onClick: () => void }> = ({
  row,
  hot,
  last,
  onClick
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        py: 3,
        borderBottom: last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        cursor: 'pointer',
        '&:hover': { backgroundColor: c.Surface }
      }}
    >
      <Box sx={{ minWidth: 44, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: hot ? c.Tertiary : c.OnSurfaceVariant }}>
          {row.sickAnimals ?? 0}
        </Typography>
        <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', color: c.neutralSecondary }}>
          SICK
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {row.label}
        </Typography>
        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mt: '1px' }}>
          of {row.housed ?? 0} animals{hot && row.topCondition ? ` · leading condition ${row.topCondition}` : ''}
        </Typography>
      </Box>
      <Box
        component='span'
        sx={{
          px: 2.5,
          py: 0.5,
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
          backgroundColor: c.BgTeritary,
          color: c.Tertiary
        }}
      >
        {row.value}%
      </Box>
      <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} />
    </Box>
  )
}

const SitesSheet: React.FC<{
  open: boolean
  hotspots: InsightBarRow[]
  avg: number // collection-wide % of animals that fell sick
  sickTotal: number // distinct sick animals across the collection
  onClose: () => void
  onSite: (row: InsightBarRow) => void
}> = ({ open, hotspots, avg, sickTotal, onClose, onSite }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()

    return needle ? hotspots.filter(r => r.label.toLowerCase().includes(needle)) : hotspots
  }, [hotspots, q])

  const above = filtered.filter(r => r.value > avg)
  const below = filtered.filter(r => r.value <= avg)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, maxWidth: '100%' } }}
    >
      <Sheet>
        <SheetHeader
          title='All sites'
          icon='mdi:map-marker-radius'
          iconTone={{ bg: c.antzSecondaryBg, fg: theme.palette.secondary.dark }}
          stats={[
            { label: 'Sites', value: hotspots.length },
            { label: 'Sick animals', value: sickTotal },
            { label: 'Average', value: `${avg}%` }
          ]}
          onClose={onClose}
        />
        {hotspots.length > 8 && <SheetSearch value={q} onChange={setQ} placeholder='Search site…' />}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
          {above.length > 0 && (
            <SheetSection label={`Above the average · ${above.length}`} first>
              {above.map((r, i) => (
                <SiteRow key={r.label} row={r} hot last={i === above.length - 1} onClick={() => onSite(r)} />
              ))}
            </SheetSection>
          )}
          {below.length > 0 && (
            <SheetSection label={`At or below the average · ${below.length}`} first={!above.length}>
              {below.map((r, i) => (
                <SiteRow key={r.label} row={r} hot={false} last={i === below.length - 1} onClick={() => onSite(r)} />
              ))}
            </SheetSection>
          )}
          {!filtered.length && <SheetEmpty>No sites match.</SheetEmpty>}
        </Box>
      </Sheet>
    </Drawer>
  )
}

export default SitesSheet
