'use client'

// iPad 2 Population tab (3rd tab, 2026-08-31, rebuilt on the HOUSING section anatomy
// after the first cut drifted off-standard) — the species' full animal list as ONE
// SectionCard: title + count left, controls in the card header (Housing's exact
// landscape/portrait split), the standard frameless DetailTable inside. Columns open
// with the No serial + the shared AnimalCell (avatar + name + AID sub-line) exactly
// like Circle of Life's events table, and both stay sticky while the rest scrolls.
// Controls per the approved wireframe: pill search + Site dropdown upfront, the rest
// (Sex · Enclosure · Age band · Chipped) behind a "Filters" button opening the
// standard SpeciesFilterSheet (bottom sheet portrait / side sheet landscape).
// Enclosure is selectable WITHOUT a site (user correction 2026-08-31).
//
// Data = the detail sidecar's `animals` block (getSpeciesAnimals). For very large
// species the sidecar caps the list at 400 rows — when rows < totalAnimals a quiet
// caption states the cap instead of pretending the table is complete.

import React, { useMemo, useState } from 'react'
import { Box, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { AnimalRecord } from 'src/types/species-management/detail'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad2/SpeciesFilterSheet'
import {
  AnimalCell,
  CategoryFilter,
  CellText,
  DetailTable,
  EmptyState,
  FilterChip,
  SectionCard
} from 'src/views/pages/species-management/ipad2/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad2/detail/useSortableTable'

interface PopulationTabProps {
  animals?: AnimalRecord[]
  totalAnimals?: number
}

/* ── vocab ───────────────────────────────────────────────────────────────── */

// Same wording as Circle of Life's gender column: undetermined prints "Unsexed".
const genderLabel = (g?: string) => (g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Unsexed')

const AGE_BANDS = ['<1 yr', '1–5 yrs', '5–10 yrs', '10+ yrs', 'Unknown'] as const

const ageBandOf = (age?: string): (typeof AGE_BANDS)[number] => {
  const n = Number(age)
  if (!age || !Number.isFinite(n)) return 'Unknown'
  if (n < 1) return '<1 yr'
  if (n < 5) return '1–5 yrs'
  if (n < 10) return '5–10 yrs'

  return '10+ yrs'
}

const chipOf = (a: AnimalRecord): string => a.chip || a.ring || ''

/* ── the tab ─────────────────────────────────────────────────────────────── */

const PopulationTab: React.FC<PopulationTabProps> = ({ animals, totalAnimals }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const portrait = useMediaQuery('(orientation: portrait)')

  const all = useMemo(() => animals || [], [animals])

  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [extra, setExtra] = useState<Record<string, string[]>>({})

  const sites = useMemo(() => Array.from(new Set(all.map(a => a.site).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  // Facet options carry live counts within the current site/search scope, so the sheet
  // never offers a value that would land on an empty table.
  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase()

    return all.filter(a => {
      if (site && a.site !== site) return false
      if (needle && !`${a.name || ''} ${a.antzId}`.toLowerCase().includes(needle)) return false

      return true
    })
  }, [all, site, q])

  const facets = useMemo(() => {
    const count = (vals: (string | undefined)[]) => {
      const m = new Map<string, number>()
      vals.forEach(v => v && m.set(v, (m.get(v) || 0) + 1))

      return Array.from(m.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, n]) => ({ value, label: value, count: n }))
    }

    return [
      { key: 'sex', label: 'Sex', options: count(scoped.map(a => genderLabel(a.gender))) },
      // Enclosure stands on its own — selectable with or without a site (user rule).
      { key: 'enclosure', label: 'Enclosure', options: count(scoped.map(a => a.enclosure)) },
      { key: 'age', label: 'Age band', options: count(scoped.map(a => ageBandOf(a.age))) },
      { key: 'chipped', label: 'Chipped', options: count(scoped.map(a => (chipOf(a) ? 'Yes' : 'No'))) }
    ]
  }, [scoped])

  const filtered = useMemo(
    () =>
      scoped.filter(a => {
        const sexSel = extra.sex || []
        if (sexSel.length && !sexSel.includes(genderLabel(a.gender))) return false
        const encSel = extra.enclosure || []
        if (encSel.length && !encSel.includes(a.enclosure || '')) return false
        const ageSel = extra.age || []
        if (ageSel.length && !ageSel.includes(ageBandOf(a.age))) return false
        const chipSel = extra.chipped || []
        if (chipSel.length && !chipSel.includes(chipOf(a) ? 'Yes' : 'No')) return false

        return true
      }),
    [scoped, extra]
  )

  const data = useMemo(
    () =>
      filtered.map(a => ({
        ...a,
        animal: a.name || a.antzId,
        sex: genderLabel(a.gender),
        ageNum: a.age && Number.isFinite(Number(a.age)) ? Number(a.age) : undefined,
        chipId: chipOf(a)
      })),
    [filtered]
  )

  const table = useSortableTable(data, { field: 'animal', sort: 'asc' }, 20)

  const filterCount = Object.values(extra).reduce((n, v) => n + v.length, 0)

  const chips: { key: string; label: string; onClear: () => void }[] = [
    ...(site ? [{ key: 'site', label: site, onClear: () => setSite(null) }] : []),
    ...Object.entries(extra).flatMap(([k, vals]) =>
      vals.map(v => ({
        key: `${k}:${v}`,
        label: k === 'chipped' ? `Chipped: ${v}` : v,
        onClear: () => setExtra(prev => ({ ...prev, [k]: (prev[k] || []).filter(x => x !== v) }))
      }))
    )
  ]

  const capped = (totalAnimals ?? all.length) > all.length

  /* ── columns — the CoL events-table grammar: No serial + shared AnimalCell ── */

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  const columns: GridColDef[] = useMemo(
    () => [
      { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: (p: any) => txt(p.row.sl_no, cc.neutralSecondary, 400) },
      {
        width: 240,
        field: 'animal',
        headerName: 'Animal Name & ID',
        renderCell: (p: any) => (
          <Box sx={{ py: 1 }}>
            <AnimalCell name={p.row.animal} sub={`AID: ${p.row.antzId}`} size={40} />
          </Box>
        )
      },
      { width: 110, field: 'sex', headerName: 'Gender', renderCell: (p: any) => txt(p.row.sex) },
      {
        width: 100,
        field: 'ageNum',
        headerName: 'Age',
        align: 'right',
        headerAlign: 'right',
        renderCell: (p: any) =>
          p.row.ageNum != null
            ? txt(`${p.row.ageNum % 1 === 0 ? p.row.ageNum : p.row.ageNum.toFixed(1)}y`, skin.VALUE)
            : txt('—', cc.neutralSecondary)
      },
      { width: 200, field: 'site', headerName: 'Site', renderCell: (p: any) => txt(p.row.site || '—') },
      { width: 200, field: 'enclosure', headerName: 'Enclosure', renderCell: (p: any) => txt(p.row.enclosure || '—') },
      {
        width: 170,
        field: 'chipId',
        headerName: 'Chip / Ring ID',
        renderCell: (p: any) => (p.row.chipId ? txt(p.row.chipId) : txt('—', cc.neutralSecondary))
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cc]
  )

  /* ── controls — Housing's exact header arrangement ───────────────────────── */

  const search = (
    <TextField
      size='small'
      placeholder='Search animals…'
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

  const siteFilterCtl = multiSite && (
    <CategoryFilter
      radius='999px'
      width={180}
      options={sites}
      value={site}
      onChange={v => setSite(v)}
      placeholder='All sites'
      icon='mdi:map-marker-outline'
    />
  )

  const filtersBtn = (
    <Box
      onClick={() => setSheetOpen(true)}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3.5,
        height: 44,
        flexShrink: 0,
        borderRadius: '999px',
        bgcolor: '#ffffff',
        border: `1px solid ${skin.HAIR}`,
        cursor: 'pointer',
        userSelect: 'none',
        ...skin.cardPressSx,
        '&:hover': { bgcolor: skin.ROW_HOVER }
      }}
    >
      <Icon icon='mdi:filter-variant' fontSize='1.05rem' color={skin.ACCENT_INK} />
      <Typography sx={{ fontSize: '15px', fontWeight: 500, color: skin.INK2, whiteSpace: 'nowrap' }}>Filters</Typography>
      {filterCount > 0 && (
        <Box
          sx={{
            minWidth: 20,
            height: 20,
            px: 1,
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '12px',
            fontWeight: 700,
            bgcolor: skin.ACCENT_FILL,
            color: '#ffffff'
          }}
        >
          {filterCount}
        </Box>
      )}
    </Box>
  )

  const titleText = `Animals · ${table.total.toLocaleString()}`

  // Portrait card header: title + Filters on line one, search + site dropdown next.
  const stackedHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
          {titleText}
        </Typography>
        {filtersBtn}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {search}
        {siteFilterCtl}
      </Box>
    </Box>
  )

  if (!all.length) {
    return (
      <SectionCard title='Animals'>
        <EmptyState message='No animals recorded for this species' />
      </SectionCard>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionCard
        title={portrait ? stackedHeader : titleText}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {filtersBtn}
              {search}
            </Box>
          )
        }
      >
        {chips.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {chips.map(c => (
              <FilterChip key={c.key} label={c.label} onClear={c.onClear} />
            ))}
          </Box>
        )}

        {table.total ? (
          // No pinned at 0 by DetailTable; the AnimalCell column joins it at 64 with the
          // same surface/header/hover tokens (the CoL sticky-pair pattern).
          <Box
            sx={{
              '& .MuiDataGrid-cell[data-field="animal"]': {
                position: 'sticky',
                left: 64,
                zIndex: 3,
                backgroundColor: '#ffffff',
                borderRight: `1px solid ${skin.ROW_LINE}`
              },
              '& .MuiDataGrid-columnHeader[data-field="animal"]': {
                position: 'sticky',
                left: 64,
                zIndex: 5,
                backgroundColor: skin.TABLE_HEAD_BG,
                borderRight: `1px solid ${skin.ROW_LINE}`
              },
              '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="animal"]': { backgroundColor: skin.ROW_HOVER }
            }}
          >
            <DetailTable
              columns={columns}
              rows={table.rows}
              total={table.total}
              paginationModel={table.paginationModel}
              setPaginationModel={table.setPaginationModel}
              sortModel={table.sortModel}
              handleSortModel={table.handleSortModel}
              stickyField='sl_no'
            />
          </Box>
        ) : (
          <EmptyState message='No animals match your filters' />
        )}

        {capped && (
          <Typography sx={{ mt: 3, fontSize: '14px', color: skin.FAINT }}>
            Showing the first {all.length.toLocaleString()} of {(totalAnimals ?? 0).toLocaleString()} animals.
          </Typography>
        )}
      </SectionCard>

      {/* Filters — the standard sheet (bottom in portrait, side in landscape) */}
      <SpeciesFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title='Filters'
        sections={facets}
        selected={extra}
        onApply={setExtra}
      />
    </Box>
  )
}

export default PopulationTab
