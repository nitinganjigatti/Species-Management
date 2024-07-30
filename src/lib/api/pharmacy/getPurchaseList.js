import { PURCHASE, CHECK_BATCH, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getPurchaseList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${PURCHASE}`, params, pharmacy: true })

  return response.data
}

export async function getPurchaseListById(id) {
  const response = await axiosGet({ url: `${PURCHASE}/${id}/show`, pharmacy: true })

  return response.data
}

export async function addPurchase(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}`
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

export async function updatePurchase(id, payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/${id}/update`
    var data = payload
    data.id = id
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

export async function getBatchExpiry(params) {
  const response = await axiosGet({ url: `${CHECK_BATCH}`, params, pharmacy: true })

  return response.data
}

export async function uploadPurchaseFile(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/import`

    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function ValidateUploadPurchaseFile(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/importValidate`

    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function saveImportFileData(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/saveImport`
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
