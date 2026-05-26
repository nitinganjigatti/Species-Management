/**
 * Component prop interfaces for the Egg module
 */

import { ReactNode } from 'react'
import { EggItem, IncubatorItem, IncubatorRoomItem, NurseryItem, SpeciesItem, DiscardItem } from './models'

// ==================== Reusable Component Props ====================

export interface EditEggInfoProps {
  eggDetails: EggItem | null
  openEditDrawer: boolean
  closeEditDrawer: () => void
  getDetails: (eggId: string | number) => Promise<void>
}

export interface DiscardFormProps {
  open: boolean
  onClose: () => void
  eggId?: string | number
  onSuccess?: () => void
  refetch?: () => void
}

export interface DiscardStatusCellProps {
  params: any
  setIsOpen: (open: boolean) => void
  handleDiscard: (e: React.MouseEvent<HTMLButtonElement>, eggId: string | number) => void
  setEggId: (id: string | number) => void
  hideField?: string
  customButton?: string
  handleAction: (e: React.MouseEvent<HTMLButtonElement>, params: any) => void
  condition: string
  setAllocationValues?: (values: Record<string, any>) => void
}

export interface EggDiscardedProps {
  selectedTab?: string
  onTabChange?: (tab: string) => void
  filters?: Record<string, any>
}

export interface AddGalleryProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  onUploadSuccess?: () => void
  refetch?: () => void
}

export interface AddIncubatorRoomProps {
  open: boolean
  onClose: () => void
  sectionId?: string | number
  onSuccess?: () => void
  refetch?: () => void
}

export interface NurseryAddComponentProps {
  open: boolean
  onClose: () => void
  nurseryId?: string | number
  onSuccess?: () => void
  refetch?: () => void
}

export interface EnclosureSelectionDialogProps {
  open: boolean
  handleClose: (value?: boolean) => void
  getEnclosureDetails: (enclosure: Record<string, any>) => void
  selectedEnclosureId?: string | number
  animalType?: string
}

export interface DetailCardProps {
  title: string
  content: ReactNode
  icon?: string
  action?: ReactNode
  loading?: boolean
  variant?: 'outlined' | 'elevated'
}

export interface ImageTextCardProps {
  image?: string
  title: string
  description?: string
  subtitle?: string
  onClick?: () => void
  action?: ReactNode
  loading?: boolean
}

// ==================== View Component Props ====================

export interface EggTableHeaderProps {
  selectedCount?: number
  totalCount?: number
  onSearch?: (query: string) => void
  onFilter?: () => void
  onAddClick?: () => void
  onDeleteClick?: () => void
  onExportClick?: () => void
  loading?: boolean
}

export interface EggFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApply: (filters: Record<string, any>) => void
  filters?: Record<string, any>
}

export interface ConditionSliderProps {
  getActivityLogsFunc?: () => Promise<void>
  eggDetails: EggItem | null
  setOpenDrawer: (open: boolean) => void
  openDrawer: boolean
  eggId?: string | number
  getDetails: (eggId: string | number) => Promise<void>
  GetGalleryImgList?: () => Promise<void>
}

export interface AllocationSliderProps {
  setOpenDrawer: (open: boolean) => void
  allocateEggId?: string | number
  callApi?: () => Promise<void>
  allocationValues?: Record<string, any>
  getDetails?: (eggId: string | number) => Promise<void>
}

export interface DashboardSliderProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  onSuccess?: () => void
}

export interface DiscardEggSliderProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  onSuccess?: () => void
  refetch?: () => void
}

export interface DashboardFilterProps {
  onFilter: (filters: Record<string, any>) => void
  filters?: Record<string, any>
}

export interface NecropsySliderProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  onSuccess?: () => void
}

export interface CreateAnimalSliderProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  eggDetails?: EggItem | null
  onSuccess?: () => void
  refetch?: () => void
}

// ==================== Egg Detail Sub-Component Props ====================

export interface EggHeroSectionProps {
  getActivityLogsFunc?: () => Promise<void>
  eggDetails: EggItem | null
  getDetails: (eggId: string | number) => Promise<void>
  GetGalleryImgList?: () => Promise<void>
  handleBackButton: () => void
}

export interface EggFirstSectionProps {
  eggDetails: EggItem | null
  onDataChange?: (data: Partial<EggItem>) => void
}

export interface EggSecondSectionProps {
  eggDetails: EggItem | null
  assessments?: Record<string, any>[]
  onAddAssessment?: () => void
}

export interface EggImageGalleryProps {
  eggId: string | number
  images?: Record<string, any>[]
  onAddImage?: () => void
  onDeleteImage?: (imageId: string | number) => void
}

export interface EggActivityLogsProps {
  eggId: string | number
  logs?: Record<string, any>[]
  loading?: boolean
}

export interface EggCommentProps {
  eggId: string | number
  comments?: Record<string, any>[]
  onAddComment?: (comment: string) => void
  onDeleteComment?: (commentId: string | number) => void
}

export interface ProbableParentProps {
  eggDetails: EggItem | null
  onParentSelect?: (parentId: string | number) => void
}

export interface AnimalDetailsProps {
  eggDetails: EggItem | null
  animalData?: Record<string, any>
  onEditClick?: () => void
}

export interface StatusDialogBoxProps {
  open: boolean
  onClose: () => void
  currentStatus?: string | number
  onStatusChange: (newStatus: string | number) => void
  eggId: string | number
}

export interface TransferEggProps {
  open: boolean
  onClose: () => void
  eggId: string | number
  onSuccess?: () => void
}

export interface TransferIncubatorProps {
  open: boolean
  onClose: () => void
  incubatorId: string | number
  onSuccess?: () => void
}

export interface EditRedirectionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  message?: string
}

// ==================== Dashboard Component Props ====================

export interface EggsStatsProps {
  dateRange?: [string, string]
  onDateChange?: (range: [string, string]) => void
}

export interface SpeciesProps {
  loading?: boolean
  onSelect?: (species: SpeciesItem) => void
}

export interface TodaysCollectionProps {
  loading?: boolean
  data?: Record<string, any>[]
}

export interface TransferDetailsProps {
  loading?: boolean
  data?: Record<string, any>[]
}

export interface ExportDashboardDataExcelProps {
  data: Record<string, any>[]
  fileName?: string
}

// ==================== Discard Component Props ====================

export interface DiscardDetailProps {
  discardId: string | number
  onClose: () => void
}

export interface DiscardDialogBoxProps {
  open: boolean
  onClose: () => void
  discardId: string | number
  onSuccess?: () => void
}

export interface DiscardedTableViewProps {
  data: DiscardItem[]
  loading?: boolean
  onRowClick?: (discardId: string | number) => void
  onDeleteClick?: (discardId: string | number) => void
}

// ==================== Incubator Component Props ====================

export interface AddIncubatorsProps {
  sectionId?: string | number
  onSuccess?: () => void
  refetch?: () => void
}

// ==================== Species Component Props ====================

export interface SpeciesFirstSectionProps {
  speciesId: string | number
  loading?: boolean
}
