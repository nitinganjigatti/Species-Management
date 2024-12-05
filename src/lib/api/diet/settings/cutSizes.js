import { ADD_CUT_SIZE, GET_CUT_SIZEBY_ID, CUT_SIZE, UPDATE_CUT_SIZE } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getCutsizeList(params) {
  const response = await axiosGet({ url: `${CUT_SIZE}`, params })

  return response.data
}

export async function addCutSize(payload) {
  try {
    const url = `${ADD_CUT_SIZE}`
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

export async function getCutSizeById(id) {
  const response = await axiosGet({ url: `${GET_CUT_SIZEBY_ID}?id=${id}` })

  return response.data
}

export async function UpdateCutsize(id, payload) {
  try {
    const url = `${UPDATE_CUT_SIZE}/${id}`
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
