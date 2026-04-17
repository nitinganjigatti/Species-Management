// Cluster APIs - used by: cluster/index, cluster/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_CLUSTERS_LIST,
  GET_SPECIFIC_CLUSTER_ANALYTICS,
  GET_SITES_LIST_CLUSTER_WISE,
  ADD_CLUSTER,
  EDIT_CLUSTER,
  DELETE_CLUSTER,
  ASSIGN_SITES_FOR_CLUSTER
} from 'src/constants/housing/clusterConstants'

import type {
  GetClusterListParams,
  GetClusterListResponse,
  GetClusterAnalyticsParams,
  GetClusterAnalyticsResponse,
  GetSiteListClusterWiseParams,
  GetSiteListClusterWiseResponse,
  AddClusterPayload,
  AddClusterResponse
} from 'src/types/housing'

import type {
  EditClusterPayload,
  EditClusterResponse,
  DeleteClusterParams,
  DeleteClusterResponse,
  GetAvailableSitesForClusterParams,
  AvailableSiteItem,
  GetAvailableSitesForClusterResponse,
  AssignSitesToClusterPayload,
  AssignSitesToClusterResponse
} from 'src/types/housing/api/cluster'

// ==================== Cluster API ====================

export async function getClusterList(params?: GetClusterListParams): Promise<GetClusterListResponse> {
  const response = await axiosGet({ url: `${GET_CLUSTERS_LIST}`, params })

  return response.data
}

export async function getSpecificClusterAnalytics(
  params: GetClusterAnalyticsParams
): Promise<GetClusterAnalyticsResponse> {
  const response = await axiosGet({ url: `${GET_SPECIFIC_CLUSTER_ANALYTICS}`, params })

  return response.data
}

export async function getSiteListClusterWise(
  params: GetSiteListClusterWiseParams
): Promise<GetSiteListClusterWiseResponse> {
  const response = await axiosGet({ url: `${GET_SITES_LIST_CLUSTER_WISE}`, params })

  return response?.data
}

export async function addCluster(params: AddClusterPayload): Promise<AddClusterResponse> {
  const response = await axiosFormPost({ url: `${ADD_CLUSTER}`, body: params })

  return response?.data
}

export async function editCluster(params: EditClusterPayload): Promise<EditClusterResponse> {
  const response = await axiosFormPost({ url: `${EDIT_CLUSTER}`, body: params })

  return response?.data
}

export async function deleteCluster(params: DeleteClusterParams): Promise<DeleteClusterResponse> {
  const response = await axiosPost({ url: `${DELETE_CLUSTER}`, body: params })

  return response?.data
}

export async function getAvailableSitesForCluster(
  params: GetAvailableSitesForClusterParams
): Promise<GetAvailableSitesForClusterResponse> {
  const response = await axiosGet({ url: `${GET_SITES_LIST_CLUSTER_WISE}`, params })

  return response?.data
}

export async function assignSitesToCluster(payload: AssignSitesToClusterPayload): Promise<AssignSitesToClusterResponse> {
  const body = {
    cluster_id: payload.cluster_id,
    cluster_sites: Array.isArray(payload.cluster_sites)
      ? JSON.stringify(payload.cluster_sites)
      : payload.cluster_sites,
    will_add: payload.will_add
  }
  const response = await axiosPost({ url: `${ASSIGN_SITES_FOR_CLUSTER}`, body })

  return response?.data
}
