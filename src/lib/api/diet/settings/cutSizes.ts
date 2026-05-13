import { ADD_CUT_SIZE, GET_CUT_SIZEBY_ID, CUT_SIZE, UPDATE_CUT_SIZE } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getCutsizeList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${CUT_SIZE}`, params })

  return response.data
}

export async function addCutSize(payload?: Record<string, any>): Promise<any> {
  try {
    const url = `${ADD_CUT_SIZE}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getCutSizeById(id: string | number): Promise<any> {
  const response = await axiosGet({ url: `${GET_CUT_SIZEBY_ID}?id=${id}` })

  return response.data
}

export async function UpdateCutsize(id: string | number, payload?: Record<string, any>): Promise<any> {
  try {
    const url = `${UPDATE_CUT_SIZE}/${id}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
