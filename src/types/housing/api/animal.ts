/**
 * Animal API types
 * Used by: animals/[id]
 */

import type {
  Animal,
  AnimalOverview,
  AnimalIdentifier,
  AnimalIncident,
  AnimalDiet,
  AnimalHistoryItem,
  AnimalJournalLog,
  Media,
  Mortality,
  MannerOfDeathOption,
  CarcassConditionOption,
  CarcassDispositionOption
} from '../models'
import type { ApiResponse, PaginatedData, PaginationParams } from './common'

// ==================== Animal API ====================

export interface GetAnimalsParams extends PaginationParams {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  species_tsn?: string
  sex_type?: string
  is_alive?: boolean
}

export interface GetAnimalsResponse extends ApiResponse<PaginatedData<Animal>> {}

export interface GetAnimalDetailsOverviewParams {
  animal_id: number
}

export interface GetAnimalDetailsOverviewResponse extends ApiResponse<AnimalOverview> {}

export interface GetAnimalHistoryParams {
  animal_id: number
  page_no?: number
  limit?: number
  from_date?: string
  to_date?: string
}

export interface GetAnimalHistoryResponse extends ApiResponse<{
  result: AnimalHistoryItem[]
  total_count?: number
}> {}

export interface GetAnimalMediaParams {
  animal_id: number
  page_no?: number
  limit?: number
  type?: string
  q?: string
}

export interface GetAnimalMediaResponse extends ApiResponse<{
  result: Media[]
  total_count?: number
}> {}

// ==================== Animal Media Upload ====================

export interface AddAnimalMediaPayload {
  animal_id: number | string
  acess_restricted_key?: number
  media_attachment: File[]
}

export interface AddAnimalMediaResponse {
  success?: boolean
  message?: string
  data?: unknown
}

// ==================== Animal Identifier ====================

export interface GetAnimalIdentifierParams {
  animal_id: number | string
}

export interface GetAnimalIdentifierResponse extends ApiResponse<AnimalIdentifier[]> {}

export interface AddAnimalIdentifierPayload {
  animal_id: number | string
  local_identifier_type_id?: number
  local_identifier_value?: string
  type?: string | number
  value?: string
  is_primary?: boolean | number
  identifier_attachment?: (string | File)[]
}

export interface AddAnimalIdentifierResponse extends ApiResponse<{ identifier_id: number }> {}

export interface EditAnimalIdentifierPayload extends AddAnimalIdentifierPayload {
  identifier_id: number | string
}

export interface EditAnimalIdentifierResponse extends ApiResponse<{ success: boolean }> {}

export interface DeleteAnimalIdentifierParams {
  identifier_id?: number | string
  type: 'delete' | 'restore' | string
}

export interface DeleteAnimalIdentifierResponse extends ApiResponse<{ success: boolean }> {}

// ==================== Animal Incident ====================

export interface GetAnimalIncidentListParams {
  animal_id: number | string
}

export interface GetAnimalIncidentListResponse extends ApiResponse<{
  result: AnimalIncident[]
  total_count?: number
}> {}

export interface GetAnimalIncidentDetailsParams {
  incident_id: number | string
}

export interface GetAnimalIncidentDetailsResponse extends ApiResponse<AnimalIncident> {}

export interface CreateAnimalIncidentPayload {
  animal_id: number | string
  incident_type_id: number
  incident_date: string
  incident_time?: string
  description?: string
  notes?: string
  location?: string
  images?: File[]
  attachments?: File[]
}

export interface CreateAnimalIncidentResponse extends ApiResponse<{ incident_id: number }> {}

export interface UpdateAnimalIncidentPayload extends Partial<CreateAnimalIncidentPayload> {
  incident_id: number
  status?: string
  resolved_by?: number
  resolved_date?: string
}

export interface UpdateAnimalIncidentResponse extends ApiResponse<{ success: boolean }> {}

// ==================== Animal Mortality ====================

export interface GetAnimalMortalityParams {
  entity_id: number | string
  type: 'animal' | 'site' | 'section'
}

export interface GetAnimalMortalityResponse extends ApiResponse<Mortality[]> {}

export interface EditAnimalMortalityPayload {
  mortality_id?: number | string
  entity_id?: number | string
  entity_type?: string
  reason_for_death?: string
  discovered_date?: string | unknown
  discovered_time?: string | unknown
  is_estimate?: number | boolean
  manner_of_death?: string | number
  manner_of_death_id?: number
  carcass_condition?: string | number
  carcass_condition_id?: number
  carcass_disposition?: string | number
  carcass_disposition_id?: number
  notes?: string
  submitted_for_necropsy?: boolean | string | number
  total_animal?: number
  necropsy_reason?: string
  priority?: string
}

export interface EditAnimalMortalityResponse extends ApiResponse<{ success: boolean }> {}

export interface RevokeAnimalMortalityPayload {
  mortality_id: number | string
  reason?: string
}

export interface RevokeAnimalMortalityResponse extends ApiResponse<{ success: boolean }> {}

export interface GetMannerOfDeathResponse extends ApiResponse<MannerOfDeathOption[]> {}

export interface GetCarcassConditionResponse extends ApiResponse<CarcassConditionOption[]> {}

export interface GetCarcassDispositionResponse extends ApiResponse<CarcassDispositionOption[]> {}

// ==================== Animal Diet ====================

export interface GetAnimalDietListParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetAnimalDietListResponse extends ApiResponse<{
  result?: AnimalDiet[]
  total_count?: number
  active_attachments?: AnimalDiet[]
  deactive_attachments?: AnimalDiet[]
  active_attachments_count?: number
  deactive_attachments_count?: number
}> {}

// ==================== Animal Journal ====================

export interface GetAnimalJournalLogsParams {
  animal_id?: number | null
  page?: number
  limit?: number | string
  start_date?: string
  end_date?: string
  user_ids?: string
  module?: string
}

export interface GetAnimalJournalLogsResponse extends ApiResponse<{
  data: AnimalJournalLog[]
  result?: AnimalJournalLog[]
  total_count?: number
}> {}

export interface GetAnimalJournalModulesParams {
  animal_id: number | string
}

export interface JournalModule {
  id: number | null
  module: string
  name?: string
}

export interface GetAnimalJournalModulesResponse extends ApiResponse<JournalModule[]> {}

// ==================== Taxonomy Hierarchy ====================

export interface TaxonomyLevel {
  name?: string
  default_common_name?: string
}

export interface TaxonomyHierarchyData {
  class?: TaxonomyLevel
  order?: TaxonomyLevel
  famely?: TaxonomyLevel
  genus?: TaxonomyLevel
  complete_name?: string
  species_common_name?: string
}

export interface GetTaxonomyHierarchyParams {
  species_id: string | number
}

export interface GetTaxonomyHierarchyResponse {
  success?: boolean
  message?: string
  data?: TaxonomyHierarchyData
}

// ==================== Vaccination/Deworming ====================

export interface GetVaccinationListParams {
  animal_id: number | string
  type: 'vaccination' | 'deworming'
  status?: 'pending' | 'upcoming' | 'completed'
  page_no?: number
  length?: number
}

export interface VaccinationRecord {
  id?: number
  vaccine_name?: string
  medicine_name?: string
  name?: string
  dose?: string
  status?: string
  scheduled_date?: string
  administered_date?: string
  created_at?: string
  [key: string]: unknown
}

export interface GetVaccinationListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: VaccinationRecord[]
    stats?: {
      pending?: number
      upcoming?: number
      completed?: number
    }
    total_count?: number
  } | VaccinationRecord[]
  total_count?: number
}

// ==================== Medicine Side Effect ====================

export interface GetMedicineSideEffectParams {
  animal_id: number | string
  page_no?: number
}

export interface MedicineSideEffect {
  id?: number
  medicine_name?: string
  name?: string
  side_effect?: string
  reason?: string
  [key: string]: unknown
}

export interface GetMedicineSideEffectResponse {
  success?: boolean
  message?: string
  data?: {
    result?: MedicineSideEffect[]
    total_count?: number
  } | MedicineSideEffect[]
}

export interface DeleteMedicineSideEffectParams {
  side_effect_id: number | string
}

export interface DeleteMedicineSideEffectResponse {
  success?: boolean
  message?: string
}
