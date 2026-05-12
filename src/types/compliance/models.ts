export type Id = string | number

export type Gender = 'male' | 'female' | 'undeterminate' | 'unknown'

export interface SelectOption<V = string | number> {
  label: string
  value: V
  key?: string | number
  id?: Id
  image?: string
  [key: string]: unknown
}

export interface CountryOption {
  label: string
  value: string
}

// ==================== Trade Parties ====================

export interface TradeParty {
  id?: Id
  name?: string
  type?: string
  address?: string
  country?: string
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
}

// ==================== Document Types ====================

export interface DocumentType {
  id?: Id
  name?: string
  status?: number
  context_id?: Id
  trade_context_type?: string
  created_at?: string
  updated_at?: string
}

export interface TradeContextType {
  id?: Id
  name?: string
  label?: string
  value?: Id
}

// ==================== Species ====================

export interface Species {
  id?: Id
  taxonomy_id?: Id
  tsn_id?: Id
  common_name?: string
  scientific_name?: string
  complete_name?: string
  default_icon?: string
  appendix?: string
  isFromAntzDatabase?: boolean
  export_species_id?: Id
  [key: string]: unknown
}

export interface MasterSpecies {
  id?: Id
  taxonomy_id?: Id
  common_name?: string
  scientific_name?: string
  default_icon?: string
  [key: string]: unknown
}

// ==================== Export Animals ====================

export interface ExportAnimal {
  id?: Id
  export_animal_id?: Id
  export_species_id?: Id
  gender?: string
  identifier_type?: string
  identifier_value?: string
  animal_type?: string
  animal_count?: number
}

export interface ExportAnimalFormItem {
  id?: Id
  export_animal_id?: Id
  export_species_id?: Id
  gender?: SelectOption
  identifier_type?: SelectOption | null
  identifier_value?: string
  animal_type?: string
  animal_count?: number
}

// ==================== Export Species ====================

export interface ExportSpecies {
  id?: Id
  taxonomy_id?: Id
  common_name?: string
  scientific_name?: string
  appendix?: string
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_count?: number
  animals?: ExportAnimal[]
}

export interface ExportSpeciesFormItem {
  id?: Id
  tsn_id?: Id
  species: Species
  appendix?: SelectOption
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_count?: number
  animalDetails: ExportAnimalFormItem[]
}

export interface ExportDocument {
  document_type_id?: Id
  file_path?: string
  file_original_name?: string
  issued_date?: string
}

// ==================== Export Permit ====================

export interface ExportPermit {
  id?: Id
  export_id?: Id
  export_number?: string
  issued_date?: string
  valid_until?: string
  origin_country?: string
  exporting_country?: string
  exporter_name?: string
  importer_name?: string
  exporter_id?: Id
  importer_id?: Id
  export_purpose?: string
  species?: ExportSpecies[]
  documents?: ExportDocument
  file_path?: string
  file_original_name?: string
  created_by?: Id
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

// ==================== Import Species / Import Permit ====================

export interface ImportSpecies {
  id?: Id
  taxonomy_id?: Id
  common_name?: string
  scientific_name?: string
  appendix?: string
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_count?: number
  animals?: ExportAnimal[]
  [key: string]: unknown
}

export interface ImportPermit {
  id?: Id
  import_id?: Id
  import_number?: string
  import_date?: string
  export_count?: number
  species?: ImportSpecies[]
  [key: string]: unknown
}

// ==================== Shipment Animals ====================

export interface ShipmentAnimal {
  id?: Id
  shipment_animal_id?: Id
  gender?: string
  identifier_type?: string
  identifier_value?: string
  [key: string]: unknown
}

// ==================== Shipment Species ====================

export interface ShipmentSpecies {
  id?: Id
  taxonomy_id?: Id
  common_name?: string
  scientific_name?: string
  appendix?: string
  total_count?: number
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_animals?: number
  animals?: ShipmentAnimal[]
  [key: string]: unknown
}

// ==================== Shipment ====================

export interface Shipment {
  id?: Id
  shipment_id?: Id
  shipment_number?: string
  shipment_date?: string
  total_animals?: number
  total_shipped_animals?: number
  species?: ShipmentSpecies[]
  file_original_name?: string
  file_path?: string
  [key: string]: unknown
}

// ==================== Compliance Document ====================

export interface ComplianceDocument {
  id?: Id
  document_type_id?: Id
  file_path?: string
  file_original_name?: string
  issued_date?: string
  document_name?: string
  name?: string
  type?: string
  file_type?: string
  [key: string]: unknown
}

// ==================== Masters Data ====================

export interface IdentifierType {
  id: Id
  label: string
  key: string
}

export interface MastersData {
  genders?: string[][]
  appendix?: string[][]
  identifier_type?: IdentifierType[]
  document_type_id?: Id
}

export interface MastersDataFormatted {
  genders: SelectOption[]
  appendix: SelectOption[]
  identifierTypes: SelectOption[]
}

// ==================== Species Detail (for species module) ====================

export interface SpeciesShipmentDetail {
  id?: Id
  shipment_number?: string
  issued_date?: string
  total_animals?: number
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_imports?: number
  total_exports?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  animals?: ShipmentAnimal[]
  [key: string]: unknown
}

// ==================== Report Types ====================

export interface DiaryReport {
  id?: Id
  user_id?: Id
  user_name?: string
  date?: string
  report_type?: string
  [key: string]: unknown
}

export interface ObservationReport {
  id?: Id
  animal_id?: Id
  animal_name?: string
  observation?: string
  date?: string
  [key: string]: unknown
}

export interface EnclosureCountEntry {
  id?: Id
  enclosure_id?: Id
  enclosure_name?: string
  count?: number
  date?: string
  [key: string]: unknown
}

export interface DailyReport {
  id?: Id
  date?: string
  site_id?: Id
  [key: string]: unknown
}

export interface AnimalFilter {
  id?: Id
  animal_id?: Id
  name?: string
  species?: string
  [key: string]: unknown
}

export interface UserListing {
  id?: Id
  user_id?: Id
  first_name?: string
  last_name?: string
  name?: string
  profile_pic?: string
  [key: string]: unknown
}
