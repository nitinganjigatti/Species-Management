// Housing API - barrel export
// All housing API functions organized by page/domain
//
// Page mapping:
//   site.ts        → sites/index, sites/[id]
//   section.ts     → sections/[id], sites/[id]
//   enclosure.ts   → enclosure/[id], sections/[id]
//   animal.ts      → animals/[id]
//   cluster.ts     → cluster/index, cluster/[id]
//   observation.ts → sites/[id], sections/[id], enclosure/[id], animals/[id]
//   transfer.ts    → sites/[id], animals/[id]
//   lineage.ts     → animals/[id]
//   foodWastage.ts → sites/[id], sections/[id], enclosure/[id]
//   common.ts      → shared across all pages

export * from './site'
export * from './section'
export * from './enclosure'
export * from './animal'
export * from './cluster'
export * from './observation'
export * from './transfer'
export * from './lineage'
export * from './foodWastage'
export * from './common'

// Re-export all API types so components can import from 'src/lib/api/housing'
export type {
  // Site
  EditSitePayload, EditSiteResponse, DeleteSiteParams, DeleteSiteResponse,
  AddSiteTeamPayload, AddSiteTeamResponse, EditSiteTeamPayload, EditSiteTeamResponse,
  UpdatePerformActionPayload, UpdatePerformActionResponse,
  // Section
  EditSectionPayload, EditSectionResponse, DeleteSectionParams, DeleteSectionResponse,
  // Enclosure
  EnclosureBasicInfo, GetEnclosureBasicInfoParams, GetEnclosureBasicInfoResponse,
  EditEnclosurePayload, EditEnclosureResponse, DeleteEnclosureParams, DeleteEnclosureResponse,
  // Animal
  AddAnimalMediaPayload, AddAnimalMediaResponse,
  TaxonomyLevel, TaxonomyHierarchyData, GetTaxonomyHierarchyParams, GetTaxonomyHierarchyResponse,
  GetVaccinationListParams, VaccinationRecord, GetVaccinationListResponse,
  GetMedicineSideEffectParams, MedicineSideEffect, GetMedicineSideEffectResponse,
  DeleteMedicineSideEffectParams, DeleteMedicineSideEffectResponse,
  // Cluster
  EditClusterPayload, EditClusterResponse, DeleteClusterParams, DeleteClusterResponse,
  GetAvailableSitesForClusterParams, AvailableSiteItem, GetAvailableSitesForClusterResponse,
  AssignSitesToClusterPayload, AssignSitesToClusterResponse,
  // Observation
  EditObservationResponse, ObservationTemplateUser, ObservationTemplate,
  GetObservationTemplatesParams, GetObservationTemplatesResponse,
  CreateObservationTemplatePayload, CreateObservationTemplateResponse,
  UpdateObservationTemplatePayload, UpdateObservationTemplateResponse,
  DeleteObservationTemplateResponse,
  // Transfer
  AnimalTransferItem, GetAnimalTransferListParams, GetAnimalTransferListResponse,
  TransferAssignTo, TransferDetails, TransferEntityDetail, TransferAttachment,
  TransferComment, TransferApprovalItem, TransferSummaryData, GetTransferSummaryResponse,
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
  // Common
  AddMediaPayload, AddMediaResponse, GetUserListPostParams, UserListItem, GetUserListPostResponse,
  GetInchargeListParams, InchargeUser, GetInchargeListResponse,
  AddInchargePayload, AddInchargeResponse, UserRole, GetUsersRoleListResponse,
  // Food Wastage
  FoodWastageListItem, FoodWastageHighestWastage, FoodWastageGraphEntry,
  FoodWastageGraphItem, FoodWastageData,
  FoodWastageDetailItem, FoodWastageDetailsData
} from 'src/types/housing/api'
