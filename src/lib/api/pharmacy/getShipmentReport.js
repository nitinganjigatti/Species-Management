import { PHARMACY_BASE_URL, SHIPMENT_REPORT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getShipmentReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${SHIPMENT_REPORT}`, params, pharmacy: true })

  return response?.data
}
