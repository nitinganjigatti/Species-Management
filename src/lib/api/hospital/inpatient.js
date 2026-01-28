import {
  ADD_HOSPITAL_PATIENT,
  EDIT_PATIENT_DETAILS,
  GET_ALL_SITE_LIST_WITHOUT_PERMISSION,
  GET_ANIMAL_TOTAL_HOSPITAL_VISIT,
  GET_FOLLOWUP_PATIENTS_LISTS,
  GET_MORTALITY_PATIENTS_LISTS,
  GET_NEW_ANIMAL_LIST_WITH_FILTERS,
  GET_OVERVIEW_MEDIA_FILES,
  GET_PATIENT_DISCHARGE_SUMMARY,
  GET_PATIENT_MEDIA,
  GET_PATIENT_VISIT_SUMMARY,
  GET_SPECIES_FOR_HOSPITAL,
  UPLOAD_PATIENT_MEDIA
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export const addHospitalPatient = async payload => {
  const response = await axiosFormPost({ url: `${ADD_HOSPITAL_PATIENT}`, body: payload })

  return response?.data
}

export const getAnimalTotalHospitalVisits = async params => {
  const response = await axiosGet({ url: `${GET_ANIMAL_TOTAL_HOSPITAL_VISIT}`, params })

  return response?.data
}

export const editAnimalAdmissionDetails = async payload => {
  const response = await axiosFormPost({ url: `${EDIT_PATIENT_DETAILS}`, body: payload })

  return response?.data
}

export const getNewAnimalListWithFilters = async params => {
  const response = await axiosPost({ url: `${GET_NEW_ANIMAL_LIST_WITH_FILTERS}`, body: params })

  return response?.data
}

export const getAllSpeciesListForHospital = async params => {
  const response = await axiosPost({ url: `${GET_SPECIES_FOR_HOSPITAL}`, body: params })

  return response?.data
}

export async function getOverviewMediaItems({ id }) {
  const response = await axiosGet({ url: `${GET_OVERVIEW_MEDIA_FILES}/${id}` })

  return response?.data
}

export async function getPatientsMortalityListings(params) {
  const response = await axiosGet({ url: `${GET_MORTALITY_PATIENTS_LISTS}`, params })

  return response?.data
}

export async function getFollowUpPatientsListings(params) {
  const response = await axiosGet({ url: `${GET_FOLLOWUP_PATIENTS_LISTS}`, params })

  return response?.data
}

export async function getPatientDischargeSummary(params) {
  const response = await axiosGet({ url: `${GET_PATIENT_DISCHARGE_SUMMARY}`, params })

  return response?.data
}

export async function getPatientVisitSummary(params) {
  const response = await axiosGet({ url: `${GET_PATIENT_VISIT_SUMMARY}`, params })

  return response?.data
}

export async function getPatientMedia(params) {
  const response = await axiosGet({ url: `${GET_PATIENT_MEDIA}`, params })

  return response?.data
}

export async function uploadPatientMedia(payload) {
  try {
    const response = await axiosFormPost({ url: `${UPLOAD_PATIENT_MEDIA}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getZooWiseSiteLists(params) {
  const response = await axiosGet({ url: `${GET_ALL_SITE_LIST_WITHOUT_PERMISSION}`, params: params })

  return response?.data
}
