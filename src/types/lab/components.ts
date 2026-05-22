import type { MouseEvent, SyntheticEvent } from 'react'
import type {
  Lab,
  LabSampleWithTests,
  LabPermissions,
  FileAttachment,
  FileViews,
  MedicalNote,
  AnimalDetail,
  TestReport,
  RequestItem,
  EditParams
} from './models'

// ==================== CommonMediaView ====================

export interface CommonMediaViewProps {
  type?: string
  image?: FileAttachment[]
  document?: FileAttachment[]
  handleDeleteImg: (e: MouseEvent<Element, MouseEvent> | SyntheticEvent, item: FileAttachment) => Promise<void>
  fileViews?: FileViews
  permissions?: LabPermissions | null
  deleteAttachmentLoader?: boolean
  allCompleted?: boolean
}

// ==================== ShowLabCard ====================

export interface ShowLabCardProps {
  data?: Lab
}

// ==================== Site ====================

export interface SiteProps {
  labId?: string | string[] | number
}

// ==================== Tests ====================

export interface TestsProps {
  labTest?: LabSampleWithTests[]
}

// ==================== Users ====================

export interface UsersProps {
  labId?: string | string[] | number
}

// ==================== MedicalRecordNotes ====================

export interface MedicalRecordNotesProps {
  notes?: MedicalNote[]
}

// ==================== UploadReports ====================

export interface UploadReportsProps {
  animalID?: string | number
  labTestId?: string | number
  medicalRecordId?: string | number
  type?: string
  id?: string | number
  handleCloseUploader: ((value: boolean) => void) | React.Dispatch<React.SetStateAction<boolean>>
  restrictExecutiveFiles?: boolean
  fetchRequestDetails: () => void
  buttonText?: string
  handleClosePopover?: () => void
}

// ==================== AnimalCard ====================

export interface AnimalCardProps {
  animalDetails?: AnimalDetail
}

// ==================== AnimalSideSheet ====================

export interface AnimalSideSheetProps {
  openAnimalSheet: boolean
  setOpenAnimalSheet: (value: boolean) => void
  request: RequestItem[]
}

// ==================== AttachmentSheet ====================

export interface AttachmentSheetProps {
  openAttachmentSheet: boolean
  setOpenAttachmentSheet: (value: boolean) => void
  testDoc?: FileAttachment[]
  testImage?: FileAttachment[]
  fileViews?: FileViews
  handleDeleteImg: (e: MouseEvent<Element, MouseEvent> | SyntheticEvent, item: FileAttachment) => Promise<void>
  permissions?: LabPermissions | null
  image?: FileAttachment[]
  document?: FileAttachment[]
  deleteAttachmentLoader?: boolean
  allCompleted?: boolean
}

// ==================== CommentSideSheet ====================

export interface CommentSideSheetProps {
  openCommentSheet: boolean
  setOpenCommentSheet: (value: boolean) => void
  CommentData: TestReport
  api: () => void
}

// ==================== AddMortalityReasons (view) ====================

export interface AddMortalityReasonsProps {
  addEventSidebarOpen: boolean
  setOpenDrawer: (value: boolean) => void
  handleSubmitData: (payload: { name: string }) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
}

// ==================== AddSample (view) ====================

export interface AddSampleProps {
  addEventSidebarOpen: boolean
  setOpenDrawer: (value: boolean) => void
  handleSubmitData: (payload: Record<string, unknown>) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
}

// ==================== SampleDetails (view) ====================

export interface SampleDetailsProps {
  addEventSidebarOpen: boolean
  setOpenDetailsDrawer: (value: boolean) => void
  setOpenDrawer: (value: boolean) => void
  submitLoader?: boolean
  editParams: EditParams
  fetchTableData: () => Promise<void>
}

// ==================== AddTest (view) ====================

export interface AddTestProps {
  addEventSidebarOpen: boolean
  setOpenDrawer: (value: boolean) => void
  handleSubmitData: (payload: Record<string, unknown> | FormData) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
}

// ==================== TestDetails (view) ====================

export interface TestDetailsProps {
  addEventSidebarOpen: boolean
  setOpenDetailsDrawer: (value: boolean) => void
  setOpenDrawer: (value: boolean) => void
  submitLoader?: boolean
  editParams: EditParams
  fetchTableData: () => Promise<void>
}

// ==================== Navigation ====================

export interface LabNavChildItem {
  title: string
  path: string
}

export interface LabNavItem {
  sectionTitle?: string
  title?: string
  path?: string
  icon?: string
  children?: LabNavChildItem[]
  // When true, the vertical/horizontal nav renderers set `target="_blank"`
  // so the link opens in a new tab. Used for external URLs like LIMS.
  openInNewTab?: boolean
}

export interface LabNavigationProps {
  labRole?: unknown
}
