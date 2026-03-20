/**
 * API request/response types for the Medical Records module
 */

// ==================== Generic API Types ====================

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  message?: string
}

// ==================== Medical Records API ====================

export interface MedicalRecordsParams {
  page_no?: number
  limit?: number
  q?: string
  from_date?: string | null
  to_date?: string | null
}

export interface MedicalRecordFilterParams {
  page_no?: number
  limit?: number
  animal_ids?: string
  site_ids?: string
  section_ids?: string
  enclosure_ids?: string
  species_ids?: string
  gender?: string
  start_date?: string
  end_date?: string
}

export interface MedicalReportParams {
  animal_ids?: string | number
  enclosure_ids?: string | number
  section_ids?: string | number
  site_ids?: string | number
  medical_record_id?: string | number
}

export interface MedicalRecordsResponse
  extends ApiResponse<{
    result: import('./models').MedicalRow[]
    total_count?: number
  }> {}

export interface MedicalReportResponse
  extends ApiResponse<{
    pdf_url?: string
    [key: string]: unknown
  }> {}
