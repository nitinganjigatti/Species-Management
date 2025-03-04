import {
  PHARMACY_MASTER_BASE_URL,
  VARIANTS,
  STOCK,
  VARIANTS_MAPPING,
  PHARMACY_BASE_URL,
  MEDICINE
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function addVariant(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${VARIANTS}/add`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

//  list
export async function getVariants({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${VARIANTS}/list`, params: params })

  return response.data
}

export async function getVariantById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${VARIANTS}/${id}` })

  return response.data
}

export async function updateVariant(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${VARIANTS}/edit/${id}`
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

/// add
export async function mapVariantForProduct(payload) {
  const url = `${PHARMACY_BASE_URL}${MEDICINE}/${VARIANTS_MAPPING}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getVariantFOrProduct(id) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${MEDICINE}/${VARIANTS_MAPPING}?stock_item_id=${id}`,
    pharmacy: true
  })

  return response.data
}
