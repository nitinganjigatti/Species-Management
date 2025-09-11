import { ADMIT_HOSPITAL_PATIENT, GET_HOSPITAL_PATIENTS_LISTS, GET_PATIENTS_DETAILS } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export const getIncomingPatients = async params => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_PATIENTS_LISTS}`, params })

  return response?.data
}

export const getPatientDetails = async id => {
  const response = await axiosGet({ url: `${GET_PATIENTS_DETAILS}${id}` })

  return response?.data
}

export const admitHospitalPatient = async params => {
  const response = await axiosFormPost({ url: `${ADMIT_HOSPITAL_PATIENT}`, body: params })

  return response?.data
}
