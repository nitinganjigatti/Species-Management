'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Divider,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import type { AnimalRecord, HousingSite, SpeciesHousing } from 'src/types/species-management/detail'
import { EmptyState, StatTile, StatusChip, SectionCard, TileGrid } from 'src/views/pages/species-management/detail/detailUi'

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
  const [selectedSite, setSelectedSite] = useState('')
  const [q, setQ] = useState('')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  const sites = housing?.sites || []
  const activeSiteName = selectedSite || sites[0]?.name || ''
  const site: HousingSite | undefined = sites.find(s => s.name === activeSiteName) || sites[0]

  const query = q.trim().toLowerCase()
  const enclosures = useMemo(() => {
    const all = site?.enclosures || []

    return query ? all.filter(e => `${e.name} ${e.section || ''} ${e.type || ''}`.toLowerCase().includes(query)) : all
  }, [site, query])

  useEffect(() => {
    setPm(p => ({ ...p, page: 0 }))
  }, [activeSiteName, query])

  const drillAnimals = useMemo(
    () =>
      drill
        ? animals.filter(a => a.site === drill.site && (drill.enclosure ? a.enclosure === drill.enclosure : true))
        : [],
    [animals, drill]
  )

  if (!housing || !sites.length) return <EmptyState message='No site or enclosure data available' />

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <Typography variant='body2' sx={{ color: color || cc.OnSurfaceVariant, fontWeight: weight }}>
      {v ?? '-'}
    </Typography>
  )
  const num = (field: string): GridColDef => ({
    width: 70,
    sortable: false,
    field,
    headerName: field === 'male' ? 'M' : field === 'female' ? 'F' : field === 'unsexed' ? 'U' : field,
    renderCell: (p: GridRenderCellParams) => txt(Number(p.row[field] || 0).toLocaleString(), undefined, 600)
  })
  const columns: GridColDef[] = [
    { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    { minWidth: 200, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    { width: 160, sortable: false, field: 'section', headerName: 'Section', renderCell: p => txt(p.row.section || '-') },
    num('male'),
    num('female'),
    num('unsexed'),
    { width: 80, sortable: false, field: 'total', headerName: 'Total', renderCell: p => txt(Number(p.row.total || 0).toLocaleString(), undefined, 600) },
    { width: 80, sortable: false, field: 'pairs', headerName: 'Pairs', renderCell: p => txt(Number(p.row.pairs || 0).toLocaleString(), undefined, 600) },
    { width: 200, sortable: false, field: 'type', headerName: 'Type', renderCell: p => <StatusChip label={p.row.type} tone={toneForType(p.row.type)} /> }
  ]

  const start = pm.page * pm.pageSize
  const rows = enclosures.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i, sl_no: start + i + 1 }))

  const search = (
    <TextField
      size='small'
      placeholder='Search enclosures…'
      value={q}
      onChange={e => setQ(e.target.value)}
      sx={{ width: 260, '& .MuiInputBase-root': { height: 44, bgcolor: theme.palette.background.paper } }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
    />
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

      {/* One section: searchable site picker + per-site stats + searchable paginated enclosure table */}
      <SectionCard>
        {/* searchable site picker (sites can run to dozens) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Site
          </Typography>
          <Autocomplete
            size='small'
            disableClearable
            options={sites.map(s => s.name)}
            value={activeSiteName}
            onChange={(_, v) => v && setSelectedSite(v as string)}
            getOptionLabel={name => {
              const s = sites.find(x => x.name === name)

              return s ? `${s.name} · ${s.total} animals` : (name as string)
            }}
            sx={{ minWidth: 320, '& .MuiInputBase-root': { bgcolor: theme.palette.background.paper } }}
            renderInput={params => <TextField {...params} placeholder='Search site…' />}
          />
        </Box>

        <Divider sx={{ borderColor: cc.SurfaceVariant, mb: 3 }} />

        {/* per-site stats — borderless strip, hairline dividers (no nested boxes) */}
        {site && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
            {[
              { label: 'Animals', value: site.total },
              { label: 'Male', value: site.males },
              { label: 'Female', value: site.females },
              { label: 'Unsexed', value: site.unsexed },
              { label: 'Enclosures', value: site.enclosures.length },
              { label: 'Pairs', value: site.pairs }
            ].map((it, i) => (
              <Box key={it.label} sx={{ flex: '1 1 120px', minWidth: 120, px: 2.5, py: 1, borderLeft: i ? `1px solid ${cc.SurfaceVariant}` : 'none' }}>
                <Typography variant='caption' sx={{ display: 'block', color: cc.neutralSecondary, textTransform: 'uppercase' }}>
                  {it.label}
                </Typography>
                <Typography variant='h5' sx={{ color: cc.OnSurface, mt: 0.5 }}>
                  {Number(it.value || 0).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: cc.SurfaceVariant, mb: 3 }} />

        {/* enclosures heading row — title left, search right */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            Enclosures · {enclosures.length.toLocaleString()}
          </Typography>
          {search}
        </Box>

        {enclosures.length ? (
          <CommonTable
            columns={columns}
            indexedRows={rows}
            total={enclosures.length}
            loading={false}
            paginationModel={pm}
            setPaginationModel={setPm}
            handleSortModel={() => {}}
            searchValue=''
            getRowHeight={() => 'auto'}
            onRowClick={(params: { row: { name: string } }) => setDrill({ site: activeSiteName, enclosure: params.row.name })}
            externalTableStyle={{
              // identical L/R padding on header AND cell (!important to beat the theme's slot styles)
              // so every column header lines up with the values beneath it
              '& .MuiDataGrid-cell': { paddingLeft: '20px !important', paddingRight: '16px !important', py: 1.5, display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-columnHeader': { paddingLeft: '20px !important', paddingRight: '16px !important' },
              '& .MuiDataGrid-row': { cursor: 'pointer' }
            }}
          />
        ) : (
          <EmptyState message='No enclosures match your search' />
        )}
      </SectionCard>

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
