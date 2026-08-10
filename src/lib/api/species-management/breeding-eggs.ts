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

import { getSpeciesAnimals, getSpeciesClinical } from 'src/lib/api/species-management/detail'
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
  /** Display identity — the module's mock convention ("Aaru #A-1146"), same style the Medical/
   *  Hospital sheets show. Falls back to the raw identifier when no mock name is available. */
  name: string
  /** The REAL local identifier from the animal record (chip/ring/local id value). */
  identifier: string
  idType?: string
  enclosure?: string
  site?: string
  /** @deprecated maturity is an estimate the 2026-07-30 review rejected — detail2 no longer reads it */
  capable: boolean // age >= assumed maturity
  laid: boolean // laid at least one egg this season
  eggs: number
  clutches: number
  fertile: number
  hatched: number
  hatchPct: number
  /** @deprecated targets rejected by the 2026-07-30 review ("no targets") — detail2 no longer reads it */
  targetHatchPct: number
  /** Her hatch % LAST season — the self-comparison that replaced targets. null = no eggs last season. */
  prevHatchPct: number | null
  clutchSizes: number[] // for the clutch-bar sparkline
  monthly: number[] // 12-month laying rhythm (sums to `eggs`)
  monthlyFertile: number[] // per-month fertile, ≤ monthly (sums to `fertile`)
  monthlyHatched: number[] // per-month hatched, ≤ monthlyFertile (sums to `hatched`)
}

/** Females bucketed by how many clutches they put this season — the 2026-07-30 ask ("0 / 1 / 2+"). */
export interface ClutchBuckets {
  zero: number
  one: number
  twoPlus: number
  twoPlusAvg: number // avg clutches among the 2+ group
}

export interface SiteCut {
  site: string
  eggs: number
  hatchPct: number
}
export interface EnclosureCut {
  enclosure: string
  eggs: number
  fertilePct: number
}
export interface NurseryCut {
  nursery: string
  set: number // fertile eggs set here
  hatchOfFertilePct: number
}
export interface DiscardReason {
  reason: string
  eggs: number
  pct: number // share of all lost eggs
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
  /** @deprecated targets rejected by the 2026-07-30 review — detail2 compares to LAST SEASON instead */
  targetHatchPct: number
  /** Last season's hatchability — the self-comparison reference (replaces the target). */
  lastSeasonHatchabilityPct: number
  avgClutchSize: number
  clutchBuckets: ClutchBuckets
  bySite: SiteCut[]
  byEnclosure: EnclosureCut[]
  byNursery: NurseryCut[]
  discardReasons: DiscardReason[]
  monthlyLaid: number[] // Jan..Dec eggs laid — the laying calendar
  monthlyFertile: number[] // Jan..Dec fertile — nests inside monthlyLaid
  monthlyHatched: number[] // Jan..Dec hatched — nests inside monthlyFertile
  seasonYears: string[] // e.g. ['2021','2022',...]
  seasonHatchability: number[] // hatchability % per year — the trend line
  /** Monthly hatchability across the 5 seasons ("Mar '25" labels) — feeds the standard
   *  1Y/2Y/3Y/All range-tab trend. Current season = actual monthly hatched/laid; earlier
   *  seasons wobble (seeded) around that season's hatchability. */
  hatchByMonth: { label: string; pct: number }[]
  reconcile: BreedingReconcile
  // Female participation. detail2 uses only totalFemales + laidFemales ("laid at least once");
  // the capable/maturity split below is a rejected estimate kept only for the hidden detail3.
  totalFemales: number
  /** @deprecated maturity estimate — rejected 2026-07-30 */
  capableFemales: number
  laidFemales: number // laid at least once this season
  /** @deprecated maturity estimate — rejected 2026-07-30 */
  capableDidNotLay: number
  /** @deprecated maturity estimate — rejected 2026-07-30 */
  notYetCapable: number
  /** @deprecated maturity estimate — rejected 2026-07-30 */
  maturityYears: number
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
  const fertile = Math.min(eggs, Math.round((eggs * fertility) / 100))
  const hatched = Math.min(fertile, Math.round((eggs * fertility * hatchOfFertile) / 10000))

  // 12-month laying rhythm: a seasonal hump centred on a species-stable peak month.
  // The hump gives the SHAPE; the counts are then distributed so monthly sums to `eggs`
  // exactly — every month column must reconcile with the season totals.
  const peak = Math.floor(r() * 12)
  const weights = MONTHS.map((_, m) => {
    const dist = Math.min(Math.abs(m - peak), 12 - Math.abs(m - peak))

    return Math.exp(-(dist * dist) / 4) * (0.7 + r() * 0.6)
  })
  const monthly = distribute(eggs, weights)
  const monthlyFertile = distribute(fertile, weights, monthly)
  const monthlyHatched = distribute(hatched, weights, monthlyFertile)

  return { r, clutchCount, clutchSizes, eggs, fertile, hatched, monthly, monthlyFertile, monthlyHatched, peak }
}

/** Split `total` across 12 months proportionally to `weights`, never exceeding the per-month
 *  `cap` (when given), with the rounding remainder handed to the largest-fraction months —
 *  so the pieces ALWAYS sum back to `total` and hatched ≤ fertile ≤ laid holds per month. */
function distribute(total: number, weights: number[], cap?: number[]): number[] {
  if (!total) return weights.map(() => 0)
  const wSum = weights.reduce((s, w) => s + w, 0) || 1
  const raw = weights.map(w => (total * w) / wSum)
  const out = raw.map((v, i) => Math.min(Math.floor(v), cap ? cap[i] : Infinity))
  let left = total - out.reduce((s, n) => s + n, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (left <= 0) break
    const room = (cap ? cap[i] : Infinity) - out[i]
    if (room > 0) {
      out[i]++
      left--
    }
  }
  // caps were tight somewhere — sweep any remaining into months that still have room
  for (let i = 0; i < out.length && left > 0; i++) {
    const room = (cap ? cap[i] : Infinity) - out[i]
    const add = Math.min(room, left)
    out[i] += add
    left -= add
  }

  return out
}

/* Reason labels for lost eggs — the discard ledger cuts. */
const NURSERY_NAMES = ['Incubator 1', 'Incubator 2', 'Incubator 3', 'Nursery North', 'Parent-reared nest']

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

  // Display identity — the module's mock animal convention ("Aaru #A-1146"). The species' mock
  // given-name comes from the clinical sidecar (so Eggs shows the SAME name Medical/Hospital
  // show for this species) + a stable 4-digit AID per female. The real local identifier
  // (chip/ring) is kept on `identifier` for detail views.
  const clinical = await getSpeciesClinical(id).catch(() => null)
  const clinRecords = clinical?.programs?.symptoms?.records?.length
    ? clinical.programs.symptoms.records
    : clinical?.programs?.diagnosis?.records || []
  const clinName = clinRecords[0]?.name
  const given = clinName && clinName.includes(' #A-') ? clinName.split(' #A-')[0] : undefined
  const usedAids = new Set<number>()
  const aidFor = (antzId: string) => {
    let n = 1000 + (Math.abs(seedOf(antzId)) % 9000)
    while (usedAids.has(n)) n = 1000 + ((n - 999) % 9000)
    usedAids.add(n)

    return n
  }

  // Female participation — the headline is simply "laid at least once this season" (2026-07-30
  // review). The capable/maturity estimate is still computed for the legacy detail3 screen only.
  const rows: FemaleRow[] = females.map(f => {
    // unknown age (null) → assume capable (breeding stock), NOT immature
    const capable = f.ageYears == null || f.ageYears >= maturityYears
    // deterministic "did she lay?" (~74% of females do)
    const lays = rng(seedOf(speciesId) ^ seedOf(f.antzId) ^ 0x2e1b21)() < 0.74
    const b = lays
      ? femaleBreeding(speciesId, f, className)
      : {
          clutchCount: 0,
          clutchSizes: [] as number[],
          eggs: 0,
          fertile: 0,
          hatched: 0,
          monthly: Array(12).fill(0) as number[],
          monthlyFertile: Array(12).fill(0) as number[],
          monthlyHatched: Array(12).fill(0) as number[]
        }
    const hatchPct = b.eggs ? round((b.hatched / b.eggs) * 100) : 0

    // her LAST season, for the self-comparison column — null = she has no eggs last season
    const pr = rng(seedOf(speciesId) ^ seedOf(f.antzId) ^ 0x5f356495)
    const laidLastSeason = pr() < 0.75
    const prevHatchPct = lays && laidLastSeason ? Math.max(0, Math.min(100, round(hatchPct + (pr() - 0.45) * 26))) : null

    return {
      antzId: f.antzId,
      name: given ? `${given} #A-${aidFor(f.antzId)}` : f.name,
      identifier: f.name,
      idType: f.idType,
      enclosure: f.enclosure,
      site: f.site,
      capable,
      laid: lays,
      eggs: b.eggs,
      clutches: b.clutchCount,
      fertile: b.fertile,
      hatched: b.hatched,
      hatchPct,
      targetHatchPct: targetForClass(className),
      prevHatchPct,
      clutchSizes: b.clutchSizes,
      monthly: b.monthly,
      monthlyFertile: b.monthlyFertile,
      monthlyHatched: b.monthlyHatched
    }
  })

  const capableFemales = rows.filter(x => x.capable).length
  const laidFemales = rows.filter(x => x.laid).length
  const capableDidNotLay = capableFemales - laidFemales
  const notYetCapable = females.length - capableFemales

  const laid = rows.reduce((s, x) => s + x.eggs, 0)
  const hatched = rows.reduce((s, x) => s + x.hatched, 0)
  const neverLaid = females.length - laidFemales

  // fertile is SUMMED from the per-female rows so the funnel, the tables and the roster all
  // reconcile — a bar that says 166 must open a list that adds up to 166.
  const fertile = rows.reduce((s, x) => s + x.fertile, 0)
  const fertilityPct = laid ? round((fertile / laid) * 100) : 0
  const lost = laid - hatched

  // split the loss: infertile (laid−fertile) + fertile-but-died split into shell vs early
  const infertile = Math.max(0, laid - fertile)
  const fertileFailed = Math.max(0, lost - infertile)
  const deadInShell = Math.round(fertileFailed * (0.5 + fr() * 0.2))
  const earlyCracked = Math.max(0, fertileFailed - deadInShell)

  const hatchabilityPct = laid ? round((hatched / laid) * 100) : 0

  // clutch distribution — females by clutches put this season (0 / 1 / 2+)
  const zero = rows.filter(x => x.clutches === 0).length
  const one = rows.filter(x => x.clutches === 1).length
  const twoPlusRows = rows.filter(x => x.clutches >= 2)
  const clutchBuckets: ClutchBuckets = {
    zero,
    one,
    twoPlus: twoPlusRows.length,
    twoPlusAvg: twoPlusRows.length ? round(twoPlusRows.reduce((s, x) => s + x.clutches, 0) / twoPlusRows.length, 1) : 0
  }
  const clutchTotal = rows.reduce((s, x) => s + x.clutches, 0)
  const avgClutchSize = clutchTotal ? round(laid / clutchTotal, 1) : 0

  // where it is happening — grouped straight from the roster so every cut reconciles
  const groupBy = <K extends string>(key: (x: FemaleRow) => K | undefined) => {
    const m = new Map<string, { eggs: number; fertile: number; hatched: number }>()
    for (const x of rows) {
      if (!x.eggs) continue
      const k = key(x) || '—'
      const g = m.get(k) ?? { eggs: 0, fertile: 0, hatched: 0 }
      g.eggs += x.eggs
      g.fertile += x.fertile
      g.hatched += x.hatched
      m.set(k, g)
    }

    return m
  }
  const bySite: SiteCut[] = Array.from(groupBy(x => x.site).entries())
    .map(([site, g]) => ({ site, eggs: g.eggs, hatchPct: g.eggs ? round((g.hatched / g.eggs) * 100) : 0 }))
    .sort((a, b) => b.eggs - a.eggs)
  const byEnclosure: EnclosureCut[] = Array.from(groupBy(x => x.enclosure).entries())
    .map(([enclosure, g]) => ({ enclosure, eggs: g.eggs, fertilePct: g.eggs ? round((g.fertile / g.eggs) * 100) : 0 }))
    .sort((a, b) => b.eggs - a.eggs)

  // nurseries — where the fertile eggs were set (no nursery field in the dump; deterministic split)
  const nr = rng(seedOf(speciesId) ^ 0x3c6ef372)
  const nWeights = NURSERY_NAMES.map(() => 0.4 + nr())
  const nSum = nWeights.reduce((s, w) => s + w, 0)
  let setLeft = fertile
  const byNursery: NurseryCut[] = NURSERY_NAMES.map((nursery, i) => {
    const set = i === NURSERY_NAMES.length - 1 ? setLeft : Math.min(setLeft, Math.round((fertile * nWeights[i]) / nSum))
    setLeft -= set

    return { nursery, set, hatchOfFertilePct: Math.max(0, Math.min(100, round((fertile ? (hatched / fertile) * 100 : 0) + (nr() - 0.5) * 18))) }
  })
    .filter(n => n.set > 0)
    .sort((a, b) => b.set - a.set)

  // why eggs were discarded — every lost egg lands in exactly one reason
  const cracked = Math.round(earlyCracked * 0.5)
  const rotten = Math.round(earlyCracked * 0.3)
  const abandoned = Math.max(0, earlyCracked - cracked - rotten)
  const discardReasons: DiscardReason[] = [
    { reason: 'Infertile on candling', eggs: infertile },
    { reason: 'Died in shell', eggs: deadInShell },
    { reason: 'Cracked in handling', eggs: cracked },
    { reason: 'Rotten / contaminated', eggs: rotten },
    { reason: 'Abandoned in nest', eggs: abandoned }
  ]
    .filter(d => d.eggs > 0)
    .map(d => ({ ...d, pct: lost ? round((d.eggs / lost) * 100) : 0 }))
    .sort((a, b) => b.eggs - a.eggs)

  // laying calendar — Jan..Dec across the roster (fertile/hatched nest inside, all reconcile)
  const monthlyLaid = MONTHS.map((_, m) => rows.reduce((s, x) => s + (x.monthly[m] || 0), 0))
  const monthlyFertile = MONTHS.map((_, m) => rows.reduce((s, x) => s + (x.monthlyFertile[m] || 0), 0))
  const monthlyHatched = MONTHS.map((_, m) => rows.reduce((s, x) => s + (x.monthlyHatched[m] || 0), 0))

  // Season-over-season hatchability trend: last 5 years, walking toward this year's value.
  const thisYear = new Date().getFullYear()
  const seasonYears = Array.from({ length: 5 }, (_, i) => String(thisYear - 4 + i))
  const tr = rng(seedOf(speciesId) ^ 0x27d4eb2f)
  const seasonHatchability = seasonYears.map((_, i) => {
    const drift = (i - 4) * (4 + tr() * 4) // earlier years a bit lower/noisier
    return Math.max(0, Math.min(100, round(hatchabilityPct + drift + (tr() - 0.5) * 8)))
  })
  seasonHatchability[seasonHatchability.length - 1] = hatchabilityPct

  // Monthly hatchability across the 5 seasons — the standard range-tab trend series.
  // Current season = ACTUAL monthly hatched/laid off the roster; earlier seasons wobble
  // (seeded) around that season's hatchability so every window reconciles with the trend.
  const hm = rng(seedOf(speciesId) ^ 0x1b873593)
  const hatchByMonth: { label: string; pct: number }[] = []
  seasonYears.forEach((y, yi) => {
    MONTHS.forEach((mLabel, m) => {
      const isCurrent = yi === seasonYears.length - 1
      const actual = isCurrent && monthlyLaid[m] > 0 ? (monthlyHatched[m] / monthlyLaid[m]) * 100 : null
      const pct = actual ?? Math.max(0, Math.min(100, seasonHatchability[yi] + (hm() - 0.5) * 16))
      hatchByMonth.push({ label: `${mLabel} '${y.slice(2)}`, pct: round(pct) })
    })
  })

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
    lastSeasonHatchabilityPct: seasonHatchability[seasonHatchability.length - 2] ?? hatchabilityPct,
    avgClutchSize,
    clutchBuckets,
    bySite,
    byEnclosure,
    byNursery,
    discardReasons,
    monthlyLaid,
    monthlyFertile,
    monthlyHatched,
    seasonYears,
    seasonHatchability,
    hatchByMonth,
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
