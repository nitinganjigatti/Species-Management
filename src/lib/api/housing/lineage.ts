// Lineage / Family Tree APIs - used by: animals/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
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
  GET_CLUTCH_EGG_LIST,
  EGG,
  GET_EGG_PARENT_DETAILS,
  GET_EGG_HISTORY,
  EGG_ADD_COMMENT,
  EGG_UPLOAD_IMAGES,
  EGG_STATUS_MASTER_DATA,
  EGG_STATUS_UPDATE,
  EGG_GET_MEDIA_LIST
} from 'src/constants/housing/lineageConstants'

import type {
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

import {
  OffspringStatsPayload,
  OffspringStatsResponse,
  DeleteOffspringPayload,
  DeleteOffspringResponse,
  AddOffspringPayload,
  AddOffspringResponse,
  FetusStatsPayload,
  FetusStatsResponse,
  GetFetusListResponse,
  GetFetusPayload,
  GetFetusResponse,
  GetClutchEggListPayload,
  GetClutchEggListResponse,
  GetEggDetailsResponse,
  GetEggParentDetailsResponse,
  GetEggHistoryResponse,
  UpdateEggStatusPayload,
  GetEggMediaListPayload
} from 'src/types/housing/animalsOffspring'

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

// ==================== Offspring API ====================

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
    const response = await axiosFormPost({ url: DELETE_FAMILY_TREE_OFFSPRINGS, body: params })

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

// ==================== Fetus API ====================

export async function getFetusStats(params: FetusStatsPayload): Promise<FetusStatsResponse> {
  try {
    const response = await axiosGet({ url: GET_FETUS_STATS, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching fetus stats:', error?.message)
    throw error
  }
}

export async function getFetusList(params: GetFetusPayload): Promise<GetFetusListResponse> {
  try {
    const response = await axiosGet({ url: GET_FETUS_LIST, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching fetus list:', error?.message)
    throw error
  }
}

export async function getFetusDetails({ fetusId }: { fetusId: number }): Promise<any> {
  try {
    const response = await axiosGet({ url: `${GET_FETUS_DETAILS}/${fetusId}` })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching fetus details:', error?.message)
    throw error
  }
}

// ==================== Clutch / Egg API ====================

export async function getClutchEggList(params: GetClutchEggListPayload): Promise<GetClutchEggListResponse> {
  try {
    const response = await axiosGet({ url: GET_CLUTCH_EGG_LIST, params })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching clutch egg list:', error?.message)
    throw error
  }
}

export async function getEggDetails({ eggId }: { eggId: number }): Promise<GetEggDetailsResponse> {
  try {
    const response = await axiosGet({ url: `${EGG}/${eggId}` })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching egg details:', error?.message)
    throw error
  }
}

export async function getEggParentDetails({ eggId }: { eggId: number }): Promise<GetEggParentDetailsResponse> {
  try {
    const response = await axiosGet({ url: `${GET_EGG_PARENT_DETAILS}?egg_id=${eggId}` })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching egg parent details:', error?.message)
    throw error
  }
}

export async function getEggHistory({ eggId }: { eggId: number }): Promise<GetEggHistoryResponse> {
  try {
    const response = await axiosGet({ url: `${GET_EGG_HISTORY}/${eggId}` })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching egg history:', error?.message)
    throw error
  }
}

export async function eggAddComment(params: { egg_id: number; comments: string }): Promise<any> {
  try {
    const response = await axiosPost({ url: EGG_ADD_COMMENT, body: params })

    return response?.data
  } catch (error: any) {
    console.error('Error adding egg comment:', error?.message)
    throw error
  }
}

export async function eggUploadImages(formData: FormData): Promise<any> {
  const response = await axiosFormPost({ url: EGG_UPLOAD_IMAGES, body: formData })

  return response?.data
}

export async function getEggStatusMasterData(): Promise<any> {
  const response = await axiosGet({ url: EGG_STATUS_MASTER_DATA })

  return response?.data
}

export async function updateEggStatus(params: UpdateEggStatusPayload): Promise<any> {
  const response = await axiosPost({ url: EGG_STATUS_UPDATE, body: params })

  return response?.data
}

export async function getEggMediaList(params: GetEggMediaListPayload): Promise<any> {
  const response = await axiosGet({ url: EGG_GET_MEDIA_LIST, params })

  return response?.data
}
