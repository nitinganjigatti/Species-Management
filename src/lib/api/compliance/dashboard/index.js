import {
  GET_COMPLIANCE_ANIMALS,
  GET_COMPLIANCE_DASHBOARD_ORGS,
  GET_COMPLIANCE_DASHBOARD_OVERALL,
  GET_COMPLIANCE_DASHBOARD_SITES,
  GET_COMPLIANCE_DASHBOARD_SPECIES
} from 'src/constants/ApiConstant'
import { axiosGet } from '../../utility'

export const getOverallStats = async () => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_OVERALL}/` })
  return response.data
}

export const getOrgsList = async params => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_ORGS}/`, params })
  return response.data
}

export const getOrgDetail = async id => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_ORGS}/${id}/` })
  return response.data
}

export const getOrgSpecies = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_ORGS}/${id}/species/`, params })
  return response.data
}

export const getOrgSites = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_ORGS}/${id}/sites/`, params })
  return response.data
}

export const getSitesList = async params => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SITES}/`, params })
  return response.data
}

export const getSiteDetail = async id => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SITES}/${id}/` })
  return response.data
}

export const getSiteOrgs = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SITES}/${id}/orgs/`, params })
  return response.data
}

export const getSiteSpecies = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SITES}/${id}/species/`, params })
  return response.data
}

export const getSpeciesList = async params => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SPECIES}/`, params })
  return response.data
}

export const getSpeciesDetail = async id => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SPECIES}/${id}/` })
  return response.data
}

export const getSpeciesOrgs = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SPECIES}/${id}/orgs/`, params })
  return response.data
}

export const getSpeciesSites = async (id, params) => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_DASHBOARD_SPECIES}/${id}/sites/`, params })
  return response.data
}

export const getComplianceAnimals = async params => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_ANIMALS}/`, params })
  return response.data
}
