import type { SxProps } from '@mui/material'
import type { ReactNode } from 'react'
import type {
  Id,
  SelectOption,
  ExportPermit,
  ExportSpecies,
  ExportSpeciesFormItem,
  ImportPermit,
  Shipment,
  ShipmentSpecies,
  Species,
  ComplianceDocument,
  TradeParty,
  DocumentType,
} from './models'

// ==================== Shared ====================

export interface BaseDrawerProps {
  open: boolean
  onClose: () => void
}

// ==================== LinkedImports ====================

export interface LinkedImportsProps {
  imports?: ImportPermit[]
}

// ==================== LinkedShipments ====================

export interface LinkedShipmentsProps {
  shipments?: Shipment[]
  totalShipped?: number
  totalAllowed?: number
  selectedExportData?: ExportPermit | null
}

// ==================== SpeciesDetail ====================

export interface SpeciesDetailProps {
  species?: ExportSpecies[]
  speciesCount?: number
  animalsCount?: number
}

// ==================== SupportingDocuments ====================

export interface SupportingDocumentsProps {
  isFetching?: boolean
  documentList?: ComplianceDocument[]
  totalCount?: number
  onAddEditSuccess?: () => void
  type?: string
}

// ==================== Drawer Components ====================

export interface AnimalDetailDrawerProps extends BaseDrawerProps {
  specie?: ExportSpecies | null
}

export interface DocumentUploadDrawerProps extends BaseDrawerProps {
  documentType?: string | null
  documentData?: ComplianceDocument | null
  onSuccess?: (data: unknown) => void
  exportId?: Id
}

export interface FiltersDrawerProps {
  openFilterDrawer?: boolean
  onCloseFilterDrawer?: () => void
  onSubmitLoading?: boolean
  onApplyFilters?: (filters: FilterSelectedOptions) => void
  setFilterCount?: (count: number) => void
  initialSelectedOptions?: FilterSelectedOptions | null
  contextId?: Id
}

export type FilterMenuKey = 'Species' | 'Exporting country' | 'Exporter' | 'Importer' | 'Documents'

export type FilterSelectedOptions = Record<FilterMenuKey | string, (string | number)[]>

export type FilterMenuData = Record<FilterMenuKey | string, SelectOption[]>

export interface ShippedAnimalsDrawerProps extends BaseDrawerProps {
  shipment?: Shipment | null
  specieIndex?: number
  selectedExportData?: ExportPermit | null
}

export interface SpeciesDrawerProps extends BaseDrawerProps {
  data?: {
    name?: string
    image?: string
    params?: Record<string, unknown>
    queryKey?: string
    id?: string
  } | null
  onSelect: (species: Species[]) => void
  selectedSpecies?: Species[]
  title?: string
}

export interface SpeciesExportDocumentDrawerProps extends BaseDrawerProps {
  shipmentId?: Id
  shipmentNumber?: string
}

export interface SpeciesExportDrawerProps extends BaseDrawerProps {
  shipmentId?: Id
  shipmentNumber?: string
  type?: string
  speciesId?: Id
}

export interface SpeciesShipmentDetailsDrawerProps extends BaseDrawerProps {
  speciesId?: Id
  shipmentId?: Id
}

export interface SpeciesShipmentFilterDrawerProps {
  open?: boolean
  onClose?: () => void
  onSubmitLoading?: boolean
  onApplyFilters?: (filters: FilterSelectedOptions) => void
  setFilterCount?: (count: number) => void
  initialSelectedOptions?: FilterSelectedOptions | null
}

// ==================== Tab Components ====================

export interface AntzDatabaseTabProps {
  data?: {
    name?: string
    image?: string
    params?: Record<string, unknown>
    [key: string]: unknown
  } | null
  selectedItems: Species[]
  onToggle: (species: Species) => void
  prevSelectedItems: Species[]
}

export interface NewSpeciesTabProps {
  selectedItems: Species[]
  onToggle: (species: Species) => void
  prevSelectedItems: Species[]
  onAddSpecies: (species: Species) => void
}

// ==================== Form Components ====================

export interface ExportPermitDetailsProps {
  control: import('react-hook-form').Control<ExportPermitFormValues>
  errors: import('react-hook-form').FieldErrors<ExportPermitFormValues>
  isEdit?: boolean
}

export interface ExportPermitAnimalsProps {
  control: import('react-hook-form').Control<ExportPermitFormValues>
  errors: import('react-hook-form').FieldErrors<ExportPermitFormValues>
  speciesList: ExportSpeciesFormItem[]
  handleSpeciesUpdate: (speciesId: Id, updatedSpecies: ExportSpeciesFormItem) => void
  handleRemoveSpecies: (speciesId: Id) => void
  setSpeciesDrawerOpen: (open: boolean) => void
  genderOptions: SelectOption[]
  appendixOptions: SelectOption[]
  identifierOptions: SelectOption[]
  setSpeciesList: (list: ExportSpeciesFormItem[]) => void
  setValue: import('react-hook-form').UseFormSetValue<ExportPermitFormValues>
  isEdit?: boolean
}

export interface ExportPermitFormProps {
  onSubmit: (id?: Id) => void
  id?: Id
  exportData?: ExportPermit | null
  isLoading?: boolean
}

export interface ExportPermitFormValues {
  export_number: string
  export_date: Date | null
  issued_date: import('dayjs').Dayjs | null
  valid_until: import('dayjs').Dayjs | null
  export_purpose: string
  destination_country: SelectOption | null
  exporting_country: SelectOption | null
  origin_country: SelectOption | null
  importer_name: SelectOption | null
  exporter_name: SelectOption | null
  speciesList: ExportSpeciesFormItem[]
  certificate_file?: File | { document_type_id?: Id; file_path?: string; name?: string } | null
}

// ==================== Navigation ====================

export interface ComplianceNavItem {
  title: string
  path?: string
  icon?: string
  children?: ComplianceNavItem[]
  [key: string]: unknown
}

// ==================== Utility ====================

export interface DownloadReportProps {
  isDownloading?: boolean
  handleDownloadReport?: () => void
  customDownloadingText?: string
  customeMainText?: string
  containerStyles?: SxProps
  imgSrc?: string
  imgAlt?: string
  imgStyle?: Record<string, unknown>
}

// ==================== File Uploader ====================

export interface ComplianceFileUploaderProps {
  name: string
  file?: File | { name?: string; file_original_name?: string } | null
  onFileUpload: (file: File | null) => void
}
