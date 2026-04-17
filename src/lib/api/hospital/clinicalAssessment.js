import {
  ADD_CLINICAL_ASSESSMENT,
  CREATE_MEDICAL_TEMPLATE,
  DELETE_MEDICAL_TEMPLATE,
  DELETE_NOTE_CLINICAL_ASSESSMENT,
  GET_ANIMAL_STATUS_BY_TYPE,
  GET_CLINICAL_ASSESSMENTS,
  GET_CLINICAL_DIAGNOSIS_LIST,
  GET_CLINICAL_DIAGNOSIS_TYPE,
  GET_MEDICAL_TEMPLATE,
  GET_NOTES,
  UPDATE_MEDICAL_TEMPLATE,
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
    const response = await axiosPost({ url: `${UPDATE_NOTES}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding clinical note:', error.message)
  }
}

export async function checkAnimalStatusByType(payLoad) {
  try {
    const response = await axiosPost({ url: `${GET_ANIMAL_STATUS_BY_TYPE}`, body: payLoad })

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

export const deleteNote = async (noteId, params) => {
  try {
    const url = UPDATE_NOTES
    const response = await axiosGet({ url: `${DELETE_NOTE_CLINICAL_ASSESSMENT}/${noteId}`, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getMedicalTemplates(params) {
  try {
    const response = await axiosGet({ url: GET_MEDICAL_TEMPLATE, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical templates:', error.message)
  }
}

export async function createMedicalTemplate(payload) {
  try {
    const response = await axiosPost({ url: CREATE_MEDICAL_TEMPLATE, body: payload })

    return response?.data
  } catch (error) {
    console.error('Error creating medical template:', error.message)
  }
}

export async function updateMedicalTemplate(id, payload) {
  try {
    const response = await axiosPost({ url: `${UPDATE_MEDICAL_TEMPLATE}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    console.error('Error updating medical template:', error.message)
  }
}

export async function deleteMedicalTemplate(id) {
  try {
    const response = await axiosPost({ url: `${DELETE_MEDICAL_TEMPLATE}/${id}`, body: {} })

    return response?.data
  } catch (error) {
    console.error('Error deleting medical template:', error.message)
  }
}
