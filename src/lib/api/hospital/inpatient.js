import { ADD_HOSPITAL_PATIENT, EDIT_PATIENT_DETAILS, GET_ANIMAL_TOTAL_HOSPITAL_VISIT } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

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
