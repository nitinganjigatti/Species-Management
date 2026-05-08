import type {
  Lab,
  LabSampleWithTests,
  LabSampleMaster,
  LabTestMaster,
  MortalityReason,
  LabSite,
  LabUser,
  RequestItem,
  LabRequestRow,
  RequestStats,
  LabTransferOption
} from './models'

// ==================== Generic API Types ====================

export interface ApiResponse<T = unknown> {
  success?: boolean
  is_success?: boolean
  status?: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  result: T[]
  total_count: number
  page?: number
  limit?: number
}

// ==================== Add / Get / Update Lab ====================

export interface AddLabPayload {
  lab_name: string
  type: 'internal' | 'external'
  incharge_name: string
  address: string
  lab_contact_number: string
  latitudes?: number | string
  longitudes?: number | string
  lab?: string
  is_default?: number | string
  image?: File | string
}

export interface LabListParams {
  sort_order?: string
  q?: string
  sort_column?: string
  page?: number
  limit?: number
}

export type LabListResponse = ApiResponse<{
  total_count: number
  result: Lab[]
}>

export type LabDetailResponse = ApiResponse<Lab[]>

// ==================== Lab Sites & Users ====================

export interface LabSitesParams {
  lab_id?: number | string | string[]
  short?: string
}

export type LabSitesResponse = ApiResponse<LabSite[]>

export interface LabUsersParams {
  lab_id?: number | string | string[]
  sort?: string
  q?: string
}

export type LabUsersResponse = ApiResponse<{ labs: LabUser[] }>

// ==================== Lab Request Listing ====================

export interface LabReportParams {
  q?: string
  sort?: string
  column?: string
  page?: number
  limit?: number
  lab_id?: string | number
}

export type LabReportResponse = ApiResponse<{
  total_count: number
  result: LabRequestRow[]
}>

export interface RequestDetailsParams {
  lab_id?: string | number
  q?: string
  sort?: string
}

export type RequestDetailsResponse = ApiResponse<{
  total_count: number
  result: RequestItem[]
}>

// ==================== Transfer & Status ====================

export interface TransferLabPayload {
  replaced_lab_id: string | number
  transfer_reason: string
}

export interface UpdateStatusPayload {
  status: string
}

export interface UploadLabReportsPayload {
  medical_record_id?: number | string
  animal_id?: number | string
  lab_test_id?: string | number
  lab_test_files: File[]
  entity_type?: string
  entity_id?: string | number
}

export interface DeleteAttachmentParams {
  lab_test_id?: string | number
}

export interface GetLabListByTestIdParams {
  test_ids?: (string | number)[]
  lab_id?: number | string
}

export type LabTransferOptionsResponse = ApiResponse<LabTransferOption[]>

export interface BulkStatusPayload {
  status: string
  lab_request?: string | number
  test_ids: (string | number)[]
}

export interface BulkTransferPayload {
  test_ids: (string | number)[]
  replaced_lab_id: string | number
  transfer_reason: string
}

export interface CommentPayload {
  notes: string
}

// ==================== Master - Lab Sample ====================

export interface LabSampleListParams {
  id?: string | number
  q?: string
  sort?: string
  page?: number
  limit?: number
}

export type LabSampleListResponse = ApiResponse<{
  total_count: number
  result: LabSampleMaster[]
}>

export interface LabSamplePayload {
  test_name?: string
  label?: string
  name?: string
}

// ==================== Master - Lab Test ====================

export interface LabTestListParams {
  q?: string
  sort?: string
  page?: number
  limit?: number
  id?: number | string
}

export type LabTestListResponse = ApiResponse<{
  total_count: number
  result: LabTestMaster[]
}>

export interface LabTestPayload {
  test_name: string
  sample_ids?: (number | string)[]
  sub_tests?: SubTestPayload[]
  deleted_sub_tests?: (number | string)[]
  new_sub_tests?: string[]
}

export interface SubTestPayload {
  id?: number
  test_name: string
}

// ==================== Master - Mortality Reason ====================

export interface MortalityReasonListParams {
  q?: string
  sort?: string
  page?: number
  limit?: number
}

export type MortalityReasonListResponse = ApiResponse<{
  total_count?: number
  result?: MortalityReason[]
  data?: MortalityReason[]
}>

export type MortalityReasonDetailResponse = ApiResponse<MortalityReason>

export interface MortalityReasonPayload {
  name: string
  description?: string
  active?: boolean | number | string
}

// ==================== Test Stats ====================

export interface LabTestStatsParams {
  lab_id?: string | number
}

export type LabTestStatsResponse = ApiResponse<{
  stats: RequestStats
}>
