'use client'

import React, { useMemo, useState } from 'react'
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { BreedRow, SpeciesBreeds } from 'src/types/species-management/detail'
import { EmptyState, SectionCard, StatTile, StatusChip, TileGrid } from 'src/views/pages/species-management/detail2/detailUi'

type BreedCat = 'all' | 'can_pair' | 'single' | 'needs_sexing'

const catFor = (b: BreedRow): Exclude<BreedCat, 'all'> => {
  if (b.male > 0 && b.female > 0) return 'can_pair'
  if (b.unsexed > 0 && b.male === 0 && b.female === 0) return 'needs_sexing'

  return 'single'
}

const STATUS: Record<Exclude<BreedCat, 'all'>, { label: string; tone: 'success' | 'error' | 'warning' }> = {
  can_pair: { label: 'Can Pair', tone: 'success' },
  single: { label: 'Single Sex', tone: 'error' },
  needs_sexing: { label: 'Needs Sexing', tone: 'warning' }
}

const BreedsTab: React.FC<{ breeds?: SpeciesBreeds }> = ({ breeds }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [filter, setFilter] = useState<BreedCat>('all')

  const list = breeds?.breeds || []

  const counts = useMemo(() => {
    const c = { all: list.length, can_pair: 0, single: 0, needs_sexing: 0 }
    for (const b of list) c[catFor(b)]++

    return c
  }, [list])

  const rows = useMemo(() => (filter === 'all' ? list : list.filter(b => catFor(b) === filter)), [list, filter])

  if (!list.length) return <EmptyState message='No breed data available' />

  const head = ['Breed', 'Animals', 'M', 'F', 'U', 'Sites', 'Encl', 'Status']

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='All Breeds' value={counts.all} tone='primary' onClick={() => setFilter('all')} />
        <StatTile label='Can Pair' value={counts.can_pair} tone='success' onClick={() => setFilter('can_pair')} />
        <StatTile label='Single Sex' value={counts.single} tone='error' onClick={() => setFilter('single')} />
        <StatTile label='Needs Sexing' value={counts.needs_sexing} tone='warning' onClick={() => setFilter('needs_sexing')} />
      </TileGrid>

      <SectionCard title={`Breeds (${rows.length})`}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                {head.map(h => (
                  <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((b, i) => {
                const s = STATUS[catFor(b)]

                return (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontWeight: 500, color: cc.OnSurfaceVariant }}>
                        {b.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{b.total.toLocaleString()}</TableCell>
                    <TableCell>{b.male}</TableCell>
                    <TableCell>{b.female}</TableCell>
                    <TableCell>{b.unsexed}</TableCell>
                    <TableCell>{b.sites}</TableCell>
                    <TableCell>{b.enclosures}</TableCell>
                    <TableCell>
                      <StatusChip label={s.label} tone={s.tone} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Box>
  )
}

export default BreedsTab
