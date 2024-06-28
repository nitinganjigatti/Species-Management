import { DIRECT_DISPATCH, REQUEST_ITEMS, LOCAL_TO_LOCAL_DISPATCH } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getDirectDispatchItemsList({ params }) {
  const response = await axiosGet({ url: DIRECT_DISPATCH, params, pharmacy })

  return response.data
}

export async function getDirectDispatchItemsListById(id) {
  const response = await axiosGet({ url: `${REQUEST_ITEMS}/${id}/show`, pharmacy })

  return response.data
}

export async function cancelDirectDispatchItems(id) {
  try {
    const url = `${DIRECT_DISPATCH}/${id}/cancel`
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

export async function addDirectDispatchItems(payload) {
  try {
    const url = `${DIRECT_DISPATCH}`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy })

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

export async function updateDirectDispatchItems(id, payload) {
  try {
    const url = `${DIRECT_DISPATCH}/${id}/update`
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

export async function getLocalDispatchItemsList({ params }) {
  const response = await axiosGet({ url: LOCAL_TO_LOCAL_DISPATCH, params, pharmacy })

  return response.data
}
