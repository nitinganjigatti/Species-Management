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
import SignalsBand from 'src/views/pages/species-management/ipad3/detail/tabs/medical/SignalsBand'

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

/* ── site verdict (user calls 2026-09-07): dominance judged on SEXED animals only
   (one sex >60% = dominated); when unsexed (UD+ID+G) reaches a THIRD of the site any
   dominance claim would be a guess — the verdict becomes Needs Sexing instead. The
   verdict rides as a chip ABOVE the site name in the row's first cell, never its own
   column. Only Needs Sexing wears amber (a to-do); the rest stay quiet neutral. */

type SiteVerdict = 'male' | 'female' | 'balanced' | 'needsSexing'

interface SiteRow {
  site: string
  male: number
  female: number
  ud: number
  ind: number
  grp: number
  total: number
  verdict: SiteVerdict
  /** Enclosures in this site whose OWN verdict (same verdictOf rule per enclosure)
   *  matches the site's — the chip's "- N ENCL" suffix (user call 2026-09-07). */
  verdictEnc: number
}

const VERDICT_TEXT: Record<SiteVerdict, string> = {
  male: 'Male Dominated',
  female: 'Female Dominated',
  balanced: 'Balanced',
  needsSexing: 'Needs Sexing'
}

// Works on ANY row carrying the gender grid — sites and single enclosures alike.
const verdictOf = (s: { male: number; female: number; ud: number; ind: number; grp: number; total: number }): SiteVerdict => {
  const sexed = s.male + s.female
  const unsexed = s.ud + s.ind + s.grp
  if (s.total > 0 && (sexed === 0 || unsexed * 3 >= s.total)) return 'needsSexing'
  if (s.male > 0.6 * sexed) return 'male'
  if (s.female > 0.6 * sexed) return 'female'

  return 'balanced'
}

const VerdictChip: React.FC<{ v: SiteVerdict; encl?: number }> = ({ v, encl }) => {
  const warn = v === 'needsSexing'

  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        px: 2.5,
        borderRadius: '999px',
        backgroundColor: warn ? skin.TONE_SOFT.warn : skin.TONE_SOFT.neutral,
        whiteSpace: 'nowrap'
      }}
    >
      <Typography
        component='span'
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: warn ? skin.strokeOf(skin.TONE_FILL.warn) : skin.TONE_TYPE.neutral
        }}
      >
        {VERDICT_TEXT[v]}
        {/* "- 4 ENCL" = 4 enclosures here classify as this verdict; hidden at 0 (a site
            can aggregate to a verdict no single enclosure carries) */}
        {encl != null && encl > 0 && ` - ${encl.toLocaleString()} ENCL`}
      </Typography>
    </Box>
  )
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

  // Site-Wise controls (user call 2026-09-07): its own search + a MULTI-select verdict
  // picker — empty selection = all sites (there is no state that hides everything).
  const [qSite, setQSite] = useState('')
  const [verdictSel, setVerdictSel] = useState<string[]>([])

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

  /* ── headline strip (user call 2026-09-07): the enclosure mix at a glance — every
     cell jumps to the Enclosure-Wise view with the matching composition chips ON
     (multi-select, so Single-Gender = Male + Female together). Needs Sexing is the
     one amber figure (a to-do, not an alarm). Empty joins only when it exists. ── */
  const jumpToComps = (cs: string[]) => {
    setComps(cs.filter(c => compositionOptions.includes(c)))
    setView('enclosure')
    setPm(p => ({ ...p, page: 0 }))
  }
  const nOf = (cs: string[]) => allRows.filter(r => cs.includes(r.composition)).length
  const bandCells = [
    { key: 'enclosures', label: 'Enclosures', count: allRows.length, tone: 'neutral' as const, onOpen: () => jumpToComps([]) },
    { key: 'single', label: 'Single-Gender', count: nOf(['Male', 'Female']), tone: 'neutral' as const, onOpen: () => jumpToComps(['Male', 'Female']) },
    { key: 'mf', label: 'Male & Female', count: nOf(['Male & Female']), tone: 'neutral' as const, onOpen: () => jumpToComps(['Male & Female']) },
    {
      key: 'needsSexing',
      label: 'Needs Sexing',
      count: nOf(['Undetermined', 'Indeterminate']),
      tone: 'warn' as const,
      onOpen: () => jumpToComps(['Undetermined', 'Indeterminate'])
    },
    ...(nOf(['Empty']) > 0
      ? [{ key: 'empty', label: 'Empty', count: nOf(['Empty']), tone: 'neutral' as const, onOpen: () => jumpToComps(['Empty']) }]
      : [])
  ]

  /* ── site-wise rows: the gender grid summed per site + the verdict ── */
  const siteRows: SiteRow[] = useMemo(() => {
    const by = new Map<string, Omit<SiteRow, 'verdict' | 'verdictEnc'>>()
    for (const r of allRows) {
      const s = by.get(r.site) || { site: r.site, male: 0, female: 0, ud: 0, ind: 0, grp: 0, total: 0 }
      s.male += r.male
      s.female += r.female
      s.ud += r.ud
      s.ind += r.ind
      s.grp += r.grp
      s.total += r.total
      by.set(r.site, s)
    }

    return [...by.values()]
      .map(s => {
        const verdict = verdictOf(s)

        return { ...s, verdict, verdictEnc: allRows.filter(r => r.site === s.site && verdictOf(r) === verdict).length }
      })
      .sort((a, b) => b.total - a.total)
  }, [allRows])

  // Verdict picker options — ALWAYS the full vocabulary (user call 2026-09-07):
  // zero-count verdicts render disabled/greyed, never removed, and SINK to the
  // bottom (stable sort — the fixed order holds within each group).
  const verdictOptions = useMemo(() => {
    const m = new Map<SiteVerdict, number>()
    for (const r of siteRows) m.set(r.verdict, (m.get(r.verdict) || 0) + 1)

    return (['male', 'female', 'balanced', 'needsSexing'] as SiteVerdict[])
      .map(v => ({ label: VERDICT_TEXT[v], n: m.get(v) || 0 }))
      .sort((a, b) => (a.n === 0 ? 1 : 0) - (b.n === 0 ? 1 : 0))
  }, [siteRows])

  const siteRowsFiltered = useMemo(() => {
    const query = qSite.trim().toLowerCase()

    return siteRows.filter(
      r => (!query || r.site.toLowerCase().includes(query)) && (!verdictSel.length || verdictSel.includes(VERDICT_TEXT[r.verdict]))
    )
  }, [siteRows, qSite, verdictSel])

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

  // Site-wise columns — same gender grid, first cell = verdict chip ABOVE the site
  // name (user call 2026-09-07: never a separate Verdict column).
  const siteColumns: GridColDef[] = [
    {
      minWidth: 240,
      flex: 1,
      sortable: false,
      field: 'site',
      headerName: 'Site',
      renderCell: p => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
          <VerdictChip v={(p.row as SiteRow).verdict} encl={(p.row as SiteRow).verdictEnc} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: skin.INK }}>{p.row.site}</Typography>
        </Box>
      )
    },
    countCol('male', 'M'),
    countCol('female', 'F'),
    countCol('ud', 'UD'),
    countCol('ind', 'ID'),
    countCol('grp', 'G'),
    countCol('total', 'Total', { total: true })
  ]

  const start = pm.page * pm.pageSize
  const indexed = filtered.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i }))
  const sitePage = siteRowsFiltered.slice(start, start + pm.pageSize).map(r => ({ ...r, id: r.site }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* ── ZONE 0 · the enclosure mix at a glance — the standard SignalsBand; cells
          jump into the Enclosure-Wise view with the matching chips ON ── */}
      <SignalsBand cells={bandCells} />

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
              // Site-Wise controls (user call 2026-09-07): search + the multi-select
              // verdict picker (the generalized SiteFilterSelect — bottom-sheet,
              // checkbox rows, Apply commits; trigger reads "All Verdicts" at rest).
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
                <SiteFilterSelect
                  multiple
                  multiValue={verdictSel}
                  onMultiChange={vs => {
                    setVerdictSel(vs)
                    setPm(p => ({ ...p, page: 0 }))
                  }}
                  sites={verdictOptions.map(o => ({
                    site: o.label,
                    caption: `${o.n.toLocaleString()} ${o.n === 1 ? 'site' : 'sites'}`,
                    disabled: o.n === 0
                  }))}
                  allCaption={`${siteRows.length.toLocaleString()} sites`}
                  allLabel='All Verdicts'
                  headerTitle='Verdicts'
                  plural='Verdicts'
                  searchPlaceholder='Search verdicts…'
                  rowIcon='mdi:scale-balance'
                  allIcon='mdi:filter-variant'
                  emptyText='No verdicts match.'
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
            // site-filtered — chips + search stay usable there).
            <DetailTable
              columns={siteColumns}
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
