import { TAXONOMY_URL, SPECIES_BASE_URL } from "src/constants/notes/constants"
import {  axiosFormPost, axiosGet, axiosPost } from "../utility"



export async function addSpecies(params){
  const response = await axiosFormPost({url: `${TAXONOMY_URL}/add` , body: params , pharmacy:true})

  return response.data
}


export async function getSpeciesList(params) {
    const response = await axiosPost({ url: `${SPECIES_BASE_URL}/list` ,body: params,pharmacy:true })

    return response.data
}

export async function getSearchTaxonomyList(params){
  const response = await axiosGet({url: `${TAXONOMY_URL}/search?q=${params}` , pharmacy:true})

  return response.data
}

export async function getSpeciesVernacularData(params){
  
  const response = await axiosGet({url:`${TAXONOMY_URL}/vernacular?tsn=${params}`, pharmacy:true})

  return response.data
}