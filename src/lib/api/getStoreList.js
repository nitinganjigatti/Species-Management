import { STORE, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

// http://localhost:8080/api/v1/pharma/store/add
// http://localhost:8080/api/v1/pharma/store/update/17
// http://localhost:8080/api/v1/pharma/store/list

export async function getStoreList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${STORE}/list`, params: params })

  return response.data
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
