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

export async function getAnimalActivity({ params }) {
  const url = `8a764b3e-d33b-4e64-a83f-2e1eb4fe9336`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}

export async function getAnimalTransfer({ params }) {
  const url = `639ae40d-4fd1-44a3-ae17-755a94ed06bf`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}

export async function getPendingRequests({ params }) {
  const url = `5e0fd4aa-06a9-4999-af4d-07e0c346b674`
  const response = await axiosGetExternal({ url: `${url}`, params })

  return response.data
}

export async function getNotes({ params }) {
  const url = `v1/dashboard/notes/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}
