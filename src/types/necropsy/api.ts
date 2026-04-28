/**
 * API request/response types for the Necropsy module
 */

import {
  NecropsyCenter,
  NecropsyStats,
  AnimalNecropsyItem,
  SpeciesNecropsyItem,
  MortalitySummary,
  NecropsySummary,
  CarcassTransfer,
  TransferAnimal,
  TransferChecklist,
  TransferChecklistItem,
  FilledChecklistItem,
  IncomingNecropsySummary,
  IncomingNecropsyBtnStatus,
  IncomingNecropsyComment,
  NecropsyTemplate,
  BodyPart,
  NecropsyTimelineItem,
  LabRequest,
  LabSample,
  LabTest,
  LabNote,
  LabReport,
  SampleLog,
  SelectOption,
  WeightUnitOption,
  MeasurementUnit,
  MedicalRecord,
  MedicalBasicData,
  ClinicalAssessment,
  AssessmentType,
  AssessmentData,
  MedicalJournalLog
} from './models'

// ==================== Generic API Types ====================

export interface ApiResponse<T> {
  success?: boolean
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
  stats?: Record<string, number>
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface ApiError {
  success: false
  message: string
  error?: string
  code?: string | number
}

// ==================== Necropsy Center API ====================

export interface NecropsyListingParams {
  q?: string
  has_permission?: number
}

export interface NecropsyListingResponse
  extends ApiResponse<{
    list: NecropsyCenter[]
  }> {}

export interface AddUpdateNecropsyCenterPayload {
  name: string
  code?: string
  address?: string
  site_id?: number | string
  contact_person?: string
  contact_number?: string
  email?: string
  is_active?: boolean | number
}

// ==================== Necropsy Stats API ====================

export interface NecropsyStatsParams {
  necropsy_center_id: number
  from_date?: string | null
  til_date?: string | null
  type?: 'animals' | 'species'
  use_case?: string
}

export interface NecropsyStatsApiResponse {
  incoming_count?: number
  pending_count?: number
  draft_count?: number
  completed_count?: number
  transfer_count?: number
}

export interface NecropsyStatsResponse
  extends ApiResponse<{
    result: NecropsyStatsApiResponse
  }> {}

// ==================== Animal Wise Necropsy API ====================

export interface AnimalWiseListParams {
  page_no?: number
  limit?: number
  q?: string
  from_date?: string | null
  to_date?: string | null
  status?: string
  necropsy_center_id?: number
  use_case?: string
  site_id?: string
  priority?: string
  sex_type?: string
  necropsy_on_site?: string
  necropsy_conducted_by?: string
  created_by?: string
}

export interface AnimalWiseListResponse extends ApiResponse<PaginatedData<AnimalNecropsyItem>> {}

// ==================== Species Wise Necropsy API ====================

export interface SpeciesWiseListParams {
  page_no?: number
  limit?: number
  q?: string
  from_date?: string | null
  til_date?: string | null
  status?: string
  necropsy_center_id?: number
  site_id?: number
  priority?: string
}

export interface SpeciesWiseListResponse extends ApiResponse<PaginatedData<SpeciesNecropsyItem>> {}

// ==================== Incoming Necropsy Transfer API ====================

export interface IncomingNecropsyTransferSummaryParams {
  transfer_id: number
}

export interface IncomingNecropsyTransferSummaryResponse extends ApiResponse<IncomingNecropsySummary> {}

export interface IncomingNecropsyChecklistDetailsParams {
  entity_type: string
}

export interface IncomingNecropsyChecklistDetailsResponse
  extends ApiResponse<{
    comments: IncomingNecropsyComment[]
    checklist_items?: TransferChecklist[]
  }> {}

export interface CreateIncomingNecropsyCommentPayload {
  entity_id: number
  entity_type: string
  content: string
  action: string
}

export interface IncomingNecropsyBtnStatusResponse extends ApiResponse<IncomingNecropsyBtnStatus> {}

export interface AcceptNecropsyTransferPayload {
  status?: 'COMPLETED' | 'REJECTED'
  reason?: string
}

// ==================== Transfer Animal API ====================

export interface TransferAnimalListParams {
  page_no?: number
  limit?: number
  q?: string
  status?: string
}

export interface TransferAnimalListResponse
  extends ApiResponse<{
    result: TransferAnimal[]
    total_count: number
  }> {}

// ==================== Transfer Checklist API ====================

export interface TransferChecklistResponse
  extends ApiResponse<{
    result: TransferChecklistItem[]
  }> {}

export interface FilledChecklistListResponse
  extends ApiResponse<{
    result: FilledChecklistItem[]
  }> {}

// ==================== Necropsy Summary API ====================

export interface NecropsySummaryResponse extends ApiResponse<NecropsySummary> {}

// ==================== Add/Edit Necropsy API ====================

export interface AddNecropsyPayload {
  animal_id: number
  mortality_id?: number
  necropsy_center_id: number
  necropsy_date?: string
  manner_of_death_id?: number
  carcass_disposition_id?: number
  gross_findings?: string
  histopathology_findings?: string
  final_diagnosis?: string
  comments?: string
  weight?: number
  weight_unit_id?: number
  necropsy_conducted_by?: number
  status?: string
  organs?: NecropsyOrganPayload[]
  attachments?: File[]
}

export interface NecropsyOrganPayload {
  organ_id: number
  findings?: string
  is_normal?: boolean
  images?: File[]
}

export interface EditNecropsyPayload extends AddNecropsyPayload {
  necropsy_id: number
}

export interface DeleteNecropsyPayload {
  necropsy_id: number
  reason?: string
}

// ==================== Necropsy Body Parts API ====================

export interface NecropsyBodyPartsPayload {
  species_id?: number
  taxonomy_id?: string
}

export interface NecropsyBodyPartsResponse extends ApiResponse<BodyPart[]> {}

// ==================== Necropsy Template API ====================

export interface NecropsyTemplateResponse
  extends ApiResponse<{
    result: NecropsyTemplate[]
  }> {}

export interface CreateNecropsyTemplatePayload {
  template_name: string
  description?: string
  is_default?: boolean
  body_parts?: {
    body_part_id: number
    organs?: number[]
  }[]
}

export interface UpdateNecropsyTemplatePayload extends CreateNecropsyTemplatePayload {}

// ==================== Necropsy Timeline API ====================

export interface NecropsyTimelineParams {
  necropsy_id?: number
  animal_id?: number
  mortality_id?: number | string
  from_date?: string
  to_date?: string
  page_no?: number
  limit?: number
  type?: string
}

export interface NecropsyTimelineResponse
  extends ApiResponse<{
    result: NecropsyTimelineItem[]
    total_count?: number
  }> {}

// ==================== Mortality Summary API ====================

export interface MortalitySummaryParams {
  mortality_id?: number | string
  necropsy_center_id?: number
  site_id?: number
  from_date?: string
  to_date?: string
}

export interface MortalitySummaryResponse extends ApiResponse<MortalitySummary> {}

// ==================== Medical Stats API ====================

export interface MedicalStatsParams {
  animal_id?: number | string
  from_date?: string
  to_date?: string
}

export interface MedicalStatsResponse
  extends ApiResponse<{
    result: Record<string, number>
  }> {}

// ==================== Necropsy PDF API ====================

export interface NecropsyPdfParams {
  necropsy_id: number
}

export interface NecropsyPdfResponse
  extends ApiResponse<{
    pdf_url: string
  }> {}

// ==================== Delete Attachment API ====================

export interface DeleteAttachmentPayload {
  attachment_type?: string
  reason?: string
}

// ==================== Form Options API ====================

export interface MannerOfDeathResponse
  extends ApiResponse<
    Array<{
      id?: number | string
      string_id?: string
      name?: string
      label?: string
      value?: string | number
    }>
  > {}

export interface CarcassDispositionResponse
  extends ApiResponse<
    | SelectOption[]
    | {
        result: Array<{
          id: number | string
          string_id?: string
          name: string
          label?: string
          value?: string | number
        }>
      }
  > {}

export interface MeasurementUnitsResponse extends ApiResponse<MeasurementUnit[]> {}

// ==================== Carcass Transfer List API ====================

export interface CarcassTransferListParams {
  page_no?: number
  limit?: number
  q?: string
  necropsy_center_id?: number | string
  reference_type?: string
  transfer_status?: string
  status?: string
  from_date?: string | null
  to_date?: string | null
  start_date?: string | null
  end_date?: string | null
  site_id?: number
  entity_type?: string
  entity_id?: number | string
}

export interface CarcassTransferListResponse extends ApiResponse<PaginatedData<CarcassTransfer>> {}

// ==================== Medical History API ====================

export interface MedicalRecordStatsParams {
  animal_id?: number | string
  medical?: string
  purpose?: string
  till_date?: string
  mortality_id?: number | string
}

export interface MedicalRecordStatsResponse {
  success?: boolean
  message?: string
  data?: {
    medical_record_count?: number
    diagnosis_count?: number
    prescription_count?: number
    lab_request_count?: number
    [key: string]: number | undefined
  }
}

export interface MedicalBasicDataListParams {
  page_no?: number
  limit?: number
  length?: number
}

export interface MedicalBasicDataListResponse
  extends ApiResponse<
    | {
        result: MedicalBasicData[]
      }
    | MedicalBasicData[]
  > {}

export interface MedicalCommonDataParams {
  page_no?: number
  limit?: number
  from_date?: string
  to_date?: string
  till_date?: string
  medical_type?: 'prescription' | 'diagnosis' | 'complaint' | 'clinical_notes' | 'side_effect'
  type?: 'all' | 'active' | 'closed'
  purpose?: string
  mortality_id?: number | string
}

export interface MedicalCommonDataResponse
  extends ApiResponse<{
    result: MedicalRecord[]
    active?: string | number
    closed?: string | number
    all?: string | number
  }> {}

export interface LabRequestsByAnimalParams {
  animal_id?: number | string
  mortality_id?: number | string
  till_date?: string
  type?: string
  page_no?: number
  limit?: number
  status?: string
  purpose?: string
}

export interface LabRequestsByAnimalResponse extends ApiResponse<PaginatedData<LabRequest> | LabRequest[]> {}

export interface AssessmentTypesResponse extends ApiResponse<AssessmentType[]> {}

export interface AssessmentDataParams {
  type_id?: number
  from_date?: string
  to_date?: string
}

export interface AssessmentDataResponse
  extends ApiResponse<{
    result: AssessmentData[]
  }> {}

export interface MedicalRecordDetailsResponse extends ApiResponse<MedicalRecord> {}

export interface MedicalJournalLogsParams {
  animal_id?: number | null
  medical_record_id?: number
  page?: number
  page_no?: number
  limit?: number
  from_date?: string
  to_date?: string
}

export interface MedicalJournalLogsResponse
  extends ApiResponse<{
    data: MedicalJournalLog[]
    result?: MedicalJournalLog[]
    total_count?: number
  }> {}

// ==================== Lab Details API ====================

export interface LabRequestDetailsResponse
  extends ApiResponse<{
    request_id: number
    request_code?: string
    lab_code?: string
    animal_id?: number
    animal_code?: string
    species_name?: string
    status?: string
    priority?: string
    requested_by?: string
    requested_at?: string
    tests?: LabTest[]
  }> {}

export interface LabRequestSamplesResponse
  extends ApiResponse<{
    sampleDetails: LabSample[]
  }> {}

export interface LabRequestNotesResponse extends ApiResponse<LabNote[]> {}

export interface LabRequestReportsResponse extends ApiResponse<LabReport[]> {}

export interface LabSubTestsResponse
  extends ApiResponse<
    | {
        subtests?: LabTest[]
        testList?: LabTest[]
      }
    | LabTest[]
  > {}

export interface LabSampleLogsResponse
  extends ApiResponse<{
    logList: Record<string, SampleLog[]>
  }> {}
