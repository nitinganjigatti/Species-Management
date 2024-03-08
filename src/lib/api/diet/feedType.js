import { FEED_TYPE_LIST, ADD_FEED_TYPE, UPDATE_FEED_TYPE, FEED_DETAILS } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getFeedTypeList({ params }) {
  const response = await axiosGet({ url: `${FEED_TYPE_LIST}`, params })
  return response.data
}

export async function addFeedType(payload) {
  try {
    const url = `${ADD_FEED_TYPE}`
    // var data = payload
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

export async function getFeedById(id) {
  const response = await axiosGet({ url: `${FEED_DETAILS}/${id}` })
  return response.data
}

export async function updateFeedType(payload, id) {
  try {
    const url = `${UPDATE_FEED_TYPE}/${id}`
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
