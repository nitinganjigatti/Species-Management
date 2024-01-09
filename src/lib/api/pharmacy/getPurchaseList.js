import { PURCHASE, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getPurchaseList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${PURCHASE}`, params, pharmacy: true })

  return response.data
}

export async function getPurchaseListById(id) {
  const response = await axiosGet({ url: `${PURCHASE}/${id}/show`, pharmacy: true })

  return response.data
}

export async function addPurchase(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}`
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

export async function updatePurchase(id, payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/${id}/update`
    var data = payload
    data.id = id
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
