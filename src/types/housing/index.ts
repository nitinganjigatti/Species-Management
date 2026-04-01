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
  NoteReactionCounts,
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
  GetSitesParams, GetSitesResponse, GetSiteAnalyticsResponse,
  GetSiteDetailsParams, GetSiteDetailsResponse,
  AddSitePayload, AddSiteResponse,
  EditSitePayload, EditSiteResponse, DeleteSiteParams, DeleteSiteResponse,
  AddSiteTeamPayload, AddSiteTeamResponse,
  EditSiteTeamPayload, EditSiteTeamResponse,
  UpdatePerformActionPayload, UpdatePerformActionResponse,

  // Section
  GetSectionsParams, GetSectionsResponse,
  GetSectionAnalyticsPayload, GetSectionAnalyticsResponse,
  AddSectionPayload, AddSectionResponse,
  EditSectionPayload, EditSectionResponse, DeleteSectionParams, DeleteSectionResponse,
  GetAnimalTreatmentListParams, GetAnimalTreatmentListResponse, GetSectionAnimalTreatmentListParams,

  // Enclosure
  GetEnclosuresParams, GetEnclosuresResponse,
  GetEnclosureListSectionWiseParams, GetEnclosureListSectionWiseResponse,
  GetEnclosureWiseStatsParams, GetEnclosureWiseStatsResponse,
  GetEnclosureWiseSpeciesParams, GetEnclosureWiseSpeciesResponse,
  GetEnclosureSettingsParams, GetEnclosureSettingsResponse,
  GetSectionsForEnclosurePayload, GetSectionsForEnclosureResponse,
  GetParentEnclosureListPayload, GetParentEnclosureListResponse,
  AddEnclosurePayload, AddEnclosureResponse,
  EnclosureBasicInfo, GetEnclosureBasicInfoParams, GetEnclosureBasicInfoResponse,
  EditEnclosurePayload, EditEnclosureResponse, DeleteEnclosureParams, DeleteEnclosureResponse,

  // Animal
  GetAnimalsParams, GetAnimalsResponse,
  GetAnimalDetailsOverviewParams, GetAnimalDetailsOverviewResponse,
  GetAnimalHistoryParams, GetAnimalHistoryResponse,
  GetAnimalMediaParams, GetAnimalMediaResponse,
  AddAnimalMediaPayload, AddAnimalMediaResponse,
  GetAnimalIdentifierParams, GetAnimalIdentifierResponse,
  AddAnimalIdentifierPayload, AddAnimalIdentifierResponse,
  EditAnimalIdentifierPayload, EditAnimalIdentifierResponse,
  DeleteAnimalIdentifierParams, DeleteAnimalIdentifierResponse,
  GetAnimalIncidentListParams, GetAnimalIncidentListResponse,
  GetAnimalIncidentDetailsParams, GetAnimalIncidentDetailsResponse,
  CreateAnimalIncidentPayload, CreateAnimalIncidentResponse,
  UpdateAnimalIncidentPayload, UpdateAnimalIncidentResponse,
  GetAnimalMortalityParams, GetAnimalMortalityResponse,
  EditAnimalMortalityPayload, EditAnimalMortalityResponse,
  RevokeAnimalMortalityPayload, RevokeAnimalMortalityResponse,
  GetMannerOfDeathResponse, GetCarcassConditionResponse, GetCarcassDispositionResponse,
  GetAnimalDietListParams, GetAnimalDietListResponse,
  GetAnimalJournalLogsParams, GetAnimalJournalLogsResponse,
  GetAnimalJournalModulesParams, GetAnimalJournalModulesResponse, JournalModule,
  TaxonomyLevel, TaxonomyHierarchyData, GetTaxonomyHierarchyParams, GetTaxonomyHierarchyResponse,
  GetVaccinationListParams, VaccinationRecord, GetVaccinationListResponse,
  GetMedicineSideEffectParams, MedicineSideEffect, GetMedicineSideEffectResponse,
  DeleteMedicineSideEffectParams, DeleteMedicineSideEffectResponse,

  // Species
  GetSpeciesParams, GetSpeciesResponse,

  // Mortality List
  GetMortalityListParams, GetMortalityListResponse,

  // Media
  GetMediaParams, GetMediaResponse, AddMediaPayload, AddMediaResponse,

  // Cluster
  GetClusterListParams, GetClusterListResponse,
  GetClusterAnalyticsParams, GetClusterAnalyticsResponse,
  GetSiteListClusterWiseParams, GetSiteListClusterWiseResponse,
  AddClusterPayload, AddClusterResponse,
  EditClusterPayload, EditClusterResponse, DeleteClusterParams, DeleteClusterResponse,
  GetAvailableSitesForClusterParams, AvailableSiteItem, GetAvailableSitesForClusterResponse,
  AssignSitesToClusterPayload, AssignSitesToClusterResponse,

  // Notes / Observation
  GetNotesParams, GetNotesResponse,
  GetObservationTypesResponse, GetObservationMasterListParams, GetObservationMasterListResponse,
  GetObservationDetailsParams, GetObservationDetailsResponse,
  CreateObservationPayload, CreateObservationResponse,
  DeleteObservationParams, DeleteObservationResponse, EditObservationResponse,
  AddNoteReactionPayload, AddNoteReactionResponse,
  RemoveNoteReactionPayload, RemoveNoteReactionResponse,
  AddObservationCommentPayload, AddObservationCommentResponse,

  // User
  GetUsersListParams, GetUsersListResponse,
  UserWithAccessItem, GetUsersWithAccessParams, GetUsersWithAccessResponse,
  GetUserListPostParams, UserListItem, GetUserListPostResponse,
  GetInchargeListParams, InchargeUser, GetInchargeListResponse,
  AddInchargePayload, AddInchargeResponse,
  UserRole, GetUsersRoleListResponse,
  GetEntityPermissionParams, GetEntityPermissionResponse,

  // Transfer
  AnimalTransferItem, GetAnimalTransferListParams, GetAnimalTransferListResponse,
  TransferSummaryData, GetTransferSummaryResponse,
  GetAnimalTransferSummaryParams, GetAnimalTransferButtonStatusParams,
  TransferButtonStatus, GetTransferButtonStatusResponse, GetTransferButtonStatusParams,
  AnimalTransferLogItem, GetAnimalTransferLogsResponse,
  AddAnimalTransferCommentPayload, AddAnimalTransferCommentResponse,
  UpdateAnimalTransferStatusPayload, UpdateAnimalTransferStatusResponse,
  UpdateTransferStatusPayload, UpdateTransferStatusResponse,
  AddTransferCommentPayload, AddTransferCommentResponse,
  TransferActivityItem, GetTransferActivityResponse,
  TransferMemberUser, TransferMembersData, GetTransferMembersResponse,
  ApproveTransferResponse, RejectTransferPayload, RejectTransferResponse,
  AnimalDetailItem, SpeciesWithAnimalsItem, AnimalBySpeciesItem, GetAnimalListBySpeciesResponse,

  // Lineage / Family Tree
  GetLineageParentParams, GetLineageParentResponse,
  GetLineagePairParams, GetLineagePairResponse,
  GetLineageSiblingParams, GetLineageSiblingResponse,
  AddLineageParentResponse, EditExternalParentResponse, DeleteLineageParentResponse,
  AddLineagePairResponse, EditLineagePairResponse, DeleteLineagePairResponse,
  GetLineageAnimalListParams, GetLineageAnimalListResponse,

  // Food Wastage
  FoodWastageData, GetFoodWastageParams, GetFoodWastageResponse,
  FoodWastageDetailItem, GetFoodWastageDetailsParams, GetFoodWastageDetailsResponse
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
  AnimalFilters,
  ObservationTemplate,
  ObservationTemplateUser
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
