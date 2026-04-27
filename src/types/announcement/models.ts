/**
 * Core entity types for the Announcement module
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

export interface ExistingAttachment {
  id: number
  file_path: string
  name: string
  file_type: string
}

// ==================== Reaction Types ====================

export interface ReactionsSummary {
  like: number
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
  schedule_end_date?: string
  is_scheduled: boolean | number | string
  allow_comments: 0 | 1 | boolean | string
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
  target_zoo_only?: boolean
  end_date_flag?: boolean | number
  created_at: string
  modified_at: string
}

// ==================== Site & Role Types ====================

export interface Site {
  site_id: number
  site_name: string
  site_image?: string
}

export interface Role {
  id: number | string
  role_name: string
  string_id?: string
}

// ==================== Target Group Types ====================

export interface TargetGroupSite {
  group_type: 'site'
  values: number[]
}

export interface TargetGroupRole {
  group_type: 'role'
  values: (number | string)[]
}

export interface TargetGroupSiteRole {
  group_type: 'site_role'
  values: Array<{
    site_id: number
    role_id: (number | string)[]
  }>
}

export type TargetGroup = TargetGroupSite | TargetGroupRole | TargetGroupSiteRole

// ==================== User Selection Types ====================

export interface SelectedUser {
  user_id: number | string
  user_name: string
  full_name?: string
  user_profile_pic?: string
  role_name?: string
}
