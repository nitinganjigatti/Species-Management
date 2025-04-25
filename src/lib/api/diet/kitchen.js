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
