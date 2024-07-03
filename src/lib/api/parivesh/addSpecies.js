import {
  ADD_SPECIES,
  ADD_SPECIES_TO_ORG,
  DELETE_SPECIES_TO_ORG,
  LIST_ALL_SPECIES_SEARCH,
  ORGANIZATION_LIST,
  SEARCH_MASTER_LIST_SPECIES,
  SPECIES_LIST,
  SPECIES_LIST_BY_ORG,
  UPDATE_SPECIES_TO_ORG
} from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addSpecies(payload) {
  try {
    const url = `${ADD_SPECIES}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getListAllSpeciesSearch({ params }) {
  const response = await axiosGet({ url: `${LIST_ALL_SPECIES_SEARCH}`, params })

  return response.data
}

export async function getOrganizationList({ params }) {
  const response = await axiosGet({ url: `${ORGANIZATION_LIST}`, params })

  return response.data
}

export async function getSpeciesListByOrg({ params }) {
  const response = await axiosGet({ url: `${SPECIES_LIST_BY_ORG}`, params })

  return response.data
}

export async function addSpeciesToOrganization(payload) {
  try {
    const url = `${ADD_SPECIES_TO_ORG}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function updateSpeciesToOrganization(payload, id) {
  try {
    const url = `${UPDATE_SPECIES_TO_ORG}/${id}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
export async function deleteSpeciesToOrganization(id, payload) {
  try {
    const url = `${DELETE_SPECIES_TO_ORG}/${id}`
    const response = await axiosFormPost({ url: url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getSearchLMasterListSpecies({ params }) {
  const response = await axiosGet({ url: `${SEARCH_MASTER_LIST_SPECIES}`, params })

  return response.data
}
