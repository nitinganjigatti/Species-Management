import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

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

export const fetchFormPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader({ pharmacy })

  // headers['Content-Type'] = 'multipart/form-data'

  const formData = new FormData()
  Object.entries(body).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        Object.entries(item).forEach(([itemKey, itemValue]) => {
          formData.append(`${key}[${index}][${itemKey}]`, itemValue)
        })
      })
    } else if (value !== undefined) {
      formData.append(key, value)
    }
  })

  const response = await fetch(completeUrl, {
    method: 'POST',
    headers: { ...headers },
    body: formData
  })

  if (!response.ok) {
    const errorResponse = await response.json()
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorResponse.message}`)
  }

  const responseJson = await response.json()

  return responseJson
}

export const fetchFormPostMedia = async ({ url, body, pharmacy }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader({ pharmacy })

  // headers['Content-Type'] = 'multipart/form-data'
  const formData = new FormData()
  formData.append('user_id', body.user_id)
  formData.append('user_attachment[]', body.user_attachment)

  const response = await fetch(completeUrl, {
    method: 'POST',
    headers: { ...headers },
    body: formData
  })

  if (!response.ok) {
    const errorResponse = await response.json()
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorResponse.message}`)
  }

  const responseJson = await response.json()

  return responseJson
}
