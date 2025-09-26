import {
  ADD_CLINICAL_ASSESSMENT,
  GET_CLINICAL_ASSESSMENTS,
  GET_CLINICAL_DIAGNOSIS_LIST,
  GET_CLINICAL_DIAGNOSIS_TYPE,
  GET_NOTES,
  UPDATE_CLINICAL_ASSESSMENT,
  UPDATE_NOTES
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getClinicalAssessments(params) {
  try {
    const url = `${GET_CLINICAL_ASSESSMENTS}${params.animal_id}/get-medical-common-data-v2`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getDiagnosisList(params) {
  try {
    const url = GET_CLINICAL_DIAGNOSIS_LIST
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getDiagnosysType(params) {
  try {
    const url = GET_CLINICAL_DIAGNOSIS_TYPE
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function addClinicalAssessment(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADD_CLINICAL_ASSESSMENT}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding clinical note:', error.message)
  }
}

export async function updateClinicalAssessment(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${UPDATE_CLINICAL_ASSESSMENT}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding clinical note:', error.message)
  }
}

export async function getNotes(params) {
  try {
    const url = GET_NOTES

    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function updateNotes(params) {
  try {
    const url = UPDATE_NOTES

    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}
