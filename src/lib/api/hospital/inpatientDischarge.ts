import { ADD_DISCHARGE, NECROPSY_CENTER } from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'

export async function addInpatientDischarge(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${ADD_DISCHARGE}`, body: payload })

  return response?.data
}

export async function getNecropsyCenter(params: Record<string, unknown>): Promise<any> {
  const response = await axiosGet({ url: `${NECROPSY_CENTER}`, params })

  return response?.data
}
