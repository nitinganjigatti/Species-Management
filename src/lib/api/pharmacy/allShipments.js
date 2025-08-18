import { GET_ALL_SHIPMENTS, INCOMING_AND_OUTGOING_SHIPMENTS, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getAllShipments({ params }) {
  const response = await axiosGet({ url: `${GET_ALL_SHIPMENTS}`, params, pharmacy: true })

  return response.data
}

export async function getIncomingAndOutgoingShipments({ params }) {
  const response = await axiosGet({
    url: `${PHARMACY_BASE_URL}${INCOMING_AND_OUTGOING_SHIPMENTS}`,
    params,
    pharmacy: true
  })

  return response.data
}
