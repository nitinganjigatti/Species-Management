/**
 * Pure helpers for the Species Management listing.
 *
 * The prototype filters entirely client-side over a full in-memory load; we mirror that here.
 * All functions are pure (no React, no API) so they're easy to reason about and reuse.
 */

export interface SpeciesRow {
  id: number
  species_id: number
  species_name: string
  scientific_name: string
  image: string
  population: number
  male: number
  female: number
  undetermined: number
  identified: number
  class_name: string
  order_name: string
  family: string
  genus: string
  iucn: string
  cites: string
  category: string
  sites: string[]
}

export type ReadinessKey = 'can_pair' | 'needs_sexing' | 'single_sex' | 'no_data'

export interface SpeciesFilters {
  // Live filters (backed by reportv1 fields)
  Class: string[]
  Order: string[]
  Family: string[]
  Genus: string[]
  Population: string[]
  Readiness: string[]
  Site: string[]
  // Parked filters (no backing data in reportv1 yet — kept for prototype-faithful UI shape)
  Category: string[]
  Conservation: string[]
  CITES: string[]
}

export const EMPTY_FILTERS: SpeciesFilters = {
  Class: [],
  Order: [],
  Family: [],
  Genus: [],
  Population: [],
  Readiness: [],
  Site: [],
  Category: [],
  Conservation: [],
  CITES: []
}

/** Filter menu keys (all live against the mock dataset). */
export const LIVE_FILTER_KEYS: (keyof SpeciesFilters)[] = [
  'Category',
  'Class',
  'Order',
  'Family',
  'Genus',
  'Conservation',
  'CITES',
  'Population',
  'Readiness',
  'Site'
]

/** No parked filters in mock mode — all filter on the dummy data. */
export const PARKED_FILTER_KEYS: (keyof SpeciesFilters)[] = []

export const POPULATION_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: '1-3', label: '1–3', min: 1, max: 3 },
  { key: '4-10', label: '4–10', min: 4, max: 10 },
  { key: '11-50', label: '11–50', min: 11, max: 50 },
  { key: '51-100', label: '51–100', min: 51, max: 100 },
  { key: '100+', label: '100+', min: 101, max: Infinity }
]

export const READINESS_OPTIONS: { key: ReadinessKey; label: string }[] = [
  { key: 'can_pair', label: 'Can Pair' },
  { key: 'needs_sexing', label: 'Needs Sexing' },
  { key: 'single_sex', label: 'Single Sex' }
]

const num = (v: unknown): number => Number(v) || 0
const str = (v: unknown): string => (v == null || v === '' ? '-' : String(v))

/** Map one /v1/species/reportv1 datalist record (species-level, location includes off) into a row. */
export function mapReportRow(item: Record<string, unknown>): SpeciesRow {
  const speciesId = num(item.tsn_id)

  return {
    id: speciesId,
    species_id: speciesId,
    species_name: str(item.common_name),
    scientific_name: str(item.scientific_name),
    image: (item.default_icon as string) || '',
    population: num(item.animal_count),
    male: num(item.total_male),
    female: num(item.total_female),
    undetermined: num(item.total_undetermined),
    identified: num(item.total_indeterminate),
    class_name: str(item.class_name),
    order_name: str(item.order_name),
    family: str(item.family_name),
    genus: str(item.genus_name),
    iucn: str(item.iucn_status),
    cites: str(item.cites_appendix),
    category: str(item.breeding_category),
    sites: Array.isArray(item.sites) ? (item.sites as string[]) : []
  }
}

/** Species-level breeding readiness, approximated from the aggregated sex counts. */
export function getReadiness(row: SpeciesRow): ReadinessKey {
  const { male, female, undetermined } = row
  if (male <= 0 && female <= 0 && undetermined <= 0) return 'no_data'
  if (male > 0 && female > 0) return 'can_pair'
  if (undetermined > 0) return 'needs_sexing'

  return 'single_sex'
}

function matchesPopulation(row: SpeciesRow, selectedBands: string[]): boolean {
  if (!selectedBands.length) return true

  return selectedBands.some(key => {
    const band = POPULATION_BANDS.find(b => b.key === key)

    return band ? row.population >= band.min && row.population <= band.max : false
  })
}

/** Scored search across name + taxonomy. Returns 0 when the row should be excluded. */
export function searchScore(row: SpeciesRow, terms: string[]): number {
  if (!terms.length) return 1
  const common = row.species_name.toLowerCase()
  const sci = row.scientific_name.toLowerCase()
  const haystackExtra = [row.family, row.order_name, row.genus, row.class_name].join(' ').toLowerCase()

  let total = 0
  for (const term of terms) {
    let best = 0
    if (common === term) best = 100
    else if (common.startsWith(term)) best = 50
    else if (common.includes(' ' + term)) best = 30
    else if (common.includes(term)) best = 20
    else if (sci.startsWith(term)) best = 15
    else if (sci.includes(term)) best = 10
    else if (haystackExtra.includes(term)) best = 5
    if (best === 0) return 0 // every term must match something
    total += best
  }

  return total
}

/**
 * Apply all filters + search (AND across categories, OR within a category) and return the
 * filtered, search-ranked rows. Parked filters are intentionally ignored (no backing data).
 */
export function applyFilters(rows: SpeciesRow[], filters: SpeciesFilters, query: string): SpeciesRow[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

  const filtered = rows.filter(row => {
    if (filters.Category.length && !filters.Category.includes(row.category)) return false
    if (filters.Class.length && !filters.Class.includes(row.class_name)) return false
    if (filters.Order.length && !filters.Order.includes(row.order_name)) return false
    if (filters.Family.length && !filters.Family.includes(row.family)) return false
    if (filters.Genus.length && !filters.Genus.includes(row.genus)) return false
    if (filters.Conservation.length && !filters.Conservation.includes(row.iucn)) return false
    if (filters.CITES.length && !filters.CITES.includes(row.cites)) return false
    if (!matchesPopulation(row, filters.Population)) return false
    if (filters.Readiness.length && !filters.Readiness.includes(getReadiness(row))) return false
    if (filters.Site.length && !row.sites.some(s => filters.Site.includes(s))) return false

    return true
  })

  if (!terms.length) return filtered

  return filtered
    .map(row => ({ row, score: searchScore(row, terms) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.row)
}

/** Distinct, sorted, non-empty values for a taxonomy field — used to build filter options. */
export function distinctValues(rows: SpeciesRow[], field: keyof SpeciesRow): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    const v = row[field]
    if (typeof v === 'string' && v && v !== '-') set.add(v)
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

/** Total count of currently-applied filter selections (for the badge). */
export function countAppliedFilters(filters: SpeciesFilters): number {
  return (Object.keys(filters) as (keyof SpeciesFilters)[]).reduce((n, k) => n + filters[k].length, 0)
}
