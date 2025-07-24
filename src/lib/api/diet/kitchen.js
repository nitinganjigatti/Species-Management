import { GET_MEAL_GROUP_SUMMARY_REPORT, GET_MEAL_GROUP_WISE_REPORT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getGeneralSpeciesWiseReport({ params }) {
  const response = await axiosGet({ url: `diet-report/general-species-wise-report`, params })

  return response.data
}

export async function getSpeciesWiseReport({ params }) {
  const response = await axiosGet({ url: `diet-report/species-wise`, params })

  return response.data
}

export async function getAnimalWiseInventoryPlanning({ params }) {
  const response = await axiosGet({ url: `diet-report/animal_wise_inventory_planning`, params })

  return response.data
}

export async function getMealGroupWiseReport({ params }) {
  const response = await axiosGet({ url: `${GET_MEAL_GROUP_WISE_REPORT}`, params })

  return response?.data
}

export async function getMealGroupSummaryReport({ params }) {
  const response = await axiosGet({ url: `${GET_MEAL_GROUP_SUMMARY_REPORT}`, params })

  return response?.data
}
