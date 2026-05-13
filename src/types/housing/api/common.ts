/**
 * Common/shared API types for the Housing module
 * Used by: common.ts API (species, mortality, media, users, incharge, permissions)
 */

import type { Site, Species, Mortality, Treatment, Media, User } from '../models'

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
  stats: {
    total_species_count?: number
    total_animal_count?: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginatedListingResponse<T> extends ApiResponse<PaginatedListingData<T>> {}

export interface ApiError {
  success: false
  message: string
  error?: string
  code?: string | number
}

export interface PaginationParams {
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

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

export interface AddMediaPayload {
  ref_id: number | string
  ref_type: 'site' | 'section' | 'enclosure'
  access_restricted_key?: number
  media_attachment: File[]
}

export interface AddMediaResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteMediaParams {
  id: string
}

// ==================== User API ====================

export interface GetUsersListParams {
  zoo_id?: number
  site_id?: string | number
  q?: string
  role?: string
  user_type?: string
}

export interface GetUsersListResponse extends ApiResponse<User[]> {}

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

export interface GetUserListPostParams {
  zoo_id?: number
  isActive?: boolean
  role_id?: string | number
  site_id?: string | number
  q?: string
}

export interface UserListItem {
  user_id: number
  user_name?: string
  full_name?: string
  user_profile_pic?: string
  role_name?: string
  user_mobile_number?: string
  account_status?: string
}

export interface GetUserListPostResponse {
  success?: boolean
  message?: string
  data?: UserListItem[]
}

// ==================== Incharge API ====================

export interface GetInchargeListParams {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  ref_id?: number
  ref_type?: string
  q?: string
  page_no?: number
}

export interface InchargeUser {
  user_id: number
  user_name: string
  user_profile?: string
  role_name?: string
  phone?: string
}

export interface GetInchargeListResponse {
  success?: boolean
  message?: string
  data?: {
    incharges?: InchargeUser[]
    total_count?: number
  }
}

export interface AddInchargePayload {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  cluster_id?: number
  animal_id?: number
  user_ids?: number[]
  ref_id?: string | number
  ref_type?: string
  user_id?: string | string[]
}

export interface AddInchargeResponse {
  success?: boolean
  message?: string
  data?: unknown
}

// ==================== User Roles API ====================

export interface UserRole {
  role_id: number
  role_name: string
  role_code?: string
}

export interface GetUsersRoleListResponse {
  success?: boolean
  message?: string
  data?: UserRole[]
}

// ==================== Entity Permission API ====================

export interface GetEntityPermissionParams {
  entity_type?: string
  entity_id?: number
}

export interface GetEntityPermissionResponse {
  success?: boolean
  message?: string
  data?: {
    hasPermission: number
  }
}

export interface HospitalEntityCreatedBy {
  name: string
  user_profile_pic?: string
  user_id: number
}

export interface HospitalEntityItem {
  id: number
  name: string
  description?: string
  zoo_id?: number
  site_id?: number
  site_name?: string
  entity_type?: string
  created_by?: HospitalEntityCreatedBy
}

export interface GetHospitalTransferHospitalListParams {
  limit?: number
  page_no?: number
  q?: string
}

export interface GetHospitalTransferHospitalListResponse {
  status?: boolean
  message?: string
  data?: {
    total_records: number
    list: HospitalEntityItem[]
  }
}