import { axiosGet, axiosPost } from '../utility'

const ZOO_SETTINGS = 'v1/zoo/settings'
const ZOO_SETTINGS_SCHEMA = 'v1/zoo/settings-schema'
const ZOO_SETTINGS_HISTORY = 'v1/zoo/settings-history'
const ZOO_REPORT_TYPES = 'v1/zoo/report-types'

export async function getZooSettings() {
  const response = await axiosGet({ url: ZOO_SETTINGS })

  return response.data
}

export async function getZooSettingsSchema() {
  const response = await axiosGet({ url: ZOO_SETTINGS_SCHEMA })

  return response.data
}

export async function getZooReportTypes() {
  const response = await axiosGet({ url: ZOO_REPORT_TYPES })

  return response.data
}

export async function getZooSettingsHistory({ page_no = 1, filter = 'all', section } = {}) {
  const params = { page_no, filter }
  if (section) params.section = section

  const response = await axiosGet({ url: ZOO_SETTINGS_HISTORY, params })

  return response.data
}

export async function saveZooSettings(body) {
  const response = await axiosPost({ url: ZOO_SETTINGS, body })

  return response.data
}
