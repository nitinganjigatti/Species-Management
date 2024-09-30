import {
  DASHBOARD_STORE_WISE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_PURCHASE_REPORT
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getStoreWiseDispatchList(payload) {
  const url = `${DASHBOARD_STORE_WISE_DISPATCH_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getMonthWiseDispatchList(payload) {
  const url = `${DASHBOARD_MONTH_WISE_DISPATCH_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getMonthWisePurchaseList(payload) {
  const url = `${DASHBOARD_MONTH_WISE_PURCHASE_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}
