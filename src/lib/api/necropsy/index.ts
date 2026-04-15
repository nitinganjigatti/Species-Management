import {
  NECROPSY_LISTING,
  GET_ANIMAL_WISE_NECROPSY_LIST,
  GET_SPECIES_WISE_NECROPSY_LIST,
  GET_NECROPSY_STATS,
  GET_INCOMING_NECROPSY_CHECKLIST_DETAILS,
  GET_INCOMING_NECROPSY_TRANSFER_SUMMARY,
  CREATE_INCOMING_NECROPSY_SUMMARY_COMMENT,
  GET_INCOMING_NECROPSY_BTN_STATUS,
  UPDATE_TRANSFER_BTN_STATUS,
  GET_TRANSFER_ANIMAL_LIST,
  GET_FILLED_CHECKLIST_LIST,
  GET_TRANSFER_CHECKLIST,
  GET_NECROPSY_SUMMARY,
  ADD_NECROPSY,
  EDIT_NECROPSY,
  DELETE_NECROPSY,
  GET_NECROPSY_BODY_PARTS,
  GET_NECROPSY_TEMPLATE,
  CREATE_NECROPSY_TEMPLATE,
  UPDATE_NECROPSY_TEMPLATE,
  DELETE_NECROPSY_TEMPLATE,
  GET_NECROPSY_TIMELINE,
  GET_MORTALITY_SUMMARY,
  GET_MEDICAL_STATS,
  GET_NECROPSY_PDF,
  DELETE_NECROPSY_ATTACHMENT,
  GET_NEW_INCOMING_PATIENTS_LISTS,
  MEASUREMENT_UNITS,
  ADD_UPDATE_NECROPSY_CENTER
} from 'src/constants/ApiConstant'
import { MANNER_OF_DEATH, CARCASS_DEPOSITION } from 'src/constants/housing/animalConstants'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'
import type {
  NecropsyListingParams,
  NecropsyListingResponse,
  AnimalWiseListParams,
  AnimalWiseListResponse,
  SpeciesWiseListParams,
  SpeciesWiseListResponse,
  NecropsyStatsParams,
  NecropsyStatsResponse,
  IncomingNecropsyTransferSummaryParams,
  IncomingNecropsyTransferSummaryResponse,
  IncomingNecropsyChecklistDetailsParams,
  IncomingNecropsyChecklistDetailsResponse,
  CreateIncomingNecropsyCommentPayload,
  IncomingNecropsyBtnStatusResponse,
  AcceptNecropsyTransferPayload,
  TransferAnimalListParams,
  TransferAnimalListResponse,
  FilledChecklistListResponse,
  TransferChecklistResponse,
  NecropsySummaryResponse,
  AddNecropsyPayload,
  EditNecropsyPayload,
  DeleteNecropsyPayload,
  NecropsyBodyPartsPayload,
  NecropsyBodyPartsResponse,
  NecropsyTemplateResponse,
  CreateNecropsyTemplatePayload,
  UpdateNecropsyTemplatePayload,
  NecropsyTimelineParams,
  NecropsyTimelineResponse,
  MortalitySummaryParams,
  MortalitySummaryResponse,
  MedicalStatsParams,
  MedicalStatsResponse,
  NecropsyPdfParams,
  NecropsyPdfResponse,
  DeleteAttachmentPayload,
  MannerOfDeathResponse,
  CarcassDispositionResponse,
  CarcassTransferListParams,
  CarcassTransferListResponse,
  MeasurementUnitsResponse,
  AddUpdateNecropsyCenterPayload,
  ApiResponse
} from 'src/types/necropsy'

export async function getNecropsyListing(
  params: NecropsyListingParams,
  userId: number
): Promise<NecropsyListingResponse> {
  try {
    const url = `${NECROPSY_LISTING}/${userId}/necropsy_centre`
    const response = await axiosGet({ url, params, pharmacy: false })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching necropsy listing:', err.message)

    return { status: false, message: err.message }
  }
}

export async function getAnimalWiseNecropsyList(params: AnimalWiseListParams): Promise<AnimalWiseListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_WISE_NECROPSY_LIST}`, params: params, pharmacy: false })

  return response?.data
}

export async function getSpeciesWiseNecropsyList(params: SpeciesWiseListParams): Promise<SpeciesWiseListResponse> {
  const response = await axiosGet({ url: `${GET_SPECIES_WISE_NECROPSY_LIST}`, params: params, pharmacy: false })

  return response?.data
}

export async function getNecropsyStats(params: NecropsyStatsParams): Promise<NecropsyStatsResponse> {
  const response = await axiosGet({ url: `${GET_NECROPSY_STATS}`, params: params, pharmacy: false })

  return response?.data
}

export async function getIncomingNecropsyTransferSummary(
  params: IncomingNecropsyTransferSummaryParams
): Promise<IncomingNecropsyTransferSummaryResponse> {
  const response = await axiosGet({ url: `${GET_INCOMING_NECROPSY_TRANSFER_SUMMARY}`, params: params, pharmacy: false })

  return response?.data
}

export async function getIncomingNecropsyChecklistDetails(
  params: IncomingNecropsyChecklistDetailsParams,
  transferId: number
): Promise<IncomingNecropsyChecklistDetailsResponse> {
  const url = `${GET_INCOMING_NECROPSY_CHECKLIST_DETAILS}/${transferId}/activity`
  const response = await axiosGet({ url: url, params: params, pharmacy: false })

  return response?.data
}

export async function createIncomingNecropsySummaryComment(
  params: CreateIncomingNecropsyCommentPayload
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({
    url: `${CREATE_INCOMING_NECROPSY_SUMMARY_COMMENT}`,
    body: params,
    pharmacy: false
  })

  return response?.data
}

export async function getIncomingNecropsyBtnStatus(transferId: number): Promise<IncomingNecropsyBtnStatusResponse> {
  const response = await axiosGet({
    url: `${GET_INCOMING_NECROPSY_BTN_STATUS}/${transferId}/button-status`,
    pharmacy: false,
    params: {}
  })

  return response?.data
}

export async function acceptNecropsyTransfer(
  transferId: number,
  payload: AcceptNecropsyTransferPayload
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({
    url: `${UPDATE_TRANSFER_BTN_STATUS}/${transferId}`,
    body: payload,
    pharmacy: false
  })

  return response?.data
}

export async function getTransferAnimalList(
  transferId: number,
  params?: TransferAnimalListParams
): Promise<TransferAnimalListResponse> {
  const response = await axiosGet({ url: `${GET_TRANSFER_ANIMAL_LIST}/${transferId}`, params, pharmacy: false })

  return response?.data
}

export async function getFilledChecklistList(transferId: number): Promise<FilledChecklistListResponse> {
  const response = await axiosGet({ url: `${GET_FILLED_CHECKLIST_LIST}/${transferId}`, pharmacy: false, params: {} })

  return response?.data
}

export async function getTransferChecklist(): Promise<TransferChecklistResponse> {
  const response = await axiosGet({ url: GET_TRANSFER_CHECKLIST, pharmacy: false, params: {} })

  return response?.data
}

export async function getNecropsySummary(necropsyId: number): Promise<NecropsySummaryResponse> {
  const response = await axiosGet({ url: `${GET_NECROPSY_SUMMARY}/${necropsyId}`, pharmacy: false, params: {} })

  return response?.data
}

export async function addNecropsy(payload: AddNecropsyPayload): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: ADD_NECROPSY, body: payload, pharmacy: false })

  return response?.data
}

export async function editNecropsy(payload: EditNecropsyPayload): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: EDIT_NECROPSY, body: payload, pharmacy: false })

  return response?.data
}

export async function deleteNecropsy(payload: DeleteNecropsyPayload): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: DELETE_NECROPSY, body: payload, pharmacy: false })

  return response?.data
}

export async function getNecropsyBodyParts(payload: NecropsyBodyPartsPayload): Promise<NecropsyBodyPartsResponse> {
  const response = await axiosPost({ url: GET_NECROPSY_BODY_PARTS, body: payload, pharmacy: false })

  return response?.data
}

export async function getNecropsyTemplate(): Promise<NecropsyTemplateResponse> {
  const response = await axiosGet({ url: GET_NECROPSY_TEMPLATE, pharmacy: false, params: {} })

  return response?.data
}

export async function createNecropsyTemplate(payload: CreateNecropsyTemplatePayload): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: CREATE_NECROPSY_TEMPLATE, body: payload, pharmacy: false })

  return response?.data
}

export async function updateNecropsyTemplate(
  templateId: number,
  payload: UpdateNecropsyTemplatePayload
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({
    url: `${UPDATE_NECROPSY_TEMPLATE}/${templateId}`,
    body: payload,
    pharmacy: false
  })

  return response?.data
}

export async function deleteNecropsyTemplate(templateId: number): Promise<ApiResponse<unknown>> {
  const response = await axiosPost({ url: `${DELETE_NECROPSY_TEMPLATE}/${templateId}`, body: {}, pharmacy: false })

  return response?.data
}

export async function getNecropsyTimeline(params: NecropsyTimelineParams): Promise<NecropsyTimelineResponse> {
  const response = await axiosGet({ url: GET_NECROPSY_TIMELINE, params, pharmacy: false })

  return response?.data
}

export async function getMortalitySummary(params: MortalitySummaryParams): Promise<MortalitySummaryResponse> {
  const response = await axiosGet({ url: GET_MORTALITY_SUMMARY, params, pharmacy: false })

  return response?.data
}

export async function getMedicalStats(params: MedicalStatsParams): Promise<MedicalStatsResponse> {
  const response = await axiosGet({ url: GET_MEDICAL_STATS, params, pharmacy: false })

  return response?.data
}

export async function getNecropsyPdf(params: NecropsyPdfParams): Promise<NecropsyPdfResponse> {
  const response = await axiosGet({ url: GET_NECROPSY_PDF, params: params, pharmacy: false })

  return response?.data
}

export async function deleteNecropsyAttachment(
  id: number,
  payload: DeleteAttachmentPayload
): Promise<ApiResponse<unknown>> {
  const response = await axiosFormPost({ url: `${DELETE_NECROPSY_ATTACHMENT}/${id}`, body: payload, pharmacy: false })

  return response?.data
}

export async function getMannerOfDeath(): Promise<MannerOfDeathResponse> {
  const response = await axiosGet({ url: MANNER_OF_DEATH, pharmacy: false, params: {} })

  return response?.data
}

export async function getCarcassDisposition(): Promise<CarcassDispositionResponse> {
  const response = await axiosGet({ url: CARCASS_DEPOSITION, pharmacy: false, params: {} })

  return response?.data
}

export async function getCarcassTransferList(params: CarcassTransferListParams): Promise<CarcassTransferListResponse> {
  const response = await axiosGet({ url: `${GET_NEW_INCOMING_PATIENTS_LISTS}`, params, pharmacy: false })

  return response?.data
}

export async function getMeasurementUnits(): Promise<MeasurementUnitsResponse> {
  const response = await axiosGet({ url: MEASUREMENT_UNITS, pharmacy: false, params: {} })

  return response?.data
}

export async function addUpdateNecropsyCenter(
  payload: AddUpdateNecropsyCenterPayload,
  status: string,
  necropsyId?: number
): Promise<ApiResponse<unknown>> {
  const url = necropsyId
    ? `${ADD_UPDATE_NECROPSY_CENTER}/${status}/${necropsyId}`
    : `${ADD_UPDATE_NECROPSY_CENTER}/${status}`
  const response = await axiosPost({ url, body: payload, pharmacy: false })

  return response?.data
}
