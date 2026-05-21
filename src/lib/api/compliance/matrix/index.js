import {
  GET_COMPLIANCE_SPECIES_MATRIX,
  GET_COMPLIANCE_SPECIES_BREAKDOWN,
  GET_COMPLIANCE_SNAPSHOT,
  GET_COMPLIANCE_SPECIES_SEARCH,
  POST_COMPLIANCE_SPECIES_UPDATE,
  POST_COMPLIANCE_REALLOCATE,
  POST_COMPLIANCE_REVIEW_FLAGS
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export const getSpeciesMatrix = async params => {
  const response = await axiosGet({ url: `${GET_COMPLIANCE_SPECIES_MATRIX}/`, params })
  return response.data
}

export const getSpeciesBreakdown = async ({ taxonomy_id }) => {
  const response = await axiosGet({
    url: `${GET_COMPLIANCE_SPECIES_BREAKDOWN}/`,
    params: { taxonomy_id }
  })
  return response.data
}

export const getSnapshot = async ({ taxonomy_id, site_id }) => {
  const response = await axiosGet({
    url: `${GET_COMPLIANCE_SNAPSHOT}/`,
    params: { taxonomy_id, site_id }
  })
  return response.data
}

export const searchComplianceSpecies = async ({ q, limit = 10 }) => {
  const response = await axiosGet({
    url: `${GET_COMPLIANCE_SPECIES_SEARCH}/`,
    params: { q, limit }
  })
  return response.data
}

export const updateComplianceSpecies = async ({ compliance_species_id, body }) => {
  const response = await axiosPost({
    url: `${POST_COMPLIANCE_SPECIES_UPDATE}/${compliance_species_id}/`,
    body
  })
  return response.data
}

export const reallocate = async body => {
  const response = await axiosPost({ url: `${POST_COMPLIANCE_REALLOCATE}/`, body })
  return response.data
}

export const createReviewFlag = async body => {
  const response = await axiosPost({ url: `${POST_COMPLIANCE_REVIEW_FLAGS}`, body })
  return response.data
}

export const clearReviewFlag = async ({ flag_id, cleared_note }) => {
  const response = await axiosPost({
    url: `${POST_COMPLIANCE_REVIEW_FLAGS}/${flag_id}/clear`,
    body: cleared_note ? { cleared_note } : {}
  })
  return response.data
}
