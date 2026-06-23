import type { AnimalRecord, EggState, SpeciesEgg, SpeciesEggs } from 'src/types/species-management/detail'
import { getSpeciesAnimals, getSpeciesDetailHeader } from 'src/lib/api/species-management/detail'

/**
 * Species Management — Eggs (FRONTEND-ONLY, MOCK).
 *
 * The antz egg module's data lives in the live backend and is keyed to a real egg
 * scenario; species-management is static-JSON only. So for now we SYNTHESIZE plausible
 * eggs for egg-laying species (Aves / Reptilia) — deterministically seeded by species id
 * and mapped onto the species' REAL animals/enclosures (already in the static detail JSON).
 * No backend, no re-extraction. When the backend exposes per-species eggs, replace
 * `getSpeciesEggs` with a real fetch — the `SpeciesEggs` shape is the contract.
 */

const EGG_LAYING_CLASSES = new Set(['Aves', 'Reptilia'])

// deterministic PRNG (mulberry32) so a species always renders the same eggs
const rng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const STATES: EggState[] = ['received', 'in_nest', 'in_incubation', 'hatched', 'to_be_discarded', 'discarded']
// cumulative weights for the lifecycle distribution
const STATE_WEIGHTS: [EggState, number][] = [
  ['received', 0.15],
  ['in_nest', 0.2],
  ['in_incubation', 0.25],
  ['hatched', 0.25],
  ['to_be_discarded', 0.05],
  ['discarded', 0.1]
]

const HEALTHY_CONDITIONS = ['Fresh', 'Fertile', 'Developing']
const BAD_CONDITIONS = ['Infertile', 'Cracked', 'Rotten', 'Dead-in-shell']
const DISCARD_REASONS = ['Infertile', 'Cracked shell', 'Rotten', 'Dead-in-shell', 'Damaged in handling']

const pad = (n: number, len = 4) => String(n).padStart(len, '0')
const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length)] || arr[0]

const isoDaysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)

  return d.toISOString().slice(0, 10)
}

const conditionFor = (state: EggState, r: number) =>
  state === 'to_be_discarded' || state === 'discarded'
    ? pick(BAD_CONDITIONS, r)
    : state === 'hatched'
      ? 'Fertile'
      : pick(HEALTHY_CONDITIONS, r)

function buildHistory(state: EggState, collectionDay: number, r: () => number): SpeciesEgg['history'] {
  const h: NonNullable<SpeciesEgg['history']> = [
    { date: isoDaysAgo(collectionDay), state: 'received', note: 'Egg collected' }
  ]
  const order: EggState[] = ['in_nest', 'in_incubation', 'hatched']
  let day = collectionDay
  for (const s of order) {
    if (STATES.indexOf(s) > STATES.indexOf(state)) break
    day = Math.max(0, day - Math.floor(r() * 8) - 2)
    h.push({
      date: isoDaysAgo(day),
      state: s,
      note: s === 'in_nest' ? 'Left in nest' : s === 'in_incubation' ? 'Moved to incubator' : 'Hatched successfully'
    })
    if (s === state) break
  }
  if (state === 'to_be_discarded' || state === 'discarded') {
    day = Math.max(0, day - Math.floor(r() * 5) - 1)
    h.push({ date: isoDaysAgo(day), state, note: state === 'discarded' ? 'Discarded' : 'Flagged for discard' })
  }

  return h
}

function generate(speciesId: string, animals: AnimalRecord[]): SpeciesEgg[] {
  const idNum = Number(speciesId) || speciesId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const r = rng(idNum * 2654435761)

  // Group animals by enclosure → candidate mothers (females) & fathers (males).
  // Eggs are collected from an enclosure; when >1 candidate of a sex shares it, every
  // one is a "probable" parent. A lone candidate makes that parent certain.
  type Cand = { antzId: string; name: string }
  type EncGroup = { enclosure: string; site?: string; females: Cand[]; males: Cand[] }
  const byEnclosure = new Map<string, EncGroup>()
  for (const a of animals) {
    const enc = a.enclosure || 'Unknown Enclosure'
    if (!byEnclosure.has(enc)) byEnclosure.set(enc, { enclosure: enc, site: a.site, females: [], males: [] })
    const g = byEnclosure.get(enc) as EncGroup
    if (!g.site && a.site) g.site = a.site
    const cand: Cand = { antzId: a.antzId, name: a.name || a.antzId }
    if (/^female$/i.test(a.gender || '')) g.females.push(cand)
    else if (/^male$/i.test(a.gender || '')) g.males.push(cand)
  }
  // enclosures that can produce eggs (have at least one female); fall back to all enclosures
  let laying = Array.from(byEnclosure.values()).filter(g => g.females.length)
  if (!laying.length) laying = Array.from(byEnclosure.values())
  if (!laying.length) laying = [{ enclosure: 'Unknown Enclosure', site: undefined, females: [], males: [] }]

  const totalFemales = laying.reduce((s, g) => s + g.females.length, 0)
  const base = totalFemales || animals.length || 4
  const count = Math.min(40, Math.max(6, Math.round(base * 1.5)))
  const eggs: SpeciesEgg[] = []

  for (let i = 0; i < count; i++) {
    // weighted state pick
    const roll = r()
    let acc = 0
    let state: EggState = 'received'
    for (const [s, w] of STATE_WEIGHTS) {
      acc += w
      if (roll <= acc) {
        state = s
        break
      }
    }

    const group = laying[Math.floor(r() * laying.length)]
    const females = group.females
    const males = group.males
    // Mother: lone female → certain; multiple → certain ~half the time, else all probable.
    const probableMothers = females.slice(0, 12)
    const motherKnownId =
      females.length === 1 ? females[0].antzId : females.length > 1 && r() > 0.5 ? females[Math.floor(r() * females.length)].antzId : undefined
    // Father: lone male → certain; multiple → all probable; none → unknown.
    const probableFathers = males.slice(0, 12)
    const fatherKnownId = males.length === 1 ? males[0].antzId : undefined
    const collectionDay = 2 + Math.floor(r() * 120)
    const layDay = collectionDay + 1 + Math.floor(r() * 3)
    const incubatesAt = state === 'in_incubation' || state === 'hatched' ? `Incubator ${1 + Math.floor(r() * 6)}` : undefined
    const hatched = state === 'hatched'
    const hatchedDay = hatched ? Math.max(0, collectionDay - 14 - Math.floor(r() * 14)) : undefined
    const isDiscard = state === 'discarded' || state === 'to_be_discarded'
    const clutchIdx = 1 + Math.floor(i / (2 + Math.floor(r() * 3)))

    eggs.push({
      eggCode: `AEID-${idNum}-${pad(1000 + i)}`,
      eggNumber: `UEID-${pad(100 + Math.floor(r() * 8999), 4)}`,
      state,
      condition: conditionFor(state, r()),
      collectionDate: isoDaysAgo(collectionDay),
      layDate: isoDaysAgo(layDay),
      hatchedDate: hatchedDay != null ? isoDaysAgo(hatchedDay) : undefined,
      weight: Math.round((4 + r() * 76) * 10) / 10,
      shellThickness: Math.round((0.2 + r() * 1) * 100) / 100,
      site: group.site || undefined,
      enclosure: group.enclosure !== 'Unknown Enclosure' ? group.enclosure : undefined,
      nursery: incubatesAt,
      clutchId: `CL-${idNum}-${pad(clutchIdx, 2)}`,
      probableMothers,
      motherKnownId,
      probableFathers,
      fatherKnownId,
      discardReason: isDiscard ? pick(DISCARD_REASONS, r()) : undefined,
      necropsy: isDiscard ? r() > 0.5 : undefined,
      daysSinceCollection: collectionDay,
      history: buildHistory(state, collectionDay, r)
    })
  }

  return eggs
}

export const getSpeciesEggs = async (id: number | string): Promise<SpeciesEggs> => {
  const empty: SpeciesEggs = {
    isEggLayer: false,
    eggs: [],
    summary: { total: 0, byState: { received: 0, in_nest: 0, in_incubation: 0, hatched: 0, to_be_discarded: 0, discarded: 0 } },
    sites: [],
    enclosures: [],
    conditions: []
  }

  const header = await getSpeciesDetailHeader(id)
  if (!header || !EGG_LAYING_CLASSES.has(String(header.class))) return empty

  const animalsBlock = await getSpeciesAnimals(id)
  const eggs = generate(String(id), animalsBlock?.animals || [])

  const byState = { received: 0, in_nest: 0, in_incubation: 0, hatched: 0, to_be_discarded: 0, discarded: 0 } as Record<
    EggState,
    number
  >
  const sites = new Set<string>()
  const enclosures = new Set<string>()
  const conditions = new Set<string>()
  for (const e of eggs) {
    byState[e.state]++
    if (e.site) sites.add(e.site)
    if (e.enclosure) enclosures.add(e.enclosure)
    if (e.condition) conditions.add(e.condition)
  }

  return {
    isEggLayer: true,
    eggs,
    summary: { total: eggs.length, byState },
    sites: Array.from(sites).sort(),
    enclosures: Array.from(enclosures).sort(),
    conditions: Array.from(conditions).sort()
  }
}
