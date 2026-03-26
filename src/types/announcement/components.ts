/**
 * Component props types for the Announcement module
 */

import type { Dayjs } from 'dayjs'
import type {
  Announcement,
  AnnouncementAttachment,
  AnnouncementComment,
  AnnouncementType,
  AnnouncementUser,
  AttachmentCount,
  Role,
  SelectedUser,
  Site
} from './models'

// ==================== Base Props ====================

export interface BaseDrawerProps {
  open: boolean
  onClose: () => void
}

// ==================== Card & Feed Props ====================

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

export interface AnnouncementSkeletonProps {
  showMedia?: boolean
  showDescription?: boolean
}

// ==================== Header & Content Props ====================

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

// ==================== Media Props ====================

export interface AnnouncementMediaProps {
  attachments: AnnouncementAttachment[]
  maxVisible?: number
}

// ==================== Reaction Props ====================

export interface AnnouncementReactionsProps {
  likeCount: number
  commentCount: number
  attachmentCount: AttachmentCount
  userReaction: 'like' | null
  onLike: () => void
  onCommentClick: () => void
  onViewLikes?: () => void
}

// ==================== Comment Props ====================

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
  isLast?: boolean
}

export interface CommentInputProps {
  onSubmit: (text: string) => void
  isLoading?: boolean
  placeholder?: string
}

// ==================== Drawer Props ====================

export interface AddAnnouncementDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editAnnouncement?: Announcement | null
}

export interface AnnouncementDetailsDrawerProps {
  open: boolean
  onClose: () => void
  announcementId: number | null
  onAnnouncementUpdated?: () => void
  onEdit?: (announcement: Announcement) => void
}

export interface SelectSitesRolesDrawerProps {
  open: boolean
  onClose: () => void
  selectedSites: Site[]
  selectedRoles: Role[]
  onSelectionChange: (sites: Site[], roles: Role[]) => void
}

export interface SearchUsersDrawerProps {
  open: boolean
  onClose: () => void
  selectedUsers: SelectedUser[]
  onUsersSelected: (users: SelectedUser[]) => void
}

// ==================== Form Types ====================

export interface FormValues {
  title: string
  description: string
  type: AnnouncementType
  isEveryoneVisible: boolean
  isPostNow: boolean
  schedule_date: Dayjs | null
  schedule_time: Dayjs | null
  isAlwaysVisible: boolean
  endDateTab: 'endDate' | 'duration'
  schedule_end_date: Dayjs | null
  durationValue: string
  durationUnit: 'Days' | 'Weeks' | 'Months'
  allow_comments: boolean
  attachments: File[]
}
