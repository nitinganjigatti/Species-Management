// Enclosure APIs - used by: enclosure/[id], sections/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ALL_ENCLOSURES,
  GET_ENCLOSURE_LIST_SECTION_WISE,
  GET_ENCLOSURE_WISE_STATS,
  GET_ENCLOSURE_BASIC_INFO,
  GET_ENCLOSURE_WISE_SPECIES,
  ADD_ENCLOSURE_TO_HOUSING,
  EDIT_ENCLOSURE,
  DELETE_ENCLOSURE,
  GET_ENCLOSURE_SETTINGS,
  GET_SECTION_FOR_ENCLOSURE,
  GET_PARENT_ENCLOSURE
} from 'src/constants/housing/enclosureConstants'

import type {
  GetEnclosuresParams,
  GetEnclosuresResponse,
  GetEnclosureListSectionWiseParams,
  GetEnclosureListSectionWiseResponse,
  GetEnclosureWiseStatsParams,
  GetEnclosureWiseStatsResponse,
  GetEnclosureWiseSpeciesParams,
  GetEnclosureWiseSpeciesResponse,
  GetEnclosureSettingsParams,
  GetEnclosureSettingsResponse,
  GetSectionsForEnclosurePayload,
  GetSectionsForEnclosureResponse,
  GetParentEnclosureListPayload,
  GetParentEnclosureListResponse,
  AddEnclosurePayload,
  AddEnclosureResponse,
  EnclosureBasicInfo,
  GetEnclosureBasicInfoParams,
  GetEnclosureBasicInfoResponse,
  EditEnclosurePayload,
  EditEnclosureResponse,
  DeleteEnclosureParams,
  DeleteEnclosureResponse
} from 'src/types/housing'

// ==================== Enclosure API ====================

export async function getAllEnclosures(params?: GetEnclosuresParams): Promise<GetEnclosuresResponse> {
  const response = await axiosGet({ url: `${GET_ALL_ENCLOSURES}`, params })

  return response.data
}

export async function getEnclosureListSectionWise(
  params: GetEnclosureListSectionWiseParams
): Promise<GetEnclosureListSectionWiseResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_LIST_SECTION_WISE}`, params })

  return response.data
}

export async function getEnclosureWiseStat(
  params: GetEnclosureWiseStatsParams
): Promise<GetEnclosureWiseStatsResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_STATS}/${params?.enclosure_id}` })

  return response?.data
}

// ==================== Enclosure Basic Info API ====================

export async function getEnclosureBasicInfo(
  params: GetEnclosureBasicInfoParams
): Promise<GetEnclosureBasicInfoResponse> {
  const response = await axiosGet({
    url: `${GET_ENCLOSURE_BASIC_INFO}`,
    params: { enclosure_id: params.enclosure_id }
  })

  return response?.data
}

export async function getEnclosureWiseSpecies(
  params: GetEnclosureWiseSpeciesParams = {},
  id: number
): Promise<GetEnclosureWiseSpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_SPECIES}/${id}`, params })

  return response?.data
}

export async function getEnclosureSetting(params?: GetEnclosureSettingsParams): Promise<GetEnclosureSettingsResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_SETTINGS}`, params })

  return response?.data
}

export async function getSectionsListingForEnclosure(
  params: GetSectionsForEnclosurePayload
): Promise<GetSectionsForEnclosureResponse> {
  const response = await axiosPost({ url: `${GET_SECTION_FOR_ENCLOSURE}`, body: params })

  return response?.data
}

export async function getParentEnclosureList(
  params: GetParentEnclosureListPayload
): Promise<GetParentEnclosureListResponse> {
  const response = await axiosPost({ url: `${GET_PARENT_ENCLOSURE}`, body: params })

  return response?.data
}

export async function addEnclosureToHousing(params: AddEnclosurePayload | any): Promise<AddEnclosureResponse> {
  const response = await axiosFormPost({ url: `${ADD_ENCLOSURE_TO_HOUSING}`, body: params })

  return response?.data
}

export async function editEnclosure(params: EditEnclosurePayload): Promise<EditEnclosureResponse> {
  const response = await axiosFormPost({ url: `${EDIT_ENCLOSURE}`, body: params })

  return response?.data
}

export async function deleteEnclosure(params: DeleteEnclosureParams): Promise<DeleteEnclosureResponse> {
  const response = await axiosPost({ url: `${DELETE_ENCLOSURE}`, body: params })

  return response?.data
}
