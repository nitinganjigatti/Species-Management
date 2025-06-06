import { GET_ALL_SHIPMENTS } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

// https://api.dev.antzsystems.com/api/shipment/receive/show
export async function getAllShipments({ params }) {
  const response = await axiosGet({ url: `${GET_ALL_SHIPMENTS}`, params, pharmacy: true })

  return response.data
}
