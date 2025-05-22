import { axiosGet } from '../utility'
import {
  GET_ALL_SECTIONS,
  GET_SITES,
  HOUSING_SITE_ANALYTICS,
  SITE_DETAILS,
  GET_ALL_NOTES,
  GET_ALL_SPECIES
} from 'src/constants/ApiConstant'

export async function getSiteAnalytics(id) {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}

export async function getAllSites(params) {
  const response = await axiosGet({ url: `${GET_SITES}`, params })

  return response.data
}

export async function getSpecificSiteAnalytics(params) {
  const response = await axiosGet({ url: `${SITE_DETAILS}`, params })

  return response.data
}

export async function getAllSections(params) {
  const response = await axiosGet({ url: `${GET_ALL_SECTIONS}`, params })

  return response.data
}

export async function getAllNotes(params) {
  const response = await axiosGet({ url: `${GET_ALL_NOTES}`, params })

  return response.data
}

export async function getAllSpeciesList(params){
  const response = await axiosGet({ url: `${GET_ALL_SPECIES}`, params })
  return response.data
}
