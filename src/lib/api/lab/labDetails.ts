import {
  getSitesByLabId,
  getUserByLabId,
  LAB_REQUEST_DETAILS,
  LAB_REQUEST_SAMPLES,
  LAB_REQUEST_NOTES,
  LAB_REQUEST_REPORTS,
  LAB_SUB_TESTS,
  LAB_SAMPLE_LOGS
} from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as unknown as (opts: { url: string; params?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
import type { LabSitesParams, LabSitesResponse, LabUsersParams, LabUsersResponse } from 'src/types/lab'
import type { ApiResponse } from 'src/types/lab'

export async function GetLabSitesById({ params }: { params: LabSitesParams }): Promise<LabSitesResponse> {
  const response = await axiosGet({ url: `${getSitesByLabId}`, params })

  return response.data
}

export async function GetLabUsersById({ params }: { params: LabUsersParams }): Promise<LabUsersResponse> {
  const response = await axiosGet({ url: `${getUserByLabId}`, params })

  return response.data
}

export async function getLabRequestDetails(requestGuid: string): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_REQUEST_DETAILS, params: { RequestGuid: requestGuid } })

  return response?.data
}

export async function getLabRequestSamples(requestGuid: string): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_REQUEST_SAMPLES, params: { requestGuid } })

  return response?.data
}

export async function getLabRequestNotes(requestGuid: string): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_REQUEST_NOTES, params: { requestGuid } })

  return response?.data
}

export async function getLabRequestReports(requestGuid: string): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_REQUEST_REPORTS, params: { requestGuid } })

  return response?.data
}

export async function getLabSubTests(tCode: string | number): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_SUB_TESTS, params: { type: 'subtests', t_code: tCode } })

  return response?.data
}

export async function getLabSampleLogs(requestGuid: string): Promise<ApiResponse> {
  const response = await axiosGet({ url: LAB_SAMPLE_LOGS, params: { requestGuid } })

  return response?.data
}
