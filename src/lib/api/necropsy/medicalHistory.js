import {
  GET_MEDICAL_BASIC_DATA_LIST,
  GET_MEDICAL_RECORD_DETAILS,
  GET_CLINICAL_ASSESSMENTS,
  GET_LAB_REQUESTS_BY_ANIMAL,
  GET_ASSESSMENT_ANIMAL_TYPES,
  GET_ASSESSMENT_ANIMAL_DATA,
  ANIMAL_JOURNAL_LOGS
} from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getMedicalBasicDataList(animalId, params) {
  try {
    const url = `${GET_MEDICAL_BASIC_DATA_LIST}${animalId}/basic-data-list`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical basic data list:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getMedicalCommonData(animalId, params) {
  try {
    const url = `${GET_CLINICAL_ASSESSMENTS}${animalId}/get-medical-common-data-v2`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical common data:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getLabRequestsByAnimal(params) {
  try {
    const url = GET_LAB_REQUESTS_BY_ANIMAL
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching lab requests:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getAssessmentTypes(animalId) {
  try {
    const url = `${GET_ASSESSMENT_ANIMAL_TYPES}/${animalId}`
    const response = await axiosGet({ url })

    return response?.data
  } catch (error) {
    console.error('Error fetching assessment types:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getAssessmentData(animalId, params) {
  try {
    const url = `${GET_ASSESSMENT_ANIMAL_DATA}/${animalId}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching assessment data:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getMedicalRecordDetails(medicalRecordId) {
  try {
    const url = GET_MEDICAL_RECORD_DETAILS
    const response = await axiosGet({ url, params: { medical_record_id: medicalRecordId, include_all_animals: 0 } })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical record details:', error.message)

    return { success: false, message: error.message }
  }
}

export async function getMedicalJournalLogs(params) {
  try {
    const url = ANIMAL_JOURNAL_LOGS
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical journal logs:', error.message)

    return { success: false, message: error.message }
  }
}
