import { SHIPMENT, DISPUTE_ITEM, DISPENSE_ITEM } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getShipmentList() {
  const response = await axiosGet({ url: SHIPMENT })

  return response.data.data
}

export async function getShipmentOrderDetails(id) {
  const response = await axiosGet({ url: `${SHIPMENT}/shipped/${id}` })

  return response.data
}

export async function getDisputeItemList(id) {
  const response = await axiosGet({ url: `${DISPUTE_ITEM}/${id}/request` })

  return response.data
}

export async function getDisputeItemById(id) {
  const response = await axiosGet({ url: `${DISPUTE_ITEM}/${id}/show` })

  return response.data.data
}

export async function addDisputeItems(payload) {
  try {
    const url = `${DISPUTE_ITEM}`
    var data = payload

    const response = await axiosPost({ url, body: data })

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

export async function upDateDisputeItems(id, payload) {
  try {
    const url = `${DISPUTE_ITEM}/${id}/update`
    var data = payload
    data.id = id

    const response = await axiosPost({ url, body: data })

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

export async function addDispenseItems(payload) {
  try {
    const url = `${DISPENSE_ITEM}`
    var data = payload

    const response = await axiosPost({ url, body: data })

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
