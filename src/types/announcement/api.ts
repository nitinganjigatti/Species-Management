/**
 * API request/response types for the Announcement module
 */

import type {
  Announcement,
  AnnouncementComment,
  AnnouncementType,
  ReactionUser
} from './models'

// ==================== Generic API Types ====================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ==================== List API Types ====================

export interface AnnouncementListData {
  announcement_details: Announcement[]
  total_announcement_count: number
}

export interface AnnouncementListParams {
  page?: number
  limit?: number
  q?: string
  owned_by_me?: boolean
}

export interface AnnouncementListResponse {
  success: boolean
  data: AnnouncementListData
}

// ==================== Details API Types ====================

export interface AnnouncementDetailsResponse {
  success: boolean
  data: Announcement
}

// ==================== Reaction API Types ====================

export interface AddReactionPayload {
  announcement_id: number
}

export interface ReactionUsersResponse {
  success: boolean
  data: ReactionUser[]
}

// ==================== Comment API Types ====================

export interface AddCommentPayload {
  announcement_id: number
  comment: string
}

export interface CommentResponse {
  success: boolean
  data: AnnouncementComment
  message?: string
}

// ==================== Action API Types ====================

export interface ActionResponse {
  success: boolean
  message?: string
}

// ==================== Create/Update API Types ====================

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
