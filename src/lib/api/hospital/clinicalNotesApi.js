import {
  ANIMAL_MEDICAL_ID_LIST,
  CREATE_CLINICAL_NOTES,
  DELETE_CLINICAL_NOTES,
  GET_CLINICAL_NOTES
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getClinicalNotes({ animalId, params }) {
  try {
    if (!animalId) throw new Error('Animal Id is required')

    const url = `${ANIMAL_MEDICAL_ID_LIST}${animalId}/${GET_CLINICAL_NOTES}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error?.message || error)
  }
}

export async function deleteClinicalNotes(noteId) {
  try {
    if (!noteId) throw new Error('Note Id is required')

    const url = `${DELETE_CLINICAL_NOTES}/${noteId}`
    const response = await axiosPost({ url })

    return response?.data
  } catch (error) {
    console.error('Error deleting clinical note:', error?.message || error)
  }
}

export async function addClinicalNotes({ payload }) {
  try {
    const response = await axiosFormPost({ url: `${CREATE_CLINICAL_NOTES}`, body: payload })

    return response?.data
  } catch (error) {
    console.error('Error adding clinical note:', error?.message || error)
  }
}
