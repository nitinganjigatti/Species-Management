import { AddLAB, GetLab, AllLabSample } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function addLab(payload) {
  try {
    const url = `${AddLAB}`
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

export async function getLabList({ params }) {
  const response = await axiosGet({ url: `${GetLab}`, params })

  return response.data
}

export async function getAllLabSample({ params }) {
  const response = await axiosGet({ url: `${AllLabSample}`, params })

  return response.data
}
