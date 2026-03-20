export interface StyledTypographyProps {
  fontWeight?: number | string
  fontSize?: string
  color?: string
  sx?: any
}

export interface OffspringStats {
  all_offspring: string | number
  litter_count: string | number
  mortality_count: string | number
  fetal_death_count: string | number
  clutch_count: string | number
  egg_count: string | number
  [key: string ]: string | number
}

export interface OffspringStatsPayload {
  parent_id: string | number
  is_mother: 0 | 1
}

export interface OffspringStatsResponse {
  success: boolean
  data: OffspringStats
  message: string
}

export interface DeleteOffspringPayload {
  parent_id: string | number
  is_mother: 0 | 1
  offspring_ids: string[] | string
  confirm_delete: 0 | 1
}

export interface DeleteOffspringResponse {
  success: boolean
  data: any
  message: string
}

export interface AddOffspringPayload {
  offspring_ids: string[] | string
  mother_id: string | number
  ref_type: 'litter' 
  create_new: boolean
  ref_id?: string | number
  father_id?: string | number
}

export interface AddOffspringResponse {
  success: boolean
  data: any
  message: string
}

export interface OffspringListItem {
  animal_id: string
  birth_date: string
  clutch_id: string | null
  total_animal: string
  is_alive: string
  accession_date: string
  taxonomy_id: string
  scientific_name: string
  common_name: string
  sex: string
  type: string
  local_id_type: string | null
  local_identifier_name: string | null
  local_id: string | null
  local_identifier_value: string | null
  enclosure_id: string
  user_enclosure_name: string
  section_id: string
  section_name: string
  site_name: string
  site_id: string
  breed_id: string | null
  breed_name: string | null
  morph_id: string | null
  morph_name: string | null
  in_transit: string
  is_hospitalized: string
  default_icon: string
  [key: string]: any
}

export interface OffspringListResponse {
  success: boolean
  data: OffspringListItem[]
  total_count: string
  message: string
}


export interface FetusStatsPayload {
  parent_id:string | number
}

export interface FetusStatsResponse {
  success: boolean
  data: {
    abortion_count: string | number
    stillbirth_count: string | number 
  }
}

export interface GetFetusPayload {
  parent_id: string | number
  type: 'stillbirth' | 'abortion'
  page_no: number
  limit: number
}

export interface FetusItem {
  fetus_id: string | number
  fetus_code: string
  report_by: string
  default_common_name: string
  animal_scientific_name: string
  discovered: string
  site_name: string
  parentage_status: string
  mother_id_counts: string
  father_id_counts: string
  default_icon: string
  sex: string
  created_at: string
  mother_id: string
  father_id: string | null
}

export interface GetFetusResponse {
  success: boolean
  data: any
}

export interface AnimalItem {
  animal_id: string
  common_name: string
  scientific_name: string
  user_enclosure_name: string
  section_name: string
  site_name: string
  default_icon: string
  egg_id?: number | string
  [key: string]: any
}

export interface LitterItem {
  litter_id: string
  litter_no: string
  start_date: string
  end_date: string
  total_animal_count: string
  alive_count: string
  death_count: string
  male_count: string | number
  female_count: string | number
  undetermined_count: string | number
  indeterminate_count: string | number
}

export interface ClutchItem {
  clutch_id: string
  clutch_no: string
  start_date: string
  end_date: string
  total_egg_count: string
  deathdiscarded_count_count: string
  hatched_count: string
  male_count: string | number
  female_count: string | number
  undetermined_count: string | number
  indeterminate_count: string | number
}


export interface AnimalOffspringProps {
  animalDetails?: any
}

export interface TabProps {
  animalId: string
  isMother: number
}





export interface FetalDeathDrawerProps {
  open: boolean
  onClose: () => void
  fetusId: number | string
}