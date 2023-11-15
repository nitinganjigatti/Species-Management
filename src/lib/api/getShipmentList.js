import { SHIPMENT } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getShipmentList() {
  const response = await axiosGet({ url: SHIPMENT })

  return response.data.data
}

export async function getShipmentOrderDetails(id) {
  const response = await axiosGet({ url: `${SHIPMENT}/shipped/${id}` })

  return response.data
}
