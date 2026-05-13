import {
  CREATE_ROOMS_AND_ENCLOSURES,
  DELETE_ROOMS_AND_ENCLOSURES,
  GET_HOSPITAL_ROOMS,
  GET_ROOMS_AND_ENCLOSURES
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'
import { RoomEnclosureParams, RoomListParams, RoomListResponse, RoomEnclosureResponse } from 'src/types/hospital/api/roomsAndEnclosure';

export async function getRoomsAndEnclosures(
  params: RoomEnclosureParams
): Promise<RoomEnclosureResponse> {
  const response = await axiosGet({ url: `${GET_ROOMS_AND_ENCLOSURES}`, params })

  return response?.data
}

export async function addRoomsAndEnclosures(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${CREATE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function deleteRoomsAndEnclosures(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${DELETE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function updateRoomsAndEnclosures(
  id: string | number,
  payload: FormData | Record<string, unknown>
): Promise<void> {
  // const url = `${UPDATE_MASTERS_HOSPITAL}/${id}`
  //   const response = await axiosFormPost({ url, body: payload })
  //   return response?.data
  void id
  void payload
}

export async function getHospitalRoomsList(
  params: RoomListParams
): Promise<RoomListResponse> {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params })

  return response?.data
}
