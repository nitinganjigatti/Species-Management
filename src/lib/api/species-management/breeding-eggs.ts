/**
 * Species Management — Egg Module analytics (FRONTEND-ONLY, MOCK).
 *
 * Management-grade breeding intelligence for EGG-LAYING species (Aves / Reptilia).
 * Everything here is SYNTHESIZED deterministically (seeded by species id) from the real
 * static species JSON (list.json for the cross-species index; the per-species animal/enclosure
 * blocks for the drill). No backend. When the backend exposes real egg/clutch records, replace
 * the three exported loaders — the returned shapes (`EggIndex`, `SpeciesFunnel`, `FemaleDetail`)
 * are the contract.
 *
 * Domain model (AZA / ZIMS / hatchery research, 2026-07):
 *   Fertility        = fertile / laid           (the mating / male side)
 *   Hatch-of-fertile = hatched / fertile        (the incubation / embryo side)
 *   Hatchability     = hatched / laid           (the headline number)  = Fertility × Hatch-of-fertile
 * Failed eggs split into infertile (→ pairings) vs dead-in-shell (→ incubation) vs early/cracked.
 * Egg weight must lose ~13–15% of day-0 weight by hatch along a ~linear ideal line.
 */

import { getSpeciesAnimals } from 'src/lib/api/species-management/detail'
import type { AnimalRecord } from 'src/types/species-management/detail'

/* ------------------------------------------------------------------ types (the contract) */

export const EGG_LAYING_CLASSES = new Set(['Aves', 'Reptilia'])

/** The failure breakdown of eggs that did not hatch. */
export interface FailureSplit {
  infertile: number // -> check pairings
  deadInShell: number // -> check incubation
  earlyCracked: number
}

export interface FemaleRow {
  antzId: string
  name: string
  idType?: string
  enclosure?: string
  site?: string
  capable: boolean // age >= assumed maturity
  laid: boolean // laid at least one egg this season
  eggs: number
  clutches: number
  hatched: number
  hatchPct: number
  targetHatchPct: number
  clutchSizes: number[] // for the clutch-bar sparkline
  monthly: number[] // 12-month laying rhythm
}

/** Cross-tab reconcile — ties the funnel to this species' Pairing / Circle-of-Life data. */
export interface BreedingReconcile {
  pairs?: number // total pairs (from list.json)
  unproductivePairs?: number // pairs with no clutch this season
  birthsRecorded?: number // Circle-of-Life births total, to compare against hatched
}

/** One species' breeding analytics: funnel + rates + season trend + per-female roster. */
export interface SpeciesFunnel {
  speciesId: number
  commonName: string
  scientificName?: string
  className?: string
  season: string
  females: number
  neverLaid: number
  laid: number
  fertile: number
  hatched: number
  lost: number
  failureSplit: FailureSplit
  fertilityPct: number
  hatchOfFertilePct: number
  hatchabilityPct: number
  targetHatchPct: number
  seasonYears: string[] // e.g. ['2021','2022',...]
  seasonHatchability: number[] // hatchability % per year — the trend line
  reconcile: BreedingReconcile
  // Female participation (the donut): every female is exactly one of these three.
  totalFemales: number
  capableFemales: number // age >= assumed maturity (ESTIMATE)
  laidFemales: number // capable AND laid this season
  capableDidNotLay: number // capable but no eggs this season — the husbandry alarm
  notYetCapable: number // below maturity age
  maturityYears: number // the assumed threshold used, for the "est" label
  females_rows: FemaleRow[]
}

export type EggFate = 'hatched' | 'infertile' | 'dead_in_shell' | 'early_cracked' | 'incubating'

export interface ClutchDetail {
  clutchId: string
  laidDate: string
  size: number
  hatched: number
  fates: EggFate[]
}

/** A single egg's incubation weight track vs the ideal loss corridor. */
export interface WeightTrack {
  eggLabel: string
  startWeight: number
  incubationDays: number
  targetLossPct: number // 13–15
  ideal: number[] // linear ideal weight per day
  bandUpper: number[] // acceptable corridor
  bandLower: number[]
  actual: (number | null)[] // measured so far
  breachDay?: number // first day the actual left the band (if any)
}

export interface FemaleDetail {
  speciesId: number
  antzId: string
  name: string
  commonName: string
  enclosure?: string
  site?: string
  eggs: number
  clutches: ClutchDetail[]
  monthly: number[]
  monthlyLabels: string[]
  weightTrack: WeightTrack
}

/* ------------------------------------------------------------------ deterministic helpers */

// mulberry32 — same species id always yields the same numbers
const rng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const seedOf = (id: number | string) => (Number(id) || String(id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)) * 2654435761
const pad = (n: number, len = 2) => String(n).padStart(len, '0')
const round = (n: number, p = 0) => {
  const f = 10 ** p

  return Math.round(n * f) / f
}
const isoDaysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)

  return d.toISOString().slice(0, 10)
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Reptiles run lower hatch baselines than birds (research: hawksbill 58% hatch vs poultry ~81%).
const targetForClass = (className?: string) => (className === 'Reptilia' ? 55 : 70)

// ASSUMED sexual-maturity age (years). The dump has no maturity flag, so "capable of laying"
// is inferred from age >= this threshold. Labelled "est" in the UI. Tune when real data lands.
const maturityYearsFor = (className?: string) => (className === 'Reptilia' ? 2 : 1)

// Parse antz age strings like "3m, 14d" / "2y, 5m" / "11d" into years (approx).
// Returns null when age is unknown/blank — a huge share of records have no age, and treating
// unknown as age 0 would wrongly flag mature females as "too young." Unknown-age females are
// assumed capable (they're in the collection as breeding stock), not immature.
const ageToYears = (age?: string): number | null => {
  if (!age || !age.trim()) return null
  let years = 0
  const y = age.match(/(\d+)\s*y/)
  const m = age.match(/(\d+)\s*m/)
  const d = age.match(/(\d+)\s*d/)
  if (y) years += Number(y[1])
  if (m) years += Number(m[1]) / 12
  if (d) years += Number(d[1]) / 365

  return years
}

/* --------------------------------------------------- per-species (L2) & per-female (L3) */

type Female = { antzId: string; name: string; idType?: string; enclosure?: string; site?: string; ageYears: number | null }

function femalesOf(animals: AnimalRecord[]): Female[] {
  const map = (a: AnimalRecord) => ({ antzId: a.antzId, name: a.name || a.antzId, idType: a.idType, enclosure: a.enclosure, site: a.site, ageYears: ageToYears(a.age) })
  const fem = animals.filter(a => /^female$/i.test(a.gender || '')).map(map)
  if (fem.length) return fem

  // fall back to any animals so the screen is never empty for an egg-layer with unsexed stock
  return animals.slice(0, 6).map(map)
}

/** Build one female's clutch sizes + monthly rhythm + hatch outcome, deterministically. */
function femaleBreeding(speciesId: number, f: Female, className?: string) {
  const r = rng(seedOf(speciesId) ^ seedOf(f.antzId))
  const reptile = className === 'Reptilia'
  const clutchCount = 1 + Math.floor(r() * (reptile ? 4 : 6))
  const clutchSizes = Array.from({ length: clutchCount }, () => (reptile ? 4 + Math.floor(r() * 16) : 1 + Math.floor(r() * 6)))
  const eggs = clutchSizes.reduce((s, n) => s + n, 0)
  const fertility = (reptile ? 60 : 70) + r() * 22
  const hatchOfFertile = (reptile ? 50 : 62) + r() * 30
  const hatched = Math.round((eggs * fertility * hatchOfFertile) / 10000)

  // 12-month laying rhythm: a seasonal hump centred on a species-stable peak month
  const peak = Math.floor(r() * 12)
  const monthly = MONTHS.map((_, m) => {
    const dist = Math.min(Math.abs(m - peak), 12 - Math.abs(m - peak))

    return Math.max(0, Math.round((eggs / 3) * Math.exp(-(dist * dist) / 4) * (0.7 + r() * 0.6)))
  })

  return { r, clutchCount, clutchSizes, eggs, hatched, monthly, peak }
}

export async function getSpeciesBreeding(
  id: number | string,
  opts: { className?: string; commonName?: string; pairs?: number; birthsRecorded?: number } = {}
): Promise<SpeciesFunnel | null> {
  const { className, commonName, pairs, birthsRecorded } = opts
  const speciesId = Number(id)
  const animalsBlock = await getSpeciesAnimals(id)
  const animals = animalsBlock?.animals || []
  const females = femalesOf(animals)
  if (!females.length) return null

  const maturityYears = maturityYearsFor(className)
  const fr = rng(seedOf(speciesId) ^ 0x51ed270b)

  // Female participation: only CAPABLE (mature) females can lay; of those, a share actually laid.
  // Below maturity → not yet capable (0 eggs). Capable but skipped this season → the husbandry alarm.
  const rows: FemaleRow[] = females.map(f => {
    // unknown age (null) → assume capable (breeding stock), NOT immature
    const capable = f.ageYears == null || f.ageYears >= maturityYears
    // deterministic "did she lay?" for capable females (~78% do)
    const lays = capable && rng(seedOf(speciesId) ^ seedOf(f.antzId) ^ 0x2e1b21)() < 0.78
    const b = lays ? femaleBreeding(speciesId, f, className) : { clutchCount: 0, clutchSizes: [] as number[], eggs: 0, hatched: 0, monthly: Array(12).fill(0) }

    return {
      antzId: f.antzId,
      name: f.name,
      idType: f.idType,
      enclosure: f.enclosure,
      site: f.site,
      capable,
      laid: lays,
      eggs: b.eggs,
      clutches: b.clutchCount,
      hatched: b.hatched,
      hatchPct: b.eggs ? round((b.hatched / b.eggs) * 100) : 0,
      targetHatchPct: targetForClass(className),
      clutchSizes: b.clutchSizes,
      monthly: b.monthly
    }
  })

  const capableFemales = rows.filter(x => x.capable).length
  const laidFemales = rows.filter(x => x.laid).length
  const capableDidNotLay = capableFemales - laidFemales
  const notYetCapable = females.length - capableFemales

  const laid = rows.reduce((s, x) => s + x.eggs, 0)
  const hatched = rows.reduce((s, x) => s + x.hatched, 0)
  const neverLaid = females.length - laidFemales

  const fertilityPct = round((className === 'Reptilia' ? 60 : 70) + fr() * 22)
  const fertile = Math.round((laid * fertilityPct) / 100)
  const lost = laid - hatched

  // split the loss: infertile (laid−fertile) + fertile-but-died split into shell vs early
  const infertile = Math.max(0, laid - fertile)
  const fertileFailed = Math.max(0, lost - infertile)
  const deadInShell = Math.round(fertileFailed * (0.5 + fr() * 0.2))
  const earlyCracked = Math.max(0, fertileFailed - deadInShell)

  const hatchabilityPct = laid ? round((hatched / laid) * 100) : 0

  // Season-over-season hatchability trend: last 5 years, walking toward this year's value.
  const thisYear = new Date().getFullYear()
  const seasonYears = Array.from({ length: 5 }, (_, i) => String(thisYear - 4 + i))
  const tr = rng(seedOf(speciesId) ^ 0x27d4eb2f)
  const seasonHatchability = seasonYears.map((_, i) => {
    const drift = (i - 4) * (4 + tr() * 4) // earlier years a bit lower/noisier
    return Math.max(0, Math.min(100, round(hatchabilityPct + drift + (tr() - 0.5) * 8)))
  })
  seasonHatchability[seasonHatchability.length - 1] = hatchabilityPct

  // Reconcile against Pairing + Circle-of-Life. Pairs from list.json; unproductive ~ neverLaid share.
  const unproductivePairs = pairs != null ? Math.min(pairs, Math.round((neverLaid / Math.max(1, females.length)) * pairs)) : undefined

  return {
    speciesId,
    commonName: commonName || `Species ${speciesId}`,
    scientificName: undefined,
    className,
    season: String(thisYear),
    females: females.length,
    neverLaid,
    laid,
    fertile,
    hatched,
    lost,
    failureSplit: { infertile, deadInShell, earlyCracked },
    fertilityPct,
    hatchOfFertilePct: fertile ? round((hatched / fertile) * 100) : 0,
    hatchabilityPct,
    targetHatchPct: targetForClass(className),
    seasonYears,
    seasonHatchability,
    reconcile: { pairs, unproductivePairs, birthsRecorded },
    totalFemales: females.length,
    capableFemales,
    laidFemales,
    capableDidNotLay,
    notYetCapable,
    maturityYears,
    females_rows: rows.sort((a, b) => a.hatchPct - b.hatchPct)
  }
}

/** Build the ideal weight-loss corridor and a measured track for one representative egg. */
function buildWeightTrack(r: () => number, className?: string): WeightTrack {
  const reptile = className === 'Reptilia'
  const startWeight = round(reptile ? 8 + r() * 30 : 12 + r() * 60, 1)
  const incubationDays = reptile ? 55 + Math.floor(r() * 20) : 21 + Math.floor(r() * 12)
  const targetLossPct = round(13 + r() * 2, 1)
  const endWeight = startWeight * (1 - targetLossPct / 100)
  const perDay = (startWeight - endWeight) / incubationDays

  const ideal: number[] = []
  const bandUpper: number[] = []
  const bandLower: number[] = []
  const actual: (number | null)[] = []
  const tol = startWeight * 0.012 // corridor half-width
  const daysMeasured = Math.round(incubationDays * (0.55 + r() * 0.4))

  // does this egg drift dry (below the corridor → needs more humidity)?
  const driesOut = r() > 0.55
  let breachDay: number | undefined

  for (let d = 0; d <= incubationDays; d++) {
    const idl = startWeight - perDay * d
    ideal.push(round(idl, 1))
    bandUpper.push(round(idl + tol, 1))
    bandLower.push(round(idl - tol, 1))
    if (d <= daysMeasured) {
      const drift = driesOut ? -(d / incubationDays) * tol * 2.4 : (d / incubationDays) * tol * 1.4
      const jitter = (r() - 0.5) * tol * 0.5
      const val = round(idl + drift + jitter, 1)
      actual.push(val)
      if (breachDay == null && (val > idl + tol || val < idl - tol)) breachDay = d
    } else actual.push(null)
  }

  return { eggLabel: 'Representative egg', startWeight, incubationDays, targetLossPct, ideal, bandUpper, bandLower, actual, breachDay }
}

export async function getFemaleDetail(
  speciesId: number | string,
  antzId: string,
  className?: string
): Promise<FemaleDetail | null> {
  const sid = Number(speciesId)
  const animalsBlock = await getSpeciesAnimals(speciesId)
  const animals = animalsBlock?.animals || []
  const f = femalesOf(animals).find(x => x.antzId === antzId) || femalesOf(animals)[0]
  if (!f) return null

  const b = femaleBreeding(sid, f, className)

  // materialise each clutch with per-egg fates
  let hatchLeft = b.hatched
  const clutches: ClutchDetail[] = b.clutchSizes.map((size, ci) => {
    const cr = rng(seedOf(sid) ^ seedOf(f.antzId) ^ (ci + 1) * 0x1000193)
    const thisHatched = Math.min(size, Math.round(hatchLeft / (b.clutchSizes.length - ci)))
    hatchLeft -= thisHatched
    const fates: EggFate[] = []
    for (let e = 0; e < size; e++) {
      if (e < thisHatched) fates.push('hatched')
      else {
        const roll = cr()
        fates.push(roll < 0.4 ? 'infertile' : roll < 0.75 ? 'dead_in_shell' : 'early_cracked')
      }
    }

    return {
      clutchId: `CL-${sid}-${pad(ci + 1)}`,
      laidDate: isoDaysAgo(20 + ci * 30 + Math.floor(cr() * 10)),
      size,
      hatched: thisHatched,
      fates
    }
  })

  return {
    speciesId: sid,
    antzId: f.antzId,
    name: f.name,
    commonName: `Species ${sid}`,
    enclosure: f.enclosure,
    site: f.site,
    eggs: b.eggs,
    clutches,
    monthly: b.monthly,
    monthlyLabels: MONTHS,
    weightTrack: buildWeightTrack(b.r, className)
  }
}
