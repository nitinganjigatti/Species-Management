/**
 * Type declarations for utility components without TypeScript definitions
 * These are relaxed types to allow usage until the components are properly typed
 */

// Fix for @hookform/resolvers/yup import issue
declare module '@hookform/resolvers/yup' {
  import { Resolver } from 'react-hook-form'
  import { AnyObjectSchema } from 'yup'

  export function yupResolver<T extends AnyObjectSchema>(
    schema: T,
    options?: {
      mode?: 'async' | 'sync'
      rawValues?: boolean
      context?: unknown
    }
  ): Resolver<any>
}

declare module 'src/views/utility/Search' {
  import { FC, ChangeEvent, RefObject, Ref } from 'react'
  import { SxProps } from '@mui/material'

  interface SearchProps {
    value?: string
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    onClear?: () => void
    placeholder?: string
    width?: number | string
    sx?: SxProps
    textFielsSX?: SxProps
    backgroundColor?: string
    borderRadius?: string | number
    inputStyle?: Record<string, unknown>
    disabled?: boolean
    ref?: Ref<HTMLInputElement | null> | null
    [key: string]: unknown
  }

  const Search: FC<SearchProps>
  export default Search
}
declare module 'src/views/forms/form-fields/MUISearch' {
  import { FC, ChangeEvent, RefObject, Ref } from 'react'
  import { SxProps } from '@mui/material'
  interface MUISearchProps {
    value?: string
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    onClear?: () => void
    placeholder?: string
    width?: number | string
    sx?: SxProps
    textFielsSX?: SxProps
    backgroundColor?: string
    borderRadius?: string | number
    inputStyle?: Record<string, unknown>
    disabled?: boolean
    ref?: Ref<HTMLInputElement | null> | null
    [key: string]: unknown
  }
  const MUISearch: FC<MUISearchProps>
  export default MUISearch
}
declare module 'src/views/table/data-grid/CommonTable' {
  import { FC } from 'react'
  import { GridColDef, GridPaginationModel, GridSortModel, GridRowParams } from '@mui/x-data-grid'

  interface CommonTableProps<T = any> {
    indexedRows?: T[]
    columns?: GridColDef[]
    total?: number
    loading?: boolean
    paginationModel?: { page: number; pageSize: number }
    setPaginationModel?: (model: GridPaginationModel) => void
    handleSortModel?: (model: GridSortModel) => void
    pageSizeOptions?: number[]
    onRowClick?: (params: GridRowParams<T>) => void
    onCellClick?: (params: any) => void
    columnVisibilityModel?: Record<string, boolean>
    hideFooterPagination?: boolean
    getRowHeight?: () => number | string | 'auto'
    searchValue?: string
    externalTableStyle?: Record<string, unknown>
    getRowClassName?: (params: any) => string
    sortModel?: GridSortModel
    [key: string]: unknown
  }

  const CommonTable: FC<CommonTableProps>
  export default CommonTable
}

declare module 'src/views/table/data-grid/CommonDataGrid' {
  import { FC } from 'react'
  import { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'

  interface CommonDataGridProps {
    indexedRows?: unknown[]
    columns?: GridColDef[]
    total?: number
    loading?: boolean
    paginationModel?: { page: number; pageSize: number }
    setPaginationModel?: (model: GridPaginationModel) => void
    handleSortModel?: (model: GridSortModel) => void
    pageSizeOptions?: number[]
    onRowClick?: (params: unknown) => void
    onCellClick?: (params: unknown) => void
    columnVisibilityModel?: Record<string, boolean>
    hideFooterPagination?: boolean
    getRowHeight?: () => number | string | 'auto'
    searchValue?: string
    externalTableStyle?: Record<string, unknown>
    getRowClassName?: (params: unknown) => string
    sortModel?: GridSortModel
    [key: string]: unknown
  }

  const CommonDataGrid: FC<CommonDataGridProps>
  export default CommonDataGrid
}

declare module 'src/views/utility/FilterButtonWithNotification' {
  import { FC, ReactNode } from 'react'
  import { SxProps } from '@mui/material'

  interface FilterButtonWithNotificationProps {
    label?: string
    icon?: ReactNode
    iconPosition?: string
    iconSize?: number
    appliedFiltersCount?: number
    onClick?: () => void
    sx?: SxProps
    iconSx?: SxProps
    disabled?: boolean
    showTooltip?: boolean
    tooltipPlacement?: string
    [key: string]: unknown
  }

  const FilterButtonWithNotification: FC<FilterButtonWithNotificationProps>
  export default FilterButtonWithNotification
}

declare module 'src/views/pages/hospital/utility/hospitalSnippets' {
  import { FC, ReactNode } from 'react'

  interface MedicalIdChipProps {
    medId?: string | number
    leftImage?: boolean
    rightDot?: boolean
    backgroundColor?: string
    textColor?: string
    dotColor?: string
    fontSize?: string
    fontWeight?: number
    [key: string]: unknown
  }

  export const MedicalIdChip: FC<MedicalIdChipProps>

  interface CreatedByProps {
    profile_image?: string | null
    user_name?: string | null
    date?: string | null
    text_color?: string | null
    description?: string | null
    role?: string | null
    crby_width?: string | number | null
    size?: string
    show_time?: boolean
    dateType?: string | null
    [key: string]: unknown
  }

  export const CreatedBy: FC<CreatedByProps>

  interface SpeciesInfoCardProps {
    species?: {
      default_icon?: string
      common_name?: string
      scientific_name?: string
    }
    edit?: boolean
    [key: string]: unknown
  }

  export const SpeciesInfoCard: FC<SpeciesInfoCardProps>

  interface PatientSummaryCardProps {
    data?: Record<string, unknown>
    size?: string
    edit?: boolean
    valueColor?: string
    [key: string]: unknown
  }

  export const PatientSummaryCard: FC<PatientSummaryCardProps>
}

declare module 'src/views/pages/hospital/inpatient/ClinicalAssessmentCard' {
  import { FC } from 'react'

  interface ClinicalAssessmentCardProps {
    record?: Record<string, unknown>
    isDifferential?: boolean
    handleClick?: () => void
    isDischared?: boolean
    patientData?: Record<string, unknown>
    [key: string]: unknown
  }

  const ClinicalAssessmentCard: FC<ClinicalAssessmentCardProps>
  export default ClinicalAssessmentCard
}

declare module 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer' {
  import { FC } from 'react'

  interface ClinicalAssessmentShimmerProps {
    count?: number
    [key: string]: unknown
  }

  const ClinicalAssessmentShimmer: FC<ClinicalAssessmentShimmerProps>
  export default ClinicalAssessmentShimmer
}

declare module 'src/views/forms/form-fields/ControlledTextField' {
  import { FC } from 'react'
  import { Control, FieldErrors } from 'react-hook-form'

  interface ControlledTextFieldProps {
    name: string
    label?: string
    control: Control<any>
    errors?: FieldErrors<any>
    required?: boolean
    fullWidth?: boolean
    type?: string
    disabled?: boolean
    readOnly?: boolean
    placeholder?: string
    helperText?: string
    size?: string
    multiline?: boolean
    rows?: number
    maxRows?: number
    onChangeOverride?: (value: unknown) => void
    onKeyDown?: (e: unknown) => void
    onPaste?: (e: unknown) => void
    onInput?: (e: unknown) => void
    [key: string]: unknown
  }

  const ControlledTextField: FC<ControlledTextFieldProps>
  export default ControlledTextField
}

declare module 'src/views/forms/form-fields/ControlledTextArea' {
  import { FC } from 'react'
  import { Control, FieldErrors } from 'react-hook-form'

  interface ControlledTextAreaProps {
    name: string
    label?: string
    control: Control<any>
    errors?: FieldErrors<any>
    required?: boolean
    fullWidth?: boolean
    disabled?: boolean
    readOnly?: boolean
    rows?: number
    maxRows?: number
    placeholder?: string
    helperText?: string
    onChangeOverride?: (value: unknown) => void
    onKeyDown?: (e: unknown) => void
    onPaste?: (e: unknown) => void
    onInput?: (e: unknown) => void
    inputBackgroundColor?: string
    [key: string]: unknown
  }

  const ControlledTextArea: FC<ControlledTextAreaProps>
  export default ControlledTextArea
}

declare module 'src/views/forms/form-fields/ControlledDatePicker' {
  import { FC } from 'react'
  import { Control } from 'react-hook-form'
  import { Dayjs } from 'dayjs'

  interface ControlledDatePickerProps {
    name: string
    control: Control<any>
    label?: string
    required?: boolean
    minDate?: Dayjs
    maxDate?: Dayjs
    views?: ('year' | 'month' | 'day')[]
    disabled?: boolean
    sx?: Record<string, unknown>
    size?: string
    onChangeOverride?: () => void
    [key: string]: unknown
  }

  const ControlledDatePicker: FC<ControlledDatePickerProps>
  export default ControlledDatePicker
}

declare module 'src/views/forms/form-fields/ControlledTimePicker' {
  import { FC } from 'react'
  import { Control } from 'react-hook-form'

  interface ControlledTimePickerProps {
    name: string
    control: Control<any>
    label?: string
    required?: boolean
    disabled?: boolean
    sx?: Record<string, unknown>
    size?: string
    [key: string]: unknown
  }

  const ControlledTimePicker: FC<ControlledTimePickerProps>
  export default ControlledTimePicker
}

declare module 'src/views/forms/form-fields/ControlledSelect' {
  import { FC, ReactNode } from 'react'
  import { Control, FieldErrors } from 'react-hook-form'

  interface ControlledSelectProps {
    name: string
    label?: string
    control: Control<any>
    errors?: FieldErrors<any>
    options?: { value: string | number; label: string }[]
    required?: boolean
    fullWidth?: boolean
    disabled?: boolean
    placeholder?: string
    children?: ReactNode
    [key: string]: unknown
  }

  const ControlledSelect: FC<ControlledSelectProps>
  export default ControlledSelect
}

declare module 'src/views/forms/form-fields/ControlledAutocomplete' {
  import { FC } from 'react'
  import { Control, FieldErrors } from 'react-hook-form'

  interface ControlledAutocompleteProps {
    name: string
    label?: string
    control: Control<any>
    errors?: FieldErrors<any>
    options?: unknown[]
    getOptionLabel?: (option: unknown) => string
    isOptionEqualToValue?: (option: unknown, value: unknown) => boolean
    required?: boolean
    fullWidth?: boolean
    disabled?: boolean
    loading?: boolean
    onInputChange?: (query: string) => void
    onChange?: (value: unknown) => void
    placeholder?: string
    [key: string]: unknown
  }

  const ControlledAutocomplete: FC<ControlledAutocompleteProps>
  export default ControlledAutocomplete
}

declare module 'src/views/forms/form-fields/ControlledSwitch' {
  import { FC } from 'react'
  import { Control } from 'react-hook-form'

  interface ControlledSwitchProps {
    name: string
    control: Control<any>
    label?: string
    disabled?: boolean
    onChange?: (value: boolean) => void
    [key: string]: unknown
  }

  const ControlledSwitch: FC<ControlledSwitchProps>
  export default ControlledSwitch
}

declare module 'src/views/forms/form-fields/ControlledMultiFileUpload' {
  import { FC } from 'react'
  import { Control } from 'react-hook-form'

  interface ControlledMultiFileUploadProps {
    name: string
    control: Control<any>
    label?: string
    accept?: string
    multiple?: boolean
    maxFiles?: number
    disabled?: boolean
    [key: string]: unknown
  }

  const ControlledMultiFileUpload: FC<ControlledMultiFileUploadProps>
  export default ControlledMultiFileUpload
}

declare module 'src/views/utility/NewMediaCard' {
  import { FC } from 'react'
  import { SxProps } from '@mui/material'

  interface FilePreviewCardProps {
    fileUrl?: string
    fileName?: string
    fileType?: string
    user?: {
      created_at?: string
      user_profile?: {
        user_full_name?: string
        user_profile_pic?: string
      }
    }
    width?: string | number
    height?: string | number
    showTitle?: boolean
    showTitleIcon?: boolean
    onTitleIconClick?: () => void
    cardStyle?: SxProps
    onDeleteaction?: () => void
    ondownloadaction?: () => void
    downloadUrl?: string | null
    [key: string]: unknown
  }

  const FilePreviewCard: FC<FilePreviewCardProps>
  export default FilePreviewCard
}

declare module 'src/components/confirmation-dialog' {
  import { FC, ReactNode } from 'react'
  import { SxProps } from '@mui/material'

  interface ConfirmationDialogProps {
    image?: string | null
    icon?: string | null
    iconColor?: string | null
    title?: string | null
    loading?: boolean
    description?: string | ReactNode | null
    additionalDescription?: string | ReactNode | null
    dialogBoxStatus?: boolean
    onClose?: () => void
    formComponent?: ReactNode | null
    ConfirmationText?: string | null
    confirmAction?: () => void
    cancelText?: string | null
    confirmBtnStyle?: SxProps
    cancelBtnStyle?: SxProps
    imgStyle?: SxProps
    imgHeight?: string | number
    imgWidth?: string | number
    allowCancel?: boolean
    [key: string]: unknown
  }

  const ConfirmationDialog: FC<ConfirmationDialogProps>
  export default ConfirmationDialog
}

declare module 'src/components/drawers/CustomFilterDrawer' {
  import { FC, ReactNode } from 'react'

  interface CustomFilterDrawerProps {
    open?: boolean
    onClose?: () => void
    title?: string
    children?: ReactNode
    onSubmit?: () => void
    onClear?: () => void
    submitLabel?: string
    clearLabel?: string
    loading?: boolean
    [key: string]: unknown
  }

  const CustomFilterDrawer: FC<CustomFilterDrawerProps>
  export default CustomFilterDrawer
}

declare module 'src/views/utility/NoDataFound' {
  import { FC } from 'react'

  interface NoDataFoundProps {
    message?: string
    variant?: string
    height?: number
    width?: number
    [key: string]: unknown
  }

  const NoDataFound: FC<NoDataFoundProps>
  export default NoDataFound
}

declare module 'src/views/utility/UserAvatarDetails' {
  import { FC } from 'react'

  interface UserAvatarDetailsProps {
    profile_image?: string | null
    user_name?: string | null
    date?: string | null
    text_color?: string | null
    description?: string | null
    role?: string | null
    crby_width?: string | number | null
    size?: string
    show_time?: boolean
    dateType?: string | null
    [key: string]: unknown
  }

  const UserAvatarDetails: FC<UserAvatarDetailsProps>
  export default UserAvatarDetails
}

declare module 'src/views/utility/AnimalCard' {
  import { FC } from 'react'

  interface AnimalCardProps<T = unknown> {
    data?: T
    size?: string
    edit?: boolean
    valueColor?: string
    showSpecies?: boolean
    showEnclosure?: boolean
    sx?: SxProps
    [key: string]: unknown
  }

  const AnimalCard: FC<AnimalCardProps<any>>
  export default AnimalCard
}

declare module 'src/views/utility/SpeciesCard' {
  import { FC } from 'react'

  interface SpeciesCardProps {
    species?: {
      default_icon?: string
      common_name?: string
      scientific_name?: string
    }
    size?: string
    edit?: boolean
    [key: string]: unknown
  }

  const SpeciesCard: FC<SpeciesCardProps>
  export default SpeciesCard
}

declare module 'src/components/CustomSwitchTabs' {
  import { FC, SyntheticEvent } from 'react'

  interface SwitchTabOption {
    value: string
    label: string
  }

  interface CustomSwitchTabsProps {
    options?: SwitchTabOption[]
    value?: string | null
    onChange?: (event: SyntheticEvent, newValue: string | null) => void
    disabled?: boolean
    [key: string]: unknown
  }

  const CustomSwitchTabs: FC<CustomSwitchTabsProps>
  export default CustomSwitchTabs
}

declare module 'src/components/ProtectedRoute' {
  import { FC, ComponentType } from 'react'
  import { NextPage } from 'next'

  function enforceModuleAccess<P extends object>(Component: NextPage<P> | ComponentType<P>, settingKey: string): FC<P>

  export default enforceModuleAccess
}

declare module 'src/components/drawers/FilterContent' {
  import { FC } from 'react'

  interface FilterContentProps {
    menuName?: string
    leftMenu?: string[]
    selectedMenu?: string
    setSelectedMenu?: (menu: string) => void
    menuData?: Record<string, unknown[]>
    items?: unknown[]
    selectedOptions?: (string | number)[] | Record<string, unknown[]>
    setSelectedOptions?: (options: Record<string, unknown[]>) => void
    onOptionChange?: (...args: any[]) => void
    selectAllHandler?: () => void
    isAllSelected?: boolean
    searchQuery?: string
    setSearchQuery?: (query: string) => void
    onSearch?: (query: string) => void
    searchLoading?: boolean
    singleSelectMenus?: string[]
    isSingleSelect?: (menuName: string) => boolean
    [key: string]: unknown
  }

  const FilterContent: FC<FilterContentProps>
  export default FilterContent
}

declare module 'geolocation' {
  interface GeolocationModule {
    getCurrentPosition: (
      callback: (err: GeolocationPositionError | null, position: GeolocationPosition) => void
    ) => void
  }

  const geolocation: GeolocationModule
  export default geolocation
}

declare module 'src/views/utility/FallbackAvatar' {
  import type React from 'react'
  import type { SxProps, Theme } from '@mui/material'

  interface FallbackAvatarProps {
    src?: string
    variant?: string
    fallback?: string
    alt?: string
    size?: string | number
    sx?: SxProps<Theme>
    showSkeleton?: boolean
    onLoad?: () => void
    onError?: () => void
    [key: string]: unknown
  }

  const FallbackAvatar: React.FC<FallbackAvatarProps>
  export default FallbackAvatar
}

declare module 'src/views/utility/Layout/PageCardLayout' {
  import { FC, ReactNode } from 'react'
  import { SxProps } from '@mui/material'

  interface PageCardLayoutProps {
    title?: string | ReactNode
    subtitle?: string
    onClickOfSubtitle?: (() => void) | null
    showIcon?: boolean
    icon?: string
    onIconClick?: (() => void) | null
    action?: ReactNode
    cardStyles?: SxProps
    headerStyles?: SxProps
    contentStyles?: SxProps
    headerLayoutStyles?: SxProps
    titleStyles?: SxProps
    subtitleStyles?: SxProps
    headerTextContainerStyles?: SxProps
    iconStyles?: SxProps
    actionStyles?: SxProps
    headerLeftSectionStyles?: SxProps
    breadcrumbs?: ReactNode
    children?: ReactNode
    [key: string]: unknown
  }

  const PageCardLayout: FC<PageCardLayoutProps>
  export default PageCardLayout
}

declare module 'src/views/utility/DynamicBreadcrumbs' {
  import { FC } from 'react'
  import { SxProps } from '@mui/material'

  interface BreadcrumbItem {
    title: string
    href?: string
    onClick?: () => void
    active?: boolean
    segment?: string
  }

  interface DynamicBreadcrumbsProps {
    pageItems?: (string | BreadcrumbItem)[]
    sx?: SxProps
    lastBreadcrumbLabel?: string
    disableRoot?: boolean
    hiddenSegments?: string[]
    nonClickableSegments?: string[]
    [key: string]: unknown
  }

  const DynamicBreadcrumbs: FC<DynamicBreadcrumbsProps>
  export default DynamicBreadcrumbs
}

declare module 'src/views/pages/compliance/utility' {
  import { FC, ReactNode } from 'react'
  import { SxProps } from '@mui/material'

  interface DownloadReportProps {
    isDownloading?: boolean
    handleDownloadReport?: () => void
    customDownloadingText?: string
    customeMainText?: string
    containerStyles?: SxProps
    imgSrc?: string
    imgAlt?: string
    imgStyle?: Record<string, unknown>
    [key: string]: unknown
  }

  export const DownloadReport: FC<DownloadReportProps>
}
