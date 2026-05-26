import {
  GET_TREATMENT_MASTER_LIST,
  CREATE_TREATMENT,
  GET_TREATMENT_LIST,
  UPDATE_TREATMENT,
  DELETE_TREATMENT,
  ADD_TREATMENT_MASTERS,
  UPDATE_TREATMENT_MASTERS
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'
import { AddTreatmentParams, AddTreatmentResponse, DeleteTreatmentParans, DeleteTreatmentResponse, GetTreatmentListParams, GetTreatmentListResponse, GetTreatmentMasterListParams, GetTreatmentMasterListResponse, UpdateTreatmentParams, UpdateTreatmentResponse } from 'src/types/hospital/api/OtherTreatments/otherTreatments';

export const getTreatmentMasterList = async (
  params: GetTreatmentMasterListParams
): Promise<GetTreatmentMasterListResponse> => {
  try {
    const response = await axiosGet({
      url: GET_TREATMENT_MASTER_LIST,
      params
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching treatment master list:', err?.message || err)
    throw error
  }
}

export const addTreatmentMasters = async (
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${ADD_TREATMENT_MASTERS}`, body: payload })

  return response?.data
}

export const updateTreatmentMasters = async (
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${UPDATE_TREATMENT_MASTERS}`, body: payload })

  return response?.data
}

export const createTreatmentRecord = async (
  payload: AddTreatmentParams
): Promise<AddTreatmentResponse> => {
  try {
    const formData = new FormData()

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob)
      }
    })

    const response = await axiosFormPost({
      url: CREATE_TREATMENT,
      body: formData
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error creating treatment:', err?.message || err)
    throw error
  }
}

export const getTreatmentList = async (
  params: Partial<GetTreatmentListParams> = {}
): Promise<GetTreatmentListResponse> => {
  try {
    const filteredParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }

      return acc
    }, {})

    const response = await axiosGet({
      url: GET_TREATMENT_LIST,
      params: filteredParams
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching treatment list:', err?.message || err)
    throw error
  }
}

export const updateTreatmentRecord = async (
  payload: UpdateTreatmentParams
): Promise<UpdateTreatmentResponse> => {
  try {
    const formData = new FormData()

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob)
      }
    })

    const response = await axiosFormPost({
      url: UPDATE_TREATMENT,
      body: formData
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error updating treatment:', err?.message || err)
    throw error
  }
}

export const deleteTreatmentRecord = async (
  payload: DeleteTreatmentParans
): Promise<DeleteTreatmentResponse> => {
  try {
    const formData = new FormData()

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob)
      }
    })

    const response = await axiosFormPost({
      url: DELETE_TREATMENT,
      body: formData
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error deleting treatment:', err?.message || err)
    throw error
  }
}
