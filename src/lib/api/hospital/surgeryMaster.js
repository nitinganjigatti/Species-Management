import {
  GET_MASTERS_SURGERY,
  CREATE_MASTERS_SURGERY,
  UPDATE_MASTERS_SURGERY,
  DELETE_MASTERS_SURGERY,
  ADD_SURGERY_RECORD,
  CHANGE_MASTERS_SURGERY_STATUS,
  LIST_SURGERY_TEMPLATES,
  CREATE_SURGERY_TEMPLATE
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

export const addSurgeryRecord = async payload => {
  const response = await axiosFormPost({ url: ADD_SURGERY_RECORD, body: payload })

  return response?.data
}

export const getSurgeryTemplates = async params => {
  const response = await axiosGet({ url: LIST_SURGERY_TEMPLATES, params })

  return response?.data
}

export const createSurgeryTemplate = async payload => {
  const response = await axiosFormPost({ url: CREATE_SURGERY_TEMPLATE, body: payload })

  return response?.data
}
