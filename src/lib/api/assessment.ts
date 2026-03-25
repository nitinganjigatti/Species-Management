/**
 * API functions for the Assessment module
 */

import { axiosGet as _axiosGet, axiosPost as _axiosPost } from './utility/index'
import {
  GET_ASSESSMENT_ANIMAL_TYPES,
  ADD_ASSESSMENT_VALUE_TO_PARAMS,
  UPDATE_PARAMETER_ASSESSMENT_HISTORY,
  MEASUREMENT_UNITS,
  GET_PARAMS_FILER_OPTIONS,
  GET_PARAMETERS_ON_FILTERS,
  GET_ASSESSMENT_ANIMAL_DATA,
  GET_ASSESSMENT_ENTITY_TYPES,
  ADD_ENTITY_ASSESSMENT_VALUE,
  UPDATE_ENTITY_ASSESSMENT_VALUE,
  ADD_ASSESSMENT_TYPES_TO_ENTITY,
  GET_ASSESSMENT_TEMPLATES_LIST,
  ASSIGN_ASSESSMENT_TEMPLATE
} from 'src/constants/ApiConstant'
import type {
  GetAssessmentTypesResponse,
  AddAssessmentPayload,
  AddAssessmentResponse,
  UpdateAssessmentPayload,
  UpdateAssessmentResponse,
  GetMeasurementUnitsResponse,
  GetAssessmentCategoryListResponse,
  GetAssessmentTypeListParams,
  GetAssessmentTypeListResponse,
  AddAssessmentTypesPayload,
  AddAssessmentTypesResponse,
  GetAssessmentHistoryParams,
  GetAssessmentHistoryResponse,
  AddEntityAssessmentPayload,
  UpdateEntityAssessmentPayload,
  GetEntityAssessmentTypesParams,
  GetEntityAssessmentHistoryParams
} from 'src/types/housing/assessment'

// Type-safe wrappers for axios utilities
const axiosGet = _axiosGet as unknown as (params: { url: string; params?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (params: { url: string; body?: unknown }) => Promise<{ data: any }>

// ==================== Assessment Types API ====================

/**
 * Get assessment types for an animal
 * @param animalId - The animal ID to get assessment types for
 */
export async function getAssessmentAnimalTypes(animalId: number | string): Promise<GetAssessmentTypesResponse> {
  const response = await axiosGet({ url: `${GET_ASSESSMENT_ANIMAL_TYPES}/${animalId}` })

  return response?.data
}

// ==================== Add Assessment API ====================

/**
 * Add a new assessment entry for an animal
 * @param animalId - The animal ID to add assessment for
 * @param payload - The assessment data to add
 */
export async function addAssessmentEntry(
  animalId: number | string,
  payload: AddAssessmentPayload
): Promise<AddAssessmentResponse> {
  const response = await axiosPost({
    url: `${ADD_ASSESSMENT_VALUE_TO_PARAMS}/${animalId}`,
    body: payload
  })

  return response?.data
}

// ==================== Update Assessment API ====================

/**
 * Update an existing assessment entry for an animal
 * @param animalId - The animal ID to update assessment for
 * @param payload - The assessment data to update
 */
export async function updateAssessmentEntry(
  animalId: number | string,
  payload: UpdateAssessmentPayload
): Promise<UpdateAssessmentResponse> {
  const response = await axiosPost({
    url: `${UPDATE_PARAMETER_ASSESSMENT_HISTORY}/${animalId}`,
    body: payload
  })

  return response?.data
}

// ==================== Measurement Units API ====================

/**
 * Get all measurement units
 */
export async function getMeasurementUnits(): Promise<GetMeasurementUnitsResponse> {
  const response = await axiosGet({ url: MEASUREMENT_UNITS })

  return response?.data
}

// ==================== Assessment Category List API ====================

/**
 * Get assessment category list for filtering
 * @param refType - 'animal' or 'housing'
 */
export async function getAssessmentCategoryList(
  refType: 'animal' | 'housing' = 'animal'
): Promise<GetAssessmentCategoryListResponse> {
  const response = await axiosGet({
    url: GET_PARAMS_FILER_OPTIONS,
    params: { ref_type: refType }
  })

  return response?.data
}

// ==================== Assessment Type List API ====================

/**
 * Get available assessment types for adding to an animal
 * @param params - Query parameters including page_no, cat_id, q (search), ref_type
 */
export async function getAssessmentTypeList(
  params: GetAssessmentTypeListParams
): Promise<GetAssessmentTypeListResponse> {
  const response = await axiosGet({
    url: GET_PARAMETERS_ON_FILTERS,
    params
  })

  return response?.data
}

// ==================== Add Assessment Types to Animal API ====================

/**
 * Add or remove assessment types for an animal
 * @param animalId - The animal ID
 * @param payload - Contains assessment_types_to_be_removed and new_assessment_types (JSON arrays)
 */
export async function addAssessmentTypesToAnimal(
  animalId: number | string,
  payload: AddAssessmentTypesPayload
): Promise<AddAssessmentTypesResponse> {
  const response = await axiosPost({
    url: `v1/assessment/animal/types/edit/${animalId}`,
    body: payload
  })

  return response?.data
}

// ==================== Assessment History API ====================

/**
 * Get assessment history for a specific type
 * @param animalId - The animal ID
 * @param params - Query parameters including assessment_type_id, page_no, ref_type
 */
export async function getAssessmentHistory(
  animalId: number | string,
  params: GetAssessmentHistoryParams
): Promise<GetAssessmentHistoryResponse> {
  const response = await axiosGet({
    url: `${GET_ASSESSMENT_ANIMAL_DATA}/${animalId}`,
    params
  })

  return response?.data
}

// ==================== Entity Assessment APIs (Site/Section/Enclosure) ====================

/**
 * Get assessment types for an entity (site, section, or enclosure)
 * @param params - Parameters including ref_id and ref_type
 */
export async function getAssessmentEntityTypes(
  params: GetEntityAssessmentTypesParams
): Promise<GetAssessmentTypesResponse> {
  const response = await axiosGet({
    url: GET_ASSESSMENT_ENTITY_TYPES,
    params
  })

  return response?.data
}

/**
 * Add a new assessment entry for an entity
 * @param payload - The assessment data including ref_id, ref_type, and assessment details
 */
export async function addEntityAssessmentEntry(
  payload: AddEntityAssessmentPayload
): Promise<AddAssessmentResponse> {
  const response = await axiosPost({
    url: ADD_ENTITY_ASSESSMENT_VALUE,
    body: payload
  })

  return response?.data
}

/**
 * Update an existing assessment entry for an entity
 * @param payload - The assessment data including entity_assessments_id
 */
export async function updateEntityAssessmentEntry(
  payload: UpdateEntityAssessmentPayload
): Promise<UpdateAssessmentResponse> {
  const response = await axiosPost({
    url: UPDATE_ENTITY_ASSESSMENT_VALUE,
    body: payload
  })

  return response?.data
}

/**
 * Get assessment history for an entity
 * Uses the same endpoint as animal assessment history but with ref_type parameter
 * @param params - Query parameters including ref_id, ref_type, assessment_type_id, page_no
 */
export async function getEntityAssessmentHistory(
  params: GetEntityAssessmentHistoryParams
): Promise<GetAssessmentHistoryResponse> {
  const { ref_id, ...queryParams } = params

  // Uses the same endpoint as animal history: v1/assessment/animal/defaultValue/{id}
  // The ref_type parameter differentiates between animal/site/section/enclosure
  const response = await axiosGet({
    url: `${GET_ASSESSMENT_ANIMAL_DATA}/${ref_id}`,
    params: queryParams
  })

  return response?.data
}

/**
 * Add or remove assessment types for an entity
 * @param refId - The entity ID
 * @param refType - The entity type (site, section, enclosure)
 * @param payload - Contains assessment_types_to_be_removed and new_assessment_types (JSON arrays)
 */
export async function addAssessmentTypesToEntity(
  refId: number | string,
  refType: string,
  payload: AddAssessmentTypesPayload
): Promise<AddAssessmentTypesResponse> {
  const response = await axiosPost({
    url: ADD_ASSESSMENT_TYPES_TO_ENTITY,
    body: {
      ...payload,
      ref_id: refId,
      ref_type: refType
    }
  })

  return response?.data
}

// ==================== Assessment Templates API ====================

export interface GetAssessmentTemplatesParams {
  page_no?: number
  q?: string
  ref_type?: 'animal' | 'housing'
  entity_id?: number | string
  entity_type?: 'enclosure' | 'section' | 'site' | ''
}

export interface AssessmentTemplate {
  assessment_template_id: string
  template_name: string
  description?: string
  assessment_types?: string[]
  status?: 'assigned' | 'unassigned'
  active?: number
  ref_type?: string
}

export interface GetAssessmentTemplatesResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AssessmentTemplate[]
    total_count?: number
  }
}

export interface AssignTemplatePayload {
  ref_id: number | string
  entity_type: 'assessment_type' | 'assessment_template'
  ref_type: string
  entity_id: string[]
}

export interface AssignTemplateResponse {
  success?: boolean
  message?: string
  data?: unknown
}

/**
 * Get assessment templates list
 * @param params - Query parameters including page_no, q, ref_type, entity_id, entity_type
 */
export async function getAssessmentTemplatesList(
  params: GetAssessmentTemplatesParams
): Promise<GetAssessmentTemplatesResponse> {
  const response = await axiosGet({
    url: GET_ASSESSMENT_TEMPLATES_LIST,
    params
  })

  return response?.data
}

/**
 * Assign assessment types or templates to an entity
 * @param payload - Contains ref_id, entity_type, ref_type, and entity_id array
 */
export async function assignAssessmentTemplate(
  payload: AssignTemplatePayload
): Promise<AssignTemplateResponse> {
  const response = await axiosPost({
    url: ASSIGN_ASSESSMENT_TEMPLATE,
    body: payload
  })

  return response?.data
}
