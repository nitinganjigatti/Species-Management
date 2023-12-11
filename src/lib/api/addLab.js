import { LAB } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function addLab(payload) {
  try {
    const url = `${LAB}`
    var data = payload
    const response = await axiosPost({ url, body: data })

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
