import { GENERICS, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getGenerics() {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${GENERICS}/list`, pharmacy: true })

  return response.data
}

export async function getGenericsForMaster({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${GENERICS}/list`, params, pharmacy: true })

  return response.data
}

export async function getGenericsById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${GENERICS}/${id}`, pharmacy: true })

  return response.data
}

export async function addGenericName(payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${GENERICS}/add`
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

export async function updateGenericName(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${GENERICS}/edit/${id}`
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
