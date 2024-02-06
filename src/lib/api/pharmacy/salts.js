import { SALTS, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getSalts({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${SALTS}/list`, params: params, pharmacy: true })

  return response.data
}

export async function getSaltById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${SALTS}/${id}`, pharmacy: true })

  return response.data
}

export async function addSalt(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${SALTS}/add`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function updateSalt(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${SALTS}/edit/${id}`
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
