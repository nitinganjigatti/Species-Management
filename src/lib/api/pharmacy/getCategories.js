import { CATEGORIES } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getCategories() {
  const response = await axiosGet({ url: CATEGORIES })

  return response.data.data
}

export async function getCategoryById(id) {
  const response = await axiosGet({ url: `${CATEGORIES}/${id}/show` })

  return response.data
}

export async function addCategory(payload) {
  try {
    const url = `${CATEGORIES}`
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

export async function updateCategory(id, payload) {
  try {
    const url = `${CATEGORIES}/${id}/update`
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
