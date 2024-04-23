import { LISTING, DIET, UPDATE_STATUS } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getDietList(params) {
  const response = await axiosGet({ url: `${DIET}/${LISTING}`, params })

  return response.data
}

export async function dietStatusChange(payload, id) {
  try {
    const url = `${DIET}/${UPDATE_STATUS}/${id}`
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
