import {
  NECROPSY_LISTING,
  GET_ANIMAL_WISE_NECROPSY_LIST,
  GET_SPECIES_WISE_NECROPSY_LIST,
  GET_NECROPSY_STATS,
  GET_INCOMING_NECROPSY_CHECKLIST_DETAILS,
  GET_INCOMING_NECROPSY_TRANSFER_SUMMARY,
  CREATE_INCOMING_NECROPSY_SUMMARY_COMMENT,
  GET_INCOMING_NECROPSY_BTN_STATUS,
  UPDATE_TRANSFER_BTN_STATUS,
  GET_TRANSFER_ANIMAL_LIST,
  GET_NECROPSY_SUMMARY,
  ADD_NECROPSY,
  EDIT_NECROPSY,
  DELETE_NECROPSY,
  GET_NECROPSY_BODY_PARTS,
  GET_NECROPSY_TEMPLATE,
  CREATE_NECROPSY_TEMPLATE,
  UPDATE_NECROPSY_TEMPLATE,
  DELETE_NECROPSY_TEMPLATE,
  GET_NECROPSY_TIMELINE,
  GET_MORTALITY_SUMMARY,
  GET_MEDICAL_STATS,
  GET_NECROPSY_PDF,
  DELETE_NECROPSY_ATTACHMENT,
  MANNER_OF_DEATH,
  CARCASS_DEPOSITION,
  GET_NEW_INCOMING_PATIENTS_LISTS,
  MEASUREMENT_UNITS
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getNecropsyListing(params, userId) {
  try {
    const url = `${NECROPSY_LISTING}/${userId}/necropsy_centre`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching necropsy listing:', error.message)
  }
}

export async function getAnimalWiseNecropsyList(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL_WISE_NECROPSY_LIST}`, params: params })

  return response?.data
}

export async function getSpeciesWiseNecropsyList(params) {
  const response = await axiosGet({ url: `${GET_SPECIES_WISE_NECROPSY_LIST}`, params: params })

  return response?.data
}

export async function getNecropsyStats(params) {
  const response = await axiosGet({ url: `${GET_NECROPSY_STATS}`, params: params })

  return response?.data
}

export async function getIncomingNecropsyTransferSummary(params) {
  const response = await axiosGet({ url: `${GET_INCOMING_NECROPSY_TRANSFER_SUMMARY}`, params: params })

  return response?.data
}

export async function getIncomingNecropsyChecklistDetails(params, transferId) {
  const url = `${GET_INCOMING_NECROPSY_CHECKLIST_DETAILS}/${transferId}/activity`
  const response = await axiosGet({ url: url, params: params })

  return response?.data
}

export async function createIncomingNecropsySummaryComment(params) {
  const response = await axiosFormPost({ url: `${CREATE_INCOMING_NECROPSY_SUMMARY_COMMENT}`, body: params })

  return response?.data
}

export async function getIncomingNecropsyBtnStatus(transferId) {
  const response = await axiosGet({ url: `${GET_INCOMING_NECROPSY_BTN_STATUS}/${transferId}/button-status` })

  return response?.data
}

export async function acceptNecropsyTransfer(transferId, payload) {
  const response = await axiosFormPost({ url: `${UPDATE_TRANSFER_BTN_STATUS}/${transferId}`, body: payload })

  return response?.data
}

export async function getTransferAnimalList(transferId, params) {
  const response = await axiosGet({ url: `${GET_TRANSFER_ANIMAL_LIST}/${transferId}`, params })

  return response?.data
}

export async function getNecropsySummary(necropsyId) {
  const response = await axiosGet({ url: `${GET_NECROPSY_SUMMARY}/${necropsyId}` })

  return response?.data
}

export async function addNecropsy(payload) {
  const response = await axiosFormPost({ url: ADD_NECROPSY, body: payload })

  return response?.data
}

export async function editNecropsy(payload) {
  const response = await axiosFormPost({ url: EDIT_NECROPSY, body: payload })

  return response?.data
}

export async function deleteNecropsy(payload) {
  const response = await axiosFormPost({ url: DELETE_NECROPSY, body: payload })

  return response?.data
}

export async function getNecropsyBodyParts(payload) {
  const response = await axiosPost({ url: GET_NECROPSY_BODY_PARTS, body: payload })

  return response?.data
}

export async function getNecropsyTemplate() {
  const response = await axiosGet({ url: GET_NECROPSY_TEMPLATE })

  return response?.data
}

export async function createNecropsyTemplate(payload) {
  const response = await axiosPost({ url: CREATE_NECROPSY_TEMPLATE, body: payload })

  return response?.data
}

export async function updateNecropsyTemplate(templateId, payload) {
  const response = await axiosFormPost({ url: `${UPDATE_NECROPSY_TEMPLATE}/${templateId}`, body: payload })

  return response?.data
}

export async function deleteNecropsyTemplate(templateId) {
  const response = await axiosPost({ url: `${DELETE_NECROPSY_TEMPLATE}/${templateId}`, body: {} })

  return response?.data
}

export async function getNecropsyTimeline(params) {
  const response = await axiosGet({ url: GET_NECROPSY_TIMELINE, params })

  return response?.data
}

export async function getMortalitySummary(params) {
  const response = await axiosGet({ url: GET_MORTALITY_SUMMARY, params })

  return response?.data
}

export async function getMedicalStats(params) {
  const response = await axiosGet({ url: GET_MEDICAL_STATS, params })

  return response?.data
}

export async function getNecropsyPdf(params) {
  const response = await axiosGet({ url: GET_NECROPSY_PDF, params: params })

  return response?.data
}

export async function deleteNecropsyAttachment(id, payload) {
  const response = await axiosFormPost({ url: `${DELETE_NECROPSY_ATTACHMENT}/${id}`, body: payload })

  return response?.data
}

export async function getMannerOfDeath() {
  const response = await axiosGet({ url: MANNER_OF_DEATH })

  return response?.data
}

export async function getCarcassDisposition() {
  const response = await axiosGet({ url: CARCASS_DEPOSITION })

  return response?.data
}

export async function getCarcassTransferList(params) {
  const response = await axiosGet({ url: `${GET_NEW_INCOMING_PATIENTS_LISTS}`, params })

  return response?.data
}

export async function getMeasurementUnits() {
  const response = await axiosGet({ url: MEASUREMENT_UNITS })

  return response?.data
}
