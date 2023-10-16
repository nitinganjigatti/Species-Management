import { DRUG_CLASS } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getDrugs() {
  const response = await axiosGet({ url: DRUG_CLASS })

  return response.data.data
}

export async function getDrugById(id) {
  const response = await axiosGet({ url: `${DRUG_CLASS}/${id}/show` })

  return response.data
}

export async function addDrug(payload) {
  try {
    const url = `${DRUG_CLASS}`
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

export async function updateDrug(id, payload) {
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
