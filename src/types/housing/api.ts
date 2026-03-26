/**
 * API request/response types for the Housing module
 */

import {
  Site,
  SiteAnalytics,
  Section,
  SectionAnalytics,
  Enclosure,
  EnclosureType,
  EnclosureSetting,
  EnclosureStats,
  Animal,
  AnimalOverview,
  Species,
  Cluster,
  ClusterAnalytics,
  Note,
  NoteComment,
  ObservationType,
  ObservationMasterItem,
  Mortality,
  Treatment,
  Media,
  AnimalIdentifier,
  AnimalIncident,
  AnimalDiet,
  AnimalHistoryItem,
  AnimalJournalLog,
  MannerOfDeathOption,
  CarcassConditionOption,
  CarcassDispositionOption,
  User
} from './models'

// ==================== Generic API Types ====================

export interface ApiResponse<T> {
  success?: boolean
  is_success?: boolean
  status?: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  result: T[]
  total_count: number
  page?: number
  limit?: number
}

export interface PaginatedListingData<T> {
  listing: T[]
  total_count?: number
  total_scies_count?: number
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginatedListingResponse<T> extends ApiResponse<PaginatedListingData<T>> {}

export interface ApiError {
  success: false
  message: string
  error?: string
  code?: string | number
}

// ==================== Common Params ====================

export interface PaginationParams {
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// ==================== Site API ====================

export interface GetSitesParams extends PaginationParams {
  zoo_id?: number
  cluster_id?: number
  is_active?: boolean
}

export interface GetSitesResponse extends ApiResponse<PaginatedData<Site>> {}

export interface GetSiteAnalyticsResponse extends ApiResponse<SiteAnalytics> {}

export interface GetSiteDetailsParams {
  site_id: number
}

export interface GetSiteDetailsResponse extends ApiResponse<SiteAnalytics> {}

export interface AddSitePayload {
  site_name: string
  site_code?: string
  address?: string
  description?: string
  latitude?: number
  longitude?: number
  incharge_id?: number
  zoo_id?: number
  images?: File[]
}

export interface AddSiteResponse extends ApiResponse<{ site_id: number }> {}

// ==================== Section API ====================

export interface GetSectionsParams extends PaginationParams {
  site_id?: number
  is_active?: boolean
}

export interface GetSectionsResponse extends ApiResponse<PaginatedData<Section>> {}

export interface GetSectionAnalyticsPayload {
  section_id: number
  zoo_id?: number
}

export interface GetSectionAnalyticsResponse extends ApiResponse<SectionAnalytics> {}

export interface AddSectionPayload {
  section_name: string
  section_code?: string
  site_id?: number | string
  description?: string
  incharge_id?: number
  images?: File[]
  section_image?: File[]
  section_latitude?: string | number
  section_longitude?: string | number
  zoo_id?: number | string
}

export interface AddSectionResponse extends ApiResponse<{ section_id: number }> {}

// ==================== Enclosure API ====================

export interface GetEnclosuresParams extends PaginationParams {
  site_id?: number
  section_id?: number
  parent_enclosure_id?: number | null
  is_active?: boolean
}

export interface GetEnclosuresResponse extends ApiResponse<PaginatedData<Enclosure>> {}

export interface GetEnclosureListSectionWiseParams extends PaginationParams {
  section_id?: number
  enclosure_id?: string | number
  include_sub_enclosure?: number
}

export interface GetEnclosureListSectionWiseResponse extends ApiResponse<PaginatedData<Enclosure>> {}

export interface GetEnclosureWiseStatsParams {
  enclosure_id: number
}

export interface GetEnclosureWiseStatsResponse extends ApiResponse<EnclosureStats> {}

export interface GetEnclosureWiseSpeciesParams extends PaginationParams {
  enclosure_id?: number
  include_sub_enclosure?: number
}

export interface GetEnclosureWiseSpeciesResponse extends ApiResponse<PaginatedListingData<Species>> {}

export interface GetEnclosureSettingsParams {
  enclosure_id?: number
  section_id?: number
}

export interface GetEnclosureSettingsResponse extends ApiResponse<EnclosureSetting[]> {}

export interface GetSectionsForEnclosurePayload {
  site_id?: number
  zoo_id?: number | string
  ignore_sys_gen?: number
}

export interface GetSectionsForEnclosureResponse extends ApiResponse<Section[]> {}

export interface GetParentEnclosureListPayload {
  section_id: number | string
  ignore_sys_gen?: number
}

export interface GetParentEnclosureListResponse extends ApiResponse<Enclosure[]> {}

export interface AddEnclosurePayload {
  enclosure_name?: string
  user_enclosure_name?: string
  enclosure_code?: string
  section_id?: number | string | null
  site_id?: number
  parent_enclosure_id?: number | null
  enclosure_parent_id?: string | number
  enclosure_type_id?: number
  enclosure_type?: string | number
  description?: string
  enclosure_desc?: string
  capacity?: number
  area?: number
  area_unit?: string
  incharge_id?: number
  images?: File[]
  enclosure_image?: File[]
  zoo_id?: number | string
  enclosure_environment?: string
  enclosure_is_movable?: number
  enclosure_is_walkable?: number
  enclosure_sunlight?: string
  batch_seq?: string | number
  batch_count?: string | number
  commistioned_date?: string
  user_enclosure_id?: number | string
}

export interface AddEnclosureResponse extends ApiResponse<{ enclosure_id: number }> {}

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

export interface AnimalDetailsOverviewData {
  animal_details: AnimalOverview
  enclosure_details?: {
    user_enclosure_name?: string
    enclosure_id?: string
    enclosure_type?: string
    enclosure_type_name?: string
    section_name?: string
    section_id?: string
    site_name?: string
    site_id?: string
  }
  animal_identifier?: any[]
  body_weight?: any[]
  diagnosis?: any[]
  prescription?: any[]
  observation?: any[]
  diagnosis_count?: number
  prescription_count?: number
  observation_count?: number
}

export interface GetAnimalDetailsOverviewResponse extends ApiResponse<AnimalDetailsOverviewData> {}

export interface GetAnimalHistoryParams {
  animal_id: number
  page_no?: number
  limit?: number
  from_date?: string
  to_date?: string
}

export interface GetAnimalHistoryResponse
  extends ApiResponse<{
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

export interface GetAnimalMediaResponse
  extends ApiResponse<{
    result: Media[]
    total_count?: number
  }> {}

// ==================== Animal Identifier API ====================

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

// ==================== Animal Incident API ====================

export interface GetAnimalIncidentListParams {
  animal_id: number | string
}

export interface GetAnimalIncidentListResponse
  extends ApiResponse<{
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

// ==================== Animal Mortality API ====================

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

// ==================== Animal Diet API ====================

export interface GetAnimalDietListParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetAnimalDietListResponse
  extends ApiResponse<{
    result?: AnimalDiet[]
    total_count?: number
    active_attachments?: AnimalDiet[]
    deactive_attachments?: AnimalDiet[]
    active_attachments_count?: number
    deactive_attachments_count?: number
  }> {}

// ==================== Animal Journal API ====================

export interface GetAnimalJournalLogsParams {
  animal_id?: number | null
  page?: number
  limit?: number | string
  start_date?: string
  end_date?: string
  user_ids?: string // JSON stringified array of user IDs
  module?: string // Module name filter (e.g., 'medical_record', 'lineage')
}

export interface GetAnimalJournalLogsResponse
  extends ApiResponse<{
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

// ==================== Species API ====================

export interface GetSpeciesParams extends PaginationParams {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  cluster_id?: number
  search?: string
}

export interface GetSpeciesResponse extends ApiResponse<PaginatedListingData<Species>> {}

// ==================== Mortality List API ====================

export interface GetMortalityListParams extends PaginationParams {
  site_id?: number
  section_id?: number
  from_date?: string
  to_date?: string
  status?: string
  type?: 'animals' | string
  start_date?: string
  end_date?: string
}

export interface GetMortalityListResponse extends ApiResponse<PaginatedData<Mortality>> {}

// ==================== Treatment API ====================

export interface GetAnimalTreatmentListParams extends PaginationParams {
  site_id?: number
  section_id?: number
  from_date?: string
  to_date?: string
}

export interface GetAnimalTreatmentListResponse extends ApiResponse<PaginatedData<Treatment>> {}

export interface GetSectionAnimalTreatmentListParams extends GetAnimalTreatmentListParams {
  section_id: number
}

// ==================== Media API ====================

export interface GetMediaParams extends PaginationParams {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  animal_id?: number
  type?: string
  ref_id?: string | number
  ref_type?: string
  filter_type?: string
}

export interface GetMediaResponse extends ApiResponse<PaginatedData<Media>> {}

// ==================== Cluster API ====================

export interface GetClusterListParams extends PaginationParams {
  zoo_id?: number
  is_active?: boolean
}

export interface GetClusterListResponse extends ApiResponse<PaginatedData<Cluster>> {}

export interface GetClusterAnalyticsParams {
  cluster_id: number
}

export interface GetClusterAnalyticsResponse extends ApiResponse<ClusterAnalytics> {}

export interface GetSiteListClusterWiseParams extends PaginationParams {
  cluster_id: number
}

export interface GetSiteListClusterWiseResponse extends ApiResponse<PaginatedData<Site>> {}

export interface AddClusterPayload {
  cluster_name: string
  cluster_code?: string
  description?: string
  site_ids?: number[]
  incharge_ids?: number[]
  zoo_id?: number
  images?: File[]
}

export interface AddClusterResponse extends ApiResponse<{ cluster_id: number }> {}

// ==================== Notes / Observation API ====================

export interface GetNotesParams extends PaginationParams {
  id: number | string
  type: 'site' | 'section' | 'enclosure' | 'animal'
  note_type?: number | string
  priority?: string
  created_by?: number | string
  tagged_to?: number | string
}

export interface GetNotesResponse extends ApiResponse<PaginatedData<Note>> {}

export interface GetObservationTypesResponse extends ApiResponse<ObservationType[]> {}

export interface GetObservationMasterListParams {
  parent_id?: number
}

export interface GetObservationMasterListResponse extends ApiResponse<ObservationMasterItem[]> {}

export interface GetObservationDetailsParams {
  observation_id: number
}

export interface GetObservationDetailsResponse extends ApiResponse<Note> {}

export interface CreateObservationPayload {
  ref_type: 'site' | 'section' | 'enclosure' | 'animal'
  ref_id: number | string
  note_type_id: number
  priority?: string
  title?: string
  description?: string
  notes?: string
  tagged_user_ids?: number[]
  images?: File[]
  attachments?: File[]
}

export interface CreateObservationResponse extends ApiResponse<{ observation_id: number }> {}

export interface DeleteObservationParams {
  observation_id: number
  reason?: string
}

export interface DeleteObservationResponse extends ApiResponse<{ success: boolean }> {}

export interface AddNoteReactionPayload {
  notes_id: number
}

export interface AddNoteReactionResponse extends ApiResponse<{ success: boolean }> {}

export interface RemoveNoteReactionPayload {
  notes_id: number
}

export interface RemoveNoteReactionResponse extends ApiResponse<{ success: boolean }> {}

export interface AddObservationCommentPayload {
  observation_id: number
  notes: string
}

export interface AddObservationCommentResponse extends ApiResponse<{ comment_id: number }> {}

// ==================== User API ====================

export interface GetUsersListParams {
  zoo_id?: number
  site_id?: string | number
  q?: string
  role?: string
  user_type?: string
}

export interface GetUsersListResponse extends ApiResponse<User[]> {}

// ==================== Users with Access API (get-userswith-access) ====================

export interface UserWithAccessItem {
  user_id: string | number
  user_name?: string
  full_name?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  profile_pic?: string
  mobile_number?: string
  user_mobile_number?: string
  role_name?: string
  can_perform_action?: number | boolean
  account_status?: string
  string_id?: string
}

export interface GetUsersWithAccessParams {
  id: string | string[] | undefined
  type: 'site' | 'section' | 'enclosure' | 'animal'
  page_no?: number
  search?: string
  limit?: number
}

export interface GetUsersWithAccessResponse {
  success?: boolean
  message?: string
  data?: {
    result?: UserWithAccessItem[]
    total_count?: number
  }
}

// ==================== Lineage / Family Tree API ====================

export interface GetLineageParentParams {
  animal_id: number | string
  // Optional params for paginated list (matching mobile implementation)
  is_mother?: '0' | '1'
  type?: 'internal' | 'external'
  page_no?: number
  limit?: number
  q?: string
}

export interface GetLineageParentResponse {
  success?: boolean
  message?: string
  data?: {
    animal_id?: number
    mother?: import('./models').LineageAnimal | import('./models').LineageAnimal[]
    father?: import('./models').LineageAnimal | import('./models').LineageAnimal[]
    external_mother?: import('./models').ExternalAnimal | import('./models').ExternalAnimal[]
    external_father?: import('./models').ExternalAnimal | import('./models').ExternalAnimal[]
    mother_count?: number
    father_count?: number
    external_mother_count?: number
    external_father_count?: number
    // For paginated list response
    result?: import('./models').LineageAnimal[]
    total_count?: number
  }
}

export interface GetLineagePairParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetLineagePairResponse {
  success?: boolean
  message?: string
  data?: import('./models').LineagePair[]
  total_count?: number
}

export interface GetLineageSiblingParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetLineageSiblingResponse {
  success?: boolean
  message?: string
  data?: {
    result?: import('./models').LineageSibling[]
    total_count?: number
  }
}

// ==================== Lineage CRUD API Types ====================

export interface AddLineageParentResponse {
  success?: boolean
  message?: string
  data?: {
    parent_id?: number
    external_parent_id?: number
  }
}

export interface EditExternalParentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteLineageParentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface AddLineagePairResponse {
  success?: boolean
  message?: string
  data?: {
    pair_id?: number
  }
}

export interface EditLineagePairResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteLineagePairResponse {
  success?: boolean
  message?: string
  data?: {
    pair_present?: boolean
  }
}

export interface GetLineageAnimalListParams {
  animal_id: number | string
  parent_type?: 'sire' | 'dam'
  taxonomy_id?: number | string
  page_no?: number
  limit?: number
  q?: string
}

export interface GetLineageAnimalListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: import('./models').LineageAnimalListItem[]
    total_count?: number
  }
}
