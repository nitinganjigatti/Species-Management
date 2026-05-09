import {
  GET_ANIMAL_FILTERS_LISTS,
  GET_ANIMAL_LIST_FOR_OBSERVATION_REPORT,
  GET_KEEPER_REPORT,
  GET_OBSERVATION_REPORT,
  GET_ANIMAL_COUNT_REGISTER,
  COMPLIANCE_DAILY_REPORT
} from 'src/constants/ApiConstant'
import { GET_ALL_USERS } from 'src/constants/housing/commonConstants'
import { OBSERVATION_MASTER_TYPE } from 'src/constants/housing/observationConstants'
import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  GetDiaryReportParams,
  GetDiaryReportResponse,
  GetAnimalListForObservationReportBody,
  GetObservationReportParams,
  GetObservationReportResponse,
  GetAnimalFilterListResponse,
  GetEnclosureCountRegisterParams,
  GetEnclosureCountRegisterResponse,
  GetComplianceDailyReportParams,
  GetObservationMasterTypeParams,
  GetUserListingResponse
} from 'src/types/compliance'

export async function getUserListing(params: Record<string, unknown>): Promise<GetUserListingResponse> {
  const response = await axiosGet({ url: `${GET_ALL_USERS}`, params })

  return response.data
}

export async function getDiaryReportList(params: GetDiaryReportParams): Promise<GetDiaryReportResponse> {
  const response = await axiosGet({ url: `${GET_KEEPER_REPORT}`, params })

  return response.data
}

export async function getAnimalListForObservationReport(body: GetAnimalListForObservationReportBody): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: `${GET_ANIMAL_LIST_FOR_OBSERVATION_REPORT}`, body: JSON.stringify(body) })

  return response?.data
}

export async function getObservationReport(params: GetObservationReportParams): Promise<GetObservationReportResponse> {
  console.log(params, 'params from api')
  const response = await axiosGet({ url: `${GET_OBSERVATION_REPORT}`, params })

  return response?.data
}

export async function getAnimalFilterList({ params }: { params: Record<string, unknown> }): Promise<GetAnimalFilterListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_FILTERS_LISTS}`, params })

  return response?.data
}

// Enclosure Count Register
export async function getEnclosureCountRegister(params: GetEnclosureCountRegisterParams): Promise<GetEnclosureCountRegisterResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_COUNT_REGISTER}`, params })

  return response?.data
}

export async function getComplianceDailyReport(params: GetComplianceDailyReportParams): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: `${COMPLIANCE_DAILY_REPORT}`, body: params })

  return response?.data
}

export async function getObservationMasterType(params: GetObservationMasterTypeParams = {}): Promise<ApiResponse<unknown>> {
  const response = await axiosGet({ url: `${OBSERVATION_MASTER_TYPE}`, params })

  return response?.data
}

export async function getAnimalHistoryReport(_params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  // const response = await axiosGet({ url: `${OBSERVATION_MASTER_TYPE}`, params: _params })
  // return response?.data
  return {}
}
