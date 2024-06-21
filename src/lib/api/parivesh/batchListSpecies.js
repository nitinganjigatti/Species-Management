import { BATCH_LIST_SPECIES, BATCH_LIST_SPECIES_BY_ID } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getBatchListSpecies({ params }) {
  const response = await axiosGet({ url: `${BATCH_LIST_SPECIES}`, params })

  return response.data
}

export async function getBatchListSpeciesById(id) {
  const response = await axiosGet({ url: `${BATCH_LIST_SPECIES_BY_ID}/${id}`, pharmacy: true })

  return response.data
}
