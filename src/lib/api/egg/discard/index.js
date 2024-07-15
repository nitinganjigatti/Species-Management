import { axiosFormPost, axiosGet, axiosPost } from '../../utility'
import { EGG, DISCARD, DISCARD_LIST_BY_ID, SUMMARY, DISCARD_DELETE } from 'src/constants/ApiConstant'

export async function DiscardedEggList({ params }) {
  return await axiosGet({
    url: `${EGG}/${DISCARD}/request-list`,
    params: params
  })
}

export async function AddDiscardEgg(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${DISCARD}/add-new`, body: payload })

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

export async function GetDiscardedSummary(params) {
  return await axiosGet({
    url: `${EGG}/${DISCARD}/${SUMMARY}`,
    params: params
  })
}

export async function GetDiscardedEggList(params) {
  return await axiosGet({
    url: `${EGG}/${DISCARD_LIST_BY_ID}`,
    params: params
  })
}

export async function DeleteEggById(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${DISCARD_DELETE}`, body: payload })

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
