/**
 * Announcement API Service Functions
 *
 * API functions for managing announcements, reactions, and comments.
 */

// @ts-ignore - JS utility functions
import { axiosGet, axiosPost, axiosFormPost } from '../utility'
import { ANNOUNCEMENT_ENDPOINTS } from 'src/constants/announcement'
import type {
  AnnouncementListParams,
  AnnouncementListResponse,
  AnnouncementDetailsResponse,
  CommentResponse,
  ActionResponse,
  CreateAnnouncementPayload,
  CreateAnnouncementResponse
} from 'src/types/announcement'

/**
 * Get paginated list of announcements
 */
export const getAnnouncementList = async (
  params: AnnouncementListParams
): Promise<AnnouncementListResponse> => {
  const response = await axiosGet({
    url: ANNOUNCEMENT_ENDPOINTS.LIST,
    params,
    pharmacy: false
  })

  return response.data
}

/**
 * Get announcement details by ID
 */
export const getAnnouncementDetails = async (
  id: number
): Promise<AnnouncementDetailsResponse> => {
  const response = await axiosGet({
    url: ANNOUNCEMENT_ENDPOINTS.DETAILS(id),
    params: {},
    pharmacy: false
  })

  return response.data
}

/**
 * Add a like reaction to an announcement
 */
export const addReaction = async (
  announcementId: number
): Promise<ActionResponse> => {
  const response = await axiosPost({
    url: ANNOUNCEMENT_ENDPOINTS.ADD_REACTION,
    body: { announcement_id: announcementId },
    pharmacy: false
  })

  return response.data
}

/**
 * Remove a like reaction from an announcement
 */
export const removeReaction = async (
  announcementId: number
): Promise<ActionResponse> => {
  const response = await axiosPost({
    url: ANNOUNCEMENT_ENDPOINTS.REMOVE_REACTION,
    body: { announcement_id: announcementId },
    pharmacy: false
  })

  return response.data
}

/**
 * Add a comment to an announcement
 */
export const addComment = async (
  announcementId: number,
  commentText: string
): Promise<CommentResponse> => {
  const formData = new FormData()
  formData.append('announcement_id', announcementId.toString())
  formData.append('comment', commentText)

  const response = await axiosFormPost({
    url: ANNOUNCEMENT_ENDPOINTS.CREATE_COMMENT,
    body: formData,
    pharmacy: false
  })

  return response.data
}

/**
 * Delete a comment
 */
export const deleteComment = async (
  commentId: number
): Promise<ActionResponse> => {
  const response = await axiosGet({
    url: ANNOUNCEMENT_ENDPOINTS.DELETE_COMMENT(commentId),
    params: {},
    pharmacy: false
  })

  return response.data
}

/**
 * Perform an action on an announcement (cancel, delete, etc.)
 * Matches mobile: POST to v1/announcement/action/{id}/{type}
 */
export const performAnnouncementAction = async (
  announcementId: number,
  actionType: string
): Promise<ActionResponse> => {
  const response = await axiosPost({
    url: ANNOUNCEMENT_ENDPOINTS.ACTION(announcementId, actionType),
    body: {},
    pharmacy: false
  })

  return response.data
}

/**
 * Delete an announcement
 * Uses same endpoint as mobile: POST to v1/announcement/action/{id}/delete
 */
export const deleteAnnouncement = async (
  announcementId: number
): Promise<ActionResponse> => {
  const response = await axiosPost({
    url: ANNOUNCEMENT_ENDPOINTS.ACTION(announcementId, 'delete'),
    body: {},
    pharmacy: false
  })

  return response.data
}

/**
 * Create a new announcement
 */
export const createAnnouncement = async (
  payload: CreateAnnouncementPayload
): Promise<CreateAnnouncementResponse> => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description || '')
  formData.append('type', payload.type)
  formData.append('allow_comments', payload.allow_comments ? '1' : '0')
  formData.append('is_scheduled', payload.is_scheduled.toString())

  // Schedule datetime
  if (payload.schedule_datetime) {
    formData.append('schedule_datetime', payload.schedule_datetime)
  }

  // Visibility end date
  if (payload.schedule_end_date) {
    formData.append('schedule_end_date', payload.schedule_end_date)
  }

  // Target groups (audience)
  if (payload.target_groups) {
    formData.append('target_groups', payload.target_groups)
  }

  // User target groups
  if (payload.user_target_groups) {
    formData.append('user_target_groups', payload.user_target_groups)
  }

  // Attachments
  if (payload.attachments && payload.attachments.length > 0) {
    payload.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })
  }

  // Deleted attachments (for edit)
  if (payload.deleted_attachments) {
    formData.append('deleted_attachments', payload.deleted_attachments)
  }

  const response = await axiosFormPost({
    url: ANNOUNCEMENT_ENDPOINTS.CREATE,
    body: formData,
    pharmacy: false
  })

  return response.data
}

/**
 * Update an existing announcement
 * Matches mobile: POST to v1/announcement/edit/{id}
 */
export const updateAnnouncement = async (
  announcementId: number,
  payload: CreateAnnouncementPayload
): Promise<CreateAnnouncementResponse> => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description || '')
  formData.append('type', payload.type)
  formData.append('allow_comments', payload.allow_comments ? '1' : '0')
  formData.append('is_scheduled', payload.is_scheduled.toString())

  // Schedule datetime
  if (payload.schedule_datetime) {
    formData.append('schedule_datetime', payload.schedule_datetime)
  }

  // Visibility end date
  if (payload.schedule_end_date) {
    formData.append('schedule_end_date', payload.schedule_end_date)
  }

  // Target groups (audience)
  if (payload.target_groups) {
    formData.append('target_groups', payload.target_groups)
  }

  // User target groups
  if (payload.user_target_groups) {
    formData.append('user_target_groups', payload.user_target_groups)
  }

  // New attachments only (files without id)
  if (payload.attachments && payload.attachments.length > 0) {
    payload.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })
  }

  // Deleted attachment IDs
  if (payload.deleted_attachments) {
    formData.append('deleted_attachments', payload.deleted_attachments)
  }

  const response = await axiosFormPost({
    url: ANNOUNCEMENT_ENDPOINTS.EDIT(announcementId),
    body: formData,
    pharmacy: false
  })

  return response.data
}

/**
 * Get list of roles for targeting
 */
export const getRoleList = async (): Promise<any> => {
  const response = await axiosGet({
    url: ANNOUNCEMENT_ENDPOINTS.ROLE_LIST,
    params: {},
    pharmacy: false
  })

  return response.data
}
