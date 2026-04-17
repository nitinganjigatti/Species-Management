import {
  CREATE_ROOMS_AND_ENCLOSURES,
  DELETE_ROOMS_AND_ENCLOSURES,
  GET_HOSPITAL_ROOMS,
  GET_PATIENT_LIST_BY_ENCLOSURES,
  GET_ROOMS_AND_ENCLOSURES,
  ROOM_STATUS_UPDATE,
  UPDATE_HOSPITAL_BED
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  BedListResponse,
  RoomListResponse,
  RoomsAndEnclosuresResponse
} from 'src/types/hospital'

export async function getHospitalBeds(params: Record<string, unknown>): Promise<BedListResponse> {
  const response = await axiosGet({ url: `${GET_ROOMS_AND_ENCLOSURES}`, params })

  return response?.data
}

export async function addHospitalBed(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${CREATE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function updateHospitalBed(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const url = `${UPDATE_HOSPITAL_BED}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function updateRoomStatus(
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const url = `${ROOM_STATUS_UPDATE}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function getRoomsAndEnclosures(
  params: Record<string, unknown>
): Promise<RoomsAndEnclosuresResponse> {
  const response = await axiosGet({ url: `${GET_ROOMS_AND_ENCLOSURES}`, params })

  return response?.data
}

export async function getHospitalRooms({
  params
}: {
  params: Record<string, unknown>
}): Promise<RoomListResponse> {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params })

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
  params: Record<string, unknown>
): Promise<RoomListResponse> {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params })

  return response?.data
}

export async function getPatientListByEnclosures(
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const response = await axiosGet({ url: `${GET_PATIENT_LIST_BY_ENCLOSURES}`, params })

  return response?.data
}
