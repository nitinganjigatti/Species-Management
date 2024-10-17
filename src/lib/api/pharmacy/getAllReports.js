import {
  DASHBOARD_STORE_WISE_DISPATCH_REPORT,
  DASHBOARD_STORE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_DISPATCH_REPORT,
  DASHBOARD_MONTH_WISE_PURCHASE_REPORT,
  DASHBOARD_DOCTOR_DISPATCH_FILTER,
  DASHBOARD_DOCTORWISE_MEDICINE_FILTER,
  DASHBOARD_COMPLETED_PENDING_REQUEST,
  DASHBOARD_DOCTOR_WISE_REQUEST,
  DASHBOARD_REQUEST_SENT,
  DASHBOARD_RECEIVED_MEDICINE_REPORT,
  DASHBOARD_MEDICINEWISE_DOCTOR_FILTER
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

export async function getDoctorWiseRequestList(payload) {
  const url = `${DASHBOARD_DOCTOR_WISE_REQUEST}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getDoctorWiseMedicineFilter(payload) {
  const url = `${DASHBOARD_DOCTORWISE_MEDICINE_FILTER}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getReceivedMedicineList(payload) {
  const url = `${DASHBOARD_RECEIVED_MEDICINE_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getMedicineWiseDoctorFilter(payload) {
  const url = `${DASHBOARD_MEDICINEWISE_DOCTOR_FILTER}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function getRequestListChart({ params }) {
  const response = await axiosGet({ url: `${DASHBOARD_COMPLETED_PENDING_REQUEST}`, params, pharmacy: true })

  return response.data
}

export async function getRequestSentChart({ params }) {
  const response = await axiosGet({ url: `${DASHBOARD_REQUEST_SENT}`, params, pharmacy: true })

  return response.data
}
