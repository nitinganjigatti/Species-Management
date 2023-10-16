import { STORE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getStoreList() {
  const response = await axiosGet({ url: STORE })

  return response.data.data
}

export async function getStoreById(id) {
  const response = await axiosGet({ url: `${STORE}/${id}/show` })

  return response.data
}

export async function addStore(payload) {
  try {
    const url = `${STORE}`
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

export async function updateStore(id, payload) {
  try {
    const url = `${STORE}/${id}/update`
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
