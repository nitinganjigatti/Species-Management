// Section APIs - used by: sections/[id], sites/[id]
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ALL_SECTIONS,
  SECTION_INSIGHTS,
  ADD_SECTION,
  EDIT_SECTION,
  DELETE_SECTION,
  SECTION_GET_ANIMAL_TREATMENT,
  GET_SECTION_FOOD_WASTAGE
} from 'src/constants/housing/sectionConstants'

import type {
  GetSectionsParams,
  GetSectionsResponse,
  GetSectionAnalyticsPayload,
  GetSectionAnalyticsResponse,
  AddSectionPayload,
  AddSectionResponse,
  GetSectionAnimalTreatmentListParams,
  GetAnimalTreatmentListResponse,
  EditSectionPayload,
  EditSectionResponse,
  DeleteSectionParams,
  DeleteSectionResponse
} from 'src/types/housing'

import type { GetFoodWastageParams, GetFoodWastageResponse } from 'src/types/housing/api/foodWastage'

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

export async function editSection(params: EditSectionPayload): Promise<EditSectionResponse> {
  const response = await axiosFormPost({ url: `${EDIT_SECTION}`, body: params })

  return response?.data
}

export async function deleteSection(params: DeleteSectionParams): Promise<DeleteSectionResponse> {
  const response = await axiosGet({ url: `${DELETE_SECTION}`, params })

  return response?.data
}

// ==================== Section Treatment API ====================

export async function getSectionAnimalTreatmentList(
  params: GetSectionAnimalTreatmentListParams
): Promise<GetAnimalTreatmentListResponse> {
  const response = await axiosGet({ url: `${SECTION_GET_ANIMAL_TREATMENT}/${params?.section_id}`, params })

  return response.data
}

// ==================== Section Food Wastage API ====================

export async function getSectionFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
  const response = await axiosGet({ url: `${GET_SECTION_FOOD_WASTAGE}`, params })

  return response?.data
}
