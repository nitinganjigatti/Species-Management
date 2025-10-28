import {
  ADD_DIRECT_ADMINISTER_PRESCRIPTION,
  ADD_PRESCRIPTION,
  GET_PRESCRIPTION_DETAILS,
  GET_PRESCRIPTION_DETAILS_DATES,
  GET_PRESCRIPTION_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addPrescription(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADD_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function addDirectAdministerPrescription(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADD_DIRECT_ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function getPrescriptions(params) {
  try {
    const url = GET_PRESCRIPTION_LIST
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getPrescriptionDetails(params) {
  try {
    const url = GET_PRESCRIPTION_DETAILS
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getDates(params) {
  try {
    const url = GET_PRESCRIPTION_DETAILS_DATES
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}
