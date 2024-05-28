import { TAXONOMY_URL, SPECIES_BASE_URL, Banner_URL } from 'src/constants/notes/constants'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addSpecies(params) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}/add`, body: params, pharmacy: true })

  return response.data
}

export async function getSpeciesList(params) {
  const response = await axiosPost({ url: `${SPECIES_BASE_URL}/list`, body: params, pharmacy: true })

  return response.data
}

export async function getSearchTaxonomyList(params) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}/search?q=${params}`, pharmacy: true })

  return response.data
}

export async function getSpeciesVernacularData(params) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}/vernacular?tsn=${params}`, pharmacy: true })

  return response.data
}

export async function getVernacularSpeciesById(id) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}/zoo/vernacular/${id}`, pharmacy: true })
  return response.data
}

export async function UploadBannerImages(params) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}/bannerUpload`, body: params, pharmacy: true })
  return response.data
}

export async function GetBannerImages(id) {
  debugger
  const response = await axiosGet({ url: `${Banner_URL}?tsn_id=${id}`, pharmacy: true })
  return response.data
}

export async function DeleteBannerById(params) {
  const response = await axiosFormPost({ url: `/master/banner/delete`, body: params , pharmacy: true })

  return response?.data
}

export async function UpdateSpecies(payload, id) {
  debugger
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}/edit/${id}`, body: payload, pharmacy: true })
  return response.data
}
