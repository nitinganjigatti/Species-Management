import type {
  Id,
  SelectOption,
  TradeParty,
  DocumentType,
  TradeContextType,
  Species,
  MasterSpecies,
  ExportPermit,
  ExportSpecies,
  ImportPermit,
  ImportSpecies,
  Shipment,
  ShipmentSpecies,
  ComplianceDocument,
  MastersData,
  DiaryReport,
  ObservationReport,
  EnclosureCountEntry,
  AnimalFilter,
  UserListing,
} from './models'

// ==================== Generic ====================

export interface ApiResponse<T = unknown> {
  success?: boolean
  status?: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  result?: T[]
  list?: T[]
  records?: T[]
  data?: T[]
  items?: T[]
  total_count?: number
  total?: number
  page?: number
  limit?: number
}

export interface PaginationParams {
  page?: number
  page_no?: number
  limit?: number
  search?: string
  q?: string
  status?: number | string
}

export type ApiError = {
  message?: string
  response?: {
    data?: { message?: string }
    status?: number
    headers?: Record<string, string>
  }
}

// ==================== Exports API ====================

export interface GetSpeciesListParams extends PaginationParams {
  context_id?: Id
}

export type GetSpeciesListResponse = ApiResponse<{
  data?: Species[]
  total_count?: number
}>

export interface GetExportListParams extends PaginationParams {
  start_date?: string
  end_date?: string
  species?: Id[]
  exporting_country?: string[]
  exporter?: Id[]
  importer?: Id[]
  document?: Id[]
  sort_by?: string
  sort_order?: string
}

export type GetExportListResponse = ApiResponse<{
  records?: ExportPermit[]
  total_count?: number
}>

export type GetExportDetailsResponse = ApiResponse<ExportPermit>

export type GetLinkedShipmentDetailsResponse = ApiResponse<Shipment[]>

export type GetLinkedImportsDetailsResponse = ApiResponse<ImportPermit[]>

export interface AddExportPayload {
  export_number?: string
  origin_country?: string
  exporting_country?: string
  exporter_name?: string
  importer_name?: string
  exporter_id?: Id
  importer_id?: Id
  export_purpose?: string
  issued_date?: string | null
  valid_until?: string | null
  document_type_id?: Id
  species?: string
  attachment?: File
}

export type AddExportResponse = ApiResponse<{ id?: Id }>

export type GetDocumentTypeListResponse = ApiResponse<{
  records?: DocumentType[]
  items?: ComplianceDocument[]
  total?: number
}>

export type GetMastersDataResponse = ApiResponse<MastersData>

// ==================== Imports API ====================

export interface GetImportsListParams extends PaginationParams {
  start_date?: string
  end_date?: string
  sort_by?: string
  sort_order?: string
}

export type GetImportsListResponse = ApiResponse<{
  records?: ImportPermit[]
  total_count?: number
}>

export interface CreateImportSpeciesPayload {
  import_id?: Id
  species?: string
  [key: string]: unknown
}

export interface GetImportSpeciesDataParams extends PaginationParams {
  [key: string]: unknown
}

// ==================== Shipment API ====================

export interface GetShipmentListParams extends PaginationParams {
  start_date?: string
  end_date?: string
  sort_by?: string
  sort_order?: string
}

export type GetShipmentListResponse = ApiResponse<{
  records?: Shipment[]
  total_count?: number
}>

export interface AddShipmentPayload {
  shipment_number?: string
  shipment_date?: string
  document_type_id?: Id
  [key: string]: unknown
}

export type GetShipmentBasicDetailsResponse = ApiResponse<Shipment>

export type GetExportAnimalListResponse = ApiResponse<{
  species?: ShipmentSpecies[]
  [key: string]: unknown
}>

export interface CreateShipmentSpeciesPayload {
  [key: string]: unknown
}

export type GetShipmentSpeciesDataResponse = ApiResponse<{
  species?: ShipmentSpecies[]
  [key: string]: unknown
}>

// ==================== Species API ====================

export interface GetSpeciesDataParams extends PaginationParams {
  [key: string]: unknown
}

export type GetSpeciesDataResponse = ApiResponse<{
  records?: Species[]
  total_count?: number
}>

export interface GetSpeciesShipmentListParams {
  params?: PaginationParams
  id: Id
}

export type GetSpeciesShipmentListResponse = ApiResponse<{
  records?: Shipment[]
  total_count?: number
}>

export interface GetSpeciesShipmentDetailsParams {
  speciesId: Id
  shipmentId: Id
}

// ==================== Reports API ====================

export interface GetUserListingParams extends PaginationParams {}

export type GetUserListingResponse = ApiResponse<{
  records?: UserListing[]
  total?: number
}>

export interface GetDiaryReportParams extends PaginationParams {
  start_date?: string
  end_date?: string
  user_id?: Id
  [key: string]: unknown
}

export type GetDiaryReportResponse = ApiResponse<{
  records?: DiaryReport[]
  total?: number
}>

export interface GetAnimalListForObservationReportBody {
  site_id?: Id
  section_id?: Id
  enclosure_id?: Id
  [key: string]: unknown
}

export interface GetObservationReportParams extends PaginationParams {
  start_date?: string
  end_date?: string
  animal_id?: Id
  observation_type?: Id
  [key: string]: unknown
}

export type GetObservationReportResponse = ApiResponse<{
  records?: ObservationReport[]
  total?: number
}>

export interface GetAnimalFilterListParams extends PaginationParams {
  [key: string]: unknown
}

export type GetAnimalFilterListResponse = ApiResponse<{
  records?: AnimalFilter[]
  total?: number
}>

export interface GetEnclosureCountRegisterParams extends PaginationParams {
  start_date?: string
  end_date?: string
  site_id?: Id
  section_id?: Id
  enclosure_id?: Id
  [key: string]: unknown
}

export type GetEnclosureCountRegisterResponse = ApiResponse<{
  records?: EnclosureCountEntry[]
  total?: number
}>

export interface GetComplianceDailyReportParams {
  start_date?: string
  end_date?: string
  site_id?: Id
  [key: string]: unknown
}

export interface GetObservationMasterTypeParams extends PaginationParams {}

// ==================== Masters API ====================

export interface GetDocumentTypeListParams extends PaginationParams {
  context_id?: Id
  status?: number | string
  id?: Id
  type?: string
}

export type GetDocumentTypeListMastersResponse = ApiResponse<{
  records?: DocumentType[]
  total?: number
}>

export interface GetMasterImportsParams extends PaginationParams {
  type?: 'exporter' | 'importer' | string
}

export type GetMasterImportsResponse = ApiResponse<{
  data?: TradeParty[]
  total?: number
}>

export interface CreateTradePartiesPayload {
  name?: string
  type?: string
  address?: string
  country?: string
  [key: string]: unknown
}

export interface UpdateTradePartiesPayload extends CreateTradePartiesPayload {}

export interface AddDocumentTypePayload {
  name?: string
  context_id?: Id
  status?: number
  [key: string]: unknown
}

export type GetTradeContextTypesResponse = ApiResponse<TradeContextType[]>
