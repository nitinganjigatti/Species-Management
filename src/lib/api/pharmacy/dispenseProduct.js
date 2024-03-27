import {
  ANIMAL_LIST,
  BATCH_LIST,
  DISPENSE_LIST,
  PRODUCT_LIST,
  SUBMIT_DISPENSE,
  USER_LIST
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDispenseList({ params }) {
  const response = await axiosGet({ url: `${DISPENSE_LIST}`, params, pharmacy: true })

  return response.data
}

export async function getUserList(payload) {
  try {
    const url = `${USER_LIST}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getProductList({ params }) {
  const response = await axiosGet({ url: `${PRODUCT_LIST}`, params, pharmacy: true })

  return response.data
}

export async function getBatchList({ ProductId, store_type, stock_type }) {
  const response = await axiosGet({
    url: `${BATCH_LIST}/${ProductId}`,
    pharmacy: true
  })

  return response.data
}

export async function getAnimalList(payload, query) {
  try {
    const url = `${ANIMAL_LIST}?type=${query}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function submitDispense(payload) {
  try {
    const url = `${SUBMIT_DISPENSE}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getDispenseById(dispenseId) {
  const response = await axiosGet({ url: `${SUBMIT_DISPENSE}/${dispenseId}/show`, pharmacy: true })

  return response.data
}
