import { GENERICS } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getGenerics() {
  const response = await axiosGet({ url: GENERICS })

  return response.data.data
}

export async function getGenericsById(id) {
  const response = await axiosGet({ url: `${GENERICS}/${id}/show` })

  return response.data
}

export async function addGenericName(payload) {
  try {
    const url = `${GENERICS}`
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

export async function updateGenericName(id, payload) {
  try {
    const url = `${GENERICS}/${id}/update`
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
