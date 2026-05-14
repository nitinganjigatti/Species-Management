import {
  ReportItem,
  HeaderItem,
  SpeciesItem,
  AssessmentAnimal,
  Keeper,
  AnimalWise,
  KeeperAnimal,
  Caretaker
} from './models'

export interface ApiResponse<T> {
  success?: boolean
  message?: string
  data?: T
}

export type ReportTitleResponse = ReportItem[]

export interface SpeciesReportData {
  header: HeaderItem[]
  datalist: Record<string, string | number | null | undefined>[]
  total_count: number
}

export interface AnimalReportData {
  header: HeaderItem[]
  animal_list: Record<string, string | number | null | undefined>[]
  total_animal: number
  total_count?: number
}

export interface AssessmentReportData {
  animals: AssessmentAnimal[]
  max_assessment_count: number
  total_records: number
}

export interface TaxonomyListData {
  classification_list: SpeciesItem[]
}

export interface AssessmentTypesData {
  result: {
    assessment_type_id: number
    assessments_type_label: string
    assessment_category_id?: number
  }[]
  total_count: number
}

export interface KeeperListResponse {
  success: boolean
  data: Keeper[]
  pagination?: { total: number }
}

export interface AnimalListResponse {
  success: boolean
  data: AnimalWise[]
  pagination?: { total: number }
}

export interface KeeperAnimalsResponse {
  success: boolean
  data: { result: KeeperAnimal[] } | KeeperAnimal[]
}

export interface AnimalKeepersResponse {
  success: boolean
  data: { result: Caretaker[] } | Caretaker[]
}

export interface ExportReportResponse {
  success: boolean
  data: string
}
