/**
 * Announcement Module Types
 *
 * This module exports all TypeScript types for the announcement module.
 * Import types from 'src/types/announcement' for use throughout the application.
 */

// ==================== Model Types ====================
export type {
  // User
  AnnouncementUser,

  // Comment
  AnnouncementComment,

  // Attachment
  AnnouncementAttachment,
  AttachmentCount,
  ExistingAttachment,

  // Reaction
  ReactionsSummary,

  // Announcement
  AnnouncementType,
  AnnouncementStatus,
  Announcement,

  // Site & Role
  Site,
  Role,

  // Target Groups
  TargetGroupSite,
  TargetGroupRole,
  TargetGroupSiteRole,
  TargetGroup,

  // User Selection
  SelectedUser
} from './models'

// ==================== API Types ====================
export type {
  // Generic
  ApiResponse,

  // List
  AnnouncementListData,
  AnnouncementListParams,
  AnnouncementListResponse,

  // Details
  AnnouncementDetailsResponse,

  // Reactions
  AddReactionPayload,

  // Comments
  AddCommentPayload,
  CommentResponse,

  // Actions
  ActionResponse,

  // Create/Update
  CreateAnnouncementPayload,
  CreateAnnouncementResponse
} from './api'

// ==================== Component Props Types ====================
export type {
  // Base
  BaseDrawerProps,

  // Card & Feed
  AnnouncementCardProps,
  AnnouncementFeedProps,
  AnnouncementSkeletonProps,

  // Header & Content
  AnnouncementHeaderProps,
  AnnouncementContentProps,

  // Media
  AnnouncementMediaProps,

  // Reactions
  AnnouncementReactionsProps,

  // Comments
  AnnouncementCommentsProps,
  CommentItemProps,
  CommentInputProps,

  // Drawers
  AddAnnouncementDrawerProps,
  AnnouncementDetailsDrawerProps,
  SelectSitesRolesDrawerProps,
  SearchUsersDrawerProps,

  // Sent To
  SentToTargetGroup,
  SentToUserTargetGroup,
  AnnouncementSentToCardProps,
  AnnouncementSentToDrawerProps,

  // Forms
  FormValues
} from './components'

// ==================== Hook Types ====================
export type {
  UseAnnouncementListParams
} from './hooks'
