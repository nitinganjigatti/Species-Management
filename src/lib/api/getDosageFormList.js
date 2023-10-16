import { DOSAGE_FORM } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getDosageFormList() {
  const response = await axiosGet({ url: DOSAGE_FORM })

  return response.data.data
}

export async function getDosageFormById(id) {
  const response = await axiosGet({ url: `${DOSAGE_FORM}/${id}/show` })

  return response.data
}

export async function addDosageForm(payload) {
  try {
    const url = `${DOSAGE_FORM}`
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

export async function updateDosageForm(id, payload) {
  try {
    const url = `${DOSAGE_FORM}/${id}/update`
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
