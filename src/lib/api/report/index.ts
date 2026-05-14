import {
  All_ANIMAL_LIST,
  ANIMAL_REPORT,
  REPORT_TYPE,
  SPECIES_REPORT,
  USER_REPORT,
  MEDICAL_REPORT,
  ASSESSMENT_REPORT,
  GET_UPCOMING_VACCINATION_DEWORMING_RECORDS,
  GET_PENDING_VACCINATION_DEWORMING_RECORDS,
  GET_COMPLETED_VACCINATION_DEWORMING_RECORDS,
  ASSESSMENT_RESPONSE_TYPE
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'
import {
  ReportTitleResponse,
  SpeciesReportData,
  AnimalReportData,
  AssessmentReportData,
  TaxonomyListData,
  AssessmentTypesData,
  ApiResponse
} from 'src/types/report/api'
import { FilterParams } from 'src/types/report/models'

export async function getReportTitle(params: FilterParams): Promise<ReportTitleResponse> {
  const response = await axiosGet({ url: `${REPORT_TYPE}`, params })
  return response.data as ReportTitleResponse
}

export async function getReportList(): Promise<ApiResponse<SpeciesReportData>> {
  const response = await axiosGet({ url: `${SPECIES_REPORT}` })
  return response as ApiResponse<SpeciesReportData>
}

export async function getReportFilterList(params: FilterParams): Promise<ApiResponse<SpeciesReportData>> {
  const response = await axiosGet({ url: `${SPECIES_REPORT}`, params })
  return response.data as ApiResponse<SpeciesReportData>
}

export async function getAllAnimalReport(params: FilterParams): Promise<ApiResponse<AnimalReportData>> {
  const response = await axiosGet({ url: `${All_ANIMAL_LIST}`, params })
  return response.data as ApiResponse<AnimalReportData>
}

export async function getAnimalReportById(params: FilterParams): Promise<ApiResponse<AnimalReportData>> {
  const response = await axiosGet({ url: `${All_ANIMAL_LIST}`, params })
  return response.data as ApiResponse<AnimalReportData>
}

export async function getAnimalReport(params: FilterParams): Promise<ApiResponse<SpeciesReportData>> {
  const response = await axiosGet({ url: `${ANIMAL_REPORT}`, params })
  return response.data as ApiResponse<SpeciesReportData>
}

export async function getUserReport(params: FilterParams): Promise<ApiResponse<SpeciesReportData>> {
  const response = await axiosGet({ url: `${USER_REPORT}`, params })
  return response.data as ApiResponse<SpeciesReportData>
}

export async function getMedicalReport(params: FilterParams): Promise<ApiResponse<SpeciesReportData>> {
  const response = await axiosGet({ url: `${MEDICAL_REPORT}`, params })
  return response.data as ApiResponse<SpeciesReportData>
}

export async function getAnimalAssessmentReport(
  params: FilterParams,
  payload: Record<string, string | number | null | undefined>
): Promise<ApiResponse<AssessmentReportData>> {
  const response = await axiosPost({
    url: `${ASSESSMENT_REPORT}?page=${params.page}&limit=${params.limit}`,
    body: payload
  })
  return response.data as ApiResponse<AssessmentReportData>
}

export async function getAnimalAssessment(params: FilterParams): Promise<ApiResponse<string>> {
  const response = await axiosGet({ url: `v1/animal/assessment/report`, params })
  return response.data as ApiResponse<string>
}

export async function getEnclosureAssessment(params: FilterParams): Promise<ApiResponse<string>> {
  const response = await axiosGet({ url: `v1/enclosure/assessment/report`, params })
  return response.data as ApiResponse<string>
}

export async function getTaxonomyListForReport(params: FilterParams): Promise<ApiResponse<TaxonomyListData>> {
  const response = await axiosPost({ url: `v1/collection/animalspecies/listing`, body: params })
  return response.data as ApiResponse<TaxonomyListData>
}

export async function getAssessmentCategoriesList(
  params: FilterParams
): Promise<ApiResponse<{ assessment_category_id: number; label: string }[]>> {
  const response = await axiosGet({ url: `v1/assessment/category/list`, params })
  return response.data as ApiResponse<{ assessment_category_id: number; label: string }[]>
}

export async function getAssessmentTypesList(params: FilterParams): Promise<ApiResponse<AssessmentTypesData>> {
  const response = await axiosGet({ url: `v1/assessment/type/list`, params })
  return response.data as ApiResponse<AssessmentTypesData>
}

export async function getAssessmentResponseType(params: FilterParams): Promise<
  ApiResponse<{
    response_type?: { label: string; key: string }[]
    measurement_types?: { label: string; key: string }[]
  }>
> {
  const response = await axiosGet({ url: `${ASSESSMENT_RESPONSE_TYPE}`, params })
  return response.data as ApiResponse<{
    response_type?: { label: string; key: string }[]
    measurement_types?: { label: string; key: string }[]
  }>
}

export async function getDailyFoodWastageReport(params: FilterParams): Promise<ApiResponse<string>> {
  const response = await axiosGet({ url: `v1/food/wastage/report`, params })
  return response?.data as ApiResponse<string>
}

type VaccinationStatus = 'upcoming' | 'pending' | 'completed'

export async function getVaccinationRecords(
  type: VaccinationStatus,
  params: FilterParams
): Promise<ApiResponse<string>> {
  const urlMap: Record<VaccinationStatus, string> = {
    upcoming: GET_UPCOMING_VACCINATION_DEWORMING_RECORDS,
    pending: GET_PENDING_VACCINATION_DEWORMING_RECORDS,
    completed: GET_COMPLETED_VACCINATION_DEWORMING_RECORDS
  }
  const response = await axiosGet({ url: `${urlMap[type]}`, params })
  return response.data as ApiResponse<string>
}
