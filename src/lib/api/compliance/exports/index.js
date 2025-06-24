import {
  ADD_DOCUMENT,
  ADD_EXPORT,
  EDIT_DOCUMENT,
  EDIT_EXPORT,
  GET_DOCUMENT_TYPE,
  GET_EXPORTS_DETAILS,
  GET_EXPORTS_LIST,
  GET_SPECIES_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export const getExportCountries = async () => {
  return {
    success: true,
    data: [
      { label: 'Country 1', value: 'report' },
      { label: 'Country 2', value: 'invoice' },
      { label: 'Country 3', value: 'manifest' }
    ]
  }
}

export const getSpecies = async () => {
  return {
    success: true,
    data: [
      { label: 'Species 1', value: 'report' },
      { label: 'Species 2', value: 'invoice' },
      { label: 'Species 3', value: 'manifest' }
    ]
  }
}

export async function getSpeciesList(params) {
  const response = await axiosGet({ url: `${GET_SPECIES_LIST}`, params })

  return response.data
}

export const getExportList = async params => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_LIST}`,
    params
  })

  return response.data
}

export const getExportDetails = async id => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_DETAILS}/${id}`
  })

  return response.data
}

export async function addExport(payload) {
  try {
    const url = `${ADD_EXPORT}`
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

export async function updateExport(id, payload) {
  try {
    const url = `${EDIT_EXPORT}/${id}`
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

export const getDocumentTypeList = async params => {
  const response = await axiosGet({
    url: `${GET_DOCUMENT_TYPE}`,
    params
  })

  return response.data
}

export async function addDocument(payload) {
  try {
    const url = `${ADD_DOCUMENT}`
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

export async function updateDocument(id, payload) {
  try {
    const url = `${EDIT_DOCUMENT}/${id}`
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
