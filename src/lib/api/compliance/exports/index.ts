import {
  ADD_DOCUMENT,
  ADD_EXPORT,
  CREATE_MASTER_SPECIES,
  EDIT_DOCUMENT,
  EDIT_EXPORT,
  GET_DOCUMENT_TYPE,
  GET_EXPORTS_DETAILS,
  GET_EXPORTS_LIST,
  GET_LINKED_IMPORTS_DETAILS,
  GET_LINKED_SHIPMENT_DETAILS,
  GET_MASTER_SPECIES_LIST,
  GET_MASTERS_DATA,
  GET_SPECIES_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

import type {
  ApiError,
  ApiResponse,
  GetSpeciesListParams,
  GetExportListParams,
  AddExportPayload,
  GetDocumentTypeListParams,
  Id,
  GetSpeciesListResponse,
  GetExportListResponse,
  GetExportDetailsResponse,
  GetLinkedShipmentDetailsResponse,
  GetLinkedImportsDetailsResponse,
  AddExportResponse,
  GetDocumentTypeListResponse,
  GetMastersDataResponse
} from 'src/types/compliance'

export const getSpecies = async (): Promise<{
  success: boolean
  data: { label: string; value: string }[]
}> => {
  return {
    success: true,
    data: [
      { label: 'Species 1', value: 'report' },
      { label: 'Species 2', value: 'invoice' },
      { label: 'Species 3', value: 'manifest' }
    ]
  }
}

export async function getSpeciesList(params: GetSpeciesListParams): Promise<GetSpeciesListResponse> {
  const response = await axiosGet({ url: `${GET_SPECIES_LIST}`, params })

  return response.data
}

export async function getMasterSpeciesList(params: GetSpeciesListParams): Promise<GetSpeciesListResponse> {
  const response = await axiosGet({ url: `${GET_MASTER_SPECIES_LIST}`, params })

  return response.data
}

export const getExportList = async (params: GetExportListParams): Promise<GetExportListResponse> => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_LIST}`,
    params
  })

  return response.data
}

export const getExportDetails = async (id: Id, params?: Record<string, unknown>): Promise<GetExportDetailsResponse> => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_DETAILS}/${id}`,
    params
  })

  return response.data
}

export const getLinkedShipmentDetails = async (id: Id): Promise<GetLinkedShipmentDetailsResponse> => {
  const response = await axiosGet({
    url: `${GET_LINKED_SHIPMENT_DETAILS}/${id}`
  })

  return response.data
}

export const getLinkedImportsDetails = async (id: Id): Promise<GetLinkedImportsDetailsResponse> => {
  const response = await axiosGet({
    url: `${GET_LINKED_IMPORTS_DETAILS}/${id}`
  })

  return response.data
}

export async function addExport(payload: AddExportPayload): Promise<AddExportResponse> {
  try {
    const url = `${ADD_EXPORT}`
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

    return error as AddExportResponse
  }
}

export async function updateExport(id: Id, payload: AddExportPayload): Promise<AddExportResponse> {
  try {
    const url = `${EDIT_EXPORT}/${id}`
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

    return error as AddExportResponse
  }
}

export const getDocumentTypeList = async (params: GetDocumentTypeListParams): Promise<GetDocumentTypeListResponse> => {
  const response = await axiosGet({
    url: `${GET_DOCUMENT_TYPE}`,
    params
  })

  return response.data
}

export async function addDocument(payload: unknown): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${ADD_DOCUMENT}`
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

export async function updateDocument(id: Id, payload: unknown): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${EDIT_DOCUMENT}/${id}`
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

export async function createSpecies(payload: unknown): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${CREATE_MASTER_SPECIES}`
    const response = await axiosPost({ url, body: payload })

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

export const getMastersData = async (): Promise<GetMastersDataResponse> => {
  const response = await axiosGet({
    url: `${GET_MASTERS_DATA}`
  })

  return response.data
}
