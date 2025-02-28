import { axiosGet, axiosGetExternal, axiosPost } from '../utility'

export async function getDashboardAnalytics({ params }) {
  const url = `v1/dashboard/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getKeyInsights({ params }) {
  const url = `v1/dashboard/key/insights`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getEggAnalytics({ params }) {
  const url = `v1/dashboard/egg/insights`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getAnimalActivity({ params }) {
  const url = `v1/dashboard/animal/key/insights`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getAnimalTransfer({ params }) {
  const url = `v1/dashboard/animal/transfer/insights`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getPendingRequests({ params }) {
  const url = `v1/dashboard/pharma/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getDashboardPharmacy({ params }) {
  const url = `v1/dashboard/overall/module/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getNotes({ params }) {
  const url = `v1/dashboard/notes/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}

export async function getLabRequests({ params }) {
  const url = `v1/dashboard/lab/stats`
  const response = await axiosGet({ url: `${url}`, params })

  return response.data
}
