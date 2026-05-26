/**
 * Core entity types for the Egg module
 */

// ==================== Generic Response Types ====================

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResult<T> {
  result: T[]
  total_count: number
}

// ==================== Egg ====================

export interface EggItem {
  egg_id?: string | number
  egg_number?: string
  egg_no?: string
  current_state?: string | number
  select_stage?: string | number
  condition?: string | number
  egg_condition?: string | number
  shell_thickness?: number
  hatched_date?: string
  hatched_method_Btn?: string
  status?: string | number
  egg_status?: string
  egg_status_id?: string | number
  egg_state?: string
  egg_state_id?: string | number
  is_necropsy_needed?: number | boolean | string
  species_id?: string | number
  species_name?: string
  enclosure_id?: string | number
  enclosure_name?: string
  enclosure_data?: Record<string, any>
  collection_date?: string
  collected_by?: string | number
  assessment_count?: number
  comment_count?: number
  image_count?: number
  created_at?: string
  updated_at?: string
  modified_at?: string
  is_active?: number | boolean
  assessments_data?: Record<string, any>[]
  nursery_id?: string | number
  nursery_name?: string
  egg_images?: Record<string, any>[]
  default_icon?: string
  default_common_name?: string
  egg_code?: string
  total_count?: number
  action_to_be_taken?: string
  discard_status?: string
  animal_data?: Record<string, any>
  parent_list?: Record<string, any>
  lay_date?: string
  user_profile_pic?: string
  user_full_name?: string
}

export interface EggStatus {
  id: string | number
  egg_status?: string
  status_code?: string
  is_active?: number | boolean
}

export interface EggStage {
  id: string | number
  egg_state?: string
  is_active?: number | boolean
}

export interface EggMaster {
  egg_status?: EggStatus[]
  egg_stage?: EggStage[]
  [key: string]: any
}

// ==================== Incubator ====================

export interface IncubatorItem {
  incubator_id: string | number
  incubator_name?: string
  incubator_code?: string
  room_id?: string | number
  room_name?: string
  capacity?: number
  current_count?: number
  temperature?: number
  humidity?: number
  status?: string | number
  created_at?: string
  updated_at?: string
  is_active?: number | boolean
}

// ==================== Incubator Room ====================

export interface IncubatorRoomItem {
  room_id: string | number
  room_name?: string
  room_code?: string
  section_id?: string | number
  section_name?: string
  capacity?: number
  current_count?: number
  created_at?: string
  updated_at?: string
  is_active?: number | boolean
}

// ==================== Nursery ====================

export interface NurseryItem {
  nursery_id: string | number
  nursery_name?: string
  enclosure_id?: string | number
  enclosure_name?: string
  species_id?: string | number
  species_name?: string
  count?: number
  age_days?: number
  status?: string | number
  created_at?: string
  updated_at?: string
  is_active?: number | boolean
}

// ==================== Species ====================

export interface SpeciesItem {
  species_id: string | number
  species_name?: string
  scientific_name?: string
  taxonomy_id?: string | number
  image?: string
  description?: string
  created_at?: string
  updated_at?: string
  is_active?: number | boolean
}

// ==================== Allocation ====================

export interface AllocationItem {
  allocation_id: string | number
  egg_id?: string | number
  destination_type?: string
  destination_id?: string | number
  destination_name?: string
  allocation_date?: string
  status?: string | number
  created_at?: string
  updated_at?: string
}

// ==================== Discard ====================

export interface DiscardItem {
  discard_id: string | number
  egg_id?: string | number
  egg_number?: string
  reason?: string
  discard_date?: string
  status?: string | number
  created_at?: string
  updated_at?: string
  is_active?: number | boolean
}

// ==================== Status History ====================

export interface StatusHistory {
  id: string | number
  egg_id?: string | number
  old_status?: string | number
  new_status?: string | number
  changed_by?: string | number
  changed_at?: string
  remarks?: string
}

// ==================== Comment/Activity ====================

export interface CommentItem {
  comment_id: string | number
  egg_id?: string | number
  comment_text?: string
  created_by?: string | number
  created_by_name?: string
  created_at?: string
  updated_at?: string
}

export interface ActivityLog {
  id: string | number
  egg_id?: string | number
  action?: string
  details?: string
  actor_id?: string | number
  actor_name?: string
  timestamp?: string
}

// ==================== Transfer ====================

export interface TransferRecord {
  transfer_id: string | number
  egg_id?: string | number
  from_location?: string
  to_location?: string
  transfer_date?: string
  transferred_by?: string | number
  status?: string | number
  created_at?: string
  updated_at?: string
}

// ==================== Assessment/Weight ====================

export interface AssessmentItem {
  assessment_id: string | number
  egg_id?: string | number
  weight?: number
  condition?: string
  assessment_date?: string
  assessed_by?: string | number
  remarks?: string
  created_at?: string
  updated_at?: string
}

// ==================== Gallery/Media ====================

export interface GalleryItem {
  media_id: string | number
  egg_id?: string | number
  media_type?: string
  media_url?: string
  caption?: string
  uploaded_by?: string | number
  uploaded_at?: string
}

// ==================== Animal Creation ====================

export interface AnimalCreationPayload {
  egg_id?: string | number
  species_id?: string | number
  species_name?: string
  accession_type?: string | number
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
  [key: string]: any
}
