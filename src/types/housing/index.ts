/**
 * Housing Module Types
 *
 * This module exports all TypeScript types for the housing module.
 * Import types from 'src/types/housing' for use throughout the application.
 */

// ==================== Model Types ====================
export type {
  // Site
  Site,
  SiteImage,
  IndexedSiteRow,
  SiteAnalytics,

  // Section
  Section,
  SectionImage,
  IndexedSectionRow,
  SectionAnalytics,

  // Enclosure
  Enclosure,
  EnclosureImage,
  IndexedEnclosureRow,
  EnclosureType,
  EnclosureSetting,
  EnclosureStats,

  // Animal
  Animal,
  AnimalImage,
  IndexedAnimalRow,
  AnimalOverview,

  // Species
  Species,
  IndexedSpeciesRow,

  // Cluster
  Cluster,
  ClusterImage,
  ClusterIncharge,
  IndexedClusterRow,
  ClusterAnalytics,

  // Notes / Observations
  Note,
  NoteImage,
  NoteAttachment,
  TaggedUser,
  NoteComment,
  IndexedNoteRow,
  ObservationType,
  ObservationMasterItem,

  // Mortality
  Mortality,
  IndexedMortalityRow,

  // Treatment
  Treatment,
  IndexedTreatmentRow,

  // Media
  Media,
  IndexedMediaRow,

  // Animal Identifier
  AnimalIdentifier,
  IndexedIdentifierRow,
  IdentifierType,

  // Animal Incident
  AnimalIncident,
  IncidentImage,
  IncidentAttachment,
  IndexedIncidentRow,

  // Animal Diet
  AnimalDiet,
  IndexedDietRow,

  // Animal History & Journal
  AnimalHistoryItem,
  AnimalJournalLog,
  AnimalJournalEntry,

  // Form Options
  SelectOption,
  MannerOfDeathOption,
  CarcassConditionOption,
  CarcassDispositionOption,

  // User
  User,
  UserAvatarInfo,

  // Drawer
  DrawerData,
  DrawerType,

  // Lineage / Family Tree
  LineageAnimal,
  ExternalAnimal,
  LineageParentData,
  LineagePair,
  LineageSibling,

  // Lineage CRUD
  AddParentPayload,
  EditExternalParentPayload,
  DeleteParentPayload,
  AddPairPayload,
  EditPairPayload,
  DeletePairPayload,
  ExternalAnimalFormData,
  UserAccessCheckParams,
  UserAccessCheckResponse,
  LineageAnimalListItem,

  // Clutch / Litter
  ClutchItem,
  LitterItem,
  GetClutchListParams,
  GetClutchListResponse,
  GetLitterListParams,
  GetLitterListResponse
} from './models'

// ==================== API Types ====================
export type {
  // Generic
  ApiResponse,
  PaginatedData,
  PaginatedListingData,
  PaginatedResponse,
  PaginatedListingResponse,
  ApiError,
  PaginationParams,

  // Site
  GetSitesParams,
  GetSitesResponse,
  GetSiteAnalyticsResponse,
  GetSiteDetailsParams,
  GetSiteDetailsResponse,
  AddSitePayload,
  AddSiteResponse,

  // Section
  GetSectionsParams,
  GetSectionsResponse,
  GetSectionAnalyticsPayload,
  GetSectionAnalyticsResponse,
  AddSectionPayload,
  AddSectionResponse,

  // Enclosure
  GetEnclosuresParams,
  GetEnclosuresResponse,
  GetEnclosureListSectionWiseParams,
  GetEnclosureListSectionWiseResponse,
  GetEnclosureWiseStatsParams,
  GetEnclosureWiseStatsResponse,
  GetEnclosureWiseSpeciesParams,
  GetEnclosureWiseSpeciesResponse,
  GetEnclosureSettingsParams,
  GetEnclosureSettingsResponse,
  GetSectionsForEnclosurePayload,
  GetSectionsForEnclosureResponse,
  GetParentEnclosureListPayload,
  GetParentEnclosureListResponse,
  AddEnclosurePayload,
  AddEnclosureResponse,

  // Animal
  GetAnimalsParams,
  GetAnimalsResponse,
  GetAnimalDetailsOverviewParams,
  GetAnimalDetailsOverviewResponse,
  GetAnimalHistoryParams,
  GetAnimalHistoryResponse,
  GetAnimalMediaParams,
  GetAnimalMediaResponse,

  // Animal Identifier
  GetAnimalIdentifierParams,
  GetAnimalIdentifierResponse,
  AddAnimalIdentifierPayload,
  AddAnimalIdentifierResponse,
  EditAnimalIdentifierPayload,
  EditAnimalIdentifierResponse,
  DeleteAnimalIdentifierParams,
  DeleteAnimalIdentifierResponse,

  // Animal Incident
  GetAnimalIncidentListParams,
  GetAnimalIncidentListResponse,
  GetAnimalIncidentDetailsParams,
  GetAnimalIncidentDetailsResponse,
  CreateAnimalIncidentPayload,
  CreateAnimalIncidentResponse,
  UpdateAnimalIncidentPayload,
  UpdateAnimalIncidentResponse,

  // Animal Mortality
  GetAnimalMortalityParams,
  GetAnimalMortalityResponse,
  EditAnimalMortalityPayload,
  EditAnimalMortalityResponse,
  RevokeAnimalMortalityPayload,
  RevokeAnimalMortalityResponse,
  GetMannerOfDeathResponse,
  GetCarcassConditionResponse,
  GetCarcassDispositionResponse,

  // Animal Diet
  GetAnimalDietListParams,
  GetAnimalDietListResponse,

  // Animal Journal
  GetAnimalJournalLogsParams,
  GetAnimalJournalLogsResponse,

  // Species
  GetSpeciesParams,
  GetSpeciesResponse,

  // Mortality List
  GetMortalityListParams,
  GetMortalityListResponse,

  // Treatment
  GetAnimalTreatmentListParams,
  GetAnimalTreatmentListResponse,
  GetSectionAnimalTreatmentListParams,

  // Media
  GetMediaParams,
  GetMediaResponse,

  // Cluster
  GetClusterListParams,
  GetClusterListResponse,
  GetClusterAnalyticsParams,
  GetClusterAnalyticsResponse,
  GetSiteListClusterWiseParams,
  GetSiteListClusterWiseResponse,
  AddClusterPayload,
  AddClusterResponse,

  // Notes / Observation
  GetNotesParams,
  GetNotesResponse,
  GetObservationTypesResponse,
  GetObservationMasterListParams,
  GetObservationMasterListResponse,
  GetObservationDetailsParams,
  GetObservationDetailsResponse,
  CreateObservationPayload,
  CreateObservationResponse,
  DeleteObservationParams,
  DeleteObservationResponse,
  AddNoteReactionPayload,
  AddNoteReactionResponse,
  RemoveNoteReactionPayload,
  RemoveNoteReactionResponse,
  AddObservationCommentPayload,
  AddObservationCommentResponse,

  // User
  GetUsersListParams,
  GetUsersListResponse,

  // Users with Access (get-userswith-access)
  UserWithAccessItem,
  GetUsersWithAccessParams,
  GetUsersWithAccessResponse,

  // Lineage / Family Tree
  GetLineageParentParams,
  GetLineageParentResponse,
  GetLineagePairParams,
  GetLineagePairResponse,
  GetLineageSiblingParams,
  GetLineageSiblingResponse,

  // Lineage CRUD API
  AddLineageParentResponse,
  EditExternalParentResponse,
  DeleteLineageParentResponse,
  AddLineagePairResponse,
  EditLineagePairResponse,
  DeleteLineagePairResponse,
  GetLineageAnimalListParams,
  GetLineageAnimalListResponse
} from './api'

// ==================== State Types ====================
export type {
  SortOrder,
  PaginationState,
  LoadingErrorState,
  SearchSortState,
  BaseListState,
  SiteAnalyticsState,
  InsightsState,
  SectionState,
  SpeciesState,
  MortalityState,
  AnimalTreatmentState,
  MediaState,
  InfiniteScrollState,
  SpeciesInfiniteScrollState,
  AnimalInfiniteScrollState,
  SectionInfiniteScrollState,
  NotesFilters,
  NotesState,
  HousingModuleState,
  FetchSiteAnalyticsPayload,
  FetchInsightsPayload,
  FetchSectionsPayload,
  FetchSpeciesPayload,
  FetchMortalityPayload,
  FetchAnimalTreatmentPayload,
  FetchMediaPayload,
  FetchNotesPayload,
  FetchInfiniteScrollPayload,
  FetchListResult,
  FetchNotesResult,
  SetParamsPayload,
  SetPaginationPayload,
  SetFiltersPayload,
  PaginationModel,
  SiteFilters,
  SectionFilters,
  SpeciesFilters,
  AnimalFilters
} from './state'

// ==================== Hook Types ====================
export type {
  UseSiteAnalyticsParams,
  UseSiteAnalyticsReturn,
  UseSectionAnalyticsParams,
  UseSectionAnalyticsReturn,
  UseSiteListReturn,
  UseSectionListParams,
  UseSectionListReturn,
  UseSpeciesListParams,
  UseSpeciesListReturn,
  UseAnimalListParams,
  UseAnimalListReturn,
  UseEnclosureListParams,
  UseEnclosureListReturn,
  UseClusterListReturn,
  UseAnimalDetailsParams,
  UseAnimalDetailsReturn,
  UseAnimalIdentifiersParams,
  UseAnimalIdentifiersReturn,
  UseAnimalIncidentsParams,
  UseAnimalIncidentsReturn,
  UseAnimalMortalityParams,
  UseAnimalMortalityReturn,
  UseAnimalDietParams,
  UseAnimalDietReturn,
  UseAnimalHistoryParams,
  UseAnimalHistoryReturn,
  UseAnimalJournalsParams,
  UseAnimalJournalsReturn,
  UseNotesParams,
  UseNotesReturn,
  UseMortalityListParams,
  UseMortalityListReturn,
  UseMediaListParams,
  UseMediaListReturn,
  UseTreatmentListParams,
  UseTreatmentListReturn,
  UseSiteAnalytics,
  UseSectionAnalytics,
  UseSiteList,
  UseSectionList,
  UseSpeciesList,
  UseAnimalList,
  UseEnclosureList,
  UseClusterList,
  UseAnimalDetails,
  UseAnimalIdentifiers,
  UseAnimalIncidents,
  UseAnimalMortality,
  UseAnimalDiet,
  UseAnimalHistory,
  UseAnimalJournals,
  UseNotes,
  UseMortalityList,
  UseMediaList,
  UseTreatmentList
} from './hooks'

// ==================== Assessment Types ====================
export type {
  AssessmentResponseType,
  AssessmentDefaultValue,
  AssessmentValue,
  AssessmentType,
  AssessmentCategory,
  MeasurementUnit,
  AddAssessmentPayload,
  UpdateAssessmentPayload,
  AddEntityAssessmentPayload,
  UpdateEntityAssessmentPayload,
  GetAssessmentTypesResponse,
  AddAssessmentResponse,
  UpdateAssessmentResponse,
  GetMeasurementUnitsResponse,
  AssessmentDrawerMode,
  AssessmentFormValues
} from './assessment'

// ==================== Component Props Types ====================
export type {
  // Base
  BaseDrawerProps,
  BaseDrawerWithIdProps,
  BaseDrawerWithDataProps,

  // Site Drawers
  AddSiteDrawerProps,

  // Section Drawers
  SectionsDrawerProps,
  AddSectionDrawerProps,

  // Enclosure Drawers
  EnclosureDrawerProps,
  AddEnclosureDrawerProps,

  // Species Drawers
  SpeciesDrawerProps,

  // Animal Drawers
  AnimalsDrawerProps,
  AnimalDrawerProps,
  AddIdentifierDrawerProps,
  AnimalMortalityEditDrawerProps,
  AnimalRevokeDrawerProps,

  // Note Drawers
  NoteDetailsDrawerProps,
  NoteFilterDrawerProps,
  AddNoteDrawerProps,
  SelectNoteTypeDrawerProps,
  NoteCommentDialogProps,

  // Cluster Drawers
  AddClusterDrawerProps,

  // Cards
  SiteListingCardProps,
  SectionCardProps,
  EnclosureCardProps,
  AnimalCardProps,
  AnimalDetailsCardProps,
  AnimalQRCardProps,
  EnclosureDetailsCardProps,
  HousingSpeciesCardProps,
  SpeciesInnerCardProps,
  ClusterCardProps,

  // Listings
  SiteListingProps,
  SectionListingProps,
  SpeciesListingProps,
  MortalityListingProps,
  AnimalTreatmentListingProps,
  MediaListingProps,
  NotesListingProps,
  EnclosureListingProps,
  EnclosureWiseEnclosureProps,
  EnclosureWiseSpeciesProps,

  // Cluster Components
  ClusterSitesProps,
  ClusterSpeciesProps,
  ClusterInchargesProps,
  SelectedSitesProps,

  // Animal Components
  AnimalOverviewProps,
  AnimalHistoryProps,
  AnimalMediaProps,
  AnimalIdentifierProps,
  AnimalMortalityProps,
  AnimalDietProps,
  AnimalJournalsProps,
  JournalFilterProps,
  UploadAnimalDietProps,
  AnimalIncidentsProps,
  CreateMissingIncidentProps,
  IncidentDetailsCardProps,
  MissReportIncidentFormProps,
  ReportFoundFormProps,

  // Headers
  ListingHeaderProps,
  CustomDrawerProps,

  // Navigation
  HousingNavigationProps,

  // Pages
  SitesPageProps,
  SiteDetailsPageProps,
  SectionDetailsPageProps,
  EnclosureDetailsPageProps,
  AnimalDetailsPageProps,
  ClusterPageProps,
  ClusterDetailsPageProps,

  // Tables/Grids
  HousingDataGridProps,

  // Utilities
  SearchProps,
  UserAvatarDetailsProps
} from './components'
