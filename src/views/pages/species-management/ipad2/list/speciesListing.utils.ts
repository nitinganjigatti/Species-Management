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
  births: number
  deaths: number
  enclosures: number
  pairs: number
  chipped: number
  accessions: number // total animals accessioned into the collection (real, from the dump)
  // Temporal signals (real, from the dump) powering the Analysis filters.
  birthsMonthly: Record<string, number> // { "YYYY-MM": animals born }
  deathsMonthly: Record<string, number> // { "YYYY-MM": animals died }
  lifespanAvg: number | null // avg age at death, all records (years); null when no usable death+birth dates
  lifespanAvgAdult: number | null // avg age at death excluding <1y (neonatal) deaths
  lifespanMax: number | null // longest single observed life (years)
  lifespanCount: number // death records with a usable birth date
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
  Sex: string[]
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
  Sex: [],
  Category: [],
  Conservation: [],
  CITES: []
}

/**
 * Upfront "major" facets — rendered as pill lanes directly on the list screen.
 * High-frequency, low-cardinality cuts a management user reaches for constantly.
 */
export const MAJOR_FILTER_KEYS: (keyof SpeciesFilters)[] = ['Category', 'Class', 'Order', 'Family', 'Genus', 'Population']

/**
 * Remaining facets — live inside the filter drawer (deep cuts). Order/Family/Genus/Site are ALSO
 * upfront (progressive-reveal pills), but stay in the drawer so they can be set directly without
 * first drilling through their parent.
 */
export const DRAWER_FILTER_KEYS: (keyof SpeciesFilters)[] = ['Order', 'Family', 'Genus', 'Conservation', 'CITES', 'Site']

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
  'Site',
  'Sex'
]

/** No parked filters in mock mode — all filter on the dummy data. */
export const PARKED_FILTER_KEYS: (keyof SpeciesFilters)[] = []

export const POPULATION_BANDS: { key: string; label: string; min: number; max: number; note: string }[] = [
  { key: '1-3', label: '1–3', min: 1, max: 3, note: 'Critically few — every individual is irreplaceable' },
  { key: '4-10', label: '4–10', min: 4, max: 10, note: 'Small colony — limited breeding options' },
  { key: '11-50', label: '11–50', min: 11, max: 50, note: 'Working population — viable to manage' },
  { key: '51-100', label: '51–100', min: 51, max: 100, note: 'Strong population — healthy buffer' },
  { key: '100+', label: '100+', min: 101, max: Infinity, note: 'Large population — well established' }
]

export const READINESS_OPTIONS: { key: ReadinessKey; label: string; note: string }[] = [
  { key: 'can_pair', label: 'Can Pair', note: 'Both sexes present — ready to breed' },
  { key: 'needs_sexing', label: 'Needs Sexing', note: 'Sex unknown — potential locked until identified' },
  { key: 'single_sex', label: 'Single Sex', note: 'Only one sex — needs a mate to breed' }
]

export type SexKey = 'male' | 'female' | 'unsexed'

export const SEX_OPTIONS: { key: SexKey; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unsexed', label: 'Unsexed' }
]

/** A species matches a Sex option if it CONTAINS at least one animal of that kind. */
export function matchesSex(row: SpeciesRow, selected: string[]): boolean {
  if (!selected.length) return true

  return selected.some(key =>
    key === 'male' ? row.male > 0 : key === 'female' ? row.female > 0 : row.undetermined > 0
  )
}

/** Per-option qualitative context shown in the filter chip tooltip (no totals — those live on top). */
export interface FilterInsights {
  sharePct: number // share of all species (%)
  threatenedS: number // IUCN CR/EN/VU — species
  threatenedA: number // …and their animals
  citesI: number // CITES Appendix I — species
  citesII: number // CITES Appendix II — species
  sexingS: number // species with ≥1 unsexed animal
  sexingA: number // unsexed animals
}

/** Compact number for tight UI (chips): 478 → "478", 3200 → "3.2k", 44201 → "44.2k", 1000 → "1k". */
export const compactNumber = (n: number): string => {
  if (n < 1000) return String(n)
  const k = n / 1000

  return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
}

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
    sites: Array.isArray(item.sites) ? (item.sites as string[]) : [],
    births: num(item.births),
    deaths: num(item.deaths),
    enclosures: num(item.enclosures),
    pairs: num(item.pairs),
    chipped: num(item.chipped),
    accessions: num(item.accessions),
    birthsMonthly: (item.birthsMonthly as Record<string, number>) || {},
    deathsMonthly: (item.deathsMonthly as Record<string, number>) || {},
    lifespanAvg: (item.lifespan as { avgYears?: number } | null)?.avgYears ?? null,
    lifespanAvgAdult: (item.lifespan as { avgAdultYears?: number | null } | null)?.avgAdultYears ?? null,
    lifespanMax: (item.lifespan as { maxYears?: number } | null)?.maxYears ?? null,
    lifespanCount: (item.lifespan as { count?: number } | null)?.count ?? 0
  }
}

// ── Analysis filter (temporal): Births/Deaths by month·year range, or Lifespan ──
// One mutually-exclusive mode at a time (picking one clears the others). When active it
// filters membership, ranks highest-first, and surfaces a matching temporary table column.

export type AnalysisMode = 'births' | 'deaths' | 'lifespan'

export interface AnalysisFilter {
  mode: AnalysisMode | null
  // Births/Deaths period — null bound = open (all-time / all-months). Months are 1–12;
  // monthFrom > monthTo means a wrap-around window (e.g. Dec→Jan).
  yearFrom: number | null
  yearTo: number | null
  monthFrom: number | null
  monthTo: number | null
  // Lifespan band (years) — null = open.
  lifeMin: number | null
  lifeMax: number | null
}

export const EMPTY_ANALYSIS: AnalysisFilter = {
  mode: null,
  yearFrom: null,
  yearTo: null,
  monthFrom: null,
  monthTo: null,
  lifeMin: null,
  lifeMax: null
}

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The lifespan value the column headline + sort use: avg adult lifespan, falling back to the all-records avg. */
export const lifespanHeadline = (row: SpeciesRow): number | null => row.lifespanAvgAdult ?? row.lifespanAvg

/** Distinct calendar years present across all species' birth/death months, descending. */
export function availableYears(rows: SpeciesRow[]): number[] {
  const years = new Set<number>()
  for (const r of rows) {
    for (const k of Object.keys(r.birthsMonthly)) years.add(Number(k.slice(0, 4)))
    for (const k of Object.keys(r.deathsMonthly)) years.add(Number(k.slice(0, 4)))
  }

  return Array.from(years)
    .filter(y => Number.isFinite(y))
    .sort((a, b) => b - a)
}

const inYear = (y: number, from: number | null, to: number | null) =>
  (from == null || y >= from) && (to == null || y <= to)

const inMonth = (m: number, from: number | null, to: number | null) => {
  if (from == null && to == null) return true
  const lo = from ?? to!
  const hi = to ?? from!

  return lo <= hi ? m >= lo && m <= hi : m >= lo || m <= hi // wrap-around (e.g. Dec→Jan)
}

/** Sum a monthly map ({ "YYYY-MM": n }) over the analysis year+month window. */
function sumPeriod(monthly: Record<string, number>, a: AnalysisFilter): number {
  let total = 0
  for (const key in monthly) {
    const y = Number(key.slice(0, 4))
    const m = Number(key.slice(5, 7))
    if (inYear(y, a.yearFrom, a.yearTo) && inMonth(m, a.monthFrom, a.monthTo)) total += monthly[key]
  }

  return total
}

/** The numeric value a row contributes under the active analysis mode (null = no data / not applicable). */
export function analysisValue(row: SpeciesRow, a: AnalysisFilter): number | null {
  if (a.mode === 'births') return sumPeriod(row.birthsMonthly, a)
  if (a.mode === 'deaths') return sumPeriod(row.deathsMonthly, a)
  if (a.mode === 'lifespan') return lifespanHeadline(row)

  return null
}

/**
 * Apply the analysis filter on top of an already-filtered/searched row set: keep only matching
 * rows (births/deaths > 0 in window; lifespan present + within band) and rank highest-first.
 */
export function applyAnalysis(rows: SpeciesRow[], a: AnalysisFilter): SpeciesRow[] {
  if (!a.mode) return rows

  const scored = rows
    .map(row => ({ row, value: analysisValue(row, a) }))
    .filter(s => {
      if (s.value == null) return false
      if (a.mode === 'lifespan') {
        if (a.lifeMin != null && s.value < a.lifeMin) return false
        if (a.lifeMax != null && s.value > a.lifeMax) return false

        return true
      }

      return s.value > 0
    })

  return scored.sort((x, y) => (y.value as number) - (x.value as number)).map(s => s.row)
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
    if (!matchesSex(row, filters.Sex)) return false
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
