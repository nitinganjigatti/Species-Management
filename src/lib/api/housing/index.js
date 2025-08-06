import axios from 'axios'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'
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
  CARCASS_DEPOSITION
} from 'src/constants/ApiConstant'

export async function getSiteAnalytics(id) {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}

export async function AddNewSite(params) {
  const response = await axiosFormPost({ url: `${CREATE_SITE}`, body: params })

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

export async function getSiteListClusterWise(params) {
  const response = await axiosGet({ url: `${GET_SITES_LIST_CLUSTER_WISE}`, params })

  return response?.data
}

export async function addCluster(params) {
  const response = await axiosFormPost({ url: `${ADD_CLUSTER}`, body: params })

  return response?.data
}

export async function addSection(params) {
  const response = await axiosFormPost({ url: `${ADD_SECTION}`, body: params })

  return response?.data
}

export async function addEnclosureToHousing(params) {
  const response = await axiosFormPost({ url: `${ADD_ENCLOSURE_TO_HOUSING}`, body: params })

  return response?.data
}

export async function getEnclosureSetting(params) {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_SETTINGS}`, params })

  return response?.data
}

export async function getSectionsListingForEnclosure(params) {
  const response = await axiosPost({ url: `${GET_SECTION_FOR_ENCLOSURE}`, body: params })

  return response?.data
}

export async function getParentEnclosureList(params) {
  const respponse = await axiosPost({ url: `${GET_PARENT_ENCLOSURE}`, body: params })

  return respponse?.data
}

export async function getAnimalDetailsOverview(params) {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_OVERVIEW}`, params })

  return response?.data
}

export async function getAnimalIncidentList(animalId) {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_INCIDENT_LIST}/${animalId}` })

  return response?.data
}

export async function getAnimalIncidentDetails(animalId) {
  const response = await axiosGet({ url: `${ANIMAL_INCIDENT_DETAILS}/${animalId}` })

  return response?.data
}

export async function createAnimalIncident(animalId) {
  const response = await axiosPost({ url: `${ANIMAL_CREATE_INCIDENT}/${animalId}`, body: params })

  return response?.data
}

export async function updateAnimalIncident(params) {
  const response = await axiosPost({ url: `${ANIMAL_UPDATE_INCIDENT}`, body: params })

  return response?.data
}

export async function getAnimalIdentifier(params) {
  const response = await axiosGet({ url: `${ANIMAL_DETAILS_IDENTIFIER_LIST}`, params })

  return response?.data
}

export async function addAnimalIdentifier(params) {
  const response = await axiosPost({ url: `${ADD_ANIMAL_IDENTIFIER}`, body: params })

  return response?.data
}

export async function editAnimalIdentifier(params) {
  const response = await axiosPost({ url: `${EDIT_ANIMAL_IDENTIFIER}`, body: params })

  return response?.data
}

export async function deleteAnimalIdentifier(params) {
  const response = await axiosGet({ url: `${DELETE_ANIMAL_IDENTIFIER}`, params })

  return response?.data
}

export async function getAnimalMortalityReport(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL_MORTALITY}`, params })

  return response?.data
}

export async function editAnimalMortalityReport(params) {
  const response = await axiosPost({ url: `${EDIT_ANIMAL_MORTALITY}`, body: params })

  return response?.data
}

export async function revokeAnimalMortality(params) {
  const response = await axiosPost({ url: `${REVOKE_ANIMAL_MORTALITY}`, body: params })

  return response?.data
}

export async function getMannerOfDeath(params) {
  const response = await axiosGet({ url: `${MANNER_OF_DEATH}`, params })

  return response?.data
}

export async function getCarcassCondition(params) {
  const response = await axiosGet({ url: `${CARCASS_CONDITION}`, params })

  return response?.data
}

export async function getCarcassDeposition(params) {
  const response = await axiosGet({ url: `${CARCASS_DEPOSITION}`, params })

  return response?.data
}