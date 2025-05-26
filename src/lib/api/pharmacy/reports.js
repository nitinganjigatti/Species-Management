import {
  PHARMACY_BASE_URL,
  PURCHASE_REPORT,
  SHIPMENT_REPORT,
  CONSUMPTION_REPORT,
  RETURN_REPORT,
  REQUESTED_ITEMS_REPORT,
  DISPENSE_REPORT,
  RETURN_TO_SUPPLIER,
  ALL_REQUESTED_ITEMS_REPORT
} from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getPurchaseReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${PURCHASE_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getShipmentReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${SHIPMENT_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getConsumptionReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${CONSUMPTION_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getReturnReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${RETURN_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getRequestedItemsReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${REQUESTED_ITEMS_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getDispenseReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${DISPENSE_REPORT}`, params, pharmacy: true })

  return response?.data
}

export async function getReturnToSupplier({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${RETURN_TO_SUPPLIER}`, params, pharmacy: true })

  return response?.data
}

export async function getAllRequestedItemsReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${ALL_REQUESTED_ITEMS_REPORT}`, params, pharmacy: true })

  return response?.data
}
