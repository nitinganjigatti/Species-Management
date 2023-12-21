import { STOCK_REPORT, STOCK_OUT, EXPIRED_MEDICINE } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStocksReportById(id) {
  const response = await axiosGet({ url: `${STOCK_REPORT}/${id}` })

  return response.data.data
}

export async function getStockOutItems({ params }) {
  const response = await axiosGet({ url: STOCK_OUT, params })

  return response.data.data
}

export async function getExpiredMedicine({ params }) {
  const response = await axiosGet({ url: EXPIRED_MEDICINE, params })

  return response.data.data
}
