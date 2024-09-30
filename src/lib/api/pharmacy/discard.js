import { DISCARD_PRODUCT, DISCARD_REASON } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getDiscardList({ params }) {
  const response = await axiosGet({ url: `${DISCARD_PRODUCT}`, params, pharmacy: true })

  return response.data
}

export async function getDiscardReasonsList() {
  const response = await axiosGet({ url: `${DISCARD_REASON}`, pharmacy: true })

  return response.data
}

export async function addDiscard(payload) {
  try {
    const url = `${DISCARD_PRODUCT}`
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

export async function getDiscardItemsListById(id) {
  const response = await axiosGet({ url: `${DISCARD_PRODUCT}/${id}`, pharmacy: true })

  return response.data
}
