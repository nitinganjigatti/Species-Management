// Animal APIs - used by: animals/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ANIMAL,
  ANIMAL_DETAILS_OVERVIEW,
  ANIMAL_HISTORY,
  ANIMAL_MEDIA,
  ADD_ANIMAL_MEDIA,
  ANIMAL_DETAILS_IDENTIFIER_LIST,
  ADD_ANIMAL_IDENTIFIER,
  EDIT_ANIMAL_IDENTIFIER,
  DELETE_ANIMAL_IDENTIFIER,
  ANIMAL_DETAILS_INCIDENT_LIST,
  ANIMAL_INCIDENT_DETAILS,
  ANIMAL_CREATE_INCIDENT,
  ANIMAL_UPDATE_INCIDENT,
  GET_ANIMAL_MORTALITY,
  EDIT_ANIMAL_MORTALITY,
  REVOKE_ANIMAL_MORTALITY,
  MANNER_OF_DEATH,
  CARCASS_CONDITION,
  CARCASS_DEPOSITION,
  ANIMAL_DIET_LIST,
  ANIMAL_JOURNAL_LOGS,
  ANIMAL_JOURNAL_MODULES,
  GET_ANIMAL_TREATMENT,
  GET_TAXONOMY_HIERARCHY
} from 'src/constants/housing/animalConstants'

import type {
  GetAnimalsParams,
  GetAnimalsResponse,
  GetAnimalDetailsOverviewParams,
  GetAnimalDetailsOverviewResponse,
  GetAnimalHistoryParams,
  GetAnimalHistoryResponse,
  GetAnimalMediaParams,
  GetAnimalMediaResponse,
  GetAnimalIdentifierParams,
  GetAnimalIdentifierResponse,
  AddAnimalIdentifierPayload,
  AddAnimalIdentifierResponse,
  EditAnimalIdentifierPayload,
  EditAnimalIdentifierResponse,
  DeleteAnimalIdentifierParams,
  DeleteAnimalIdentifierResponse,
  GetAnimalIncidentListParams,
  GetAnimalIncidentListResponse,
  GetAnimalIncidentDetailsParams,
  GetAnimalIncidentDetailsResponse,
  CreateAnimalIncidentPayload,
  CreateAnimalIncidentResponse,
  UpdateAnimalIncidentPayload,
  UpdateAnimalIncidentResponse,
  GetAnimalMortalityParams,
  GetAnimalMortalityResponse,
  EditAnimalMortalityPayload,
  EditAnimalMortalityResponse,
  RevokeAnimalMortalityPayload,
  RevokeAnimalMortalityResponse,
  GetMannerOfDeathResponse,
  GetCarcassConditionResponse,
  GetCarcassDispositionResponse,
  GetAnimalDietListParams,
  GetAnimalDietListResponse,
  GetAnimalJournalLogsParams,
  GetAnimalJournalLogsResponse,
  GetAnimalJournalModulesParams,
  GetAnimalJournalModulesResponse,
  GetAnimalTreatmentListParams,
  GetAnimalTreatmentListResponse
} from 'src/types/housing'

import type {
  AddAnimalMediaPayload,
  AddAnimalMediaResponse,
  TaxonomyLevel,
  TaxonomyHierarchyData,
  GetTaxonomyHierarchyParams,
  GetTaxonomyHierarchyResponse,
  GetVaccinationListParams,
  VaccinationRecord,
  GetVaccinationListResponse,
  GetMedicineSideEffectParams,
  MedicineSideEffect,
  GetMedicineSideEffectResponse,
  DeleteMedicineSideEffectParams,
  DeleteMedicineSideEffectResponse
} from 'src/types/housing/api/animal'

// ==================== Animal API ====================

export async function getAllAnimalList(params?: GetAnimalsParams): Promise<GetAnimalsResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL}`, params })

  return response.data
}

export async function getAnimalDetailsOverview(
  params: GetAnimalDetailsOverviewParams
): Promise<GetAnimalDetailsOverviewResponse> {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_OVERVIEW}`, params })

  return response?.data
}

export async function getAnimalHistory(params: GetAnimalHistoryParams): Promise<GetAnimalHistoryResponse> {
  const response = await axiosGet({ url: `${ANIMAL_HISTORY}`, params })

  return response?.data
}

export async function getAnimalMedia(params: GetAnimalMediaParams): Promise<GetAnimalMediaResponse> {
  const response = await axiosGet({ url: `${ANIMAL_MEDIA}`, params })

  return response?.data
}

// ==================== Animal Media Upload API ====================

export async function addAnimalMedia(formData: FormData): Promise<AddAnimalMediaResponse> {
  const response = await axiosFormPost({ url: `${ADD_ANIMAL_MEDIA}`, body: formData })

  return response?.data
}

// ==================== Animal Identifier API ====================

export async function getAnimalIdentifier(params: GetAnimalIdentifierParams): Promise<GetAnimalIdentifierResponse> {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_IDENTIFIER_LIST}`, params })

  return response?.data
}

export async function addAnimalIdentifier(params: AddAnimalIdentifierPayload): Promise<AddAnimalIdentifierResponse> {
  const response = await axiosPost({ url: `${ADD_ANIMAL_IDENTIFIER}`, body: params })

  return response?.data
}

export async function editAnimalIdentifier(params: EditAnimalIdentifierPayload): Promise<EditAnimalIdentifierResponse> {
  const response = await axiosPost({ url: `${EDIT_ANIMAL_IDENTIFIER}`, body: params })

  return response?.data
}

export async function deleteAnimalIdentifier(
  params: DeleteAnimalIdentifierParams
): Promise<DeleteAnimalIdentifierResponse> {
  const response = await axiosGet({ url: `${DELETE_ANIMAL_IDENTIFIER}`, params })

  return response?.data
}

// ==================== Animal Incident API ====================

export async function getAnimalIncidentList(
  animalId: number | string
): Promise<GetAnimalIncidentListResponse> {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_INCIDENT_LIST}/${animalId}` })

  return response?.data
}

export async function getAnimalIncidentDetails(
  incidentId: number | string
): Promise<GetAnimalIncidentDetailsResponse> {
  const response = await axiosGet({ url: `${ANIMAL_INCIDENT_DETAILS}/${incidentId}` })

  return response?.data
}

export async function createAnimalIncident(payload: CreateAnimalIncidentPayload | FormData): Promise<CreateAnimalIncidentResponse> {
  const response = await axiosFormPost({ url: `${ANIMAL_CREATE_INCIDENT}`, body: payload })

  return response?.data
}

export async function updateAnimalIncident(params: UpdateAnimalIncidentPayload | FormData): Promise<UpdateAnimalIncidentResponse> {
  const response = await axiosFormPost({ url: `${ANIMAL_UPDATE_INCIDENT}`, body: params })

  return response?.data
}

// ==================== Animal Mortality API ====================

export async function getAnimalMortalityReport(params: GetAnimalMortalityParams): Promise<GetAnimalMortalityResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_MORTALITY}`, params })

  return response?.data
}

export async function editAnimalMortalityReport(
  params: EditAnimalMortalityPayload
): Promise<EditAnimalMortalityResponse> {
  const response = await axiosPost({ url: `${EDIT_ANIMAL_MORTALITY}`, body: params })

  return response?.data
}

export async function revokeAnimalMortality(
  params: RevokeAnimalMortalityPayload
): Promise<RevokeAnimalMortalityResponse> {
  const response = await axiosPost({ url: `${REVOKE_ANIMAL_MORTALITY}`, body: params })

  return response?.data
}

export async function getMannerOfDeath(): Promise<GetMannerOfDeathResponse> {
  const response = await axiosGet({ url: `${MANNER_OF_DEATH}` })

  return response?.data
}

export async function getCarcassCondition(): Promise<GetCarcassConditionResponse> {
  const response = await axiosGet({ url: `${CARCASS_CONDITION}` })

  return response?.data
}

export async function getCarcassDeposition(): Promise<GetCarcassDispositionResponse> {
  const response = await axiosGet({ url: `${CARCASS_DEPOSITION}` })

  return response?.data
}

// ==================== Animal Diet API ====================

export async function getAnimalDietList(
  speciesId: number | string,
  animalId?: number | string
): Promise<GetAnimalDietListResponse> {
  const params = animalId ? { animal_id: animalId } : undefined
  const response = await axiosGet({ url: `${ANIMAL_DIET_LIST}/${speciesId}`, params })

  return response?.data
}

// ==================== Animal Journal API ====================

export async function getAnimalJournalLogs(params: GetAnimalJournalLogsParams): Promise<GetAnimalJournalLogsResponse> {
  const response = await axiosGet({ url: `${ANIMAL_JOURNAL_LOGS}`, params })

  return response?.data
}

export async function getAnimalJournalModules(params: GetAnimalJournalModulesParams): Promise<GetAnimalJournalModulesResponse> {
  const response = await axiosGet({ url: `${ANIMAL_JOURNAL_MODULES}`, params })

  return response?.data
}

// ==================== Treatment API ====================

export async function getAnimalTreatmentList(
  params?: GetAnimalTreatmentListParams
): Promise<GetAnimalTreatmentListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TREATMENT}/${params?.site_id}`, params })

  return response.data
}

// ==================== Taxonomy Hierarchy API ====================

export async function getTaxonomyHierarchy(params: GetTaxonomyHierarchyParams): Promise<GetTaxonomyHierarchyResponse> {
  const response = await axiosGet({ url: `${GET_TAXONOMY_HIERARCHY}`, params })

  return response?.data
}

// ==================== Vaccination/Deworming API ====================

export async function getVaccinationList(params: GetVaccinationListParams): Promise<GetVaccinationListResponse> {
  const { GET_VACCINATION_LIST_ANIMAL_WISE } = await import('src/constants/housing/animalConstants')
  const response = await axiosGet({ url: `${GET_VACCINATION_LIST_ANIMAL_WISE}`, params })

  return response?.data
}

// ==================== Medicine Side Effect API ====================

export async function getMedicineSideEffect(params: GetMedicineSideEffectParams): Promise<GetMedicineSideEffectResponse> {
  const { GET_MEDICINE_SIDE_EFFECT } = await import('src/constants/housing/animalConstants')

  const body = {
    animal_id: JSON.stringify([params.animal_id]),
    page_no: params.page_no || 1
  }
  const response = await axiosPost({ url: `${GET_MEDICINE_SIDE_EFFECT}`, body })

  return response?.data
}

export async function deleteMedicineSideEffect(params: DeleteMedicineSideEffectParams): Promise<DeleteMedicineSideEffectResponse> {
  const { DELETE_MEDICINE_SIDE_EFFECT } = await import('src/constants/housing/animalConstants')
  const response = await axiosPost({ url: `${DELETE_MEDICINE_SIDE_EFFECT}`, body: params })

  return response?.data
}
