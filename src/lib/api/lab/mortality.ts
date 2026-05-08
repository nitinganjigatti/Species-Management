import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as unknown as (opts: { url: string; params?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
import { LAB_MORTALITY_REASON } from 'src/constants/ApiConstant'
import type {
  ApiResponse,
  MortalityReasonListParams,
  MortalityReasonListResponse,
  MortalityReasonDetailResponse,
  MortalityReasonPayload
} from 'src/types/lab'

export async function getMortalityReasonsList({
  params
}: {
  params: MortalityReasonListParams
}): Promise<MortalityReasonListResponse> {
  const url = LAB_MORTALITY_REASON
  const response = await axiosGet({ url, params })

  return response.data
}

export async function getMortalityReasonsById(Id: string | number): Promise<MortalityReasonDetailResponse> {
  const url = `${LAB_MORTALITY_REASON}/${Id}`
  const response = await axiosGet({ url })

  return response.data
}

export async function addMortalityReasons(payload: MortalityReasonPayload): Promise<ApiResponse> {
  try {
    const url = LAB_MORTALITY_REASON
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

export async function updateMortalityReasons(id: string | number, payload: MortalityReasonPayload): Promise<ApiResponse> {
  const url = `${LAB_MORTALITY_REASON}/${id}`
  try {
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

export async function deleteMortalityReasons(id: string | number): Promise<ApiResponse> {
  const url = `${LAB_MORTALITY_REASON}/${id}`

  try {
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.error(axiosError.response.data)
    }

    return error as ApiResponse
  }
}
