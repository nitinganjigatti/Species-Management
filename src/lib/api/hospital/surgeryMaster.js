import {
  GET_MASTERS_SURGERY,
  CREATE_MASTERS_SURGERY,
  UPDATE_MASTERS_SURGERY,
  DELETE_MASTERS_SURGERY
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export const getSurgeryMaster = async ({ params }) => {
  const response = await axiosGet({ url: GET_MASTERS_SURGERY, params })

  return response?.data
}

export const addSurgeryMaster = async payload => {
  const response = await axiosFormPost({ url: CREATE_MASTERS_SURGERY, body: payload })

  return response?.data
}

export const updateSurgeryMaster = async (id, payload) => {
  const response = await axiosFormPost({ url: `${UPDATE_MASTERS_SURGERY}/${id}`, body: payload })

  return response?.data
}

export const changeSurgeryMasterStatus = async (id, payload) => {
  const response = await axiosFormPost({ url: `${CHANGE_MASTERS_SURGERY_STATUS}/${id}`, body: payload })

  return response?.data
}

export const deleteSurgeryMaster = async id => {
  const response = await axiosFormPost({ url: `${DELETE_MASTERS_SURGERY}/${id}` })

  return response?.data
}
