import { RACK } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getRackList() {
  const response = await axiosGet({ url: RACK, pharmacy: true })

  return response.data.data
}

export async function getRackListById(id) {
  const response = await axiosGet({ url: `${RACK}/${id}/show`, pharmacy: true })

  return response.data
}

export async function addRackList(payload) {
  try {
    const url = `${RACK}`
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

export async function updateRackList(id, payload) {
  try {
    const url = `${RACK}/${id}/update`
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

export async function deleteRackItem(id) {
  const response = await axiosGet({ url: `${RACK}/${id}/delete`, pharmacy: true })

  return response?.data
}
