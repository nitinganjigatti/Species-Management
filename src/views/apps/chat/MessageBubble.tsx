'use client'

import { useState, MouseEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Popover from '@mui/material/Popover'
import Chip from '@mui/material/Chip'
import toast from 'react-hot-toast'

// ** Redux
import { useDispatch, useSelector } from 'react-redux'
import { setReplyingTo, setEditingMessage, setMessageStarred } from 'src/store/apps/chat'
import type { AppDispatch, RootState } from 'src/store'

// ** SDK
import {
  addReactionOverSocket,
  removeReactionOverSocket,
  deleteMessageOverSocket,
  deleteMessageForMeOverSocket,
  starMessage,
  unstarMessage,
  pinMessageOverSocket,
  unpinMessageOverSocket
} from 'src/lib/chat/api'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Common confirmation dialog (shared across the app)
import ConfirmationDialog from 'src/components/confirmation-dialog'

// ** Types
import type { ChatLogChatType } from 'src/types/apps/chatTypes'

// Hardcoded common reactions — keep small to avoid bundling a full picker.
// "More" disabled in phase 3; can swap in @emoji-mart/react later if needed.
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface MessageBubbleProps {
  chat: ChatLogChatType
  isSender: boolean
  // Display name of the sender of this bubble — used to populate the reply
  // reference when this message becomes the target of a reply.
  senderName?: string
  senderId?: string | number
  // Pin gating: in DMs only sender can pin; in groups only admins can pin.
  // ChatLog computes both and passes them in.
  canPin?: boolean
}

/**
 * Single text bubble + interaction surface.
 *
 * Phase 1 scope:
 *   - Renders the bubble (same visual as the inlined version it replaces)
 *   - Shows a 3-dot icon button on hover (or always on touch devices)
 *   - Opens a Menu with "Copy text"
 *
 * Future phases add: Reply, React, Star, Pin, Edit, Delete.
 */
const MessageBubble = ({ chat, isSender, senderName, senderId, canPin }: MessageBubbleProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [pickerAnchor, setPickerAnchor] = useState<null | HTMLElement>(null)
  const [hovered, setHovered] = useState(false)
  // Delete confirmation — which variant is pending, if any.
  const [confirmingDelete, setConfirmingDelete] = useState<null | 'me' | 'everyone'>(null)
  const [deleting, setDeleting] = useState(false)
  const menuOpen = Boolean(menuAnchor)
  const pickerOpen = Boolean(pickerAnchor)
  const dispatch = useDispatch<AppDispatch>()
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  const handleMenuOpen = (e: MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget)
  const handleMenuClose = () => setMenuAnchor(null)

  const handleCopy = async () => {
    handleMenuClose()
    if (!chat.msg) return
    try {
      await navigator.clipboard.writeText(chat.msg)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleReply = () => {
    handleMenuClose()
    if (!chat.id) return // can't reply to messages that haven't been ack'd yet
    dispatch(
      setReplyingTo({
        messageId: chat.id,
        senderId: senderId ?? '',
        senderName,
        textPreview: chat.msg?.slice(0, 120) ?? '',
        hasAttachment: Boolean(chat.attachments?.length)
      })
    )
  }

  const handleEdit = () => {
    handleMenuClose()
    if (!chat.id || !chat.msg) return
    dispatch(setEditingMessage({ messageId: chat.id, originalText: chat.msg }))
  }

  // Menu items just open the confirmation dialog with the requested variant.
  // The dialog's confirm button calls the actual SDK delete.
  const handleDeleteForEveryone = () => {
    handleMenuClose()
    if (!chat.id) return
    setConfirmingDelete('everyone')
  }

  const handleDeleteForMe = () => {
    handleMenuClose()
    if (!chat.id) return
    setConfirmingDelete('me')
  }

  const handleConfirmDelete = async () => {
    if (!chat.id || !confirmingDelete) return
    const call =
      confirmingDelete === 'everyone'
        ? deleteMessageOverSocket(chat.id)
        : deleteMessageForMeOverSocket(chat.id)
    setDeleting(true)
    try {
      await call
      setConfirmingDelete(null)
    } catch (err) {
      console.error('[chat] delete failed:', err)
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleTogglePin = () => {
    handleMenuClose()
    if (!chat.id) return
    const willPin = !chat.isPinned
    const call = willPin ? pinMessageOverSocket(chat.id) : unpinMessageOverSocket(chat.id)
    call.catch(err => {
      console.error('[chat] pin toggle failed:', err)
      toast.error('Couldn’t update pin')
    })
    // Optimistic broadcast event will come back via `message_pin_updated` →
    // `applyMessagePin` reducer. No local dispatch here.
  }

  const handleToggleStar = () => {
    handleMenuClose()
    if (!chat.id) return
    const willStar = !chat.isStarred
    // Optimistic — flip local immediately, then call REST. If the call fails
    // we revert so the UI reflects reality.
    dispatch(setMessageStarred({ messageId: chat.id, isStarred: willStar }))
    const call = willStar ? starMessage(chat.id) : unstarMessage(chat.id)
    call.catch(err => {
      console.error('[chat] star toggle failed:', err)
      toast.error('Couldn’t update star')
      dispatch(setMessageStarred({ messageId: chat.id as string, isStarred: !willStar }))
    })
  }

  const handleOpenPicker = (e: MouseEvent<HTMLButtonElement>) => setPickerAnchor(e.currentTarget)
  const handleClosePicker = () => setPickerAnchor(null)

  // Toggle our reaction with `emoji` on this message. If we already reacted
  // with it, remove; otherwise add. Optimistic-friendly — the server's
  // `reaction_updated` event will overwrite with the authoritative array.
  const handleToggleReaction = (emoji: string) => {
    handleClosePicker()
    if (!chat.id) return
    const me = currentUserId != null ? String(currentUserId) : ''
    const existing = chat.reactions?.find(r => r.emoji === emoji)
    const alreadyReacted = !!(existing && me && existing.userIds.includes(me))
    const fn = alreadyReacted ? removeReactionOverSocket : addReactionOverSocket
    fn(chat.id, emoji).catch(err => {
      console.error('[chat] toggle reaction failed:', err)
      toast.error('Reaction failed')
    })
  }

  // Scroll to the original message when the user clicks the reply snippet.
  // The bubble carries `data-msg-id` (set in ChatLog) so we can locate it.
  const handleReplySnippetClick = () => {
    if (!chat.replyTo?.messageId) return
    const el = document.querySelector(`[data-msg-id="${chat.replyTo.messageId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('msg-flash')
    setTimeout(() => el.classList.remove('msg-flash'), 1200)
  }

  // Tombstone for "delete for everyone" — render a muted placeholder in place
  // of the original bubble, no actions surface.
  if (chat.isDeletedForEveryone) {
    return (
      <Box
        sx={{
          boxShadow: 1,
          borderRadius: 1,
          maxWidth: '100%',
          width: 'fit-content',
          p: theme => theme.spacing(2.5, 4),
          borderTopLeftRadius: !isSender ? 0 : undefined,
          borderTopRightRadius: isSender ? 0 : undefined,
          backgroundColor: 'background.paper',
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Icon icon='mdi:cancel' fontSize='0.875rem' />
        <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'inherit' }}>
          This message was deleted
        </Typography>
      </Box>
    )
  }

  if (!chat.msg) return null

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexDirection: isSender ? 'row-reverse' : 'row',
        gap: 1,
        // Show the actions icon on hover OR while the menu is open.
        '&:hover .msg-actions, & .msg-actions[data-open="true"]': {
          opacity: 1,
          pointerEvents: 'auto'
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
      <Box
        data-msg-id={chat.id ?? undefined}
        sx={{
          boxShadow: 1,
          borderRadius: 1,
          maxWidth: '100%',
          width: 'fit-content',
          p: theme => theme.spacing(3, 4),
          borderTopLeftRadius: !isSender ? 0 : undefined,
          borderTopRightRadius: isSender ? 0 : undefined,
          color: isSender ? 'common.white' : 'text.primary',
          backgroundColor: isSender ? 'primary.main' : 'background.paper'
        }}
      >
        {chat.replyTo ? (
          <Box
            onClick={handleReplySnippetClick}
            sx={{
              cursor: chat.replyTo.messageId ? 'pointer' : 'default',
              borderLeft: theme =>
                `3px solid ${isSender ? theme.palette.common.white : theme.palette.primary.main}`,
              pl: 1.5,
              py: 0.5,
              mb: 1,
              opacity: 0.85
            }}
          >
            <Typography
              variant='caption'
              sx={{ display: 'block', fontWeight: 600, color: 'inherit' }}
            >
              {chat.replyTo.senderName ?? 'Replied message'}
            </Typography>
            <Typography
              variant='caption'
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'inherit'
              }}
            >
              {chat.replyTo.textPreview ||
                (chat.replyTo.hasAttachment ? '📎 Attachment' : 'Original message')}
            </Typography>
          </Box>
        ) : null}
        <Typography sx={{ fontSize: '0.875rem', wordWrap: 'break-word', color: 'inherit' }}>
          {chat.msg}
          {chat.isPinned ? (
            <Box
              component='span'
              sx={{ ml: 1, display: 'inline-flex', verticalAlign: 'middle', color: 'inherit', opacity: 0.85 }}
              aria-label='pinned'
            >
              <Icon icon='mdi:pin' fontSize='0.875rem' />
            </Box>
          ) : null}
          {chat.isStarred ? (
            <Box
              component='span'
              sx={{ ml: 1, display: 'inline-flex', verticalAlign: 'middle', color: 'inherit', opacity: 0.85 }}
              aria-label='starred'
            >
              <Icon icon='mdi:star' fontSize='0.875rem' />
            </Box>
          ) : null}
          {chat.isEdited ? (
            <Typography
              component='span'
              variant='caption'
              sx={{ ml: 1, opacity: 0.7, fontStyle: 'italic', color: 'inherit' }}
            >
              (edited)
            </Typography>
          ) : null}
        </Typography>
      </Box>

      {chat.reactions && chat.reactions.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            ml: isSender ? 'auto' : 0,
            mr: isSender ? 0 : 'auto',
            mt: 0.25
          }}
        >
          {chat.reactions.map(r => {
            const me = currentUserId != null ? String(currentUserId) : ''
            const youReacted = !!(me && r.userIds.includes(me))

            return (
              <Chip
                key={r.emoji}
                size='small'
                onClick={() => handleToggleReaction(r.emoji)}
                label={
                  <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{r.emoji}</span>
                    <Typography component='span' variant='caption'>
                      {r.count}
                    </Typography>
                  </Box>
                }
                sx={{
                  height: 22,
                  cursor: 'pointer',
                  borderColor: theme =>
                    youReacted ? theme.palette.primary.main : theme.palette.divider,
                  backgroundColor: theme =>
                    youReacted ? theme.palette.action.selected : theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: theme => theme.palette.action.hover
                  },
                  '& .MuiChip-label': { px: 0.75 }
                }}
                variant='outlined'
              />
            )
          })}
        </Box>
      ) : null}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: isSender ? 'row-reverse' : 'row', alignSelf: 'flex-start', mt: 0.5 }}>
        <IconButton
          size='small'
          aria-label='React to message'
          className='msg-actions'
          data-open={pickerOpen ? 'true' : 'false'}
          onClick={handleOpenPicker}
          disabled={!chat.id}
          sx={{
            opacity: hovered || pickerOpen ? 1 : 0,
            pointerEvents: hovered || pickerOpen ? 'auto' : 'none',
            transition: 'opacity 150ms ease',
            color: 'customColors.Outline'
          }}
        >
          <Icon icon='mdi:emoticon-happy-outline' fontSize='1.125rem' />
        </IconButton>
      </Box>

      <Popover
        anchorEl={pickerAnchor}
        open={pickerOpen}
        onClose={handleClosePicker}
        anchorOrigin={{ vertical: 'top', horizontal: isSender ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: isSender ? 'right' : 'left' }}
        slotProps={{ paper: { sx: { px: 1, py: 0.5, borderRadius: 999 } } }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {QUICK_REACTIONS.map(emoji => (
            <IconButton
              key={emoji}
              size='small'
              aria-label={`React with ${emoji}`}
              onClick={() => handleToggleReaction(emoji)}
              sx={{ fontSize: '1.25rem' }}
            >
              <span>{emoji}</span>
            </IconButton>
          ))}
        </Box>
      </Popover>

      <IconButton
        size='small'
        aria-label='Message actions'
        className='msg-actions'
        data-open={menuOpen ? 'true' : 'false'}
        onClick={handleMenuOpen}
        sx={{
          opacity: hovered || menuOpen ? 1 : 0,
          pointerEvents: hovered || menuOpen ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          color: 'customColors.Outline',
          alignSelf: 'flex-start',
          mt: 0.5
        }}
      >
        <Icon icon='mdi:chevron-down' fontSize='1.125rem' />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: isSender ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: isSender ? 'right' : 'left' }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        <MenuItem onClick={handleReply} disabled={!chat.id}>
          <ListItemIcon>
            <Icon icon='mdi:reply' fontSize='1rem' />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleStar} disabled={!chat.id}>
          <ListItemIcon>
            <Icon icon={chat.isStarred ? 'mdi:star' : 'mdi:star-outline'} fontSize='1rem' />
          </ListItemIcon>
          <ListItemText>{chat.isStarred ? 'Unstar' : 'Star'}</ListItemText>
        </MenuItem>
        {canPin ? (
          <MenuItem onClick={handleTogglePin} disabled={!chat.id}>
            <ListItemIcon>
              <Icon icon={chat.isPinned ? 'mdi:pin-off-outline' : 'mdi:pin-outline'} fontSize='1rem' />
            </ListItemIcon>
            <ListItemText>{chat.isPinned ? 'Unpin' : 'Pin'}</ListItemText>
          </MenuItem>
        ) : null}
        {isSender ? (
          <MenuItem onClick={handleEdit} disabled={!chat.id}>
            <ListItemIcon>
              <Icon icon='mdi:pencil-outline' fontSize='1rem' />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <Icon icon='mdi:content-copy' fontSize='1rem' />
          </ListItemIcon>
          <ListItemText>Copy text</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteForMe} disabled={!chat.id}>
          <ListItemIcon>
            <Icon icon='mdi:delete-outline' fontSize='1rem' />
          </ListItemIcon>
          <ListItemText>Delete for me</ListItemText>
        </MenuItem>
        {isSender ? (
          <MenuItem onClick={handleDeleteForEveryone} disabled={!chat.id} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Icon icon='mdi:delete-forever-outline' fontSize='1rem' color='inherit' />
            </ListItemIcon>
            <ListItemText>Delete for everyone</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>

      <ConfirmationDialog
        dialogBoxStatus={confirmingDelete !== null}
        onClose={() => (deleting ? null : setConfirmingDelete(null))}
        loading={deleting}
        icon='mdi:delete-outline'
        title={confirmingDelete === 'everyone' ? 'Delete for everyone?' : 'Delete this message?'}
        description={
          confirmingDelete === 'everyone'
            ? 'This message will be removed for all participants. This cannot be undone.'
            : 'This message will be removed only from your view.'
        }
        ConfirmationText='Delete'
        cancelText='Cancel'
        confirmBtnStyle={{
          bgcolor: 'error.main',
          '&:hover': { bgcolor: 'error.dark' }
        }}
        confirmAction={handleConfirmDelete}
      />
    </Box>
  )
}

export default MessageBubble
