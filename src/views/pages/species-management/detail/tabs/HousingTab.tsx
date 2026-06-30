'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Drawer, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import { AnimalCardList, DetailTable, EmptyState, StatusChip, SectionCard } from 'src/views/pages/species-management/detail/detailUi'

const ANIMAL_ICON = '/images/housing/species-icon-colored.svg'

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
  // Two stacked drill sheets: sheet 1 = a site's enclosures (table), sheet 2 = an enclosure's animals (cards).
  const [enclSheet, setEnclSheet] = useState<{ site: string } | null>(null)
  const [animalSheet, setAnimalSheet] = useState<{ site: string; enclosure: string } | null>(null)
  const [animalQ, setAnimalQ] = useState('')
  const [sheetPm, setSheetPm] = useState({ page: 0, pageSize: 10 })
  const [tableView, setTableView] = useState<'site' | 'enclosure'>('site')
  const [enclFilter, setEnclFilter] = useState<'all' | 'single' | 'male' | 'female' | 'unsexed'>('all')
  const [q, setQ] = useState('')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  const sites = housing?.sites || []
  const isSite = tableView === 'site'
  const query = q.trim().toLowerCase()

  // Site-wise rollup (one row per site) and the flat enclosure list (across all sites).
  const siteRows = useMemo(
    () =>
      sites.map(s => ({
        name: s.name,
        site: s.name,
        male: s.males,
        female: s.females,
        unsexed: s.unsexed,
        total: s.total,
        nEncl: s.enclosures.length,
        pairs: s.pairs
      })),
    [sites]
  )
  const allEnclosures = useMemo(
    () => sites.flatMap(s => (s.enclosures || []).map(e => ({ ...e, site: s.name }))),
    [sites]
  )

  // Composition filters. "Single Sexed" = exactly one of M/F/U present; Male/Female/Unsexed = only that sex.
  const matchEncl = (e: any) => {
    const m = Number(e.male) > 0
    const f = Number(e.female) > 0
    const u = Number(e.unsexed) > 0
    switch (enclFilter) {
      case 'single':
        return [m, f, u].filter(Boolean).length === 1
      case 'male':
        return m && !f && !u
      case 'female':
        return f && !m && !u
      case 'unsexed':
        return u && !m && !f
      default:
        return true
    }
  }

  const filtered = useMemo(() => {
    if (isSite) return query ? siteRows.filter(r => r.name.toLowerCase().includes(query)) : siteRows

    const list = enclFilter === 'all' ? allEnclosures : allEnclosures.filter(matchEncl)

    return query
      ? list.filter(e => `${e.name} ${e.section || ''} ${e.type || ''} ${e.site || ''}`.toLowerCase().includes(query))
      : list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSite, siteRows, allEnclosures, query, enclFilter])

  useEffect(() => {
    setPm(p => ({ ...p, page: 0 }))
  }, [tableView, query, enclFilter])

  // Sheet 1 — the enclosures within the picked site.
  const sheetEnclosures = useMemo(() => {
    if (!enclSheet) return []
    const s = sites.find(x => x.name === enclSheet.site)

    return (s?.enclosures || []).map(e => ({ ...e, site: enclSheet.site }))
  }, [sites, enclSheet])
  useEffect(() => {
    setSheetPm(p => ({ ...p, page: 0 }))
  }, [enclSheet])

  // Sheet 2 — the animals within the picked enclosure.
  const sheetAnimals = useMemo(
    () =>
      animalSheet
        ? animals.filter(a => a.site === animalSheet.site && a.enclosure === animalSheet.enclosure)
        : [],
    [animals, animalSheet]
  )
  useEffect(() => {
    setAnimalQ('')
  }, [animalSheet])
  const animalQuery = animalQ.trim().toLowerCase()
  const animalFiltered = animalQuery
    ? sheetAnimals.filter(a => `${a.name || ''} ${a.antzId} ${a.ring || ''} ${a.chip || ''}`.toLowerCase().includes(animalQuery))
    : sheetAnimals

  const cardData = (a: AnimalRecord) => ({
    default_icon: ANIMAL_ICON,
    local_identifier_name: a.idType || 'ID',
    local_identifier_value: a.name || a.antzId,
    gender: a.gender,
    age: a.age,
    weight: a.weight,
    user_enclosure_name: a.enclosure,
    site_name: a.site,
    breed_name: a.breed,
    morph_name: a.morph
  })

  if (!housing || !sites.length) return <EmptyState message='No site or enclosure data available' />

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <Typography sx={{ fontSize: '1rem', color: color || cc.OnSurfaceVariant, fontWeight: weight }}>
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
  const siteColumns: GridColDef[] = [
    { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    { minWidth: 234, flex: 2.6, sortable: false, field: 'name', headerName: 'Site', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    { ...num('male'), flex: 1, minWidth: 64 },
    { ...num('female'), flex: 1, minWidth: 64 },
    { ...num('unsexed'), flex: 1, minWidth: 64 },
    { flex: 1, minWidth: 80, sortable: false, field: 'total', headerName: 'Total', renderCell: p => txt(Number(p.row.total || 0).toLocaleString(), undefined, 600) },
    { flex: 1, minWidth: 100, sortable: false, field: 'nEncl', headerName: 'Enclosures', renderCell: p => txt(Number(p.row.nEncl || 0).toLocaleString(), undefined, 600) },
    { flex: 1, minWidth: 80, sortable: false, field: 'pairs', headerName: 'Pairs', renderCell: p => txt(Number(p.row.pairs || 0).toLocaleString(), undefined, 600) }
  ]
  const enclosureColumns: GridColDef[] = [
    { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    { minWidth: 200, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    { minWidth: 220, flex: 0.8, sortable: false, field: 'site', headerName: 'Site', renderCell: p => txt(p.row.site || '-') },
    num('male'),
    num('female'),
    num('unsexed'),
    { width: 80, sortable: false, field: 'total', headerName: 'Total', renderCell: p => txt(Number(p.row.total || 0).toLocaleString(), undefined, 600) },
    { width: 80, sortable: false, field: 'pairs', headerName: 'Pairs', renderCell: p => txt(Number(p.row.pairs || 0).toLocaleString(), undefined, 600) },
    { width: 200, sortable: false, field: 'type', headerName: 'Type', renderCell: p => <StatusChip label={p.row.type} tone={toneForType(p.row.type)} /> }
  ]

  // Sheet-1 columns: a single site's enclosures (no Site column needed).
  const sheetColumns: GridColDef[] = [
    { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    { minWidth: 200, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    num('male'),
    num('female'),
    num('unsexed'),
    { width: 80, sortable: false, field: 'total', headerName: 'Total', renderCell: p => txt(Number(p.row.total || 0).toLocaleString(), undefined, 600) },
    { width: 80, sortable: false, field: 'pairs', headerName: 'Pairs', renderCell: p => txt(Number(p.row.pairs || 0).toLocaleString(), undefined, 600) },
    { width: 200, sortable: false, field: 'type', headerName: 'Type', renderCell: p => <StatusChip label={p.row.type} tone={toneForType(p.row.type)} /> }
  ]

  const start = pm.page * pm.pageSize
  const rows = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i, sl_no: start + i + 1 }))
  const sheetStart = sheetPm.page * sheetPm.pageSize
  const sheetRows = sheetEnclosures.slice(sheetStart, sheetStart + sheetPm.pageSize).map((e, i) => ({ ...e, id: sheetStart + i, sl_no: sheetStart + i + 1 }))

  const search = (
    <TextField
      size='small'
      placeholder={isSite ? 'Search sites…' : 'Search enclosures…'}
      value={q}
      onChange={e => setQ(e.target.value)}
      sx={{ width: 260, '& .MuiInputBase-root': { height: 44, bgcolor: theme.palette.background.paper } }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
    />
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* One section: title + count (left) · Site/Enclosure toggle + search (right) */}
      <SectionCard
        title={`${isSite ? 'Sites' : 'Enclosures'} · ${filtered.length.toLocaleString()}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {!isSite && (
              <TextField
                select
                size='small'
                value={enclFilter}
                onChange={e => setEnclFilter(e.target.value as typeof enclFilter)}
                sx={{ minWidth: 150, '& .MuiInputBase-root': { height: 44, bgcolor: theme.palette.background.paper } }}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='single'>Single Sexed</MenuItem>
                <MenuItem value='male'>Male only</MenuItem>
                <MenuItem value='female'>Female only</MenuItem>
                <MenuItem value='unsexed'>Unsexed only</MenuItem>
              </TextField>
            )}
            <Box sx={{ display: 'inline-flex', alignItems: 'stretch', height: 44, p: 0.75, borderRadius: '999px', border: `1px solid ${cc.OutlineVariant}`, bgcolor: theme.palette.background.paper }}>
              {[
                { key: 'site', label: 'Site-wise', icon: 'mdi:map-marker-outline' },
                { key: 'enclosure', label: 'Enclosure-wise', icon: 'mdi:home-outline' }
              ].map(v => {
                const on = tableView === v.key

                return (
                  <Box
                    key={v.key}
                    onClick={() => setTableView(v.key as 'site' | 'enclosure')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 3,
                      borderRadius: '999px',
                      cursor: 'pointer',
                      bgcolor: on ? theme.palette.primary.main : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon icon={v.icon} fontSize='1.15rem' color={on ? theme.palette.common.white : cc.neutralSecondary} />
                    <Typography variant='body2' sx={{ fontWeight: 600, color: on ? theme.palette.common.white : cc.neutralSecondary, whiteSpace: 'nowrap' }}>
                      {v.label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
            {search}
          </Box>
        }
      >
        {filtered.length ? (
          <DetailTable
            columns={isSite ? siteColumns : enclosureColumns}
            rows={rows}
            total={filtered.length}
            paginationModel={pm}
            setPaginationModel={setPm}
            onRowClick={(params: { row: Record<string, any> }) =>
              isSite
                ? setEnclSheet({ site: params.row.name })
                : setAnimalSheet({ site: params.row.site, enclosure: params.row.name })
            }
          />
        ) : (
          <EmptyState message={isSite ? 'No sites match your search' : 'No enclosures match your search'} />
        )}
      </SectionCard>

      {/* Sheet 1 — enclosures within a picked site (data table) */}
      <Drawer
        anchor='right'
        open={!!enclSheet}
        onClose={() => setEnclSheet(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 820 }, p: 4 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap title={enclSheet?.site}>
              {enclSheet?.site}
            </Typography>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              {sheetEnclosures.length} enclosure{sheetEnclosures.length === 1 ? '' : 's'} · click a row for its animals
            </Typography>
          </Box>
          <IconButton onClick={() => setEnclSheet(null)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {sheetEnclosures.length ? (
          <DetailTable
            columns={sheetColumns}
            rows={sheetRows}
            total={sheetEnclosures.length}
            paginationModel={sheetPm}
            setPaginationModel={setSheetPm}
            onRowClick={(params: { row: Record<string, any> }) =>
              enclSheet && setAnimalSheet({ site: enclSheet.site, enclosure: params.row.name })
            }
          />
        ) : (
          <EmptyState message='No enclosures for this site' />
        )}
      </Drawer>

      {/* Sheet 2 — stacked on top — the animals in one enclosure (shared AnimalCardList) */}
      <Drawer
        anchor='right'
        open={!!animalSheet}
        onClose={() => setAnimalSheet(null)}
        sx={{ zIndex: theme.zIndex.modal + 4 }}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 680 }, p: 4 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap title={animalSheet?.enclosure}>
              {animalSheet?.enclosure}
            </Typography>
            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
              {animalSheet?.site}  ·  {sheetAnimals.length} animal{sheetAnimals.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          <IconButton onClick={() => setAnimalSheet(null)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <TextField
          size='small'
          fullWidth
          placeholder='Search animals…'
          value={animalQ}
          onChange={e => setAnimalQ(e.target.value)}
          sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: theme.palette.background.paper } }}
          InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
        />

        {animalFiltered.length ? (
          <AnimalCardList cards={animalFiltered.map(cardData)} />
        ) : (
          <EmptyState message={sheetAnimals.length ? 'No animals match your search' : 'No animal records for this enclosure'} />
        )}
      </Drawer>
    </Box>
  )
}

export default HousingTab
