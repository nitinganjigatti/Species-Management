'use client'

// Dashboard 2 — the species-level management rethink, side by side with the original
// dashboard. Every signal here is a SPECIES-population statement computed from real
// birth/death/population records in list.json (no synthetic clinical/preventive data).
// Two modes: all-species (collection verdict + fire tiles) and single-species
// (the same bands re-read as one species' health check).

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { useSpeciesChrome } from 'src/components/species-management/useSpeciesChrome'
import type { SpeciesOption } from 'src/views/pages/species-management/dashboard/DashboardSpeciesPicker'
import Dashboard2View, { Dashboard2Data, SignalKey, SpeciesScope, WatchRow } from 'src/views/pages/species-management/dashboard2/Dashboard2View'

async function loadSpeciesList(): Promise<any[]> {
  const res = await fetch('/species-data/list.json', { cache: 'no-store' })

  return res.ok ? await res.json() : []
}

const num = (v: unknown) => Number(v || 0)
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/** The n month-keys ending at (and including) the month `offset` months before now. */
const monthKeys = (n: number, offset = 0): string[] => {
  const now = new Date()
  const out: string[] = []
  for (let i = n - 1 + offset; i >= offset; i--) out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))

  return out
}

const sumIn = (map: Record<string, number> | undefined, keys: string[]) => {
  if (!map) return 0

  return keys.reduce((s, k) => s + num(map[k]), 0)
}

const THREATENED = new Set(['Critically Endangered', 'Endangered', 'Vulnerable'])
const IUCN_CODE: Record<string, string> = {
  'Critically Endangered': 'CR',
  Endangered: 'EN',
  Vulnerable: 'VU',
  'Near Threatened': 'NT',
  'Least Concern': 'LC',
  'Data Deficient': 'DD',
  'Extinct in the Wild': 'EW'
}
const stripParen = (s?: string) => (s || '').split(' (')[0]

/** Months without a birth before a breeding-capable species counts as "no recent birth". */
const NO_BIRTH_MONTHS = 48

interface Windows {
  last12: string[]
  last3: string[]
  prior12: string[]
  prevYear: string[]
  noBirthCutoff: string
}

const buildWindows = (): Windows => ({
  last12: monthKeys(12),
  last3: monthKeys(3),
  prior12: monthKeys(12, 3), // baseline window for the death-spike test
  prevYear: monthKeys(12, 12), // the 12 months before the trailing 12 — verdict comparison
  noBirthCutoff: monthKeys(1, NO_BIRTH_MONTHS)[0]
})

/** Per-species population stats + trouble signals — one implementation for the
 *  collection sweep AND the single-species scope, so both always agree. */
function analyzeRow(r: any, w: Windows) {
  const ac = num(r.animal_count)
  const m = num(r.total_male)
  const f = num(r.total_female)
  const u = num(r.total_undetermined) + num(r.total_indeterminate)
  const b12 = sumIn(r.birthsMonthly, w.last12)
  const d12 = sumIn(r.deathsMonthly, w.last12)
  const net12 = b12 - d12
  const d3 = sumIn(r.deathsMonthly, w.last3)
  const baseline3 = sumIn(r.deathsMonthly, w.prior12) / 4
  const lastBirth = Object.keys(r.birthsMonthly || {}).sort().pop() || ''
  const canBreed = m > 0 && f > 0

  const signals: SignalKey[] = []
  if (ac > 0 && ac <= 3) signals.push('fewLeft')
  if (d3 >= 3 && d3 > 2 * baseline3) signals.push('deathSpike')
  if (net12 < 0) signals.push('declining')
  if (ac >= 2 && m + f > 0 && Math.min(m, f) === 0) signals.push('singleSex')
  if (canBreed && ac >= 2 && (!lastBirth || lastBirth < w.noBirthCutoff)) signals.push('noRecentBirth')

  return { ac, m, f, u, b12, d12, d3, net12, lastBirth, signals }
}

export default function Dashboard2Container() {
  useSpeciesChrome()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const listQ = useQuery({ queryKey: ['species-list-min'], queryFn: loadSpeciesList })

  const speciesOptions: SpeciesOption[] = useMemo(
    () =>
      (listQ.data ?? [])
        .filter((r: any) => num(r.animal_count) > 0)
        .map((r: any) => ({ id: num(r.tsn_id), name: r.common_name || `Species ${r.tsn_id}`, scientific: r.scientific_name || '' }))
        .sort((a: SpeciesOption, b: SpeciesOption) => a.name.localeCompare(b.name)),
    [listQ.data]
  )

  const data: Dashboard2Data | null = useMemo(() => {
    const list = listQ.data
    if (!list?.length) return null

    const w = buildWindows()
    const rows: WatchRow[] = []
    let animals = 0
    let births12 = 0
    let deaths12 = 0
    let birthsPrev = 0
    let deathsPrev = 0
    let growing = 0
    let stable = 0
    let declining = 0
    let speciesWithAnimals = 0
    const trendB: Record<string, number> = {}
    const trendD: Record<string, number> = {}

    for (const r of list) {
      const a = analyzeRow(r, w)
      births12 += a.b12
      deaths12 += a.d12
      birthsPrev += sumIn(r.birthsMonthly, w.prevYear)
      deathsPrev += sumIn(r.deathsMonthly, w.prevYear)
      for (const k of w.last12) {
        trendB[k] = num(trendB[k]) + num(r.birthsMonthly?.[k])
        trendD[k] = num(trendD[k]) + num(r.deathsMonthly?.[k])
      }
      if (a.ac === 0) continue // no longer in the collection — not a live management item

      speciesWithAnimals++
      animals += a.ac
      if (a.net12 > 0) growing++
      else if (a.net12 < 0) declining++
      else stable++

      const iucn = stripParen(r.iucn_status)
      const threatened = THREATENED.has(iucn)
      if (!a.signals.length) continue

      const score =
        (a.signals.includes('fewLeft') ? 5 : 0) +
        (a.signals.includes('deathSpike') ? 4 : 0) +
        (a.signals.includes('declining') ? 3 : 0) +
        (a.signals.includes('singleSex') ? 2 : 0) +
        (a.signals.includes('noRecentBirth') ? 1 : 0) +
        (threatened ? 2 : 0)

      rows.push({
        id: num(r.tsn_id),
        name: r.common_name || `Species ${r.tsn_id}`,
        sci: r.scientific_name || '',
        count: a.ac,
        m: a.m,
        f: a.f,
        u: a.u,
        b12: a.b12,
        d12: a.d12,
        d3: a.d3,
        net12: a.net12,
        lastBirth: a.lastBirth,
        signals: a.signals,
        score,
        iucnCode: IUCN_CODE[iucn] || '',
        threatened
      })
    }

    rows.sort((a, b) => b.score - a.score || a.net12 - b.net12 || b.count - a.count)

    const threatenedRows = rows.filter(r => r.threatened)

    return {
      pulse: {
        species: speciesWithAnimals,
        animals,
        births12,
        deaths12,
        net12: births12 - deaths12,
        netPrev: birthsPrev - deathsPrev,
        declining
      },
      trend12: w.last12.map(k => ({ label: k, births: num(trendB[k]), deaths: num(trendD[k]) })),
      watchlist: rows,
      trajectory: { growing, stable, declining },
      obligations: {
        threatened: list.filter((r: any) => num(r.animal_count) > 0 && THREATENED.has(stripParen(r.iucn_status))).length,
        threatenedAtRisk: threatenedRows.length,
        citesI: list.filter((r: any) => num(r.animal_count) > 0 && String(r.cites_appendix || '').startsWith('Appendix I (')).length,
        worst: threatenedRows.slice(0, 6)
      }
    }
  }, [listQ.data])

  // Single-species mode: the same analysis, read for one species.
  const scope: SpeciesScope | null = useMemo(() => {
    if (selectedId == null) return null
    const r = (listQ.data ?? []).find((x: any) => num(x.tsn_id) === selectedId)
    if (!r) return null

    const w = buildWindows()
    const a = analyzeRow(r, w)

    return {
      id: selectedId,
      name: r.common_name || `Species ${selectedId}`,
      sci: r.scientific_name || '',
      count: a.ac,
      m: a.m,
      f: a.f,
      u: a.u,
      sites: Array.isArray(r.sites) ? r.sites.length : num(r.sites),
      enclosures: num(r.enclosures),
      pairs: num(r.pairs),
      b12: a.b12,
      d12: a.d12,
      d3: a.d3,
      net12: a.net12,
      netPrev: sumIn(r.birthsMonthly, w.prevYear) - sumIn(r.deathsMonthly, w.prevYear),
      lastBirth: a.lastBirth,
      signals: a.signals,
      trend12: w.last12.map(k => ({ label: k, births: num(r.birthsMonthly?.[k]), deaths: num(r.deathsMonthly?.[k]) })),
      className: r.class_name || '—',
      iucn: stripParen(r.iucn_status) || '—',
      iucnCode: IUCN_CODE[stripParen(r.iucn_status)] || '',
      cites: stripParen(r.cites_appendix) || '—',
      category: r.breeding_category || '—'
    }
  }, [listQ.data, selectedId])

  if (listQ.isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
        <CircularProgress />
      </Box>
    )
  if (listQ.isError || !data)
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant='subtitle1' sx={{ color: 'customColors.neutralSecondary' }}>
          Could not load species data
        </Typography>
      </Box>
    )

  return (
    <Dashboard2View
      data={data}
      scope={scope}
      speciesOptions={speciesOptions}
      selectedId={selectedId}
      onSelectSpecies={setSelectedId}
      onOpenSpecies={(id, tab) => router.push(`/species-management/list-2/${id}/${tab ? `?tab=${tab}` : ''}`)}
    />
  )
}
