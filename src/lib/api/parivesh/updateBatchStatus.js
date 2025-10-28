import { UPDATE_BATCH_STATUS } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function updateBatchStatus(payload) {
  try {
    const url = `${UPDATE_BATCH_STATUS}`
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
