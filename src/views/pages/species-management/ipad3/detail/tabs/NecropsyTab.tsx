'use client'

// iPad 3 Necropsy tab (2026-08-31) — the deaths viewed through the necropsy lens:
// only records with a necropsy status of Pending or Completed (NA excluded), as ONE
// SectionCard table on the Housing anatomy + CoL column grammar (No serial + shared
// AnimalCell, both sticky). Status counts print as a quiet caption under the header.
// Real data only — the sidecar carries just the status flag (no findings/date/vet);
// richer synthesized fields deferred until asked.
//
// Row tap → the app's necropsy-details screen (/necropsy/necropsy/[id] exists in this
// repo, but its [id] is a necropsy record id our demo data doesn't carry) — route left
// unwired via NECROPSY_DETAILS_ROUTE = null until the user confirms the id mapping.

import React, { useEffect, useMemo, useState } from 'react'
import { Box, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { LifecycleDeath, SpeciesLifecycle } from 'src/types/species-management/detail'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
import {
  AnimalCell,
  CategoryFilter,
  CellText,
  DetailTable,
  EmptyState,
  FilterChip,
  SectionCard
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'

// TODO(route): the necropsy module's detail page is /necropsy/necropsy/[id] but [id] is a
// necropsy record id — set the mapping here to make rows clickable.
const NECROPSY_DETAILS_ROUTE: ((aid: string) => string) | null = null

interface NecropsyTabProps {
  lifecycle?: SpeciesLifecycle | null
}

/* ── vocab (Circle of Life wording throughout) ───────────────────────────── */

const necStatusOf = (y?: string): 'Pending' | 'Completed' | 'NA' => (y === 'Completed' ? 'Completed' : y === 'Pending' ? 'Pending' : 'NA')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-07-04" → "04 Jul 2025" (the dd MMM yyyy hard rule). */
const fmtDate = (iso?: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return iso || '—'

  return `${m[3]} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`
}

const animalName = (e: LifecycleDeath) => e.idv || e.idn || (e.aid ? `Animal ${e.aid}` : 'Unknown')

/* ── the tab ─────────────────────────────────────────────────────────────── */

const NecropsyTab: React.FC<NecropsyTabProps> = ({ lifecycle }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  // Widened at use so TS keeps the union (the const's literal null otherwise narrows to never).
  const detailsRoute = NECROPSY_DETAILS_ROUTE as ((aid: string) => string) | null
  const portrait = useMediaQuery('(orientation: portrait)')

  // Necropsy scope: only deaths where a necropsy exists or is owed (NA = out of scope).
  const all = useMemo(() => (lifecycle?.deaths || []).filter(e => necStatusOf(e.y) !== 'NA'), [lifecycle])

  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [extra, setExtra] = useState<Record<string, string[]>>({})

  // Status tabs (All · Pending · Completed) exist only when BOTH statuses are present —
  // single-status species get a quiet ledger line instead (tabs over one pile are noise).
  const [statusTab, setStatusTab] = useState<'all' | 'Pending' | 'Completed'>('all')
  const hasMix = useMemo(
    () => all.some(e => necStatusOf(e.y) === 'Pending') && all.some(e => necStatusOf(e.y) === 'Completed'),
    [all]
  )

  const sites = useMemo(() => Array.from(new Set(all.map(e => e.s).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase()

    return all.filter(e => {
      if (site && e.s !== site) return false
      if (needle && !`${animalName(e)} ${e.aid || ''}`.toLowerCase().includes(needle)) return false

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
    const years = count(scoped.map(e => String(e.d || '').slice(0, 4)).map(y => (/^\d{4}$/.test(y) ? y : undefined)))
      .sort((a, b) => b.value.localeCompare(a.value))

    // No Status facet — the status dimension belongs to the All/Pending/Completed tabs.
    return [
      { key: 'year', label: 'Year', options: years },
      { key: 'cause', label: 'Cause of Death', options: count(scoped.map(e => e.m)) }
    ]
  }, [scoped])

  const filtered = useMemo(
    () =>
      scoped.filter(e => {
        const sel = (k: string) => extra[k] || []
        if (sel('year').length && !sel('year').includes(String(e.d || '').slice(0, 4))) return false
        if (sel('cause').length && !sel('cause').includes(e.m || '')) return false

        return true
      }),
    [scoped, extra]
  )

  const data = useMemo(
    () =>
      filtered
        .filter(e => statusTab === 'all' || necStatusOf(e.y) === statusTab)
        .map(e => ({
          ...e,
          animal: animalName(e),
          date: fmtDate(e.d),
          status: necStatusOf(e.y)
        })),
    [filtered, statusTab]
  )

  const table = useSortableTable(data, { field: 'd', sort: 'desc' }, 20)

  // Tab switches land on page 1 — a kept page index can outrun the shorter pile.
  const { setPaginationModel } = table
  useEffect(() => {
    setPaginationModel((p: any) => ({ ...p, page: 0 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const pending = useMemo(() => filtered.filter(e => necStatusOf(e.y) === 'Pending').length, [filtered])
  const completed = filtered.length - pending

  const filterCount = Object.values(extra).reduce((n, v) => n + v.length, 0)

  const chips: { key: string; label: string; onClear: () => void }[] = [
    ...(site ? [{ key: 'site', label: site, onClear: () => setSite(null) }] : []),
    ...Object.entries(extra).flatMap(([k, vals]) =>
      vals.map(v => ({
        key: `${k}:${v}`,
        label: v,
        onClear: () => setExtra(prev => ({ ...prev, [k]: (prev[k] || []).filter(x => x !== v) }))
      }))
    )
  ]

  /* ── columns ─────────────────────────────────────────────────────────────── */

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
            <AnimalCell name={p.row.animal} sub={p.row.aid ? `AID: ${p.row.aid}` : undefined} size={40} />
          </Box>
        )
      },
      { width: 165, field: 'd', headerName: 'Date of Death', renderCell: (p: any) => <CellText noWrap>{p.row.date}</CellText> },
      { width: 170, field: 'm', headerName: 'Cause of Death', renderCell: (p: any) => txt(p.row.m || '—', cc.Tertiary, 600) },
      {
        width: 150,
        field: 'status',
        headerName: 'Necropsy',
        renderCell: (p: any) => {
          const s = p.row.status
          const color = s === 'Completed' ? theme.palette.primary.dark : theme.palette.warning.main

          return txt(s, color, 600)
        }
      },
      { width: 200, field: 's', headerName: 'Site', renderCell: (p: any) => txt(p.row.s || '—') }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cc, theme]
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
      <Icon icon='mage:filter' fontSize='1.25rem' color={skin.INK2} />
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

  const titleText = `Necropsies · ${table.total.toLocaleString()}`

  // Status control: with a MIX of statuses → the standard underline sub-tabs (Medical's
  // SubTabs grammar) with live counts; single-status species → one quiet ledger line.
  const statusLine = hasMix ? (
    <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${skin.HAIR}`, mb: 4 }}>
      {(
        [
          { key: 'all', label: 'All', count: filtered.length },
          { key: 'Pending', label: 'Pending', count: pending },
          { key: 'Completed', label: 'Completed', count: completed }
        ] as const
      ).map(t => {
        const on = statusTab === t.key

        return (
          <Box
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            role='tab'
            aria-selected={on}
            sx={{
              py: 1.5,
              mb: '-1px',
              borderBottom: '2.5px solid',
              borderColor: on ? theme.palette.primary.main : 'transparent',
              cursor: 'pointer'
            }}
          >
            <Typography variant='body1' sx={{ fontWeight: 600, color: on ? theme.palette.primary.dark : cc.neutralSecondary }}>
              {t.label} ({t.count.toLocaleString()})
            </Typography>
          </Box>
        )
      })}
    </Box>
  ) : (
    <Typography sx={{ fontSize: '14px', color: skin.FAINT, mb: 3 }}>
      All {filtered.length.toLocaleString()} necropsies{' '}
      <Box
        component='span'
        sx={{ color: pending ? theme.palette.warning.main : theme.palette.primary.dark, fontWeight: 600 }}
      >
        {pending ? 'pending' : 'completed'}
      </Box>
    </Typography>
  )

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
      <SectionCard title='Necropsies'>
        <EmptyState message='No necropsies recorded for this species' />
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
        {statusLine}

        {chips.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {chips.map(c => (
              <FilterChip key={c.key} label={c.label} onClear={c.onClear} />
            ))}
          </Box>
        )}

        {table.total ? (
          // No pinned at 0 by DetailTable; AnimalCell joins it at 64 (the CoL sticky pair).
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
              onRowClick={
                detailsRoute ? (p: any) => p.row.aid && window.location.assign(detailsRoute(p.row.aid)) : undefined
              }
            />
          </Box>
        ) : (
          <EmptyState message='No necropsies match your filters' />
        )}
      </SectionCard>

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

export default NecropsyTab
