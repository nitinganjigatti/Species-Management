import { RoomRecord, HospitalDetail, StatusAction, Id, HospitalBed, RoomDetail } from "../models"
export interface RoomListResponse {
  success: boolean
  data: {
    total: number
    records: RoomRecord[]
    page: string
    limit: number
    total_pages: number
    hospital_detail: HospitalDetail
  }

}

export interface RoomListParams {
  hospital_id: string | number
  status?: StatusAction[]
  page: number
  per_page: number
  q: string
}

export interface RoomEnclosureResponse {
  success?: boolean
  data?: {
    total?: number
    records?: HospitalBed[]
    page: string
    per_page: number
    total_pages: number
    room_detail: RoomDetail
  }

}

export interface RoomEnclosureParams {
  hospital_id?: Id
  page?: number
  per_page?: number
  q?: string
  status?: StatusAction,
  room_id?: Id
}
