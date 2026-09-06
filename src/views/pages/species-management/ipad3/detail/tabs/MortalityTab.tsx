'use client'

// iPad 3 Mortality tab (2026-08-31, animal-card standard 2026-09-02) — every death on
// record as ONE SectionCard table on the Housing section anatomy. Identity column is the
// standard AnimalIdCard (sticky, tag='mortality', real idn/idv > synth; Site/Enclosure
// columns folded onto the card). Circle of Life KEEPS its own deaths table — this tab is
// the dedicated full-list view.
// Controls: pill search + Site dropdown upfront; Sex · Year · Cause of Death ·
// Age band · Necropsy status behind the standard "Filters" sheet (SpeciesFilterSheet,
// bottom sheet portrait / side sheet landscape).
//
// Row tap → the app's mortality-details screen. ROUTE NOT WIRED YET (no mortality
// details route exists in this repo; user to supply the URL pattern) — rows stay
// non-clickable until MORTALITY_DETAILS_ROUTE is set, so nothing links to a dead end.

import React, { useMemo, useState } from 'react'
import { Box, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { LifecycleDeath, SpeciesLifecycle } from 'src/types/species-management/detail'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
import {
  SearchPill,
  SiteFilterSelect,
  idTypeLabel,
  AnimalCell,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  DetailTable,
  EmptyState,
  FilterChip,
  HeroPhotoContext,
  SectionCard,
  synthAnimalIdentity
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'

// TODO(route): set to the app's mortality-details path pattern (e.g. id => `/animals/mortality/${id}`)
// to make rows clickable. Left null so rows don't navigate to a non-existent page.
const MORTALITY_DETAILS_ROUTE: ((aid: string) => string) | null = null

interface MortalityTabProps {
  lifecycle?: SpeciesLifecycle | null
}

/* ── vocab (Circle of Life wording throughout) ───────────────────────────── */

const genderLabel = (g?: string) => (g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Unsexed')
const necStatusOf = (y?: string): 'Pending' | 'Completed' | 'NA' => (y === 'Completed' ? 'Completed' : y === 'Pending' ? 'Pending' : 'NA')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-07-04" → "04 Jul 2025" (the dd MMM yyyy hard rule). */
const fmtDate = (iso?: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return iso || '—'

  return `${m[3]} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`
}

const AGE_BANDS = ['<1 yr', '1–5 yrs', '5–10 yrs', '10+ yrs', 'Unknown'] as const

const ageBandOf = (a?: number): (typeof AGE_BANDS)[number] => {
  if (a == null || !Number.isFinite(a)) return 'Unknown'
  if (a < 1) return '<1 yr'
  if (a < 5) return '1–5 yrs'
  if (a < 10) return '5–10 yrs'

  return '10+ yrs'
}

const animalName = (e: LifecycleDeath) => e.idv || e.idn || (e.aid ? `Animal ${e.aid}` : 'Unknown')

/* ── the tab ─────────────────────────────────────────────────────────────── */

const MortalityTab: React.FC<MortalityTabProps> = ({ lifecycle }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  // Widened at use so TS keeps the union (the const's literal null otherwise narrows to never).
  const detailsRoute = MORTALITY_DETAILS_ROUTE as ((aid: string) => string) | null
  const portrait = useMediaQuery('(orientation: portrait)')
  const heroPhoto = React.useContext(HeroPhotoContext)

  const all = useMemo(() => lifecycle?.deaths || [], [lifecycle])

  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [extra, setExtra] = useState<Record<string, string[]>>({})

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

    return [
      { key: 'sex', label: 'Sex', options: count(scoped.map(e => genderLabel(e.g))) },
      { key: 'year', label: 'Year', options: years },
      { key: 'cause', label: 'Cause of Death', options: count(scoped.map(e => e.m)) },
      { key: 'age', label: 'Age band', options: count(scoped.map(e => ageBandOf(e.a))) },
      { key: 'necropsy', label: 'Necropsy', options: count(scoped.map(e => necStatusOf(e.y))) }
    ]
  }, [scoped])

  const filtered = useMemo(
    () =>
      scoped.filter(e => {
        const sel = (k: string) => extra[k] || []
        if (sel('sex').length && !sel('sex').includes(genderLabel(e.g))) return false
        if (sel('year').length && !sel('year').includes(String(e.d || '').slice(0, 4))) return false
        if (sel('cause').length && !sel('cause').includes(e.m || '')) return false
        if (sel('age').length && !sel('age').includes(ageBandOf(e.a))) return false
        if (sel('necropsy').length && !sel('necropsy').includes(necStatusOf(e.y))) return false

        return true
      }),
    [scoped, extra]
  )

  const data = useMemo(
    () =>
      filtered.map(e => ({
        ...e,
        animal: animalName(e),
        sex: genderLabel(e.g),
        date: fmtDate(e.d),
        necropsy: necStatusOf(e.y)
      })),
    [filtered]
  )

  const table = useSortableTable(data, { field: 'd', sort: 'desc' }, 20)

  const filterCount = Object.values(extra).reduce((n, v) => n + v.length, 0)

  const chips: { key: string; label: string; onClear: () => void }[] = [
    ...(site ? [{ key: 'site', label: site, onClear: () => setSite(null) }] : []),
    ...Object.entries(extra).flatMap(([k, vals]) =>
      vals.map(v => ({
        key: `${k}:${v}`,
        label: k === 'necropsy' ? `Necropsy: ${v}` : v,
        onClear: () => setExtra(prev => ({ ...prev, [k]: (prev[k] || []).filter(x => x !== v) }))
      }))
    )
  ]

  /* ── columns — the CoL deaths-table grammar ──────────────────────────────── */

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  // Card shows site only when the visible list spans >1 site (hard site rule) — the Site
  // column is dropped either way (single-site lists don't repeat their scope per row).
  const cardShowsSite = multiSite && !site

  const columns: GridColDef[] = useMemo(
    () => [
      {
        flex: 1,
        minWidth: 380,
        field: 'animal',
        headerName: 'Animal Name & ID',
        renderCell: (p: any) => {
          // No-aid rows keep the classic cell — the card's identity synthesis needs an aid.
          if (!p.row.aid) return <AnimalCell name={p.row.animal} size={40} />
          const s = synthAnimalIdentity(p.row.aid)
          // Real identifiers beat synthesis: the sidecar's idn/idv pair (e.g. "Micro chip")
          // leads with AID second; records without one fall back to the synth set.
          const identifiers =
            p.row.idn && p.row.idv
              ? [
                  { label: idTypeLabel(p.row.idn), value: p.row.idv },
                  { label: 'AID', value: p.row.aid }
                ]
              : s.identifiers

          return (
            // TABLE-VIEW minimal card = the Population grammar (user call 2026-09-05):
            // EXACTLY 3 text rows — max two identifiers + ONE location line (site while
            // the visible list spans sites, enclosure once a single site is picked /
            // all rows are one site — never both); photo 94 → 75.
            <AnimalIdCard
              identifiers={identifiers}
              enclosure={cardShowsSite ? undefined : p.row.e || s.enclosure}
              site={cardShowsSite ? p.row.s : undefined}
              tag='mortality' // death list: the maroon badge, never gender
              size={75}
              photo={s.hasPhoto ? heroPhoto?.src : undefined}
              photoPos={heroPhoto?.bgPos}
            />
          )
        }
      },
      {
        width: 130,
        field: 'a',
        headerName: 'Age at Death',
        renderCell: (p: any) => txt(p.row.a != null ? `${p.row.a}y` : '—', theme.palette.secondary.main, 700)
      },
      { width: 165, field: 'd', headerName: 'Date of Death', renderCell: (p: any) => <CellText noWrap>{p.row.date}</CellText> },
      { width: 110, field: 'sex', headerName: 'Gender', renderCell: (p: any) => txt(p.row.sex) },
      { width: 170, field: 'm', headerName: 'Cause of Death', renderCell: (p: any) => txt(p.row.m || '—', cc.Tertiary, 600) },
      {
        width: 150,
        field: 'necropsy',
        headerName: 'Necropsy',
        renderCell: (p: any) => {
          const s = p.row.necropsy
          const color = s === 'Completed' ? theme.palette.primary.dark : s === 'Pending' ? theme.palette.warning.main : cc.neutralSecondary

          return txt(s, color, 600)
        }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cc, theme, cardShowsSite, heroPhoto]
  )

  /* ── controls — Housing's exact header arrangement ───────────────────────── */

  const search = (
    <SearchPill value={q} onChange={setQ} placeholder='Search animals…' sx={portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 260 }} />
  )

  const siteFilterCtl = multiSite && (
    // THE standard site dropdown (2026-09-02): bottom-sheet picker with per-site counts
    <SiteFilterSelect
      sites={sites.map(name => ({ site: name, caption: `${all.filter(e => e.s === name).length.toLocaleString()} deaths` }))}
      value={site}
      onChange={v => setSite(v)}
      allCaption={`${all.length.toLocaleString()} deaths`}
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

  const titleText = `Deaths · ${table.total.toLocaleString()}`

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
      <SectionCard title='Deaths'>
        <EmptyState message='No deaths recorded for this species' />
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
          <DetailTable
            columns={columns}
            rows={table.rows}
            total={table.total}
            paginationModel={table.paginationModel}
            setPaginationModel={table.setPaginationModel}
            sortModel={table.sortModel}
            handleSortModel={table.handleSortModel}
            stickyFields={['animal']}
            // 75px minimal-card block + breathing room (Population standard, 2026-09-05)
            rowHeight={128}
            onRowClick={
              detailsRoute ? (p: any) => p.row.aid && window.location.assign(detailsRoute(p.row.aid)) : undefined
            }
          />
        ) : (
          <EmptyState message='No deaths match your filters' />
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

export default MortalityTab
