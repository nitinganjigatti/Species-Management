import { BedRecord, RoomDetail  } from "../../models"
import { Id } from "../../models"

export interface GetHospitalBedsResponse {
  success: boolean
  data?: {
    total?: number
    records?: BedRecord[]
    page?: string
    per_page?: number
    total_pages?: number
    room_detail?: RoomDetail
  }
 message?: string
}

export interface GetHospitalBedsParams {
  hospital_id?: string
  room_id?: string
  page?: number
  limit?: number
  q?: string
  status?: string | number
}

export interface BedFilters {
  page: number
  limit: number
  q: string
  status?: string | number 
}

export interface AddBedPayload {
  id?: Id
  hospital_id: Id
  room_id: Id
  bed_name: string
  status: number | string
  prefix?: string | string[]
}

export interface UpdateBedPayload {
  bed_id: Id
  id?: Id
  hospital_id: Id
  bed_name: string
  status: number | string
  prefix?: string | string[]
}

export interface AddBedResponse {
  success: boolean
  message?: string
  data?: BedRecord
}

export interface UpdateBedResponse {
  success: boolean
  message?: string
  data?: BedRecord
}