/**
 * Core entity types for the Housing module
 */

// ==================== Site ====================

export interface Site {
  site_id: number
  site_guid?: string
  site_name: string
  site_code?: string
  address?: string
  description?: string
  latitude?: number
  longitude?: number
  images?: SiteImage[]
  species_count?: number
  animal_count?: number
  section_count?: number
  enclosure_count?: number
  incharge_id?: number
  incharge_name?: string
  incharge_image?: string
  incharge_mobile_no?: string
  zoo_id?: number
  zoo_name?: string
  is_active?: boolean
  is_deleted?: string
  created_at?: string
  updated_at?: string
}

export interface SiteImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
  upload_type?: string
}

export interface IndexedSiteRow extends Site {
  id: number
  sl_no: number
}

export interface ZooStats {
  total_species?: number
  total_animals?: number
  total_sections?: number
  total_enclosures?: number
  total_male?: number
  total_female?: number
  total_undetermined?: number
}

export interface SiteAnalytics {
  site_id?: number
  site_name?: string
  site_code?: string
  total_species?: number
  total_animals?: number
  total_sections?: number
  total_enclosures?: number
  total_male?: number
  total_female?: number
  total_undetermined?: number
  total_mortality?: number
  images?: SiteImage[]
  incharge_name?: string
  incharge_image?: string
  incharge_mobile_no?: string
  zoo_stats?: ZooStats
}

// ==================== Section ====================

export interface Section {
  section_id: number
  section_guid?: string
  section_name: string
  section_code?: string
  site_id?: number
  site_name?: string
  description?: string
  images?: SectionImage[]
  species_count?: number
  animal_count?: number
  enclosure_count?: number
  incharge_id?: number
  incharge_name?: string
  incharge_image?: string
  incharge_mobile_no?: string
  is_active?: boolean
  is_deleted?: string
  created_at?: string
  updated_at?: string
}

export interface SectionImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
}

export interface IndexedSectionRow extends Section {
  id: number
  sl_no: number
}

export interface SectionAnalytics {
  section_id?: number
  section_name?: string
  section_code?: string
  site_id?: number
  site_name?: string
  total_species?: number
  total_animals?: number
  total_enclosures?: number
  total_male?: number
  total_female?: number
  total_undetermined?: number
}

// ==================== Enclosure ====================

export interface Enclosure {
  enclosure_id: number
  enclosure_guid?: string
  enclosure_name: string
  enclosure_code?: string
  section_id?: number
  section_name?: string
  site_id?: number
  site_name?: string
  parent_enclosure_id?: number | null
  parent_enclosure_name?: string
  enclosure_type_id?: number
  enclosure_type_name?: string
  description?: string
  images?: EnclosureImage[]
  species_count?: number
  animal_count?: number
  child_enclosure_count?: number
  incharge_id?: number
  incharge_name?: string
  incharge_image?: string
  capacity?: number
  area?: number
  area_unit?: string
  is_active?: boolean
  is_deleted?: string
  created_at?: string
  updated_at?: string
}

export interface EnclosureImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
}

export interface IndexedEnclosureRow extends Enclosure {
  id: number
  sl_no: number
}

export interface EnclosureType {
  id: number
  name: string
  description?: string
}

export interface EnclosureSetting {
  id: number
  setting_name?: string
  setting_value?: string
  setting_type?: string
}

export interface EnclosureStats {
  enclosure_id?: number
  enclosure_name?: string
  total_species?: number
  total_animals?: number
  total_male?: number
  total_female?: number
  total_undetermined?: number
}

// ==================== Animal ====================

export interface Animal {
  animal_id: number
  animal_guid?: string
  animal_code?: string
  local_id?: string
  tsn?: string
  species_name?: string
  default_common_name?: string
  scientific_name?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  birth_date?: string
  acquisition_date?: string
  acquisition_type?: string
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  images?: AnimalImage[]
  is_alive?: boolean
  is_deceased?: boolean
  is_deleted?: string
  animal_transfered?: string
  is_necropsy?: boolean
  created_at?: string
  updated_at?: string
}

export interface AnimalImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
  upload_type?: string
}

export interface IndexedAnimalRow extends Animal {
  id: number
  sl_no: number
}

export interface AnimalOverview extends Animal {
  weight?: number
  weight_unit?: string
  height?: number
  height_unit?: string
  length?: number
  length_unit?: string
  dam_name?: string
  dam_code?: string
  sire_name?: string
  sire_code?: string
  parent_enclosure_name?: string
  parent_enclosure_id?: number
  user_full_name?: string
  user_profile_image?: string
}

// ==================== Species ====================

export interface Species {
  tsn: string
  default_common_name?: string
  scientific_name?: string
  default_icon?: string
  species_count?: number
  animal_count?: number
  male_count?: number
  female_count?: number
  undetermined_count?: number
}

export interface IndexedSpeciesRow extends Species {
  id: string | number
  sl_no: number
  species_name: string
}

// ==================== Cluster ====================

export interface Cluster {
  cluster_id: number
  cluster_guid?: string
  cluster_name: string
  cluster_code?: string
  description?: string
  images?: ClusterImage[]
  site_count?: number
  species_count?: number
  animal_count?: number
  incharge_ids?: number[]
  incharges?: ClusterIncharge[]
  zoo_id?: number
  is_active?: boolean
  is_deleted?: string
  created_at?: string
  updated_at?: string
}

export interface ClusterImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
}

export interface ClusterIncharge {
  user_id: number
  user_name?: string
  full_name?: string
  profile_image?: string
  mobile_number?: string
  email?: string
  role?: string
}

export interface IndexedClusterRow extends Cluster {
  id: number
  sl_no: number
}

export interface ClusterAnalytics {
  cluster_id?: number
  cluster_name?: string
  total_sites?: number
  total_species?: number
  total_animals?: number
  incharges?: ClusterIncharge[]
}

// ==================== Notes / Observations ====================

export interface Note {
  observation_id: number
  observation_guid?: string
  notes_id?: number
  title?: string
  description?: string
  notes?: string
  note_type?: string
  note_type_id?: number
  note_type_name?: string
  priority?: string
  priority_id?: number
  ref_type?: string
  ref_id?: number
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  animal_id?: number
  animal_code?: string
  species_name?: string
  images?: NoteImage[]
  attachments?: NoteAttachment[]
  tagged_users?: TaggedUser[]
  reaction_count?: number
  comment_count?: number
  user_reaction?: string | null
  created_by?: number
  created_by_name?: string
  created_by_image?: string
  created_at?: string
  updated_at?: string
}

export interface NoteImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
  file_size?: number
}

export interface NoteAttachment {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
  file_size?: number
  upload_type?: string
}

export interface TaggedUser {
  user_id: number
  user_name?: string
  full_name?: string
  profile_image?: string
}

export interface NoteComment {
  comment_id: number
  observation_id?: number
  notes?: string
  comment?: string
  commented_by?: number
  commented_by_name?: string
  commented_by_image?: string
  commented_at?: string
  created_at?: string
}

export interface IndexedNoteRow extends Note {
  id: number
  sl_no: number
}

// ==================== Observation Types ====================

export interface ObservationType {
  id: number
  name: string
  type_name?: string
  label?: string
  description?: string
  parent_id?: number | null
  children?: ObservationType[]
  child_observation?: ObservationMasterItem[]
  is_active?: boolean
  order?: number
}

export interface ObservationMasterItem {
  id: number
  name: string
  type_name?: string
  label?: string
  description?: string
  parent_id?: number | null
  parent_name?: string
  is_active?: boolean
}

// ==================== Mortality ====================

export interface Mortality {
  mortality_id: number
  mortality_guid?: string
  animal_id?: number
  animal_code?: string
  local_id?: string
  species_name?: string
  scientific_name?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  discovered_date?: string
  mortality_date?: string
  manner_of_death?: string
  manner_of_death_id?: number
  carcass_condition?: string
  carcass_condition_id?: number
  carcass_disposition?: string
  carcass_disposition_id?: number
  notes?: string
  submitted_for_necropsy?: string
  reported_by?: string
  reported_by_id?: number
  reported_by_profile_picture?: string
  reported_on?: string
  status?: string
  is_deleted?: string
  created_at?: string
  updated_at?: string
}

export interface IndexedMortalityRow extends Mortality {
  id: number
  sl_no: number
}

// ==================== Treatment ====================

export interface Treatment {
  treatment_id: number
  treatment_guid?: string
  animal_id?: number
  animal_code?: string
  local_id?: string
  species_name?: string
  scientific_name?: string
  default_icon?: string
  sex_type?: string
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  treatment_type?: string
  treatment_date?: string
  diagnosis?: string
  prescription?: string
  notes?: string
  status?: string
  treated_by?: string
  treated_by_id?: number
  created_at?: string
  updated_at?: string
}

export interface IndexedTreatmentRow extends Treatment {
  id: number
  sl_no: number
}

// ==================== Media ====================

export interface Media {
  media_id: number
  media_guid?: string
  file: string
  file_name?: string
  file_type?: string
  file_size?: number
  upload_type?: string
  ref_type?: string
  ref_id?: number
  entity_type?: string
  entity_id?: number
  animal_id?: number
  animal_code?: string
  species_name?: string
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  uploaded_by?: string
  uploaded_by_id?: number
  created_at?: string
  updated_at?: string
}

export interface IndexedMediaRow extends Media {
  id: number
  sl_no: number
}

// ==================== Animal Identifier ====================

export interface AnimalIdentifier {
  id: number
  identifier_id?: number
  animal_id?: number
  local_identifier_type_id?: number
  local_identifier_name?: string
  local_identifier_value?: string
  identifier?: string
  is_primary?: string | number
  is_deleted?: string
  created_at?: string
  modified_at?: string
  updated_at?: string
}

export interface IndexedIdentifierRow extends AnimalIdentifier {
  sl: number
}

export interface IdentifierType {
  id: number
  label: string
  value?: number
  name?: string
  description?: string
}

// ==================== Animal Incident ====================

export interface AnimalIncident {
  incident_id: number
  incident_guid?: string
  animal_id?: number
  animal_code?: string
  species_name?: string
  incident_type?: string
  incident_type_id?: number
  incident_date?: string
  incident_time?: string
  description?: string
  notes?: string
  status?: string
  location?: string
  reported_by?: string
  reported_by_id?: number
  reported_by_image?: string
  resolved_by?: string
  resolved_by_id?: number
  resolved_date?: string
  images?: IncidentImage[]
  attachments?: IncidentAttachment[]
  created_at?: string
  updated_at?: string
}

export interface IncidentImage {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
}

export interface IncidentAttachment {
  id?: number
  file?: string
  file_name?: string
  file_type?: string
  file_size?: number
}

export interface IndexedIncidentRow extends AnimalIncident {
  id: number
  sl_no: number
}

// ==================== Animal Diet ====================

export interface AnimalDiet {
  diet_id: number
  diet_guid?: string
  animal_id?: number
  diet_type?: string
  diet_name?: string
  quantity?: number
  quantity_unit?: string
  frequency?: string
  feeding_time?: string
  notes?: string
  start_date?: string
  end_date?: string
  status?: string
  created_by?: string
  created_by_id?: number
  created_at?: string
  updated_at?: string
}

export interface IndexedDietRow extends AnimalDiet {
  id: number
  sl_no: number
}

// ==================== Animal History ====================

export interface AnimalHistoryItem {
  history_id: number
  animal_id?: number
  event_type?: string
  event_title?: string
  event_description?: string
  event_date?: string
  event_time?: string
  metadata?: Record<string, unknown>
  created_by?: string
  created_by_image?: string
  created_at?: string
}

// ==================== Animal Journal ====================

export interface AnimalJournalLog {
  date?: string
  day?: string
  entries?: AnimalJournalEntry[]
}

export interface AnimalJournalEntry {
  type?: string
  category?: string
  title?: string
  time?: string
  code?: string
  details?: Record<string, unknown>
  created_by?: {
    name?: string
    timestamp?: string
  }
  user_full_name?: string
  icon?: string
}

// ==================== Form Options ====================

export interface SelectOption {
  label: string
  value: string | number
  key?: string
}

export interface MannerOfDeathOption {
  id: number
  name: string
  label?: string
  value?: number
}

export interface CarcassConditionOption {
  id: number
  name: string
  label?: string
  value?: number
}

export interface CarcassDispositionOption {
  id: number
  name: string
  label?: string
  value?: number
}

// ==================== User Related ====================

export interface User {
  user_id: number
  user_guid?: string
  user_name?: string
  full_name?: string
  email?: string
  mobile_number?: string
  user_mobile_number?: string
  profile_image?: string
  user_profile_pic?: string
  avatar?: string
  role?: string
  role_name?: string
  zoo_id?: number
  account_status?: string
  isActive?: boolean
}

export interface UserAvatarInfo {
  id: number
  name?: string
  avatar?: string
  profile_image?: string
  role?: string
}

// ==================== Drawer Data ====================

export interface DrawerData {
  queryKey: string
  id: number | string
  name: string
  image?: string
  params: Record<string, unknown>
}

export type DrawerType =
  | 'sections'
  | 'species'
  | 'animals'
  | 'enclosures'
  | 'sub-enclosures'
  | 'insights-animals'
  | null
