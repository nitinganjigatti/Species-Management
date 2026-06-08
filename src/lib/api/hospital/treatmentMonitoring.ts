import {
  ADD_ASSESSMENT_VALUE_TO_PARAMS,
  APPLY_PARAMS_TO_CASE_ID,
  DELETE_MONITORING_MONITORING,
  DELETE_PARAMETER_ASSESSMENT_HISTORY,
  GET_HOSPITAL_PARAMETERS_UNIT,
  GET_HOSPITAL_PARAMS_TEMPLATE,
  GET_MONITORING_HISTORY,
  GET_MONITORING_PARAMETERS,
  GET_PARAMETER_ASSESSMENT_HISTORY,
  GET_PARAMETERS_ON_FILTERS,
  GET_PARAMS_FILER_OPTIONS,
  GET_PARAMS_OF_TEMPLATE,
  GET_TREATMENT_MONITORING_DATA,
  GET_TREATMENT_PARAMETERS_INTERVALS,
  SAVE_HOSPITAL_TEMPLATE,
  SCHEDULE_INTERVALS_FOR_PARAMETERS,
  UPDATE_PARAMETER_ASSESSMENT_HISTORY
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'
import { DeletePreviousEntryResponse, GetHospitalParamsFilterOptionsPayload, GetHospitalParamsFilterOptionsResponse, GetParametersBasedOnFiltersParams, GetParametersBasedOnFiltersResponse,GetTreatmentMonitoringListParams, GetTreatmentMonitoringListResponse, PreviousEntryParams, PreviousEntryResponse, UpdatePreviousEntryParams, UpdatePreviousEntryResponse } from 'src/types/hospital/api/TreatmentMonitoring/treatmentMonitoring';
import { AddIntervalForParameterPayload, AddIntervalForParametersResponse, AddMonitoringParameterPayload, AddMonitoringParameterResponse, DeleteMonitoringParameterPayload, DeleteMonitoringParameterResponse, GetHospitalParametersUnitResponse, GetParamsBasedOnTemplatesPayload, GetParamsBasedOnTemplatesResponse, GetTemplatesParamsListPayload, GetTemplatesParamsListResponse, GetTreatmentIntervalsResponse, MonitoringParametersPayload, MonitoringParametersResponse, SaveTemplatePayload, SaveTemplateResponse } from 'src/types/hospital/api/TreatmentMonitoring/parametersUnit';
import { AddTreatmentMonitoringParams, AddTreatmentMonitoringResponse } from 'src/types/hospital/api/TreatmentMonitoring/addTreatmentMonitoring';

export const getTreatmentIntervals = async (): Promise<GetTreatmentIntervalsResponse> => {
  const response = await axiosGet({ url: `${GET_TREATMENT_PARAMETERS_INTERVALS}` })

  return response?.data
}

export const addIntervalsForParameters = async (
  payload: AddIntervalForParameterPayload
): Promise<AddIntervalForParametersResponse> => {
  const response = await axiosPost({ url: `${SCHEDULE_INTERVALS_FOR_PARAMETERS}`, body: payload })

  return response?.data
}

export const getHospitalParamsFilterOptions = async (
  params: GetHospitalParamsFilterOptionsPayload
): Promise<GetHospitalParamsFilterOptionsResponse> => {
  const response = await axiosGet({ url: `${GET_PARAMS_FILER_OPTIONS}`, params })

  return response?.data
}

export const getParametersBasedOnFilters = async (
  params: GetParametersBasedOnFiltersParams
): Promise<GetParametersBasedOnFiltersResponse> => {
  const response = await axiosGet({ url: `${GET_PARAMETERS_ON_FILTERS}`, params })

  return response?.data
}

export const getHospitalParamsTemplatesList = async (
  params: GetTemplatesParamsListPayload
): Promise<GetTemplatesParamsListResponse> => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_PARAMS_TEMPLATE}`, params })

  return response?.data
}

export const getParametersBasedOnTemplates = async (
  params: GetParamsBasedOnTemplatesPayload
): Promise<GetParamsBasedOnTemplatesResponse> => {
  const response = await axiosGet({ url: `${GET_PARAMS_OF_TEMPLATE}`, params })

  return response?.data
}

export const saveHospitalTemplate = async (
  params: SaveTemplatePayload
): Promise<SaveTemplateResponse> => {
  const response = await axiosFormPost({ url: `${SAVE_HOSPITAL_TEMPLATE}`, body: params })

  return response?.data
}

export const applyParamsToHospitalCaseId = async (
  params: AddMonitoringParameterPayload
): Promise<AddMonitoringParameterResponse> => {
  const response = await axiosFormPost({ url: `${APPLY_PARAMS_TO_CASE_ID}`, body: params })

  return response?.data
}

export const getTreatmentMonitoringData = async (
  params: GetTreatmentMonitoringListParams
): Promise<GetTreatmentMonitoringListResponse> => {
  const response = await axiosGet({ url: `${GET_TREATMENT_MONITORING_DATA}`, params })

  return response?.data
}

export const getMonitoringParameters = async (
  id: string | number,
  params?: MonitoringParametersPayload
): Promise<MonitoringParametersResponse> => {
  const response = await axiosGet({ url: `${GET_MONITORING_PARAMETERS}/${id}`, params })

  return response?.data
}

export const getMonitoringParamsHistory = async (
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> => {
  const response = await axiosGet({ url: `${GET_MONITORING_HISTORY}`, params })

  return response?.data
}

export const addAssessmentToParams = async (
  animalId: string | number,
  params: AddTreatmentMonitoringParams
): Promise<AddTreatmentMonitoringResponse> => {
  const response = await axiosPost({ url: `${ADD_ASSESSMENT_VALUE_TO_PARAMS}/${animalId}`, body: params })

  return response?.data
}

export const getHospitalParametersUnitListing = async (
  id: string | number
): Promise<GetHospitalParametersUnitResponse> => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_PARAMETERS_UNIT}/${id}` })

  return response?.data
}

export const getHospitalAssessmentHistory = async (
  params: PreviousEntryParams
): Promise<PreviousEntryResponse> => {
  const response = await axiosGet({ url: `${GET_PARAMETER_ASSESSMENT_HISTORY}`, params })

  return response?.data
}

export const updateHospitalAssessmentHistory = async (
  id: string | number,
  params: UpdatePreviousEntryParams
): Promise<UpdatePreviousEntryResponse> => {
  const response = await axiosPost({ url: `${UPDATE_PARAMETER_ASSESSMENT_HISTORY}/${id}`, body: params })

  return response?.data
}

export const deleteAssessmentHistory = async (id: string | number): Promise<DeletePreviousEntryResponse> => {
  const response = await axiosGet({ url: `${DELETE_PARAMETER_ASSESSMENT_HISTORY}/${id}` })

  return response?.data
}

export const deleteMonitoringParameter = async (
  payload: DeleteMonitoringParameterPayload
): Promise<DeleteMonitoringParameterResponse> => {
  const response = await axiosFormPost({ url: `${DELETE_MONITORING_MONITORING}`, body: payload })

  return response?.data
}
