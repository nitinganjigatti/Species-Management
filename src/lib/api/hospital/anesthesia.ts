import {
  GET_ASSESSMENT_LIST_ANESTHESIA,
  ADD_ANESTHESIA,
  GET_ANESTHESIA_SETUP_LIST,
  MEDICAL_MASTER_DATA,
  GET_MEDICAL_DELIVERY_ROUTE,
  GET_VITAL_MONITORING_LIST,
  GET_ANESTHESIA_DETAIL,
  GET_ANESTHESIA_LIST,
  DELETE_ANESTHESIA,
  GET_ANESTHESIA_MEDICATION,
  DELETE_VITAL_MONITORING,
  DELETE_ANESTHESIA_MEDICATION,
  MEDICINE_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  AnesthesiaListParams,
  AnesthesiaListResponse,
  MedicineListParams,
  MedicineListResponse
} from 'src/types/hospital'
import { AddAnesthesiaParams, AddAnesthesiaResponse, AnesthesiaAssessmentTypeParams, AnesthesiaAssessmentTypeResponse,AnesthesiaRecordsParams, AnesthesiaRecordsResponse, AnesthesiaSetUpListResponse, AnesthesiaSetupParams, DeleteAnesthesiaMedicationParams, DeleteAnesthesiaResponse, DeleteVitalMonitoringParams, DeliveryRouteResponse, GetAnesthesiaDetailParams, GetAnesthesiaDetailResponse, UpdateMedicationParams, VitalMonitoringParams, VitalMonitoringResponse, AnesthesiaDetailResponse } from 'src/types/hospital/api/Anesthesia/anesthesia';
import { DeleteApiResponse, UpdateDeleteApiResponse } from 'src/types/hospital/api';
import { GetMedicineListParams, GetMedicineListResponse } from 'src/types/hospital/api/PrescriptionMonitoring/medicineBatch';
import { GetMedicalMasterDataResponse } from 'src/types/hospital/api/PrescriptionMonitoring/prescription';

export const getAssesmentList = async (params: AnesthesiaAssessmentTypeParams): Promise<AnesthesiaAssessmentTypeResponse> => {
  const response = await axiosGet({ url: `${GET_ASSESSMENT_LIST_ANESTHESIA}`, params })

  return response?.data
}

export const addAnesthesia = async (
  payload: AddAnesthesiaParams | FormData
): Promise<AddAnesthesiaResponse> => {
  const response = await axiosFormPost({ url: `${ADD_ANESTHESIA}`, body: payload })

  return response?.data
}

export const getAnesthesiaSetupList = async (
  params: AnesthesiaSetupParams
): Promise<AnesthesiaSetUpListResponse> => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_SETUP_LIST}`, params })

  return response?.data
}

export const getUnitList = async (params: Record<string, unknown>): Promise<GetMedicalMasterDataResponse> => {
  const response = await axiosGet({ url: `${MEDICAL_MASTER_DATA}`, params })

  return response?.data
}

export const deliveryRouteList = async (): Promise<DeliveryRouteResponse> => {
  const response = await axiosGet({ url: `${GET_MEDICAL_DELIVERY_ROUTE}`})

  return response?.data
}

export const getvitalMonitoringList = async (
  params: VitalMonitoringParams
): Promise<VitalMonitoringResponse> => {
  const response = await axiosGet({ url: `${GET_VITAL_MONITORING_LIST}`, params })

  return response?.data
}

export const getAnesthesiaDetails = async (
  id: string | number,
  params?: Partial<GetAnesthesiaDetailParams>
): Promise<GetAnesthesiaDetailResponse> => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_DETAIL}/${id}`, params })

  return response?.data
}

export const getAnesthesiaList = async ({
  params
}: {
  params: AnesthesiaRecordsParams
}): Promise<AnesthesiaRecordsResponse> => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_LIST}`, params })

  return response?.data
}

export const getAnesthesiaDetail = async (id: string | number): Promise<AnesthesiaDetailResponse> => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_DETAIL}/${id}` })

  return response?.data
}

export const deleteAnesthesia = async (id: string | number): Promise<DeleteAnesthesiaResponse> => {
  const response = await axiosPost({ url: `${DELETE_ANESTHESIA}/${id}`, body: {} })

  return response?.data
}

export const updateMedication = async (
  payload: UpdateMedicationParams
): Promise<UpdateDeleteApiResponse> => {
  const response = await axiosFormPost({ url: `${GET_ANESTHESIA_MEDICATION}`, body: payload })

  return response?.data
}

export const deleteAnesthesiaMedication = async (
  payload: DeleteAnesthesiaMedicationParams
): Promise<DeleteApiResponse> => {
  const response = await axiosPost({ url: `${DELETE_ANESTHESIA_MEDICATION}`, body: payload })

  return response?.data
}

export const deleteVitalMonitoring = async (
  payload: DeleteVitalMonitoringParams
): Promise<DeleteApiResponse> => {
  const response = await axiosPost({ url: `${DELETE_VITAL_MONITORING}`, body: payload })

  return response?.data
}

export async function getMedicineProductList({
  params
}: {
  params: GetMedicineListParams
}): Promise<GetMedicineListResponse> {
  const response = await axiosGet({ url: `${MEDICINE_LIST}`, params, pharmacy: true })

  return response.data
}
