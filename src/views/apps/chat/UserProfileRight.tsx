'use client'

// ** React Imports
import { Fragment, ReactNode, useEffect, useState } from 'react'

// ** Redux Imports
import { useDispatch } from 'react-redux'
import type { AppDispatch } from 'src/store'
import {
  addParticipantsToGroup,
  deleteConversation,
  muteConversation,
  unmuteConversation,
  pinConversation,
  unpinConversation,
  updateGroupChat,
  removeParticipantFromGroup,
  updateParticipantRoleInGroup,
  selectChat,
  removeChatFromList,
  addOrReplaceChat,
  fetchChatsContacts
} from 'src/store/apps/chat'
import toast from 'react-hot-toast'
import type { Theme } from '@mui/material/styles'

// ** Chat SDK
import { getChatClientOrNull } from 'src/lib/chat/client'
import {
  searchUsers,
  sdkUserToContact,
  getUserById,
  leaveConversation,
  leaveAndDeleteConversation,
  getConversation,
  sdkConversationToChat,
  getAppConfig,
  getUserLastSeen
} from 'src/lib/chat/api'
import { formatLastSeen } from 'src/lib/chat/formatLastSeen'

// ** SDK presence store — auto-updates from `user_online` / `user_offline`.
import { useChatStore } from '@antzsoft/chat-core'
import type { User } from 'src/lib/chat/api'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Type
import { UserProfileRightType, ChatEntityId, ContactType } from 'src/types/apps/chatTypes'

// ** Custom Component Imports
import Sidebar from 'src/@core/components/sidebar'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import CustomAvatar from 'src/@core/components/mui/avatar'
import MediaLinksDocsDrawer from 'src/views/apps/chat/MediaLinksDocsDrawer'
import GroupIconEditor from 'src/views/apps/chat/GroupIconEditor'
import StarredMessagesDrawer from 'src/views/apps/chat/StarredMessagesDrawer'

// First letter of first word + first letter of last word (e.g. "Test Group Message" → "TM")
const getAvatarInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0] ?? ''
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : ''

  return (first + last).toUpperCase()
}

const UserProfileRight = (props: UserProfileRightType) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleUserProfileRightSidebarToggle,
    onScrollToMessage,
    onOpenSearch
  } = props

  const ScrollWrapper = ({ children }: { children: ReactNode }) => {
    if (hidden) {
      return <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
    } else {
      return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
    }
  }

  // Mute / pin state mirrors the backend's `Conversation.isMuted` / `isPinned`
  // (surfaced by the adapter onto `ChatsArrType`). Toggling dispatches the
  // mute/unmute/pin/unpin thunk which patches local state on success.
  const isMuted = store?.selectedChat?.contact.isMuted === true
  const isPinned = store?.selectedChat?.contact.isPinned === true

  // v1.1.3 enforces a per-user cap on pinned conversations (5 by default).
  // We fetch `maxPinnedConversations` from `appConfigApi` once and use it
  // to gate the Pin-to-top Switches client-side, avoiding the server-
  // rejected 6th-pin attempt. Default fallback of 5 matches the SDK's
  // documented default, so the gate is sane even if the config call fails
  // or hasn't resolved yet.
  const [maxPinned, setMaxPinned] = useState<number>(5)
  useEffect(() => {
    let cancelled = false
    getAppConfig()
      .then(c => {
        if (!cancelled && typeof c.maxPinnedConversations === 'number') {
          setMaxPinned(c.maxPinnedConversations)
        }
      })
      .catch(err => {
        console.warn('[chat] getAppConfig failed — falling back to default pin cap:', err)
      })

    return () => {
      cancelled = true
    }
  }, [])
  // Hide the "Leave group" affordance once the current user is no longer
  // an active participant (server flipped their `participants[].isActive`
  // to false after a successful leave). Pin-to-top stays available so the
  // user can keep the chat at the top of their sidebar after leaving.
  const isCurrentUserActive = store?.selectedChat?.contact.isCurrentUserActive !== false

  // Add-members flow state
  const dispatch = useDispatch<AppDispatch>()
  const [addingMembers, setAddingMembers] = useState<boolean>(false)
  const [addQuery, setAddQuery] = useState<string>('')
  // v1.1.3 — admin can add new members straight as admins (instead of
  // adding as member first and then calling `updateParticipantRole`).
  // Defaults to false → existing "member" behavior unchanged.
  const [addAsAdmin, setAddAsAdmin] = useState<boolean>(false)
  const [selectedToAdd, setSelectedToAdd] = useState<Set<ChatEntityId>>(new Set())
  const [addableContacts, setAddableContacts] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false)
  const [starredDrawerOpen, setStarredDrawerOpen] = useState(false)

  // Fetch full user details for 1:1 chat profile sidebar
  const [contactUser, setContactUser] = useState<User | null>(null)
  const contactId = store?.selectedChat?.contact?.id
  const isGroup = store?.selectedChat?.contact?.isGroup === true
  const dmOtherUserId = isGroup
    ? undefined
    : store?.selectedChat?.contact?.participantIds?.find(id => String(id) !== String(store?.userProfile?.id))
  const groupsInCommon = dmOtherUserId
    ? (store?.chats ?? []).filter(
        c => c.isGroup === true && c.participantIds?.some(id => String(id) === String(dmOtherUserId))
      )
    : []

  useEffect(() => {
    if (isGroup || !userProfileRightOpen || !contactId) {
      setContactUser(null)

      return
    }

    const client = getChatClientOrNull()
    if (!client) return

    // For 1:1 chats, the contact id is the conversation id. We need the
    // other participant's userId to fetch their profile.
    const otherUserId = store?.selectedChat?.contact?.participantIds?.find(
      id => String(id) !== String(store?.userProfile?.id)
    )
    if (!otherUserId) return

    getUserById(String(otherUserId))
      .then(user => setContactUser(user))
      .catch(() => setContactUser(null))
  }, [userProfileRightOpen, contactId, isGroup])

  // Live presence subscription for DM profile. `onlineUsers` comes from
  // the SDK's `user_online` / `user_offline` socket handlers; `lastSeen`
  // is REST-cold-seeded once per drawer open via `getUserLastSeen` when
  // the store doesn't yet have a value for the peer (typically after a
  // page refresh, since the Zustand store is in-memory only).
  const presenceOnlineUsers = useChatStore(s => s.onlineUsers)
  const presenceLastSeenMap = useChatStore(s => s.lastSeen)
  const dmPeerIdStr = dmOtherUserId ? String(dmOtherUserId) : null
  useEffect(() => {
    if (!dmPeerIdStr || !userProfileRightOpen) return
    if (presenceLastSeenMap[dmPeerIdStr]) return
    let cancelled = false
    getUserLastSeen(dmPeerIdStr)
      .then(res => {
        if (cancelled || !res?.lastSeenAt) return
        useChatStore.getState().setLastSeen(dmPeerIdStr, res.lastSeenAt)
      })
      .catch(err => console.warn('[chat:presence] getUserLastSeen failed (profile):', err))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmPeerIdStr, userProfileRightOpen])

  const currentUserId = store?.userProfile?.id ?? 11
  const currentGroupId = store?.selectedChat?.contact?.id ?? null
  const existingParticipantIds = store?.selectedChat?.contact?.participantIds ?? []

  // List addable users via SDK searchUsers (debounced). Same pattern as the
  // compose popover — empty query fetches all users, typing refines the list.
  // Excludes anyone already in the group + the current user themselves.
  useEffect(() => {
    if (!addingMembers) return

    const client = getChatClientOrNull()
    if (!client) {
      setAddableContacts([])

      return
    }

    const q = addQuery.trim()
    setSearching(true)
    const t = setTimeout(
      async () => {
        try {
          const users = await searchUsers(q)
          const existing = new Set(existingParticipantIds.map(String))
          const filtered = users
            .filter(u => !existing.has(u.id))
            .filter(u => u.id !== String(currentUserId))
            .map(sdkUserToContact)
          setAddableContacts(filtered)
        } catch (err) {
          console.error('[chat] searchUsers (add members) failed:', err)
          setAddableContacts([])
        } finally {
          setSearching(false)
        }
      },
      q.length ? 300 : 0
    )

    return () => clearTimeout(t)
  }, [addingMembers, addQuery, existingParticipantIds, currentUserId])

  const toggleAddMember = (id: ChatEntityId) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  const openAddMembers = () => {
    setAddingMembers(true)
    setSelectedToAdd(new Set())
    setAddQuery('')
  }

  const cancelAddMembers = () => {
    setAddingMembers(false)
    setSelectedToAdd(new Set())
    setAddQuery('')
    setAddAsAdmin(false)
  }

  // Reset Add-members state when the parent drawer closes — without this,
  // clicking outside the drawer would close it but `selectedToAdd` and
  // `addQuery` would stick, so reopening shows stale selections. Also
  // resets on chat switch so opening Add-members in a different group
  // doesn't carry over selections from the previous one.
  useEffect(() => {
    if (!userProfileRightOpen) {
      setAddingMembers(false)
      setSelectedToAdd(new Set())
      setAddQuery('')
      setAddAsAdmin(false)
    }
  }, [userProfileRightOpen])
  useEffect(() => {
    setAddingMembers(false)
    setSelectedToAdd(new Set())
    setAddQuery('')
    setAddAsAdmin(false)
  }, [contactId])

  const confirmAddMembers = () => {
    if (currentGroupId === null || selectedToAdd.size === 0) return
    dispatch(
      addParticipantsToGroup({
        groupId: currentGroupId,
        userIds: Array.from(selectedToAdd),
        // Only pass `role` when admin-toggle is on — keeps the wire
        // shape identical for the default "add as member" path.
        ...(addAsAdmin ? { role: 'admin' as const } : {})
      })
    )
    cancelAddMembers()
  }

  // ── Destructive-action confirmation (single dialog, state-driven) ────────
  // Replaces three `window.confirm()` calls with the shared
  // `ConfirmationDialog` component for visual consistency with the rest of
  // the app (hospital / lab / diet modules use the same pattern).
  type ConfirmAction =
    | { type: 'exit' }
    | { type: 'exitAndDelete' }
    | { type: 'delete' }
    | { type: 'deleteChat' }
    | { type: 'removeMember'; userId: ChatEntityId; fullName: string }
    // Sole-admin warning — shown when the user is the only admin AND
    // other active members remain. The confirm-button label tracks
    // `underlying` so the dialog only ever surfaces the action the
    // user originally chose in the sidebar:
    //   • Clicked "Exit group" → confirm button reads "Exit"
    //   • Clicked "Exit and delete" → confirm button reads "Exit & Delete for me"
    // Cancel button reads "Make someone admin" and just closes.
    | { type: 'exitAsOnlyAdmin'; underlying: 'exit' | 'exitAndDelete' }

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const closeConfirm = () => setConfirmAction(null)

  // v1.1.3 — "Exit Group" (stay in list as read-only). Different from
  // legacy `leaveGroupChat` thunk which also removed the row from the
  // sidebar. New flow: server flips `participants[].isActive = false`,
  // `participant_left` event mirrors that locally — composer hides via
  // `canInteract` gate but the chat stays visible / scrollable.
  const handleExitGroup = () => {
    if (currentGroupId === null) return
    // Sole-admin guard: warning dialog with confirm button labelled
    // "Exit" (since that's the action the user originally chose).
    if (isOnlyAdmin) {
      setConfirmAction({ type: 'exitAsOnlyAdmin', underlying: 'exit' })

      return
    }
    setConfirmAction({ type: 'exit' })
  }

  // v1.1.3 — "Exit and Delete" (atomic). Server exits AND removes from
  // caller's conversation list in a single write. We also dispatch
  // `removeChatFromList` locally so the sidebar updates without waiting
  // for `conversation_deleted` (server may or may not emit one for this
  // path — local removal is idempotent with the listener).
  const handleExitAndDelete = () => {
    if (currentGroupId === null) return
    // Sole-admin guard: same warning dialog as `handleExitGroup` but
    // the confirm button reads "Exit & Delete for me" since that's the
    // action the user chose. Cancel button "Make someone admin" stays.
    if (isOnlyAdmin) {
      setConfirmAction({ type: 'exitAsOnlyAdmin', underlying: 'exitAndDelete' })

      return
    }
    setConfirmAction({ type: 'exitAndDelete' })
  }

  const handleDeleteGroup = () => {
    if (currentGroupId === null) return
    setConfirmAction({ type: 'delete' })
  }

  // Extracted so the sole-admin warning dialog can fire the same exact
  // flow from its outlined "Exit" button (via `cancelAction`), without
  // duplicating the leave+refetch logic. Closes the host sidebar at the
  // end just like the original inline branch did.
  const performExit = (chatId: string) => {
    const myId = store?.userProfile?.id ?? ''
    leaveConversation(chatId)
      .then(() => getConversation(chatId))
      .then(conv => {
        dispatch(addOrReplaceChat(sdkConversationToChat(conv, String(myId))))
      })
      .catch(err => {
        console.error('[chat] exitGroup failed:', err)
        toast.error('Failed to exit group')
      })
    handleUserProfileRightSidebarToggle()
  }

  // Same pattern for atomic exit-and-delete. Optimistically drops the
  // row locally, then refetches the conversation list as a safety net.
  const performExitAndDelete = (chatId: string) => {
    leaveAndDeleteConversation(chatId)
      .then(() => {
        dispatch(removeChatFromList(chatId))
        dispatch(fetchChatsContacts())
      })
      .catch(err => {
        console.error('[chat] exitAndDelete failed:', err)
        toast.error('Failed to exit and delete group')
      })
    handleUserProfileRightSidebarToggle()
  }

  const runConfirmedAction = () => {
    if (!confirmAction) return
    const chatId = store?.selectedChat?.contact?.id ?? null
    if (chatId === null) return

    // Sole-admin warning's confirm button. The label varies by
    // `underlying` ("Exit" or "Exit & Delete for me"), and so does
    // the action — we route directly to the matching helper. Cancel
    // button ("Make someone admin") closes the dialog without acting.
    if (confirmAction.type === 'exitAsOnlyAdmin') {
      if (typeof chatId === 'string') {
        if (confirmAction.underlying === 'exitAndDelete') {
          performExitAndDelete(chatId)
        } else {
          performExit(chatId)
        }
      }
      closeConfirm()

      return
    }

    if (confirmAction.type === 'exit') {
      // v1.1.3 — Exit Group, stays in list as read-only. Direct SDK
      // call (no Redux thunk) so the legacy `leaveGroupChat` flow stays
      // untouched. The server emits `participant_left` to OTHER members
      // but does NOT broadcast it back to the leaver's own socket (the
      // server removes the leaver from the room before broadcasting),
      // so the leaver's UI wouldn't refresh from the socket alone.
      //
      // Fix: refetch the conversation via REST after the leave API
      // succeeds — the response carries the updated participants array
      // with our `isActive=false`. We feed it through the same adapter
      // + `addOrReplaceChat` reducer that the rest of the app uses, so
      // the sidebar row, header, and Group info panel all re-render
      // with the read-only state. No local reducer patching — the
      // server is the source of truth.
      if (typeof chatId === 'string') {
        performExit(chatId)
      }
    } else if (confirmAction.type === 'exitAndDelete') {
      // v1.1.3 — atomic Exit + Delete via the shared helper so the
      // sole-admin warning's confirm button and the standalone "Exit
      // and delete" sidebar entry share one code path.
      if (typeof chatId === 'string') {
        performExitAndDelete(chatId)
      }
    } else if (confirmAction.type === 'delete') {
      dispatch(deleteConversation(chatId))
      handleUserProfileRightSidebarToggle()
    } else if (confirmAction.type === 'deleteChat') {
      // DM "Delete chat" — same SDK thunk as the group "Delete group"
      // path, just different user-facing copy + a success toast so the
      // local-only hide doesn't feel silent. Reappear-on-new-message is
      // handled by the existing `conversation_created` listener.
      dispatch(deleteConversation(chatId))
      handleUserProfileRightSidebarToggle()
    } else if (confirmAction.type === 'removeMember') {
      if (currentGroupId === null) return
      dispatch(removeParticipantFromGroup({ groupId: currentGroupId, userId: confirmAction.userId }))
    }
    closeConfirm()
  }

  // Derived dialog copy
  const chatName = store?.selectedChat?.contact.fullName ?? 'this chat'
  const confirmCopy = (() => {
    if (!confirmAction) return null
    switch (confirmAction.type) {
      case 'exit':
        // Body copy aligned with the mobile app's "Exit group?" dialog —
        // describes the consequence in member-facing terms ("send or
        // receive messages") instead of the read-only mode mechanics.
        return {
          title: 'Exit group?',
          description: 'You will no longer be able to send or receive messages in this group.',
          confirmText: 'Exit',
          icon: 'mdi:exit-to-app',
          iconColor: '#ff3838'
        }
      case 'exitAsOnlyAdmin':
        // Sole-admin variant. The confirm-button label tracks
        // `underlying`: clicking "Exit group" in the sidebar shows
        // "Exit"; clicking "Exit and delete" shows "Exit & Delete for me".
        // Cancel button = "Make someone admin" → just closes the dialog
        // so the user can promote via the existing member-row kebab.
        return {
          title: 'Exit group?',
          description:
            'You are the only admin. Assign another admin before you leave, otherwise admin rights will be transferred to another member automatically.',
          confirmText: confirmAction.underlying === 'exitAndDelete' ? 'Exit & Delete for me' : 'Exit',
          cancelText: 'Make someone admin',
          icon: 'mdi:shield-account-outline',
          iconColor: '#ff3838'
        }
      case 'exitAndDelete':
        // Body copy aligned with the mobile "Exit group?" dialog so the
        // wording is identical across platforms. The deletion-specific
        // consequence is conveyed by the action label "Exit & Delete
        // for me" rather than the body — matching the mobile pattern.
        return {
          title: 'Exit group?',
          description: 'You will no longer be able to send or receive messages in this group.',
          confirmText: 'Exit & Delete for me',
          icon: 'mdi:exit-run',
          iconColor: '#ff3838'
        }
      case 'delete':
        return {
          title: `Delete "${chatName}"?`,
          description: 'This removes the group from your chat list. Nobody else is affected.',
          confirmText: 'Delete',
          icon: 'mdi:delete',
          iconColor: '#ff3838'
        }
      case 'deleteChat':
        // v1.1.3 — DM delete is local-only (hides from caller's list).
        // The other person is unaffected; the chat reappears when they
        // message again via the `conversation_created` socket event.
        return {
          title: `Delete chat with "${chatName}"?`,
          description:
            'This removes the chat from your list. The other person is not affected. If they message you again, the chat will reappear.',
          confirmText: 'Delete',
          icon: 'mdi:delete',
          iconColor: '#ff3838'
        }
      case 'removeMember':
        return {
          title: `Remove "${confirmAction.fullName}"?`,
          description: `They will no longer be part of "${chatName}".`,
          confirmText: 'Remove',
          icon: 'mdi:account-remove-outline',
          iconColor: '#ff3838'
        }
    }
  })()

  // ── Member-row kebab menu (Remove + Promote/Demote) ──────────────────────
  // We anchor the menu by mouse position instead of by DOM node — the Sidebar
  // wrapper re-renders enough to occasionally invalidate the captured DOM
  // reference, which would land the menu at viewport (0,0). `clientX/clientY`
  // from the click event are always valid viewport coords.
  const [memberMenuPos, setMemberMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [memberMenuTarget, setMemberMenuTarget] = useState<{
    id: ChatEntityId
    isAdmin: boolean
    fullName: string
  } | null>(null)

  const openMemberMenu = (
    e: React.MouseEvent<HTMLElement>,
    target: { id: ChatEntityId; isAdmin: boolean; fullName: string }
  ) => {
    e.stopPropagation()
    setMemberMenuPos({ top: e.clientY, left: e.clientX })
    setMemberMenuTarget(target)
  }
  const closeMemberMenu = () => {
    setMemberMenuPos(null)
    setMemberMenuTarget(null)
  }

  const handleRemoveMember = () => {
    if (currentGroupId === null || !memberMenuTarget) return
    setConfirmAction({
      type: 'removeMember',
      userId: memberMenuTarget.id,
      fullName: memberMenuTarget.fullName
    })
    closeMemberMenu()
  }

  const handleToggleRole = () => {
    if (currentGroupId === null || !memberMenuTarget) return
    const role: 'admin' | 'member' = memberMenuTarget.isAdmin ? 'member' : 'admin'
    dispatch(updateParticipantRoleInGroup({ groupId: currentGroupId, userId: memberMenuTarget.id, role }))
    closeMemberMenu()
  }

  // ── Inline edit for group name + description ─────────────────────────────
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')

  useEffect(() => {
    if (!userProfileRightOpen) setIsEditing(false)
  }, [userProfileRightOpen])

  const openEditGroup = () => {
    if (!isGroup || !store?.selectedChat) return
    setEditName(store.selectedChat.contact.fullName ?? '')
    setEditDescription(store.selectedChat.contact.description ?? '')
    setIsEditing(true)
  }
  const cancelEditGroup = () => setIsEditing(false)
  const saveEditGroup = () => {
    if (currentGroupId === null) return
    dispatch(
      updateGroupChat({
        chatId: currentGroupId,
        name: editName.trim() || undefined,
        description: editDescription.trim() || undefined
      })
    )
    setIsEditing(false)
  }

  // Resolve participant IDs to user profiles. `adminIds` comes from the
  // adapter and reflects the real backend role of each participant.
  const adminIds = store?.selectedChat?.contact.adminIds ?? []
  const adminIdSet = new Set(adminIds.map(String))
  // Current user can only manage members / edit info if they're a group admin.
  const isCurrentUserAdmin = adminIdSet.has(String(currentUserId))

  // Sole-admin guard for the Exit flow. We surface a warning when:
  //   1. The current user is an admin
  //   2. They are the ONLY admin in the group
  //   3. Other active members remain (anyone whose `isActive !== false`,
  //      excluding self). Members who already left are flagged
  //      `isActive: false` server-side and don't count — leaving an
  //      already-empty group strands no one.
  // When all three are true, the group would be left with no admin after
  // the leave — no one could add members / edit info / promote. The
  // warning gives the user a chance to promote someone first.
  const activeOtherMemberCount = (store?.selectedChat?.contact?.participants ?? []).filter(
    p => p.isActive !== false && String(p.userId) !== String(currentUserId)
  ).length
  const isOnlyAdmin = isCurrentUserAdmin && adminIds.length === 1 && activeOtherMemberCount > 0
  const groupMembers = (() => {
    if (!isGroup || !store?.selectedChat) return []
    const ids = store.selectedChat.contact.participantIds ?? []

    return ids.map(id => {
      const isAdmin = adminIdSet.has(String(id))
      if (id === currentUserId) {
        return {
          id,
          fullName: store?.userProfile?.fullName ?? 'You',
          avatar: store?.userProfile?.avatar,
          avatarColor: undefined as any,
          isYou: true,
          isAdmin
        }
      }
      const contact = store?.contacts?.find(c => c.id === id)
      // Fall back to participant details embedded in the conversation
      const participant = store?.selectedChat?.contact?.participants?.find(p => String(p.userId) === String(id))
      const displayName = contact?.fullName ?? participant?.displayName ?? participant?.username ?? null

      return {
        id,
        fullName: displayName ?? `User ${id}`,
        avatar: contact?.avatar ?? participant?.avatarUrl,
        avatarColor: contact?.avatarColor,
        isYou: false,
        isAdmin
      }
    })
  })()

  return (
    <Sidebar
      direction='right'
      show={userProfileRightOpen}
      backDropClick={handleUserProfileRightSidebarToggle}
      sx={{
        zIndex: 9,
        height: '100%',
        width: sidebarWidth,
        borderTopRightRadius: (theme: Theme) => theme.shape.borderRadius,
        borderBottomRightRadius: (theme: Theme) => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
      {store && store.selectedChat && mediaDrawerOpen ? (
        <MediaLinksDocsDrawer
          open={mediaDrawerOpen}
          onClose={() => setMediaDrawerOpen(false)}
          conversationId={contactId}
        />
      ) : store && store.selectedChat && starredDrawerOpen ? (
        <StarredMessagesDrawer
          open={starredDrawerOpen}
          onClose={() => setStarredDrawerOpen(false)}
          conversationId={contactId}
          conversationName={store.selectedChat.contact.fullName}
          currentUserId={store.userProfile?.id ?? ''}
          // Click on a starred row → scroll + flash the message in the
          // main ChatLog behind the drawer. Drawer stays open so the
          // user can click further starred messages without re-opening
          // — matches WhatsApp Web's behavior. User explicitly closes
          // via the back arrow when done browsing.
          onMessageClick={messageId => onScrollToMessage?.(messageId)}
        />
      ) : store && store.selectedChat && isGroup && addingMembers ? (
        <Fragment>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                px: 3,
                py: 3.5,
                borderBottom: theme => `1px solid ${theme.palette.divider}`,
                gap: 2
              }}
            >
              <IconButton size='small' onClick={cancelAddMembers} sx={{ color: 'text.secondary' }}>
                <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
              </IconButton>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>Add members</Typography>
              {selectedToAdd.size > 0 && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 10,
                    backgroundColor: 'customColors.antzSecondaryBg',
                    border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'secondary.dark' }}>
                    {selectedToAdd.size} added
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Body */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ px: 4, pt: 3, pb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  autoFocus
                  value={addQuery}
                  onChange={e => setAddQuery(e.target.value)}
                  placeholder='Search people'
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mdi:magnify' fontSize='1.125rem' />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 6,
                      '& fieldset': {
                        borderColor: 'secondary.main',
                        borderWidth: '0.5px',
                        transition: 'border-color 160ms ease-out, border-width 160ms ease-out'
                      },
                      '&:hover fieldset': { borderColor: 'secondary.main', borderWidth: '2px' },
                      '&.Mui-focused fieldset': { borderColor: 'secondary.main', borderWidth: '2px' }
                    }
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {searching && addableContacts.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                      Searching…
                    </Typography>
                  </Box>
                ) : addableContacts.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                      {addQuery.trim() ? 'No people found' : 'No more users to add'}
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {addableContacts.map((c, index) => {
                      const isSelected = selectedToAdd.has(c.id)

                      return (
                        <Box key={c.id}>
                          <ListItem disablePadding>
                            <ListItemButton
                              onClick={() => toggleAddMember(c.id)}
                              sx={{
                                px: 4,
                                py: 1.5,
                                gap: 3,
                                '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' }
                              }}
                            >
                              <Box sx={{ flexShrink: 0 }}>
                                {c.avatar ? (
                                  <MuiAvatar src={c.avatar} alt={c.fullName} sx={{ width: 42, height: 42 }} />
                                ) : (
                                  <CustomAvatar
                                    skin='light'
                                    color={c.avatarColor}
                                    sx={{
                                      width: 42,
                                      height: 42,
                                      fontSize: '0.875rem',
                                      background: theme =>
                                        `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                                      color: 'common.white',
                                      fontWeight: 600
                                    }}
                                  >
                                    {getAvatarInitials(c.fullName)}
                                  </CustomAvatar>
                                )}
                              </Box>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant='body2'
                                    sx={{ fontWeight: isSelected ? 600 : 400, color: 'customColors.OnSurfaceVariant' }}
                                  >
                                    {c.fullName}
                                  </Typography>
                                }
                              />
                              <Checkbox
                                checked={isSelected}
                                disableRipple
                                size='small'
                                sx={{
                                  flexShrink: 0,
                                  p: 0,
                                  color: 'customColors.SurfaceVariant',
                                  '&.Mui-checked': { color: 'primary.main' },
                                  '& .MuiSvgIcon-root': { fontSize: '1.375rem' }
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                          {index < addableContacts.length - 1 && (
                            <Divider sx={{ ml: '76px', borderColor: 'customColors.OnBackground' }} />
                          )}
                        </Box>
                      )
                    })}
                  </List>
                )}
              </Box>
            </Box>

            {/* Add-as-admin toggle — only visible when at least one
                contact is selected, mirrors WhatsApp's "Add as admin"
                option that appears AFTER you have someone to add. */}
            {selectedToAdd.size > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  px: 4,
                  py: 1.5,
                  borderTop: theme => `1px solid ${theme.palette.divider}`
                }}
              >
                <Icon icon='mdi:shield-account-outline' fontSize='1.25rem' color='customColors.Outline' />
                <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                  Add as admin
                </Typography>
                <Switch
                  color='secondary'
                  size='small'
                  checked={addAsAdmin}
                  onChange={e => setAddAsAdmin(e.target.checked)}
                />
              </Box>
            ) : null}

            {/* Footer */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                p: theme => theme.spacing(3, 4),
                borderTop: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Button variant='outlined' color='inherit' fullWidth onClick={cancelAddMembers}>
                Cancel
              </Button>
              <Button
                variant='contained'
                color='secondary'
                fullWidth
                disabled={selectedToAdd.size === 0}
                onClick={confirmAddMembers}
              >
                {selectedToAdd.size > 0 ? `Add (${selectedToAdd.size})` : 'Add'}
              </Button>
            </Box>
          </Box>
        </Fragment>
      ) : store && store.selectedChat && isGroup ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              px: 3,
              py: 3.5,
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
              gap: 2
            }}
          >
            <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>Group info</Typography>
            <IconButton size='small' onClick={handleUserProfileRightSidebarToggle} sx={{ color: 'text.secondary' }}>
              <Icon icon='mdi:close' fontSize='1.25rem' />
            </IconButton>
          </Box>

          {/* Scrollable body */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {/* ── Avatar (centered) ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 3, px: 4 }}>
              {/* WhatsApp-Web style group icon UI — extracted into its
                  own component so this file stays focused on group info
                  layout rather than icon plumbing. Owns: hover overlay,
                  click menu (View / Upload / Remove), file input, upload
                  via `uploadGroupIcon` thunk, remove via REST + reducer
                  override, and the photo viewer + remove confirm dialog. */}
              <Box sx={{ mb: 2 }}>
                <GroupIconEditor
                  chatId={String(store.selectedChat.contact.id)}
                  avatar={store.selectedChat.contact.avatar}
                  fullName={store.selectedChat.contact.fullName}
                  isAdmin={isCurrentUserAdmin}
                  currentUserId={store.userProfile?.id ?? ''}
                  size={90}
                  getInitials={getAvatarInitials}
                />
              </Box>

              {/* Name + member count */}
              {isEditing ? (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    variant='standard'
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder='Group name'
                    autoFocus
                    slotProps={{
                      input: {
                        inputProps: { maxLength: 50 },
                        startAdornment: (
                          <InputAdornment position='start'>
                            <Icon icon='mdi:pencil-outline' fontSize='1rem' color='inherit' />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position='end'>
                            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                              {editName.length}/50
                            </Typography>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      '& .MuiInput-root': { fontSize: '1rem', fontWeight: 600 },
                      '& .MuiInput-underline:before': { borderBottomColor: 'customColors.SurfaceVariant' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'customColors.Outline'
                      },
                      '& .MuiInput-underline:after': { borderBottomColor: 'secondary.main' }
                    }}
                  />
                  <TextField
                    fullWidth
                    variant='standard'
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder='Description (optional)'
                    slotProps={{
                      input: {
                        inputProps: { maxLength: 200 },
                        startAdornment: (
                          <InputAdornment position='start'>
                            <Icon icon='mdi:text' fontSize='1rem' color='inherit' />
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      '& .MuiInput-root': { fontSize: '0.875rem' },
                      '& .MuiInput-underline:before': { borderBottomColor: 'customColors.SurfaceVariant' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'customColors.Outline'
                      },
                      '& .MuiInput-underline:after': { borderBottomColor: 'secondary.main' }
                    }}
                  />
                  {/* Inline icon actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={cancelEditGroup}
                      sx={{
                        border: theme => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        color: 'text.secondary',
                        '&:hover': { backgroundColor: 'customColors.SurfaceVariant' }
                      }}
                    >
                      <Icon icon='mdi:close' fontSize='1.1rem' />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={saveEditGroup}
                      disabled={!editName.trim()}
                      sx={{
                        border: theme => `1px solid ${theme.palette.secondary.main}`,
                        borderRadius: 2,
                        color: 'secondary.main',
                        '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                        '&.Mui-disabled': { opacity: 0.4 }
                      }}
                    >
                      <Icon icon='mdi:check' fontSize='1.1rem' />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      color: 'customColors.OnSurfaceVariant',
                      textAlign: 'center'
                    }}
                  >
                    {store.selectedChat.contact.fullName}
                  </Typography>
                  {isCurrentUserAdmin && (
                    <IconButton size='small' onClick={openEditGroup} sx={{ color: 'secondary.main' }}>
                      <Icon icon='mdi:pencil-outline' fontSize='0.9rem' />
                    </IconButton>
                  )}
                </Box>
              )}
              {!isEditing && (
                <>
                  {/* Description below name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    {store.selectedChat.contact.description ? (
                      <Tooltip title={store.selectedChat.contact.description} placement='bottom' arrow>
                        <Typography
                          variant='body2'
                          sx={{
                            color: 'customColors.OnSurfaceVariant',
                            textAlign: 'center',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {store.selectedChat.contact.description}
                        </Typography>
                      </Tooltip>
                    ) : isCurrentUserAdmin ? (
                      <Typography
                        variant='body2'
                        onClick={openEditGroup}
                        sx={{ color: 'secondary.main', cursor: 'pointer' }}
                      >
                        Add group description
                      </Typography>
                    ) : null}
                  </Box>
                  {/* Group chip + member count below description */}
                  <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', mt: 1 }}>
                    Group · {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
                  </Typography>
                </>
              )}
            </Box>

            {/* ── Action buttons: Add / Search ──
                Hidden — duplicates already exposed elsewhere:
                  • "Add" → Members section header's Add button below
                  • "Search" → chat header search icon → SearchMessagesDrawer
                Keep the code for future reference / quick re-enable.
            {!isEditing && (
              <Box sx={{ display: 'flex', gap: 2, px: 4, pb: 3 }}>
                {isCurrentUserAdmin && (
                  <Box
                    onClick={openAddMembers}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.75,
                      py: 1.75,
                      borderRadius: 3,
                      border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                      transition: 'background-color 150ms'
                    }}
                  >
                    <Icon icon='mdi:account-plus-outline' fontSize='1.4rem' color='primary.main' />
                    <Typography variant='caption' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
                      Add
                    </Typography>
                  </Box>
                )}
                <Box
                  onClick={onOpenSearch}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 1.75,
                    borderRadius: 3,
                    border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                    transition: 'background-color 150ms'
                  }}
                >
                  <Icon icon='mdi:magnify' fontSize='1.4rem' color='primary.main' />
                  <Typography variant='caption' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
                    Search
                  </Typography>
                </Box>
              </Box>
            )}
            */}

            <Divider sx={{ mx: '5%' }} />

            {/* ── Media, links and docs ── */}
            <Box
              onClick={() => setMediaDrawerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                px: 5,
                py: 3,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                transition: 'background-color 150ms'
              }}
            >
              <Icon icon='mdi:image-multiple-outline' fontSize='1.25rem' color='customColors.Outline' />
              <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                Media, links and docs
              </Typography>
              <Icon icon='mdi:chevron-right' fontSize='1rem' color='customColors.OutlineVariant' />
            </Box>

            {/* ── Starred messages ── */}
            <Box
              onClick={() => setStarredDrawerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                px: 5,
                py: 3,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                transition: 'background-color 150ms'
              }}
            >
              <Icon icon='mdi:star-outline' fontSize='1.25rem' color='customColors.Outline' />
              <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                Starred messages
              </Typography>
              <Icon icon='mdi:chevron-right' fontSize='1rem' color='customColors.OutlineVariant' />
            </Box>

            {/* ── Mute notifications ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 2.75 }}>
              <Icon icon='mdi:bell-off-outline' fontSize='1.25rem' color='customColors.Outline' />
              <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                Mute notifications
              </Typography>
              <Switch
                color='secondary'
                size='small'
                checked={isMuted}
                onChange={e => {
                  if (currentGroupId === null) return
                  if (e.target.checked) dispatch(muteConversation({ chatId: currentGroupId }))
                  else dispatch(unmuteConversation(currentGroupId))
                }}
              />
            </Box>

            {/* ── Pin to top ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 2.75 }}>
              <Icon icon='mdi:pin-outline' fontSize='1.25rem' color='customColors.Outline' />
              <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                Pin to top
              </Typography>
              <Switch
                color='secondary'
                size='small'
                checked={isPinned}
                onChange={e => {
                  if (currentGroupId === null) return
                  if (e.target.checked) {
                    // Block the 6th-pin BEFORE the network call — server
                    // returns 400 once the cap is hit. Always allow unpin
                    // (frees a slot), so the gate runs only on the pin path.
                    const pinnedCount = store?.chats?.filter(c => c.isPinned).length ?? 0
                    if (pinnedCount >= maxPinned) {
                      toast.error(`You can pin up to ${maxPinned} chats. Unpin one first.`)

                      return
                    }
                    dispatch(pinConversation(currentGroupId))
                  } else {
                    dispatch(unpinConversation(currentGroupId))
                  }
                }}
              />
            </Box>

            <Divider sx={{ mx: '5%' }} />

            {/* ── Members ── */}
            <Box sx={{ px: 5, pt: 2.5, pb: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
                {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
              </Typography>
            </Box>

            <List disablePadding>
              {/* Add member row — admin only */}
              {isCurrentUserAdmin && (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={openAddMembers}
                    sx={{
                      px: 5,
                      py: 1.5,
                      gap: 3,
                      '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' }
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        backgroundColor: 'secondary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon icon='mdi:account-plus-outline' fontSize='1.25rem' color='white' />
                    </Box>
                    <Typography variant='body2' sx={{ fontWeight: 500, color: 'secondary.main' }}>
                      Add member
                    </Typography>
                  </ListItemButton>
                </ListItem>
              )}

              {groupMembers.map(m => {
                const dmChat = m.isYou
                  ? null
                  : (store?.chats ?? []).find(
                      c => !c.isGroup && c.participantIds?.some(id => String(id) === String(m.id))
                    )

                return (
                  <Box key={m.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={
                          dmChat
                            ? () => {
                                handleUserProfileRightSidebarToggle()
                                dispatch(selectChat(dmChat.id))
                              }
                            : undefined
                        }
                        sx={{
                          px: 5,
                          py: 1.5,
                          gap: 3,
                          '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                          cursor: dmChat ? 'pointer' : 'default'
                        }}
                      >
                        <Box sx={{ flexShrink: 0 }}>
                          {m.avatar ? (
                            <MuiAvatar src={m.avatar} alt={m.fullName} sx={{ width: 42, height: 42 }} />
                          ) : (
                            <CustomAvatar
                              skin='light'
                              color={m.avatarColor}
                              sx={{
                                width: 42,
                                height: 42,
                                fontSize: '0.875rem',
                                background: theme =>
                                  `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                                color: 'common.white',
                                fontWeight: 600
                              }}
                            >
                              {getAvatarInitials(m.fullName)}
                            </CustomAvatar>
                          )}
                        </Box>
                        <ListItemText
                          primary={
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}
                            >
                              {m.isYou ? 'You' : m.fullName}
                            </Typography>
                          }
                        />
                        {m.isAdmin && (
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.25,
                              borderRadius: 9999,
                              backgroundColor: 'secondary.dark',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: 'common.white',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Admin
                          </Box>
                        )}
                        {isCurrentUserAdmin && !m.isYou && (
                          <IconButton
                            size='medium'
                            edge='end'
                            // Stop the click from bubbling up to the parent
                            // ListItemButton — without this, the row's onClick
                            // (open DM) would fire AND the kebab menu would
                            // open at the same time. `onMouseDown` also stops
                            // propagation so the ripple/keyboard activate of
                            // the parent doesn't trip either.
                            onClick={e => {
                              e.stopPropagation()
                              openMemberMenu(e, { id: m.id, isAdmin: m.isAdmin, fullName: m.fullName })
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            // Bigger hit target so it's harder to miss and
                            // accidentally tap the row instead — ~44×44 (above
                            // the WCAG 2.5.5 / Material minimum touch size).
                            sx={{ p: 2 }}
                          >
                            <Icon icon='mdi:dots-vertical' fontSize='1.125rem' />
                          </IconButton>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Box>
                )
              })}
            </List>

            <Divider sx={{ mx: '5%', mt: 1 }} />

            {/* ── Danger zone ── */}
            {/* v1.1.3 three-tier exit/delete flow:
                  · Exit Group       → leave, stay in list as read-only
                  · Exit and Delete  → atomic exit + remove from list
                  · Delete Group     → admin-only, tears down for everyone
                Legacy `handleLeaveGroup` / `leaveGroupChat` thunk is no
                longer wired into the UI but kept in code so any external
                callers continue to work unchanged. */}
            <List dense sx={{ p: 0, mb: 2 }}>
              {isCurrentUserActive && (
                <ListItem disablePadding>
                  <ListItemButton sx={{ px: 5, py: 4, gap: 4, color: 'error.main' }} onClick={handleExitGroup}>
                    <Icon icon='mdi:exit-to-app' fontSize='1.25rem' />
                    <Typography variant='body2' sx={{ color: 'inherit', fontWeight: 500 }}>
                      Exit group
                    </Typography>
                  </ListItemButton>
                </ListItem>
              )}
              {isCurrentUserActive && (
                <ListItem disablePadding>
                  <ListItemButton sx={{ px: 5, py: 4, gap: 4, color: 'error.main' }} onClick={handleExitAndDelete}>
                    <Icon icon='mdi:exit-run' fontSize='1.25rem' />
                    <Typography variant='body2' sx={{ color: 'inherit', fontWeight: 500 }}>
                      Exit and delete
                    </Typography>
                  </ListItemButton>
                </ListItem>
              )}
              {/* "Delete group" is available ONLY after the user has exited
                  (server-enforced in v1.1.3 — calling delete on an active
                  participant returns 400). Removes the row from this user's
                  list only; nobody else is affected. No admin role needed,
                  any exited participant can use it. */}
              {!isCurrentUserActive && (
                <ListItem disablePadding>
                  <ListItemButton sx={{ px: 5, py: 4, gap: 4, color: 'error.main' }} onClick={handleDeleteGroup}>
                    <Icon icon='mdi:trash-can-outline' fontSize='1.25rem' />
                    <Typography variant='body2' sx={{ color: 'inherit', fontWeight: 500 }}>
                      Delete group
                    </Typography>
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      ) : store && store.selectedChat ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* ── Hero header ───────────────────────────────────────────── */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: 6,
              pb: 4,
              px: 4,
              background: theme =>
                `linear-gradient(160deg, ${theme.palette.customColors.Surface} 0%, ${theme.palette.background.paper} 100%)`,
              borderBottom: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <IconButton
              size='small'
              onClick={handleUserProfileRightSidebarToggle}
              sx={{ position: 'absolute', top: 10, right: 10, color: 'text.disabled' }}
            >
              <Icon icon='mdi:close' fontSize='1.1rem' />
            </IconButton>

            <Badge
              overlap='circular'
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  component='span'
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: `${statusObj[store.selectedChat.contact.status]}.main`,
                    boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`
                  }}
                />
              }
            >
              {store.selectedChat.contact.avatar ? (
                <MuiAvatar
                  src={store.selectedChat.contact.avatar}
                  alt={store.selectedChat.contact.fullName}
                  sx={{ width: 96, height: 96 }}
                />
              ) : (
                <CustomAvatar
                  skin='light'
                  color={store.selectedChat.contact.avatarColor}
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: '2rem',
                    background: theme =>
                      `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                    color: 'common.white',
                    fontWeight: 600
                  }}
                >
                  {getAvatarInitials(store.selectedChat.contact.fullName)}
                </CustomAvatar>
              )}
            </Badge>

            <Typography sx={{ mt: 2.5, fontWeight: 700, fontSize: '1.125rem', color: 'customColors.OnSurfaceVariant' }}>
              {store.selectedChat.contact.fullName}
            </Typography>
            {store.selectedChat.contact.role ? (
              <Typography
                variant='caption'
                sx={{ color: 'customColors.neutralSecondary', textTransform: 'capitalize', mt: 0.5 }}
              >
                {store.selectedChat.contact.role}
              </Typography>
            ) : null}
            {/* DM live-presence line: green "online" or grey "last seen X".
                Renders only for DMs that have an identified peer userId;
                hidden for groups (no presence) and for DMs where the peer
                cannot be resolved (preserves the existing layout). */}
            {dmPeerIdStr ? (
              presenceOnlineUsers.includes(dmPeerIdStr) ? (
                <Typography variant='caption' sx={{ color: 'success.main', mt: 0.5, fontWeight: 500 }}>
                  online
                </Typography>
              ) : formatLastSeen(presenceLastSeenMap[dmPeerIdStr]) ? (
                <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', mt: 0.5 }}>
                  {formatLastSeen(presenceLastSeenMap[dmPeerIdStr])}
                </Typography>
              ) : null
            ) : null}
          </Box>

          {/* ── Scrollable body ───────────────────────────────────────── */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ScrollWrapper>
              <Box sx={{ pb: 6 }}>
                {/* Contact info */}
                {contactUser?.email || contactUser?.phone ? (
                  <>
                    {contactUser?.email ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 2.5 }}>
                        <Icon icon='mdi:email-outline' fontSize='1.25rem' color='customColors.Outline' />
                        <Box>
                          <Typography
                            variant='body2'
                            sx={{ color: 'customColors.OnSurfaceVariant', wordBreak: 'break-all' }}
                          >
                            {contactUser.email}
                          </Typography>
                          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
                            Email
                          </Typography>
                        </Box>
                      </Box>
                    ) : null}
                    {contactUser?.phone ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 2.5 }}>
                        <Icon icon='mdi:phone-outline' fontSize='1.25rem' color='customColors.Outline' />
                        <Box>
                          <Typography variant='body2' sx={{ color: 'customColors.OnSurfaceVariant' }}>
                            {contactUser.phone}
                          </Typography>
                          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
                            Phone
                          </Typography>
                        </Box>
                      </Box>
                    ) : null}
                    <Divider sx={{ mx: '5%' }} />
                  </>
                ) : null}

                {/* Media, links and docs */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    px: 5,
                    py: 4,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                    transition: 'background-color 150ms'
                  }}
                  onClick={() => setMediaDrawerOpen(true)}
                >
                  <Icon icon='mdi:image-multiple-outline' fontSize='1.25rem' color='customColors.Outline' />
                  <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                    Media, links and docs
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize='1rem' color='customColors.OutlineVariant' />
                </Box>

                {/* Starred messages */}
                <Box
                  onClick={() => setStarredDrawerOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    px: 5,
                    py: 4,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                    transition: 'background-color 150ms'
                  }}
                >
                  <Icon icon='mdi:star-outline' fontSize='1.25rem' color='customColors.Outline' />
                  <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                    Starred messages
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize='1rem' color='customColors.OutlineVariant' />
                </Box>

                {/* Mute notifications */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 4 }}>
                  <Icon
                    icon={isMuted ? 'mdi:bell-off-outline' : 'mdi:bell-outline'}
                    fontSize='1.25rem'
                    color='customColors.Outline'
                  />
                  <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                    Mute notifications
                  </Typography>
                  <Switch
                    color='secondary'
                    size='small'
                    checked={isMuted}
                    onChange={e => {
                      if (!contactId) return
                      if (e.target.checked) dispatch(muteConversation({ chatId: contactId }))
                      else dispatch(unmuteConversation(contactId))
                    }}
                  />
                </Box>

                {/* Pin to top */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, px: 5, py: 2.75 }}>
                  <Icon
                    icon={isPinned ? 'mdi:pin' : 'mdi:pin-outline'}
                    fontSize='1.25rem'
                    color='customColors.Outline'
                  />
                  <Typography variant='body2' sx={{ flex: 1, color: 'customColors.OnSurfaceVariant' }}>
                    Pin to top
                  </Typography>
                  <Switch
                    color='secondary'
                    size='small'
                    checked={isPinned}
                    onChange={e => {
                      if (!contactId) return
                      if (e.target.checked) {
                        // Same gate as the group pin switch — block before
                        // the server returns 400 on the 6th pinned chat.
                        const pinnedCount = store?.chats?.filter(c => c.isPinned).length ?? 0
                        if (pinnedCount >= maxPinned) {
                          toast.error(`You can pin up to ${maxPinned} chats. Unpin one first.`)

                          return
                        }
                        dispatch(pinConversation(contactId))
                      } else {
                        dispatch(unpinConversation(contactId))
                      }
                    }}
                  />
                </Box>
                <Divider sx={{ mx: '5%' }} />

                {/* Groups in common */}
                {groupsInCommon.length > 0 ? (
                  <>
                    <Box sx={{ px: 5, py: 4 }}>
                      <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', fontWeight: 500 }}>
                        {groupsInCommon.length} {groupsInCommon.length === 1 ? 'group' : 'groups'} in common
                      </Typography>
                    </Box>
                    {groupsInCommon.map(group => (
                      <Box key={group.id}>
                        <Box
                          onClick={() => {
                            handleUserProfileRightSidebarToggle()
                            dispatch(selectChat(group.id))
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            px: 5,
                            py: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'customColors.antzSecondaryBg' },
                            transition: 'background-color 150ms'
                          }}
                        >
                          {group.avatar ? (
                            <MuiAvatar
                              src={group.avatar}
                              alt={group.fullName}
                              sx={{ width: 42, height: 42, flexShrink: 0 }}
                            />
                          ) : (
                            <CustomAvatar
                              skin='light'
                              color={group.avatarColor}
                              sx={{
                                width: 42,
                                height: 42,
                                fontSize: '0.875rem',
                                flexShrink: 0,
                                background: theme =>
                                  `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                                color: 'common.white',
                                fontWeight: 600
                              }}
                            >
                              {getAvatarInitials(group.fullName)}
                            </CustomAvatar>
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}
                            >
                              {group.fullName}
                            </Typography>
                            <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
                              {group.participantIds?.length ?? 0} members
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                    {/* <Divider sx={{ mx: '5%' }} /> */}
                  </>
                ) : null}

                {/* Delete chat — DM only. v1.1.3 semantics: local-only
                    hide. Server marks the conversation hidden for the
                    caller; the other person is unaffected. Chat reappears
                    automatically via `conversation_created` socket event
                    when the peer sends a new message — listener in
                    AppChat handles that path. */}
                <Box
                  onClick={() => setConfirmAction({ type: 'deleteChat' })}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    px: 5,
                    py: 4,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'customColors.BgTeritary' },
                    transition: 'background-color 150ms'
                  }}
                >
                  <Icon icon='mdi:delete-outline' fontSize='1.25rem' color='customColors.Tertiary' />
                  <Typography variant='body2' sx={{ color: 'customColors.Tertiary', fontWeight: 500 }}>
                    Delete chat
                  </Typography>
                </Box>
              </Box>
            </ScrollWrapper>
          </Box>
        </Box>
      ) : null}

      {/* Member-row kebab menu — anchored to the click coordinates so the menu
          appears right where the user clicked the kebab, independent of how
          the Sidebar tree re-renders. */}
      <Menu
        anchorReference='anchorPosition'
        anchorPosition={memberMenuPos ?? undefined}
        open={Boolean(memberMenuPos)}
        onClose={closeMemberMenu}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        <MenuItem onClick={handleToggleRole}>{memberMenuTarget?.isAdmin ? 'Dismiss as admin' : 'Make admin'}</MenuItem>
        <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
          Remove from group
        </MenuItem>
      </Menu>

      {/* Shared destructive-action confirm — same component used by hospital /
          lab / diet pages so the dialog visual stays consistent with the rest of the app. */}
      <ConfirmationDialog
        dialogBoxStatus={Boolean(confirmCopy)}
        onClose={closeConfirm}
        confirmAction={runConfirmedAction}
        title={confirmCopy?.title}
        description={confirmCopy?.description}
        icon={confirmCopy?.icon}
        iconColor={confirmCopy?.iconColor}
        ConfirmationText={confirmCopy?.confirmText}
        cancelText={confirmCopy?.cancelText ?? 'Cancel'}
        showCloseIcon
        // Match the mobile screenshots — destructive red. The theme's
        // `error.main` (#FF4D49) maps directly to the vivid red shown in
        // the mobile dialog; `error.dark` is the hover. Cancel mirrors
        // it with an outlined variant + low-opacity red hover background.
        // Theme tokens throughout (no hardcoded hex per CLAUDE.md) so a
        // future palette change ripples here automatically.
        confirmBtnStyle={{
          backgroundColor: 'error.main',
          color: 'common.white',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: 'error.dark',
            boxShadow: 'none'
          }
        }}
        cancelBtnStyle={{
          color: 'error.main',
          borderColor: 'error.main',
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': {
            borderColor: 'error.dark',
            backgroundColor: 'customColors.BgTeritary'
          }
        }}
      />
    </Sidebar>
  )
}

export default UserProfileRight
