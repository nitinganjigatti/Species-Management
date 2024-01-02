import {
  REQUEST_ITEMS,
  BATCH_DETAILS,
  DISPATCH,
  SHIPMENT,
  REQUEST_ITEMS_NOT_AVAILABLE,
  REQUEST_ITEMS_NOT_AVAILABLE_REVERT,
  DIRECT_DISPATCH
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getDirectDispatchItemsList({ params }) {
  const response = await axiosGet({ url: DIRECT_DISPATCH, params, pharmacy })

  return response.data
}

export async function getDirectDispatchItemsListById(id) {
  const response = await axiosGet({ url: `${DIRECT_DISPATCH}/${id}/show`, pharmacy })

  return response.data
}

export async function getAvailableMedicineByMedicineId(id, data, store) {
  const response = await axiosGet({ url: `${BATCH_DETAILS}/${id}/${store}`, body: data, pharmacy })

  return response.data
}

export async function addDirectDispatchItems(payload) {
  try {
    const url = `${DIRECT_DISPATCH}`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy })

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

export async function getDispatchItemsByBatchId(id) {
  const response = await axiosGet({ url: `${DISPATCH}/${id}/show`, pharmacy })

  return response.data
}

export async function addRequestItems(payload) {
  try {
    const url = `${REQUEST_ITEMS}`
    const response = await axiosFormPost({ url, body: payload, pharmacy })

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

export async function updateRequestItems(id, payload) {
  try {
    const url = `${REQUEST_ITEMS}/${id}/update`
    var data = payload
    data.id = id

    const response = await axiosFormPost({ url, body: data, pharmacy })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function shipRequestedItems(payload) {
  try {
    const url = `${SHIPMENT}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy })

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

export async function getShippedItemsByRequestId(id) {
  const response = await axiosGet({ url: `${SHIPMENT}/${id}/show`, pharmacy })

  return response.data
}

export async function updateShipmentRequest(id, payload) {
  try {
    const url = `${SHIPMENT}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data, pharmacy })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
