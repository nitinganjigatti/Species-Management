import {
  ADD_PREPARATION_TYPE,
  GET_PREPARATION_TYPEBY_ID,
  PREPARATION_LIST,
  UPDATE_PREPARATION_TYPE
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getPreparationTypeList(params) {
  const response = await axiosGet({ url: `${PREPARATION_LIST}`, params })

  return response.data
}

export async function addPreparationType(payload) {
  try {
    const url = `${ADD_PREPARATION_TYPE}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getPreparationTypeById(id) {
  const response = await axiosGet({ url: `${GET_PREPARATION_TYPEBY_ID}/${id}` })

  return response.data
}

export async function UpdatePreparationType(id, payload) {
  try {
    const url = `${UPDATE_PREPARATION_TYPE}/${id}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
