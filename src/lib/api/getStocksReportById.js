import { STOCK_REPORT, STOCK_OUT, EXPIRED_MEDICINE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getStocksReportById(id) {
  const response = await axiosGet({ url: `${STOCK_REPORT}/${id}` })

  return response.data.data
}

export async function getStockOutItems() {
  const response = await axiosGet({ url: STOCK_OUT })

  return response.data.data
}

export async function getExpiredMedicine() {
  const response = await axiosGet({ url: EXPIRED_MEDICINE })

  return response.data.data
}
