/**
 * Observation / Notes API types
 * Used across: sites/[id], sections/[id], enclosure/[id], animals/[id]
 */

import type { Note, ObservationType, ObservationMasterItem } from '../models'
import type { ApiResponse, PaginatedData, PaginationParams } from './common'

// ==================== Notes / Observation API ====================

export interface GetNotesParams extends PaginationParams {
  id: number | string
  type: 'site' | 'section' | 'enclosure' | 'animal'
  note_type?: number | string
  priority?: string
  created_by?: number | string
  tagged_to?: number | string
}

export interface GetNotesResponse extends ApiResponse<PaginatedData<Note>> {}

export interface GetObservationTypesResponse extends ApiResponse<ObservationType[]> {}

export interface GetObservationMasterListParams {
  parent_id?: number
}

export interface GetObservationMasterListResponse extends ApiResponse<ObservationMasterItem[]> {}

export interface GetObservationDetailsParams {
  observation_id: number
}

export interface GetObservationDetailsResponse extends ApiResponse<Note> {}

export interface CreateObservationPayload {
  ref_type: 'site' | 'section' | 'enclosure' | 'animal'
  ref_id: number | string
  note_type_id: number
  priority?: string
  title?: string
  description?: string
  notes?: string
  tagged_user_ids?: number[]
  images?: File[]
  attachments?: File[]
}

export interface CreateObservationResponse extends ApiResponse<{ observation_id: number }> {}

export interface DeleteObservationParams {
  observation_id: number
  reason?: string
}

export interface DeleteObservationResponse extends ApiResponse<{ success: boolean }> {}

export interface EditObservationResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface AddNoteReactionPayload {
  notes_id: number
}

export interface AddNoteReactionResponse extends ApiResponse<{ success: boolean }> {}

export interface RemoveNoteReactionPayload {
  notes_id: number
}

export interface RemoveNoteReactionResponse extends ApiResponse<{ success: boolean }> {}

export interface AddObservationCommentPayload {
  observation_id: number
  notes: string
}

export interface AddObservationCommentResponse extends ApiResponse<{ comment_id: number }> {}

// ==================== Observation Templates ====================

export interface ObservationTemplateUser {
  user_id: number
  user_name?: string
  full_name?: string
  user_profile_pic?: string
  role_name?: string
}

export interface ObservationTemplate {
  id: number
  template_name: string
  template_type: string
  template_items: ObservationTemplateUser[]
  template_sub_type?: number
  is_default: number
  status: number
  zoo_id?: number
  created_at?: string
  updated_at?: string
}

export interface GetObservationTemplatesParams {
  ZooId: number
  observation_types?: number | string
}

export interface GetObservationTemplatesResponse {
  success?: boolean
  message?: string
  result?: ObservationTemplate[]
  data?: {
    result?: ObservationTemplate[]
  }
}

export interface CreateObservationTemplatePayload {
  zooID: number
  template_name: string
  template_type: string
  template_items: string
  template_sub_type?: number
  is_default?: number
  status?: number
}

export interface CreateObservationTemplateResponse {
  success?: boolean
  message?: string
  data?: ObservationTemplate
}

export interface UpdateObservationTemplatePayload {
  template_name?: string
  template_items?: string
  is_default?: number
  status?: number
}

export interface UpdateObservationTemplateResponse {
  success?: boolean
  message?: string
  data?: ObservationTemplate
}

export interface DeleteObservationTemplateResponse {
  success?: boolean
  message?: string
}
