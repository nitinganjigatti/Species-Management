/**
 * Component props types for the Housing module
 */

import { ReactNode, SyntheticEvent } from 'react'
import { GridPaginationModel } from '@mui/x-data-grid'
import {
  Site,
  SiteAnalytics,
  Section,
  SectionAnalytics,
  Enclosure,
  EnclosureStats,
  Animal,
  AnimalOverview,
  Species,
  Cluster,
  ClusterAnalytics,
  Note,
  NoteComment,
  ObservationType,
  ObservationMasterItem,
  Mortality,
  Treatment,
  Media,
  AnimalIdentifier,
  IdentifierType,
  AnimalIncident,
  AnimalDiet,
  AnimalHistoryItem,
  AnimalJournalLog,
  DrawerData,
  DrawerType,
  SelectOption,
  MannerOfDeathOption,
  CarcassConditionOption,
  CarcassDispositionOption,
  User
} from './models'
import {
  NotesFilters,
  SiteFilters,
  PaginationModel
} from './state'

// ==================== Base Drawer Props ====================

export interface BaseDrawerProps {
  open: boolean
  onClose: () => void
}

export interface BaseDrawerWithIdProps extends BaseDrawerProps {
  id?: number | string | null
}

export interface BaseDrawerWithDataProps extends BaseDrawerProps {
  data: DrawerData | null
}

// ==================== Site Drawer Props ====================

export interface AddSiteDrawerProps extends BaseDrawerProps {
  setSiteDrawer: (open: boolean) => void
  refetch: () => void
  siteData?: Site | null
}

// ==================== Section Drawer Props ====================

export interface SectionsDrawerProps extends BaseDrawerWithDataProps {
  defaultImage?: string
}

export interface AddSectionDrawerProps extends BaseDrawerProps {
  siteId: number | string
  refetch: () => void
  sectionData?: Section | null
}

// ==================== Enclosure Drawer Props ====================

export interface EnclosureDrawerProps extends BaseDrawerWithDataProps {
  defaultImage?: string
}

export interface AddEnclosureDrawerProps extends BaseDrawerProps {
  sectionId: number | string
  siteId?: number | string
  refetch: () => void
  enclosureData?: Enclosure | null
}

// ==================== Species Drawer Props ====================

export interface SpeciesDrawerProps extends BaseDrawerWithDataProps {
  defaultImage?: string
}

// ==================== Animals Drawer Props ====================

export interface AnimalsDrawerProps extends BaseDrawerWithDataProps {
  totalCount?: number
  defaultImage?: string
}

// ==================== Animal Detail Drawer Props ====================

export interface AnimalDrawerProps extends BaseDrawerWithDataProps {
  totalCount?: number
  defaultImage?: string
}

// ==================== Identifier Drawer Props ====================

export interface AddIdentifierDrawerProps extends BaseDrawerProps {
  setOpen: (open: boolean) => void
  identifierData: AnimalIdentifier | null
  animalId: number | string
  localIdentifierTypeData: IdentifierType[]
  setIdentifierData: (data: AnimalIdentifier | null) => void
  refetch: () => void
}

// ==================== Mortality Drawer Props ====================

export interface AnimalMortalityEditDrawerProps extends BaseDrawerProps {
  setDrawerOpen: (open: boolean) => void
  mortalityData: Mortality
  mannerOfDeath: SelectOption[]
  carcassCondition: SelectOption[]
  carcassDeposition: SelectOption[]
  refetch: boolean
  setRefetch: (value: boolean) => void
}

export interface AnimalRevokeDrawerProps extends BaseDrawerProps {
  setDrawerOpen: (open: boolean) => void
  mortalityId: number
}

// ==================== Note Drawer Props ====================

export interface NoteDetailsDrawerProps extends BaseDrawerProps {
  note: Note | null
  onUpdate?: () => void
}

export interface NoteFilterDrawerProps extends BaseDrawerProps {
  filters: NotesFilters
  onApply: (filters: NotesFilters) => void
  onClearAll: () => void
}

export interface AddNoteDrawerProps extends BaseDrawerProps {
  refType: 'site' | 'section' | 'enclosure' | 'animal'
  refId: number | string
  onSuccess?: () => void
}

export interface SelectNoteTypeDrawerProps extends BaseDrawerProps {
  observationTypes: ObservationType[]
  onSelect: (type: ObservationType) => void
  loading?: boolean
}

export interface NoteCommentDialogProps {
  open: boolean
  onClose: () => void
  note: Note | null
  onSubmit: (data: { observation_id: number; notes: string }) => void
  loading?: boolean
}

// ==================== Cluster Drawer Props ====================

export interface AddClusterDrawerProps extends BaseDrawerProps {
  refetch: () => void
  clusterData?: Cluster | null
}

// ==================== Card Component Props ====================

export interface SiteListingCardProps {
  site: Site
  onClick?: (site: Site) => void
}

export interface SectionCardProps {
  section: Section
  onClick?: (section: Section) => void
}

export interface EnclosureCardProps {
  enclosure: Enclosure
  onClick?: (enclosure: Enclosure) => void
}

export interface AnimalCardProps {
  animal: Animal
  onClick?: (animal: Animal) => void
}

export interface AnimalDetailsCardProps {
  animal: AnimalOverview | null
  loading?: boolean
}

export interface AnimalQRCardProps {
  animal: AnimalOverview | null
  loading?: boolean
}

export interface EnclosureDetailsCardProps {
  enclosure: EnclosureStats | null
  animal: AnimalOverview | null
  loading?: boolean
}

export interface HousingSpeciesCardProps {
  species: Species
  onClick?: (species: Species) => void
}

export interface SpeciesInnerCardProps {
  species: Species
  siteId?: number
  sectionId?: number
  enclosureId?: number
  onClick?: (species: Species) => void
}

export interface ClusterCardProps {
  cluster: Cluster
  onClick?: (cluster: Cluster) => void
}

// ==================== Listing Component Props ====================

export interface SiteListingProps {
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
  siteDrawer: boolean
  setSiteDrawer: (open: boolean) => void
  totalAnimalsCount?: number
}

export interface SectionListingProps {
  siteId: number | string
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

export interface SpeciesListingProps {
  siteId?: number | string
  sectionId?: number | string
  enclosureId?: number | string
}

export interface MortalityListingProps {
  siteId?: number | string
  sectionId?: number | string
}

export interface AnimalTreatmentListingProps {
  siteId?: number | string
  sectionId?: number | string
}

export interface MediaListingProps {
  siteId?: number | string
  sectionId?: number | string
  enclosureId?: number | string
}

export interface NotesListingProps {
  refType?: 'site' | 'section' | 'enclosure' | 'animal'
}

export interface EnclosureListingProps {
  sectionId: number | string
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

export interface EnclosureWiseEnclosureProps {
  enclosureId: number | string
}

export interface EnclosureWiseSpeciesProps {
  enclosureId: number | string
}

// ==================== Cluster Component Props ====================

export interface ClusterSitesProps {
  clusterId: number | string
}

export interface ClusterSpeciesProps {
  clusterId: number | string
}

export interface ClusterInchargesProps {
  clusterId: number | string
}

export interface SelectedSitesProps {
  selectedSites: Site[]
  onRemove: (siteId: number) => void
}

// ==================== Animal Component Props ====================

export interface AnimalOverviewProps {
  animalId: number | string
}

export interface AnimalHistoryProps {
  animalId: number | string
}

export interface AnimalMediaProps {
  animalId: number | string
}

export interface AnimalIdentifierProps {
  animalId?: number | string
}

export interface AnimalMortalityProps {
  animalDetails: AnimalOverview | null
}

export interface AnimalDietProps {
  animalId: number | string
}

export interface AnimalJournalsProps {
  animalId: number | string
}

export interface JournalFilterProps {
  onApply: (filters: { fromDate?: string; toDate?: string; types?: string[] }) => void
  onReset: () => void
}

export interface UploadAnimalDietProps {
  animalId: number | string
  onSuccess?: () => void
}

export interface AnimalIncidentsProps {
  animalId: number | string
}

export interface CreateMissingIncidentProps {
  animalId: number | string
  onSuccess?: () => void
  onClose: () => void
}

export interface IncidentDetailsCardProps {
  incident: AnimalIncident
  onEdit?: (incident: AnimalIncident) => void
}

export interface MissReportIncidentFormProps {
  animalId: number | string
  onSubmit: (data: Record<string, unknown>) => void
  loading?: boolean
}

export interface ReportFoundFormProps {
  incidentId: number | string
  onSubmit: (data: Record<string, unknown>) => void
  loading?: boolean
}

// ==================== Header Component Props ====================

export interface ListingHeaderProps {
  title: string
  totalCount?: number
  showCount?: boolean
}

export interface CustomDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number | string
}

// ==================== Navigation Component Props ====================

export interface HousingNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

// ==================== Page Component Props ====================

export interface SitesPageProps {
  initialFilters?: SiteFilters
}

export interface SiteDetailsPageProps {
  siteId: number | string
}

export interface SectionDetailsPageProps {
  sectionId: number | string
}

export interface EnclosureDetailsPageProps {
  enclosureId: number | string
}

export interface AnimalDetailsPageProps {
  animalId: number | string
}

export interface ClusterPageProps {
  initialFilters?: Record<string, unknown>
}

export interface ClusterDetailsPageProps {
  clusterId: number | string
}

// ==================== Table/Grid Component Props ====================

export interface HousingDataGridProps {
  rows: Record<string, unknown>[]
  loading: boolean
  paginationModel: GridPaginationModel
  onPaginationModelChange: (model: GridPaginationModel) => void
  totalRows: number
  onRowClick?: (row: Record<string, unknown>) => void
  onCellClick?: (params: Record<string, unknown>) => void
}

// ==================== Utility Component Props ====================

export interface SearchProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
}

export interface UserAvatarDetailsProps {
  profile_image?: string
  user_name?: string
  size?: number
}
