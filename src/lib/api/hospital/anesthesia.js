import { GET_ASSESSMENT_LIST_ANESTHESIA, ADD_ANESTHESIA, GET_ANESTHESIA_SETUP_LIST } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export const getAssesmentList = async params => {
  const response = await axiosGet({ url: `${GET_ASSESSMENT_LIST_ANESTHESIA}`, params })

  return response?.data
}

export const addAnesthesia = async payload => {
  const response = await axiosFormPost({ url: `${ADD_ANESTHESIA}`, body: payload })

  return response?.data
}

export const getAnesthesiaSetupList = async params => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_SETUP_LIST}`, params })

  return response?.data
}

//   export const updateSymptoms = async payload => {
//     const response = await axiosFormPost({ url: `${ANIMAL_MEDICAL_ID_LIST}/${UPDATE_HOSPITAL_SYMPTOMS}`, body: payload })

//     return response?.data
//   }

//   export const getNotesListForSymptom = async payload => {
//     const response = await axiosPost({ url: `${ANIMAL_MEDICAL_ID_LIST}${GET_ACTIVITY_LIST}`, body: payload })

//     return response?.data
//   }

//   export const deleteNoteSymptoms = async (noteId, params) => {
//     const response = await axiosGet({ url: `${DELETE_NOTE_SYMPTOM}/${noteId}`, params })

//     return response?.data
//   }
