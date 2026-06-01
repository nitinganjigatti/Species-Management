import {
  ADD_HOSPITAL_PATIENT,
  DELETE_CLINICAL_NOTES,
  EDIT_PATIENT_DETAILS,
  GET_ALL_SITE_LIST_WITHOUT_PERMISSION,
  GET_ANIMAL_TOTAL_HOSPITAL_VISIT,
  GET_FOLLOWUP_PATIENTS_LISTS,
  GET_MORTALITY_PATIENTS_LISTS,
  GET_NEW_ANIMAL_LIST_WITH_FILTERS,
  GET_OVERVIEW_MEDIA_FILES,
  GET_PATIENT_DISCHARGE_SUMMARY,
  GET_PATIENT_MEDIA,
  GET_PATIENT_VISIT_SUMMARY,
  GET_SPECIES_FOR_HOSPITAL,
  UPLOAD_PATIENT_MEDIA,
  UPDATE_ANIMAL_HEALTH_STATUS,
  DOWNLOAD_DISCHARGE_LISTINGS,
  DOWNLOAD_MORTALITY_LISTINGS,
  DOWNLOAD_FOLLOWUP_LISTINGS
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  InpatientListParams,
  InpatientListResponse,
} from 'src/types/hospital'
import { TotalVisitParams, TotalVisitsResponse } from 'src/types/hospital/api/Inpatient/visitHistory';
import { GetHospitalVisitSummaryPayload, GetHospitalVisitSummaryResponse, GetPatientMediaResponse } from 'src/types/hospital/api/Inpatient/patientMedia';
import { PatientMediaParams, PatientMediaResponse, UploadPatientMediaParams, UploadPatientMediaResponse } from 'src/types/hospital/api/Media/media';
import { DeleteApiResponse } from 'src/types/hospital/api';
import { DownloadResponse } from 'src/types/hospital/api/Download/export';
import { DownloadDischargeParams } from 'src/types/hospital/api/Discharge/discharge';
import { ZooWiseSiteListParams, ZooWiseSiteListResponse } from 'src/types/hospital/api/ZooWiseSitelists/siteLists';

export const updateAnimalHealthStatus = async (
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${UPDATE_ANIMAL_HEALTH_STATUS}`, body: payload })

  return response?.data
}

export const addHospitalPatient = async (
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${ADD_HOSPITAL_PATIENT}`, body: payload })

  return response?.data
}

export const getAnimalTotalHospitalVisits = async (
  params: TotalVisitParams
): Promise<TotalVisitsResponse> => {
  const response = await axiosGet({ url: `${GET_ANIMAL_TOTAL_HOSPITAL_VISIT}`, params })

  return response?.data
}

export const editAnimalAdmissionDetails = async (
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${EDIT_PATIENT_DETAILS}`, body: payload })

  return response?.data
}

export const getNewAnimalListWithFilters = async (params: Record<string, unknown>): Promise<any> => {
  const response = await axiosPost({ url: `${GET_NEW_ANIMAL_LIST_WITH_FILTERS}`, body: params })

  return response?.data
}

export const getAllSpeciesListForHospital = async (
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosPost({ url: `${GET_SPECIES_FOR_HOSPITAL}`, body: params })

  return response?.data
}

export async function getOverviewMediaItems({
  id
}: {
  id: string | number
}): Promise<GetPatientMediaResponse> {
  const response = await axiosGet({ url: `${GET_OVERVIEW_MEDIA_FILES}/${id}` })

  return response?.data
}

export async function getPatientsMortalityListings(
  params: InpatientListParams
): Promise<InpatientListResponse> {
  const response = await axiosGet({ url: `${GET_MORTALITY_PATIENTS_LISTS}`, params })

  return response?.data
}

export async function getFollowUpPatientsListings(
  params: InpatientListParams
): Promise<InpatientListResponse> {
  const response = await axiosGet({ url: `${GET_FOLLOWUP_PATIENTS_LISTS}`, params })

  return response?.data
}

export async function getPatientDischargeSummary(
  params: GetHospitalVisitSummaryPayload
): Promise<GetHospitalVisitSummaryResponse> {
  const response = await axiosGet({ url: `${GET_PATIENT_DISCHARGE_SUMMARY}`, params })

  return response?.data
}

export async function getPatientVisitSummary(
  params: GetHospitalVisitSummaryPayload
): Promise<GetHospitalVisitSummaryResponse> {
  const response = await axiosGet({ url: `${GET_PATIENT_VISIT_SUMMARY}`, params })

  return response?.data
}

export async function getZooWiseSiteLists(params: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${GET_ALL_SITE_LIST_WITHOUT_PERMISSION}`, params })

  return response?.data
}

export async function getPatientMedia(params: PatientMediaParams): Promise<PatientMediaResponse> {
  const response = await axiosGet({ url: `${GET_PATIENT_MEDIA}`, params })

  return response?.data
}

export async function uploadPatientMedia(
  payload: UploadPatientMediaParams
): Promise<UploadPatientMediaResponse> {
  try {
    const response = await axiosFormPost({ url: `${UPLOAD_PATIENT_MEDIA}`, body: payload })

    return response?.data
  } catch (error) {
    const err = error as { response?: { data?: unknown; status?: number; headers?: unknown } }

    if (err.response) {
      console.error('Request made and server responded')
      console.error(err.response.data)
      console.error(err.response.status)
      console.error(err.response.headers)
    }

    throw error
  }
}

export async function deletePatientMedia(mediaId: string | number): Promise<DeleteApiResponse> {
  try {
    if (!mediaId) throw new Error('Media ID is required')

    const url = `${DELETE_CLINICAL_NOTES}${mediaId}`
    const response = await axiosPost({ url, body: {} })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error deleting patient media:', err?.message || err)
    throw error
  }
}

export async function downloadDischargeListings(
  params: DownloadDischargeParams
): Promise<DownloadResponse> {
  try {
    const response = await axiosGet({ url: `${DOWNLOAD_DISCHARGE_LISTINGS}`, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error(err?.message)
    throw error
  }
}

export async function downloadMortalityListings(
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosGet({ url: `${DOWNLOAD_MORTALITY_LISTINGS}`, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error(err?.message)
    throw error
  }
}

export async function downloadFollowUpListings(
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosGet({ url: `${DOWNLOAD_FOLLOWUP_LISTINGS}`, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error(err?.message)
    throw error
  }
}
