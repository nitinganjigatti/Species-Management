import {
  GetLabNo,
  GetLabReport,
  RequestDetails,
  GetRequestPopUpById,
  PostTransfer,
  updateStatus,
  uploadLabReports,
  GetTestsStatusById,
  LabFileDelete,
  GETLABLISTBYTESTID
} from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getNoOfLab() {
  const response = await axiosGet({ url: `${GetLabNo}` })

  return response.data
}

export async function GetLabReportById({ params }) {
  const response = await axiosGet({ url: `${GetLabReport}`, params })

  return response.data
}

export async function GetRequestDetails(id, { params }) {
  const response = await axiosGet({ url: `${RequestDetails}/${id}`, params })

  return response.data
}

export async function GetRequestPopUp(id) {
  const response = await axiosGet({ url: `${GetRequestPopUpById}/${id}` })

  return response.data
}

export async function transferLab(id, payload) {
  try {
    const url = `${PostTransfer}/${id}`
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

export async function UploadLabReports(payload) {
  try {
    const url = `${uploadLabReports}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

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

export async function GetLabRequestTestStatusById({ params }) {
  const response = await axiosGet({ url: `${GetTestsStatusById}`, params })

  return response.data
}

export async function DeleteLAbRequestAttachment(id, params) {
  try {
    const url = `medical/${id}/${LabFileDelete}?lab_test_id=${params?.lab_test_id}`

    const response = await axiosPost({ url: url })

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

export async function GetLabListByTestId({ params }) {
  const response = await axiosGet({ url: `${GETLABLISTBYTESTID}`, params })

  return response.data
}
