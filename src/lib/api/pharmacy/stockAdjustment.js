import { STOCK_ADJUSTMENT, STOCK_ADJUSTMENT_REASON } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

const pharmacy = true

export async function getReasonsList() {
  const response = await axiosGet({ url: `${STOCK_ADJUSTMENT_REASON}`, pharmacy: true })

  return response.data
}

export async function addStocksAdjust(payload) {
  try {
    const url = `${STOCK_ADJUSTMENT}`
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

export async function stocksAdjustedList({ params }) {
  try {
    const url = `${STOCK_ADJUSTMENT}`
    const response = await axiosGet({ url, params, pharmacy: true })

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
