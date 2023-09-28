// getDrugs.js
import axios from 'axios'
import { DRUG_CLASS } from '../../constants/ApiConstant'

export async function getDrugs() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${DRUG_CLASS}`
  console.log('url', url)

  return axios
    .get(url)
    .then(response => {
      console.log('response data', response)

      return response.data.data
    })
    .catch(error => {
      console.error(url)
      if (error.response) {
        console.info('Request made and server responded')
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        console.info('The request was made but no response was received')
        console.error(error.request)
      } else {
        console.info('Something happened in setting up the request that triggered an Error')
        console.error('Error', error.message)
      }

      return error

      // throw new Error(error);
    })
}

export async function getDrugById(id) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${DRUG_CLASS}/${id}/show`
  console.log('url', url)

  return axios
    .get(url)
    .then(response => {
      console.log('response data', response)

      return response.data
    })
    .catch(error => {
      console.error(url)
      if (error.response) {
        console.info('Request made and server responded')
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        console.info('The request was made but no response was received')
        console.error(error.request)
      } else {
        console.info('Something happened in setting up the request that triggered an Error')
        console.error('Error', error.message)
      }

      return error

      // throw new Error(error);
    })
}

export async function addDrug(payload) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${DRUG_CLASS}`
  console.log('url', url)
  debugger
  console.log('params: ', payload)

  return axios({
    method: 'post',
    url: url,
    data: payload,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(response => {
      console.log('Category POST DATA', response)

      return response?.data
    })
    .catch(error => {
      console.error(url)
      if (error.response) {
        console.info('Request made and server responded')
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        console.info('The request was made but no response was received')
        console.error(error.request)
      } else {
        console.info('Something happened in setting up the request that triggered an Error')
        console.error('Error', error.message)
      }

      return error
    })
}

export async function updateDrug(id, payload) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${DRUG_CLASS}/${id}/update`
  console.log('url', url)
  debugger
  console.log('params: ', payload)

  return axios({
    method: 'post',
    url: url,
    data: payload,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(response => {
      console.log('Category Update DATA', response)

      return response?.data
    })
    .catch(error => {
      console.error(url)
      if (error.response) {
        console.info('Request made and server responded')
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        console.info('The request was made but no response was received')
        console.error(error.request)
      } else {
        console.info('Something happened in setting up the request that triggered an Error')
        console.error('Error', error.message)
      }

      return error
    })
}
