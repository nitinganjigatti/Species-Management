import { PHARMACY_BASE_URL, All_STORES_REQUESTS, SELECTED_STORES_REQUESTS } from '../../../constants/ApiConstant'
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
