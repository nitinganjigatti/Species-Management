import { DELETE_ATTACHMENT_BATCH, UPLOAD_ATTACHMENT_BATCH } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function uploadAttachmentForBatch(payload) {
  try {
    const url = `${UPLOAD_ATTACHMENT_BATCH}`
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

export async function deleteAttachmentForBatch(id, payload) {
  try {
    const url = `${DELETE_ATTACHMENT_BATCH}/${id}`
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
