import {
  GET_IMPORTS_LIST,
  GET_EXPORTS_LIST_FOR_IMPORTS,
  CREATE_IMPORTS_SPECIES,
  UPDATE_IMPORTS_SPECIES,
  GET_LINKED_DOCUMENTS_IMPORTS
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export const getImportsList = async params => {
  const response = await axiosGet({
    url: `${GET_IMPORTS_LIST}`,
    params
  })

  return response.data
}

export const getExportListForImports = async params => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_LIST_FOR_IMPORTS}`,
    params
  })

  return response.data
}

export async function createImportSpecies(payload) {
  try {
    const url = `${CREATE_IMPORTS_SPECIES}`
    const response = await axiosFormPost({ url, body: payload })

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

export const getImportSpeciesData = async (id, documentid, params) => {
  const response = await axiosGet({
    url: `${CREATE_IMPORTS_SPECIES}/${id}?document_type_id=${documentid}`,
    params
  })

  return response.data
}

export async function updateImportSpecies(id, payload) {
  try {
    const url = `${UPDATE_IMPORTS_SPECIES}/${id}`
    const response = await axiosFormPost({ url, body: payload })

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

export const getLinkedDocumentsImports = async id => {
  const response = await axiosGet({
    url: `${GET_LINKED_DOCUMENTS_IMPORTS}/${id}`
  })

  return response.data
}
