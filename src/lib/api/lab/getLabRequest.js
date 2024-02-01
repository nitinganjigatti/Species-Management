import {
  GetLabNo,
  GetLabReport,
  RequestDetails,
  GetRequestPopUpById,
  PostTransfer,
  updateStatus
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getNoOfLab() {
  const response = await axiosGet({ url: `${GetLabNo}` })

  return response.data
}

export async function GetLabReportById({ params }) {
  const response = await axiosGet({ url: `${GetLabReport}`, params })

  return response.data
}

export async function GetRequestDetails(id) {
  const response = await axiosGet({ url: `${RequestDetails}/${id}` })

  return response.data
}

export async function GetRequestPopUp(id) {
  const response = await axiosGet({ url: `${GetRequestPopUpById}/${id}` })

  return response.data
}

export async function transferLab(payload) {
  try {
    const url = `${PostTransfer}`
    var data = payload
    const response = await axiosPost({ url, body: data })

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

export async function UpdateStatus(id, payload) {
  try {
    const url = `${updateStatus}/${id}`
    var data = payload
    const response = await axiosPost({ url, body: data })

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
