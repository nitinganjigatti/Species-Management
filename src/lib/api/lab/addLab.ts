import { AddLAB, GetLab, AllLabSample, LabEditGetById, UpdateLab } from '../../../constants/ApiConstant'
import { axiosGet as _axiosGet, axiosPost as _axiosPost, axiosFormPost as _axiosFormPost } from '../utility'

const axiosGet = _axiosGet as unknown as (opts: { url: string; params?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
import type { AddLabPayload, LabListParams, LabListResponse, LabDetailResponse } from 'src/types/lab'
import type { ApiResponse } from 'src/types/lab'

export async function addLab(payload: AddLabPayload): Promise<ApiResponse> {
  try {
    const url = `${AddLAB}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}

export async function getLabList({ params }: { params: LabListParams }): Promise<LabListResponse> {
  const response = await axiosGet({ url: `${GetLab}`, params })

  return response.data
}

export async function getAllLabSample(): Promise<unknown> {
  const response = await axiosGet({ url: AllLabSample })

  return response.data.data
}

export async function getLabDeatilsById(id: string | number): Promise<LabDetailResponse> {
  const response = await axiosGet({ url: `${LabEditGetById}${id}` })

  return response.data
}

export async function updateLabById(payload: AddLabPayload, id: string | number): Promise<ApiResponse> {
  try {
    const url = `${UpdateLab}${id}`
    const data = { ...payload, id }
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}
