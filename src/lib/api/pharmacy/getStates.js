import { STATES } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStates() {
  const response = await axiosGet({ url: STATES })
  if (response?.status == 200 && response?.data?.success) {
    return response.data.data
  } else {
    return []
  }
}

export async function addState(payload) {
  try {
    const url = `${STATES}`
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

export async function getStateById(id) {
  const response = await axiosGet({ url: `${STATES}/${id}/show` })

  return response?.data
}

export async function updateStates(id, payload) {
  try {
    const url = `${STATES}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data })

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
