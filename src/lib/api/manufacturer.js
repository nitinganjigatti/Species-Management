import { MANUFACTURER, MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getManufacturers({ params }) {
  const response = await axiosGet({ url: `${MASTER_BASE_URL}${MANUFACTURER}/list`, params: params })

  return response.data
}

export async function getManufacturerById(id) {
  const response = await axiosGet({ url: `${DRUG_CLASS}/${id}/show` })

  return response.data
}

export async function addManufacturer(payload) {
  try {
    const url = `${MASTER_BASE_URL}${MANUFACTURER}/add`
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

export async function updateManufacturer(id, payload) {
  try {
    const url = `${DRUG_CLASS}/${id}/update`
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
