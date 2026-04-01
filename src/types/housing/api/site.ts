/**
 * Site API types
 * Used by: sites/index, sites/[id]
 */

import type { Site, SiteAnalytics } from '../models'
import type { ApiResponse, PaginatedData, PaginationParams } from './common'

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

export interface EditSitePayload {
  zoo_id: number
  site_id: number
  site_name: string
  site_description?: string
  site_latitude?: string
  site_longitude?: string
  site_image?: File[]
}

export interface EditSiteResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteSiteParams {
  site_id: number
}

export interface DeleteSiteResponse {
  success?: boolean
  message?: string
}

// ==================== Site Team Management ====================

export interface AddSiteTeamPayload {
  site_id: number
  user_id: number | number[] | string
  user_type: 'transfer_user' | 'security'
}

export interface AddSiteTeamResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface EditSiteTeamPayload {
  site_id: number
  user_id: number
  user_type: 'transfer_user' | 'security'
}

export interface EditSiteTeamResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface UpdatePerformActionPayload {
  site_id: number
  user_id: number
  user_type: 'transfer_user' | 'security'
  can_perform_action: number
}

export interface UpdatePerformActionResponse {
  success?: boolean
  message?: string
  data?: unknown
}
