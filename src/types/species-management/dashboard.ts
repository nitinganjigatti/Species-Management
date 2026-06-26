export type AlertSeverity = 'high' | 'medium' | 'low'

export interface DashboardAlert {
  key: string
  label: string
  severity: AlertSeverity
  speciesCount: number
  animalCount: number
  pctSpecies: number
  speciesIds: number[]
}

export interface DashboardData {
  totals: { species: number; animals: { m: number; f: number; u: number; total: number } }
  netYTD: {
    year: number
    births: number
    deaths: number
    net: number
    monthly: { month: number; births: number; deaths: number; net: number }[]
  }
  iucn: { status: string; code: string; speciesCount: number; animalCount: number }[]
  threatened: { count: number; byCode: { CR: number; EN: number; VU: number } }
  breeding: Record<'can_pair' | 'needs_sexing' | 'single_sex' | 'no_data', { speciesCount: number; animalCount: number }>
  coverage: { pct: number; assessedAnimals: number; totalAnimals: number; sexedPct: number; chippedPct: number }
  byClass: { class: string; speciesCount: number; animalCount: number }[]
  category: { label: string; speciesCount: number; animalCount: number }[]
  cites: { label: string; speciesCount: number; animalCount: number }[]
  populationBands: { key: string; label: string; speciesCount: number; animalCount: number }[]
  alerts: DashboardAlert[]
  trend12: { label: string; births: number; deaths: number }[]
  trendMonthly: { label: string; births: number; deaths: number }[]
  generatedAt: string
}
