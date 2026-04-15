/**
 * Cluster API types
 * Used by: cluster/index, cluster/[id]
 */

import type { Cluster, ClusterAnalytics, Site } from '../models'
import type { ApiResponse, PaginatedData, PaginationParams } from './common'

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

export interface EditClusterPayload {
  cluster_id: number
  cluster_name: string
  cluster_desc?: string
  cluster_image?: File[]
}

export interface EditClusterResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteClusterParams {
  cluster_id: number
}

export interface DeleteClusterResponse {
  success?: boolean
  message?: string
}

export interface GetAvailableSitesForClusterParams {
  cluster_id: number
  q?: string
  page_no?: number
  limit?: number
}

export interface AvailableSiteItem {
  site_id: number
  site_name: string
  site_description?: string
  images?: Array<{ file?: string; display_type?: string }>
  incharge_name?: string
  incharge_image?: string
  is_assigned?: boolean | number
}

export interface GetAvailableSitesForClusterResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AvailableSiteItem[]
    total_count?: number
  }
}

export interface AssignSitesToClusterPayload {
  cluster_id: number
  cluster_sites: string | number[]
  will_add: number
}

export interface AssignSitesToClusterResponse {
  success?: boolean
  message?: string
  data?: unknown
}
