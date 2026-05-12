import {
  GET_SHIPMENTS_LIST,
  ADD_SHIPMENT_BASICDETAILS,
  UPDATE_SHIPMENT_BASICDETAILS,
  GET_SHIPMENT_BASICDETAILS,
  GET_EXPORT_ANIMAL_LIST,
  CREATE_SHIPMENT_SPECIES,
  UPDATE_SHIPMENT_SPECIES,
  GET_SHIPMENT_SPECIES_DATA,
  GET_LINKED_DOCUMENTS_SHIPMENT
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

import type {
  ApiError,
  ApiResponse,
  GetShipmentListParams,
  GetShipmentListResponse,
  AddShipmentPayload,
  GetShipmentBasicDetailsResponse,
  GetExportAnimalListResponse,
  CreateShipmentSpeciesPayload,
  GetShipmentSpeciesDataResponse,
  Id
} from 'src/types/compliance'

export const getShipmentList = async (params: GetShipmentListParams): Promise<GetShipmentListResponse> => {
  const response = await axiosGet({
    url: `${GET_SHIPMENTS_LIST}`,
    params
  })

  return response.data
}

export async function addShipmentBasicDetails(payload: AddShipmentPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${ADD_SHIPMENT_BASICDETAILS}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.response) {
      console.info('Request made and server responded')
      console.error(apiError.response.data)
      console.error(apiError.response.status)
      console.error(apiError.response.headers)
    }

    return error as ApiResponse<{ id?: Id }>
  }
}

export async function updateShipmentBasicDetails(id: Id, payload: AddShipmentPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${UPDATE_SHIPMENT_BASICDETAILS}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.response) {
      console.info('Request made and server responded')
      console.error(apiError.response.data)
      console.error(apiError.response.status)
      console.error(apiError.response.headers)
    }

    return error as ApiResponse<{ id?: Id }>
  }
}

export const getShipmentBasicDetails = async (id: Id, documentTypeId: Id, params?: Record<string, unknown>): Promise<GetShipmentBasicDetailsResponse> => {
  const response = await axiosGet({
    url: `${GET_SHIPMENT_BASICDETAILS}/${id}?document_type_id=${documentTypeId}`,
    params
  })

  return response.data
}

export const getExportAnimalList = async (id: Id, shipmentId: Id): Promise<GetExportAnimalListResponse> => {
  const response = await axiosGet({
    url: `${GET_EXPORT_ANIMAL_LIST}/${id}/${shipmentId}`
  })

  return response.data
}

export async function createShipmentSpecies(id: Id, payload: CreateShipmentSpeciesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${CREATE_SHIPMENT_SPECIES}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.response) {
      console.info('Request made and server responded')
      console.error(apiError.response.data)
      console.error(apiError.response.status)
      console.error(apiError.response.headers)
    }

    return error as ApiResponse<{ id?: Id }>
  }
}

export const getShipmentSpeciesData = async (id: Id, params?: Record<string, unknown>): Promise<GetShipmentSpeciesDataResponse> => {
  const response = await axiosGet({
    url: `${GET_SHIPMENT_SPECIES_DATA}/${id}`,
    params
  })

  return response.data
}

export async function updateShipmentSpecies(id: Id, payload: CreateShipmentSpeciesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${UPDATE_SHIPMENT_SPECIES}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.response) {
      console.info('Request made and server responded')
      console.error(apiError.response.data)
      console.error(apiError.response.status)
      console.error(apiError.response.headers)
    }

    return error as ApiResponse<{ id?: Id }>
  }
}

export const getLinkedDocumentsShipments = async (id: Id): Promise<ApiResponse<{ id?: Id }>> => {
  const response = await axiosGet({
    url: `${GET_LINKED_DOCUMENTS_SHIPMENT}/${id}`
  })

  return response.data
}
