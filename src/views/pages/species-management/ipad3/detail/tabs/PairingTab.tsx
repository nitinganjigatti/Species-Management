'use client'

// Enclosure Demographics (stakeholder call 2026-08-27, built 2026-08-28) — the pairing
// concept is retired: no parentage data means "pairs" was indefensible, and the readiness
// meters were graphs where a table was asked for. The tab IS one framed table now — every
// enclosure's sex composition directly visible — with a multi-select composition chip row
// (enclosure counts, demo review 2026-09-04) over a pill search + Site dropdown. Row tap
// goes straight to the animals sheet (the old middle sheet,
// enclosures-per-readiness-type, died with the buckets).

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import {
  SiteFilterSelect,
  ChipFilterRow,
  clearDetailJump,
  countCol,
  DetailTable,
  DrillSheet,
  EmptyState,
  ENCLOSURE_COMPOSITIONS,
  enclosureAnimalsOf,
  enclosureCompositionOf,
  NameSiteCell,
  peekDetailJump,
  RealAnimalCardRow,
  SearchPill,
  SectionCard,
  splitUnsexed,
  txtCell,
  ViewToggle
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { EnclosureSexKinds } from 'src/views/pages/species-management/ipad3/detail/detailUi'

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
// Animal card rows = the kit RealAnimalCardRow (the former local copy moved there).

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
      <SearchPill ground value={q} onChange={setQ} placeholder='Search animals…' sx={{ width: '100%', mb: 2 }} />

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

/* ── site-wise composition buckets, FLIPPED emphasis (user call 2026-09-09, wireframe
   approved): the buckets classify ENCLOSURES, so the enclosure count is the bold figure
   and the quiet line under it itemizes the animals inside, class-tagged (12M • 3F).
   Full ladder restored the same day — the 09-07 grid folded UD/ID/G into "Unsexed" and
   rode Mixed on Male & Female; now every composition has its own column, grouped by a
   two-tier header: Single Sex (Male/Female Only) · Dominance (the Male & Female split:
   Male Dom / Female Dom / Pair 1:1) · Mixed (the multi-class catch-all) · Unknown
   (Undet./Indet./Group) · Empty · Total. Every enclosure lands in EXACTLY one bucket,
   so the row's bold figures sum to Total. */

type Bucket = 'maleOnly' | 'femaleOnly' | 'maleDom' | 'femaleDom' | 'pair' | 'mixedB' | 'undet' | 'indet' | 'groupB' | 'emptyB'

const BUCKETS: Bucket[] = ['maleOnly', 'femaleOnly', 'maleDom', 'femaleDom', 'pair', 'mixedB', 'undet', 'indet', 'groupB', 'emptyB']

// Enclosure row → bucket. The kit composition ladder already isolates every class —
// only 'Male & Female' needs the row's own M/F counts to pick its dominance side.
const bucketOf = (r: EncRow): Bucket => {
  switch (r.composition) {
    case 'Male':
      return 'maleOnly'
    case 'Female':
      return 'femaleOnly'
    case 'Male & Female':
      return r.male > r.female ? 'maleDom' : r.female > r.male ? 'femaleDom' : 'pair'
    case 'Undetermined':
      return 'undet'
    case 'Indeterminate':
      return 'indet'
    case 'Group':
      return 'groupB'
    case 'Empty':
      return 'emptyB'
    default:
      return 'mixedB' // 'Mixed' — any multi-class blend involving UD/ID/G
  }
}

// One bucket's cell: enclosures (the bold figure) + the class-wise animals inside.
interface BucketCell {
  e: number
  m: number
  f: number
  ud: number
  ind: number
  grp: number
}

const emptyCell = (): BucketCell => ({ e: 0, m: 0, f: 0, ud: 0, ind: 0, grp: 0 })

interface SiteRow {
  site: string
  buckets: Record<Bucket, BucketCell>
  totalE: number
  totalA: number
}

// Quiet-line grammar: fixed segment order M · F · UD · ID · G, zero classes OMITTED
// (never dashed); one segment breathes ("62 M"), several compact and join on a full
// bullet ("12M • 3F" — user call 2026-09-09: the separator must be clearly visible).
const animalsLineOf = (c: BucketCell): string => {
  const segs = (
    [
      [c.m, 'M'],
      [c.f, 'F'],
      [c.ud, 'UD'],
      [c.ind, 'ID'],
      [c.grp, 'G']
    ] as [number, string][]
  ).filter(([n]) => n > 0)
  if (!segs.length) return '—'
  if (segs.length === 1) return `${segs[0][0].toLocaleString()} ${segs[0][1]}`

  return segs.map(([n, t]) => `${n.toLocaleString()}${t}`).join(' • ')
}

const PairingTab: React.FC<{ housing?: SpeciesHousing; animals?: AnimalRecord[] }> = ({ housing, animals = [] }) => {
  const [encDrill, setEncDrill] = useState<EncRow | null>(null)
  const [q, setQ] = useState('')
  // Composition = MULTI-select chips (demo review 2026-09-04): the chip row is the
  // top-level scope — search + site work WITHIN the selected compositions. Empty = all.
  const [comps, setComps] = useState<string[]>([])
  const [site, setSite] = useState<string | null>(null)
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })

  // Site-Wise | Enclosure-Wise (user call 2026-09-07 — Housing's rule): multi-site
  // species open on the site verdict table; single-site species have no site story
  // to tell and go straight to enclosures (no toggle).
  const multiSite = (housing?.sites?.length ?? 0) > 1
  const [view, setView] = useState<'site' | 'enclosure'>(multiSite ? 'site' : 'enclosure')

  // Site-Wise controls (user call 2026-09-07): its own search.
  const [qSite, setQSite] = useState('')

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
        const { ud, ind, grp } = splitUnsexed(enc.unsexed, kinds)
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

  // Banner jump (user call 2026-09-07): an M/F/U banner pill lands here with that
  // composition chip pre-applied — but only when the ladder actually holds such an
  // enclosure (a chip the row doesn't offer must never filter invisibly). Mount-only:
  // the container gates this tab behind housing.isLoading, so allRows is already final.
  useEffect(() => {
    const j = peekDetailJump('pairingComposition')
    if (j) {
      if (allRows.some(r => r.composition === j.composition)) {
        setComps([j.composition])
        setView('enclosure') // the chips are enclosure-view scope
      }
      clearDetailJump()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const siteNames = useMemo(() => Array.from(new Set(allRows.map(r => r.site))), [allRows])
  const compositionOptions = useMemo(() => ENCLOSURE_COMPOSITIONS.filter(c => allRows.some(r => r.composition === c)), [allRows])

  // Enclosure count per composition — from ALL rows (the chips sit ABOVE search/site,
  // so their figures never shift under a search).
  const compCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of allRows) m.set(r.composition, (m.get(r.composition) || 0) + 1)

    return m
  }, [allRows])

  /* ── site-wise bucket rows: per site, each bucket accumulates its enclosure count
     (the bold figure) AND the class-wise animal counts inside (the quiet line). ── */
  const siteRows: SiteRow[] = useMemo(() => {
    const by = new Map<string, SiteRow>()
    for (const r of allRows) {
      let s = by.get(r.site)
      if (!s) {
        s = {
          site: r.site,
          buckets: Object.fromEntries(BUCKETS.map(b => [b, emptyCell()])) as Record<Bucket, BucketCell>,
          totalE: 0,
          totalA: 0
        }
        by.set(r.site, s)
      }
      const c = s.buckets[bucketOf(r)]
      c.e += 1
      c.m += r.male
      c.f += r.female
      c.ud += r.ud
      c.ind += r.ind
      c.grp += r.grp
      s.totalE += 1
      s.totalA += r.total
    }

    return [...by.values()].sort((a, b) => b.totalA - a.totalA)
  }, [allRows])

  const siteRowsFiltered = useMemo(() => {
    const query = qSite.trim().toLowerCase()

    return siteRows.filter(r => !query || r.site.toLowerCase().includes(query))
  }, [siteRows, qSite])

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

  const columns: GridColDef[] = [
    // NO serial numbers — demo-review hard rule 2026-09-04 (also enforced in DetailTable).
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'name',
      headerName: 'Enclosure',
      // Site sub-line ONLY while the list spans >1 site (the platform site-row rule).
      renderCell: p => <NameSiteCell name={p.row.name} sub={!site && siteNames.length > 1 ? p.row.site : undefined} />
    },
    {
      width: 160,
      sortable: false,
      field: 'composition',
      headerName: 'Composition',
      renderCell: p => txtCell(p.row.composition)
    },
    // The FULL sex anatomy rides the table even where a class is empty (user call
    // 2026-09-05) — ID/G print the pale dash until such records exist.
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true })
  ]

  // Site-wise bucket column — ONE cell grammar, flipped emphasis (user call 2026-09-09):
  // enclosure count bold on top, class-tagged animals quiet under it; a bucket holding
  // no enclosures is a single pale dash; Empty's quiet line is a dash by definition.
  const bucketCol = (b: Bucket, header: string, minWidth = 120): GridColDef => ({
    minWidth,
    flex: 1,
    sortable: false,
    align: 'right',
    headerAlign: 'right',
    field: b,
    headerName: header,
    renderCell: p => {
      const c = (p.row as SiteRow).buckets[b]
      if (!c.e) return txtCell('—', skin.DASH_INK, 400)

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.INK }}>
            {c.e.toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '14px', color: skin.FAINT, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {animalsLineOf(c)}
          </Typography>
        </Box>
      )
    }
  })

  const siteColumns: GridColDef[] = [
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'site',
      headerName: 'Site',
      // kit NameSiteCell — the identity-cell standard: wraps to 2 lines, never clips
      renderCell: p => <NameSiteCell name={p.row.site} />
    },
    bucketCol('maleOnly', 'Male Only'),
    bucketCol('femaleOnly', 'Female Only'),
    // full words (user calls 2026-09-09) — two-word headers wrap at the word break
    bucketCol('maleDom', 'Male Dominant'),
    bucketCol('femaleDom', 'Female Dominant'),
    bucketCol('pair', 'Pair'),
    // Mixed's quiet line can carry all five classes — floor it for the worst case
    bucketCol('mixedB', 'Mixed', 200),
    // UD / ID — the platform's standard class codes (user reversal 2026-09-09: full
    // Undetermined/Indeterminate made the columns too wide; these two stay codes,
    // matching the enclosure view's UD | ID columns and the quiet-line tags)
    bucketCol('undet', 'UD'),
    bucketCol('indet', 'ID'),
    bucketCol('groupB', 'Group'),
    bucketCol('emptyB', 'Empty', 96),
    {
      // Total spells the unit ("N animals") so the whole table reads without a legend
      minWidth: 140,
      flex: 1,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      field: 'totalE',
      headerName: 'Total',
      renderCell: p => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: skin.LIST_GREEN }}>
            {(p.row as SiteRow).totalE.toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '14px', color: skin.FAINT, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {(p.row as SiteRow).totalA.toLocaleString()} animals
          </Typography>
        </Box>
      )
    }
  ]

  // The two-tier header: bucket families on top. Mixed / Empty / Total stay ungrouped
  // (a quiet empty cell above), so the family row carries only real groupings.
  const siteColumnGroups = [
    { groupId: 'Single Sex', headerAlign: 'center' as const, children: [{ field: 'maleOnly' }, { field: 'femaleOnly' }] },
    { groupId: 'Dominance', headerAlign: 'center' as const, children: [{ field: 'maleDom' }, { field: 'femaleDom' }, { field: 'pair' }] },
    { groupId: 'Unknown', headerAlign: 'center' as const, children: [{ field: 'undet' }, { field: 'indet' }, { field: 'groupB' }] }
  ]

  const start = pm.page * pm.pageSize
  const indexed = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i }))
  const sitePage = siteRowsFiltered.slice(start, start + pm.pageSize).map(r => ({ ...r, id: r.site }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Controls live INSIDE the table card (user call 2026-09-01). Heading + the
          Site-Wise | Enclosure-Wise toggle on row one (user call 2026-09-07, Housing's
          rule); the enclosure view keeps its MULTI-SELECT composition chips (demo
          review 2026-09-04) + search + site dropdown below, exactly as before. */}
      <SectionCard
        titleMb={4}
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, width: '100%', minWidth: 0 }}>
              <Typography sx={{ fontSize: '20px', fontWeight: 600, color: skin.INK, whiteSpace: 'nowrap' }}>
                {view === 'site' ? 'Site Demographics' : 'Enclosure Demographics'}
              </Typography>
              {multiSite && (
                <ViewToggle
                  items={[
                    { key: 'site', label: 'Site-Wise', icon: 'mdi:map-marker-outline' },
                    { key: 'enclosure', label: 'Enclosure-Wise', icon: 'mdi:home-outline' }
                  ]}
                  value={view}
                  onChange={k => {
                    setView(k as 'site' | 'enclosure')
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                />
              )}
            </Box>

            {view === 'site' && (
              // Site-Wise controls (user call 2026-09-07): search only — the bucket
              // columns ARE the data, nothing left to facet at this level.
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
                <SearchPill
                  value={qSite}
                  onChange={v => {
                    setQSite(v)
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                  placeholder='Search sites…'
                  sx={{ flex: 1, minWidth: 220 }}
                />
              </Box>
            )}

            {view === 'enclosure' && (
              <>
                {/* the kit ChipFilterRow — "All" leads, count = every enclosure, absent
                    classes auto-hide (compositionOptions carries present ones only) */}
                <ChipFilterRow
                  items={compositionOptions.map(c => ({ key: c, label: c, count: compCounts.get(c) || 0 }))}
                  values={comps}
                  onChange={vs => {
                    setComps(vs)
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                  allCount={allRows.length}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
                  <SearchPill
                    value={q}
                    onChange={v => {
                      setQ(v)
                      setPm(p => ({ ...p, page: 0 }))
                    }}
                    placeholder='Search enclosures…'
                    sx={{ flex: 1, minWidth: 220 }}
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
              </>
            )}
          </Box>
        }
      >
        {view === 'site' ? (
          siteRowsFiltered.length ? (
            // Site row tap drills INTO that site's enclosures (the enclosure view,
            // site-filtered — chips + search stay usable there). 12 data columns →
            // horizontal scroll, so Site pins left (the platform sticky rule).
            <>
              <DetailTable
                columns={siteColumns}
                columnGroupingModel={siteColumnGroups}
                stickyFields={['site']}
                rows={sitePage}
                total={siteRowsFiltered.length}
                rowHeight={76}
                paginationModel={pm}
                setPaginationModel={setPm}
                onRowClick={(p: { row: SiteRow }) => {
                  setSite(p.row.site)
                  setView('enclosure')
                  setPm(x => ({ ...x, page: 0 }))
                }}
              />
              <Typography sx={{ mt: 2, fontSize: '14px', color: skin.FAINT }}>
                Bold figure = enclosures &nbsp;•&nbsp; quiet line = the animals in them
              </Typography>
            </>
          ) : (
            <EmptyState message='No sites match your filters' />
          )
        ) : filtered.length ? (
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
