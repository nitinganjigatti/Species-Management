import {
  PHARMACY_BASE_URL,
  STORE_WISE_SHIPMENT_PDF,
  REQUEST_SHIPMENT_DETAILS_PDF
} from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

// 'http://localhost:8080/api/v1/pharma/shipment-store-item/shipped/print/1386' \
export async function getStoreWiseShipmentDetailPdf(shipmentId) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${STORE_WISE_SHIPMENT_PDF}/${shipmentId}`,
    pharmacy: true
  })

  return response.data
}

// 'http://localhost:8080/api/v1/pharma/shipment/shipped/print/1405/2083' \
export async function getRequestsShipmentDetailPdf(shipmentId, requestId) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${REQUEST_SHIPMENT_DETAILS_PDF}/${shipmentId}/${requestId}`,
    pharmacy: true
  })

  return response.data
}
