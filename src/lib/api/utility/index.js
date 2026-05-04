import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'
import wso2Client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

// WSO2 CORS fix: in dev, use relative '/api/' so next.config.js rewrite proxies
// to NEXT_PUBLIC_BASE_URL (avoids CORS when backend is on a different origin,
// e.g. Cloudflare tunnel). In production, use the absolute URL directly.
// const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`
const base_url = process.env.NODE_ENV === 'development' ? '/api/' : `${process.env.NEXT_PUBLIC_API_BASE_URL}`
const ml_operations_base_url = `${process.env.NEXT_PUBLIC_ML_OPERATIONS_BASE_URL}`
export const GetAPIHeader = async ({ pharmacy } = { pharmacy: false }) => {
  const userDetails = await readAsync('userDetails')
  const selectedPharmacy = await readAsync('selectedStore')
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const clientPlatform = 'web'
  const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION

  const header = {}

  if (userDetails?.user?.zoos?.length > 0) {
    header['ZooId'] = userDetails.user.zoos[0].zoo_id
  }

  // WSO2 mode: prefer backend-issued JWT from getUserDataInSsoFlow (stored in
  // userDetails.token) so /api/* calls use the Antz session token. Fall back
  // to raw WSO2 Bearer token only before the first bootstrap call has
  // populated userDetails (i.e. the bootstrap call itself).
  // Legacy mode: the same userDetails.token is populated by callRefreshToken().
  //
  // Previous behavior (raw WSO2 token for every call — kept for reference):
  // if (isWso2AuthEnabled()) {
  //   const token = await wso2Client.getAccessToken()
  //   if (token) header['Authorization'] = `Bearer ${token}`
  // } else if (userDetails?.token) {
  //   header['Authorization'] = `Bearer ${userDetails.token}`
  // }
  if (userDetails?.token) {
    header['Authorization'] = `Bearer ${userDetails.token}`
  } else if (isWso2AuthEnabled()) {
    const token = await wso2Client.getAccessToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
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

  return axios.get(completeUrl, { headers: headers, params: params })
}

export const axiosPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${base_url}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'application/json'

  return axios.post(completeUrl, body, { headers })
}

export const axiosFormPost = async ({ url, body, pharmacy }) => {
  const completeUrl = `${base_url}${url}`
  const headers = await GetAPIHeader({ pharmacy })
  headers['Content-Type'] = 'multipart/form-data'

  return axios.post(completeUrl, body, { headers })
}

export const axiosDelete = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `${base_url}${url}`
  headers['Content-Type'] = 'application/json'

  return axios.delete(completeUrl, { headers: headers, params: params })
}

export const axiosGetExternal = async ({ url, params, pharmacy }) => {
  const headers = await GetAPIHeader({ pharmacy })
  const completeUrl = `https://mocki.io/v1/${url}`
  headers['Content-Type'] = 'application/json'

  return axios.get(completeUrl, { headers: headers, params: params })
}

export const axiosAuthFormPost = async ({ url, body, pharmacy, authToken }) => {
  const completeUrl = `${base_url}${url}`
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
