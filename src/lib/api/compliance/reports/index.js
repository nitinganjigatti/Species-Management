import {
  GET_ALL_USERS,
  GET_ANIMAL_FILTERS_LISTS,
  GET_ANIMAL_LIST_FOR_OBSERVATION_REPORT,
  GET_KEEPER_REPORT,
  GET_OBSERVATION_REPORT,
  GET_ANIMAL_COUNT_REGISTER,
  COMPLIANCE_DAILY_REPORT,
  OBSERVATION_MASTER_TYPE
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getUserListing(params) {
  const response = await axiosGet({ url: `${GET_ALL_USERS}`, params })

  return response.data
}

export async function getDiaryReportList(params) {
  const response = await axiosGet({ url: `${GET_KEEPER_REPORT}`, params })

  return response.data
}

export async function getAnimalListForObservationReport(body) {
  const response = await axiosPost({ url: `${GET_ANIMAL_LIST_FOR_OBSERVATION_REPORT}`, body: JSON.stringify(body) })

  return response?.data
}

export async function getObservationReport(params) {
  console.log(params, 'params from api')
  const response = await axiosGet({ url: `${GET_OBSERVATION_REPORT}`, params })

  return response?.data
}

export async function getAnimalFilterList({ params }) {
  const response = await axiosGet({ url: `${GET_ANIMAL_FILTERS_LISTS}`, params })

  return response?.data
}

// Enclosure Count Register
export async function getEnclosureCountRegister(params) {
  const response = await axiosGet({ url: `${GET_ANIMAL_COUNT_REGISTER}`, params })

  return response?.data
}

export async function getComplianceDailyReport(params) {
  const response = await axiosPost({ url: `${COMPLIANCE_DAILY_REPORT}`, body: params })

  return response?.data
}

export async function getObservationMasterType(params) {
  const response = await axiosGet({ url: `${OBSERVATION_MASTER_TYPE}`, params })

  return response?.data
}

export async function getAnimalHistoryReport(params) {
  // const response = await axiosGet({ url: `${OBSERVATION_MASTER_TYPE}`, params })
  // return response?.data
}
