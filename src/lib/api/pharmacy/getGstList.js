import { TAX_SLAB } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getGstList({ params }) {
  const response = await axiosGet({ url: `${TAX_SLAB}/list`, params: params, pharmacy: true })

  return response.data
}

export async function getTaxById(id) {
  const response = await axiosGet({ url: `${TAX_SLAB}/${id}`, pharmacy: true })

  return response.data
}

export async function updateTax(id, payload) {
  try {
    const url = `${TAX_SLAB}/edit/${id}`
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

export async function addTax(payload) {
  try {
    const url = `${TAX_SLAB}/add`
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
