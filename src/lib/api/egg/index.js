import { EGG } from 'src/constants/ApiConstant'
import { axiosPost } from '../utility'

export async function hatcheryStatus(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/hatchery/status/change`, body: payload })

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
