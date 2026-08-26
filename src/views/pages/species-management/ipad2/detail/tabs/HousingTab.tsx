'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, MenuItem, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import { CellText, DetailTable, DrillSheet, EmptyState, StatusChip, SectionCard, SheetRow } from 'src/views/pages/species-management/ipad2/detail/detailUi'

/** Meta lines for the standard animal SheetRow (same card as Medical / Hospital). */
const animalCaption = (a: AnimalRecord) =>
  [a.gender ? a.gender.charAt(0).toUpperCase() + a.gender.slice(1) : null, a.age, a.weight != null ? `${a.weight} kg` : null]
    .filter(Boolean)
    .join(' · ')
const animalSubline = (a: AnimalRecord) => [a.enclosure, a.site].filter(Boolean).join(' · ')

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

  // Portrait: title + toggle + filter + search don't fit one header row — stack as
  // two rows (title + right-aligned toggle / full-width search + right-aligned filter).
  const portrait = useMediaQuery('(orientation: portrait)')
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

  if (!housing || !sites.length) return <EmptyState message='No site or enclosure data available' />

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
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
      sx={{
        ...(portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 260 }),
        '& .MuiInputBase-root': { height: 44, bgcolor: skin.FIELD_BG, borderRadius: '999px', fontSize: '15px' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
      }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
    />
  )

  const enclFilterCtl = !isSite && (
    <TextField
      select
      size='small'
      value={enclFilter}
      onChange={e => setEnclFilter(e.target.value as typeof enclFilter)}
      sx={{
        minWidth: 150,
        '& .MuiInputBase-root': { height: 44, bgcolor: '#ffffff', borderRadius: '999px', fontSize: '15px', fontWeight: 500, color: skin.INK2 },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.HAIR },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.TRACK }
      }}
    >
      <MenuItem value='all'>All</MenuItem>
      <MenuItem value='single'>Single Sexed</MenuItem>
      <MenuItem value='male'>Male only</MenuItem>
      <MenuItem value='female'>Female only</MenuItem>
      <MenuItem value='unsexed'>Unsexed only</MenuItem>
    </TextField>
  )

  const titleText = `${isSite ? 'Sites' : 'Enclosures'} · ${filtered.length.toLocaleString()}`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* One section. Landscape: title + count (left) · filter + Site/Enclosure toggle +
          search (right). Portrait: title + right-aligned toggle, then full-width search
          up to the right-aligned filter. */}
      {(() => {
        const viewToggle = (
            <Box sx={{ display: 'inline-flex', alignItems: 'stretch', height: 44, p: '3px', gap: '2px', borderRadius: '999px', bgcolor: skin.TRACK, boxSizing: 'border-box' }}>
              {[
                { key: 'site', label: 'Site-Wise', icon: 'mdi:map-marker-outline' },
                { key: 'enclosure', label: 'Enclosure-Wise', icon: 'mdi:home-outline' }
              ].map(v => {
                const on = tableView === v.key

                return (
                  <Box
                    key={v.key}
                    onClick={() => setTableView(v.key as 'site' | 'enclosure')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 3.5,
                      borderRadius: '999px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      bgcolor: on ? '#ffffff' : 'transparent',
                      ...skin.cardPressSx,
                      transition: `transform ${skin.DUR_STD} ${skin.EASE}, background-color ${skin.DUR_FAST} ${skin.EASE}`
                    }}
                  >
                    <Icon icon={v.icon} fontSize='1rem' color={on ? skin.ACCENT_INK : skin.MUTED} />
                    <Typography sx={{ fontSize: '15px', fontWeight: 500, color: on ? skin.ACCENT_INK : skin.MUTED, whiteSpace: 'nowrap' }}>
                      {v.label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
        )

        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
                {titleText}
              </Typography>
              {viewToggle}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {search}
              {enclFilterCtl}
            </Box>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : titleText}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {enclFilterCtl}
              {viewToggle}
              {search}
            </Box>
          )
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
        )
      })()}

      {/* Sheet 1 — enclosures within a picked site (data table) */}
      <DrillSheet
        open={!!enclSheet}
        onClose={() => setEnclSheet(null)}
        size='xxl'
        title={enclSheet?.site}
        eyebrow={`${sheetEnclosures.length} enclosure${sheetEnclosures.length === 1 ? '' : 's'} · click a row for its animals`}
      >
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
              framed
            />
        ) : (
          <EmptyState message='No enclosures for this site' />
        )}
      </DrillSheet>

      {/* Sheet 2 — stacked on top — the animals in one enclosure (standard SheetRow card) */}
      <DrillSheet
        open={!!animalSheet}
        onClose={() => setAnimalSheet(null)}
        size='xl'
        zIndex={theme.zIndex.modal + 4}
        title={animalSheet?.enclosure}
        eyebrow={`${animalSheet?.site ?? ''}  ·  ${sheetAnimals.length} animal${sheetAnimals.length === 1 ? '' : 's'}`}
      >
        <TextField
          size='small'
          fullWidth
          placeholder='Search animals…'
          value={animalQ}
          onChange={e => setAnimalQ(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px' },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
          }}
          InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
        />

        {animalFiltered.length ? (
          <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
            {animalFiltered.map((a, i) => (
              <SheetRow
                key={a.antzId || i}
                avatar
                title={a.name || a.antzId}
                caption={animalCaption(a)}
                subline={animalSubline(a)}
                last={i === animalFiltered.length - 1}
              />
            ))}
          </Box>
        ) : (
          <EmptyState message={sheetAnimals.length ? 'No animals match your search' : 'No animal records for this enclosure'} />
        )}
      </DrillSheet>
    </Box>
  )
}

export default HousingTab
