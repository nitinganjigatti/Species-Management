// Observation / Notes APIs - used across: sites/[id], sections/[id], enclosure/[id], animals/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ALL_NOTES,
  ADD_NOTE_REACTION,
  REMOVE_NOTE_REACTION,
  ADD_OBSERVATION_COMMENT,
  GET_OBSERVATION_DETAILS,
  CREATE_OBSERVATION,
  DELETE_OBSERVATION,
  EDIT_OBSERVATION,
  OBSERVATION_MASTER_TYPE,
  OBSERVATION_MASTER_LIST,
  OBSERVATION_TEMPLATE_LIST,
  OBSERVATION_TEMPLATE_CREATE,
  OBSERVATION_TEMPLATE_UPDATE,
  OBSERVATION_TEMPLATE_DELETE
} from 'src/constants/housing/observationConstants'

import type {
  GetNotesParams,
  GetNotesResponse,
  GetObservationTypesResponse,
  GetObservationMasterListParams,
  GetObservationMasterListResponse,
  GetObservationDetailsParams,
  GetObservationDetailsResponse,
  CreateObservationResponse,
  DeleteObservationParams,
  DeleteObservationResponse,
  AddNoteReactionResponse,
  RemoveNoteReactionResponse,
  AddObservationCommentResponse
} from 'src/types/housing'

import type {
  EditObservationResponse,
  ObservationTemplateUser,
  ObservationTemplate,
  GetObservationTemplatesParams,
  GetObservationTemplatesResponse,
  CreateObservationTemplatePayload,
  CreateObservationTemplateResponse,
  UpdateObservationTemplatePayload,
  UpdateObservationTemplateResponse,
  DeleteObservationTemplateResponse
} from 'src/types/housing/api/observation'

// ==================== Notes / Observations API ====================

export async function getAllNotes(params: GetNotesParams): Promise<GetNotesResponse> {
  const response = await axiosGet({ url: `${GET_ALL_NOTES}`, params })

  return response.data
}

export async function getObservationTypes(): Promise<GetObservationTypesResponse> {
  const response = await axiosGet({ url: `${OBSERVATION_MASTER_TYPE}` })

  return response?.data
}

export async function getObservationMasterList(
  params?: GetObservationMasterListParams
): Promise<GetObservationMasterListResponse> {
  const response = await axiosGet({ url: `${OBSERVATION_MASTER_LIST}`, params })

  return response?.data
}

export async function getObservationDetails(
  params: GetObservationDetailsParams
): Promise<GetObservationDetailsResponse> {
  const response = await axiosGet({ url: `${GET_OBSERVATION_DETAILS}`, params })

  return response?.data
}

export async function createObservation(formData: FormData): Promise<CreateObservationResponse> {
  const response = await axiosFormPost({ url: `${CREATE_OBSERVATION}`, body: formData })

  return response?.data
}

export async function deleteObservation(params: DeleteObservationParams): Promise<DeleteObservationResponse> {
  const response = await axiosGet({ url: `${DELETE_OBSERVATION}`, params })

  return response?.data
}

export async function editObservation(formData: FormData): Promise<EditObservationResponse> {
  const response = await axiosFormPost({ url: `${EDIT_OBSERVATION}`, body: formData })

  return response?.data
}

export async function addNoteReaction(observationId: number): Promise<AddNoteReactionResponse> {
  const response = await axiosPost({
    url: `${ADD_NOTE_REACTION}`,
    body: { notes_id: observationId }
  })

  return response?.data
}

export async function removeNoteReaction(observationId: number): Promise<RemoveNoteReactionResponse> {
  const response = await axiosPost({
    url: `${REMOVE_NOTE_REACTION}`,
    body: { notes_id: observationId }
  })

  return response?.data
}

export async function addObservationComment(formData: FormData): Promise<AddObservationCommentResponse> {
  const response = await axiosFormPost({ url: `${ADD_OBSERVATION_COMMENT}`, body: formData })

  return response?.data
}

// ==================== Observation Templates API ====================

export async function getObservationTemplates(params: GetObservationTemplatesParams): Promise<GetObservationTemplatesResponse> {
  const response = await axiosGet({ url: OBSERVATION_TEMPLATE_LIST, params })

  return response?.data
}

export async function createObservationTemplate(payload: CreateObservationTemplatePayload): Promise<CreateObservationTemplateResponse> {
  const response = await axiosPost({ url: OBSERVATION_TEMPLATE_CREATE, body: payload })

  return response?.data
}

export async function updateObservationTemplate(
  id: number,
  payload: UpdateObservationTemplatePayload
): Promise<UpdateObservationTemplateResponse> {
  const response = await axiosPost({ url: `${OBSERVATION_TEMPLATE_UPDATE}/${id}`, body: payload })

  return response?.data
}

export async function deleteObservationTemplate(id: number): Promise<DeleteObservationTemplateResponse> {
  const response = await axiosPost({ url: `${OBSERVATION_TEMPLATE_DELETE}/${id}`, body: {} })

  return response?.data
}
