import { GET_MEDIA } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getMediaListById({ params }) {
  const url = `user/${params?.userId}/media`
  const response = await axiosGet({ url: url, params })

  return response.data
}

export async function uploadMediaFile(payload) {
  try {
    const url = `/user/media/uploads`
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

export async function deleteMediaFile(id) {
  try {
    const url = `/user/media/${id}/delete`
    const response = await axiosFormPost({ url })

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

//
