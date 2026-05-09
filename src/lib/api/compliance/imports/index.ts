import {
  GET_IMPORTS_LIST,
  GET_EXPORTS_LIST_FOR_IMPORTS,
  CREATE_IMPORTS_SPECIES,
  UPDATE_IMPORTS_SPECIES,
  GET_LINKED_DOCUMENTS_IMPORTS
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

import type {
  ApiError,
  ApiResponse,
  GetImportsListParams,
  GetImportsListResponse,
  GetExportListResponse,
  GetExportListParams,
  CreateImportSpeciesPayload,
  Id
} from 'src/types/compliance'

export const getImportsList = async (params: GetImportsListParams): Promise<GetImportsListResponse> => {
  const response = await axiosGet({
    url: `${GET_IMPORTS_LIST}`,
    params
  })

  return response.data
}

export const getExportListForImports = async (params: GetExportListParams): Promise<GetExportListResponse> => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_LIST_FOR_IMPORTS}`,
    params
  })

  return response.data
}

export async function createImportSpecies(payload: CreateImportSpeciesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${CREATE_IMPORTS_SPECIES}`
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

export const getImportSpeciesData = async (id: Id, documentid: Id, params?: Record<string, unknown>): Promise<ApiResponse<{ id?: Id }>> => {
  const response = await axiosGet({
    url: `${CREATE_IMPORTS_SPECIES}/${id}?document_type_id=${documentid}`,
    params
  })

  return response.data
}

export async function updateImportSpecies(id: Id, payload: CreateImportSpeciesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${UPDATE_IMPORTS_SPECIES}/${id}`
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

export const getLinkedDocumentsImports = async (id: Id): Promise<ApiResponse<{ id?: Id }>> => {
  const response = await axiosGet({
    url: `${GET_LINKED_DOCUMENTS_IMPORTS}/${id}`
  })

  return response.data
}
