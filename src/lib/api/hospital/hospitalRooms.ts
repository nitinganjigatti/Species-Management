import {
  GET_HOSPITAL_ROOMS,
  CREATE_HOSPITAL_ROOM,
  UPDATE_HOSPITAL_ROOM,
  HOSPITAL_STATUS_UPDATE
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, RoomListResponse } from 'src/types/hospital'

export async function getHospitalRooms({
  params
}: {
  params: Record<string, unknown>
}): Promise<RoomListResponse> {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params })

  return response?.data
}

export async function addHospitalRoom(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${CREATE_HOSPITAL_ROOM}`, body: payload })

  return response?.data
}

export async function updateHospitalRoom(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const url = `${UPDATE_HOSPITAL_ROOM}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function updateHospitalStatus(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const url = `${HOSPITAL_STATUS_UPDATE}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}
