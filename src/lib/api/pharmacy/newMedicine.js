import { MEDICINE_STOCK } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function addNonExistingProduct(params) {
  var data = params
  const response = await axiosFormPost({ url: MEDICINE_STOCK, body: data, pharmacy: true })
  return response.data
}

export async function getNonExistingProductList() {
  const response = await axiosGet({ url: MEDICINE_STOCK, pharmacy: true })

  return response.data
}

export async function getNonExistingProductById(id) {
  const response = await axiosGet({ url: `${MEDICINE_STOCK}/${id}/show`, pharmacy: true })

  return response.data
}

export async function updateNonExistingProduct(params, id) {
  console.log('params details???', params, id)
  var data = params
  data.id = id
  const response = await axiosFormPost({ url: `${MEDICINE_STOCK}/${id}/update`, body: data, pharmacy: true })
  return response.data
}

export async function deleteNonExistingProduct(id) {
  console.log('id???', id)
  const response = await axiosPost({ url: `${MEDICINE_STOCK}/${id}/delete`, pharmacy: true })
  return response.data
}
