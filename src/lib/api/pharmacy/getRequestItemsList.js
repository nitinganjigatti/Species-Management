import {
  REQUEST_ITEMS,
  BATCH_DETAILS,
  DISPATCH,
  DISPATCH_ITEM,
  SHIPMENT,
  REQUEST_ITEMS_NOT_AVAILABLE,
  REQUEST_ITEMS_NOT_AVAILABLE_REVERT,
  AlTERNATIVE_MEDICINE,
  REJECT_MEDICINE,
  NOT_AVAILABLE_PRODUCT
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getRequestItemsList({ params }) {
  const response = await axiosGet({ url: REQUEST_ITEMS, params, pharmacy })

  return response.data
}

export async function getRequestItemsListById(id) {
  const response = await axiosGet({ url: `${REQUEST_ITEMS}/${id}/show`, pharmacy })

  return response.data
}

export async function getAvailableMedicineByMedicineId(id, data, store, productType, params) {
  // const response = await axiosGet({ url: `${BATCH_DETAILS}/${id}/${store}`, body: data, pharmacy })
  //have removed stock type--- &stock_type=${productType}
  const response = await axiosGet({
    url: `${BATCH_DETAILS}/${id}`,
    body: data,
    pharmacy,
    params: params ? params : null
  })

  return response.data
}

export async function addDispatch(payload) {
  try {
    const url = `${DISPATCH}`
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

export async function cancelRequestItems(id) {
  try {
    const url = `${REQUEST_ITEMS}/${id}/cancel`
    const response = await axiosPost({ url, pharmacy })

    return response
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

export async function markItemNotAvailable(payload) {
  try {
    const url = `${REQUEST_ITEMS_NOT_AVAILABLE}`
    const response = await axiosPost({ url, body: payload, pharmacy })

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

export async function markItemAvailable(payload) {
  try {
    const url = `${REQUEST_ITEMS_NOT_AVAILABLE_REVERT}`
    const response = await axiosPost({ url, body: payload, pharmacy })

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

export async function deleteFulfillItem(id) {
  try {
    const url = `${DISPATCH_ITEM}/${id}/delete`
    const response = await axiosGet({ url, pharmacy })

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

export async function getFulfillItem(id) {
  try {
    const url = `${DISPATCH}/${id}/showById`
    const response = await axiosGet({ url, pharmacy })

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

export async function updateFullFillLineItems(payload, id) {
  try {
    const url = `${DISPATCH}/${id}/update`
    const response = await axiosPost({ url, body: payload, pharmacy })

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

export async function deleteLineItem(id) {
  try {
    const url = `${REQUEST_ITEMS}/${id}/deleteRow`
    const response = await axiosGet({ url, pharmacy })

    return response
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

export async function getAvailableMedicineByMedicineIdToReturn(id, data, store, productType, is_return, stock_type) {
  // const response = await axiosGet({ url: `${BATCH_DETAILS}/${id}/${store}`, body: data, pharmacy })

  //have removed stock type--- &stock_type=${productType}
  const response = await axiosGet({
    url: `${BATCH_DETAILS}/${id}?is_return=${is_return}`,
    body: data,
    pharmacy
  })

  return response.data
}

export async function addAlternativeMedicine(payload, parentId) {
  try {
    const url = `${REQUEST_ITEMS}/${parentId}/${AlTERNATIVE_MEDICINE}`
    const response = await axiosFormPost({ url, body: payload, pharmacy })

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

export async function rejectMedicine(payload, parentId) {
  try {
    const url = `${REQUEST_ITEMS}/${parentId}/${REJECT_MEDICINE}`
    const response = await axiosPost({ url, body: payload, pharmacy })

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

export async function makeProductNotAvailable(payload, parentId) {
  try {
    const url = `${REQUEST_ITEMS}/${parentId}/${NOT_AVAILABLE_PRODUCT}`
    const response = await axiosPost({ url, body: payload, pharmacy })

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
