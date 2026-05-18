import {
  PURCHASE,
  CHECK_BATCH,
  PHARMACY_BASE_URL,
  UPDATE_PURCHASE_BASE_URL,
  VALIDATE_PURCHASE,
  PRODUCT_MAPPING_FOR_ML,
  MEDICINE,
  VARIANTS_MAPPING_FOR_BATCH,
  INVOICE_PRINT
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getPurchaseList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${PURCHASE}`, params, pharmacy: true })

  return response.data
}

export async function getPurchaseListById(id) {
  const response = await axiosGet({ url: `v1/pharma/${PURCHASE}/${id}/show`, pharmacy: true })

  return response.data
}

export async function postDeleteInvoiceById(id, params) {
  console.log('params', params)

  const response = await axiosFormPost({
    url: `v1/pharma/${PURCHASE}/${id}/deleteinvoicetranscript`,
    body: params,
    pharmacy: true
  })

  return response.data
}

export async function addPurchase(payload) {
  try {
    const url = `v3/pharma/${PURCHASE}`
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

export async function updatePurchase(id, payload) {
  try {
    const url = `${UPDATE_PURCHASE_BASE_URL}${PURCHASE}/${id}/update`
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

export async function updatePurchasePrice(id, payload) {
  try {
    // const url = `${UPDATE_PURCHASE_BASE_URL}${PURCHASE}/${id}/update`
    const url = `v4/pharma/${PURCHASE}/${id}/update`
    var data = payload
    data.id = id
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

export async function validatePurchaseProducts(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${PURCHASE}/${VALIDATE_PURCHASE}`
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

export async function productMappingForMlTraining(payload) {
  try {
    const url = `${PRODUCT_MAPPING_FOR_ML}`
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

export async function variantMappingForProductBatch(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${MEDICINE}/${VARIANTS_MAPPING_FOR_BATCH}`

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

export async function createPurchase(payload) {
  try {
    const url = `v4/pharma/${PURCHASE}`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function printPurchaseInvoice(purchaseId) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${PURCHASE}/${INVOICE_PRINT}/${purchaseId}`,
    pharmacy: true
  })

  return response.data
}
