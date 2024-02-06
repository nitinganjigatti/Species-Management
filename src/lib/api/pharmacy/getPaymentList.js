import { PAYMENT_LIST } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getPaymentList() {
  const response = await axiosGet({ url: PAYMENT_LIST, pharmacy: true })

  return response.data.data
}

export async function addPaymentList(payload) {
  try {
    const url = `${PAYMENT_LIST}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

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
