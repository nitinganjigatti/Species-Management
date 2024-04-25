import { RETURN_REQUEST, REQUEST_ITEMS } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getRequestReturnList({ params }) {
  const response = await axiosGet({ url: `${RETURN_REQUEST}`, params, pharmacy: true })

  return response.data
}

export async function getReturnItemsListById(id) {
  const response = await axiosGet({ url: `${REQUEST_ITEMS}/${id}/show`, pharmacy })

  return response.data
}

export async function cancelReturnItemsRequest(id) {
  try {
    const url = `${RETURN_REQUEST}/${id}/cancel`
    const response = await axiosPost({ url, pharmacy })

    return response
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

export async function addReturnItems(payload) {
  try {
    const url = `${RETURN_REQUEST}`
    const response = await axiosFormPost({ url, body: payload, pharmacy })

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

export async function updateReturnItems(id, payload) {
  try {
    const url = `${RETURN_REQUEST}/${id}/update`
    var data = payload
    data.id = id

    const response = await axiosFormPost({ url, body: data, pharmacy })

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
