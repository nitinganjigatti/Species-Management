import React from 'react'
import axios from 'axios'
import { readAsync } from '../../../lib/windows/utils'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

export const GetAPIHeader = async ({ pharmacy } = { pharmacy: false }) => {
  const userDetails = await readAsync('userDetails')
  const selectedPharmacy = await readAsync('selectedStore')

  // const header = { 'Content-Type': 'multipart/form-data' }

  const header = {}

  if (userDetails?.user?.zoos.length > 0) {
    header['ZooId'] = userDetails?.user?.zoos[0].zoo_id

    //header['ZooId'] = '4'
  }
  if (userDetails?.token !== '') {
    header['Authorization'] = `Bearer ${userDetails?.token}`
  }

  if (pharmacy) {
    header['Selectedstore'] = selectedPharmacy?.id
  }

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
