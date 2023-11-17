import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

export const GetAPIHeader = async () => {
  const userDetails = await readAsync('userDetails')

  // const header = { 'Content-Type': 'multipart/form-data' }

  const header = {}

  if (userDetails?.user?.zoos.length > 0) {
    header['ZooId'] = userDetails?.user?.zoos[0].zoo_id
  }
  if (userDetails?.token !== '') {
    header['Authorization'] = `Bearer ${userDetails?.token}`
  }

  return header
}

export const axiosGet = async ({ url, params }) => {
  const headers = await GetAPIHeader()
  const completeUrl = `${base_url}${url}`
  headers['Content-Type'] = 'application/json'

  console.log('params', params)

  return axios.get(completeUrl, { headers: headers, params: params })
}

export const axiosPost = async ({ url, body }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader()
  headers['Content-Type'] = 'application/json'

  return axios.post(completeUrl, body, { headers })
}

export const axiosFormPost = async ({ url, body }) => {
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = await GetAPIHeader()
  headers['Content-Type'] = 'multipart/form-data'

  return axios.post(completeUrl, body, { headers })
}
