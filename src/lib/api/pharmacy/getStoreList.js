import { STORE, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStoreList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${STORE}/list`, params: params, pharmacy: true })

  return response.data
}

export async function getStoreById(id) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${STORE}/${id}`, pharmacy: true })

  return response.data
}

export async function addStore(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${STORE}/add`
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

export async function updateStore(id, payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${STORE}/update/${id}`
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

export async function checkCentralPharmacy() {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${STORE}/check`, pharmacy: true })

  return response.data
}
