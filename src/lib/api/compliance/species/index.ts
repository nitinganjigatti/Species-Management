import {
  GET_SPECIES_DETAILS_SHIPMENT_EXPORT_LIST,
  GET_TRADE_SPECIES_LISTING,
  GET_TRADE_SPECIES_SHIPMENT_LIST
} from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>

import type {
  GetSpeciesDataParams,
  GetSpeciesDataResponse,
  GetSpeciesShipmentListParams,
  GetSpeciesShipmentListResponse,
  GetSpeciesShipmentDetailsParams,
  ApiResponse
} from 'src/types/compliance'

export const getSpeciesData = async (params: GetSpeciesDataParams): Promise<GetSpeciesDataResponse> => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_LISTING}`, params })

  return response?.data
}

export const getSpeciesShipmentList = async ({ params, id }: GetSpeciesShipmentListParams): Promise<GetSpeciesShipmentListResponse> => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_SHIPMENT_LIST}${id}`, params })

  return response?.data
}

export const getSpeciesShipmentDetails = async ({ speciesId, shipmentId }: GetSpeciesShipmentDetailsParams): Promise<ApiResponse<unknown>> => {
  const response = await axiosGet({ url: `${GET_TRADE_SPECIES_SHIPMENT_LIST}${speciesId}/${shipmentId}` })

  return response?.data
}

export const getSpeciesDetailsShipmentExports = async ({ speciesId, shipmentId }: GetSpeciesShipmentDetailsParams): Promise<ApiResponse<unknown>> => {
  const response = await axiosGet({ url: `${GET_SPECIES_DETAILS_SHIPMENT_EXPORT_LIST}${speciesId}/${shipmentId}` })

  return response?.data
}
