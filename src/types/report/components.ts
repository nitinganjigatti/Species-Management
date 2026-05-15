import { Dispatch, SetStateAction, SyntheticEvent } from 'react'
import {
  ReportItem,
  DateFilter,
  FilterItems,
  SpeciesItem,
  AssessmentTypeItem,
  Keeper,
  AnimalWise,
  SectionItem,
  EnclosureItem,
  SiteData,
  PaginationModel
} from './models'

export interface DailyReportViewProps {
  activeTab: number
  onTabChange: (event: SyntheticEvent, newValue: number) => void
  pastReports: ReportItem[]
  upcomingReports: ReportItem[]
  pastDateFilter: DateFilter
  upcomingDateFilter: DateFilter
  onPastDateChange: (startDate: Date | null, endDate: Date | null) => void
  onUpcomingDateChange: (startDate: Date | null, endDate: Date | null) => void
  downloadingRowId: number | string | null
  onDownload: (report: ReportItem) => void
  loading: boolean
}

export interface CategoryCardProps {
  category: string
  categoryIcon?: string | null
  reports: ReportItem[]
  downloadingRowId: number | string | null
  onDownload: (report: ReportItem) => void
}

export interface AssessmentReportFilterDrawerProps {
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  openFilterDrawer: boolean
  setOpenFilterDrawer: Dispatch<SetStateAction<boolean>>
  tabsforfilter: string[]
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<string>>
  setFilterCount: Dispatch<SetStateAction<number>>
  openSiteListDrawer: boolean
  setSiteListDrawer: Dispatch<SetStateAction<boolean>>
  selectedSections: (string | number)[]
  setSelectedSections: Dispatch<SetStateAction<(string | number)[]>>
  selectedEnclosures: (string | number)[]
  setSelectedEnclosures: Dispatch<SetStateAction<(string | number)[]>>
  siteData: SiteData[]
  selectedItems: FilterItems
  setSelectedItems: Dispatch<SetStateAction<FilterItems>>
  tempSelectedItems: FilterItems
  setTempSelectedItems: Dispatch<SetStateAction<FilterItems>>
  sectionsData: SectionItem[]
  setSectionsData: Dispatch<SetStateAction<SectionItem[]>>
  enclosuresData: EnclosureItem[]
  setEnclosuresData: Dispatch<SetStateAction<EnclosureItem[]>>
}

export interface SelectSitesProps<T extends { Site: (string | number)[] }> {
  openSiteListDrawer: boolean
  setSiteListDrawer: (open: boolean) => void
  siteData: SiteData[]
  setSearchTerm: (term: string) => void
  searchTerm: string
  tempSelectedItems: T
  setTempSelectedItems: (items: T) => void
}

export interface AssessmentSpeciesListingDrawerProps {
  selectedSpecies: SpeciesItem[]
  setSelectedSpecies: Dispatch<SetStateAction<SpeciesItem[]>>
  openspeciesFilter: boolean
  setOpenspeciesFilter: Dispatch<SetStateAction<boolean>>
  selectAllActive: boolean
  setSelectAllActive: Dispatch<SetStateAction<boolean>>
  isSearchResult: boolean
  setIsSearchResult: Dispatch<SetStateAction<boolean>>
}

export interface AssessmentTypeListingDrawerProps {
  selectedCategory: number
  setSelectedCategory: Dispatch<SetStateAction<number>>
  selectedAssessmentType: AssessmentTypeItem | ''
  setSelectedAssessmentType: Dispatch<SetStateAction<AssessmentTypeItem | ''>>
  openassessmentFilter: boolean
  setOpenAssessmentFilter: Dispatch<SetStateAction<boolean>>
}

export interface UserWiseListProps {
  data: Keeper[]
  pagination: PaginationModel
  loading: boolean
  onPaginationChange: (model: PaginationModel) => void
}

export interface AnimalWiseListProps {
  data: AnimalWise[]
  pagination: PaginationModel
  loading: boolean
  onPaginationChange: (model: PaginationModel) => void
}

export interface UserAnimalsDrawerProps {
  open: boolean
  onClose: () => void
  user: Keeper
}

export interface AnimalCaretakersDrawerProps {
  open: boolean
  onClose: () => void
  animal: AnimalWise
}

export interface TabBadgeProps {
  label: string
  totalCount: number | null
}
