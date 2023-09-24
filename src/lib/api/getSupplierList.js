import axios from 'axios'
import { SUPPLIER } from '../../constants/ApiConstant'

export async function getSuppliers() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SUPPLIER}`
  console.log('url', url)

  return axios
    .get(url)
    .then(response => {
      console.log('supliers response data', response)

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

export async function getSupplierById(id) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SUPPLIER}/${id}/show`

  return axios
    .get(url)
    .then(response => {
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

export async function updateSuppliersById(payload, id) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SUPPLIER}/${id}/update`
  console.log('url', url)
  debugger
  console.log('params: ', payload)
  debugger

  var data = payload

  data.id = id

  return axios({
    method: 'post',
    url: url,
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(response => {
      console.log('supliers post data', response)

      return response?.data
    })
    .catch(error => {
      debugger
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
