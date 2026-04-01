/**
 * Enclosure API types
 * Used by: enclosure/[id], sections/[id]
 */

import type { Enclosure, Section, EnclosureSetting, EnclosureStats, Species } from '../models'
import type { ApiResponse, PaginatedData, PaginatedListingData, PaginationParams } from './common'

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

// ==================== Enclosure Basic Info ====================

export interface EnclosureBasicInfo {
  enclosure_id?: number
  user_enclosure_name?: string
  parent_enclosure_name?: string
  section_name?: string
  site_name?: string
  enclosure_type?: string
  enclosure_type_id?: number | string
  enclosure_sunlight?: string
  enclosure_environment?: string
  enclosure_is_movable?: string | number
  enclosure_is_walkable?: string | number
  enclosure_desc?: string
  created_at?: string
  updated_at?: string
}

export interface GetEnclosureBasicInfoParams {
  enclosure_id: number
}

export interface GetEnclosureBasicInfoResponse {
  success?: boolean
  message?: string
  data?: EnclosureBasicInfo
}

// ==================== Enclosure Edit/Delete ====================

export interface EditEnclosurePayload {
  enclosure_id: number
  user_enclosure_name: string
  section_id: number | string
  enclosure_desc?: string
  enclosure_environment?: string
  user_enclosure_id?: string
  enclosure_is_movable?: number
  enclosure_is_walkable?: number
  enclosure_type?: string
  enclosure_sunlight?: string
  enclosure_parent_id?: number | string | null
  enclosure_lat?: string
  enclosure_long?: string
  commistioned_date?: string
  enclosure_status?: string
  enclosure_code?: string
  enclosure_image?: File[]
}

export interface EditEnclosureResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteEnclosureParams {
  enclosure_id: number
}

export interface DeleteEnclosureResponse {
  success?: boolean
  message?: string
}
