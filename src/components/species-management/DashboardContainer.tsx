'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import DashboardView from 'src/views/pages/species-management/dashboard/DashboardView'
import type { VitalSegment, Composition, StatusChip, SpeciesAlertRow } from 'src/views/pages/species-management/dashboard/dashboardUi'
import type { SpeciesOption } from 'src/views/pages/species-management/dashboard/DashboardSpeciesPicker'
import {
  PRESETS,
  monthKey,
  resolveRange
} from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import type { RangeSelection } from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { getSpeciesDashboard } from 'src/lib/api/species-management/dashboard'
import type { DashboardAlert } from 'src/types/species-management/dashboard'
import { useSpeciesChrome } from 'src/components/species-management/useSpeciesChrome'

const LIST = '/species-management/list/'
const q = (params: Record<string, string>) =>
  `${LIST}?${Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')}`

// Deep-link to a species' detail page, landing on a specific tab (?tab= is read by SpeciesDetailContainer).
const detailTab = (id: number, tab: string) => `/species-management/${id}/?tab=${tab}`

const THREATENED_STATUSES = [
  'Critically Endangered (Highest Risk)',
  'Endangered (Very High Risk)',
  'Vulnerable (High Risk)'
].join(',')

// Same population bands as scripts/build-species-dashboard.js — used for the single-species status chip.
const POP_BANDS = [
  { label: '1–3', min: 1, max: 3 },
  { label: '4–10', min: 4, max: 10 },
  { label: '11–50', min: 11, max: 50 },
  { label: '51–100', min: 51, max: 100 },
  { label: '100+', min: 101, max: Infinity }
]
const popBand = (ac: number) => POP_BANDS.find(b => ac >= b.min && ac <= b.max)?.label ?? '—'
const stripParen = (s?: string) => (s || '—').split(' (')[0]

// Raw listing (same file the list screen reads) — powers the species picker + single-species scoping.
async function loadSpeciesList(): Promise<any[]> {
  const res = await fetch('/species-data/list.json', { cache: 'no-store' })

  return res.ok ? await res.json() : []
}

// Inclusive "YYYY-MM" month sequence, guarded against pathological ranges.
const monthsBetween = (fromK: string, toK: string): string[] => {
  const [fy, fm] = fromK.split('-').map(Number)
  const [ty, tm] = toK.split('-').map(Number)
  const out: string[] = []
  let y = fy
  let m = fm
  let guard = 0
  while ((y < ty || (y === ty && m <= tm)) && guard < 240) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
    guard++
  }

  return out
}

const num = (v: unknown) => Number(v || 0)
const unsexed = (r: any) => num(r.total_undetermined) + num(r.total_indeterminate)
const sitesCount = (r: any) => (Array.isArray(r.sites) ? r.sites.length : num(r.sites))
const readinessLabel = (r: any) => {
  const ac = num(r.animal_count)
  if (ac === 0) return 'No Data'
  if (num(r.total_male) > 0 && num(r.total_female) > 0) return 'Can Pair'
  if (unsexed(r) > 0) return 'Needs Sexing'

  return 'Single Sex'
}

export default function DashboardContainer() {
  useSpeciesChrome()
  const router = useRouter()
  const [range, setRange] = useState<RangeSelection>({ preset: 'last_1y', start: null, end: null })
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['species-dashboard'],
    queryFn: getSpeciesDashboard
  })

  const listQ = useQuery({ queryKey: ['species-list-min'], queryFn: loadSpeciesList })
  const list = listQ.data ?? []

  const speciesOptions: SpeciesOption[] = useMemo(
    () =>
      list
        .map(r => ({ id: num(r.tsn_id), name: r.common_name || '—', scientific: r.scientific_name || '' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [list]
  )

  const selected = useMemo(
    () => (selectedId != null ? list.find(r => num(r.tsn_id) === selectedId) ?? null : null),
    [list, selectedId]
  )

  // ---- Date-range → births/deaths trend (event-based widgets only) ----
  // All-species: filter the pre-aggregated monthly series. Single-species: build from the record's
  // birthsMonthly/deathsMonthly, capped to the last 60 months (matches the aggregate's 5y window and
  // avoids 900-bar charts from sentinel-old birth dates).
  const trend = useMemo(() => {
    const { from, to } = resolveRange(range, new Date())
    const toK = monthKey(to)

    if (selected) {
      const bm = (selected.birthsMonthly || {}) as Record<string, number>
      const dm = (selected.deathsMonthly || {}) as Record<string, number>
      const capDate = new Date(to.getFullYear(), to.getMonth() - 59, 1)
      const effFrom = from && from > capDate ? from : capDate

      return monthsBetween(monthKey(effFrom), toK).map(m => ({ label: m, births: bm[m] || 0, deaths: dm[m] || 0 }))
    }

    const monthly = data?.trendMonthly ?? []
    const fromK = from ? monthKey(from) : null
    const filtered = monthly.filter(m => (!fromK || m.label >= fromK) && m.label <= toK)

    return filtered.length ? filtered : monthly.slice(-1)
  }, [data, selected, range])

  // ---- Vital strip ----
  const segments: VitalSegment[] = useMemo(() => {
    if (selected) {
      const ac = num(selected.animal_count)
      const sexedPct = ac ? Math.round(((num(selected.total_male) + num(selected.total_female)) / ac) * 100) : 0
      const chippedPct = ac ? Math.round((num(selected.chipped) / ac) * 100) : 0
      const go = (tab: string) => () => router.push(detailTab(selectedId!, tab))

      return [
        { label: 'Animals', value: ac.toLocaleString(), total: true, tone: 'primary', onClick: go('overview') },
        { label: 'Sites', value: sitesCount(selected).toLocaleString(), tone: 'secondary', onClick: go('housing') },
        { label: 'Enclosures', value: num(selected.enclosures).toLocaleString(), tone: 'secondary', onClick: go('housing') },
        { label: 'Pairs', value: num(selected.pairs).toLocaleString(), tone: 'primary', onClick: go('pairing') },
        { label: 'Sexed', value: `${sexedPct}%`, pct: sexedPct, tone: 'primary', onClick: go('pairing') },
        { label: 'Chipped', value: `${chippedPct}%`, pct: chippedPct, tone: 'secondary', onClick: go('identification') }
      ]
    }

    if (!data) return []
    const t = data.totals
    const ratio = (n: number) => (t.species ? Math.round((n / t.species) * 100) : 0)

    return [
      { label: 'Species', value: t.species.toLocaleString(), total: true, tone: 'primary', onClick: () => router.push(LIST) },
      { label: 'Animals', value: t.animals.total.toLocaleString(), total: true, tone: 'primary', onClick: () => router.push(LIST) },
      {
        label: 'Threatened',
        value: data.threatened.count.toLocaleString(),
        pct: ratio(data.threatened.count),
        tone: 'tertiary',
        onClick: () => router.push(q({ Conservation: THREATENED_STATUSES }))
      },
      {
        label: 'Breedable',
        value: data.breeding.can_pair.speciesCount.toLocaleString(),
        pct: ratio(data.breeding.can_pair.speciesCount),
        tone: 'primary',
        onClick: () => router.push(q({ Readiness: 'can_pair' }))
      },
      { label: 'Assessed', value: `${data.coverage.pct}%`, pct: data.coverage.pct, tone: 'secondary' },
      { label: 'Sexed', value: `${data.coverage.sexedPct}%`, pct: data.coverage.sexedPct, tone: 'primary' }
    ]
  }, [data, selected, selectedId, router])

  // ---- Sex composition (mode-appropriate) ----
  const sex = useMemo(() => {
    if (selected) {
      return {
        m: num(selected.total_male),
        f: num(selected.total_female),
        u: unsexed(selected),
        total: num(selected.animal_count)
      }
    }

    return data?.totals.animals ?? { m: 0, f: 0, u: 0, total: 0 }
  }, [data, selected])

  // ---- All-species explore grid ----
  const compositions: Composition[] = useMemo(() => {
    if (!data) return []

    return [
      {
        title: 'By class',
        chart: 'donut',
        segments: data.byClass.slice(0, 5).map(c => ({
          label: c.class,
          value: c.speciesCount,
          animalCount: c.animalCount,
          onClick: () => router.push(q({ Class: c.class }))
        }))
      },
      {
        title: 'Conservation (IUCN)',
        chart: 'bar-h',
        segments: data.iucn.slice(0, 5).map(i => ({
          label: i.status.split(' (')[0],
          value: i.speciesCount,
          animalCount: i.animalCount,
          onClick: () => router.push(q({ Conservation: i.status }))
        }))
      },
      {
        title: 'Population size',
        chart: 'bar-v',
        segments: data.populationBands.map(b => ({
          label: b.label,
          value: b.speciesCount,
          animalCount: b.animalCount,
          onClick: () => router.push(q({ Population: b.key }))
        }))
      },
      {
        title: 'Breeding readiness',
        chart: 'radial',
        segments: [
          { label: 'Can Pair', value: data.breeding.can_pair.speciesCount, animalCount: data.breeding.can_pair.animalCount, onClick: () => router.push(q({ Readiness: 'can_pair' })) },
          { label: 'Needs Sexing', value: data.breeding.needs_sexing.speciesCount, animalCount: data.breeding.needs_sexing.animalCount, onClick: () => router.push(q({ Readiness: 'needs_sexing' })) },
          { label: 'Single Sex', value: data.breeding.single_sex.speciesCount, animalCount: data.breeding.single_sex.animalCount, onClick: () => router.push(q({ Readiness: 'single_sex' })) },
          { label: 'No Data', value: data.breeding.no_data.speciesCount, animalCount: data.breeding.no_data.animalCount, onClick: () => router.push(q({ Readiness: 'no_data' })) }
        ]
      },
      {
        title: 'CITES',
        chart: 'polar',
        segments: data.cites.slice(0, 6).map(c => ({
          label: c.label.split(' (')[0],
          value: c.speciesCount,
          animalCount: c.animalCount,
          onClick: () => router.push(q({ CITES: c.label }))
        }))
      },
      {
        title: 'Category',
        chart: 'pie',
        segments: data.category.slice(0, 5).map(c => ({
          label: c.label,
          value: c.speciesCount,
          animalCount: c.animalCount,
          onClick: () => router.push(q({ Category: c.label }))
        }))
      }
    ]
  }, [data, router])

  // ---- Single-species artifacts (taxonomy chips + this species' triggered alerts) ----
  const taxonomyChips: StatusChip[] = useMemo(() => {
    if (!selected || selectedId == null) return []
    const toProfile = () => router.push(detailTab(selectedId, 'profile'))

    return [
      { label: 'Class', value: selected.class_name || '—', icon: 'mdi:paw-outline', onClick: toProfile },
      { label: 'IUCN', value: stripParen(selected.iucn_status), icon: 'mdi:shield-alert-outline', onClick: toProfile },
      { label: 'CITES', value: stripParen(selected.cites_appendix), icon: 'mdi:file-certificate-outline', onClick: toProfile },
      { label: 'Category', value: selected.breeding_category || '—', icon: 'mdi:tag-outline', onClick: toProfile },
      { label: 'Population', value: popBand(num(selected.animal_count)), icon: 'mdi:account-group-outline', onClick: toProfile },
      { label: 'Readiness', value: readinessLabel(selected), icon: 'mdi:heart-outline', onClick: toProfile }
    ]
  }, [selected, selectedId, router])

  const speciesAlerts: SpeciesAlertRow[] = useMemo(() => {
    if (selectedId == null) return []

    return (data?.alerts ?? [])
      .filter(a => Array.isArray((a as any).speciesIds) && (a as any).speciesIds.includes(selectedId))
      .map(a => ({ key: a.key, label: a.label, severity: a.severity }))
  }, [data, selectedId])

  const onAlertClick = (a: DashboardAlert) => router.push(q({ alert: a.key }))
  const totalAlertItems = data ? data.alerts.reduce((n, a) => n + a.speciesCount, 0) : 0

  return (
    <DashboardView
      loading={isLoading}
      error={isError}
      isSpecies={!!selected}
      speciesOptions={speciesOptions}
      selectedSpeciesId={selectedId}
      onSpeciesChange={setSelectedId}
      segments={segments}
      alerts={data?.alerts ?? []}
      totalAlertItems={totalAlertItems}
      compositions={compositions}
      sex={sex}
      trend={trend}
      taxonomyChips={taxonomyChips}
      speciesAlerts={speciesAlerts}
      onSexClick={selectedId != null ? () => router.push(detailTab(selectedId, 'pairing')) : undefined}
      onTrendClick={selectedId != null ? () => router.push(detailTab(selectedId, 'circle')) : undefined}
      onSpeciesAlertClick={selectedId != null ? () => router.push(detailTab(selectedId, 'assessments')) : undefined}
      range={range}
      onRangeChange={setRange}
      onAlertClick={onAlertClick}
    />
  )
}
