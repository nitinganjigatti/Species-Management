'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, MenuItem, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import {
  SiteFilterSelect,
  AnimalCardRow,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  DetailTable,
  DrillSheet,
  EmptyState,
  enclosureAnimalsOf,
  enclosureCompositionOf,
  genderTagOf,
  HeroPhotoContext,
  RowMetaText,
  SectionCard,
  splitUnsexed,
  synthAnimalIdentity,
  ViewToggle
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, AnimalTagKind } from 'src/views/pages/species-management/ipad3/detail/detailUi'

/** The standard animal card row (2026-09-02), driven by the RECORD's real fields: gender →
 *  badge, ring/chip + AID → identifiers, name only when AID is the sole identifier. The kit's
 *  AnimalCardRow synthesizes identity from the aid alone, so this keeps its exact row chrome
 *  but feeds AnimalIdCard the real data (synth fills only the photo-presence slot). The sheet
 *  is scoped to ONE enclosure — site + enclosure stay OFF the card (the header names them);
 *  age/weight, which the card doesn't carry, ride as right-aligned meta lines. */
// Thin adapter over the kit AnimalCardRow: REAL AnimalRecord fields in, per the contract.
// Enclosure + site stay OFF these cards — the sheet is scoped to one enclosure.
const RealAnimalCardRow: React.FC<{ a: AnimalRecord; last?: boolean }> = ({ a, last }) => {
  const theme = useTheme() as any
  const c = theme.palette.customColors as Record<string, string>

  const tag: AnimalTagKind = genderTagOf(a.gender)
  const primary: AnimalCardId | null = a.ring
    ? { label: 'Ring', value: a.ring }
    : a.chip
      ? { label: 'Chip', value: a.chip }
      : null
  const identifiers: AnimalCardId[] = primary
    ? [primary, { label: 'AID', value: a.antzId }]
    : [{ label: 'AID', value: a.antzId }]

  // Max 2 identifiers render (AID always counts) — a chip crowded out by a ring rides as meta.
  // Age/weight live IN the card component now (its right stat block, empty values
  // self-hide) — meta keeps only the chip crowded out by a ring.
  const meta = [a.ring && a.chip ? `Chip: ${a.chip}` : null].filter(Boolean) as string[]

  return (
    <AnimalCardRow
      aid={a.antzId}
      identifiers={identifiers}
      tag={tag}
      name={a.name && a.name !== a.antzId ? a.name : undefined}
      age={a.age}
      weight={a.weight}
      meta={
        meta.length > 0 ? (
          <>
            {meta.map((m, i) => (
              <RowMetaText key={i} strong={i === 0}>
                {m}
              </RowMetaText>
            ))}
          </>
        ) : undefined
      }
      last={last}
    />
  )
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
  const [enclSheet, setEnclSheet] = useState<{ site: string; section?: string } | null>(null)
  const [animalSheet, setAnimalSheet] = useState<{
    site: string
    enclosure: string
    counts?: { male: number; female: number; unsexed: number }
  } | null>(null)
  const [animalQ, setAnimalQ] = useState('')
  const [sheetPm, setSheetPm] = useState({ page: 0, pageSize: 10 })
  const [tableView, setTableView] = useState<'site' | 'section' | 'enclosure'>('site')
  const [enclFilter, setEnclFilter] = useState<'all' | 'single' | 'male' | 'female' | 'unsexed'>('all')
  const [siteFilter, setSiteFilter] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  const sites = housing?.sites || []
  // Single-site species get NO site-wise view, no toggle, no site dropdown (stakeholder
  // call 2026-08-27) — the tab opens straight on the enclosure table.
  const multiSite = sites.length > 1
  const isSite = multiSite && tableView === 'site'
  const isSection = tableView === 'section'
  const isEncl = !isSite && !isSection
  const query = q.trim().toLowerCase()

  // The records say WHICH kind of unsexed (UD / ID / G) — the aggregates carry one
  // bucket. One pass builds the per-site and per-enclosure kind maps (the Pairing
  // anatomy, user call 2026-09-05: Housing tables carry the FULL gender columns).
  const { kindsBySite, kindsByEnc } = useMemo(() => {
    const bySite = new Map<string, { ud: number; id: number; grp: number }>()
    const byEnc = new Map<string, { ud: number; id: number; grp: number }>()
    for (const a of animals) {
      if (!a.site) continue
      const bump = (m: Map<string, { ud: number; id: number; grp: number }>, k: string) => {
        const rec = m.get(k) || { ud: 0, id: 0, grp: 0 }
        if (a.gender === 'undetermined') rec.ud++
        else if (a.gender === 'indeterminate') rec.id++
        else if (a.gender === 'group') rec.grp++
        else return
        m.set(k, rec)
      }
      bump(bySite, a.site)
      if (a.enclosure) bump(byEnc, `${a.site}||${a.enclosure}`)
    }

    return { kindsBySite: bySite, kindsByEnc: byEnc }
  }, [animals])

  // Site-wise rollup (one row per site) and the flat enclosure list (across all sites) —
  // both enriched with the reconciled ud/ind/grp split (rows always sum to Total).
  const siteRows = useMemo(
    () =>
      sites.map(s => ({
        name: s.name,
        site: s.name,
        male: s.males,
        female: s.females,
        unsexed: s.unsexed,
        ...splitUnsexed(Number(s.unsexed || 0), kindsBySite.get(s.name)),
        total: s.total,
        nEncl: s.enclosures.length,
        pairs: s.pairs
      })),
    [sites, kindsBySite]
  )
  const allEnclosures = useMemo(
    () =>
      sites.flatMap(s =>
        (s.enclosures || []).map(e => ({
          ...e,
          site: s.name,
          ...splitUnsexed(Number(e.unsexed || 0), kindsByEnc.get(`${s.name}||${e.name}`))
        }))
      ),
    [sites, kindsByEnc]
  )

  // Section-wise rollup (2026-08-31): one row per (site, section), aggregated from the
  // enclosure counts — same shape as siteRows so the num()/Total/Encl columns carry over.
  const sectionRows = useMemo(() => {
    const m = new Map<
      string,
      { name: string; site: string; male: number; female: number; unsexed: number; ud: number; ind: number; grp: number; total: number; nEncl: number }
    >()
    for (const e of allEnclosures) {
      const sec = e.section || 'Unsectioned'
      const key = `${e.site}|${sec}`
      const r = m.get(key) || { name: sec, site: e.site, male: 0, female: 0, unsexed: 0, ud: 0, ind: 0, grp: 0, total: 0, nEncl: 0 }
      r.male += Number(e.male || 0)
      r.female += Number(e.female || 0)
      r.unsexed += Number(e.unsexed || 0)
      // Sections SUM their enclosures' reconciled splits — a section row always equals
      // the enclosure rows its drill lists.
      r.ud += e.ud
      r.ind += e.ind
      r.grp += e.grp
      r.total += Number(e.total || 0)
      r.nEncl += 1
      m.set(key, r)
    }

    return Array.from(m.values()).sort((a, b) => a.site.localeCompare(b.site) || a.name.localeCompare(b.name))
  }, [allEnclosures])
  const multiSection = sectionRows.length > 1

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

    if (isSection) {
      let list = siteFilter ? sectionRows.filter(r => r.site === siteFilter) : sectionRows

      return query ? list.filter(r => `${r.name} ${r.site}`.toLowerCase().includes(query)) : list
    }

    let list = enclFilter === 'all' ? allEnclosures : allEnclosures.filter(matchEncl)
    if (siteFilter) list = list.filter(e => e.site === siteFilter)

    return query
      ? list.filter(e => `${e.name} ${e.section || ''} ${e.type || ''} ${e.site || ''}`.toLowerCase().includes(query))
      : list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSite, isSection, siteRows, sectionRows, allEnclosures, query, enclFilter, siteFilter])

  useEffect(() => {
    setPm(p => ({ ...p, page: 0 }))
  }, [tableView, query, enclFilter, siteFilter])

  // Sheet 1 — the enclosures within the picked site (the ENRICHED list, so the sheet
  // table carries the same ud/ind/grp columns as the page).
  const sheetEnclosures = useMemo(() => {
    if (!enclSheet) return []

    return allEnclosures.filter(
      e => e.site === enclSheet.site && (!enclSheet.section || (e.section || 'Unsectioned') === enclSheet.section)
    )
  }, [allEnclosures, enclSheet])
  useEffect(() => {
    setSheetPm(p => ({ ...p, page: 0 }))
  }, [enclSheet])

  // Sheet 2 — the animals within the picked enclosure. Reconciled against the row's
  // counts: a row showing figures always lists that many animals (kit
  // enclosureAnimalsOf tops up dump gaps deterministically).
  const sheetAnimals = useMemo(
    () => (animalSheet ? enclosureAnimalsOf(animals, animalSheet.site, animalSheet.enclosure, animalSheet.counts) : []),
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
  // Numbers right-aligned (the 2026-08-27 table rule); zeros print the pale em dash;
  // Total = bold list-green (the scan anchor, same as the listing).
  const num = (field: string, opts?: { total?: boolean; header?: string }): GridColDef => ({
    width: 64, // compact count column (user call 2026-09-05) — 20/16 cell pad leaves room for 3 digits
    sortable: false,
    align: 'right',
    headerAlign: 'right',
    field,
    headerName:
      opts?.header ||
      (field === 'male' ? 'M' : field === 'female' ? 'F' : field === 'ud' ? 'UD' : field === 'ind' ? 'ID' : field === 'grp' ? 'G' : field),
    renderCell: (p: GridRenderCellParams) => {
      const n = Number(p.row[field] || 0)
      if (opts?.total) return txt(n.toLocaleString(), skin.LIST_GREEN, 700)

      return n > 0 ? txt(n.toLocaleString(), undefined, 600) : txt('—', skin.DASH_INK, 400)
    }
  })

  // Enclosure name with its site in small faint type beneath — the site-below-enclosure
  // rule. A long name WRAPS to a second line instead of clipping (user call 2026-09-05),
  // clamped at 2 so the 72px row never overflows.
  const enclosureCell = (p: GridRenderCellParams) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: cc.OnSurfaceVariant,
          lineHeight: 1.25,
          whiteSpace: 'normal', // cells inherit the grid's nowrap — re-allow breaks
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {p.row.name}
      </Typography>
      {p.row.site ? (
        <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
          {p.row.site}
        </Typography>
      ) : null}
    </Box>
  )

  // Composition = the kit's LOCKED ladder, fed the row's reconciled split — the label
  // always agrees with the UD | ID | G columns beside it.
  const compositionCol: GridColDef = {
    width: 160,
    sortable: false,
    field: 'composition',
    headerName: 'Composition',
    renderCell: p =>
      txt(
        enclosureCompositionOf(Number(p.row.male || 0), Number(p.row.female || 0), Number(p.row.unsexed || 0), Number(p.row.total || 0), {
          ud: Number(p.row.ud || 0),
          id: Number(p.row.ind || 0),
          grp: Number(p.row.grp || 0)
        })
      )
  }

  // NO serial numbers (demo-review hard rule 2026-09-04); every table carries the FULL
  // gender anatomy M | F | UD | ID | G | Total (the Pairing standard, user call 2026-09-05).
  // Count columns are FIXED width — flexed numbers ballooned while the name column
  // stayed pinched (user-caught 2026-09-05); every spare pixel now goes to the name.
  const siteColumns: GridColDef[] = [
    { minWidth: 234, flex: 1, sortable: false, field: 'name', headerName: 'Site', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    num('male'),
    num('female'),
    num('ud'),
    num('ind'),
    num('grp'),
    { ...num('total', { total: true, header: 'Total' }), width: 96 },
    { ...num('nEncl', { header: 'Encl' }), width: 84 }
  ]
  // Section rows reuse the enclosure identity cell (name + site sub-line) and the
  // site table's count columns, plus the Encl count.
  const sectionColumns: GridColDef[] = [
    { minWidth: 234, flex: 1, sortable: false, field: 'name', headerName: 'Section', renderCell: enclosureCell },
    num('male'),
    num('female'),
    num('ud'),
    num('ind'),
    num('grp'),
    { ...num('total', { total: true, header: 'Total' }), width: 96 },
    { ...num('nEncl', { header: 'Encl' }), width: 84 }
  ]
  const enclosureColumns: GridColDef[] = [
    { minWidth: 240, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: enclosureCell },
    compositionCol,
    num('male'),
    num('female'),
    num('ud'),
    num('ind'),
    num('grp'),
    { ...num('total', { total: true, header: 'Total' }), width: 96 }
  ]

  // Sheet-1 columns: a single site's enclosures (the sheet title already names the site).
  const sheetColumns: GridColDef[] = [
    { minWidth: 200, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    compositionCol,
    num('male'),
    num('female'),
    num('ud'),
    num('ind'),
    num('grp'),
    { ...num('total', { total: true, header: 'Total' }), width: 96 }
  ]

  const start = pm.page * pm.pageSize
  const rows = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i }))
  const sheetStart = sheetPm.page * sheetPm.pageSize
  const sheetRows = sheetEnclosures.slice(sheetStart, sheetStart + sheetPm.pageSize).map((e, i) => ({ ...e, id: sheetStart + i }))

  const search = (
    <TextField
      size='small'
      placeholder={isSite ? 'Search sites…' : isSection ? 'Search sections…' : 'Search enclosures…'}
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

  // Composition filter belongs to the enclosure grain only (sections aggregate it away).
  const enclFilterCtl = isEncl && (
    <TextField
      select
      size='small'
      value={enclFilter}
      onChange={e => setEnclFilter(e.target.value as typeof enclFilter)}
      sx={{
        minWidth: 150,
        '& .MuiInputBase-root': { height: 44, bgcolor: '#ffffff', borderRadius: '999px', fontSize: '15px', fontWeight: 500, color: skin.INK2 },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.DROPDOWN_BORDER_HOVER }
      }}
    >
      <MenuItem value='all'>All</MenuItem>
      <MenuItem value='single'>Single Sexed</MenuItem>
      <MenuItem value='male'>Male only</MenuItem>
      <MenuItem value='female'>Female only</MenuItem>
      <MenuItem value='unsexed'>Unsexed only</MenuItem>
    </TextField>
  )

  // Site dropdown — section + enclosure views, and only for multi-site species.
  const siteFilterCtl = !isSite && multiSite && (
    // THE standard site dropdown (2026-09-02): bottom-sheet picker with per-site counts
    <SiteFilterSelect
      sites={sites.map(st => ({ site: st.name, caption: `${st.total.toLocaleString()} animals • ${st.enclosures.length.toLocaleString()} enclosures` }))}
      value={siteFilter}
      onChange={v => setSiteFilter(v)}
      allCaption={`${sites.reduce((n, st) => n + st.total, 0).toLocaleString()} animals`}
    />
  )

  const titleText = `${isSite ? 'Sites' : isSection ? 'Sections' : 'Enclosures'} · ${filtered.length.toLocaleString()}`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* One section. Landscape: title + count (left) · filter + Site/Enclosure toggle +
          search (right). Portrait: title + right-aligned toggle, then full-width search
          up to the right-aligned filter. */}
      {(() => {
        // Toggle offers only the grains this species HAS: sites need >1 site, sections
        // need >1 (site, section) pair; enclosure is always on. One option = no toggle.
        const toggleItems = [
          ...(multiSite ? [{ key: 'site', label: 'Site-Wise', icon: 'mdi:map-marker-outline' }] : []),
          ...(multiSection ? [{ key: 'section', label: 'Section-Wise', icon: 'mdi:floor-plan' }] : []),
          { key: 'enclosure', label: 'Enclosure-Wise', icon: 'mdi:home-outline' }
        ]
        // The kit ViewToggle (2026-09-05) — single-site species map their forced 'site'
        // state onto the visible Enclosure-Wise segment.
        const viewToggle = (
          <ViewToggle
            height={44}
            items={toggleItems}
            value={!multiSite && tableView === 'site' ? 'enclosure' : tableView}
            onChange={k => setTableView(k as 'site' | 'section' | 'enclosure')}
          />
        )

        const stackedHeader = (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
                {titleText}
              </Typography>
              {toggleItems.length > 1 && viewToggle}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {search}
              {enclFilterCtl}
              {siteFilterCtl}
            </Box>
          </Box>
        )

        return (
      <SectionCard
        title={portrait ? stackedHeader : titleText}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {enclFilterCtl}
              {toggleItems.length > 1 && viewToggle}
              {search}
            </Box>
          )
        }
      >
        {filtered.length ? (
          <DetailTable
            columns={isSite ? siteColumns : isSection ? sectionColumns : enclosureColumns}
            rows={rows}
            total={filtered.length}
            paginationModel={pm}
            setPaginationModel={setPm}
            onRowClick={(params: { row: Record<string, any> }) =>
              isSite
                ? setEnclSheet({ site: params.row.name })
                : isSection
                  ? setEnclSheet({ site: params.row.site, section: params.row.name })
                  : setAnimalSheet({
                      site: params.row.site,
                      enclosure: params.row.name,
                      counts: {
                        male: Number(params.row.male || 0),
                        female: Number(params.row.female || 0),
                        unsexed: Number(params.row.unsexed || 0)
                      }
                    })
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
        title={enclSheet?.section || enclSheet?.site}
        eyebrow={`${enclSheet?.section ? `${enclSheet.site} · ` : ''}${sheetEnclosures.length} enclosure${sheetEnclosures.length === 1 ? '' : 's'} · click a row for its animals`}
      >
        {sheetEnclosures.length ? (
          <DetailTable
              columns={sheetColumns}
              rows={sheetRows}
              total={sheetEnclosures.length}
              paginationModel={sheetPm}
              setPaginationModel={setSheetPm}
              onRowClick={(params: { row: Record<string, any> }) =>
                enclSheet &&
                setAnimalSheet({
                  site: enclSheet.site,
                  enclosure: params.row.name,
                  counts: {
                    male: Number(params.row.male || 0),
                    female: Number(params.row.female || 0),
                    unsexed: Number(params.row.unsexed || 0)
                  }
                })
              }
              framed
            />
        ) : (
          <EmptyState message='No enclosures for this site' />
        )}
      </DrillSheet>

      {/* Sheet 2 — stacked on top — the animals in one enclosure (standard animal card rows) */}
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
            '& .MuiInputBase-root': { bgcolor: skin.SEARCH_BG, borderRadius: '999px' },
            '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${skin.HAIR}` },
            '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
          }}
          InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
        />

        {animalFiltered.length ? (
          <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
            {animalFiltered.map((a, i) => (
              <RealAnimalCardRow key={a.antzId || i} a={a} last={i === animalFiltered.length - 1} />
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
