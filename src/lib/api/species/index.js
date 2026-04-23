import { TAXONOMY_URL, SPECIES_BASE_URL, Banner_URL, HYBRID_URL } from 'src/constants/notes/constants'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'
import {
  ADD_TAXONOMY_SPECIES,
  GET_DYNAMIC_SPECIES_FORMDATA,
  GET_TAXONOMY_LIST_BY_TYPES
} from 'src/constants/ApiConstant'

export async function addSpecies(params) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}/add`, body: params, pharmacy: true })

  return response.data
}

export async function addBreed(params) {
  const response = await axiosFormPost({ url: `${HYBRID_URL}/breed`, body: params, pharmacy: true })

  return response.data
}

export async function getBreed(id) {
  const response = await axiosGet({
    url: `${HYBRID_URL}subtaxon?taxonomy_id=${id}&sub_taxon_type=breed`,
    pharmacy: true
  })

  return response.data
}

export async function addHybrid(params) {
  const response = await axiosFormPost({ url: `${HYBRID_URL}/hybrid`, body: params, pharmacy: true })

  return response.data
}

export async function getSpeciesList(params) {
  const response = await axiosPost({ url: `${SPECIES_BASE_URL}/list`, body: params, pharmacy: true })

  return response.data
}

export async function getMutationList() {
  const response = await axiosGet({
    url: `${HYBRID_URL}subtaxon?sub_taxon_type=morph`,
    pharmacy: true
  })

  return response.data
}

export async function getLocalityList() {
  const response = await axiosGet({
    url: `${HYBRID_URL}subtaxon?sub_taxon_type=locality`,
    pharmacy: true
  })

  return response.data
}

export async function addMutation(params) {
  const response = await axiosFormPost({ url: `${HYBRID_URL}/morph`, body: params, pharmacy: true })
  return response.data
}

export async function getMutationById(id) {
  const response = await axiosGet({
    url: `${HYBRID_URL}subtaxon?taxonomy_id=${id}&sub_taxon_type=morph`,
    pharmacy: true
  })

  return response.data
}

export async function getLocalityById(id) {
  const response = await axiosGet({
    url: `${HYBRID_URL}subtaxon?taxonomy_id=${id}&sub_taxon_type=locality`,
    pharmacy: true
  })

  return response.data
}

export async function getSearchTaxonomyList(params) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}search`, params, pharmacy: true })

  return response.data
}

export async function addLocality(params) {
  const response = await axiosFormPost({ url: `${HYBRID_URL}/locality`, body: params, pharmacy: true })

  return response.data
}

export async function getSpeciesVernacularData(params) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}/vernacular?tsn=${params}`, pharmacy: true })

  return response.data
}
export async function getSpeciesVernacularDataList(params) {
  const response = await axiosGet({ url: `${TAXONOMY_URL}zoo/vernacular/${params}`, pharmacy: true })

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
  const response = await axiosGet({ url: `${Banner_URL}?tsn_id=${id}`, pharmacy: true })

  return response.data
}

export async function DeleteBannerById(params) {
  const response = await axiosFormPost({ url: `/master/banner/delete`, body: params, pharmacy: true })

  return response?.data
}

export async function DeleteType(params) {
  const response = await axiosFormPost({ url: `${HYBRID_URL}/delete/mapping`, body: params, pharmacy: true })

  return response?.data
}

export async function UpdateSpecies(payload, id) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}edit/${id}`, body: payload, pharmacy: true })

  return response.data
}

export async function UpdateSpeciesWithAdditionInfo(payload, id) {
  const response = await axiosFormPost({
    url: `${TAXONOMY_URL}edit/${id}`,
    body: payload,
    pharmacy: true
  })
  return response.data
}

export async function UpdateHybrid(payload, id) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}edit/${id}`, body: payload, pharmacy: true })

  return response.data
}
export async function UpdateHybridSpecies(payload, id) {
  const response = await axiosFormPost({ url: `${TAXONOMY_URL}hybrid/edit/${id}`, body: payload, pharmacy: true })

  return response.data
}

export async function getTaxonomyListByType(params) {
  const response = await axiosGet({ url: `${GET_TAXONOMY_LIST_BY_TYPES}`, params, pharmacy: true })

  return response.data
}

export async function addTaxonomySpecies(params) {
  const response = await axiosPost({ url: `${ADD_TAXONOMY_SPECIES}`, body: params, pharmacy: true })
  return response.data
}

export async function getDynamicFormData(params) {
  const response = await axiosGet({ url: `${GET_DYNAMIC_SPECIES_FORMDATA}`, params, pharmacy: true })

  return response.data
}

getDynamicFormData
