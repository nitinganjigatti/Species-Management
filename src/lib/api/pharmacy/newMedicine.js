import { MEDICINES_STOCK } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addNonExistingProduct(params) {
  var data = params
  const response = await axiosFormPost({ url: `${MEDICINES_STOCK}`, body: data, pharmacy: true })

  return response.data
}

export async function getNonExistingProductList({ params }) {
  console.log('endpoint', `${MEDICINES_STOCK}`)

  const response = await axiosGet({ url: `${MEDICINES_STOCK}`, params, pharmacy: true })

  return response.data
}

export async function getNonExistingProductById(id) {
  const response = await axiosGet({ url: `${MEDICINES_STOCK}/${id}/show`, pharmacy: true })

  return response.data
}

export async function updateNonExistingProduct(params, id) {
  console.log('params details???', params, id)
  var data = params
  data.id = id
  const response = await axiosFormPost({ url: `${MEDICINES_STOCK}/${id}/update`, body: data, pharmacy: true })

  return response.data
}

export async function deleteNonExistingProduct(id) {
  console.log('id???', id)
  const response = await axiosPost({ url: `${MEDICINES_STOCK}/${id}/delete`, pharmacy: true })

  return response.data
}

export async function addNonExistingProductStatus(params, id) {
  console.log('Status Params >>', params, id)
  var data = params
  const response = await axiosPost({ url: `${MEDICINES_STOCK}/${id}/status`, body: data, pharmacy: true })

  return response.data
}
