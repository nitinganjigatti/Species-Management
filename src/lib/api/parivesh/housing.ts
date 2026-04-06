import { HOUSING_REPORT, SPECIES_REPORT, USERS_REPORT } from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'
import type { ApiResponse } from 'src/types/housing'

// Type-safe wrappers for axios utilities
const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

interface UsersReportResponse extends ApiResponse<unknown> {}
interface HousingReportResponse extends ApiResponse<unknown> {}
interface SpeciesReportResponse extends ApiResponse<unknown> {}

export async function getUsersReportList(): Promise<UsersReportResponse> {
  const response = await axiosPost({ url: `${USERS_REPORT}` })

  return response.data
}

export async function getHousingReport(): Promise<HousingReportResponse> {
  const response = await axiosGet({ url: `${HOUSING_REPORT}` })

  return response.data
}

export async function getSpeciesReport(): Promise<SpeciesReportResponse> {
  const response = await axiosGet({ url: `${SPECIES_REPORT}` })

  return response.data
}
