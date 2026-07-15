import type {
  SpeciesDetailHeader,
  SpeciesProfile,
  SpeciesHousing,
  AnimalRecord,
  SpeciesBirths,
  SpeciesDeaths,
  SpeciesAssessments,
  SpeciesMedication,
  SpeciesConditions,
  SpeciesIdentification,
  SpeciesBreeds,
  SpeciesLifecycle
} from 'src/types/species-management/detail'

/**
 * Species Management — detail data layer.
 *
 * FRONTEND-ONLY: each species' full detail (all tabs) is a static JSON file extracted from the
 * user's SQL dump at `public/species-data/detail/<id>.json`. No DB / no backend. The whole file
 * is fetched once per species and cached; each getter returns its slice.
 */
const detailCache = new Map<string, Promise<any>>()

function loadDetail(id: number | string): Promise<any> {
  const k = String(id)
  if (!detailCache.has(k)) {
    detailCache.set(
      k,
      fetch(`/species-data/detail/${k}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  }

  return detailCache.get(k) as Promise<any>
}

export const getSpeciesDetailHeader = async (id: number | string): Promise<SpeciesDetailHeader> =>
  (await loadDetail(id))?.header

export const getSpeciesProfile = async (id: number | string): Promise<SpeciesProfile> =>
  (await loadDetail(id))?.profile

export const getSpeciesHousing = async (id: number | string): Promise<SpeciesHousing> =>
  (await loadDetail(id))?.housing

export const getSpeciesAnimals = async (id: number | string): Promise<{ animals: AnimalRecord[]; totalAnimals: number }> =>
  (await loadDetail(id))?.animals

export const getSpeciesBirths = async (id: number | string): Promise<SpeciesBirths> =>
  (await loadDetail(id))?.births

export const getSpeciesDeaths = async (id: number | string): Promise<SpeciesDeaths> =>
  (await loadDetail(id))?.deaths

export const getSpeciesAssessments = async (id: number | string): Promise<SpeciesAssessments> =>
  (await loadDetail(id))?.assessments

export const getSpeciesVaccination = async (id: number | string): Promise<SpeciesMedication> =>
  (await loadDetail(id))?.vaccination

export const getSpeciesDeworming = async (id: number | string): Promise<SpeciesMedication> =>
  (await loadDetail(id))?.deworming

export const getSpeciesComplaints = async (id: number | string): Promise<SpeciesConditions> =>
  (await loadDetail(id))?.complaints

export const getSpeciesDiagnosis = async (id: number | string): Promise<SpeciesConditions> =>
  (await loadDetail(id))?.diagnosis

export const getSpeciesIdentification = async (id: number | string): Promise<SpeciesIdentification> =>
  (await loadDetail(id))?.identification

export const getSpeciesBreeds = async (id: number | string): Promise<SpeciesBreeds> =>
  (await loadDetail(id))?.breeds

// --- Medical extras (lab/surgery/anaesthesia/pharmacy) — extracted from the dump's unused tables ---
export interface SpeciesLab {
  sample?: boolean
  tests: { test: string; animals: number; count: number; min?: number; avg?: number; max?: number; unit?: string }[]
}
export interface SpeciesSurgery {
  sample?: boolean
  total: number
  procedures: { name: string; count: number; animals: number }[]
  recent?: { date: string; animal: string; site?: string; procedure?: string }[]
}
export interface SpeciesAnaesthesia {
  sample?: boolean
  total: number
  agents: { name: string; count: number }[]
  recent?: { date: string; animal: string; agent?: string; site?: string }[]
}
export interface SpeciesPharmacy {
  total: number
  medicines: { name: string; count: number; animals: number; route?: string }[]
}

export const getSpeciesLab = async (id: number | string): Promise<SpeciesLab | undefined> =>
  (await loadDetail(id))?.lab

export const getSpeciesSurgery = async (id: number | string): Promise<SpeciesSurgery | undefined> =>
  (await loadDetail(id))?.surgery

export const getSpeciesAnaesthesia = async (id: number | string): Promise<SpeciesAnaesthesia | undefined> =>
  (await loadDetail(id))?.anaesthesia

export const getSpeciesPharmacy = async (id: number | string): Promise<SpeciesPharmacy | undefined> =>
  (await loadDetail(id))?.pharmacy

// --- Lifecycle events (day-level births/deaths) — separate sidecar, fetched lazily by Circle of Life ---
const lifecycleCache = new Map<string, Promise<SpeciesLifecycle | null>>()

export const getSpeciesLifecycle = (id: number | string): Promise<SpeciesLifecycle | null> => {
  const k = String(id)
  if (!lifecycleCache.has(k)) {
    lifecycleCache.set(
      k,
      fetch(`/species-data/lifecycle/${k}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  }

  return lifecycleCache.get(k) as Promise<SpeciesLifecycle | null>
}

// --- Preventive care (Vaccination / Deworming / Supplements) — dummy data, separate lazy sidecar ---
export interface PreventiveRecord {
  aid: string
  name: string
  site: string
  enclosure: string
  gender?: string
  age?: string
  weight?: string
  type: string
  lastGiven: string
  due: string
  status: 'overdue' | 'upcoming'
  days: number
}
export interface PreventiveSite {
  site: string
  animals: number
  enclosures: number
  coveragePct: number
  overdue: number
  aging: { d0_30: number; d30_90: number; d90plus: number }
  topGap: { name: string; count: number } | null
  trendPct: number
  spark: number[]
}
// Vaccine-wise breakdown (the vaccine-wise rethink): one entry per medicine.
export type PreventiveTypeStatus = 'covered' | 'due' | 'overdue' | 'never'
export interface PreventiveTypeAnimal {
  aid: string
  name: string
  site: string
  status: PreventiveTypeStatus
  lastGiven?: string
  nextDue?: string
  days?: number
  doses: string[] // dose dates, newest first
}
export interface PreventiveTypeSite {
  site: string
  animals: number
  coveragePct: number
  overdue: number
}
export interface PreventiveType {
  name: string
  schedule: string
  intervalDays: number
  coveragePct: number
  covered: number
  due: number
  overdue: number
  never: number
  tracked: number
  sitesAffected: number
  sitesTotal: number
  sites: PreventiveTypeSite[]
  coverageTrend: number[] // aligned to SpeciesPreventive.months
  dosesPerMonth: number[] // aligned to SpeciesPreventive.months
  animals: PreventiveTypeAnimal[] // capped sample; tab counts come from the aggregate fields
}
export interface PreventiveProgram {
  kind: 'schedule' | 'ongoing'
  summary: { coveragePct: number; coverageTrendPct: number; overdue: number; dueIn30: number; never: number; animalsTracked: number }
  topOverdue: { name: string; count: number }[]
  aging: { d0_30: number; d30_90: number; d90plus: number }
  bySite: { site: string; count: number }[]
  sites?: PreventiveSite[]
  types?: PreventiveType[]
  records: PreventiveRecord[]
}
export interface SpeciesPreventive {
  tsnId: number
  animalCount: number
  /** Month labels ("Jan '26") shared by every type's coverageTrend / dosesPerMonth. */
  months?: string[]
  programs: { vaccination?: PreventiveProgram; deworming?: PreventiveProgram; supplements?: PreventiveProgram }
}

const preventiveCache = new Map<string, Promise<SpeciesPreventive | null>>()

// The sidecar stores per-type animal rows COMPACT ({a,s,st,lg,dy,dn}, site as index) to keep
// 2350 files small. Decode once at fetch into the friendly PreventiveTypeAnimal shape — a real
// API can later return the friendly shape directly and this decoder just disappears.
const STATUS_BY_CODE: Record<string, PreventiveTypeStatus> = { c: 'covered', d: 'due', o: 'overdue', n: 'never' }
const DAY_MS = 86400000
const decodePreventive = (raw: any): SpeciesPreventive | null => {
  if (!raw) return null
  const short = raw.short || 'Animal'
  for (const key of ['vaccination', 'deworming', 'supplements']) {
    const prog = raw.programs?.[key]
    if (!prog?.types) continue
    for (const t of prog.types) {
      t.animals = (t.animals || []).map((r: any) => {
        const status = STATUS_BY_CODE[r.st] || 'never'
        const out: PreventiveTypeAnimal = { aid: r.a, name: `${short} #${r.a}`, site: t.sites[r.s]?.site ?? '—', status, doses: [] }
        if (r.lg) {
          out.lastGiven = r.lg
          const lg = new Date(r.lg).getTime()
          out.nextDue = new Date(lg + t.intervalDays * DAY_MS).toISOString().slice(0, 10)
          for (let k = 0; k < (r.dn || 1); k++) out.doses.push(new Date(lg - k * t.intervalDays * DAY_MS).toISOString().slice(0, 10))
        }
        if (r.dy != null) out.days = r.dy
        return out
      })
    }
  }

  return raw as SpeciesPreventive
}

export const getSpeciesPreventive = (id: number | string): Promise<SpeciesPreventive | null> => {
  const k = String(id)
  if (!preventiveCache.has(k)) {
    preventiveCache.set(
      k,
      fetch(`/species-data/preventive/${k}.json`)
        .then(r => (r.ok ? r.json() : null))
        .then(decodePreventive)
        .catch(() => null)
    )
  }

  return preventiveCache.get(k) as Promise<SpeciesPreventive | null>
}

// --- Clinical (Symptoms / Diagnosis) — dummy data, separate lazy sidecar ---
export interface ClinicalRecord {
  aid: string
  name: string
  site: string
  enclosure: string
  type: string
  category?: string
  date: string
  durationDays: number
  status: 'active' | 'resolved'
  prognosis?: 'Favourable' | 'Guarded' | 'Doubtful' | 'Poor' | 'Grave'
  severity?: 'Low' | 'Medium' | 'High'
}
export interface ClinicalProgram {
  kind: 'type'
  summary: { types: number; active: number; resolved: number; animalsAffected: number; avgResolutionDays?: number }
  topTypes: { name: string; count: number; animals?: number; category?: string }[]
  statusMix: { active: number; resolved: number }
  prognosisMix?: { name: string; count: number }[]
  trend: { label: string; value: number }[]
  records: ClinicalRecord[]
}
export interface SpeciesClinical {
  tsnId: number
  animalCount: number
  programs: { symptoms?: ClinicalProgram; diagnosis?: ClinicalProgram }
}

const clinicalCache = new Map<string, Promise<SpeciesClinical | null>>()

export const getSpeciesClinical = (id: number | string): Promise<SpeciesClinical | null> => {
  const k = String(id)
  if (!clinicalCache.has(k)) {
    clinicalCache.set(
      k,
      fetch(`/species-data/clinical/${k}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  }

  return clinicalCache.get(k) as Promise<SpeciesClinical | null>
}
