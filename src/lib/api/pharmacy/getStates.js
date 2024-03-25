import { STATES } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStates({ params }) {
  const response = await axiosGet({ url: STATES, params: params, pharmacy: true })

  return response.data
}

export async function addState(payload) {
  try {
    const url = `${STATES}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

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

export async function getStateById(id) {
  const response = await axiosGet({ url: `${STATES}/${id}/show`, pharmacy: true })

  return response?.data
}

export async function updateStates(id, payload) {
  try {
    const url = `${STATES}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
