import { DRIVER, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDrivers({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${DRIVER}/list`, params: params, pharmacy: true })

  return response.data
}

export async function getDriverById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${DRIVER}/${id}`, pharmacy: true })

  return response.data
}

export async function addDriver(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${DRIVER}/add`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function updateDriver(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${DRIVER}/edit/${id}`
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
