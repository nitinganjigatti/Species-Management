import {
  ADD_SPECIES,
  ADD_SPECIES_TO_ORG,
  LIST_ALL_SPECIES_SEARCH,
  ORGANIZATION_LIST,
  SPECIES_LIST,
  SPECIES_LIST_BY_ORG
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

// i/v1/parivesh/species/org/add
