/**
 * API request param types for the Egg module
 */

// ==================== Pagination ====================

export interface PaginationParams {
  page?: number
  limit?: number
  q?: string
  status?: string | number
  sort?: string
}

// ==================== Egg ====================

export interface GetEggListParams extends PaginationParams {
  species_id?: string | number
  status?: string | number
  condition?: string | number
  collection_date?: string
  sortBy?: string
}

export interface GetEggDetailsParams {
  id: string | number
}

export interface AddEggStatusAndConditionParams {
  egg_id: string | number
  current_state?: string | number
  select_stage?: string | number
  condition?: string | number
  shell_thickness?: number
  hatched_date?: string
  hatched_method_Btn?: string
  comment?: string
  image?: File[] | string[]
  assessment_data?: Record<string, any>
}

export interface EditEggParams {
  egg_id: string | number
  egg_no?: string
  egg_number?: string
}

export interface AddEggCommentParams {
  egg_id: string | number
  comment_text: string
  [key: string]: any
}

export interface DeleteEggCommentParams {
  comment_id: string | number
  egg_id?: string | number
}

// ==================== Allocation ====================

export interface AllocationParams extends PaginationParams {
  egg_id?: string | number
  destination_type?: string
}

export interface AddAllocationParams {
  egg_id: string | number
  destination_type: string
  destination_id: string | number
  allocation_date?: string
  remarks?: string
}

// ==================== Discard ====================

export interface DiscardedEggListParams extends PaginationParams {
  status?: string | number
  discard_date?: string
}

export interface AddDiscardEggParams {
  egg_id: string | number
  reason: string
  discard_date?: string
  image?: File[] | string[]
  [key: string]: any
}

export interface DiscardStatusParams {
  discard_id: string | number
  status: string | number
}

// ==================== Assessment ====================

export interface AssessmentListParams extends PaginationParams {
  egg_id: string | number
}

export interface AddAssessmentParams {
  egg_id: string | number
  weight?: number
  condition?: string
  assessment_date?: string
  remarks?: string
}

// ==================== Transfer ====================

export interface TransferEggParams {
  egg_id: string | number
  from_location: string
  to_location: string
  transfer_date?: string
  remarks?: string
}

// ==================== Gallery ====================

export interface GetGalleryParams extends PaginationParams {
  egg_id: string | number
}

export interface AddGalleryParams {
  egg_id: string | number
  media_files: File[]
  captions?: string[]
}

export interface DeleteGalleryParams {
  media_id: string | number
  egg_id?: string | number
}

// ==================== Incubator ====================

export interface GetIncubatorListParams extends PaginationParams {
  room_id?: string | number
  status?: string | number
}

export interface AddIncubatorParams {
  incubator_name: string
  incubator_code?: string
  room_id: string | number
  capacity?: number
  temperature?: number
  humidity?: number
}

export interface UpdateIncubatorParams {
  incubator_id: string | number
  incubator_name?: string
  capacity?: number
  temperature?: number
  humidity?: number
  status?: string | number
}

// ==================== Incubator Room ====================

export interface GetRoomListParams extends PaginationParams {
  section_id?: string | number
}

export interface AddRoomParams {
  room_name: string
  room_code?: string
  section_id: string | number
  capacity?: number
}

export interface UpdateRoomParams {
  room_id: string | number
  room_name?: string
  capacity?: number
  status?: string | number
}

// ==================== Nursery ====================

export interface GetNurseryListParams extends PaginationParams {
  species_id?: string | number
  status?: string | number
}

export interface AddNurseryParams {
  nursery_name: string
  enclosure_id: string | number
  species_id: string | number
  count?: number
  age_days?: number
}

export interface UpdateNurseryParams {
  nursery_id: string | number
  nursery_name?: string
  count?: number
  status?: string | number
}

// ==================== Species ====================

export interface GetSpeciesListParams extends PaginationParams {
  taxonomy_id?: string | number
}

export interface GetSpeciesDetailsParams {
  species_id: string | number
}

// ==================== Animal Creation ====================

export interface CreateAnimalParams {
  egg_id: string | number
  species_id: string | number
  accession_type: string | number
  accession_id?: string
  accession_date?: string
  institution?: string | number
  ownership_terms?: string | number
  enclosure_id?: string | number
  sex_type?: string
  life_stage?: string
  collection_type?: string
  local_identifier?: string
  local_identifier_type?: string
  parent_mother?: string | number
  parent_father?: string | number
  birth_date?: string
  sexing_type?: string
  contraception_type?: string
  masters_organization?: string | number
  age?: string
  type?: string
  image?: File[] | string[]
  [key: string]: any
}

export interface GetAccessionTypeParams {
  [key: string]: any
}

export interface GetAnimalMasterParams {
  [key: string]: any
}

export interface GetTaxonomyListParams extends PaginationParams {
  [key: string]: any
}
