import { ADD_DISCHARGE, NECROPSY_CENTER } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function addInpatientDischarge(payload) {
  const response = await axiosFormPost({ url: `${ADD_DISCHARGE}`, body: payload })

  return response?.data
}

export async function getNecropsyCenter(params) {
  const response = await axiosGet({ url: `${NECROPSY_CENTER}`, params })

  return response?.data
}
