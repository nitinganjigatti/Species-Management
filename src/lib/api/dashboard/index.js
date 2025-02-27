import { axiosGet, axiosGetExternal, axiosPost } from '../utility'

export async function getDashboardAnalytics({ params }) {
  const url = `cd0c629f-71d5-4e67-949c-8bb87f6238cc`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}

export async function getKeyInsights({ params }) {
  const url = `9b549aab-58cd-45e8-aee0-8c340b024ad0`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}

export async function getEggAnalytics({ params }) {
  const url = `94877635-4608-4411-8ce8-2f5627dee76a`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}
