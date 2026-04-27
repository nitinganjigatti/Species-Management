import { PurposeOfVisit, SurgeryModel, StatusAction } from "../../models"
export interface SurgeryResponse {
  success?: boolean
  message?: string
  data?: {
    surgeries?: SurgeryModel[]
    currentPage?: number
    per_page?: number
    total_pages?: number
    total_records?: number
  }
  total?: number
  count?: number
  total_records?: number
  totalCount?: number
  pagination?: {
    total?: number
  }
}

export interface SurgeryParams {
  page_no: string | number
  limit: string | number
  q: string
  visit_type?: PurposeOfVisit
}

export interface SurgeryFilter {
  page: string | number
  limit: string | number
  q: string
  visit_type?: string

}

export interface AddUpdateSurgeryPayload {
  surgery_name?: string
  description?: string
  status?: StatusAction
}

export type AddUpdateSurgeryResponse = SurgeryResponse

export interface SurgeryFilters {
  page?: number
  limit?: number
  q: string
}