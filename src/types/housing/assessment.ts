/**
 * Type definitions for the Assessment module
 */

// ==================== Response Types ====================

export type AssessmentResponseType = 'text' | 'numeric_scale' | 'list' | 'numeric_value'

// ==================== Assessment Default Value ====================

export interface AssessmentDefaultValue {
  id: string
  label: string
  order?: number
}

// ==================== Assessment Value ====================

export interface AssessmentValue {
  assessment_id: string
  assessment_value: string | number
  assessment_unit_id?: string
  asssessment_label?: string // Note: API has typo preserved for compatibility
  assessment_rank?: number
  comments: string
  recorded_date_time: string
  record_date?: string
  record_time?: string
  created_by: number
}

// ==================== Assessment Type ====================

export interface AssessmentType {
  assessment_type_id: string
  assessment_name: string
  assessment_category_id: string
  assessment_category_name: string
  assessment_category_string_id?: string
  response_type: AssessmentResponseType
  measurement_type?: string
  description?: string
  default_values: AssessmentDefaultValue[]
  assessment_values: AssessmentValue[]
}

// ==================== Assessment Category ====================

export interface AssessmentCategory {
  id: string
  name: string
  stringId?: string
  isSelected: boolean
}

// ==================== Measurement Unit ====================

export interface MeasurementUnit {
  id: string
  name: string
  uom_abbr: string
  measurement_type: string
}

// ==================== API Payloads ====================

export interface AddAssessmentPayload {
  assessment_type_id: string
  assessment_value: string | number
  comments?: string
  recorded_date_time: string // "YYYY-MM-DD HH:mm:ss"
  assessment_unit_id?: string
}

export interface UpdateAssessmentPayload extends AddAssessmentPayload {
  animal_assessment_id: string
}

// Entity assessment payloads (for enclosure/section/site)
export interface AddEntityAssessmentPayload extends AddAssessmentPayload {
  ref_id: string | number
  ref_type: string
}

export interface UpdateEntityAssessmentPayload extends AddEntityAssessmentPayload {
  entity_assessments_id: string
}

// ==================== API Responses ====================

export interface GetAssessmentTypesResponse {
  success?: boolean
  message?: string
  data?: AssessmentType[]
}

export interface AddAssessmentResponse {
  success?: boolean
  message?: string
  data?: {
    assessment_id?: string
  }
}

export interface UpdateAssessmentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface GetMeasurementUnitsResponse {
  success?: boolean
  message?: string
  data?: MeasurementUnit[]
}

// ==================== Type Filter ====================

export interface TypeFilterItem {
  id: string
  name: string
  isSelected: boolean
}

// ==================== Assessment History ====================

export interface AssessmentHistoryEntry {
  assessment_id: string
  assessment_value: string | number
  assessment_unit_id?: string
  asssessment_label?: string
  assessment_rank?: number
  comments: string
  record_date: string
  record_time: string
  recorded_date_time: string
  created_by: number
  created_by_name?: string
}

export interface GetAssessmentHistoryParams {
  assessment_type_id: string
  page_no?: number
  ref_type?: string
}

export interface GetAssessmentHistoryResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AssessmentHistoryEntry[]
    total_count?: number
  }
}

// ==================== Add Assessment Type ====================

export interface AssessmentCategoryOption {
  assessment_category_id: string
  label: string
  string_id?: string
}

export interface AssessmentTypeOption {
  assessment_type_id: string
  assessment_name?: string
  assessments_type_label?: string // API field for type name
  assessment_category_id?: string
  assessment_category_name?: string
  label?: string // API field for category name
  response_type?: AssessmentResponseType
  default_values?: AssessmentDefaultValue[]
}

export interface GetAssessmentCategoryListResponse {
  success?: boolean
  message?: string
  data?: AssessmentCategoryOption[]
}

export interface GetAssessmentTypeListParams {
  page_no?: number
  cat_id?: string
  q?: string
  ref_type: 'animal' | 'housing'
}

export interface GetAssessmentTypeListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AssessmentTypeOption[]
    total_count?: number
  }
}

export interface AddAssessmentTypesPayload {
  assessment_types_to_be_removed: string // JSON array
  new_assessment_types: string // JSON array
}

export interface AddAssessmentTypesResponse {
  success?: boolean
  message?: string
  data?: unknown
}

// ==================== Component Props ====================

export interface AssessmentDrawerMode {
  mode: 'add' | 'edit' | 'view'
  fromAddIcon: boolean
}

export interface AssessmentFormValues {
  date: import('dayjs').Dayjs | null
  time: import('dayjs').Dayjs | null
  textValue: string
  numericValue: string
  selectedScaleId: string
  unitId: string
  notes: string
}
