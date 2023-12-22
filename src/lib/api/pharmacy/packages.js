import { PACKAGES, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getPackages({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${PACKAGES}/list`, params, pharmacy: true })

  return response.data
}

export async function getPackageById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${PACKAGES}/${id}`, pharmacy: true })

  return response.data
}

export async function addPackages(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${PACKAGES}/add`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function updatePackage(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${PACKAGES}/edit/${id}`
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
