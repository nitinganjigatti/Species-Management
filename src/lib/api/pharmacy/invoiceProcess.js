import { axiosMLPost } from '../utility'

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
