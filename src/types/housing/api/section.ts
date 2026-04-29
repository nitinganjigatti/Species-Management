/**
 * Section API types
 * Used by: sections/[id], sites/[id]
 */

import type { Section, SectionAnalytics, Treatment } from '../models'
import type { ApiResponse, PaginatedData, PaginationParams } from './common'

// ==================== Section API ====================

export interface GetSectionsParams extends PaginationParams {
  site_id?: number
  is_active?: boolean
  search?: string
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

export interface EditSectionPayload {
  section_id: number
  section_name: string
  section_site_id: number
  section_latitude?: string
  section_longitude?: string
  section_image?: File[]
}

export interface EditSectionResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteSectionParams {
  section_id: number
}

export interface DeleteSectionResponse {
  success?: boolean
  message?: string
}

// ==================== Section Treatment ====================

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
