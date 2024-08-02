import {
  STOCK_REPORT,
  LOCAL_STOCK_REPORT,
  STOCK_OUT,
  EXPIRED_MEDICINE,
  STOCK_BY_BATCH
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStocksReportById(id, params) {
  let response
  if (id) {
    response = await axiosGet({ url: `${STOCK_REPORT}/${id}`, params, pharmacy: true })
  } else {
    response = await axiosGet({ url: `${STOCK_REPORT}`, params, pharmacy: true })
  }

  return response.data
}

export async function getStockOutItems({ params }) {
  const response = await axiosGet({ url: STOCK_OUT, params, pharmacy: true })

  return response.data.data
}

export async function getLocalStocksReportById(params) {
  const response = await axiosGet({ url: `${LOCAL_STOCK_REPORT}`, params, pharmacy: true })

  return response.data
}

export async function getExpiredMedicine({ params }) {
  const response = await axiosGet({ url: `${EXPIRED_MEDICINE}/store`, params, pharmacy: true })

  return response.data.data
}

export async function aboutExpiringProduct(id, params) {
  let response = await axiosGet({ url: `${STOCK_BY_BATCH}/${id}`, params, pharmacy: true })

  return response.data
}
