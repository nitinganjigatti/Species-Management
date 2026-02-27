import {
  getSitesByLabId,
  getUserByLabId,
  LAB_REQUEST_DETAILS,
  LAB_REQUEST_SAMPLES,
  LAB_REQUEST_NOTES,
  LAB_REQUEST_REPORTS,
  LAB_SUB_TESTS,
  LAB_SAMPLE_LOGS
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function GetLabSitesById({ params }) {
  const response = await axiosGet({ url: `${getSitesByLabId}`, params })

  return response.data
}

export async function GetLabUsersById({ params }) {
  const response = await axiosGet({ url: `${getUserByLabId}`, params })

  return response.data
}

export async function getLabRequestDetails(requestGuid) {
  const response = await axiosGet({ url: LAB_REQUEST_DETAILS, params: { RequestGuid: requestGuid } })

  return response?.data
}

export async function getLabRequestSamples(requestGuid) {
  const response = await axiosGet({ url: LAB_REQUEST_SAMPLES, params: { requestGuid } })

  return response?.data
}

export async function getLabRequestNotes(requestGuid) {
  const response = await axiosGet({ url: LAB_REQUEST_NOTES, params: { requestGuid } })

  return response?.data
}

export async function getLabRequestReports(requestGuid) {
  const response = await axiosGet({ url: LAB_REQUEST_REPORTS, params: { requestGuid } })

  return response?.data
}

export async function getLabSubTests(tCode) {
  const response = await axiosGet({ url: LAB_SUB_TESTS, params: { type: 'subtests', t_code: tCode } })

  return response?.data
}

export async function getLabSampleLogs(requestGuid) {
  const response = await axiosGet({ url: LAB_SAMPLE_LOGS, params: { requestGuid } })

  return response?.data
}
