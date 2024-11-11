// import { HOUSING_REPORT, SPECIES_REPORT, USERS_REPORT } from 'src/constants/ApiConstant'
import { SPECIES_REPORT } from 'src/constants/ApiConstant'
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

export async function getReportList() {
  const response = await axiosGet({ url: `${SPECIES_REPORT}` })
  return response.data
}

export async function getReportFilterList(params) {
  const reponse = await axiosGet({ url: `${SPECIES_REPORT}`, params })

  return reponse.data
}
