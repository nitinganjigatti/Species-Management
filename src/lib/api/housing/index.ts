import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

// Type-safe wrappers for axios utilities (any used for return type to preserve existing behavior)
const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
import {
  GET_ALL_SECTIONS,
  GET_SITES,
  HOUSING_SITE_ANALYTICS,
  SITE_DETAILS,
  GET_ALL_NOTES,
  GET_ALL_SPECIES,
  GET_MORTALITY,
  GET_ANIMAL_TREATMENT,
  GET_MEDIA,
  GET_ANIMAL,
  GET_CLUSTERS_LIST,
  GET_SPECIFIC_CLUSTER_ANALYTICS,
  GET_ENCLOSURE_LIST_SECTION_WISE,
  GET_ENCLOSURE_WISE_STATS,
  GET_ENCLOSURE_WISE_SPECIES,
  SECTION_INSIGHTS,
  SECTION_GET_ANIMAL_TREATMENT,
  GET_ALL_ENCLOSURES,
  GET_SITES_LIST_CLUSTER_WISE,
  ADD_CLUSTER,
  ADD_SECTION,
  CREATE_SITE,
  ADD_ENCLOSURE_TO_HOUSING,
  GET_ENCLOSURE_SETTINGS,
  GET_SECTION_FOR_ENCLOSURE,
  GET_PARENT_ENCLOSURE,
  ANIMAL_DETAILS_OVERVIEW,
  ANIMAL_DETAILS_INCIDENT_LIST,
  ANIMAL_INCIDENT_DETAILS,
  ANIMAL_UPDATE_INCIDENT,
  ANIMAL_DETAILS_IDENTIFIER_LIST,
  ADD_ANIMAL_IDENTIFIER,
  EDIT_ANIMAL_IDENTIFIER,
  DELETE_ANIMAL_IDENTIFIER,
  ANIMAL_CREATE_INCIDENT,
  GET_ANIMAL_MORTALITY,
  EDIT_ANIMAL_MORTALITY,
  REVOKE_ANIMAL_MORTALITY,
  MANNER_OF_DEATH,
  CARCASS_CONDITION,
  CARCASS_DEPOSITION,
  ANIMAL_DIET_LIST,
  ANIMAL_HISTORY,
  ANIMAL_MEDIA,
  ANIMAL_JOURNAL_LOGS,
  TRANSFER_AND_SECURITY_TEAM_LIST,
  ADD_SITE_TEAM,
  EDIT_SITE_TEAM,
  UPDATE_PERFORM_ACTION,
  GET_INCHARGE_LIST,
  ADD_INCHARGE,
  GET_USERS_ROLE_LIST,
  ADD_NOTE_REACTION,
  REMOVE_NOTE_REACTION,
  ADD_OBSERVATION_COMMENT,
  OBSERVATION_MASTER_LIST,
  GET_ALL_USERS,
  CREATE_OBSERVATION,
  GET_OBSERVATION_DETAILS,
  DELETE_OBSERVATION,
  EDIT_OBSERVATION,
  OBSERVATION_MASTER_TYPE,
  GET_ANIMAL_TRANSFER_LIST,
  GET_ANIMAL_TRANSFER_SUMMARY,
  GET_ANIMAL_TRANSFER_BUTTON_STATUS,
  GET_ANIMAL_TRANSFER_LOGS,
  ADD_ANIMAL_TRANSFER_COMMENT,
  UPDATE_ANIMAL_TRANSFER_STATUS,
  GET_TRANSFER_SUMMARY,
  GET_TRANSFER_BUTTON_STATUS,
  UPDATE_TRANSFER_STATUS,
  ADD_TRANSFER_COMMENT,
  GET_TRANSFER_ACTIVITY,
  GET_TRANSFER_MEMBERS,
  APPROVE_TRANSFER_REQUEST,
  REJECT_TRANSFER_REQUEST,
  GET_ANIMAL_LIST_BY_SPECIES,
  GET_SITE_FOOD_WASTAGE,
  GET_SECTION_FOOD_WASTAGE,
  GET_ENCLOSURE_FOOD_WASTAGE,
  GET_FOOD_WASTAGE_DETAILS,
  GET_TAXONOMY_HIERARCHY,
  USER_LIST,
  GET_USERS_LIST,
  GET_FAMILY_TREE_PARENT_LIST,
  GET_FAMILY_TREE_PAIR_LIST,
  GET_FAMILY_TREE_SIBLING_LIST,
  ADD_FAMILY_TREE_PARENT,
  EDIT_EXTERNAL_PARENT,
  DELETE_FAMILY_TREE_PARENT,
  ADD_FAMILY_TREE_PAIR,
  EDIT_FAMILY_TREE_PAIR,
  DELETE_FAMILY_TREE_PAIR,
  GET_USER_ACCESS_CHECK,
  GET_LINEAGE_ANIMAL_LIST,
  GET_FAMILY_TREE_CLUTCH_LIST,
  GET_FAMILY_TREE_LITTER_LIST
} from 'src/constants/ApiConstant'
import type {
  GetSitesParams,
  GetSitesResponse,
  GetSiteAnalyticsResponse,
  GetSiteDetailsResponse,
  AddSitePayload,
  AddSiteResponse,
  GetSectionsParams,
  GetSectionsResponse,
  GetSectionAnalyticsPayload,
  GetSectionAnalyticsResponse,
  AddSectionPayload,
  AddSectionResponse,
  GetEnclosuresParams,
  GetEnclosuresResponse,
  GetEnclosureListSectionWiseParams,
  GetEnclosureListSectionWiseResponse,
  GetEnclosureWiseStatsParams,
  GetEnclosureWiseStatsResponse,
  GetEnclosureWiseSpeciesParams,
  GetEnclosureWiseSpeciesResponse,
  GetEnclosureSettingsParams,
  GetEnclosureSettingsResponse,
  GetSectionsForEnclosurePayload,
  GetSectionsForEnclosureResponse,
  GetParentEnclosureListPayload,
  GetParentEnclosureListResponse,
  AddEnclosurePayload,
  AddEnclosureResponse,
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
  GetSpeciesParams,
  GetSpeciesResponse,
  GetMortalityListParams,
  GetMortalityListResponse,
  GetAnimalTreatmentListParams,
  GetAnimalTreatmentListResponse,
  GetSectionAnimalTreatmentListParams,
  GetMediaParams,
  GetMediaResponse,
  GetClusterListParams,
  GetClusterListResponse,
  GetClusterAnalyticsParams,
  GetClusterAnalyticsResponse,
  GetSiteListClusterWiseParams,
  GetSiteListClusterWiseResponse,
  AddClusterPayload,
  AddClusterResponse,
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
  AddObservationCommentResponse,
  GetUsersListParams,
  GetUsersListResponse,
  GetLineageParentParams,
  GetLineageParentResponse,
  GetLineagePairParams,
  GetLineagePairResponse,
  GetLineageSiblingParams,
  GetLineageSiblingResponse,
  AddLineageParentResponse,
  EditExternalParentResponse,
  DeleteLineageParentResponse,
  AddLineagePairResponse,
  EditLineagePairResponse,
  DeleteLineagePairResponse,
  GetLineageAnimalListParams,
  GetLineageAnimalListResponse
} from 'src/types/housing'
import type {
  AddParentPayload,
  EditExternalParentPayload,
  DeleteParentPayload,
  AddPairPayload,
  EditPairPayload,
  DeletePairPayload,
  UserAccessCheckParams,
  UserAccessCheckResponse,
  GetClutchListParams,
  GetClutchListResponse,
  GetLitterListParams,
  GetLitterListResponse
} from 'src/types/housing/models'

// ==================== Site API ====================

export async function getSiteAnalytics(id: number): Promise<GetSiteAnalyticsResponse> {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}

export async function AddNewSite(params: AddSitePayload): Promise<AddSiteResponse> {
  const response = await axiosFormPost({ url: `${CREATE_SITE}`, body: params })

  return response.data
}

export async function getAllSites(params?: GetSitesParams): Promise<GetSitesResponse> {
  const response = await axiosGet({ url: `${GET_SITES}`, params })

  return response.data
}

export async function getSpecificSiteAnalytics(params: { site_id: number }): Promise<GetSiteDetailsResponse> {
  const response = await axiosGet({ url: `${SITE_DETAILS}`, params })

  return response.data
}

// ==================== Section API ====================

export async function getAllSections(params?: GetSectionsParams): Promise<GetSectionsResponse> {
  const response = await axiosGet({ url: `${GET_ALL_SECTIONS}`, params })

  return response.data
}

export async function getSectionAnalytics(body: GetSectionAnalyticsPayload): Promise<GetSectionAnalyticsResponse> {
  const response = await axiosPost({ url: `${SECTION_INSIGHTS}`, body: JSON.stringify(body) })

  return response.data
}

export async function addSection(params: AddSectionPayload): Promise<AddSectionResponse> {
  const response = await axiosFormPost({ url: `${ADD_SECTION}`, body: params })

  return response?.data
}

// ==================== Enclosure API ====================

export async function getAllEnclosures(params?: GetEnclosuresParams): Promise<GetEnclosuresResponse> {
  const response = await axiosGet({ url: `${GET_ALL_ENCLOSURES}`, params })

  return response.data
}

export async function getEnclosureListSectionWise(
  params: GetEnclosureListSectionWiseParams
): Promise<GetEnclosureListSectionWiseResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_LIST_SECTION_WISE}`, params })

  return response.data
}

export async function getEnclosureWiseStat(
  params: GetEnclosureWiseStatsParams
): Promise<GetEnclosureWiseStatsResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_STATS}/${params?.enclosure_id}` })

  return response?.data
}

export async function getEnclosureWiseSpecies(
  params: GetEnclosureWiseSpeciesParams = {},
  id: number
): Promise<GetEnclosureWiseSpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_SPECIES}/${id}`, params })

  return response?.data
}

export async function getEnclosureSetting(params?: GetEnclosureSettingsParams): Promise<GetEnclosureSettingsResponse> {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_SETTINGS}`, params })

  return response?.data
}

export async function getSectionsListingForEnclosure(
  params: GetSectionsForEnclosurePayload
): Promise<GetSectionsForEnclosureResponse> {
  const response = await axiosPost({ url: `${GET_SECTION_FOR_ENCLOSURE}`, body: params })

  return response?.data
}

export async function getParentEnclosureList(
  params: GetParentEnclosureListPayload
): Promise<GetParentEnclosureListResponse> {
  const response = await axiosPost({ url: `${GET_PARENT_ENCLOSURE}`, body: params })

  return response?.data
}

export async function addEnclosureToHousing(params: AddEnclosurePayload): Promise<AddEnclosureResponse> {
  const response = await axiosFormPost({ url: `${ADD_ENCLOSURE_TO_HOUSING}`, body: params })

  return response?.data
}

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
  animalId: number | string,
  params?: Omit<GetAnimalDietListParams, 'animal_id'>
): Promise<GetAnimalDietListResponse> {
  const response = await axiosGet({ url: `${ANIMAL_DIET_LIST}/${animalId}`, params })

  return response?.data
}

// ==================== Animal Journal API ====================

export async function getAnimalJournalLogs(params: GetAnimalJournalLogsParams): Promise<GetAnimalJournalLogsResponse> {
  const response = await axiosGet({ url: `${ANIMAL_JOURNAL_LOGS}`, params })

  return response?.data
}

// ==================== Species API ====================

export async function getAllSpeciesList(params?: GetSpeciesParams): Promise<GetSpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ALL_SPECIES}`, params })

  return response.data
}

// ==================== Mortality List API ====================

export async function getMortalityList(params?: GetMortalityListParams): Promise<GetMortalityListResponse> {
  const response = await axiosGet({ url: `${GET_MORTALITY}`, params })

  return response.data
}

// ==================== Treatment API ====================

export async function getAnimalTreatmentList(
  params?: GetAnimalTreatmentListParams
): Promise<GetAnimalTreatmentListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TREATMENT}/${params?.site_id}`, params })

  return response.data
}

export async function getSectionAnimalTreatmentList(
  params: GetSectionAnimalTreatmentListParams
): Promise<GetAnimalTreatmentListResponse> {
  const response = await axiosGet({ url: `${SECTION_GET_ANIMAL_TREATMENT}/${params?.section_id}`, params })

  return response.data
}

// ==================== Media API ====================

export async function getAllMedia(params?: GetMediaParams): Promise<GetMediaResponse> {
  const response = await axiosGet({ url: `${GET_MEDIA}`, params })

  return response.data
}

// ==================== Cluster API ====================

export async function getClusterList(params?: GetClusterListParams): Promise<GetClusterListResponse> {
  const response = await axiosGet({ url: `${GET_CLUSTERS_LIST}`, params })

  return response.data
}

export async function getSpecificClusterAnalytics(
  params: GetClusterAnalyticsParams
): Promise<GetClusterAnalyticsResponse> {
  const response = await axiosGet({ url: `${GET_SPECIFIC_CLUSTER_ANALYTICS}`, params })

  return response.data
}

export async function getSiteListClusterWise(
  params: GetSiteListClusterWiseParams
): Promise<GetSiteListClusterWiseResponse> {
  const response = await axiosGet({ url: `${GET_SITES_LIST_CLUSTER_WISE}`, params })

  return response?.data
}

export async function addCluster(params: AddClusterPayload): Promise<AddClusterResponse> {
  const response = await axiosFormPost({ url: `${ADD_CLUSTER}`, body: params })

  return response?.data
}

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

export interface EditObservationResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function editObservation(formData: FormData): Promise<EditObservationResponse> {
  const response = await axiosFormPost({ url: `${EDIT_OBSERVATION}`, body: formData })

  return response?.data
}

export async function addNoteReaction(observationId: number): Promise<AddNoteReactionResponse> {
  const response = await axiosPost({
    url: `${ADD_NOTE_REACTION}`,
    body: { observation_id: observationId, reaction_type: 'like' }
  })

  return response?.data
}

export async function removeNoteReaction(observationId: number): Promise<RemoveNoteReactionResponse> {
  const response = await axiosPost({
    url: `${REMOVE_NOTE_REACTION}`,
    body: { observation_id: observationId }
  })

  return response?.data
}

export async function addObservationComment(formData: FormData): Promise<AddObservationCommentResponse> {
  const response = await axiosFormPost({ url: `${ADD_OBSERVATION_COMMENT}`, body: formData })

  return response?.data
}

// ==================== User API ====================

export async function getAllUsers(params?: GetUsersListParams): Promise<GetUsersListResponse> {
  const response = await axiosGet({ url: `${GET_ALL_USERS}`, params })

  return response?.data
}

// Get users list using POST method (matches mobile implementation for notes filters)
export interface GetUserListPostParams {
  zoo_id?: number
  isActive?: boolean
}

export interface UserListItem {
  user_id: number
  user_name?: string
  full_name?: string
  user_profile_pic?: string
  role_name?: string
  user_mobile_number?: string
  account_status?: string
}

export interface GetUserListPostResponse {
  success?: boolean
  message?: string
  data?: UserListItem[]
}

export async function getUserListPost(params: GetUserListPostParams): Promise<GetUserListPostResponse> {
  const response = await axiosPost({ url: `${USER_LIST}`, body: params })

  return response?.data
}

export async function getTransferAndSecurityTeamList(params?: GetUsersListParams): Promise<GetUsersListResponse> {
  const response = await axiosGet({ url: `${TRANSFER_AND_SECURITY_TEAM_LIST}`, params })

  return response?.data
}

// ==================== Incharge API ====================

export interface GetInchargeListParams {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  ref_id?: number
  ref_type?: string
}

export interface InchargeUser {
  user_id: number
  user_name: string
  user_profile?: string
  role_name?: string
  phone?: string
}

export interface GetInchargeListResponse {
  success?: boolean
  message?: string
  data?: {
    incharges?: InchargeUser[]
    total_count?: number
  }
}

export async function getInchargeList(params: GetInchargeListParams): Promise<GetInchargeListResponse> {
  const response = await axiosGet({ url: `${GET_INCHARGE_LIST}`, params })

  return response?.data
}

export interface AddInchargePayload {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  cluster_id?: number
  animal_id?: number
  user_ids: number[]
}

export interface AddInchargeResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function addIncharge(params: AddInchargePayload): Promise<AddInchargeResponse> {
  const response = await axiosPost({ url: `${ADD_INCHARGE}`, body: params })

  return response?.data
}

// ==================== User Roles API ====================

export interface UserRole {
  role_id: number
  role_name: string
  role_code?: string
}

export interface GetUsersRoleListResponse {
  success?: boolean
  message?: string
  data?: UserRole[]
}

export async function getUsersRoleList(): Promise<GetUsersRoleListResponse> {
  const response = await axiosGet({ url: `${GET_USERS_ROLE_LIST}` })

  return response?.data
}

// ==================== Site Team Management API ====================

export interface AddSiteTeamPayload {
  site_id: number
  user_id: number | number[] | string // Can be single user_id, array, or JSON string of user IDs
  user_type: 'transfer_user' | 'security'
}

export interface AddSiteTeamResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function addSiteTeamMember(params: AddSiteTeamPayload): Promise<AddSiteTeamResponse> {
  // Format user_id as JSON string array if it's an array (matching mobile behavior)
  const body = {
    site_id: params.site_id,
    user_id: Array.isArray(params.user_id) ? JSON.stringify(params.user_id) : params.user_id,
    user_type: params.user_type
  }
  const response = await axiosPost({ url: `${ADD_SITE_TEAM}`, body })

  return response?.data
}

export interface EditSiteTeamPayload {
  site_id: number
  user_id: number
  user_type: 'transfer_user' | 'security'
}

export interface EditSiteTeamResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function removeSiteTeamMember(params: EditSiteTeamPayload): Promise<EditSiteTeamResponse> {
  const response = await axiosPost({ url: `${EDIT_SITE_TEAM}`, body: params })

  return response?.data
}

export interface UpdatePerformActionPayload {
  site_id: number
  user_id: number
  user_type: 'transfer_user' | 'security'
  can_perform_action: number // 0 or 1
}

export interface UpdatePerformActionResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function updateTeamMemberPermission(params: UpdatePerformActionPayload): Promise<UpdatePerformActionResponse> {
  const response = await axiosPost({ url: `${UPDATE_PERFORM_ACTION}`, body: params })

  return response?.data
}

// ==================== Animal Transfer API ====================

export interface AnimalTransferItem {
  animal_movement_id?: number
  request_id?: string
  transfer_type?: 'intra' | 'inter' | 'external'
  transfer_status?: string
  activity_status?: string
  source_site_name?: string
  destination_name?: string
  destination_id?: number
  animal_count?: number
  transferred_animal_count?: number
  requested_on?: string
  comments?: string
  comment_string_id?: string
  comments_tag?: string
  string_id?: string
  user_details?: string
}

export interface GetAnimalTransferListParams {
  site_id: number | string
  transfer_type: 'intra' | 'inter' | 'external'
  filter_type?: string
  page_no?: number
  q?: string
}

export interface GetAnimalTransferListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AnimalTransferItem[]
    total_count?: number
  }
}

export async function getAnimalTransferList(params: GetAnimalTransferListParams): Promise<GetAnimalTransferListResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_LIST}`, params })

  return response?.data
}

// ==================== Transfer Details API ====================

export interface TransferAssignTo {
  enclosure_id?: number
  enclosure_name?: string
  section_id?: number
  section_name?: string
}

export interface TransferDetails {
  animal_movement_id?: number
  request_id?: string
  transfer_code?: string
  transfer_type?: 'intra' | 'inter' | 'external'
  transfer_status?: string
  activity_status?: string
  source_site_id?: number
  source_site_name?: string
  destination_id?: number
  destination_name?: string
  destination_site_name?: string
  animal_count?: number
  transferred_animal_count?: number
  requested_on?: string
  created_at?: string
  comments?: string
  reason?: string
  qr_code_full_path?: string
  checked_count?: number
  total_checklist_count?: number
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  user_mobile_number?: string
  created_by?: number
  created_by_name?: string
  assign_to?: TransferAssignTo
}

export interface TransferEntityDetail {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  species_name?: string
  common_name?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  [key: string]: unknown
}

export interface TransferAttachment {
  id?: number
  file?: string
  file_url?: string
  file_original_name?: string
  file_type?: string
  created_at?: string
  thumbnail?: string
}

export interface TransferComment {
  id?: number
  comments?: string
  content?: string
  commented_on?: string
  created_at?: string
  action?: string
  user_id?: number
  user_name?: string
  user_full_name?: string
  user_first_name?: string
  user_last_name?: string
  profile_pic?: string
  user_profile_pic?: string
  status?: string
  is_system_generated?: number | boolean
}

export interface TransferApprovalItem {
  user_id?: number
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  role_name?: string
  site_name?: string
  status?: string
  source_site?: number
  destination_site?: number
  source_action_date?: string
  destination_action_date?: string
  commented_on?: string
}

export interface TransferSummaryData {
  transfer_details?: TransferDetails
  entity_details?: TransferEntityDetail[]
  animal_details?: TransferEntityDetail[]
  transfer_attachment?: TransferAttachment[]
  comments_details?: TransferComment[]
  approval_list?: TransferApprovalItem[]
  total_animal_count?: number
  transferred_animal_count?: number
  total_members?: number
}

export interface GetTransferSummaryResponse {
  success?: boolean
  message?: string
  data?: TransferSummaryData
}

export async function getTransferSummary(params: { animal_movement_id: number | string; type?: string }): Promise<GetTransferSummaryResponse> {
  const response = await axiosGet({ url: `${GET_TRANSFER_SUMMARY}`, params })

  return response?.data
}

// ==================== Animal Transfer Details API ====================

export interface GetAnimalTransferSummaryParams {
  animal_movement_id: number | string
  type?: string
}

export async function getAnimalTransferSummary(params: GetAnimalTransferSummaryParams): Promise<GetTransferSummaryResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_SUMMARY}`, params })

  return response?.data
}

export interface GetAnimalTransferButtonStatusParams {
  animal_movement_id: number | string
  type?: string
}

export async function getAnimalTransferButtonStatus(params: GetAnimalTransferButtonStatusParams): Promise<GetTransferButtonStatusResponse> {
  const response = await axiosPost({ url: `${GET_ANIMAL_TRANSFER_BUTTON_STATUS}`, body: params })

  return response?.data
}

export interface AnimalTransferLogItem {
  id?: number
  animal_movement_id?: number
  user_id?: number
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  profile_pic?: string
  comments?: string
  content?: string
  status?: string
  activity_status?: string
  created_at?: string
  commented_on?: string
}

export interface GetAnimalTransferLogsResponse {
  success?: boolean
  message?: string
  data?: {
    logs?: AnimalTransferLogItem[]
  } | AnimalTransferLogItem[]
}

export async function getAnimalTransferLogs(animal_movement_id: number | string): Promise<GetAnimalTransferLogsResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_TRANSFER_LOGS}`, params: { animal_movement_id } })

  return response?.data
}

export interface AddAnimalTransferCommentPayload {
  animal_movement_id: number | string
  comments: string
}

export interface AddAnimalTransferCommentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function addAnimalTransferComment(payload: AddAnimalTransferCommentPayload): Promise<AddAnimalTransferCommentResponse> {
  const response = await axiosPost({ url: `${ADD_ANIMAL_TRANSFER_COMMENT}`, body: payload })

  return response?.data
}

export interface UpdateAnimalTransferStatusPayload {
  animal_movement_id: number | string
  transfer_status?: string
  activity_status?: string
  comments?: string
}

export interface UpdateAnimalTransferStatusResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function updateAnimalTransferStatus(payload: UpdateAnimalTransferStatusPayload): Promise<UpdateAnimalTransferStatusResponse> {
  const response = await axiosPost({ url: `${UPDATE_ANIMAL_TRANSFER_STATUS}`, body: payload })

  return response?.data
}

export interface TransferButtonStatus {
  // Basic approval buttons
  show_approve_button?: boolean
  show_reject_button?: boolean
  show_cancel_request_button?: boolean
  approve_button?: boolean
  reject_button?: boolean

  // Status flags for badges
  already_approved?: boolean
  already_rejected?: boolean
  show_you_approved?: boolean
  show_you_rejected?: boolean
  reset_approval?: boolean
  reinitiate_button?: boolean

  // Workflow buttons
  show_edit_checklist_button?: boolean
  show_load_animals_button?: boolean
  show_start_ride_button?: boolean
  show_reach_destination_button?: boolean
  show_reached_destination_button?: boolean
  show_allocate_button?: boolean
  show_complete_button?: boolean
  show_check_temperature_button?: boolean
  show_security_checkout_button?: boolean
  show_security_checkin_button?: boolean
  show_reload_animals_button?: boolean
  show_approve_entry?: boolean
  show_allow_entry?: boolean
  fill_transfer_check_list?: boolean

  // Security flags
  SECURITY_CHECKOUT_ALLOWED?: boolean
  SECURITY_CHECKIN_ALLOWED?: boolean
  show_accept_button?: number
}

export interface GetTransferButtonStatusResponse {
  success?: boolean
  message?: string
  data?: TransferButtonStatus
}

export interface GetTransferButtonStatusParams {
  animal_movement_id: number | string
  site_id?: number | string
  reference?: string
  type?: string
}

export async function getTransferButtonStatus(params: GetTransferButtonStatusParams): Promise<GetTransferButtonStatusResponse> {
  const { animal_movement_id, ...restParams } = params

  const response = await axiosGet({
    url: `${GET_TRANSFER_BUTTON_STATUS}/${animal_movement_id}/button-status`,
    params: restParams
  })

  return response?.data
}

export interface UpdateTransferStatusPayload {
  status: string
  movement_id: number | string
  comments?: string
  animal_ids?: string
  temperature_value?: string
  temperature_unit?: string
}

export interface UpdateTransferStatusResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function updateTransferStatus(payload: UpdateTransferStatusPayload): Promise<UpdateTransferStatusResponse> {
  // Mobile uses POST /v1/transfer/update-btn-status/{movement_id}
  const { movement_id, ...restPayload } = payload

  const response = await axiosPost({
    url: `${UPDATE_TRANSFER_STATUS}/${movement_id}`,
    body: restPayload
  })

  return response?.data
}

export interface AddTransferCommentPayload {
  animal_movement_id: number | string
  comments: string
  status?: string
}

export interface AddTransferCommentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function addTransferComment(payload: AddTransferCommentPayload): Promise<AddTransferCommentResponse> {
  const response = await axiosPost({ url: `${ADD_TRANSFER_COMMENT}`, body: payload })

  return response?.data
}

export interface TransferActivityItem {
  id?: number
  status?: string
  comments?: string
  content?: string
  action?: string
  commented_on?: string
  created_at?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  date_changed?: boolean
  dump?: {
    loaded_count?: number
    total_animal_count?: number
  }
}

export interface GetTransferActivityResponse {
  success?: boolean
  message?: string
  data?: {
    logs?: TransferActivityItem[]
    comments?: TransferActivityItem[]
    result?: TransferActivityItem[]
  }
}

export async function getTransferActivity(animal_movement_id: number | string): Promise<GetTransferActivityResponse> {
  const response = await axiosGet({
    url: `${GET_TRANSFER_ACTIVITY}/${animal_movement_id}/activity`,
    params: {}
  })

  return response?.data
}

// ==================== Transfer Team Members API ====================

export interface TransferMemberUser {
  user_id?: number
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  role_name?: string
  user_mobile_number?: string
  can_perform_action?: boolean
  source_site_name?: string
  destination_name?: string
  account_status?: string
}

export interface TransferMembersData {
  source_users?: TransferMemberUser[]
  destination_users?: TransferMemberUser[]
  user_details?: TransferMemberUser[]
}

export interface GetTransferMembersResponse {
  success?: boolean
  message?: string
  data?: TransferMembersData
}

export async function getTransferMembers(params: { animal_movement_id: number | string }): Promise<GetTransferMembersResponse> {
  const response = await axiosGet({ url: `${GET_TRANSFER_MEMBERS}`, params })

  return response?.data
}

// ==================== Approve/Reject Transfer API ====================

export interface ApproveTransferResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function approveTransferRequest(params: { animal_movement_id: number | string }): Promise<ApproveTransferResponse> {
  const response = await axiosPost({ url: `${APPROVE_TRANSFER_REQUEST}`, body: params })

  return response?.data
}

export interface RejectTransferPayload {
  animal_movement_id: number | string
  transfer_status?: string
  activity_status: string
  comments?: string
}

export interface RejectTransferResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function rejectTransferRequest(payload: RejectTransferPayload): Promise<RejectTransferResponse> {
  const response = await axiosPost({ url: `${REJECT_TRANSFER_REQUEST}`, body: payload })

  return response?.data
}

// ==================== Animal List by Species API ====================

// Individual animal detail within a species group
export interface AnimalDetailItem {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  gender?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  common_name?: string
  default_common_name?: string
  scientific_name?: string
  complete_name?: string
  [key: string]: unknown
}

// Species group containing animal_details array (matching mobile API structure)
export interface SpeciesWithAnimalsItem {
  taxonomy_id?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  animal_count?: number
  animal_details?: AnimalDetailItem[]
  [key: string]: unknown
}

// Legacy flat animal item (kept for backwards compatibility)
export interface AnimalBySpeciesItem {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  species_name?: string
  common_name?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  [key: string]: unknown
}

export interface GetAnimalListBySpeciesResponse {
  success?: boolean
  message?: string
  data?: {
    result?: SpeciesWithAnimalsItem[]
    total_animal_count?: number
  }
}

export async function getAnimalListBySpecies(params: { animal_movement_id: number | string }): Promise<GetAnimalListBySpeciesResponse> {
  const response = await axiosGet({ url: `${GET_ANIMAL_LIST_BY_SPECIES}`, params })

  return response?.data
}

// ==================== Food Wastage API ====================
// Matching mobile v1/site/food/wastage endpoint

export interface FoodWastageListItem {
  site_id?: number
  section_id?: number
  section_name?: string
  enclosure_id?: number
  user_enclosure_name?: string
  file_name?: string
  total_wastage?: string | number
  unit?: string
  // Enclosure-level fields (daily entries)
  wastage_date?: string
  total_entry?: string | number
  entries?: FoodWastageGraphEntry[]
}

export interface FoodWastageHighestWastage {
  section_id?: number
  section_name?: string
  user_enclosure_name?: string
  total_wastage?: string | number
  unit?: string
  wastage_per?: string | number
}

export interface FoodWastageGraphEntry {
  wastage_quantity?: string | number
  wastage_time?: string
  wastage_date?: string
}

export interface FoodWastageGraphItem {
  wastage_date?: string
  total_wastage?: string | number
  total_entry?: string | number
  entries?: FoodWastageGraphEntry[]
}

export interface FoodWastageData {
  total_wastage?: string | number
  unit?: string
  daily_average?: string | number
  section_average?: string | number
  highest_wastage?: FoodWastageHighestWastage
  list?: FoodWastageListItem[]
  graphlist?: FoodWastageGraphItem[]
  total_count?: number
}

export interface GetFoodWastageParams {
  site_id?: string | number
  section_id?: string | number
  enclosure_id?: string | number
  from_date: string
  to_date: string
  limit?: number
  filter?: 'ASC' | 'DESC'
  is_graph?: 0 | 1
  page_no?: number
}

export interface GetFoodWastageResponse {
  success?: boolean
  message?: string
  data?: FoodWastageData
}

export async function getSiteFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
  const response = await axiosGet({ url: `${GET_SITE_FOOD_WASTAGE}`, params })

  return response?.data
}

export async function getSectionFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
  const response = await axiosGet({ url: `${GET_SECTION_FOOD_WASTAGE}`, params })

  return response?.data
}

export async function getEnclosureFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
  // Mobile uses v1/food/wastage with type=enclosure and type_id=<enclosure_id>
  const enclosureParams = {
    type: 'enclosure',
    type_id: params.enclosure_id,
    from_date: params.from_date,
    to_date: params.to_date,
    limit: params.limit,
    filter: params.filter,
    is_graph: params.is_graph,
    page_no: params.page_no
  }
  const response = await axiosGet({ url: `${GET_ENCLOSURE_FOOD_WASTAGE}`, params: enclosureParams })

  return response?.data
}

// Unified function that calls the correct endpoint based on refType
export async function getFoodWastage(
  refType: 'site' | 'section' | 'enclosure',
  params: GetFoodWastageParams
): Promise<GetFoodWastageResponse> {
  if (refType === 'section') {
    return getSectionFoodWastage(params)
  }
  if (refType === 'enclosure') {
    return getEnclosureFoodWastage(params)
  }
  
return getSiteFoodWastage(params)
}

// ==================== Food Wastage Details API ====================
// For getting individual wastage entries for a specific date

export interface FoodWastageDetailItem {
  id?: number
  wastage_quantity?: string | number
  original_wastage_quantity?: string | number
  unit?: string
  unit_id?: number
  wastage_date?: string
  notes?: string
  user_id?: number
  user_full_name?: string
  user_profile_pic?: string
}

export interface FoodWastageDetailsData {
  list?: FoodWastageDetailItem[]
  total_count?: number
  total_wastage?: string | number
  unit?: string
}

export interface GetFoodWastageDetailsParams {
  enclosure_id: string | number
  date: string
  page_no?: number
  limit?: number
}

export interface GetFoodWastageDetailsResponse {
  success?: boolean
  message?: string
  data?: FoodWastageDetailsData
}

export async function getFoodWastageDetails(params: GetFoodWastageDetailsParams): Promise<GetFoodWastageDetailsResponse> {
  const response = await axiosGet({ url: `${GET_FOOD_WASTAGE_DETAILS}`, params })

  return response?.data
}

// ==================== Users with Access API ====================
// Matches mobile implementation: get-userswith-access endpoint

import type { GetUsersWithAccessParams, GetUsersWithAccessResponse } from 'src/types/housing'

export async function getUsersList(params: GetUsersWithAccessParams): Promise<GetUsersWithAccessResponse> {
  const response = await axiosGet({ url: `${GET_USERS_LIST}`, params })

  return response?.data
}

// ==================== Taxonomy Hierarchy API ====================

export interface TaxonomyLevel {
  name?: string
  default_common_name?: string
}

export interface TaxonomyHierarchyData {
  class?: TaxonomyLevel
  order?: TaxonomyLevel
  famely?: TaxonomyLevel // Note: API returns "famely" (typo preserved for compatibility)
  genus?: TaxonomyLevel
  complete_name?: string
  species_common_name?: string
}

export interface GetTaxonomyHierarchyParams {
  species_id: string | number
}

export interface GetTaxonomyHierarchyResponse {
  success?: boolean
  message?: string
  data?: TaxonomyHierarchyData
}

export async function getTaxonomyHierarchy(params: GetTaxonomyHierarchyParams): Promise<GetTaxonomyHierarchyResponse> {
  const response = await axiosGet({ url: `${GET_TAXONOMY_HIERARCHY}`, params })

  return response?.data
}

// ==================== Vaccination/Deworming API ====================

export interface GetVaccinationListParams {
  animal_id: number | string
  type: 'vaccination' | 'deworming'
  status?: 'pending' | 'upcoming' | 'completed'
  page_no?: number
  length?: number
}

export interface VaccinationRecord {
  id?: number
  vaccine_name?: string
  medicine_name?: string
  name?: string
  dose?: string
  status?: string
  scheduled_date?: string
  administered_date?: string
  created_at?: string
  [key: string]: unknown
}

export interface GetVaccinationListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: VaccinationRecord[]
    stats?: {
      pending?: number
      upcoming?: number
      completed?: number
    }
    total_count?: number
  } | VaccinationRecord[]
  total_count?: number
}

export async function getVaccinationList(params: GetVaccinationListParams): Promise<GetVaccinationListResponse> {
  const { GET_VACCINATION_LIST_ANIMAL_WISE } = await import('src/constants/ApiConstant')
  // Mobile uses GET with query params
  const response = await axiosGet({ url: `${GET_VACCINATION_LIST_ANIMAL_WISE}`, params })

  return response?.data
}

// ==================== Medicine Side Effect API ====================

export interface GetMedicineSideEffectParams {
  animal_id: number | string
  page_no?: number
}

export interface MedicineSideEffect {
  id?: number
  medicine_name?: string
  name?: string
  side_effect?: string
  reason?: string
  [key: string]: unknown
}

export interface GetMedicineSideEffectResponse {
  success?: boolean
  message?: string
  data?: {
    result?: MedicineSideEffect[]
    total_count?: number
  } | MedicineSideEffect[]
}

export async function getMedicineSideEffect(params: GetMedicineSideEffectParams): Promise<GetMedicineSideEffectResponse> {
  const { GET_MEDICINE_SIDE_EFFECT } = await import('src/constants/ApiConstant')
  // Mobile sends animal_id as JSON stringified array
  
  const body = {
    animal_id: JSON.stringify([params.animal_id]),
    page_no: params.page_no || 1
  }
  const response = await axiosPost({ url: `${GET_MEDICINE_SIDE_EFFECT}`, body })

  return response?.data
}

export interface DeleteMedicineSideEffectParams {
  side_effect_id: number | string
}

export interface DeleteMedicineSideEffectResponse {
  success?: boolean
  message?: string
}

export async function deleteMedicineSideEffect(params: DeleteMedicineSideEffectParams): Promise<DeleteMedicineSideEffectResponse> {
  const { DELETE_MEDICINE_SIDE_EFFECT } = await import('src/constants/ApiConstant')
  // Mobile sends { side_effect_id: id }
  const response = await axiosPost({ url: `${DELETE_MEDICINE_SIDE_EFFECT}`, body: params })

  return response?.data
}

// ==================== Lineage / Family Tree API ====================

export async function getLineageParents(params: GetLineageParentParams): Promise<GetLineageParentResponse> {
  const response = await axiosGet({ url: GET_FAMILY_TREE_PARENT_LIST, params })

  return response?.data
}

export async function getLineagePairs(params: GetLineagePairParams): Promise<GetLineagePairResponse> {
  const response = await axiosGet({ url: GET_FAMILY_TREE_PAIR_LIST, params })

  return response?.data
}

export async function getLineageSiblings(params: GetLineageSiblingParams): Promise<GetLineageSiblingResponse> {
  const response = await axiosGet({ url: GET_FAMILY_TREE_SIBLING_LIST, params })

  return response?.data
}

export async function addLineageParent(params: AddParentPayload): Promise<AddLineageParentResponse> {
  const response = await axiosPost({ url: ADD_FAMILY_TREE_PARENT, body: params })

  return response?.data
}

export async function editExternalParent(params: EditExternalParentPayload): Promise<EditExternalParentResponse> {
  const response = await axiosPost({ url: EDIT_EXTERNAL_PARENT, body: params })

  return response?.data
}

export async function deleteLineageParent(params: DeleteParentPayload): Promise<DeleteLineageParentResponse> {
  const response = await axiosPost({ url: DELETE_FAMILY_TREE_PARENT, body: params })

  return response?.data
}

export async function addLineagePair(params: AddPairPayload): Promise<AddLineagePairResponse> {
  const response = await axiosPost({ url: ADD_FAMILY_TREE_PAIR, body: params })

  return response?.data
}

export async function editLineagePair(params: EditPairPayload): Promise<EditLineagePairResponse> {
  const response = await axiosPost({ url: EDIT_FAMILY_TREE_PAIR, body: params })

  return response?.data
}

export async function deleteLineagePair(params: DeletePairPayload): Promise<DeleteLineagePairResponse> {
  const response = await axiosPost({ url: DELETE_FAMILY_TREE_PAIR, body: params })

  return response?.data
}

export async function checkUserAccess(params: UserAccessCheckParams): Promise<UserAccessCheckResponse> {
  const response = await axiosGet({ url: GET_USER_ACCESS_CHECK, params })

  return response?.data
}

export async function getLineageAnimalList(params: GetLineageAnimalListParams): Promise<GetLineageAnimalListResponse> {
  const response = await axiosGet({ url: GET_LINEAGE_ANIMAL_LIST, params })

  return response?.data
}

export async function getClutchList(params: GetClutchListParams): Promise<GetClutchListResponse> {
  const response = await axiosGet({ url: GET_FAMILY_TREE_CLUTCH_LIST, params })

  return response?.data
}

export async function getLitterList(params: GetLitterListParams): Promise<GetLitterListResponse> {
  const response = await axiosGet({ url: GET_FAMILY_TREE_LITTER_LIST, params })

  return response?.data
}
