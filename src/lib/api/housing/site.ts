// Site APIs - used by: sites/index, sites/[id], cluster/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  HOUSING_SITE_ANALYTICS,
  GET_SITES,
  SITE_DETAILS,
  CREATE_SITE,
  EDIT_SITE,
  DELETE_SITE,
  ADD_SITE_TEAM,
  EDIT_SITE_TEAM,
  UPDATE_PERFORM_ACTION,
  GET_SITE_FOOD_WASTAGE
} from 'src/constants/housing/siteConstants'

import type {
  GetSitesParams,
  GetSitesResponse,
  GetSiteAnalyticsResponse,
  GetSiteDetailsResponse,
  AddSitePayload,
  AddSiteResponse,
  EditSitePayload,
  EditSiteResponse,
  DeleteSiteParams,
  DeleteSiteResponse,
  AddSiteTeamPayload,
  AddSiteTeamResponse,
  EditSiteTeamPayload,
  EditSiteTeamResponse,
  UpdatePerformActionPayload,
  UpdatePerformActionResponse
} from 'src/types/housing'

import type { GetFoodWastageParams, GetFoodWastageResponse } from 'src/types/housing/api/foodWastage'

// ==================== Site API ====================

export async function getSiteAnalytics(id: number): Promise<GetSiteAnalyticsResponse> {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}

export async function AddNewSite(params: AddSitePayload): Promise<AddSiteResponse> {
  const response = await axiosFormPost({ url: `${CREATE_SITE}`, body: params })

  return response.data
}

export async function editSite(params: EditSitePayload): Promise<EditSiteResponse> {
  const response = await axiosFormPost({ url: `${EDIT_SITE}`, body: params })

  return response.data
}

export async function deleteSite(params: DeleteSiteParams): Promise<DeleteSiteResponse> {
  const response = await axiosGet({ url: `${DELETE_SITE}`, params })

  return response.data
}

export async function getAllSites(params?: GetSitesParams): Promise<GetSitesResponse> {
  const response = await axiosGet({ url: `${GET_SITES}`, params })

  return response.data
}

export async function getSpecificSiteAnalytics(params: { site_id: number }): Promise<GetSiteDetailsResponse> {
  const response = await axiosGet({ url: `${SITE_DETAILS}`, params })

  return response.data
}

// ==================== Site Team Management API ====================

export async function addSiteTeamMember(params: AddSiteTeamPayload): Promise<AddSiteTeamResponse> {
  const body = {
    site_id: params.site_id,
    user_id: Array.isArray(params.user_id) ? JSON.stringify(params.user_id) : params.user_id,
    user_type: params.user_type
  }
  const response = await axiosPost({ url: `${ADD_SITE_TEAM}`, body })

  return response?.data
}

export async function removeSiteTeamMember(params: EditSiteTeamPayload): Promise<EditSiteTeamResponse> {
  const response = await axiosPost({ url: `${EDIT_SITE_TEAM}`, body: params })

  return response?.data
}

export async function updateTeamMemberPermission(params: UpdatePerformActionPayload): Promise<UpdatePerformActionResponse> {
  const response = await axiosPost({ url: `${UPDATE_PERFORM_ACTION}`, body: params })

  return response?.data
}

// ==================== Site Food Wastage API ====================

export async function getSiteFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
  const response = await axiosGet({ url: `${GET_SITE_FOOD_WASTAGE}`, params })

  return response?.data
}
