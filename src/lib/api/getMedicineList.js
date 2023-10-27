import { MEDICINE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from './utility'

export async function getMedicineList() {
  const response = await axiosGet({ url: MEDICINE })

  if (response?.status == 200 && response?.data?.success) {
    return response.data.data
  } else {
    return []
  }
}

export async function addMedicine(payload) {
  try {
    const url = `${MEDICINE}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

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

export async function getMedicineById(id) {
  const response = await axiosGet({ url: `${MEDICINE}/${id}/show` })

  return response.data.data
}

export async function updateMedicineById(payload, id) {
  try {
    const url = `${MEDICINE}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data })

    return response?.data
  } catch (error) {
    // debugger
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
