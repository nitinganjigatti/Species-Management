import { axiosGet, axiosPost } from '../utility'

const ZOO_SETTINGS = 'v1/zoo/settings'
const ZOO_REPORT_TYPES = 'v1/zoo/report-types'

export async function getZooSettings() {
  const response = await axiosGet({ url: ZOO_SETTINGS })

  return response.data
}

export async function getZooReportTypes() {
  const response = await axiosGet({ url: ZOO_REPORT_TYPES })

  return response.data
}

export async function saveZooSettings(body) {
  const response = await axiosPost({ url: ZOO_SETTINGS, body })

  return response.data
}
