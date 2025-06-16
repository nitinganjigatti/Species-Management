// import { HOUSING_REPORT, SPECIES_REPORT, USERS_REPORT } from 'src/constants/ApiConstant'
import {
  All_ANIMAL_LIST,
  ANIMAL_REPORT,
  MORTALITY_REPORT,
  REPORT_TYPE,
  SPECIES_REPORT,
  USER_REPORT,
  MEDICAL_REPORT
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

// export async function getUsersReportList() {
//   const response = await axiosPost({ url: `${USERS_REPORT}` })

//   return response.data
// }

// export async function getHousingReport() {
//   const response = await axiosGet({ url: `${HOUSING_REPORT}` })

//   return response.data
// }

// export async function getSpeciesReport() {
//   const response = await axiosGet({ url: `${SPECIES_REPORT}` })

//   return response.data
// }

export async function getReportTitle() {
  const response = await axiosGet({ url: `${REPORT_TYPE}` })

  return response.data
}

export async function getReportList() {
  const response = await axiosGet({ url: `${SPECIES_REPORT}` })

  return response
}

export async function getReportFilterList(params) {
  const reponse = await axiosGet({ url: `${SPECIES_REPORT}`, params })

  return reponse.data
}

export async function getAllAnimalReport(params) {
  const response = await axiosGet({ url: `${All_ANIMAL_LIST}`, params })

  return response.data
}

export async function getAnimalReport(params) {
  const response = await axiosGet({ url: `${ANIMAL_REPORT}`, params })

  return response.data
}

export async function getUserReport(params) {
  const response = await axiosGet({ url: `${USER_REPORT}`, params })

  return response.data
}

export async function getMedicalReport(params) {
  const response = await axiosGet({ url: `${MEDICAL_REPORT}`, params })

  return response.data
}

export async function getAnimalAssessment(params) {
  const response = await axiosGet({ url: `v1/animal/assessment/report`, params })

  return response.data
}

export async function getEnclosureAssessment(params) {
  const response = await axiosGet({ url: `v1/enclosure/assessment/report`, params })

  return response.data
}

// export async function getMortalityList(params) {
//   const response = await axiosGet({ url: `${ANIMAL_REPORT}`, params })
//   return response.data
// }

// export async function getTransferList(params) {
//   const response = await axiosGet({ url: `${ANIMAL_REPORT}`, params })
//   return response.data
// }
