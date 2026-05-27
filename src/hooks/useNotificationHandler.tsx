'use client'

import { useCallback } from 'react'
import toast, { Toast } from 'react-hot-toast'
import { useSafeRouter } from './useSafeRouter'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification, markAsRead } from 'src/lib/notifications'
import type { PushNotification, AppNotification } from 'src/lib/notifications'
import type { AppDispatch, RootState } from 'src/store/store'
import { useSearchParams } from 'next/navigation'

/**
 * Hook to handle different notification types and perform appropriate actions
 */
export const useNotificationHandler = () => {
  const router = useSafeRouter()
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const currentRoute = router.pathname

  const handleNotification = useCallback(
    (notification: PushNotification) => {
      const { title, body, data } = notification

      // Show toast notification (disabled for this release)
      // showNotificationToast(title, body, data)

      // Store notification in Redux (skip silent events)
      const isSilent = data.event === 'message_edited' || data.event === 'message_deleted'
      if (!isSilent) {
        // Check if user is currently viewing this conversation
        const currentConversationId = searchParams?.get('conversationId') || null
        const isViewingConversation =
          currentRoute === '/chat' &&
          !!currentConversationId &&
          String(currentConversationId) === String(data.conversation_id)

        const appNotification: AppNotification = {
          id: crypto.randomUUID(),
          title,
          subtitle: body,
          meta: 'Just now',
          timestamp: Date.now(),
          read: isViewingConversation,
          avatarText: data.sender_name || data.group_name || 'A',
          avatarColor: getAvatarColor(data.event),
          conversationId: data.conversation_id
        }
        dispatch(addNotification(appNotification))
      }

      // Don't auto-navigate - let user click notification to navigate
      // Navigation happens via NotificationDropdown click handler
    },
    [router, dispatch, searchParams, currentRoute]
  )

  return { handleNotification }
}

/**
 * Get avatar color based on event type
 */
const getAvatarColor = (event: string): AppNotification['avatarColor'] => {
  switch (event) {
    case 'dm_message':
    case 'reply':
    case 'dm_reaction':
      return 'primary'
    case 'group_message':
    case 'mention':
    case 'group_reaction':
      return 'secondary'
    case 'group_invite':
      return 'success'
    case 'group_removed':
    case 'group_role_changed':
      return 'error'
    default:
      return 'info'
  }
}

/**
 * Display toast notification based on type
 */
const showNotificationToast = (title: string, body: string, data: any) => {
  const messageText = `${title}\n${body}`

  switch (data?.event) {
    case 'dm_message':
    case 'group_message':
      toast((_t: Toast) => (
        <div className='flex flex-col gap-2'>
          <span className='font-semibold'>{title}</span>
          <span className='text-sm'>{body}</span>
          {data?.sender_name && <span className='text-xs text-gray-500'>From: {data.sender_name}</span>}
        </div>
      ))
      break

    case 'mention':
      toast((_t: Toast) => (
        <div className='flex flex-col gap-2'>
          <span className='font-semibold'>{'🔔 ' + title}</span>
          <span className='text-sm'>{body}</span>
          {data?.group_name && <span className='text-xs text-gray-500'>In: {data.group_name}</span>}
        </div>
      ))
      break

    case 'reply':
      toast((_t: Toast) => (
        <div className='flex flex-col gap-2'>
          <span className='font-semibold'>{'💬 ' + title}</span>
          <span className='text-sm'>{body}</span>
        </div>
      ))
      break

    case 'dm_reaction':
    case 'group_reaction':
      break

    case 'group_invite':
      toast((_t: Toast) => (
        <div className='flex flex-col gap-2'>
          <span className='font-semibold'>{'👥 ' + title}</span>
          <span className='text-sm'>{body}</span>
        </div>
      ))
      break

    case 'group_removed':
      toast.error('You were removed from a group', { icon: '❌' })
      break

    case 'group_role_changed':
      break

    case 'message_edited':
    case 'message_deleted':
      // Silent notification — app handles UI update
      break

    default:
      toast(messageText)
  }
}

/**
 * Route user to the relevant page based on notification type
 * Only navigate if already on chat page - otherwise just show toast
 */
const routeToNotificationSource = (data: any, router: any) => {
  if (!data?.conversation_id) return

  const { event, conversation_id } = data
  const isOnChatPage = router.pathname === '/chat'

  // Only navigate if already on chat page
  if (!isOnChatPage) {
    // On different page - just show toast, don't navigate
    return
  }

  switch (event) {
    case 'dm_message':
    case 'reply':
    case 'group_message':
    case 'mention':
    case 'dm_reaction':
    case 'group_reaction':
    case 'message_edited':
    case 'message_deleted':
      // Route to specific conversation on chat page
      router.push(`/chat?conversationId=${conversation_id}`)
      break

    case 'group_invite':
    case 'group_removed':
    case 'group_role_changed':
      // Already on chat page, no navigation needed
      break

    default:
      // No action
      break
  }
}

export default useNotificationHandler
