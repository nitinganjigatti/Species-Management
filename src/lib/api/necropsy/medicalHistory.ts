import {
  GET_MEDICAL_BASIC_DATA_LIST,
  GET_MEDICAL_RECORD_DETAILS,
  GET_CLINICAL_ASSESSMENTS,
  GET_LAB_REQUESTS_BY_ANIMAL,
  GET_ASSESSMENT_ANIMAL_TYPES,
  GET_ASSESSMENT_ANIMAL_DATA,
  ANIMAL_JOURNAL_LOGS,
  GET_MEDICAL_STATS
} from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'
import type {
  MedicalRecordStatsParams,
  MedicalRecordStatsResponse,
  MedicalBasicDataListParams,
  MedicalBasicDataListResponse,
  MedicalCommonDataParams,
  MedicalCommonDataResponse,
  LabRequestsByAnimalParams,
  LabRequestsByAnimalResponse,
  AssessmentTypesResponse,
  AssessmentDataParams,
  AssessmentDataResponse,
  MedicalRecordDetailsResponse,
  MedicalJournalLogsParams,
  MedicalJournalLogsResponse
} from 'src/types/necropsy'

export async function getMedicalRecordStats(params: MedicalRecordStatsParams): Promise<MedicalRecordStatsResponse> {
  try {
    const url = GET_MEDICAL_STATS
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical record stats:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicalBasicDataList(
  animalId: number,
  params?: MedicalBasicDataListParams
): Promise<MedicalBasicDataListResponse> {
  try {
    const url = `${GET_MEDICAL_BASIC_DATA_LIST}${animalId}/basic-data-list`
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical basic data list:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicalCommonData(
  animalId: number,
  params?: MedicalCommonDataParams
): Promise<MedicalCommonDataResponse> {
  try {
    const url = `${GET_CLINICAL_ASSESSMENTS}${animalId}/get-medical-common-data-v2`
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical common data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getLabRequestsByAnimal(params: LabRequestsByAnimalParams): Promise<LabRequestsByAnimalResponse> {
  try {
    const url = GET_LAB_REQUESTS_BY_ANIMAL
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching lab requests:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getAssessmentTypes(animalId: number): Promise<AssessmentTypesResponse> {
  try {
    const url = `${GET_ASSESSMENT_ANIMAL_TYPES}/${animalId}`
    const response = await axiosGet({ url, pharmacy: false, params: {} })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching assessment types:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getAssessmentData(
  animalId: number,
  params?: AssessmentDataParams
): Promise<AssessmentDataResponse> {
  try {
    const url = `${GET_ASSESSMENT_ANIMAL_DATA}/${animalId}`
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching assessment data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicalRecordDetails(medicalRecordId: number): Promise<MedicalRecordDetailsResponse> {
  try {
    const url = GET_MEDICAL_RECORD_DETAILS

    const response = await axiosGet({
      url,
      params: { medical_record_id: medicalRecordId, include_all_animals: 0 },
      pharmacy: false
    })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical record details:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicalJournalLogs(params: MedicalJournalLogsParams): Promise<MedicalJournalLogsResponse> {
  try {
    const url = ANIMAL_JOURNAL_LOGS
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical journal logs:', err.message)

    return { success: false, message: err.message }
  }
}
