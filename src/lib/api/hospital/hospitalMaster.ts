import {
  GET_MASTERS_HOSPITAL,
  CREATE_MASTERS_HOSPITAL,
  UPDATE_MASTERS_HOSPITAL,
  ANIMAL_MEDICAL_ID_LIST
} from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, HospitalListResponse } from 'src/types/hospital'

export async function getHospitalMaster({
  params
}: {
  params: Record<string, unknown>
}): Promise<HospitalListResponse> {
  const response = await axiosGet({ url: `${GET_MASTERS_HOSPITAL}`, params })

  return response?.data
}

export async function addHospitalMaster(
  payload: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: `${CREATE_MASTERS_HOSPITAL}`, body: payload })

  return response?.data
}

// export async function updateHospitalMaster(id, payload) {
//   const url = `${UPDATE_MASTERS_HOSPITAL}/${id}`
//   const response = await axiosFormPost({ url, body: payload })

//   return response?.data
// }
export async function updateHospitalMaster(
  id: string | number,
  payload: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: `${UPDATE_MASTERS_HOSPITAL}/${id}`, body: payload })

  return response?.data
}

export const getAnimalMedicalIds = async (
  animalId: string | number,
  payload: Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const url = `${ANIMAL_MEDICAL_ID_LIST}${animalId}/basic-data-list`
  const response = await axiosGet({ url, params: payload })

  return response?.data
}
