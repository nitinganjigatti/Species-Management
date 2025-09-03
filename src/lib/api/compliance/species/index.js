import { GET_TRADE_SPECIES_LISTING, GET_TRADE_SPECIES_SHIPMENT_LIST } from 'src/constants/ApiConstant'
import { axiosGet } from '../../utility'

export const getSpeciesData = async params => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_LISTING}`, params })

  return response?.data
}

export const getSpeciesShipmentList = async ({ params, id }) => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_SHIPMENT_LIST}${id}`, params })

  return response?.data
}

export const getSpeciesShipmentDetails = async ({ speciesId, shipmentId }) => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_SHIPMENT_LIST}${speciesId}/${shipmentId}` })

  return response?.data
}
