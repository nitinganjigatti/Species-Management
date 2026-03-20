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
  ADD_MEDIA,
  ADD_ANIMAL_MEDIA,
  GET_ANIMAL,
  GET_CLUSTERS_LIST,
  GET_SPECIFIC_CLUSTER_ANALYTICS,
  GET_ENCLOSURE_LIST_SECTION_WISE,
  GET_ENCLOSURE_WISE_STATS,
  GET_ENCLOSURE_BASIC_INFO,
  GET_ENCLOSURE_WISE_SPECIES,
  SECTION_INSIGHTS,
  SECTION_GET_ANIMAL_TREATMENT,
  GET_ALL_ENCLOSURES,
  GET_SITES_LIST_CLUSTER_WISE,
  ADD_CLUSTER,
  EDIT_CLUSTER,
  DELETE_CLUSTER,
  ASSIGN_SITES_FOR_CLUSTER,
  ADD_SECTION,
  EDIT_SECTION,
  DELETE_SECTION,
  CREATE_SITE,
  EDIT_SITE,
  DELETE_SITE,
  ADD_ENCLOSURE_TO_HOUSING,
  EDIT_ENCLOSURE,
  DELETE_ENCLOSURE,
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
  ANIMAL_JOURNAL_MODULES,
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
  GET_FAMILY_TREE_LITTER_LIST,
  GET_FAMILY_TREE_OFFSPRING_STATS,
  DELETE_FAMILY_TREE_OFFSPRINGS,
  ADD_FAMILY_TREE_OFFSPRING,
  GET_FETUS_STATS,
  GET_FETUS_LIST,
  GET_FETUS_DETAILS,
  GET_CLUTCH_DETAILS,
  GET_CLUTCH_EGG_LIST,
  EGG,
  GET_EGG_PARENT_DETAILS,
  GET_EGG_HISTORY,
  EGG_ADD_COMMENT,
  EGG_UPLOAD_IMAGES,
  EGG_STATUS_MASTER_DATA,
  EGG_STATUS_UPDATE,
  EGG_GET_MEDIA_LIST
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
  GetAnimalJournalModulesParams,
  GetAnimalJournalModulesResponse,
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
import {
  OffspringStatsPayload,
  OffspringStatsResponse,
  DeleteOffspringPayload,
  DeleteOffspringResponse,
  AddOffspringPayload,
  AddOffspringResponse,
  FetusStatsPayload,
  FetusStatsResponse,
  GetFetusPayload,
  GetFetusResponse
} from 'src/types/housing/animalsOffspring'
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

// Edit Site - matches mobile API: zoos/editzoosite
export interface EditSitePayload {
  zoo_id: number
  site_id: number
  site_name: string
  site_description?: string
  site_latitude?: string
  site_longitude?: string
  site_image?: File[]
}

export interface EditSiteResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function editSite(params: EditSitePayload): Promise<EditSiteResponse> {
  const response = await axiosFormPost({ url: `${EDIT_SITE}`, body: params })

  return response.data
}

// Delete Site - matches mobile API: zoos/deletezoosite
export interface DeleteSiteParams {
  site_id: number
}

export interface DeleteSiteResponse {
  success?: boolean
  message?: string
}

export async function deleteSite(params: DeleteSiteParams): Promise<DeleteSiteResponse> {
  const response = await axiosGet({ url: `${DELETE_SITE}`, params })

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

// Edit Section - matches mobile API: zoos/editsection
export interface EditSectionPayload {
  section_id: number
  section_name: string
  section_site_id: number
  section_latitude?: string
  section_longitude?: string
  section_image?: File[]
}

export interface EditSectionResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function editSection(params: EditSectionPayload): Promise<EditSectionResponse> {
  const response = await axiosFormPost({ url: `${EDIT_SECTION}`, body: params })

  return response?.data
}

// Delete Section - matches mobile API: zoos/deletesection
export interface DeleteSectionParams {
  section_id: number
}

export interface DeleteSectionResponse {
  success?: boolean
  message?: string
}

export async function deleteSection(params: DeleteSectionParams): Promise<DeleteSectionResponse> {
  const response = await axiosGet({ url: `${DELETE_SECTION}`, params })

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

// ==================== Enclosure Basic Info API ====================
// Matches mobile API: enclosure/get-enclosure-basic-info?enclosure_id=

export interface EnclosureBasicInfo {
  enclosure_id?: number
  user_enclosure_name?: string
  parent_enclosure_name?: string
  section_name?: string
  site_name?: string
  enclosure_type?: string
  enclosure_type_id?: number | string
  enclosure_sunlight?: string
  enclosure_environment?: string
  enclosure_is_movable?: string | number
  enclosure_is_walkable?: string | number
  enclosure_desc?: string
  created_at?: string
  updated_at?: string
}

export interface GetEnclosureBasicInfoParams {
  enclosure_id: number
}

export interface GetEnclosureBasicInfoResponse {
  success?: boolean
  message?: string
  data?: EnclosureBasicInfo
}

export async function getEnclosureBasicInfo(
  params: GetEnclosureBasicInfoParams
): Promise<GetEnclosureBasicInfoResponse> {
  const response = await axiosGet({
    url: `${GET_ENCLOSURE_BASIC_INFO}`,
    params: { enclosure_id: params.enclosure_id }
  })

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

// Edit Enclosure - matches mobile API: enclosure/update-enclosure
export interface EditEnclosurePayload {
  enclosure_id: number
  user_enclosure_name: string
  section_id: number | string
  enclosure_desc?: string
  enclosure_environment?: string
  user_enclosure_id?: string
  enclosure_is_movable?: number
  enclosure_is_walkable?: number
  enclosure_type?: string
  enclosure_sunlight?: string
  enclosure_parent_id?: number | string | null
  enclosure_lat?: string
  enclosure_long?: string
  commistioned_date?: string
  enclosure_status?: string
  enclosure_code?: string
  enclosure_image?: File[]
}

export interface EditEnclosureResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function editEnclosure(params: EditEnclosurePayload): Promise<EditEnclosureResponse> {
  const response = await axiosFormPost({ url: `${EDIT_ENCLOSURE}`, body: params })

  return response?.data
}

// Delete Enclosure - matches mobile API: enclosure/remove
export interface DeleteEnclosureParams {
  enclosure_id: number
}

export interface DeleteEnclosureResponse {
  success?: boolean
  message?: string
}

export async function deleteEnclosure(params: DeleteEnclosureParams): Promise<DeleteEnclosureResponse> {
  const response = await axiosPost({ url: `${DELETE_ENCLOSURE}`, body: params })

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

// Add Media for Site/Section/Enclosure - matches mobile API: zoos/all-type-add-media
export interface AddMediaPayload {
  ref_id: number | string
  ref_type: 'site' | 'section' | 'enclosure'
  access_restricted_key?: number  // 0 = public, 1 = restricted
  media_attachment: File[]
}

export interface AddMediaResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function addMedia(formData: FormData): Promise<AddMediaResponse> {
  const response = await axiosFormPost({ url: `${ADD_MEDIA}`, body: formData })

  return response?.data
}

// Add Media for Animals - matches mobile API: animal/add-media
// Note: Mobile uses 'acess_restricted_key' (typo preserved for API compatibility)
export interface AddAnimalMediaPayload {
  animal_id: number | string
  acess_restricted_key?: number  // 0 = public, 1 = restricted (mobile typo)
  media_attachment: File[]
}

export async function addAnimalMedia(formData: FormData): Promise<AddMediaResponse> {
  const response = await axiosFormPost({ url: `${ADD_ANIMAL_MEDIA}`, body: formData })

  return response?.data
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

// Edit Cluster - matches mobile API: cluster/edit-cluster
export interface EditClusterPayload {
  cluster_id: number
  cluster_name: string
  cluster_desc?: string
  cluster_image?: File[]
}

export interface EditClusterResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function editCluster(params: EditClusterPayload): Promise<EditClusterResponse> {
  const response = await axiosFormPost({ url: `${EDIT_CLUSTER}`, body: params })

  return response?.data
}

// Delete Cluster - matches mobile API: cluster/delete-cluster
export interface DeleteClusterParams {
  cluster_id: number
}

export interface DeleteClusterResponse {
  success?: boolean
  message?: string
}

export async function deleteCluster(params: DeleteClusterParams): Promise<DeleteClusterResponse> {
  const response = await axiosPost({ url: `${DELETE_CLUSTER}`, body: params })

  return response?.data
}

// Get available sites for cluster assignment - matches mobile API: cluster/get-site-list-for-cluster-assign
export interface GetAvailableSitesForClusterParams {
  cluster_id: number
  q?: string
  page_no?: number
  limit?: number
}

export interface AvailableSiteItem {
  site_id: number
  site_name: string
  site_description?: string
  images?: Array<{ file?: string; display_type?: string }>
  incharge_name?: string
  incharge_image?: string
  is_assigned?: boolean | number
}

export interface GetAvailableSitesForClusterResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AvailableSiteItem[]
    total_count?: number
  }
}

export async function getAvailableSitesForCluster(
  params: GetAvailableSitesForClusterParams
): Promise<GetAvailableSitesForClusterResponse> {
  const response = await axiosGet({ url: `${GET_SITES_LIST_CLUSTER_WISE}`, params })

  return response?.data
}

// Assign/Remove sites from cluster - matches mobile API: cluster/assign-sites-for-cluster
export interface AssignSitesToClusterPayload {
  cluster_id: number
  cluster_sites: string | number[]  // JSON string or array of site_ids
  will_add: number  // 1 = add, 0 = remove
}

export interface AssignSitesToClusterResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export async function assignSitesToCluster(payload: AssignSitesToClusterPayload): Promise<AssignSitesToClusterResponse> {
  // Format cluster_sites as JSON string if it's an array (matching mobile behavior)
  const body = {
    cluster_id: payload.cluster_id,
    cluster_sites: Array.isArray(payload.cluster_sites)
      ? JSON.stringify(payload.cluster_sites)
      : payload.cluster_sites,
    will_add: payload.will_add
  }
  const response = await axiosPost({ url: `${ASSIGN_SITES_FOR_CLUSTER}`, body })

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

// ==================== User API ====================

export async function getAllUsers(params?: GetUsersListParams): Promise<GetUsersListResponse> {
  const response = await axiosGet({ url: `${GET_ALL_USERS}`, params })

  return response?.data
}

// Get users list using POST method (matches mobile implementation for notes filters)
export interface GetUserListPostParams {
  zoo_id?: number
  isActive?: boolean
  role_id?: string | number  // Filter by role ID (comma-separated for multiple)
  site_id?: string | number  // Filter by site ID (comma-separated for multiple)
  q?: string                 // Search query
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
  q?: string
  page_no?: number
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
  show_checklist_button?: boolean

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
  // Section level graph fields
  site_percentage?: string | number
  total_site_wastage?: string | number
  // Enclosure level graph fields
  section_percentage?: string | number
  total_section_wastage?: string | number
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

// ==================== Observation Templates API ====================
// For managing notify member groups/templates (matching mobile implementation)

import {
  OBSERVATION_TEMPLATE_LIST,
  OBSERVATION_TEMPLATE_CREATE,
  OBSERVATION_TEMPLATE_UPDATE,
  OBSERVATION_TEMPLATE_DELETE
} from 'src/constants/ApiConstant'

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

export async function getObservationTemplates(params: GetObservationTemplatesParams): Promise<GetObservationTemplatesResponse> {
  const response = await axiosGet({ url: OBSERVATION_TEMPLATE_LIST, params })

  return response?.data
}

export interface CreateObservationTemplatePayload {
  zooID: number
  template_name: string
  template_type: string
  template_items: string  // JSON string of user_ids
  template_sub_type?: number
  is_default?: number
  status?: number
}

export interface CreateObservationTemplateResponse {
  success?: boolean
  message?: string
  data?: ObservationTemplate
}

export async function createObservationTemplate(payload: CreateObservationTemplatePayload): Promise<CreateObservationTemplateResponse> {
  const response = await axiosPost({ url: OBSERVATION_TEMPLATE_CREATE, body: payload })

  return response?.data
}

export interface UpdateObservationTemplatePayload {
  template_name?: string
  template_items?: string  // JSON string of user_ids
  is_default?: number
  status?: number
}

export interface UpdateObservationTemplateResponse {
  success?: boolean
  message?: string
  data?: ObservationTemplate
}

export async function updateObservationTemplate(
  id: number,
  payload: UpdateObservationTemplatePayload
): Promise<UpdateObservationTemplateResponse> {
  const response = await axiosPost({ url: `${OBSERVATION_TEMPLATE_UPDATE}/${id}`, body: payload })

  return response?.data
}

export interface DeleteObservationTemplateResponse {
  success?: boolean
  message?: string
}

export async function deleteObservationTemplate(id: number): Promise<DeleteObservationTemplateResponse> {
  const response = await axiosPost({ url: `${OBSERVATION_TEMPLATE_DELETE}/${id}`, body: {} })

  return response?.data
}

export async function getOffspringStats(params: OffspringStatsPayload): Promise<OffspringStatsResponse> {
  try {
    const response = await axiosGet({ url: GET_FAMILY_TREE_OFFSPRING_STATS, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching offspring stats:', error?.message)
    throw error
  }
}

export async function deleteOffspring(params: DeleteOffspringPayload): Promise<DeleteOffspringResponse> {
  try {
    const response = await axiosPost({ url: DELETE_FAMILY_TREE_OFFSPRINGS, body: params })

    return response?.data
  } catch (error: any) {
    console.error('Error deleting offspring:', error?.message)
    throw error
  }
}

export async function addOffspring(params: AddOffspringPayload): Promise<AddOffspringResponse> {
  try {
    const response = await axiosFormPost({ url: ADD_FAMILY_TREE_OFFSPRING, body: params })

    return response?.data
  } catch (error: any) {
    console.error('Error adding offspring:', error?.message)
    throw error
  }
}

export async function getFetusStats(params: FetusStatsPayload): Promise<FetusStatsResponse> {
  try {
    const response = await axiosGet({ url: GET_FETUS_STATS, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching fetus stats:', error?.message)
    throw error
  }
}

export async function getFetusList(params: GetFetusPayload): Promise<GetFetusResponse> {
  try {
    const response = await axiosGet({ url: GET_FETUS_LIST, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching fetus list:', error?.message)
    throw error
  }
}
export async function getFetusDetails({ fetusId }: { fetusId: number }): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: `${GET_FETUS_DETAILS}/${fetusId}` })

  return response?.data
}

export async function getClutchDetails(params): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: { GET_CLUTCH_DETAILS }, body: params })

  return response?.data
}

export async function getClutchEggList(params): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: GET_CLUTCH_EGG_LIST, params })

  return response?.data
}

export async function getEggDetails({ eggId }: { eggId: number }): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: `${EGG}/${eggId}` })

  return response?.data
}

export async function getEggParentDetails({ eggId }: { eggId: number }): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: `${GET_EGG_PARENT_DETAILS}?egg_id=${eggId}` })

  return response?.data
}

export async function getEggHistory({ eggId }: { eggId: number }): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: `${GET_EGG_HISTORY}/${eggId}` })

  return response?.data
}

export async function eggAddComment(params: { egg_id: number; comments: string }): Promise<any> {
  const response = await axiosPost({ url: EGG_ADD_COMMENT, body: params })

  return response?.data
}

export async function eggUploadImages(formData: FormData): Promise<any> {
  const response = await axiosFormPost({ url: EGG_UPLOAD_IMAGES, body: formData })

  return response?.data
}

export async function getEggStatusMasterData(): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: EGG_STATUS_MASTER_DATA })

  return response?.data
}
export async function updateEggStatus(params): Promise<GetFetusResponse> {
  const response = await axiosPost({ url: EGG_STATUS_UPDATE, body: params })

  return response?.data
}

export async function getEggMediaList(params): Promise<GetFetusResponse> {
  const response = await axiosGet({ url: EGG_GET_MEDIA_LIST, params })

  return response?.data
}
