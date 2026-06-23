'use client'

import React, { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { AnimalRecord, HousingEnclosure, HousingSite, SpeciesHousing } from 'src/types/species-management/detail'
import { DistributionBarChart, EmptyState, StatTile, StatusChip, SectionCard, TileGrid } from 'src/views/pages/species-management/detail/detailUi'

const toneForType = (type: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const t = type.toLowerCase()
  if (t.includes('breeding ready')) return 'success'
  if (t.includes('needs sexing') || t.includes('unsexed') || t.includes('mixed')) return 'warning'
  if (t.includes('male')) return 'info'
  if (t.includes('female')) return 'error'

  return 'neutral'
}

interface HousingTabProps {
  housing?: SpeciesHousing
  animals?: AnimalRecord[]
}

const HousingTab: React.FC<HousingTabProps> = ({ housing, animals = [] }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [drill, setDrill] = useState<{ site: string; enclosure?: string } | null>(null)

  const drillAnimals = useMemo(
    () =>
      drill
        ? animals.filter(a => a.site === drill.site && (drill.enclosure ? a.enclosure === drill.enclosure : true))
        : [],
    [animals, drill]
  )

  if (!housing || !housing.sites?.length) return <EmptyState message='No site or enclosure data available' />

  const encHead = ['Enclosure', 'Section', 'M', 'F', 'U', 'Total', 'Pairs', 'Type']

  const renderEnclosureTable = (site: HousingSite) => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {encHead.map(h => (
              <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {site.enclosures.map((enc: HousingEnclosure, i) => (
            <TableRow
              key={i}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => setDrill({ site: site.name, enclosure: enc.name })}
            >
              <TableCell>
                <Typography variant='body2' sx={{ fontWeight: 500, color: cc.OnSurfaceVariant }}>
                  {enc.name}
                </Typography>
              </TableCell>
              <TableCell>{enc.section || '-'}</TableCell>
              <TableCell>{enc.male}</TableCell>
              <TableCell>{enc.female}</TableCell>
              <TableCell>{enc.unsexed}</TableCell>
              <TableCell>{enc.total}</TableCell>
              <TableCell>{enc.pairs}</TableCell>
              <TableCell>
                <StatusChip label={enc.type} tone={toneForType(enc.type)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='Sites' value={housing.nSites} tone='primary' />
        <StatTile label='Enclosures' value={housing.nEncl} tone='primary' />
        <StatTile label='Pairs' value={housing.nPairs} tone='success' />
        <StatTile label='Paired Encl.' value={housing.pairedEncl} tone='success' />
        <StatTile label='Single-sex Encl.' value={housing.maleOnlyEncl + housing.femaleOnlyEncl} tone='error' />
        <StatTile label='Needs Sexing' value={housing.unsexedOnlyEncl + housing.mixedEncl} tone='warning' />
      </TileGrid>

      {housing.sites.length > 1 && (
        <SectionCard title='Animals by Site'>
          <DistributionBarChart
            data={housing.sites.map(s => ({ label: s.name, count: s.total }))}
            tone='primary'
            onSelect={label => setDrill({ site: label })}
          />
        </SectionCard>
      )}

      {housing.sites.map((site, i) => (
        <Accordion key={i} disableGutters sx={{ borderRadius: '10px', border: `1px solid ${cc.SurfaceVariant}`, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<Icon icon='mdi:chevron-down' />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                {site.name}
              </Typography>
              <StatusChip label={`${site.total} animals`} tone='neutral' />
              <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                M {site.males} · F {site.females} · U {site.unsexed} · {site.enclosures.length} enclosures
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>{renderEnclosureTable(site)}</AccordionDetails>
        </Accordion>
      ))}

      {/* Animal drill-down drawer */}
      <Drawer
        anchor='right'
        open={!!drill}
        onClose={() => setDrill(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 4 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {drill?.enclosure || drill?.site}
            </Typography>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              {drill?.enclosure ? `${drill?.site} · ` : ''}
              {drillAnimals.length} animals
            </Typography>
          </Box>
          <IconButton onClick={() => setDrill(null)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        {drillAnimals.length ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {['Animal', 'Gender', 'ID Type', 'Ring', 'Chip', 'Age', 'Breed', 'Morph'].map(h => (
                    <TableCell key={h} sx={{ backgroundColor: cc.customTableHeaderBg, fontWeight: 600 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {drillAnimals.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.name || a.antzId}</TableCell>
                    <TableCell>{a.gender || '-'}</TableCell>
                    <TableCell>{a.idType || '-'}</TableCell>
                    <TableCell>{a.ring || '-'}</TableCell>
                    <TableCell>{a.chip || '-'}</TableCell>
                    <TableCell>{a.age || '-'}</TableCell>
                    <TableCell>{a.breed || '-'}</TableCell>
                    <TableCell>{a.morph || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState message='No animal records for this enclosure' />
        )}
      </Drawer>
    </Box>
  )
}

export default HousingTab
