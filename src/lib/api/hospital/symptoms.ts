import {
  GET_CLINICAL_NOTES,
  ANIMAL_MEDICAL_ID_LIST,
  GET_SYMPTOM_LISTING,
  ADD_HOSPITAL_SYMPTOMS,
  UPDATE_NOTES,
  GET_ACTIVITY_LIST,
  DELETE_NOTE_SYMPTOM
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, SymptomListParams, SymptomListResponse } from 'src/types/hospital'
import { DeleteSymptomNotesResponse, GetSymptomRecordResponse, GetSymptomRecordPayload, UpdateSymptomsCardResponse, UpdateSymptomsCardPayload, AddSymptomsCardResponse, AddSymptomsCardParams, GetSymptomsListForAddingResponse, GetSymptomsListForAddingParams } from 'src/types/hospital/api/Inpatient/symptoms';
import { GetSymptomsCardParams, GetSymptomsCardResponse } from 'src/types/hospital/api/Inpatient/symptoms';


export const getSymptomsList = async (
  animalId: string | number,
  params: GetSymptomsCardParams
): Promise<GetSymptomsCardResponse> => {
  const response = await axiosGet({
    url: `${ANIMAL_MEDICAL_ID_LIST}${animalId}/${GET_CLINICAL_NOTES}`,
    params
  })

  return response?.data
}

export const getSymptomsListForAdding = async (
  params: GetSymptomsListForAddingParams
): Promise<GetSymptomsListForAddingResponse> => {
  const response = await axiosGet({ url: `${GET_SYMPTOM_LISTING}`, params })

  return response?.data
}

export const addSymptoms = async (
  payload: FormData | AddSymptomsCardParams
): Promise<AddSymptomsCardResponse> => {
  const response = await axiosFormPost({ url: `${ADD_HOSPITAL_SYMPTOMS}`, body: payload })

  return response?.data
}

export const updateSymptoms = async (
  payload: UpdateSymptomsCardPayload
): Promise<UpdateSymptomsCardResponse> => {
  const response = await axiosFormPost({ url: `${UPDATE_NOTES}`, body: payload })

  return response?.data
}

export const getNotesListForSymptom = async (
  payload: GetSymptomRecordPayload
): Promise<GetSymptomRecordResponse> => {
  const response = await axiosPost({ url: `${ANIMAL_MEDICAL_ID_LIST}${GET_ACTIVITY_LIST}`, body: payload })

  return response?.data
}

export const deleteNoteSymptoms = async (
  noteId: string | number,
  params?: Record<string, unknown>
): Promise<DeleteSymptomNotesResponse> => {
  const response = await axiosGet({ url: `${DELETE_NOTE_SYMPTOM}/${noteId}`, params })

  return response?.data
}
