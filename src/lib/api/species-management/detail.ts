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
  SpeciesBreeds
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
