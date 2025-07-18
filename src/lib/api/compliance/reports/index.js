import {
  GET_ALL_USERS,
  GET_ANIMAL_LIST_FOR_OBSERVATION_REPORT,
  GET_KEEPER_REPORT,
  GET_OBSERVATION_REPORT
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

export async function getObservationReport({ params }) {
  const response = await axiosGet({ url: `${GET_OBSERVATION_REPORT}`, params })

  return response?.data
}
