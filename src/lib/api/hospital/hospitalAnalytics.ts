import { HOSPITAL_BED_STATS, HOSPITAL_DETAIL, HOSPITAL_LISTING } from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, HospitalAnalyticsResponse, HospitalListResponse } from 'src/types/hospital'
import { GetHospitalDetailAnalyticsResponse } from 'src/types/hospital/api/Analytics/hospital';

export async function getHospitalListing(
  params: Record<string, unknown>,
  userId: string | number
): Promise<HospitalListResponse> {
  try {
    const url = `${HOSPITAL_LISTING}/${userId}/hospital`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getHospitalBedStats(
  id: string | number,
  params: Record<string, unknown>
): Promise<HospitalAnalyticsResponse> {
  try {
    const url = `${HOSPITAL_BED_STATS}${id}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getHospitalDetail(
  id: string | number,
  params: Record<string, unknown>
): Promise<GetHospitalDetailAnalyticsResponse> {
  try {
    const url = `${HOSPITAL_DETAIL}${id}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}
