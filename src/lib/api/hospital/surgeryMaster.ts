import {
  GET_MASTERS_SURGERY,
  CREATE_MASTERS_SURGERY,
  UPDATE_MASTERS_SURGERY,
  DELETE_MASTERS_SURGERY,
  ADD_SURGERY_RECORD,
  CHANGE_MASTERS_SURGERY_STATUS,
  LIST_SURGERY_TEMPLATES,
  CREATE_SURGERY_TEMPLATE,
  GET_PATIENT_SURGERY_LIST,
  DELETE_SURGERY_RECORD,
  DELETE_TEMPLATE,
  UPDATE_TEMPLATE
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse, SurgeryListParams } from 'src/types/hospital'
import { AddUpdateSurgeryPayload, AddUpdateSurgeryResponse, SurgeryParams, SurgeryResponse, } from 'src/types/hospital/api/Masters/surgery';
import { AddSurgeryRecordParams, AddSurgeryRecordResponse,DeleteSurgeryRecordResponse, GetPatientSurgeryListParams, GetPatientSurgeryListResponse, GetSurgeryMasterParams, GetSurgeryMasterResponse } from 'src/types/hospital/api/Surgery/surgery';
import { CreateTemplateParams, DeleteTemplateParams, GetTemplatesResponse, TemplateActionResponse, UpdateTemplateParams } from 'src/types/hospital/api/Template/template';

export const getSurgeryMaster = async ({
  params
}: {
  params: GetSurgeryMasterParams
}): Promise<GetSurgeryMasterResponse> => {
  const response = await axiosGet({ url: GET_MASTERS_SURGERY, params })

  return response?.data
}

export const addSurgeryMaster = async (
  payload: AddUpdateSurgeryPayload
): Promise<AddUpdateSurgeryResponse> => {
  const response = await axiosFormPost({ url: CREATE_MASTERS_SURGERY, body: payload })

  return response?.data
}

export const updateSurgeryMaster = async (
  id: string | number,
  payload: AddUpdateSurgeryPayload | FormData
): Promise<AddUpdateSurgeryResponse> => {
  const response = await axiosFormPost({ url: `${UPDATE_MASTERS_SURGERY}/${id}`, body: payload })

  return response?.data
}

export const changeSurgeryMasterStatus = async (
  id: string | number,
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${CHANGE_MASTERS_SURGERY_STATUS}/${id}`, body: payload })

  return response?.data
}

export const deleteSurgeryMaster = async (id: string | number): Promise<ApiResponse<unknown>> => {
  const response = await axiosFormPost({ url: `${DELETE_MASTERS_SURGERY}/${id}`, body: {} })

  return response?.data
}

export const addSurgeryRecord = async (
  payload: AddSurgeryRecordParams
): Promise<AddSurgeryRecordResponse> => {
  const response = await axiosFormPost({ url: ADD_SURGERY_RECORD, body: payload })

  return response?.data
}

export const getSurgeryTemplates = async (
  params: GetSurgeryMasterParams
): Promise<GetTemplatesResponse> => {
  const response = await axiosGet({ url: LIST_SURGERY_TEMPLATES, params })

  return response?.data
}

export const getPatientSurgeryList = async ({
  params
}: {
  params: GetPatientSurgeryListParams
}): Promise<GetPatientSurgeryListResponse> => {
  const response = await axiosGet({ url: GET_PATIENT_SURGERY_LIST, params })

  return response?.data
}

export const deleteSurgeryRecord = async (
  surgeryRecordId: string | number
): Promise<DeleteSurgeryRecordResponse> => {
  const payload = new FormData()
  payload.append('surgery_record_id', String(surgeryRecordId))

  const response = await axiosFormPost({ url: DELETE_SURGERY_RECORD, body: payload })

  return response?.data
}

export const createSurgeryTemplate = async (
  payload: CreateTemplateParams
): Promise<TemplateActionResponse> => {
  const response = await axiosFormPost({ url: CREATE_SURGERY_TEMPLATE, body: payload })

  return response?.data
}

export const deleteTemplate = async (
  payload: DeleteTemplateParams
): Promise<TemplateActionResponse> => {
  const response = await axiosFormPost({ url: DELETE_TEMPLATE, body: payload })

  return response?.data
}

export const updateTemplate = async (
  payload: UpdateTemplateParams
): Promise<TemplateActionResponse> => {
  const response = await axiosFormPost({ url: UPDATE_TEMPLATE, body: payload })

  return response?.data
}
