import {
  DASHBOARD_STORE_WISE_DISPATCH_REPORT,
  DASHBOARD_STORE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_PURCHASE_REPORT,
  DASHBOARD_DOCTOR_DISPATCH_FILTER,
  DASHBOARD_COMPLETED_PENDING_REQUEST
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getStoreWiseDispatchList(payload) {
  const url = `${DASHBOARD_STORE_WISE_DISPATCH_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getStoreWiseDispatchDetail(payload) {
  const url = `${DASHBOARD_STORE_DISPATCH_REPORT}`
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

export async function getDoctorReportList(payload) {
  const url = `${DASHBOARD_DOCTOR_DISPATCH_FILTER}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getRequestListChart({ params }) {
  const response = await axiosGet({ url: `${DASHBOARD_COMPLETED_PENDING_REQUEST}`, params, pharmacy: true })

  return response.data
}
