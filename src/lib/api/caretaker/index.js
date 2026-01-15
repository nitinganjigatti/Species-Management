import { axiosGet } from '../utility'

// Get list of keepers with animal counts
export async function getKeepersWithAnimals(params) {
  const response = await axiosGet({ url: 'v1/animal-staff-map/keepers', params })

  return response.data
}

// Get list of animals with keeper counts
// filter: 'with_keeper' | 'without_keeper' | undefined (all)
export async function getAnimalsWithKeepers(params) {
  const response = await axiosGet({ url: 'v1/animal-staff-map/animals', params })

  return response.data
}

// Get animals assigned to a specific keeper
export async function getKeeperAnimals(userId, params) {
  const response = await axiosGet({ url: `v1/animal-staff-map/by-user/${userId}`, params })

  return response.data
}

// Get keepers assigned to a specific animal
export async function getAnimalKeepers(animalId, params) {
  const response = await axiosGet({ url: `v1/animal-staff-map/${animalId}/staff`, params })

  return response.data
}

// Export animal-keeper report as Excel
// filter: 'with_keeper' | 'without_keeper' | undefined (all)
export async function exportAnimalKeeperReport(params) {
  const response = await axiosGet({ url: 'v1/animal-staff-map/export', params })

  return response.data
}
