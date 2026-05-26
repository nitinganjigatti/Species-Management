import { HospitalLists, StatusAction } from "../../models"
import { Availability } from "../../api"

export interface AddHospitalMasterPayload {
  name?: string
  description?: string | null
  site_id?: string | number | null
  entity_type?: string
  is_external?: string | number
}

export interface AddHospitalMasterResponse {
  success: boolean
  message?: string
  data: {
    name: string
  }
}

export interface GetHospitalListResponse {
  success: boolean
  message?: string
  data?: {
    hospitals: HospitalLists[]
    total: number
  }
}

export interface GetHospitalListParams {
  params?: {
    page?: number
    limit?: number
    q?: string
    sort_order?: string
    sort_by?: string
    active?: number
    has_permission?: number
  }
}

export interface HospitalMasterFilters {
  page: number
  limit: number
  q: string
  active?: number
  sort_order: string
  sort_by: string
  availability?: Availability
  status?: string
}

