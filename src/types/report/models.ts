import { ReactNode } from 'react'

export interface Site {
  id?: number
  site_id: string | number
  site_name: string
  site_image?: string
}

export interface Zoo {
  zoo_id: number
  sites: Site[]
}

export interface UserSettings {
  enable_reports_module?: boolean
  enable_specie_report?: boolean
  enable_daily_report?: boolean
  enable_animal_report?: boolean
  enable_animal_assessment_report?: boolean
}

export interface AuthUserData {
  user: { zoos: Zoo[] }
  roles: { settings: { enable_reports_module: boolean } }
  permission: { user_settings: UserSettings }
}

export interface ReportItem {
  id: number
  key: string
  title: string
  description?: string
  category?: string
  category_icon?: string
  sub_category?: string | null
  date_type?: string
}

export interface HeaderItem {
  key: string | string[]
  label: string | ReactNode
}

export interface PopoverOption {
  label: string
  key: string
  checked: boolean
}

export interface PopoverData {
  [category: string]: PopoverOption[]
}

export interface FilterParams {
  [key: string]: string | number | string[] | undefined
}

export interface SpeciesItem {
  tsn_id: number
  common_name?: string
  scientific_name?: string
  complete_name?: string
  default_icon?: string
}

export interface AssessmentTypeItem {
  assessment_type_id: number
  assessments_type_label: string
  assessment_category_id?: number
}

export interface AssessmentCategoryItem {
  assessment_category_id: number
  label: string
}

export interface UserDetail {
  profile_image?: string
  user_first_name?: string
  user_last_name?: string
}

export interface AssessmentEntry {
  assessment_value: string
  uom_abbr?: string
  assessment_recorded_date: string
  assessment_recorded_time: string
  user_details: UserDetail
}

export interface AssessmentAnimal {
  animal_id: number
  taxonomy_id?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  identifier_type?: string
  identifier_value?: string
  birth_date?: string
  animal_type?: string
  breed_name?: string
  morph_name?: string
  site?: string
  sex?: string
  total_animal?: number
  assessment_data: { assessments: AssessmentEntry[] }
}

export interface AssessmentRecord {
  value: string
  date: string
  time: string
  user: UserDetail
}

export interface TransformedAssessmentItem {
  default_icon?: string
  local_identifier_name?: string
  local_identifier_value?: string
  animal_id: number
  primary_taxonomy_id?: number
  common_name?: string
  scientific_name?: string
  age: string
  total_animal?: number
  type?: string
  breed_name?: string
  morph_name?: string
  site_name?: string
  sex?: string
  [key: string]: string | number | undefined | AssessmentRecord
}

export interface FilterItems {
  Site: (string | number)[]
  Section: (string | number)[]
  Enclosure: (string | number)[]
  gender: string[]
  accession_start: string | null
  accession_end: string | null
  [key: string]: (string | number)[] | string[] | string | null
}

export interface FilterDates {
  startDate: string
  endDate: string
}

export interface DateFilter {
  startDate: string
  endDate: string
}

export interface PaginationModel {
  page: number
  pageSize: number
  total?: number
}

export interface SectionItem {
  section_id: string | number
  section_name: string
}

export interface EnclosureItem {
  enclosure_id: string | number
  user_enclosure_name: string
}

export interface SiteData {
  site_id: string | number
  site_name: string
  site_image?: string
}

export interface Keeper {
  user_id: number | string
  id?: number
  keeper_name?: string
  user_name?: string
  profile_pic?: string
  user_profile_pic?: string
  total_animals?: number
  primary_count?: number
}

export interface AnimalWise {
  animal_id: number | string
  id?: number
  default_icon?: string
  common_name?: string
  default_common_name?: string
  scientific_name?: string
  complete_name?: string
  sex?: string
  gender?: string
  type?: string
  animal_type?: string
  local_identifier_name?: string
  local_identifier_value?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
  total_keepers?: number
  has_primary?: boolean
}

export interface KeeperAnimal {
  animal_id: number | string
  is_primary?: string | number | boolean
  default_icon?: string
  common_name?: string
  scientific_name?: string
  [key: string]: string | number | boolean | undefined
}

export interface Caretaker {
  user_id?: number | string
  id?: number
  is_primary?: string | number | boolean
  user_name?: string
  keeper_name?: string
  name?: string
  full_name?: string
  user_email?: string
  email?: string
  profile_pic?: string
  user_profile_pic?: string
}

export interface TableColumn {
  field: string
  headerName: string | ReactNode
  width?: number
  minWidth?: number
  flex?: number
  sortable?: boolean
  disableColumnMenu?: boolean
  pinned?: string
  headerStyle?: Record<string, string | number>
  columnStyle?: Record<string, string | number | boolean>
  isAvatar?: boolean
  align?: string
  headerAlign?: string
  height?: number
  renderCell?: (params: { row: Record<string, string | number | boolean | undefined | null> }) => ReactNode
}
