// Food Wastage shared types and unified API - used across site, section, enclosure pages
import { axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import {
  GET_ENCLOSURE_FOOD_WASTAGE,
  GET_FOOD_WASTAGE_DETAILS
} from 'src/constants/housing/enclosureConstants'

import type {
  FoodWastageListItem,
  FoodWastageHighestWastage,
  FoodWastageGraphEntry,
  FoodWastageGraphItem,
  FoodWastageData,
  GetFoodWastageParams,
  GetFoodWastageResponse,
  FoodWastageDetailItem,
  FoodWastageDetailsData,
  GetFoodWastageDetailsParams,
  GetFoodWastageDetailsResponse
} from 'src/types/housing/api/foodWastage'

export type {
  FoodWastageListItem,
  FoodWastageHighestWastage,
  FoodWastageGraphEntry,
  FoodWastageGraphItem,
  FoodWastageData,
  GetFoodWastageParams,
  GetFoodWastageResponse,
  FoodWastageDetailItem,
  FoodWastageDetailsData,
  GetFoodWastageDetailsParams,
  GetFoodWastageDetailsResponse
}

// ==================== Enclosure Food Wastage API ====================

export async function getEnclosureFoodWastage(params: GetFoodWastageParams): Promise<GetFoodWastageResponse> {
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
    const { getSectionFoodWastage } = await import('./section')

    return getSectionFoodWastage(params)
  }
  if (refType === 'enclosure') {
    return getEnclosureFoodWastage(params)
  }
  const { getSiteFoodWastage } = await import('./site')

  return getSiteFoodWastage(params)
}

// ==================== Food Wastage Details API ====================

export async function getFoodWastageDetails(params: GetFoodWastageDetailsParams): Promise<GetFoodWastageDetailsResponse> {
  const response = await axiosGet({ url: `${GET_FOOD_WASTAGE_DETAILS}`, params })

  return response?.data
}
