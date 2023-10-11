import axios from 'axios'
import { UOM } from '../../constants/ApiConstant'

export async function getUnits() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${UOM}`

  return axios
    .get(url)
    .then(response => {
      console.log('response data', response)
      if (response?.status == 200 && response?.data?.success) {
        return response.data.data
      } else {
        return []
      }
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

export async function addUnits(payload) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${UOM}`
  console.log('url', url)

  console.log('params: ', payload)

  return axios({
    method: 'post',
    url: url,
    data: payload,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(response => {
      console.log('State POST DATA', response)

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

// /state/1/show
export async function getUnitsById(id) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${UOM}/${id}/show`

  return axios
    .get(url)
    .then(response => {
      console.log('response data', response)

      return response
    })
    .then(response => {
      console.log('State POST DATA', response)

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

export async function updateUnits(id, payload) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${UOM}/${id}/update`
  console.log('url', url)

  console.log('params: ', payload)

  return axios({
    method: 'post',
    url: url,
    data: payload,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(response => {
      console.log('Generic Update DATA', response)

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
