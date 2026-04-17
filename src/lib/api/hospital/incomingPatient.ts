import {
  ADMIT_HOSPITAL_PATIENT,
  GET_HOSPITAL_PATIENTS_LISTS,
  GET_NEW_INCOMING_PATIENTS_LISTS,
  GET_PATIENT_DETAILS_BY_TRANSFER_ID,
  GET_PATIENTS_DETAILS
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  IncomingPatientsParams,
  IncomingPatientsResponse,
  PatientDetailsResponse
} from 'src/types/hospital'

export const getIncomingPatients = async (
  params: IncomingPatientsParams
): Promise<IncomingPatientsResponse> => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_PATIENTS_LISTS}`, params })

  return response?.data
}

export const getPatientDetails = async (id: string | number): Promise<PatientDetailsResponse> => {
  const response = await axiosGet({ url: `${GET_PATIENTS_DETAILS}${id}` })

  return response?.data
}

export const admitHospitalPatient = async (
  params: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${ADMIT_HOSPITAL_PATIENT}`, body: params })

  return response?.data
}

export const getNewIncomingPatientsLists = async (
  params: IncomingPatientsParams
): Promise<IncomingPatientsResponse> => {
  const response = await axiosGet({ url: `${GET_NEW_INCOMING_PATIENTS_LISTS}`, params })

  return response?.data
}

export const getPatientDetailsByTransferId = async (
  params: Record<string, unknown>
): Promise<PatientDetailsResponse> => {
  const response = await axiosGet({ url: `${GET_PATIENT_DETAILS_BY_TRANSFER_ID}`, params })

  return response?.data
}
