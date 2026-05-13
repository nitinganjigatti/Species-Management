import {
  GET_DOCUMENT_TYPE_LIST,
  CREATE_DOCUMENT_TYPE,
  UPDATE_DOCUMENT_TYPE,
  GET_TRADE_CONTEXT_TYPE,
  GET_TRADE_PARTIES_LIST
} from 'src/constants/ApiConstant'

import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../../utility'

const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

import type {
  ApiError,
  ApiResponse,
  GetDocumentTypeListParams,
  GetDocumentTypeListMastersResponse,
  GetMasterImportsParams,
  GetMasterImportsResponse,
  CreateTradePartiesPayload,
  AddDocumentTypePayload,
  GetTradeContextTypesResponse,
  Id
} from 'src/types/compliance'

export async function getDocumentTypeList(params: GetDocumentTypeListParams): Promise<GetDocumentTypeListMastersResponse> {
  const response = await axiosGet({
    url: `${GET_DOCUMENT_TYPE_LIST}`,
    params
  })

  return response.data
}

export async function getMasterImports(params: GetMasterImportsParams): Promise<GetMasterImportsResponse> {
  const response = await axiosGet({
    url: `${GET_TRADE_PARTIES_LIST}`,
    params
  })

  return response.data
}

export async function createTradeParties(payload: CreateTradePartiesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}`
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

export async function updateTradeParties(id: Id, payload: CreateTradePartiesPayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}/update/${id}`
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

export async function deleteTradeParties(id: Id): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}/delete/${id}`
    const response = await axiosGet({ url })

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

export async function addDocumentType(payload: AddDocumentTypePayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${CREATE_DOCUMENT_TYPE}`
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

export async function updateDocumentType(id: Id, payload: AddDocumentTypePayload): Promise<ApiResponse<{ id?: Id }>> {
  try {
    const url = `${UPDATE_DOCUMENT_TYPE}/${id}`
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

export async function getTradeContextTypes(): Promise<GetTradeContextTypesResponse> {
  try {
    const response = await axiosGet({
      url: `${GET_TRADE_CONTEXT_TYPE}`
    })

    return response.data
  } catch (error) {
    const apiError = error as ApiError
    console.error('Error fetching trade context types:', apiError)

    return error as GetTradeContextTypesResponse
  }
}
