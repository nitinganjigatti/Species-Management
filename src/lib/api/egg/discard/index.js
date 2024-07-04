import { axiosFormPost, axiosGet, axiosPost } from '../../utility'
import { ADD, COMMENT, DELETE, EGG, LIST, DISCARD, STATUS, UPDATE } from 'src/constants/ApiConstant'

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
