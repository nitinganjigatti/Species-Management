// Common/shared housing APIs - used across multiple pages
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ALL_SPECIES,
  GET_MORTALITY,
  GET_MEDIA,
  ADD_MEDIA,
  GET_INCHARGE_LIST,
  ADD_INCHARGE,
  GET_USERS_LIST,
  GET_USERS_ROLE_LIST,
  GET_ALL_USERS,
  GET_ENTITY_PERMISSION
} from 'src/constants/housing/commonConstants'

import { USER_LIST } from 'src/constants/ApiConstant'

import type {
  GetSpeciesParams,
  GetSpeciesResponse,
  GetMortalityListParams,
  GetMortalityListResponse,
  GetMediaParams,
  GetMediaResponse,
  GetUsersListParams,
  GetUsersListResponse,
  GetEntityPermissionParams,
  GetEntityPermissionResponse
} from 'src/types/housing'

import type { GetUsersWithAccessParams, GetUsersWithAccessResponse } from 'src/types/housing'

import type {
  AddMediaPayload,
  AddMediaResponse,
  GetUserListPostParams,
  UserListItem,
  GetUserListPostResponse,
  GetInchargeListParams,
  InchargeUser,
  GetInchargeListResponse,
  AddInchargePayload,
  AddInchargeResponse,
  UserRole,
  GetUsersRoleListResponse
} from 'src/types/housing/api/common'

// ==================== Species API ====================

export async function getAllSpeciesList(params?: GetSpeciesParams): Promise<GetSpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ALL_SPECIES}`, params })

  return response.data
}

// ==================== Mortality List API ====================

export async function getMortalityList(params?: GetMortalityListParams): Promise<GetMortalityListResponse> {
  const response = await axiosGet({ url: `${GET_MORTALITY}`, params })

  return response.data
}

// ==================== Media API ====================

export async function getAllMedia(params?: GetMediaParams): Promise<GetMediaResponse> {
  const response = await axiosGet({ url: `${GET_MEDIA}`, params })

  return response.data
}

export async function addMedia(formData: FormData): Promise<AddMediaResponse> {
  const response = await axiosFormPost({ url: `${ADD_MEDIA}`, body: formData })

  return response?.data
}

// ==================== User API ====================

export async function getAllUsers(params?: GetUsersListParams): Promise<GetUsersListResponse> {
  const response = await axiosGet({ url: `${GET_ALL_USERS}`, params })

  return response?.data
}

export async function getUserListPost(params: GetUserListPostParams): Promise<GetUserListPostResponse> {
  const response = await axiosPost({ url: `${USER_LIST}`, body: params })

  return response?.data
}

// ==================== Incharge API ====================

export async function getInchargeList(params: GetInchargeListParams): Promise<GetInchargeListResponse> {
  const response = await axiosGet({ url: `${GET_INCHARGE_LIST}`, params })

  return response?.data
}

export async function addIncharge(params: AddInchargePayload): Promise<AddInchargeResponse> {
  const response = await axiosPost({ url: `${ADD_INCHARGE}`, body: params })

  return response?.data
}

// ==================== User Roles API ====================

export async function getUsersRoleList(): Promise<GetUsersRoleListResponse> {
  const response = await axiosGet({ url: `${GET_USERS_ROLE_LIST}` })

  return response?.data
}

// ==================== Users with Access API ====================

export async function getUsersList(params: GetUsersWithAccessParams): Promise<GetUsersWithAccessResponse> {
  const response = await axiosGet({ url: `${GET_USERS_LIST}`, params })

  return response?.data
}

// ==================== Entity Permission API ====================

export async function getEntityPermissionCheck(params: GetEntityPermissionParams): Promise<GetEntityPermissionResponse> {
  const response = await axiosGet({ url: GET_ENTITY_PERMISSION, params })

  return response?.data
}
