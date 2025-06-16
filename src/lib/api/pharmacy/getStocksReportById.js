import {
  STOCK_REPORT,
  LOCAL_STOCK_REPORT,
  STOCK_OUT,
  EXPIRED_MEDICINE,
  STOCK_BY_BATCH,
  STOCK,
  STOCK_WITH_BATCH,
  PURCHASE_BY_PRODUCT
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

export async function aboutExpiringProduct({ params }) {
  // export async function aboutExpiringProduct(id, params) {
  // removed id from the url to get response based on store id oldUrl: `${STOCK_BY_BATCH}/${id}`
  let response = await axiosGet({ url: `${STOCK_BY_BATCH}`, params, pharmacy: true })

  return response.data
}

//Used New api to get stock report
export async function getStockReport(id, params) {
  let response
  if (id) {
    response = await axiosGet({ url: `${STOCK}/${id}`, params, pharmacy: true })
  } else {
    response = await axiosGet({ url: `${STOCK}`, params, pharmacy: true })
  }

  return response.data
}

export async function getStockReportByBatch(id, params) {
  let response
  if (id === 'all') {
    response = await axiosGet({ url: `${STOCK_WITH_BATCH}`, params, pharmacy: true })
  } else {
    response = await axiosGet({ url: `${STOCK_WITH_BATCH}/${id}`, params, pharmacy: true })
  }

  return response?.data
}

export async function getPurchaseListByProduct(params) {
  let response = await axiosGet({ url: `${PURCHASE_BY_PRODUCT}`, params, pharmacy: true })

  return response.data
}
