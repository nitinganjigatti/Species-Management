import type { DashboardData } from 'src/types/species-management/dashboard'

let cache: DashboardData | null = null

/** Loads the pre-aggregated dashboard rollup (static JSON, frontend-only). Cached per page load. */
export async function getSpeciesDashboard(): Promise<DashboardData> {
  if (cache) return cache
  const res = await fetch('/species-data/dashboard.json')
  if (!res.ok) throw new Error(`Failed to load dashboard.json (${res.status})`)
  cache = (await res.json()) as DashboardData

  return cache
}
