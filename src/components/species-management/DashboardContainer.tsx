'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import DashboardView from 'src/views/pages/species-management/dashboard/DashboardView'
import type { VitalSegment, Composition } from 'src/views/pages/species-management/dashboard/dashboardUi'
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

const THREATENED_STATUSES = [
  'Critically Endangered (Highest Risk)',
  'Endangered (Very High Risk)',
  'Vulnerable (High Risk)'
].join(',')

export default function DashboardContainer() {
  useSpeciesChrome()
  const router = useRouter()
  const [range, setRange] = useState<RangeSelection>({ preset: 'last_1y', start: null, end: null })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['species-dashboard'],
    queryFn: getSpeciesDashboard
  })

  // Date range drives the event-based widgets only (births/deaths trend + net change);
  // composition widgets are current inventory with no time dimension in the data.
  const { trend, windowNet, rangeLabel } = useMemo(() => {
    const monthly = data?.trendMonthly ?? []
    const { from, to } = resolveRange(range, new Date())
    const fromK = from ? monthKey(from) : null
    const toK = monthKey(to)
    const filtered = monthly.filter(m => (!fromK || m.label >= fromK) && m.label <= toK)
    const series = filtered.length ? filtered : monthly.slice(-1)
    const net = series.reduce((s, m) => s + (m.births - m.deaths), 0)
    const label =
      range.preset === 'custom' && (range.start || range.end)
        ? 'custom range'
        : (PRESETS.find(p => p.key === range.preset)?.label ?? '').toLowerCase()

    return { trend: series, windowNet: net, rangeLabel: label }
  }, [data, range])

  const segments: VitalSegment[] = useMemo(() => {
    if (!data) return []
    const t = data.totals
    const net = windowNet

    return [
      { label: 'Species', value: t.species.toLocaleString(), onClick: () => router.push(LIST) },
      {
        label: 'Animals',
        value: t.animals.total.toLocaleString(),
        sub: 'individuals across all species',
        onClick: () => router.push(LIST)
      },
      {
        label: 'Net change',
        value: `${net >= 0 ? '▲' : '▼'} ${Math.abs(net).toLocaleString()}`,
        sub: `births − deaths · ${rangeLabel}`
      },
      {
        label: 'Threatened',
        value: data.threatened.count.toLocaleString(),
        sub: `CR ${data.threatened.byCode.CR} · EN ${data.threatened.byCode.EN} · VU ${data.threatened.byCode.VU}`,
        onClick: () => router.push(q({ Conservation: THREATENED_STATUSES }))
      },
      {
        label: 'Breedable',
        value: data.breeding.can_pair.speciesCount.toLocaleString(),
        sub: 'both sexes present',
        onClick: () => router.push(q({ Readiness: 'can_pair' }))
      },
      { label: 'Assessed', value: `${data.coverage.pct}%`, sub: 'of animals, weight coverage' },
      { label: 'Sexed', value: `${data.coverage.sexedPct}%`, sub: 'of animals' }
    ]
  }, [data, router, windowNet, rangeLabel])

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

  const onAlertClick = (a: DashboardAlert) => router.push(q({ alert: a.key }))
  const totalAlertItems = data ? data.alerts.reduce((n, a) => n + a.speciesCount, 0) : 0

  return (
    <DashboardView
      loading={isLoading}
      error={isError}
      segments={segments}
      alerts={data?.alerts ?? []}
      totalAlertItems={totalAlertItems}
      compositions={compositions}
      sex={data?.totals.animals ?? { m: 0, f: 0, u: 0, total: 0 }}
      trend={trend}
      range={range}
      onRangeChange={setRange}
      onAlertClick={onAlertClick}
    />
  )
}
