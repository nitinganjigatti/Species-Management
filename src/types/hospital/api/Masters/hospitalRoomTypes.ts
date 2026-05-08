import { Id, RoomDetail } from "../../models"
import { RoomRecord, HospitalDetail, UpdateRoom, StatusAction } from "../../models"


export interface GetTransformedHospitalRoomsResponse {
  success: boolean
  records: RoomRecord[]
  total: number
  hospital_detail: HospitalDetail | null 
}

export interface GetHospitalRoomsResponse {
  success: boolean
  message?: string
  data: {
    total: number
    records: RoomRecord[]
    hospital_detail: HospitalDetail
    pages: string
    limit: number
    total_pages: number
  }
}

export interface GetHospitalRoomsParams {
  params?: {
    hospital_id: string
    page: number
    limit: number
    q: string
    availability?: string
    status?: string
    sort_by: string
    sort_order: string
  }
}

export interface HospitalRoomFilters {
  page: number
  limit: number
  q: string
  availability: string
  status: string
  sort_by: string
  sort_order: string
}
 
export interface AddRoomPayload {
  hospital_id?: Id
  room_name: string
  floor_name: string
  status: number | string
}

export interface AddRoomResponse {
  success: boolean
  data: HospitalDetail[]
  message?: string
}

export interface UpdateRoomResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface UpdateHospitalResponse {
  status?: boolean
  message?: string
  updated_fields?: string[]
  data?: {
    updated_data?: UpdateRoom
  }
}

export interface UpdateRoomPayload {
  hospital_id: Id
  room_name: string
  floor_name: string
  status: string | number
}

export interface UpdateHospitalPayload {
  description?: string
  entity_type?: string
  is_active?: string
  is_external?: number
  name?: string
  site_id?: number | string | null
  [key: string]: string | undefined | number | null
}

export interface UpdateRoomStatusResponse {
  success: boolean
  message?: string
  data?: unknown[]
}

export interface UpdateRoomStatusPayload {
  room_id?: Id
  status?: number | string 
}

export interface UpdateHospitalRoomResponse {
  success: boolean
  message?: string
  data?: unknown[]
}

export type AddUpdateRoomResponse =
  | AddRoomResponse
  | UpdateRoomResponse






