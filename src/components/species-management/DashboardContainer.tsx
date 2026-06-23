'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import DashboardView from 'src/views/pages/species-management/dashboard/DashboardView'
import type { VitalSegment, Composition, Tone } from 'src/views/pages/species-management/dashboard/dashboardUi'
import { getSpeciesDashboard } from 'src/lib/api/species-management/dashboard'
import type { DashboardAlert } from 'src/types/species-management/dashboard'

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
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['species-dashboard'],
    queryFn: getSpeciesDashboard
  })

  const segments: VitalSegment[] = useMemo(() => {
    if (!data) return []
    const t = data.totals
    const net = data.netYTD.net

    return [
      { label: 'Species', value: t.species.toLocaleString(), onClick: () => router.push(LIST) },
      {
        label: 'Animals',
        value: t.animals.total.toLocaleString(),
        sub: `${t.animals.m.toLocaleString()} M · ${t.animals.f.toLocaleString()} F · ${t.animals.u.toLocaleString()} unsexed`,
        onClick: () => router.push(LIST)
      },
      {
        label: `Net change (${data.netYTD.year})`,
        value: `${net >= 0 ? '▲' : '▼'} ${Math.abs(net).toLocaleString()}`,
        sub: 'births − deaths, YTD'
      },
      {
        label: 'Threatened',
        value: data.threatened.count.toLocaleString(),
        sub: `CR ${data.threatened.byCode.CR} · EN ${data.threatened.byCode.EN} · VU ${data.threatened.byCode.VU}`,
        onClick: () => router.push(q({ Conservation: THREATENED_STATUSES }))
      },
      {
        label: 'Breedable',
        value: data.breeding.can_pair.toLocaleString(),
        sub: 'both sexes present',
        onClick: () => router.push(q({ Readiness: 'can_pair' }))
      },
      { label: 'Assessed', value: `${data.coverage.pct}%`, sub: 'of animals, weight coverage' },
      { label: 'Sexed', value: `${data.coverage.sexedPct}%`, sub: 'of animals' }
    ]
  }, [data, router])

  const compositions: Composition[] = useMemo(() => {
    if (!data) return []
    const iucnTone: Record<string, Tone> = {
      CR: 'error',
      EN: 'warning',
      VU: 'warning',
      NT: 'success',
      LC: 'primary',
      OTHER: 'neutral'
    }
    const classTones: Tone[] = ['primary', 'info', 'success', 'neutral', 'warning', 'error']

    return [
      {
        title: 'Conservation (IUCN)',
        segments: data.iucn.map(i => ({
          label: i.status.split(' (')[0],
          value: i.speciesCount,
          tone: iucnTone[i.code] || 'neutral',
          onClick: () => router.push(q({ Conservation: i.status }))
        }))
      },
      {
        title: 'By class',
        segments: data.byClass.slice(0, 6).map((c, idx) => ({
          label: c.class,
          value: c.speciesCount,
          tone: classTones[idx % classTones.length],
          onClick: () => router.push(q({ Class: c.class }))
        }))
      },
      {
        title: 'Breeding readiness',
        segments: [
          { label: 'Can Pair', value: data.breeding.can_pair, tone: 'success', onClick: () => router.push(q({ Readiness: 'can_pair' })) },
          { label: 'Needs Sexing', value: data.breeding.needs_sexing, tone: 'warning', onClick: () => router.push(q({ Readiness: 'needs_sexing' })) },
          { label: 'Single Sex', value: data.breeding.single_sex, tone: 'error', onClick: () => router.push(q({ Readiness: 'single_sex' })) },
          { label: 'No Data', value: data.breeding.no_data, tone: 'neutral', onClick: () => router.push(q({ Readiness: 'no_data' })) }
        ]
      },
      {
        title: 'Category',
        segments: data.category.map((c, idx) => ({
          label: c.label,
          value: c.speciesCount,
          tone: classTones[idx % classTones.length],
          onClick: () => router.push(q({ Category: c.label }))
        }))
      },
      {
        title: 'CITES',
        segments: data.cites.slice(0, 6).map((c, idx) => ({
          label: c.label.split(' (')[0],
          value: c.speciesCount,
          tone: classTones[idx % classTones.length],
          onClick: () => router.push(q({ CITES: c.label }))
        }))
      },
      {
        title: 'Population size',
        segments: data.populationBands.map(b => {
          const popTone: Record<string, Tone> = { '1-3': 'error', '4-10': 'warning', '11-50': 'info', '51-100': 'primary', '100+': 'success' }

          return {
            label: b.label,
            value: b.speciesCount,
            tone: popTone[b.key] || 'neutral',
            onClick: () => router.push(q({ Population: b.key }))
          }
        })
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
      trend={data?.trend12 ?? []}
      onAlertClick={onAlertClick}
    />
  )
}
