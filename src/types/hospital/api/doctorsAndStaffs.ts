import { Id, HospitalStaff } from "../models"

export type AddRemoveDoctorAction = 'add' | 'delete'

export interface HospitalStaffListParams {
  q?: string
  page_no?: number | string
  limit?: number | string
  hospital_id?: Id
  is_hospital_chief_doctor?: string
}

export interface HospitalStaffListResponse {
  success?: boolean
  data: {
    total?: number
    records?: HospitalStaff[]
    current_page?: number
    per_page?: number
    total_pages?: number
  }
  message?: string
}

export interface AddRemoveChiefDoctorResponse {
  success?: boolean
  data?: unknown[]
  message?: string
}

export interface AddRemoveChiefDoctorPayload {
  action?: AddRemoveDoctorAction
  hospital_id?: Id
  hospital_chief_doctor?: Id
}