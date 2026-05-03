import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`
// const base_url = process.env.NODE_ENV === 'development' ? '/api/' : `${process.env.NEXT_PUBLIC_API_BASE_URL}`
const ml_operations_base_url = `${process.env.NEXT_PUBLIC_ML_OPERATIONS_BASE_URL}`

const apiClient = axios.create()

let isLoggingOut = false

// Endpoints that must NEVER trigger the session-expired logout flow on 401.
// These are auxiliary endpoints whose auth failures are handled by their callers
// (e.g. geofence verify/heartbeat — caller decides what to do with the response).
const SESSION_EXPIRED_EXEMPT_URLS = ['/auth/geofence-verify', '/auth/geofence-heartbeat']

apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response)
    return response
  },
  error => {
    const isLoginPage = window.location.pathname === '/login/' || window.location.pathname === '/login'
    const url = error.config?.url || ''
    const isSessionExpiredExempt = SESSION_EXPIRED_EXEMPT_URLS.some(suffix => url.includes(suffix))

    if (error.response?.status === 401) {
      if (!isLoggingOut && !isLoginPage && !isSessionExpiredExempt) {
        isLoggingOut = true
        window.dispatchEvent(new Event('session-expired'))
      }
    } else if (error.response?.status === 403) {
      // Backend signals geofence lock via 403 with error/code geofence_locked.
      // Surface a global event the AuthGuard subscribes to so the lock banner
      // shows even on pages that don't directly mount the heartbeat hook.
      const body = error.response?.data
      const code = body?.error || body?.code
      if (code === 'geofence_locked') {
        window.dispatchEvent(new CustomEvent('geofence-locked', { detail: body?.data || {} }))
      }
    } else {
      console.error('API Error:', error)
    }

    return Promise.reject(error)
  }
)

export const GetAPIHeader = async ({ pharmacy } = { pharmacy: false }) => {
  const userDetails = await readAsync('userDetails')
  const selectedPharmacy = await readAsync('selectedStore')
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const clientPlatform = 'web'
  const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION

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
  header['X-Client-Platform'] = clientPlatform
  header['X-Client-Version'] = clientVersion

  return header
}

export const axiosGet = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `${base_url}${url}`
  headers['Content-Type'] = 'application/json'

  return apiClient.get(completeUrl, { headers: headers, params: params })
}

export const axiosPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${base_url}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'application/json'

  return apiClient.post(completeUrl, body, { headers })
}

export const axiosFormPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${base_url}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'multipart/form-data'

  return apiClient.post(completeUrl, body, { headers })
}

export const axiosDelete = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `${base_url}${url}`
  headers['Content-Type'] = 'application/json'

  return apiClient.delete(completeUrl, { headers: headers, params: params })
}

export const axiosGetExternal = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `https://mocki.io/v1/${url}`
  headers['Content-Type'] = 'application/json'

  return apiClient.get(completeUrl, { headers: headers, params: params })
}

export const axiosAuthFormPost = async ({ url, body, pharmacy, authToken }) => {
  const completeUrl = `${base_url}${url}`
  const headers = await GetAPIHeader({ pharmacy })

  // headers['Content-Type'] = 'multipart/form-data'
  headers['Authorization'] = `${authToken}`

  return apiClient.post(completeUrl, body, { headers })
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

  return apiClient.post(completeUrl, body, { headers })
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
