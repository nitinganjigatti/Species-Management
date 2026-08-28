'use client'

// Enclosure Demographics (stakeholder call 2026-08-27, built 2026-08-28) — the pairing
// concept is retired: no parentage data means "pairs" was indefensible, and the readiness
// meters were graphs where a table was asked for. The tab IS one framed table now — every
// enclosure's sex composition directly visible — with a pill search + Composition + Site
// dropdowns above it. Row tap goes straight to the animals sheet (the old middle sheet,
// enclosures-per-readiness-type, died with the buckets).

import React, { useEffect, useMemo, useState } from 'react'
import { Box, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import { CategoryFilter, CellText, DetailTable, DrillSheet, EmptyState, SheetRow } from 'src/views/pages/species-management/ipad2/detail/detailUi'

interface EncRow {
  name: string
  site: string
  section?: string
  male: number
  female: number
  unsexed: number
  total: number
  composition: string
}

// Composition from the COUNTS, never from the dataset's type labels — those carry the
// banned breeding vocabulary ("Breeding Ready"). Plain words, no chips.
const compositionOf = (male: number, female: number, unsexed: number, total: number): string => {
  if (total <= 0) return 'Empty'
  if (male > 0 && female > 0) return 'Both sexes'
  if (unsexed === total) return 'Needs sexing'
  if (male > 0 && unsexed === 0) return 'All male'
  if (female > 0 && unsexed === 0) return 'All female'

  return 'Mixed' // one sex plus unsexed animals
}

// Dropdown order — most actionable states first.
const COMPOSITIONS = ['Both sexes', 'All male', 'All female', 'Needs sexing', 'Mixed', 'Empty']

/** Meta lines for the standard animal SheetRow (same card as Medical / Hospital). */
const animalCaption = (a: AnimalRecord) =>
  [a.gender ? a.gender.charAt(0).toUpperCase() + a.gender.slice(1) : null, a.age, a.weight != null ? `${a.weight} kg` : null]
    .filter(Boolean)
    .join(' · ')
const animalSubline = (a: AnimalRecord) => [a.enclosure, a.site].filter(Boolean).join(' · ')

// The animals in one enclosure (standard SheetRow cards, like Assessments).
const EnclosureAnimalsDrawer: React.FC<{
  open: boolean
  site?: string
  enclosure?: string
  animals: AnimalRecord[]
  onClose: () => void
}> = ({ open, site, enclosure, animals, onClose }) => {
  const theme = useTheme() as any
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open, enclosure])

  const list = useMemo(() => animals.filter(a => a.site === site && a.enclosure === enclosure), [animals, site, enclosure])
  const query = q.trim().toLowerCase()
  const filtered = query
    ? list.filter(a => `${a.name || ''} ${a.antzId} ${a.ring || ''} ${a.chip || ''}`.toLowerCase().includes(query))
    : list

  return (
    <DrillSheet
      open={open}
      onClose={onClose}
      size='md'
      zIndex={theme.zIndex.modal + 4}
      title={enclosure}
      eyebrow={[site, `${list.length} animal${list.length === 1 ? '' : 's'}`].filter(Boolean).join('  ·  ')}
    >
      <TextField
        size='small'
        fullWidth
        placeholder='Search animals…'
        value={q}
        onChange={e => setQ(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px' },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
        }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
      />

      {filtered.length ? (
        <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
          {filtered.map((a, i) => (
            <SheetRow
              key={a.antzId || i}
              avatar
              title={a.name || a.antzId}
              caption={animalCaption(a)}
              subline={animalSubline(a)}
              last={i === filtered.length - 1}
            />
          ))}
        </Box>
      ) : (
        <EmptyState message={list.length ? 'No animals match your search' : 'No animal records for this enclosure'} />
      )}
    </DrillSheet>
  )
}

const PairingTab: React.FC<{ housing?: SpeciesHousing; animals?: AnimalRecord[] }> = ({ housing, animals = [] }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [encDrill, setEncDrill] = useState<{ site: string; enclosure: string } | null>(null)
  const [q, setQ] = useState('')
  const [composition, setComposition] = useState<string | null>(null)
  const [site, setSite] = useState<string | null>(null)
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  const allRows: EncRow[] = useMemo(() => {
    const list: EncRow[] = []
    for (const s of housing?.sites || []) {
      for (const enc of s.enclosures) {
        list.push({
          name: enc.name,
          site: s.name,
          section: enc.section,
          male: enc.male,
          female: enc.female,
          unsexed: enc.unsexed,
          total: enc.total,
          composition: compositionOf(enc.male, enc.female, enc.unsexed, enc.total)
        })
      }
    }

    return list
  }, [housing])

  const siteNames = useMemo(() => Array.from(new Set(allRows.map(r => r.site))), [allRows])
  const compositionOptions = useMemo(() => COMPOSITIONS.filter(c => allRows.some(r => r.composition === c)), [allRows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return allRows.filter(
      r =>
        (!query || `${r.name} ${r.site} ${r.section || ''}`.toLowerCase().includes(query)) &&
        (!composition || r.composition === composition) &&
        (!site || r.site === site)
    )
  }, [allRows, q, composition, site])

  if (!housing || !housing.sites?.length) return <EmptyState message='No enclosure data available' />

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  // Numbers right-aligned (the 2026-08-27 table rule); zeros print the pale em dash.
  const numCol = (field: keyof EncRow, header: string, opts?: { total?: boolean }): GridColDef => ({
    width: header.length <= 2 ? 64 : 96,
    sortable: false,
    align: 'right',
    headerAlign: 'right',
    field: field as string,
    headerName: header,
    renderCell: p => {
      const n = Number(p.row[field] || 0)
      if (opts?.total) return txt(n.toLocaleString(), skin.LIST_GREEN, 700)

      return n > 0 ? txt(n.toLocaleString(), undefined, 600) : txt('—', skin.DASH_INK, 400)
    }
  })

  const columns: GridColDef[] = [
    { width: 56, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'name',
      headerName: 'Enclosure',
      // Enclosure name with its site in small faint type beneath — the site-below-enclosure rule.
      renderCell: p => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
            {p.row.name}
          </Typography>
          <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
            {p.row.site}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'composition',
      headerName: 'Composition',
      renderCell: p => txt(p.row.composition)
    },
    numCol('male', 'M'),
    numCol('female', 'F'),
    numCol('unsexed', 'U'),
    numCol('total', 'Total', { total: true })
  ]

  const start = pm.page * pm.pageSize
  const indexed = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i, sl_no: start + i + 1 }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Controls: pill search stretching, Composition + Site pickers beside it.
          Single-site species never see the site dropdown. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          placeholder='Search enclosures…'
          value={q}
          onChange={e => {
            setQ(e.target.value)
            setPm(p => ({ ...p, page: 0 }))
          }}
          sx={{
            flex: 1,
            minWidth: 220,
            '& .MuiInputBase-root': { bgcolor: '#ffffff', borderRadius: '999px', height: 44 },
            '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${skin.HAIR}` },
            '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
          }}
          InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
        />
        <CategoryFilter
          radius='999px'
          width={200}
          options={compositionOptions}
          value={composition}
          onChange={v => {
            setComposition(v)
            setPm(p => ({ ...p, page: 0 }))
          }}
          placeholder='All compositions'
          icon='mdi:gender-male-female'
        />
        {siteNames.length > 1 && (
          <CategoryFilter
            radius='999px'
            width={180}
            options={siteNames}
            value={site}
            onChange={v => {
              setSite(v)
              setPm(p => ({ ...p, page: 0 }))
            }}
            placeholder='All sites'
            icon='mdi:map-marker-outline'
          />
        )}
      </Box>

      {filtered.length ? (
        <DetailTable
          framed
          columns={columns}
          rows={indexed}
          total={filtered.length}
          paginationModel={pm}
          setPaginationModel={setPm}
          onRowClick={(p: { row: EncRow }) => setEncDrill({ site: p.row.site, enclosure: p.row.name })}
        />
      ) : (
        <EmptyState message='No enclosures match your filters' />
      )}

      {/* Row tap → the animals in that enclosure */}
      <EnclosureAnimalsDrawer
        open={!!encDrill}
        site={encDrill?.site}
        enclosure={encDrill?.enclosure}
        animals={animals}
        onClose={() => setEncDrill(null)}
      />
    </Box>
  )
}

export default PairingTab
