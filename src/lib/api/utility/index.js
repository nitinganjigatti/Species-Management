import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`
const ml_operations_base_url = `${process.env.NEXT_PUBLIC_ML_OPERATIONS_BASE_URL}`

export const GetAPIHeader = async ({ pharmacy } = { pharmacy: false }) => {
  const userDetails = await readAsync('userDetails')
  const selectedPharmacy = await readAsync('selectedStore')
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // const header = { 'Content-Type': 'multipart/form-data' }

  const header = {}

  if (userDetails?.user?.zoos.length > 0) {
    header['ZooId'] = userDetails?.user?.zoos[0].zoo_id
  }
  if (userDetails?.token !== '') {
    header['Authorization'] = `Bearer ${userDetails?.token}`
  }

  if (pharmacy) {
    header['Selectedstore'] = selectedPharmacy?.id
  }

  header['CurrentTimeZone'] = currentTimeZone

  return header
}

export const axiosGet = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `${base_url}${url}`
  headers['Content-Type'] = 'application/json'

  return axios.get(completeUrl, { headers: headers, params: params })
}

export const axiosPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'application/json'

  return axios.post(completeUrl, body, { headers })
}

export const axiosFormPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'multipart/form-data'

  return axios.post(completeUrl, body, { headers })
}

export const axiosGetExternal = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `https://mocki.io/v1/${url}`
  headers['Content-Type'] = 'application/json'

  return axios.get(completeUrl, { headers: headers, params: params })
}

export const axiosAuthFormPost = async ({ url, body, pharmacy, authToken }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader({ pharmacy })

  // headers['Content-Type'] = 'multipart/form-data'
  headers['Authorization'] = `${authToken}`

  return axios.post(completeUrl, body, { headers })
}

export const axiosMLPost = async ({ url, data }) => {
  const completeUrl = `${ml_operations_base_url}/${url}`
  let body

  const userDetails = await readAsync('userDetails').then(res => {
    body = {
      dataType: 'bytes',
      zooId: res?.user?.zoos.length > 0 && res?.user?.zoos[0].zoo_id.toString(),
      save: false,
      data: data
    }
  })

  const headers = {
    'X-API-KEY': '4ebaa3c6-9e70-42dd-bc1b-74e948aa468b',
    'Content-Type': 'application/json'
  }

  return axios.post(completeUrl, body, { headers })
}
