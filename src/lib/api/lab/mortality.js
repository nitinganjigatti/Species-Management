import { axiosFormPost, axiosGet } from '../utility'
import { LAB_MORTALITY_REASON } from 'src/constants/ApiConstant'

export async function getMortalityReasonsList({ params }) {
  const url = LAB_MORTALITY_REASON
  const response = await axiosGet({ url: url, params })

  return response.data
}

export async function getMortalityReasonsById(Id) {
  const url = `${LAB_MORTALITY_REASON}/${Id}`
  const response = await axiosGet({ url: url })

  return response.data
}

export async function addMortalityReasons(payload) {
  try {
    const url = LAB_MORTALITY_REASON
    const response = await axiosFormPost({ url, body: payload })

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

export async function updateMortalityReasons(id, payload) {
  console.log(payload, id, 'payload')
  const url = `${LAB_MORTALITY_REASON}/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

export async function deleteMortalityReasons(id) {
  const url = `${LAB_MORTALITY_REASON}/${id}`

  try {
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
