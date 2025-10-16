import {
  PHARMACY_BASE_URL,
  STORE_WISE_SHIPMENT_PDF,
  REQUEST_SHIPMENT_DETAILS_PDF
} from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getStoreWiseShipmentDetailPdf(shipmentId) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${STORE_WISE_SHIPMENT_PDF}/${shipmentId}`,
    pharmacy: true
  })

  return response.data
}

export async function getRequestsShipmentDetailPdf(shipmentId, requestId) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${REQUEST_SHIPMENT_DETAILS_PDF}/${shipmentId}/${requestId}`,
    pharmacy: true
  })

  return response.data
}
