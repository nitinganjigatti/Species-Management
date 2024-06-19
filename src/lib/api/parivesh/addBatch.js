import { ADD_BATCH, DELETE_BATCH } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addBatches(payload) {
  try {
    const url = `${ADD_BATCH}`
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

export async function deleteBatchToOrg(payload, id) {
  const url = `${DELETE_BATCH}/${id}`
  var data = payload
  try {
    const response = await axiosFormPost({ url, body: data })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
