/**
 * Food Wastage API types
 * Used by: sites/[id], sections/[id], enclosure/[id]
 */

// ==================== Food Wastage Types ====================

export interface FoodWastageListItem {
  site_id?: number
  section_id?: number
  section_name?: string
  enclosure_id?: number
  user_enclosure_name?: string
  file_name?: string
  total_wastage?: string | number
  unit?: string
  wastage_date?: string
  total_entry?: string | number
  entries?: FoodWastageGraphEntry[]
}

export interface FoodWastageHighestWastage {
  section_id?: number
  section_name?: string
  user_enclosure_name?: string
  total_wastage?: string | number
  unit?: string
  wastage_per?: string | number
}

export interface FoodWastageGraphEntry {
  wastage_quantity?: string | number
  wastage_time?: string
  wastage_date?: string
}

export interface FoodWastageGraphItem {
  wastage_date?: string
  total_wastage?: string | number
  total_entry?: string | number
  entries?: FoodWastageGraphEntry[]
}

export interface FoodWastageData {
  total_wastage?: string | number
  unit?: string
  daily_average?: string | number
  section_average?: string | number
  highest_wastage?: FoodWastageHighestWastage
  list?: FoodWastageListItem[]
  graphlist?: FoodWastageGraphItem[]
  total_count?: number
  site_percentage?: string | number
  total_site_wastage?: string | number
  section_percentage?: string | number
  total_section_wastage?: string | number
}

export interface GetFoodWastageParams {
  site_id?: string | number
  section_id?: string | number
  enclosure_id?: string | number
  from_date: string
  to_date: string
  limit?: number
  filter?: 'ASC' | 'DESC'
  is_graph?: 0 | 1
  page_no?: number
}

export interface GetFoodWastageResponse {
  success?: boolean
  message?: string
  data?: FoodWastageData
}

// ==================== Food Wastage Details ====================

export interface FoodWastageDetailItem {
  id?: number
  wastage_quantity?: string | number
  original_wastage_quantity?: string | number
  unit?: string
  unit_id?: number
  wastage_date?: string
  notes?: string
  user_id?: number
  user_full_name?: string
  user_profile_pic?: string
}

export interface FoodWastageDetailsData {
  list?: FoodWastageDetailItem[]
  total_count?: number
  total_wastage?: string | number
  unit?: string
}

export interface GetFoodWastageDetailsParams {
  enclosure_id: string | number
  date: string
  page_no?: number
  limit?: number
}

export interface GetFoodWastageDetailsResponse {
  success?: boolean
  message?: string
  data?: FoodWastageDetailsData
}
