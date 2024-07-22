import { axiosGet } from '../../utility'
import {
  EGG,
  COUNT_GET_BY_SPECIES,
  LIST_GET_BY_SPECIES,
  EGG_STATUS_LIST,
  SPECIES_WISE_DETAILS
} from 'src/constants/ApiConstant'

export async function GetSpeciesDetails(id) {
  const response = await axiosGet({
    url: `${EGG}/${COUNT_GET_BY_SPECIES}?species_id=${id}`
  })

  return response.data
}

export async function GetSpeciesList({ params }) {
  const response = await axiosGet({ url: `${EGG}/${LIST_GET_BY_SPECIES}`, params: params })

  return response.data
}

export async function GetEggStatusList({ params }) {
  const response = await axiosGet({ url: `${EGG}/${EGG_STATUS_LIST}`, params: params })

  return response.data
}

export async function GetSectionList({ params }) {
  const response = await axiosGet({ url: `${SPECIES_WISE_DETAILS}`, params: params })

  return response.data
}
