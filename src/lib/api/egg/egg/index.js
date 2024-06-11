import { axiosGet, axiosPost } from '../../utility'
import { ADD, COMMENT, DELETE, EGG, LIST, ADD, DISCARD } from 'src/constants/ApiConstant'

export async function GetEggList({ params }) {
  const response = await axiosGet({ url: `${EGG}/detail/${LIST}`, params: params })

  return response.data
}

export async function GetEggDetails(id) {
  const response = await axiosGet({ url: `${EGG}/${id}`, pharmacy: true })

  return response.data
}

export async function GetEggMaster() {
  const response = await axiosGet({ url: `${EGG}/master/data/all` })

  return response.data
}

export async function addToDiscard(payload) {
  try {
    const url = `${EGG}/${DISCARD}/${ADD}`
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

export async function getEggComments(params) {
  const response = await axiosGet({ url: `${EGG}/${COMMENT}-${LIST}`, params, pharmacy: true })

  return response.data
}

export async function addEggComment(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${ADD}-${COMMENT}`, body: payload })

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

export async function deleteEggComments(params) {
  const response = await axiosGet({ url: `${EGG}/${COMMENT}-${DELETE}`, params, pharmacy: true })

  return response.data
}
