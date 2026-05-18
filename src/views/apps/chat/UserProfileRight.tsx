'use client'

// ** React Imports
import { Fragment, ReactNode, useEffect, useState } from 'react'

// ** Redux Imports
import { useDispatch } from 'react-redux'
import type { AppDispatch } from 'src/store'
import {
  addParticipantsToGroup,
  leaveGroupChat,
  deleteConversation,
  muteConversation,
  unmuteConversation,
  pinConversation,
  unpinConversation,
  updateGroupChat,
  removeParticipantFromGroup,
  updateParticipantRoleInGroup
} from 'src/store/apps/chat'

// ** Chat SDK
import { getChatClientOrNull } from 'src/lib/chat/client'
import { searchUsers, sdkUserToContact, getUserById } from 'src/lib/chat/api'
import type { User } from 'src/lib/chat/api'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

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

const UserProfileRight = (props: UserProfileRightType) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleUserProfileRightSidebarToggle
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

  // Add-members flow state
  const dispatch = useDispatch<AppDispatch>()
  const [addingMembers, setAddingMembers] = useState<boolean>(false)
  const [addQuery, setAddQuery] = useState<string>('')
  const [selectedToAdd, setSelectedToAdd] = useState<Set<ChatEntityId>>(new Set())
  const [addableContacts, setAddableContacts] = useState<ContactType[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  // Fetch full user details for 1:1 chat profile sidebar
  const [contactUser, setContactUser] = useState<User | null>(null)
  const contactId = store?.selectedChat?.contact?.id
  const isGroup = store?.selectedChat?.contact?.isGroup === true

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
    const t = setTimeout(async () => {
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
    }, q.length ? 300 : 0)

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
  }

  const confirmAddMembers = () => {
    if (currentGroupId === null || selectedToAdd.size === 0) return
    dispatch(addParticipantsToGroup({ groupId: currentGroupId, userIds: Array.from(selectedToAdd) }))
    cancelAddMembers()
  }

  // ── Destructive-action confirmation (single dialog, state-driven) ────────
  // Replaces three `window.confirm()` calls with the shared
  // `ConfirmationDialog` component for visual consistency with the rest of
  // the app (hospital / lab / diet modules use the same pattern).
  type ConfirmAction =
    | { type: 'leave' }
    | { type: 'delete' }
    | { type: 'deleteChat' }
    | { type: 'removeMember'; userId: ChatEntityId; fullName: string }

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const closeConfirm = () => setConfirmAction(null)

  const handleLeaveGroup = () => {
    if (currentGroupId === null) return
    setConfirmAction({ type: 'leave' })
  }

  const handleDeleteGroup = () => {
    if (currentGroupId === null) return
    setConfirmAction({ type: 'delete' })
  }

  const runConfirmedAction = () => {
    if (!confirmAction) return
    const chatId = store?.selectedChat?.contact?.id ?? null
    if (chatId === null) return

    if (confirmAction.type === 'leave') {
      dispatch(leaveGroupChat(chatId))
      handleUserProfileRightSidebarToggle()
    } else if (confirmAction.type === 'delete') {
      dispatch(deleteConversation(chatId))
      handleUserProfileRightSidebarToggle()
    } else if (confirmAction.type === 'deleteChat') {
      dispatch(deleteConversation(chatId))
      handleUserProfileRightSidebarToggle()
    } else if (confirmAction.type === 'removeMember') {
      if (currentGroupId === null) return
      dispatch(
        removeParticipantFromGroup({ groupId: currentGroupId, userId: confirmAction.userId })
      )
    }
    closeConfirm()
  }

  // Derived dialog copy
  const chatName = store?.selectedChat?.contact.fullName ?? 'this chat'
  const confirmCopy = (() => {
    if (!confirmAction) return null
    switch (confirmAction.type) {
      case 'leave':
        return {
          title: `Leave "${chatName}"?`,
          description: "You won't receive new messages.",
          confirmText: 'Leave group',
          icon: 'mdi:exit-to-app',
          iconColor: '#ff3838'
        }
      case 'delete':
        return {
          title: `Delete "${chatName}"?`,
          description: 'This cannot be undone.',
          confirmText: 'Delete',
          icon: 'mdi:delete',
          iconColor: '#ff3838'
        }
      case 'deleteChat':
        return {
          title: `Delete chat with "${chatName}"?`,
          description: 'This will permanently delete the conversation. This cannot be undone.',
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
  const [memberMenuTarget, setMemberMenuTarget] = useState<{ id: ChatEntityId; isAdmin: boolean; fullName: string } | null>(null)

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
    dispatch(
      updateParticipantRoleInGroup({ groupId: currentGroupId, userId: memberMenuTarget.id, role })
    )
    closeMemberMenu()
  }

  // ── Inline edit for group name + description ─────────────────────────────
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')

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

      return {
        id,
        fullName: contact?.fullName ?? `User ${id}`,
        avatar: contact?.avatar,
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
        borderTopRightRadius: theme => theme.shape.borderRadius,
        borderBottomRightRadius: theme => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
      {store && store.selectedChat && isGroup && addingMembers ? (
        <Fragment>
          {/* Header — back arrow + title */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 5,
              py: 4,
              borderBottom: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <IconButton size='small' onClick={cancelAddMembers}>
              <Icon icon='mdi:arrow-left' fontSize='1.375rem' />
            </IconButton>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>Add members</Typography>
          </Box>

          {/* Search + multi-select list */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 8rem)' }}>
            <Box sx={{ px: 5, pt: 3, pb: 2 }}>
              <TextField
                fullWidth
                size='small'
                autoFocus
                value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder='Search contacts'
                sx={{ '& .MuiInputBase-root': { borderRadius: 5 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:magnify' fontSize='1.125rem' />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 3 }}>
              {searching && addableContacts.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Searching…</Typography>
                </Box>
              ) : addableContacts.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {addQuery.trim() ? 'No people found' : 'No more users to add'}
                  </Typography>
                </Box>
              ) : (
                <List dense sx={{ p: 0 }}>
                  {addableContacts.map(c => {
                    const checked = selectedToAdd.has(c.id)

                    return (
                      <ListItem key={c.id} disablePadding>
                        <ListItemButton
                          onClick={() => toggleAddMember(c.id)}
                          sx={{
                            px: 2,
                            py: 1.25,
                            borderRadius: 1,
                            ...(checked && {
                              backgroundColor: 'primary.main',
                              color: 'common.white',
                              '&:hover': { backgroundColor: 'primary.dark' }
                            })
                          }}
                        >
                          <Checkbox
                            edge='start'
                            size='small'
                            checked={checked}
                            tabIndex={-1}
                            disableRipple
                            sx={{
                              mr: 1,
                              p: 0.5,
                              ...(checked && {
                                color: 'common.white',
                                '&.Mui-checked': { color: 'common.white' }
                              })
                            }}
                          />
                          <ListItemIcon sx={{ minWidth: 48 }}>
                            {c.avatar ? (
                              <MuiAvatar src={c.avatar} alt={c.fullName} sx={{ width: 36, height: 36 }} />
                            ) : (
                              <CustomAvatar
                                skin='light'
                                color={c.avatarColor}
                                sx={{ width: 36, height: 36, fontSize: '0.875rem' }}
                              >
                                {getInitials(c.fullName)}
                              </CustomAvatar>
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                sx={{ fontSize: '0.875rem', ...(checked && { color: 'common.white' }) }}
                              >
                                {c.fullName}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Box>
          </Box>

          {/* Footer — Cancel + Add */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              px: 5,
              py: 3,
              borderTop: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <Button variant='outlined' color='inherit' fullWidth onClick={cancelAddMembers}>
              Cancel
            </Button>
            <Button
              variant='contained'
              fullWidth
              disabled={selectedToAdd.size === 0}
              onClick={confirmAddMembers}
            >
              {selectedToAdd.size > 0 ? `Add (${selectedToAdd.size})` : 'Add'}
            </Button>
          </Box>
        </Fragment>
      ) : store && store.selectedChat && isGroup ? (
        <Fragment>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size='small'
              onClick={handleUserProfileRightSidebarToggle}
              sx={{
                top: '0.7rem',
                right: '0.7rem',
                position: 'absolute',
                color: 'text.secondary',
                '& svg': { color: 'action.active' }
              }}
            >
              <Icon icon='mdi:close' />
            </IconButton>
            <Box sx={{ px: 5, pb: 5, pt: 9.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CustomAvatar
                skin='light'
                color='primary'
                sx={{ width: '5rem', height: '5rem', mb: 4 }}
              >
                <Icon icon='mdi:account-group' fontSize='2.25rem' />
              </CustomAvatar>
              {isEditing ? (
                <TextField
                  fullWidth
                  size='small'
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  inputProps={{ maxLength: 50 }}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '1.125rem' }}>
                    {store.selectedChat.contact.fullName}
                  </Typography>
                  {isCurrentUserAdmin ? (
                    <IconButton size='small' onClick={openEditGroup} aria-label='Edit group'>
                      <Icon icon='mdi:pencil-outline' fontSize='1rem' />
                    </IconButton>
                  ) : null}
                </Box>
              )}
              <Typography variant='body2' sx={{ textAlign: 'center', color: 'text.disabled', mt: 0.5 }}>
                {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100% - 13rem)' }}>
            <ScrollWrapper>
              <Box sx={{ px: 5, pb: 5 }}>
                {/* Description */}
                {isEditing ? (
                  <Box sx={{ mb: 5 }}>
                    <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                      Description
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      size='small'
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      inputProps={{ maxLength: 200 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button variant='outlined' color='inherit' fullWidth onClick={cancelEditGroup}>
                        Cancel
                      </Button>
                      <Button variant='contained' fullWidth onClick={saveEditGroup}>
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : store.selectedChat.contact.description ? (
                  <Box sx={{ mb: 5 }}>
                    <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      {store.selectedChat.contact.description}
                    </Typography>
                  </Box>
                ) : null}

                {/* Members */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant='body2' sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    Members ({groupMembers.length})
                  </Typography>
                  {isCurrentUserAdmin ? (
                    <Typography
                      component='button'
                      onClick={openAddMembers}
                      sx={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'primary.main',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { color: 'primary.dark' }
                      }}
                    >
                      <Icon icon='mdi:account-plus-outline' fontSize='1rem' />
                      Add
                    </Typography>
                  ) : null}
                </Box>
                <List dense sx={{ mb: 6, p: 0 }}>
                  {groupMembers.map(m => {
                    const isAdmin = m.isAdmin

                    return (
                      <ListItem key={m.id} disablePadding>
                        <ListItemButton sx={{ px: 2, py: 1.5, borderRadius: 1 }}>
                          <ListItemIcon sx={{ minWidth: 48 }}>
                            {m.avatar ? (
                              <MuiAvatar src={m.avatar} alt={m.fullName} sx={{ width: 36, height: 36 }} />
                            ) : (
                              <CustomAvatar
                                skin='light'
                                color={m.avatarColor}
                                sx={{ width: 36, height: 36, fontSize: '0.875rem' }}
                              >
                                {getInitials(m.fullName)}
                              </CustomAvatar>
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                {m.fullName}
                                {m.isYou ? (
                                  <Typography component='span' sx={{ color: 'text.disabled', ml: 1, fontSize: '0.8125rem' }}>
                                    (You)
                                  </Typography>
                                ) : null}
                              </Typography>
                            }
                          />
                          {isAdmin ? (
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.25,
                                borderRadius: 9999,
                                backgroundColor: 'primary.main',
                                color: 'common.white',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                              }}
                            >
                              Admin
                            </Box>
                          ) : null}
                          {isCurrentUserAdmin && !m.isYou ? (
                            <IconButton
                              size='small'
                              edge='end'
                              sx={{ ml: 1 }}
                              onClick={e =>
                                openMemberMenu(e, {
                                  id: m.id,
                                  isAdmin: m.isAdmin,
                                  fullName: m.fullName
                                })
                              }
                              aria-label='Member actions'
                            >
                              <Icon icon='mdi:dots-vertical' fontSize='1.125rem' />
                            </IconButton>
                          ) : null}
                        </ListItemButton>
                      </ListItem>
                    )
                  })}
                </List>

                {/* Group actions */}
                <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  Group actions
                </Typography>
                <List dense sx={{ p: 0, mb: 6 }}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Switch
                        edge='end'
                        size='small'
                        checked={isMuted}
                        onChange={e => {
                          if (currentGroupId === null) return
                          if (e.target.checked) dispatch(muteConversation({ chatId: currentGroupId }))
                          else dispatch(unmuteConversation(currentGroupId))
                        }}
                      />
                    }
                  >
                    <ListItemButton sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2 }}>
                        <Icon icon='mdi:bell-off-outline' fontSize='1.25rem' />
                      </ListItemIcon>
                      <ListItemText secondary='Mute notifications' />
                    </ListItemButton>
                  </ListItem>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Switch
                        edge='end'
                        size='small'
                        checked={isPinned}
                        onChange={e => {
                          if (currentGroupId === null) return
                          if (e.target.checked) dispatch(pinConversation(currentGroupId))
                          else dispatch(unpinConversation(currentGroupId))
                        }}
                      />
                    }
                  >
                    <ListItemButton sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2 }}>
                        <Icon icon='mdi:pin-outline' fontSize='1.25rem' />
                      </ListItemIcon>
                      <ListItemText secondary='Pin to top' />
                    </ListItemButton>
                  </ListItem>
                </List>

                {/* Danger zone */}
                <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase', fontWeight: 600, color: 'error.main' }}>
                  Danger zone
                </Typography>
                <List dense sx={{ p: 0 }}>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ px: 2 }} onClick={handleLeaveGroup}>
                      <ListItemIcon sx={{ mr: 2, color: 'error.main' }}>
                        <Icon icon='mdi:exit-to-app' fontSize='1.25rem' />
                      </ListItemIcon>
                      <ListItemText
                        secondary={<Typography sx={{ color: 'error.main', fontSize: '0.875rem' }}>Leave group</Typography>}
                      />
                    </ListItemButton>
                  </ListItem>
                  {isCurrentUserAdmin ? (
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }} onClick={handleDeleteGroup}>
                        <ListItemIcon sx={{ mr: 2, color: 'error.main' }}>
                          <Icon icon='mdi:trash-can-outline' fontSize='1.25rem' />
                        </ListItemIcon>
                        <ListItemText
                          secondary={
                            <Typography sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                              Delete group
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ) : null}
                </List>
              </Box>
            </ScrollWrapper>
          </Box>
        </Fragment>
      ) : store && store.selectedChat ? (
        <Fragment>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size='small'
              onClick={handleUserProfileRightSidebarToggle}
              sx={{
                top: '0.7rem',
                right: '0.7rem',
                position: 'absolute',
                color: 'text.secondary',
                '& svg': { color: 'action.active' }
              }}
            >
              <Icon icon='mdi:close' />
            </IconButton>
            <Box sx={{ px: 5, pb: 7, pt: 9.5, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <Badge
                  overlap='circular'
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  badgeContent={
                    <Box
                      component='span'
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        color: `${statusObj[store.selectedChat.contact.status]}.main`,
                        boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                        backgroundColor: `${statusObj[store.selectedChat.contact.status]}.main`
                      }}
                    />
                  }
                >
                  {store.selectedChat.contact.avatar ? (
                    <MuiAvatar
                      sx={{ width: '5rem', height: '5rem' }}
                      src={store.selectedChat.contact.avatar}
                      alt={store.selectedChat.contact.fullName}
                    />
                  ) : (
                    <CustomAvatar
                      skin='light'
                      color={store.selectedChat.contact.avatarColor}
                      sx={{ width: '5rem', height: '5rem', fontSize: '2rem' }}
                    >
                      {getInitials(store.selectedChat.contact.fullName)}
                    </CustomAvatar>
                  )}
                </Badge>
              </Box>
              <Typography sx={{ textAlign: 'center', mb: 0.5, fontWeight: 600 }}>
                {store.selectedChat.contact.fullName}
              </Typography>
              <Typography sx={{ textAlign: 'center', textTransform: 'capitalize' }} variant='body2'>
                {store.selectedChat.contact.role}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100% - 12.25rem)' }}>
            <ScrollWrapper>
              <Box sx={{ p: 5 }}>
                <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase' }}>
                  Personal Information
                </Typography>
                <List dense sx={{ mb: 6, p: 0 }}>
                  {contactUser?.email ? (
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2 }}>
                          <Icon icon='mdi:email-outline' fontSize='1.25rem' />
                        </ListItemIcon>
                        <ListItemText secondary={contactUser.email} />
                      </ListItemButton>
                    </ListItem>
                  ) : null}
                  {contactUser?.phone ? (
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2 }}>
                          <Icon icon='mdi:phone-outline' fontSize='1.25rem' />
                        </ListItemIcon>
                        <ListItemText secondary={contactUser.phone} />
                      </ListItemButton>
                    </ListItem>
                  ) : null}
                  {contactUser?.username ? (
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2 }}>
                          <Icon icon='mdi:account-outline' fontSize='1.25rem' />
                        </ListItemIcon>
                        <ListItemText secondary={contactUser.username} />
                      </ListItemButton>
                    </ListItem>
                  ) : null}
                </List>
                <Typography variant='body2' sx={{ mb: 1.5, textTransform: 'uppercase' }}>
                  Options
                </Typography>
                <List dense sx={{ p: 0 }}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Switch
                        edge='end'
                        size='small'
                        checked={isMuted}
                        onChange={e => {
                          if (!contactId) return
                          if (e.target.checked) dispatch(muteConversation({ chatId: contactId }))
                          else dispatch(unmuteConversation(contactId))
                        }}
                      />
                    }
                  >
                    <ListItemButton sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2 }}>
                        <Icon icon='mdi:bell-off-outline' fontSize='1.25rem' />
                      </ListItemIcon>
                      <ListItemText secondary='Mute notifications' />
                    </ListItemButton>
                  </ListItem>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Switch
                        edge='end'
                        size='small'
                        checked={isPinned}
                        onChange={e => {
                          if (!contactId) return
                          if (e.target.checked) dispatch(pinConversation(contactId))
                          else dispatch(unpinConversation(contactId))
                        }}
                      />
                    }
                  >
                    <ListItemButton sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2 }}>
                        <Icon icon='mdi:pin-outline' fontSize='1.25rem' />
                      </ListItemIcon>
                      <ListItemText secondary='Pin to top' />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
            </ScrollWrapper>
          </Box>
        </Fragment>
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
        <MenuItem onClick={handleToggleRole}>
          {memberMenuTarget?.isAdmin ? 'Demote to member' : 'Make admin'}
        </MenuItem>
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
        cancelText='Cancel'
      />
    </Sidebar>
  )
}

export default UserProfileRight
