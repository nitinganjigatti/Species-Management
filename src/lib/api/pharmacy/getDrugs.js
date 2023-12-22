import { DRUG_CLASS, PHARMACY_MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDrugClass({ params }) {
  const response = await axiosGet({
    url: `${PHARMACY_MASTER_BASE_URL}${DRUG_CLASS}/list`,
    params: params,
    pharmacy: true
  })

  return response.data
}

export async function getDrugById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${DRUG_CLASS}/${id}`, pharmacy: true })

  return response.data
}

export async function addDrug(payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${DRUG_CLASS}/add`
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

export async function updateDrug(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${DRUG_CLASS}/edit/${id}`
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
