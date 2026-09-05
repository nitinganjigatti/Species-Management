'use client'

// Enclosure Demographics (stakeholder call 2026-08-27, built 2026-08-28) — the pairing
// concept is retired: no parentage data means "pairs" was indefensible, and the readiness
// meters were graphs where a table was asked for. The tab IS one framed table now — every
// enclosure's sex composition directly visible — with a multi-select composition chip row
// (enclosure counts, demo review 2026-09-04) over a pill search + Site dropdown. Row tap
// goes straight to the animals sheet (the old middle sheet,
// enclosures-per-readiness-type, died with the buckets).

import React, { useEffect, useMemo, useState } from 'react'
import { Box, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import {
  SiteFilterSelect,
  AnimalCardRow,
  AnimalIdCard,
  CellText,
  DetailTable,
  DrillSheet,
  EmptyState,
  ENCLOSURE_COMPOSITIONS,
  enclosureAnimalsOf,
  enclosureCompositionOf,
  genderTagOf,
  HeroPhotoContext,
  RowMetaText,
  SectionCard,
  synthAnimalIdentity
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, AnimalTagKind, EnclosureSexKinds } from 'src/views/pages/species-management/ipad3/detail/detailUi'

interface EncRow {
  name: string
  site: string
  section?: string
  male: number
  female: number
  // The aggregate's ONE unsexed bucket, split by the records (user call 2026-09-05 —
  // the table shows the FULL sex anatomy even where a class is empty): any unsexed
  // remainder the records can't name stays UD, so the row always sums to Total.
  // NEVER name a data field `id` — the DataGrid reserves it for the row id and the
  // pagination indexer overwrites it (the ID column printed row numbers, user-caught).
  ud: number
  ind: number
  grp: number
  total: number
  composition: string
}

// Composition = the kit's shared vocabulary (user call 2026-09-05): Male · Female ·
// Male & Female · Undetermined · Indeterminate · Group · Mixed · Empty. This tab has the
// animal RECORDS, so the unsexed bucket splits into UD / ID / G per enclosure.

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

// The animals in one enclosure (standard animal card rows, like Medical). The list
// reconciles against the row's COUNTS — a row showing figures always lists that many
// animals (kit enclosureAnimalsOf tops up dump gaps deterministically).
const EnclosureAnimalsDrawer: React.FC<{
  open: boolean
  site?: string
  enclosure?: string
  counts?: { male: number; female: number; unsexed: number }
  animals: AnimalRecord[]
  onClose: () => void
}> = ({ open, site, enclosure, counts, animals, onClose }) => {
  const theme = useTheme() as any
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open, enclosure])

  const list = useMemo(() => enclosureAnimalsOf(animals, site, enclosure, counts), [animals, site, enclosure, counts])
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
          '& .MuiInputBase-root': { bgcolor: skin.SEARCH_BG, borderRadius: '999px' },
          '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${skin.HAIR}` },
          '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
        }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
      />

      {filtered.length ? (
        <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
          {filtered.map((a, i) => (
            <RealAnimalCardRow key={a.antzId || i} a={a} last={i === filtered.length - 1} />
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
  const [encDrill, setEncDrill] = useState<EncRow | null>(null)
  const [q, setQ] = useState('')
  // Composition = MULTI-select chips (demo review 2026-09-04): the chip row is the
  // top-level scope — search + site work WITHIN the selected compositions. Empty = all.
  const [comps, setComps] = useState<string[]>([])
  const [site, setSite] = useState<string | null>(null)
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  const allRows: EncRow[] = useMemo(() => {
    // The housing aggregates carry ONE unsexed bucket — the animal records say which
    // KIND (undetermined / indeterminate / group), keyed by the same site+enclosure
    // names the animals sheet already joins on.
    const kindsByEnc = new Map<string, EnclosureSexKinds>()
    for (const a of animals) {
      if (!a.site || !a.enclosure) continue
      const k = `${a.site}||${a.enclosure}`
      const rec = kindsByEnc.get(k) || { ud: 0, id: 0, grp: 0 }
      if (a.gender === 'undetermined') rec.ud++
      else if (a.gender === 'indeterminate') rec.id++
      else if (a.gender === 'group') rec.grp++
      kindsByEnc.set(k, rec)
    }

    const list: EncRow[] = []
    for (const s of housing?.sites || []) {
      for (const enc of s.enclosures) {
        const kinds = kindsByEnc.get(`${s.name}||${enc.name}`)
        const ind = Math.min(kinds?.id || 0, enc.unsexed)
        const grp = Math.min(kinds?.grp || 0, Math.max(enc.unsexed - ind, 0))
        const ud = Math.max(enc.unsexed - ind - grp, 0)
        list.push({
          name: enc.name,
          site: s.name,
          section: enc.section,
          male: enc.male,
          female: enc.female,
          ud,
          ind,
          grp,
          total: enc.total,
          // The RECONCILED split feeds the classifier — Composition always agrees with
          // the UD | ID | G columns on the same row.
          composition: enclosureCompositionOf(enc.male, enc.female, enc.unsexed, enc.total, { ud, id: ind, grp })
        })
      }
    }

    return list
  }, [housing, animals])

  const siteNames = useMemo(() => Array.from(new Set(allRows.map(r => r.site))), [allRows])
  const compositionOptions = useMemo(() => ENCLOSURE_COMPOSITIONS.filter(c => allRows.some(r => r.composition === c)), [allRows])

  // Enclosure count per composition — from ALL rows (the chips sit ABOVE search/site,
  // so their figures never shift under a search).
  const compCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of allRows) m.set(r.composition, (m.get(r.composition) || 0) + 1)

    return m
  }, [allRows])

  const toggleComp = (v: string) => {
    setComps(s => (s.includes(v) ? s.filter(x => x !== v) : [...s, v]))
    setPm(p => ({ ...p, page: 0 }))
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return allRows.filter(
      r =>
        (!query || `${r.name} ${r.site} ${r.section || ''}`.toLowerCase().includes(query)) &&
        (!comps.length || comps.includes(r.composition)) &&
        (!site || r.site === site)
    )
  }, [allRows, q, comps, site])

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
    // NO serial numbers — demo-review hard rule 2026-09-04 (user re-caught here 2026-09-05).
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'name',
      headerName: 'Enclosure',
      // Site in faint type beneath the enclosure ONLY while the list spans >1 site
      // (the platform site-row rule; user call 2026-09-05) — one selected site (or a
      // single-site species) already names it, so the sub-line goes.
      renderCell: p => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cc.OnSurfaceVariant }} noWrap>
            {p.row.name}
          </Typography>
          {!site && siteNames.length > 1 && (
            <Typography variant='caption' sx={{ color: skin.FAINT }} noWrap>
              {p.row.site}
            </Typography>
          )}
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
    // The FULL sex anatomy rides the table even where a class is empty (user call
    // 2026-09-05) — ID/G print the pale dash until such records exist.
    numCol('male', 'M'),
    numCol('female', 'F'),
    numCol('ud', 'UD'),
    numCol('ind', 'ID'),
    numCol('grp', 'G'),
    numCol('total', 'Total', { total: true })
  ]

  const start = pm.page * pm.pageSize
  const indexed = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Controls live INSIDE the table card (user call 2026-09-01). Demo review
          2026-09-04 + user call 2026-09-05: composition = a MULTI-SELECT chip row on
          top (label + enclosure count, tap toggles — replaces the old dropdown);
          search + site sit below and work within the chip selection. Single-site
          species never see the site dropdown. */}
      <SectionCard
        titleMb={4}
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
            {/* one scrolling row, never wraps — a wrapped second row reads as a second
                control. "All" leads (user call 2026-09-05): count = every enclosure,
                selected while nothing else is picked, tap clears the selection. */}
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {['All', ...compositionOptions].map(comp => {
                const isAll = comp === 'All'
                const on = isAll ? comps.length === 0 : comps.includes(comp)
                const count = isAll ? allRows.length : compCounts.get(comp) || 0

                return (
                  <Box
                    key={comp}
                    onClick={() => {
                      if (isAll) {
                        setComps([])
                        setPm(p => ({ ...p, page: 0 }))
                      } else {
                        toggleComp(comp)
                      }
                    }}
                    sx={{
                      height: 36,
                      px: 3.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderRadius: '999px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      border: `1px solid ${on ? skin.LIST_GREEN : skin.HAIR}`,
                      backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.1) : '#ffffff',
                      '&:hover': { backgroundColor: on ? skin.mixOverWhite(skin.LIST_GREEN, 0.13) : skin.ROW_HOVER }
                    }}
                  >
                    <Typography sx={{ fontSize: '14px', fontWeight: on ? 600 : 500, color: on ? skin.LIST_GREEN : skin.INK2 }}>
                      {comp}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: on ? skin.LIST_GREEN : skin.FAINT }}>
                      {count.toLocaleString()}
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
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
                  '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px', height: 44 },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
                }}
                InputProps={{
                  startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} />
                }}
              />
              {siteNames.length > 1 && (
                // THE standard site dropdown (2026-09-02): bottom-sheet picker with per-site counts
                <SiteFilterSelect
                  sites={siteNames.map(name => ({ site: name, caption: `${allRows.filter(r => r.site === name).length.toLocaleString()} enclosures` }))}
                  value={site}
                  onChange={v => {
                    setSite(v)
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                  allCaption={`${allRows.length.toLocaleString()} enclosures`}
                />
              )}
            </Box>
          </Box>
        }
      >
        {filtered.length ? (
          <DetailTable
            columns={columns}
            rows={indexed}
            total={filtered.length}
            paginationModel={pm}
            setPaginationModel={setPm}
            onRowClick={(p: { row: EncRow }) => setEncDrill(p.row)}
          />
        ) : (
          <EmptyState message='No enclosures match your filters' />
        )}
      </SectionCard>

      {/* Row tap → the animals in that enclosure */}
      <EnclosureAnimalsDrawer
        open={!!encDrill}
        site={encDrill?.site}
        enclosure={encDrill?.name}
        counts={encDrill ? { male: encDrill.male, female: encDrill.female, unsexed: encDrill.ud + encDrill.ind + encDrill.grp } : undefined}
        animals={animals}
        onClose={() => setEncDrill(null)}
      />
    </Box>
  )
}

export default PairingTab
