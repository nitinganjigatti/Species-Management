import { PURCHASE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getPurchaseList() {
  const response = await axiosGet({ url: PURCHASE })

  return response.data.data
}

export async function getPurchaseListById(id) {
  const response = await axiosGet({ url: `${PURCHASE}/${id}/show` })

  return response.data
}

export async function addPurchase(payload) {
  try {
    const url = `${PURCHASE}`
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

export async function updatePurchase(id, payload) {
  try {
    const url = `${PURCHASE}/${id}/update`
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
