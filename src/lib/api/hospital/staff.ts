import { GET_HOSPITAL_STAFF, ADD_CHIEF_DOCTOR, REMOVE_CHIEF_DOCTOR } from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, StaffListParams, StaffListResponse } from 'src/types/hospital'

export const getHospitalStaff = async ({
  params
}: {
  params: StaffListParams
}): Promise<StaffListResponse> => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_STAFF}`, params })

  return response?.data
}

export const addChiefDoctor = async (params: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
  try {
    const url = `${ADD_CHIEF_DOCTOR}`
    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Chief doctor already selected', err?.message)
    throw error
  }
}

export const removeChiefDoctor = async (
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  try {
    const url = `${REMOVE_CHIEF_DOCTOR}`
    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error removing chief doctor', err?.message)

    return { success: false, message: err?.message }
  }
}
