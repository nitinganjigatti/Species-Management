import { STORAGE, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStorage({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${STORAGE}/list`, params })

  return response.data
}

export async function getStorageById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${STORAGE}/${id}` })

  return response.data
}

export async function addStorage(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${STORAGE}/add`
  var data = payload
  const response = await axiosPost({ url, body: data })

  return response?.data
}

export async function updateStorage(id, payload) {
  debugger
  const url = `${PHARMACY_MASTER_BASE_URL}${STORAGE}/edit/${id}`
  var data = payload
  data.id = id
  const response = await axiosPost({ url, body: data })

  return response?.data
}
