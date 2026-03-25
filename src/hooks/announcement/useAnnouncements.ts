/**
 * Announcement React Query Hooks
 *
 * Custom hooks for managing announcement data with React Query.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as announcementApi from 'src/lib/api/announcement'
import {
  ANNOUNCEMENT_QUERY_KEYS,
  ANNOUNCEMENT_PAGE_SIZE
} from 'src/constants/AnnouncementConstants'
import type {
  Announcement,
  AnnouncementListParams,
  AnnouncementListResponse
} from 'src/types/announcement'

interface UseAnnouncementListParams {
  q?: string
  owned_by_me?: boolean
}

/**
 * Hook for fetching paginated announcements with infinite scroll
 */
export const useAnnouncementList = (params: UseAnnouncementListParams = {}) => {
  return useInfiniteQuery({
    queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST, params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await announcementApi.getAnnouncementList({
        ...params,
        page: pageParam,
        limit: ANNOUNCEMENT_PAGE_SIZE
      })

      return response
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (acc, page) => acc + (page.data?.announcement_details?.length || 0),
        0
      )
      const total = lastPage.data?.total_announcement_count || 0

      return totalFetched < total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1
  })
}

/**
 * Hook for fetching announcement details
 */
export const useAnnouncementDetails = (id: number, enabled = true) => {
  return useQuery({
    queryKey: [ANNOUNCEMENT_QUERY_KEYS.DETAILS, id],
    queryFn: () => announcementApi.getAnnouncementDetails(id),
    enabled: enabled && id > 0
  })
}

/**
 * Hook for fetching reaction users
 */
export const useReactionUsers = (announcementId: number, enabled = true) => {
  return useQuery({
    queryKey: [ANNOUNCEMENT_QUERY_KEYS.REACTION_USERS, announcementId],
    queryFn: () => announcementApi.getReactionUsers(announcementId),
    enabled: enabled && announcementId > 0
  })
}

/**
 * Hook for toggling like reaction on an announcement
 */
export const useToggleReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      announcementId,
      isLiked
    }: {
      announcementId: number
      isLiked: boolean
    }) => {
      if (isLiked) {
        return announcementApi.removeReaction(announcementId)
      }

      return announcementApi.addReaction(announcementId)
    },
    onMutate: async ({ announcementId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST]
      })

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST]
      })

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] },
        (old: any) => {
          if (!old?.pages) return old

          return {
            ...old,
            pages: old.pages.map((page: AnnouncementListResponse) => ({
              ...page,
              data: {
                ...page.data,
                announcement_details: page.data.announcement_details.map(
                  (announcement: Announcement) =>
                    announcement.announcement_id === announcementId
                      ? {
                          ...announcement,
                          user_reaction: isLiked ? null : 'like',
                          reactions_summary: {
                            ...announcement.reactions_summary,
                            like: isLiked
                              ? announcement.reactions_summary.like - 1
                              : announcement.reactions_summary.like + 1
                          }
                        }
                      : announcement
                )
              }
            }))
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to update reaction')
    }
  })
}

/**
 * Hook for adding a comment to an announcement
 */
export const useAddComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      announcementId,
      text
    }: {
      announcementId: number
      text: string
    }) => {
      return announcementApi.addComment(announcementId, text)
    },
    onSuccess: (response, { announcementId }) => {
      // Update comment count and add new comment to list cache
      queryClient.setQueriesData(
        { queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] },
        (old: any) => {
          if (!old?.pages) return old

          return {
            ...old,
            pages: old.pages.map((page: AnnouncementListResponse) => ({
              ...page,
              data: {
                ...page.data,
                announcement_details: page.data.announcement_details.map(
                  (announcement: Announcement) =>
                    announcement.announcement_id === announcementId
                      ? {
                          ...announcement,
                          comment_count: announcement.comment_count + 1,
                          comments: response.data
                            ? [...announcement.comments, response.data]
                            : announcement.comments
                        }
                      : announcement
                )
              }
            }))
          }
        }
      )
      // Also invalidate the details query to refresh the drawer
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.DETAILS, announcementId] })
      toast.success('Comment added')
    },
    onError: () => {
      toast.error('Failed to add comment')
    }
  })
}

/**
 * Hook for deleting a comment
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      announcementId
    }: {
      commentId: number
      announcementId: number
    }) => {
      return announcementApi.deleteComment(commentId)
    },
    onSuccess: (_response, { commentId, announcementId }) => {
      // Remove comment from list cache and update count
      queryClient.setQueriesData(
        { queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] },
        (old: any) => {
          if (!old?.pages) return old

          return {
            ...old,
            pages: old.pages.map((page: AnnouncementListResponse) => ({
              ...page,
              data: {
                ...page.data,
                announcement_details: page.data.announcement_details.map(
                  (announcement: Announcement) =>
                    announcement.announcement_id === announcementId
                      ? {
                          ...announcement,
                          comment_count: Math.max(
                            0,
                            announcement.comment_count - 1
                          ),
                          comments: announcement.comments.filter(
                            c => c.id !== commentId
                          )
                        }
                      : announcement
                )
              }
            }))
          }
        }
      )
      // Also invalidate the details query to refresh the drawer
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.DETAILS, announcementId] })
      toast.success('Comment deleted')
    },
    onError: () => {
      toast.error('Failed to delete comment')
    }
  })
}

/**
 * Hook for deleting an announcement
 */
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await announcementApi.deleteAnnouncement(announcementId)
      // Check API-level success (matching mobile implementation)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete announcement')
      }

      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] })
      toast.success(data.message || 'Announcement deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete announcement')
    }
  })
}

/**
 * Hook for cancelling an announcement
 */
export const useCancelAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await announcementApi.performAnnouncementAction(announcementId, 'cancel')
      // Check API-level success (matching mobile implementation)
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel announcement')
      }

      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] })
      toast.success(data.message || 'Announcement cancelled')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel announcement')
    }
  })
}

/**
 * Hook for creating a new announcement
 */
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await announcementApi.createAnnouncement(payload)
      // Check API-level success (matching mobile implementation)
      if (!response.success && response.status === false) {
        const errorMessage = response.errors?.[0] || response.message || 'Failed to create announcement'
        throw new Error(errorMessage)
      }

      return response
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] })
      toast.success(data.message || 'Announcement created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create announcement')
    }
  })
}

/**
 * Hook for updating an existing announcement
 */
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ announcementId, payload }: { announcementId: number; payload: any }) => {
      const response = await announcementApi.updateAnnouncement(announcementId, payload)
      // Check API-level success (matching mobile implementation)
      if (!response.success && response.status === false) {
        const errorMessage = response.errors?.[0] || response.message || 'Failed to update announcement'
        throw new Error(errorMessage)
      }

      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate both list and details queries
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.LIST] })
      queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENT_QUERY_KEYS.DETAILS, variables.announcementId] })
      toast.success(data.message || 'Announcement updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update announcement')
    }
  })
}
