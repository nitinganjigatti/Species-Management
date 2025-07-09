import {
  ADD_DOCUMENT,
  ADD_EXPORT,
  EDIT_DOCUMENT,
  EDIT_EXPORT,
  GET_DOCUMENT_TYPE,
  GET_EXPORTS_DETAILS,
  GET_SHIPMENTS_LIST,
  ADD_SHIPMENT_BASICDETAILS,
  UPDATE_SHIPMENT_BASICDETAILS,
  GET_SHIPMENT_BASICDETAILS,
  GET_EXPORT_ANIMAL_LIST,
  CREATE_SHIPMENT_SPECIES,
  UPDATE_SHIPMENT_SPECIES,
  GET_SHIPMENT_SPECIES_DATA
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export const getShipmentList = async params => {
  const response = await axiosGet({
    url: `${GET_SHIPMENTS_LIST}`,
    params
  })

  return response.data
}

export async function addShipmentBasicDetails(payload) {
  try {
    const url = `${ADD_SHIPMENT_BASICDETAILS}`
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

export async function updateShipmentBasicDetails(id, payload) {
  try {
    const url = `${UPDATE_SHIPMENT_BASICDETAILS}/${id}`
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

export const getShipmentBasicDetails = async (id, params) => {
  const response = await axiosGet({
    url: `${GET_SHIPMENT_BASICDETAILS}/${id}`,
    params
  })

  return response.data
}

export const getExportAnimalList = async id => {
  const response = await axiosGet({
    url: `${GET_EXPORT_ANIMAL_LIST}/${id}`
  })

  return response.data
}

export async function createShipmentSpecies(id, payload) {
  try {
    const url = `${CREATE_SHIPMENT_SPECIES}/${id}`
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

export const getShipmentSpeciesData = async (id, params) => {
  const response = await axiosGet({
    url: `${GET_SHIPMENT_SPECIES_DATA}/${id}`,
    params
  })

  return response.data
}

export async function updateShipmentSpecies(id, payload) {
  try {
    const url = `${UPDATE_SHIPMENT_SPECIES}/${id}`
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
