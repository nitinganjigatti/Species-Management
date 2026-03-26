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
  [key: string]: string | number
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
  parent_id: string | number
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

export interface FetusDetail {
  fetus_id: string
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

export interface GetFetusListResponse {
  success: boolean
  data: {
    total_count: string
    fetus_details: FetusDetail[]
  }
}

export interface GetFetusResponse {
  success: boolean
  data: any
}

export interface GetClutchEggListPayload {
  type: 'offspring'
  q: string
  parent_id: string | number
  is_mother: 0 | 1
  page_no: number
  clutch_id?: string | number
}

export interface ClutchEgg {
  complete_name: string
  default_common_name: string
  default_icon: string

  egg_code: string
  egg_condition: string
  string_id: string

  site_name: string
  site_id: string
  enclosure_id: string
  enclosure_name: string
  section_id: string

  egg_id: string
  egg_number: string | null
  egg_condition_id: string
  egg_state_id: string | null
  clutch_id: string

  collection_date: string
  created_by: string
  user_profile_pic: string
  user_full_name: string

  lay_date: string | null
  action_to_be_taken: string
  discard_status: string
  in_transit: string

  created_at: string
  discarded_at: string | null
  discarded_by: string | null

  egg_state: string | null
  state_string_id: string | null

  nursery_site_id: string | null
  nursery_name: string | null
  nursery_id: string | null

  animal_id: string | null
  local_id: string | null
  local_identifier_value: string | null
  local_id_type: string | null

  animal_sex: string | null
  animal_taxonomy_id: string | null

  egg_initial_temperature: string | null
  is_necropsy_needed: string | null
  is_sample_collected: string | null
  necropsy_file_uploaded: string

  egg_discard_id: string | null
  discard_request_id: string | null
  discard_activity_status: string | null
  discard_reason: string | null
  activity_status: string | null

  animal_taxonomy_default_common_name: string | null
  animal_taxonomy_complete_name: string | null
  animal_default_icon: string

  allocate_date: string | null
  hatched_days: string
  discarded_date: string | null
  ready_to_be_discarded_date: string | null
  hatched_date: string | null
  transferred_date: string | null

  no_of_eggs_in_clutch: string
  egg_status: string
  discard_ready_date: string | null
  days_in_incubation: string

  initial_weight: string | null
  current_weight: string | null
  initial_length: string | null
  initial_width: string | null
}

export interface GetClutchEggListResponse {
  success: boolean
  data: {
    total_count: string
    result: ClutchEgg[]
  }
  message: string
}

export interface EnclosureData {
  enclosure_id: string
  user_enclosure_name: string
  section_id: string
  section_name: string
  enclosure_desc: string
  enclosure_code: string
  enclosure_incharge_id: string | null
  enclosure_environment: string
  enclosure_sunlight: string
  is_system_generated: string
  external_link: string | null
  enclosure_qr_image: string
  default_icon: string | null
  total_sub_enclosure_count: string
  incharge_name: string | null
  incharge_phone_no: string | null
  total_occupants: string
  total_species: string
  site_id: string
  site_name: string
  images: any[]
}

export interface ParentAnimal {
  _id: string
  egg_id: string
  sex: string
  animal_id: string
  percentage: string | null
  site_name: string
  is_mother: string
  section_name: string
  complete_name: string
  scientific_name: string
  local_id: string | null
  local_identifier_value: string | null
  breed_id: string
  breed_name: string
  morph_id: string
  morph_name: string
  local_id_type: string | null
  common_name: string
  user_enclosure_id: string
  user_enclosure_name: string
  section_id: string
  site_id: string
  default_icon: string
  parent_media: any[]
  taxonomy_id: string
  type: string
  total_animal: string
  local_identifier_name: string | null
}

export interface ParentList {
  mother_list: ParentAnimal[]
  father_list: ParentAnimal[]
}

export interface ActivityLog {
  id: string
  status: string
  action: string
  action_string_id: string
  comments: string
  custom_data: {
    egg_code: string
    egg_state_id: string | null
    egg_status_id: string
    discard_status: string
    egg_condition_id: string
    action_to_be_taken: string
    egg_initial_temperature: string
  }
  created_at: string
  created_by: string
  from_incubator_name: string
  to_incubator_name: string
  action_by: string
  user_profile_pic: string
}

export interface EggDetails {
  complete_name: string
  default_common_name: string
  default_icon: string
  site_name: string

  egg_code: string
  egg_condition: string
  condition_string_id: string

  egg_state: string | null
  state_string_id: string | null

  egg_status: string
  status_string_id: string

  egg_id: string
  egg_number: string | null
  nursery_id: string | null
  clutch_id: string
  enclosure_id: string

  collection_date: string
  lay_date: string | null

  action_to_be_taken: string
  discard_status: string
  in_transit: string
  parentage_status: string

  egg_initial_temperature: string | null
  notes: string

  created_by: string
  user_profile_pic: string
  user_full_name: string
  created_at: string

  egg_condition_id: string
  egg_state_id: string | null
  egg_status_id: string
  taxonomy_id: string

  discarded_at: string | null
  discarded_by: string | null

  clutch_number: string

  incubator_id: string | null
  incubator_name: string | null
  max_eggs: string | null
  incubator_code: string | null

  room_id: string | null
  room_name: string | null

  hatched_date: string | null
  hatched_method: string | null
  egg_shell_thickness: string | null

  nursery_name: string | null
  modified_at: string

  is_necropsy_needed: string | null
  is_sample_collected: string | null

  enclosure_data: EnclosureData[]
  parent_list: ParentList
  assessments_data: any[]
  activity_log: ActivityLog[]
  comments_data: any[]

  total_comment_count: number
  animal_data: any

  initial_weight: string | null
  initial_length: string | null
  initial_width: string | null
}

export interface GetEggDetailsResponse {
  success: boolean
  data: EggDetails
  message: string
}

export interface EggParentDetails {
  site_name: string
  section_name: string
  user_enclosure_name: string
  enclosure_code: string

  taxonomy_id: string

  lay_date: string | null
  clutch_number: string

  egg_id: string
  egg_number: string | null
  clutch_id: string

  collection_date: string
  collected_by: string

  parent_list: ParentList
}

export interface GetEggParentDetailsResponse {
  success: boolean
  data: EggParentDetails
  message: string
}

export interface EggHistoryItem {
  id: string
  status: string
  action: string
  action_string_id: string
  comments: string

  custom_data: {
    egg_code: string
    egg_state_id: string | null
    egg_status_id: string
    discard_status: string
    egg_condition_id: string
    action_to_be_taken: string
    egg_initial_temperature: string
  }

  created_at: string
  created_by: string
  from_incubator_name: string
  to_incubator_name: string
  action_by: string
  user_profile_pic: string
}

export interface GetEggHistoryResponse {
  success: boolean
  data: {
    total_count: string
    result: EggHistoryItem[]
  }
  message: string
}

export interface AnimalItem {
  animal_id: string | number
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
  discarded_count: string
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
  stats?: OffspringStats | null
  animalDetails?: any
}

export interface FetalDeathDrawerProps {
  open: boolean
  onClose: () => void
  fetusId: number | string
}

export interface AddOffspringDrawerProps {
  open: boolean
  onClose: () => void
  onAcceptSuccess: () => void
  animalId: string | number
  animalsDetails?: any
}

export interface UpdateEggStatusPayload {
  egg_id: string
  egg_status_id: string
  egg_state_id: string | null
  hatch_date: string | null
  comment: string | null
  egg_attachment: any[] | string | null
}

export interface GetEggMediaListPayload {
  ref_id: number
  ref_type: string
}
