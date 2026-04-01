// Transfer APIs - used by: sites/[id], animals/[id]
import { axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ANIMAL_TRANSFER_LIST,
  GET_ANIMAL_TRANSFER_SUMMARY,
  GET_ANIMAL_TRANSFER_BUTTON_STATUS,
  GET_ANIMAL_TRANSFER_LOGS,
  ADD_ANIMAL_TRANSFER_COMMENT,
  UPDATE_ANIMAL_TRANSFER_STATUS,
  TRANSFER_AND_SECURITY_TEAM_LIST,
  GET_TRANSFER_SUMMARY,
  GET_TRANSFER_BUTTON_STATUS,
  UPDATE_TRANSFER_STATUS,
  ADD_TRANSFER_COMMENT,
  GET_TRANSFER_ACTIVITY,
  GET_TRANSFER_MEMBERS,
  APPROVE_TRANSFER_REQUEST,
  REJECT_TRANSFER_REQUEST,
  GET_ANIMAL_LIST_BY_SPECIES
} from 'src/constants/housing/transferConstants'

import type { GetUsersListParams, GetUsersListResponse } from 'src/types/housing'

import type {
  AnimalTransferItem,
  GetAnimalTransferListParams,
  GetAnimalTransferListResponse,
  TransferAssignTo,
  TransferDetails,
  TransferEntityDetail,
  TransferAttachment,
  TransferComment,
  TransferApprovalItem,
  TransferSummaryData,
  GetTransferSummaryResponse,
  GetAnimalTransferSummaryParams,
  GetAnimalTransferButtonStatusParams,
  TransferButtonStatus,
  GetTransferButtonStatusResponse,
  AnimalTransferLogItem,
  GetAnimalTransferLogsResponse,
  AddAnimalTransferCommentPayload,
  AddAnimalTransferCommentResponse,
  UpdateAnimalTransferStatusPayload,
  UpdateAnimalTransferStatusResponse,
  GetTransferButtonStatusParams,
  UpdateTransferStatusPayload,
  UpdateTransferStatusResponse,
  AddTransferCommentPayload,
  AddTransferCommentResponse,
  TransferActivityItem,
  GetTransferActivityResponse,
  TransferMemberUser,
  TransferMembersData,
  GetTransferMembersResponse,
  ApproveTransferResponse,
  RejectTransferPayload,
  RejectTransferResponse,
  AnimalDetailItem,
  SpeciesWithAnimalsItem,
  AnimalBySpeciesItem,
  GetAnimalListBySpeciesResponse
} from 'src/types/housing/api/transfer'

// ==================== Animal Transfer List API ====================

export async function getAnimalTransferList(params: GetAnimalTransferListParams): Promise<GetAnimalTransferListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_LIST}`, params })

  return response?.data
}

// ==================== Transfer Details API ====================

export async function getTransferSummary(params: { animal_movement_id: number | string; type?: string }): Promise<GetTransferSummaryResponse> {
  const response = await axiosGet({ url: `${GET_TRANSFER_SUMMARY}`, params })

  return response?.data
}

// ==================== Animal Transfer Details API ====================

export async function getAnimalTransferSummary(params: GetAnimalTransferSummaryParams): Promise<GetTransferSummaryResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_SUMMARY}`, params })

  return response?.data
}

export async function getAnimalTransferButtonStatus(params: GetAnimalTransferButtonStatusParams): Promise<GetTransferButtonStatusResponse> {
  const response = await axiosPost({ url: `${GET_ANIMAL_TRANSFER_BUTTON_STATUS}`, body: params })

  return response?.data
}

export async function getAnimalTransferLogs(animal_movement_id: number | string): Promise<GetAnimalTransferLogsResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_LOGS}`, params: { animal_movement_id } })

  return response?.data
}

export async function addAnimalTransferComment(payload: AddAnimalTransferCommentPayload): Promise<AddAnimalTransferCommentResponse> {
  const response = await axiosPost({ url: `${ADD_ANIMAL_TRANSFER_COMMENT}`, body: payload })

  return response?.data
}

export async function updateAnimalTransferStatus(payload: UpdateAnimalTransferStatusPayload): Promise<UpdateAnimalTransferStatusResponse> {
  const response = await axiosPost({ url: `${UPDATE_ANIMAL_TRANSFER_STATUS}`, body: payload })

  return response?.data
}

// ==================== Transfer Button Status API ====================

export async function getTransferButtonStatus(params: GetTransferButtonStatusParams): Promise<GetTransferButtonStatusResponse> {
  const { animal_movement_id, ...restParams } = params

  const response = await axiosGet({
    url: `${GET_TRANSFER_BUTTON_STATUS}/${animal_movement_id}/button-status`,
    params: restParams
  })

  return response?.data
}

export async function updateTransferStatus(payload: UpdateTransferStatusPayload): Promise<UpdateTransferStatusResponse> {
  const { movement_id, ...restPayload } = payload

  const response = await axiosPost({
    url: `${UPDATE_TRANSFER_STATUS}/${movement_id}`,
    body: restPayload
  })

  return response?.data
}

export async function addTransferComment(payload: AddTransferCommentPayload): Promise<AddTransferCommentResponse> {
  const response = await axiosPost({ url: `${ADD_TRANSFER_COMMENT}`, body: payload })

  return response?.data
}

export async function getTransferActivity(animal_movement_id: number | string): Promise<GetTransferActivityResponse> {
  const response = await axiosGet({
    url: `${GET_TRANSFER_ACTIVITY}/${animal_movement_id}/activity`,
    params: {}
  })

  return response?.data
}

// ==================== Transfer Team Members API ====================

export async function getTransferMembers(params: { animal_movement_id: number | string }): Promise<GetTransferMembersResponse> {
  const response = await axiosGet({ url: `${GET_TRANSFER_MEMBERS}`, params })

  return response?.data
}

// ==================== Approve/Reject Transfer API ====================

export async function approveTransferRequest(params: { animal_movement_id: number | string }): Promise<ApproveTransferResponse> {
  const response = await axiosPost({ url: `${APPROVE_TRANSFER_REQUEST}`, body: params })

  return response?.data
}

export async function rejectTransferRequest(payload: RejectTransferPayload): Promise<RejectTransferResponse> {
  const response = await axiosPost({ url: `${REJECT_TRANSFER_REQUEST}`, body: payload })

  return response?.data
}

// ==================== Animal List by Species API ====================

export async function getAnimalListBySpecies(params: { animal_movement_id: number | string }): Promise<GetAnimalListBySpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_LIST_BY_SPECIES}`, params })

  return response?.data
}

// ==================== Security Team API ====================

export async function getTransferAndSecurityTeamList(params?: GetUsersListParams): Promise<GetUsersListResponse> {
  const response = await axiosGet({ url: `${TRANSFER_AND_SECURITY_TEAM_LIST}`, params })

  return response?.data
}
