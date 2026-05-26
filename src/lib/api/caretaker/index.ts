import { axiosGet, axiosPost } from '../utility'
import {
  KeeperListResponse,
  AnimalListResponse,
  KeeperAnimalsResponse,
  AnimalKeepersResponse,
  ExportReportResponse
} from 'src/types/report/api'

interface PaginationParams {
  page?: number
  per_page?: number
  filter?: string
}

// Get list of keepers with animal counts
export async function getKeepersWithAnimals(params: PaginationParams): Promise<KeeperListResponse> {
  const response = await axiosGet({ url: 'v1/animal-staff-map/keepers', params })
  return response.data as KeeperListResponse
}

// Get list of animals with keeper counts
// filter: 'with_keeper' | 'without_keeper' | undefined (all)
export async function getAnimalsWithKeepers(params: PaginationParams): Promise<AnimalListResponse> {
  const response = await axiosGet({ url: 'v1/animal-staff-map/animals', params })
  return response.data as AnimalListResponse
}

// Get animals assigned to a specific keeper
export async function getKeeperAnimals(
  userId: number | string,
  params?: PaginationParams
): Promise<KeeperAnimalsResponse> {
  const response = await axiosGet({ url: `v1/animal-staff-map/by-user/${userId}`, params })
  return response.data as KeeperAnimalsResponse
}

// Get keepers assigned to a specific animal
export async function getAnimalKeepers(
  animalId: number | string,
  params?: PaginationParams
): Promise<AnimalKeepersResponse> {
  const response = await axiosGet({ url: `v1/animal-staff-map/${animalId}/staff`, params })
  return response.data as AnimalKeepersResponse
}

// Export animal-keeper report as Excel
// filter: 'with_keeper' | 'without_keeper' | undefined (all)
export async function exportAnimalKeeperReport(params: PaginationParams): Promise<ExportReportResponse> {
  const response = await axiosGet({ url: 'v1/animal-staff-map/export', params })
  return response.data as ExportReportResponse
}

// Assign incharges/keepers to an animal
// user_ids: comma-separated string of user IDs (e.g., "1,2,3")
export async function assignAnimalIncharges(animalId: number | string, userIds: string): Promise<{ success: boolean }> {
  const response = await axiosPost({
    url: `v1/animal-staff-map/${animalId}/assign`,
    body: { user_ids: userIds }
  })
  return response.data as { success: boolean }
}

// Set primary incharge for an animal
export async function setAnimalPrimaryIncharge(
  animalId: number | string,
  userId: number | string
): Promise<{ success: boolean }> {
  const response = await axiosPost({
    url: `v1/animal-staff-map/${animalId}/set-primary`,
    body: { user_id: userId }
  })
  return response.data as { success: boolean }
}

// Remove primary incharge for an animal
export async function removeAnimalPrimaryIncharge(
  animalId: number | string,
  userId: number | string
): Promise<{ success: boolean }> {
  const response = await axiosPost({
    url: `v1/animal-staff-map/${animalId}/remove-primary`,
    body: { user_id: userId }
  })
  return response.data as { success: boolean }
}
