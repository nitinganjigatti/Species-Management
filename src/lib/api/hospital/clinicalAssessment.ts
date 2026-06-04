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
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'
import { CheckAnimalStatusByTypePayload, CheckAnimalStatusByTypeResponse, CreateUpdateTemplatePayload, CreateUpdateTemplateResponse, DeleteNotesPayload, DeleteNotesResponse, GetSymptomClinicalTabPayload, GetSymptomClinicalTabResponse, GetTemplatePayload, GetTemplateResponse, UpdateNotesPayload, UpdateNotesResponse } from 'src/types/hospital/api/Inpatient/symptomClinical';
import { CheckAnimalStatusByType } from 'src/types/hospital/models/symptoms';
import { GetClinicalAssessmentCardParams, GetClinicalAssessmentCardResponse,  GetClinicalAssessmentListParams,  GetClinicalAssessmentListResponse,  GetClinicalAssmntRecordParams, GetClinicalAssmntRecordResponse, UpdateClinicalAssmntParams, UpdateClinicalAssmntResponse } from 'src/types/hospital/api/Inpatient/clinicalAsmnt';

export async function getClinicalAssessments(
  params: GetClinicalAssessmentCardParams & { animal_id: string | number }
): Promise<GetClinicalAssessmentCardResponse> {
  try {
    const url = `${GET_CLINICAL_ASSESSMENTS}${params.animal_id}/get-medical-common-data-v2`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getDiagnosisList(params: GetSymptomClinicalTabPayload): Promise<GetSymptomClinicalTabResponse> {
  try {
    const url = GET_CLINICAL_DIAGNOSIS_LIST
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getDiagnosysType(params: GetClinicalAssessmentListParams): Promise<GetClinicalAssessmentListResponse> {
  try {
    const url = GET_CLINICAL_DIAGNOSIS_TYPE
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function addClinicalAssessment(
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosFormPost({ url: `${ADD_CLINICAL_ASSESSMENT}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding clinical note:', err.message)

    return { success: false, message: err.message }
  }
}

export async function updateClinicalAssessment(
  payLoad: UpdateClinicalAssmntParams
): Promise<UpdateClinicalAssmntResponse> {
  try {
    const response = await axiosPost({ url: `${UPDATE_NOTES}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding clinical note:', err.message)

    return { success: false, message: err.message }
  }
}

export async function checkAnimalStatusByType(
  payLoad: CheckAnimalStatusByTypePayload
): Promise<CheckAnimalStatusByTypeResponse> {
  try {
    const response = await axiosPost({ url: `${GET_ANIMAL_STATUS_BY_TYPE}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding clinical note:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getNotes(params: GetClinicalAssmntRecordParams): Promise<GetClinicalAssmntRecordResponse>{
  try {
    const url = GET_NOTES

    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function updateNotes(params: UpdateNotesPayload): Promise<UpdateNotesResponse> {
  try {
    const url = UPDATE_NOTES

    const response = await axiosPost({ url, body: params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export const deleteNote = async (
  noteId: string | number,
  params: DeleteNotesPayload
): Promise<DeleteNotesResponse> => {
  try {
    const response = await axiosGet({ url: `${DELETE_NOTE_CLINICAL_ASSESSMENT}/${noteId}`, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicalTemplates(params: GetTemplatePayload): Promise<GetTemplateResponse> {
  try {
    const response = await axiosGet({ url: GET_MEDICAL_TEMPLATE, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical templates:', err.message)

    return { success: false, message: err.message }
  }
}

export async function createMedicalTemplate(
  payload: CreateUpdateTemplatePayload
): Promise<CreateUpdateTemplateResponse> {
  try {
    const response = await axiosPost({ url: CREATE_MEDICAL_TEMPLATE, body: payload })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error creating medical template:', err.message)

    return { success: false, message: err.message }
  }
}

export async function updateMedicalTemplate(
  id: string | number,
  payload: CreateUpdateTemplatePayload
): Promise<CreateUpdateTemplateResponse> {
  try {
    const response = await axiosPost({ url: `${UPDATE_MEDICAL_TEMPLATE}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error updating medical template:', err.message)

    return { success: false, message: err.message }
  }
}

export async function deleteMedicalTemplate(id: string | number): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosPost({ url: `${DELETE_MEDICAL_TEMPLATE}/${id}`, body: {} })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error deleting medical template:', err.message)

    return { success: false, message: err.message }
  }
}
