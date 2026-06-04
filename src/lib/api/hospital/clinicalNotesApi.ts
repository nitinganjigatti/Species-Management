import {
  ANIMAL_MEDICAL_ID_LIST,
  CREATE_CLINICAL_NOTES,
  DELETE_CLINICAL_NOTES,
  GET_CLINICAL_NOTES
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import { AddClinicalNotesParams, AddClinicalNotesResponse, DeleteClinicalNotesResponse, GetClinicalNotesResponse } from 'src/types/hospital/api/ClinicalNotes/clinicalNotes';
import { ClinicalNotesParams } from 'src/types/hospital/models/clinicalNotes';

export async function getClinicalNotes({
  animalId,
  params
}: {
  animalId: string | number
  params?: ClinicalNotesParams
}): Promise<GetClinicalNotesResponse> {
  try {
    if (!animalId) throw new Error('Animal Id is required')

    const url = `${ANIMAL_MEDICAL_ID_LIST}${animalId}/${GET_CLINICAL_NOTES}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err?.message || err)

    return { success: false, message: err?.message || String(err) }
  }
}

export async function deleteClinicalNotes(noteId: string | number): Promise<DeleteClinicalNotesResponse> {
  try {
    if (!noteId) throw new Error('Note Id is required')

    const url = `${DELETE_CLINICAL_NOTES}/${noteId}`
    const response = await axiosPost({ url, body: {} })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error deleting clinical note:', err?.message || err)

    return { success: false, message: err?.message || String(err) }
  }
}

export async function addClinicalNotes({
  payload
}: {
  payload: AddClinicalNotesParams
}): Promise<AddClinicalNotesResponse> {
  try {
    const response = await axiosFormPost({ url: `${CREATE_CLINICAL_NOTES}`, body: payload })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding clinical note:', err?.message || err)

    return { success: false, message: err?.message || String(err) }
  }
}
