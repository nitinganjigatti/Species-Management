import { UOM, PHARMACY_MASTER_BASE_URL } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

const pharmacy = true

export async function getUnits({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${UOM}/list`, params: params, pharmacy })

  return response.data
}

export async function addUnits(payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${UOM}/add`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy })

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

export async function getUnitsById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${UOM}/${id}`, pharmacy })

  return response.data
}

export async function updateUnits(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${UOM}/edit/${id}`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data, pharmacy })

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
