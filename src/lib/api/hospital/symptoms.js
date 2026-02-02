import {
  GET_CLINICAL_NOTES,
  ANIMAL_MEDICAL_ID_LIST,
  GET_SYMPTOM_LISTING,
  ADD_HOSPITAL_SYMPTOMS,
  UPDATE_NOTES,
  GET_ACTIVITY_LIST,
  DELETE_NOTE_SYMPTOM
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export const getSymptomsList = async (animalId, params) => {
  const response = await axiosGet({ url: `${ANIMAL_MEDICAL_ID_LIST}${animalId}/${GET_CLINICAL_NOTES}`, params })

  return response?.data
}

export const getSymptomsListForAdding = async params => {
  const response = await axiosGet({ url: `${GET_SYMPTOM_LISTING}`, params })

  return response?.data
}

export const addSymptoms = async payload => {
  const response = await axiosFormPost({ url: `${ADD_HOSPITAL_SYMPTOMS}`, body: payload })

  return response?.data
}

export const updateSymptoms = async payload => {
  const response = await axiosFormPost({ url: `${UPDATE_NOTES}`, body: payload })

  return response?.data
}

export const getNotesListForSymptom = async payload => {
  const response = await axiosPost({ url: `${ANIMAL_MEDICAL_ID_LIST}${GET_ACTIVITY_LIST}`, body: payload })

  return response?.data
}

export const deleteNoteSymptoms = async (noteId, params) => {
  const response = await axiosGet({ url: `${DELETE_NOTE_SYMPTOM}/${noteId}`, params })

  return response?.data
}
