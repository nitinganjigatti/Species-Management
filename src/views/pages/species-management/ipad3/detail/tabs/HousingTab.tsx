'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import {
  SiteFilterSelect,
  CategoryFilter,
  countCol,
  DetailTable,
  DrillSheet,
  EmptyState,
  ENCLOSURE_COMPOSITIONS,
  enclosureAnimalsOf,
  enclosureCompositionOf,
  NameSiteCell,
  RealAnimalCardRow,
  SearchPill,
  SectionCard,
  splitUnsexed,
  txtCell,
  ViewToggle
} from 'src/views/pages/species-management/ipad3/detail/detailUi'

// Animal card rows = the kit RealAnimalCardRow (the former local copy moved there).

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
  // Composition filter = the LOCKED ladder vocabulary (user call 2026-09-05; "Single
  // Sexed" retired) — one word set across the whole module.
  const [composition, setComposition] = useState<string | null>(null)
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
        (s.enclosures || []).map(e => {
          const split = splitUnsexed(Number(e.unsexed || 0), kindsByEnc.get(`${s.name}||${e.name}`))

          return {
            ...e,
            site: s.name,
            ...split,
            // Composition computed ONCE per row (the locked ladder, reconciled split) —
            // the column and the filter both read this same string.
            composition: enclosureCompositionOf(Number(e.male || 0), Number(e.female || 0), Number(e.unsexed || 0), Number(e.total || 0), {
              ud: split.ud,
              id: split.ind,
              grp: split.grp
            })
          }
        })
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

  // Only ladder words the data actually contains — the menu never offers a dead pick.
  const compositionOptions = useMemo(
    () => ENCLOSURE_COMPOSITIONS.filter(c => allEnclosures.some(e => e.composition === c)),
    [allEnclosures]
  )

  const filtered = useMemo(() => {
    if (isSite) return query ? siteRows.filter(r => r.name.toLowerCase().includes(query)) : siteRows

    if (isSection) {
      let list = siteFilter ? sectionRows.filter(r => r.site === siteFilter) : sectionRows

      return query ? list.filter(r => `${r.name} ${r.site}`.toLowerCase().includes(query)) : list
    }

    let list = composition ? allEnclosures.filter(e => e.composition === composition) : allEnclosures
    if (siteFilter) list = list.filter(e => e.site === siteFilter)

    return query
      ? list.filter(e => `${e.name} ${e.section || ''} ${e.type || ''} ${e.site || ''}`.toLowerCase().includes(query))
      : list
  }, [isSite, isSection, siteRows, sectionRows, allEnclosures, query, composition, siteFilter])

  useEffect(() => {
    setPm(p => ({ ...p, page: 0 }))
  }, [tableView, query, composition, siteFilter])

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


  // The kit identity cell — name wraps (2-line clamp), site rides as the faint sub-line.
  const enclosureCell = (p: GridRenderCellParams) => <NameSiteCell name={p.row.name} sub={p.row.site || undefined} />

  // Composition = the enriched row's precomputed ladder word (single source with the filter).
  const compositionCol: GridColDef = {
    width: 160,
    sortable: false,
    field: 'composition',
    headerName: 'Composition',
    renderCell: p => txtCell(p.row.composition)
  }

  // NO serial numbers (demo-review hard rule 2026-09-04); every table carries the FULL
  // gender anatomy M | F | UD | ID | G | Total (the Pairing standard, user call 2026-09-05).
  // Count columns are FIXED width — flexed numbers ballooned while the name column
  // stayed pinched (user-caught 2026-09-05); every spare pixel now goes to the name.
  const siteColumns: GridColDef[] = [
    { minWidth: 234, flex: 1, sortable: false, field: 'name', headerName: 'Site', renderCell: p => txtCell(p.row.name, cc.OnSurfaceVariant, 600) },
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true }),
    countCol('nEncl', 'Encl', { width: 84 })
  ]
  // Section rows reuse the enclosure identity cell (name + site sub-line) and the
  // site table's count columns, plus the Encl count.
  const sectionColumns: GridColDef[] = [
    { minWidth: 234, flex: 1, sortable: false, field: 'name', headerName: 'Section', renderCell: enclosureCell },
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true }),
    countCol('nEncl', 'Encl', { width: 84 })
  ]
  const enclosureColumns: GridColDef[] = [
    { minWidth: 240, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: enclosureCell },
    compositionCol,
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true })
  ]

  // Sheet-1 columns: a single site's enclosures (the sheet title already names the site).
  const sheetColumns: GridColDef[] = [
    { minWidth: 200, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txtCell(p.row.name, cc.OnSurfaceVariant, 600) },
    compositionCol,
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true })
  ]

  const start = pm.page * pm.pageSize
  const rows = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i }))
  const sheetStart = sheetPm.page * sheetPm.pageSize
  const sheetRows = sheetEnclosures.slice(sheetStart, sheetStart + sheetPm.pageSize).map((e, i) => ({ ...e, id: sheetStart + i }))

  const search = (
    <SearchPill
      value={q}
      onChange={setQ}
      placeholder={isSite ? 'Search sites…' : isSection ? 'Search sections…' : 'Search enclosures…'}
      sx={portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 260 }}
    />
  )

  // Composition filter belongs to the enclosure grain only (sections aggregate it away).
  // The kit CategoryFilter, speaking the ladder vocabulary (user call 2026-09-05).
  const enclFilterCtl = isEncl && (
    <CategoryFilter
      radius='999px'
      width={200}
      options={compositionOptions}
      value={composition}
      onChange={v => setComposition(v)}
      placeholder='All compositions'
      icon='mdi:gender-male-female'
    />
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
        <SearchPill ground value={animalQ} onChange={setAnimalQ} placeholder='Search animals…' sx={{ width: '100%', mb: 2 }} />

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
