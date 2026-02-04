import {
  NECROPSY_LISTING,
  GET_ANIMAL_WISE_NECROPSY_LIST,
  GET_SPECIES_WISE_NECROPSY_LIST,
  GET_NECROPSY_STATS,
  GET_INCOMING_NECROPSY_CHECKLIST_DETAILS,
  GET_INCOMING_NECROPSY_TRANSFER_SUMMARY,
  CREATE_INCOMING_NECROPSY_SUMMARY_COMMENT,
  GET_INCOMING_NECROPSY_BTN_STATUS
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

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
