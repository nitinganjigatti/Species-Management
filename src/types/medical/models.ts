/**
 * Core entity types for the Medical Records module
 */

// ==================== Animal Data ====================

export interface AnimalData {
  animal_id: string | number
  default_common_name?: string
  scientific_name?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  default_icon?: string
  total_animal?: string | number
  local_identifier_name?: string | null
  local_identifier_value?: string | null
  enclosure_id?: string | number
  section_id?: string | number
  site_id?: string | number
}

// ==================== Medical Record Row ====================

export interface MedicalRow {
  id: string | number
  medical_record_code?: string
  default_icon?: string
  case_type?: string
  complaint?: Array<{ complaint: string }>
  diagnosis?: Array<{ diagnosis?: string; name?: string }>
  prescription?: any[]
  created_by_profile_image?: string
  created_by_name?: string
  created_by?: string
  created_at?: string
  updated_by_profile_image?: string
  updated_by_name?: string
  updated_by?: string
  updated_at?: string
  enclosure_id?: string | number
  section_id?: string | number
  site_id?: string | number
  sl_no?: number
}

// ==================== Filter & Sort ====================

export interface FilterOptions {
  Gender: string[]
  Species: string[]
  Site: string[]
  Section: string[]
  Enclosure: string[]
}

export interface SortType {
  column: string
  sort: string
}

export interface FilterDate {
  startDate?: Date
  endDate?: Date
}

export interface PaginationFilters {
  page: number
  limit: number
  q: string
}
