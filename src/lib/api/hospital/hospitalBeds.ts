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

import type { ApiResponse } from 'src/types/hospital'

import { GetHospitalBedsParams, AddBedPayload, UpdateBedPayload, AddBedResponse, UpdateBedResponse, GetHospitalBedsResponse } from 'src/types/hospital/api/Masters/hospitalBedTypes';

import { RoomListResponse, RoomEnclosureResponse, RoomListParams } from 'src/types/hospital/api/roomsAndEnclosure';
import { UpdateRoomStatusPayload, UpdateRoomStatusResponse } from 'src/types/hospital/api/Masters/hospitalRoomTypes';

export async function getHospitalBeds(params: GetHospitalBedsParams): Promise<GetHospitalBedsResponse> {
  const response = await axiosGet({ url: `${GET_ROOMS_AND_ENCLOSURES}`, params })

  return response?.data
}

export async function addHospitalBed(
  payload: AddBedPayload
): Promise<AddBedResponse> {
  const response = await axiosFormPost({ url: `${CREATE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function updateHospitalBed(
  payload: UpdateBedPayload
): Promise<UpdateBedResponse> {
  const url = `${UPDATE_HOSPITAL_BED}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function updateRoomStatus(
  payload: UpdateRoomStatusPayload
): Promise<UpdateRoomStatusResponse> {
  const url = `${ROOM_STATUS_UPDATE}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function getRoomsAndEnclosures(
  params: Record<string, unknown>
): Promise<RoomEnclosureResponse> {
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
