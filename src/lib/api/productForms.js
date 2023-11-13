import { PRODUCT_FORM, MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getProductFormList({ params }) {
  const response = await axiosGet({ url: `${MASTER_BASE_URL}${PRODUCT_FORM}/list`, params })

  return response.data
}

export async function getProductFormById(id) {
  const response = await axiosGet({ url: `${DOSAGE_FORM}/${id}/show` })

  return response.data
}

export async function addProductForm(payload) {
  try {
    const url = `${MASTER_BASE_URL}${PRODUCT_FORM}/add`
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

export async function updateProductForm(id, payload) {
  try {
    const url = `${DOSAGE_FORM}/${id}/update`
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
