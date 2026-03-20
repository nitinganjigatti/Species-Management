import {
  MEDICAL_RECORD_REPORT,
  MEDICAL_BASE_URL,
  GET_ANIMAL_RECORDS,
  GET_MEDICAL_RECORDS_BY_FILTER
} from 'src/constants/medical-module/medicalApiConstants'
import { axiosGet } from '../utility'
import type { MedicalRecordsParams, MedicalRecordFilterParams, MedicalReportParams, ApiResponse } from 'src/types/medical'

export const getMedicalRecordsByAnimal = async (
  animalId: string | number,
  params: MedicalRecordsParams
): Promise<ApiResponse> => {
  const response = await axiosGet({
    url: `${MEDICAL_BASE_URL}${animalId}/${GET_ANIMAL_RECORDS}`,
    params,
    pharmacy: false
  })

  return response?.data
}

export const getMedicalRecordsByFilter = async (
  params: MedicalRecordFilterParams
): Promise<ApiResponse> => {
  const response = await axiosGet({
    url: GET_MEDICAL_RECORDS_BY_FILTER,
    params,
    pharmacy: false
  })

  return response?.data
}

export const getMedicalRecordReport = async (params: MedicalReportParams): Promise<ApiResponse> => {
  const response = await axiosGet({ url: `${MEDICAL_RECORD_REPORT}`, params, pharmacy: false })

  return response?.data
}
