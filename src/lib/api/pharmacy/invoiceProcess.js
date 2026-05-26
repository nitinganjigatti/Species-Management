import { PURCHASE, UPDATE_PURCHASE_BASE_URL } from 'src/constants/ApiConstant'
import { axiosMLPost, axiosPost, axiosFormPost } from '../utility'

export async function invoiceProcessForPurchase(payload) {
  try {
    const url = 'inferInvoices'
    var data = payload
    const response = await axiosMLPost({ url, data })

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

export async function invoiceProcessForPurchaseExcel(payload) {
  try {
    const url = `${UPDATE_PURCHASE_BASE_URL}${PURCHASE}/parse-invoice`
    var data = { file: payload }
    const response = await axiosFormPost({ url, body: data, pharmacy: true })
    console.log(response)
    return response?.data
  } catch (error) {
    console.log('error', error)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
