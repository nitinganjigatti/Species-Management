import { PRODUCT_FORM, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getProductFormList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${PRODUCT_FORM}/list`, params, pharmacy: true })

  return response.data
}

export async function getProductFormById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${PRODUCT_FORM}/${id}`, pharmacy: true })

  return response.data
}

export async function addProductForm(payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${PRODUCT_FORM}/add`
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

export async function updateProductForm(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${PRODUCT_FORM}/edit/${id}`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
