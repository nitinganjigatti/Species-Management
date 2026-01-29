import {
  NECROPSY_LISTING,
  NECROPSY_DETAIL,
  GET_ANIMAL_WISE_NECROPSY_LIST,
  GET_SPECIES_WISE_NECROPSY_LIST,
  GET_NECROPSY_STATS
} from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getNecropsyListing(params, userId) {
  try {
    const url = `${NECROPSY_LISTING}/${userId}/necropsy_centre`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching necropsy listing:', error.message)
  }
}

export async function getAnimalWiseNecropsyList(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL_WISE_NECROPSY_LIST}`, params: params })

  return response?.data
}

export async function getSpeciesWiseNecropsyList(params) {
  const response = await axiosGet({ url: `${GET_SPECIES_WISE_NECROPSY_LIST}`, params: params })

  return response?.data
}

export async function getNecropsyStats(params) {
  const response = await axiosGet({ url: `${GET_NECROPSY_STATS}`, params: params })

  return response?.data
}
