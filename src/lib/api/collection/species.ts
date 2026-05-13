import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

const COLLECTION_SPECIES_LISTING = 'v2/collection/animalspecies/listing'
const COLLECTION_INSIGHTS = 'v2/collection/insights'
const SPECIES_WISE_DETAILS = 'species-wise-details'
const SPECIES_TAXONOMY_HIERARCHY = 'v2/get-texonomy-hierarchy-list-by-species'
const MORTALITY_SPECIES_WISE_LIST = 'mortality/species-wise-list'
const NECROPSY_SPECIES_WISE_LIST = 'v2/species-wise-necropsy-list'
const ANIMAL_LISTING = 'v1/animal/listing'

export interface SpeciesSexData {
  male: string
  female: string
  undetermined: string
  indeterminate: string
}

export interface SpeciesTaxonomy {
  class_name?: string
  order_name?: string
  family_name?: string
  genus_name?: string
}

export interface SpeciesLocationCounts {
  site_count?: number
  section_count?: number
  enclosure_count?: number
  organisation_count?: number
}

export interface CollectionSpeciesItem {
  tsn_id: string
  complete_name: string
  common_name: string
  default_icon: string
  animal_count: string
  sex_data: SpeciesSexData
  taxonomy?: SpeciesTaxonomy
  location_counts?: SpeciesLocationCounts
}

export interface CollectionSpeciesListResponse {
  success: boolean
  data: {
    list_type: string
    total_count: string
    classification_list: CollectionSpeciesItem[]
  }
  message: string
}

export interface GetCollectionSpeciesParams {
  list_type?: string
  page_no?: number
  q?: string
  site_ids?: string
  limit?: number
}

export async function getCollectionSpeciesList(
  params: GetCollectionSpeciesParams = {}
): Promise<CollectionSpeciesListResponse> {
  const body = {
    list_type: params.list_type || 'species',
    page_no: params.page_no || 1,
    q: params.q || '',
    site_ids: params.site_ids || '[]',
    ...(params.limit && { limit: params.limit })
  }

  const response = await axiosPost({ url: COLLECTION_SPECIES_LISTING, body: JSON.stringify(body) })

  return response.data
}

export interface CollectionInsightsResponse {
  success: boolean
  data: [
    [{ species_count: string; hybrid_count: string }],
    [{ population: string }],
    [{ total_accession: string }],
    [{ birth_count: string }],
    [{ mortality_count: string }]
  ]
  message: string
}

export interface CollectionInsightsValues {
  speciesCount: number
  hybridCount: number
  population: number
  totalAccession: number
  birthCount: number
  mortalityCount: number
}

export interface GetCollectionInsightsParams {
  start_date: string
  end_date: string
  site_ids?: string
}

export async function getCollectionInsights(params: GetCollectionInsightsParams): Promise<CollectionInsightsResponse> {
  const body = {
    start_date: params.start_date,
    end_date: params.end_date,
    site_ids: params.site_ids || '[]'
  }

  const response = await axiosPost({ url: COLLECTION_INSIGHTS, body: JSON.stringify(body) })

  return response.data
}

export interface SpeciesWiseDetailImage {
  id: string
  file: string
  ref_type: string
  ref_id: string
  file_name: string
  file_original_name: string
  file_mime_type: string
  file_type: string
  file_size: string
  display_type: string
}

export interface SpeciesWiseSiteItem {
  site_id: string
  site_name: string
  section_count: string
  enclosure_count: string
  animal_count: string
  species_count: string
  incharge_name?: string
  incharge_phone_number?: string
  incharge_mobile_no?: string
  site_incharge?: string
  sex_data?: SpeciesSexData | { male: number; female: number; undetermined: number; indeterminate: number }
  images?: SpeciesWiseDetailImage[]
}

export interface SpeciesWiseSectionItem {
  section_id: string
  section_name: string
  section_site_id?: string
  site_name?: string
  enclosure_count: string
  animal_count: string
  species_count: string
  incharge_name?: string
  incharge_phone_number?: string
  incharge_mobile_no?: string
  section_incharge?: string | null
  sex_data?: { male: number; female: number; undetermined: number; indeterminate: number }
  images?: SpeciesWiseDetailImage[]
}

export interface SpeciesWiseEnclosureItem {
  enclosure_id: string
  user_enclosure_name: string
  section_id?: string
  section_name?: string
  site_name?: string
  enclosure_wise_animal_count: string
  sub_enclosure_count: string
  enclosure_status?: string
  enclosure_environment?: string
  enclosure_parent_id?: string | null
  sex_data?: { male: number; female: number; undetermined: number; indeterminate: number }
  images?: SpeciesWiseDetailImage[]
}

export interface SpeciesWiseDetailsResponse<T = any> {
  data: {
    total_count: number
    result: T[]
  }
  message?: string
}

export type SpeciesWiseDetailsType = 'site' | 'section' | 'enclosure'

export interface GetSpeciesWiseDetailsParams {
  species_id: string | number
  type: SpeciesWiseDetailsType
  page_no?: number
  q?: string
}

export async function getSpeciesWiseDetails<T = any>(
  params: GetSpeciesWiseDetailsParams
): Promise<SpeciesWiseDetailsResponse<T>> {
  const query: Record<string, unknown> = {
    page_no: params.page_no || 1,
    species_id: params.species_id,
    type: params.type
  }
  if (params.q) query.q = params.q

  const response = await axiosGet({ url: SPECIES_WISE_DETAILS, params: query })

  return response.data
}

export interface SpeciesTaxonomyHierarchyItem {
  tsn: string
  rank_id: string
  rank_name: string
  complete_name: string
  common_name: string | null
  species: string
}

export interface SpeciesTaxonomyHierarchyResponse {
  success: boolean
  message: string
  data: SpeciesTaxonomyHierarchyItem[]
}

export async function getSpeciesTaxonomyHierarchy(params: {
  species_id: string | number
}): Promise<SpeciesTaxonomyHierarchyResponse> {
  const response = await axiosGet({ url: SPECIES_TAXONOMY_HIERARCHY, params })

  return response.data
}

export interface MortalitySpeciesItem {
  animal_id: string
  specie_id: string
  scientific_name: string
  common_name: string
  default_icon: string
  sex: string
  type: string
  total_animal: string
  discovered_date: string
  status: string
  user_enclosure_name: string
  site_id: string
  site_name: string
  section_name: string
  breed_id: string | null
  breed_name: string | null
  morph_id: string | null
  morph_name: string | null
  local_identifier_value: string | null
  local_identifier_name: string | null
  reason_name: string | null
  mortality_id: string
  parent_mortality_id: string | null
  mortality_status: string
  reported_by_id: string
  reported_by: string
  reported_date_time: string
  necropsy_performed: boolean
  organization_id: string | null
  organization_name: string | null
  created_by: string | null
}

export interface MortalitySpeciesListResponse {
  total_count: string
  result: MortalitySpeciesItem[]
}

export interface GetMortalitySpeciesListParams {
  taxonomy_id: string | number
  page_no?: number
  status?: string
  order?: 'ASC' | 'DESC'
  purpose?: string
  q?: string
}

export async function getMortalitySpeciesList(
  params: GetMortalitySpeciesListParams
): Promise<MortalitySpeciesListResponse> {
  const query: Record<string, unknown> = {
    purpose: params.purpose || 'animals',
    taxonomy_id: params.taxonomy_id,
    page_no: params.page_no || 1,
    status: params.status || 'APPROVED',
    order: params.order || 'DESC'
  }
  if (params.q) query.q = params.q

  const response = await axiosGet({ url: MORTALITY_SPECIES_WISE_LIST, params: query })

  return response.data
}

export interface NecropsySpeciesItem {
  animal_id: string
  scientific_name: string
  common_name: string
  default_icon: string
  sex: string
  type: string
  total_animal: string
  breed_id: string | null
  breed_name: string | null
  morph_id: string | null
  morph_name: string | null
  local_identifier_value: string | null
  local_identifier_name: string | null
  mortality_id: string
  mortality_created_at: string
  discovered_date: string
  necropsy_id: string | null
  necropsy_location: string | null
  request_id: string | null
  site_id: string
  site_name: string
  organization_id: string
  organization_name: string
  user_enclosure_name: string
  section_id: string
  section_name: string
  cause: string
  necropsy_date: string | null
  necropsy_on_site: string
  is_unsuitable: string
  necropsy_time: string | null
  reported_by: string
  priority: string
  carcass_disposition_id: string
  carcass_disposition_name: string | null
  user_profile_for_necropsy?: {
    id: string | null
    name: string | null
    email: string | null
    user_name: string | null
    user_profile_pic: string | null
  }
}

export interface NecropsySpeciesListResponse {
  total_count: string
  result: NecropsySpeciesItem[]
}

export interface GetNecropsySpeciesListParams {
  taxonomy_id: string | number
  page_no?: number
  status?: string
  q?: string
  use_case?: string
}

export async function getNecropsySpeciesList(
  params: GetNecropsySpeciesListParams
): Promise<NecropsySpeciesListResponse> {
  const query: Record<string, unknown> = {
    taxonomy_id: params.taxonomy_id,
    page_no: params.page_no || 1,
    status: params.status || 'PENDING',
    use_case: params.use_case || 'species_details'
  }
  if (params.q) query.q = params.q

  const response = await axiosGet({ url: NECROPSY_SPECIES_WISE_LIST, params: query })

  return response.data?.data || response.data
}

export interface AnimalListingItem {
  animal_id: string
  common_name: string
  scientific_name: string
  default_icon: string
  sex: string
  type: string
  local_identifier_name: string | null
  local_identifier_value: string | null
  age: string | null
  site_name: string | null
  user_enclosure_name: string | null
  section_name: string | null
}

export interface AnimalListingResponse {
  data: AnimalListingItem[]
  total_count: number
}

export interface GetAnimalListingParams {
  taxonomy_id: string | number
  site_id?: string | number
  section_id?: string | number
  enclosure_id?: string | number
  page_no?: number
  q?: string
}

export async function getAnimalListing(
  params: GetAnimalListingParams
): Promise<AnimalListingResponse> {
  const query: Record<string, unknown> = {
    taxonomy_id: params.taxonomy_id,
    page_no: params.page_no || 1,
    q: params.q || ''
  }
  if (params.site_id) query.site_id = params.site_id
  if (params.section_id) query.section_id = params.section_id
  if (params.enclosure_id) query.enclosure_id = params.enclosure_id

  const response = await axiosGet({ url: ANIMAL_LISTING, params: query })

  return response.data
}

export function mapInsightsResponse(res?: CollectionInsightsResponse | null): CollectionInsightsValues {
  const d = res?.data
  const num = (v?: string) => Number(v) || 0

  return {
    speciesCount: num(d?.[0]?.[0]?.species_count),
    hybridCount: num(d?.[0]?.[0]?.hybrid_count),
    population: num(d?.[1]?.[0]?.population),
    totalAccession: num(d?.[2]?.[0]?.total_accession),
    birthCount: num(d?.[3]?.[0]?.birth_count),
    mortalityCount: num(d?.[4]?.[0]?.mortality_count)
  }
}
