import { GST_SLAB } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getGstList() {
  const response = await axiosGet({ url: GST_SLAB })

  return response.data.data
}

export async function addTaxes(payload) {
  try {
    const url = `${GST_SLAB}`
    var data = payload
    const response = await axiosPost({ url, body: data })

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
