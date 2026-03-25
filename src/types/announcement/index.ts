/**
 * Announcement Module Types
 *
 * This module exports all TypeScript types for the announcement module.
 * Import types from 'src/types/announcement' for use throughout the application.
 */

// ==================== User Types ====================
export interface AnnouncementUser {
  user_id: number
  first_name: string
  last_name: string
  profile_pic: string
}

// ==================== Comment Types ====================
export interface AnnouncementComment {
  id: number
  announcement_id: number
  comment_text: string
  user_id: number
  user_first_name: string
  user_last_name: string
  user_profile_pic: string
  created_at: string
}

// ==================== Attachment Types ====================
export interface AnnouncementAttachment {
  id: number
  file: string
  file_type: 'image' | 'video' | 'document' | 'audio'
  file_orginal_name: string
}

export interface AttachmentCount {
  image: number
  video: number
  document: number
  audio: number
}

// ==================== Reaction Types ====================
export interface ReactionsSummary {
  like: number
}

export interface ReactionUser {
  user_id: number
  first_name: string
  last_name: string
  profile_pic: string
  reacted_at: string
}

// ==================== Announcement Types ====================
export type AnnouncementType = 'general' | 'important'

export type AnnouncementStatus = 'active' | 'cancelled' | 'scheduled'

export interface Announcement {
  announcement_id: number
  title: string
  description: string
  type: AnnouncementType
  status: AnnouncementStatus
  created_user_id: number
  created_by: AnnouncementUser
  schedule_datetime: string
  is_scheduled: boolean
  allow_comments: 0 | 1
  comment_count: number
  comments: AnnouncementComment[]
  user_reaction: 'like' | null
  reactions_summary: ReactionsSummary
  attachment_count: AttachmentCount
  attachments: AnnouncementAttachment[]
  is_deleted: 0 | 1 | '0' | '1' | boolean
  is_edited: boolean
  cancel_reason?: string
  target_groups?: any[]
  user_target_groups?: any[]
  created_at: string
  modified_at: string
}

// ==================== API Response Types ====================
export interface AnnouncementListData {
  announcement_details: Announcement[]
  total_announcement_count: number
}

export interface AnnouncementListResponse {
  success: boolean
  data: AnnouncementListData
}

export interface AnnouncementDetailsResponse {
  success: boolean
  data: Announcement
}

export interface ReactionUsersResponse {
  success: boolean
  data: ReactionUser[]
}

export interface CommentResponse {
  success: boolean
  data: AnnouncementComment
  message?: string
}

export interface ActionResponse {
  success: boolean
  message?: string
}

// ==================== API Request Types ====================
export interface AnnouncementListParams {
  page?: number
  limit?: number
  q?: string
  owned_by_me?: boolean
}

export interface AddReactionPayload {
  announcement_id: number
}

export interface AddCommentPayload {
  announcement_id: number
  comment: string
}

export interface CreateAnnouncementPayload {
  title: string
  description?: string
  type: AnnouncementType
  allow_comments: boolean
  is_scheduled: number
  schedule_datetime?: string
  schedule_end_date?: string
  target_groups?: string
  user_target_groups?: string
  attachments?: File[]
  deleted_attachments?: string
}

export interface CreateAnnouncementResponse {
  success?: boolean
  status?: boolean
  message?: string
  errors?: string[]
  data?: Announcement
}

// ==================== Component Props Types ====================
export interface AnnouncementCardProps {
  announcement: Announcement
  onLike?: (id: number, isLiked: boolean) => void
  onComment?: (id: number) => void
  onShare?: (id: number) => void
  onEdit?: (announcement: Announcement) => void
  onDelete?: (id: number) => void
  onCancel?: (id: number) => void
  onClick?: () => void
  currentUserId?: number
}

export interface AnnouncementFeedProps {
  initialFilter?: 'all' | 'my_posts'
}

export interface AnnouncementHeaderProps {
  user: AnnouncementUser
  createdAt: string
  isEdited: boolean
  isOwner: boolean
  onEdit?: () => void
  onDelete?: () => void
  onCancel?: () => void
}

export interface AnnouncementContentProps {
  title: string
  description: string
  type: AnnouncementType
}

export interface AnnouncementMediaProps {
  attachments: AnnouncementAttachment[]
  maxVisible?: number
}

export interface AnnouncementReactionsProps {
  likeCount: number
  commentCount: number
  attachmentCount: AttachmentCount
  userReaction: 'like' | null
  onLike: () => void
  onCommentClick: () => void
  onViewLikes?: () => void
}

export interface AnnouncementCommentsProps {
  comments: AnnouncementComment[]
  announcementId: number
  allowComments: boolean
  onAddComment: (text: string) => void
  onDeleteComment?: (commentId: number) => void
  currentUserId?: number
  isLoading?: boolean
}

export interface CommentItemProps {
  comment: AnnouncementComment
  isOwner: boolean
  onDelete?: () => void
}

export interface ReactionUserListDialogProps {
  open: boolean
  onClose: () => void
  announcementId: number
}
