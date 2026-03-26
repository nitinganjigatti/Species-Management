export const ANNOUNCEMENT_BASE_URL = 'v1/announcement/'

export const COMMENT_BASE_URL = 'v1/comment/'

export const ANNOUNCEMENT_ENDPOINTS = {
  // Announcement CRUD
  LIST: 'v1/announcement/all',
  DETAILS: (id: number) => `v1/announcement/${id}`,
  CREATE: 'v1/announcement/create',
  EDIT: (id: number) => `v1/announcement/edit/${id}`,
  DELETE: (id: number) => `v1/announcement/delete/${id}`,

  // Announcement Actions
  ACTION: (id: number, type: string) => `v1/announcement/action/${id}/${type}`,

  // Reactions
  ADD_REACTION: 'v1/announcement/add/reaction',
  REMOVE_REACTION: 'v1/announcement/remove/reaction',
  REACTION_COUNT: (id: number) => `v1/announcement/reaction/count/${id}`,
  REACTION_USERS: (id: number) => `v1/announcement/${id}/reactions`,

  // Comments
  CREATE_COMMENT: 'v1/comment/create',
  DELETE_COMMENT: (id: number) => `v1/comment/delete/${id}`,

  // Targeting
  ROLE_LIST: 'role/list'
} as const

// Pagination defaults
export const ANNOUNCEMENT_PAGE_SIZE = 10

// Announcement types
export const ANNOUNCEMENT_TYPES = {
  GENERAL: 'general',
  IMPORTANT: 'important'
} as const

// Announcement statuses
export const ANNOUNCEMENT_STATUSES = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled'
} as const

// Query keys for React Query
export const ANNOUNCEMENT_QUERY_KEYS = {
  LIST: 'announcements',
  DETAILS: 'announcement-details',
  REACTION_USERS: 'announcement-reaction-users'
} as const
