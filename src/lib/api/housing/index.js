import axios from 'axios'
import { axiosGet, axiosPost } from '../utility'
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
  GET_ALL_ENCLOSURES
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

export async function getAllEnclosures(params) {
  const response = await axiosGet({ url: `${GET_ALL_ENCLOSURES}`, params })

  return response.data
}

export async function getAllNotes(params) {
  const response = await axiosGet({ url: `${GET_ALL_NOTES}`, params })

  return response.data
}

export async function getAllSpeciesList(params) {
  const response = await axiosGet({ url: `${GET_ALL_SPECIES}`, params })

  return response.data
}

export async function getMortalityList(params) {
  const response = await axiosGet({ url: `${GET_MORTALITY}`, params })

  return response.data
}

export async function getAllMedia(params) {
  const response = await axiosGet({ url: `${GET_MEDIA}`, params })

  return response.data
}

export async function getAnimalTreatmentList(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL_TREATMENT}/${params?.site_id}`, params })

  return response.data
}

export async function getSectionAnalytics(body) {
  const response = await axiosPost({ url: `${SECTION_INSIGHTS}`, body: JSON.stringify(body) })

  return response.data
}

export async function getSectionAnimalTreatmentList(params) {
  const response = await axiosGet({ url: `${SECTION_GET_ANIMAL_TREATMENT}/${params?.section_id}`, params })

  return response.data
}

export async function getAllAnimalList(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL}`, params })

  return response.data
}

export async function getClusterList(params) {
  const response = await axiosGet({ url: `${GET_CLUSTERS_LIST}`, params })

  return response.data
}

export async function getSpecificClusterAnalytics(params) {
  const response = await axiosGet({ url: `${GET_SPECIFIC_CLUSTER_ANALYTICS}`, params })

  return response.data
}

export async function getEnclosureListSectionWise(params) {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_LIST_SECTION_WISE}`, params })

  return response.data
}

export async function getEnclosureWiseStat(params) {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_STATS}/${params?.enclosure_id}` })

  return response?.data
}

export async function getEnclosureWiseSpecies(params = {}, id) {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_WISE_SPECIES}/${id}`, params })

  return response?.data
}
