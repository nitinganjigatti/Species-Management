import {
  PHARMACY_BASE_URL,
  All_STORES_REQUESTS,
  SELECTED_STORES_REQUESTS,
  ALL_SHIPPING_ITEMS_OF_SELECTED_STORE,
  ALL_SHIPPED_ITEMS_OF_SELECTED_STORE,
  SELECTED_STORE_SHIPMENT_ORDER_DETAILS
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getRequestListsOfAllStores({ params }) {
  const url = `${PHARMACY_BASE_URL}${All_STORES_REQUESTS}`

  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}

export async function getAllRequestsOfSelectedStore({ params }, storeId) {
  const url = `${PHARMACY_BASE_URL}${SELECTED_STORES_REQUESTS}/${storeId}`

  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}

export async function getAllRequestsOfSelectedProduct(storeId, itemId) {
  const url = `${PHARMACY_BASE_URL}${SELECTED_STORES_REQUESTS}/${storeId}/${itemId}`

  const response = await axiosGet({ url, pharmacy })

  return response?.data
}

export async function getAllUniquePendingList({ params }) {
  const url = `${PHARMACY_BASE_URL}${SELECTED_STORES_REQUESTS}`
  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}

export async function getAllShipmentsSelectedStore({ params }, storeId) {
  const url = `${PHARMACY_BASE_URL}${ALL_SHIPPING_ITEMS_OF_SELECTED_STORE}/${storeId}/show`

  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}

export async function getAllShippedItemsOfSelectedStore({ params }, storeId) {
  const url = `${PHARMACY_BASE_URL}${ALL_SHIPPED_ITEMS_OF_SELECTED_STORE}/${storeId}/show`

  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}

export async function getShipmentDetailOfOrder(shipmentId) {
  const url = `${PHARMACY_BASE_URL}${SELECTED_STORE_SHIPMENT_ORDER_DETAILS}/${shipmentId}`

  const response = await axiosGet({ url, pharmacy })

  return response?.data
}
