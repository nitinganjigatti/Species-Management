import { SHIPMENT } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getShipmentList() {
  const response = await axiosGet({ url: SHIPMENT })

  return response.data.data
}
