import {
  GET_ASSESSMENT_LIST_ANESTHESIA,
  ADD_ANESTHESIA,
  GET_ANESTHESIA_SETUP_LIST,
  MEDICAL_MASTER_DATA,
  GET_MEDICAL_DELIVERY_ROUTE,
  GET_VITAL_MONITORING_LIST,
  GET_ANESTHESIA_DETAIL
} from 'src/constants/ApiConstant'
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

export const getUnitList = async params => {
  const response = await axiosGet({ url: `${MEDICAL_MASTER_DATA}`, params })

  return response?.data
}

export const deliveryRouteList = async params => {
  const response = await axiosGet({ url: `${GET_MEDICAL_DELIVERY_ROUTE}`, params })

  return response?.data
}

export const getvitalMonitoringList = async params => {
  const response = await axiosGet({ url: `${GET_VITAL_MONITORING_LIST}`, params })

  return response?.data
}

export const getAnesthesiaDetails = async (id, params) => {
  const response = await axiosGet({ url: `${GET_ANESTHESIA_DETAIL}/${id}`, params })

  return response?.data
}
