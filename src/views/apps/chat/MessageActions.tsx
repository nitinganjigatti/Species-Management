'use client'

import { useState, MouseEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Popover from '@mui/material/Popover'
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

// Quick reactions — kept inline; not worth shipping a full picker.
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface MessageActionsProps {
  chat: ChatLogChatType
  isSender: boolean
  senderName?: string
  senderId?: string | number
  canPin?: boolean
  // Only sender's own text messages can be edited. Attachment bubbles never
  // need edit, so the parent can suppress the menu item by passing false.
  showEdit?: boolean
  // Hover state lives on the wrapping bubble — when the user hovers over the
  // bubble OR the menu is open, icons should be visible. Parent decides.
  alwaysVisible?: boolean
  // When the bubble is media-only (no text), there's nothing meaningful to
  // copy. Hide the "Copy text" item.
  showCopyText?: boolean
}

/**
 * Self-contained per-message actions surface — the 3-dot menu, reaction
 * picker, and delete confirmation dialog. Stateless w.r.t. position — the
 * parent component decides where to place this in the bubble layout.
 *
 * Used by:
 *   - MessageBubble — for text bubbles
 *   - ChatLog — for attachment-only bubbles (audio / video / document / image)
 */
const MessageActions = ({
  chat,
  isSender,
  senderName,
  senderId,
  canPin,
  showEdit = true,
  alwaysVisible = false,
  showCopyText = true
}: MessageActionsProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [pickerAnchor, setPickerAnchor] = useState<null | HTMLElement>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<null | 'me' | 'everyone'>(null)
  const [deleting, setDeleting] = useState(false)
  const menuOpen = Boolean(menuAnchor)
  const pickerOpen = Boolean(pickerAnchor)
  const dispatch = useDispatch<AppDispatch>()
  const currentUserId = useSelector((s: RootState) => s.chat?.userProfile?.id ?? null)

  const handleMenuOpen = (e: MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget)
  const handleMenuClose = () => setMenuAnchor(null)
  const handleOpenPicker = (e: MouseEvent<HTMLButtonElement>) => setPickerAnchor(e.currentTarget)
  const handleClosePicker = () => setPickerAnchor(null)

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
    if (!chat.id) return
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

  const handleToggleStar = () => {
    handleMenuClose()
    if (!chat.id) return
    const willStar = !chat.isStarred
    dispatch(setMessageStarred({ messageId: chat.id, isStarred: willStar }))
    const call = willStar ? starMessage(chat.id) : unstarMessage(chat.id)
    call.catch(err => {
      console.error('[chat] star toggle failed:', err)
      toast.error('Couldn’t update star')
      dispatch(setMessageStarred({ messageId: chat.id as string, isStarred: !willStar }))
    })
  }

  const handleTogglePin = () => {
    handleMenuClose()
    if (!chat.id) return
    const call = chat.isPinned ? unpinMessageOverSocket(chat.id) : pinMessageOverSocket(chat.id)
    call.catch(err => {
      console.error('[chat] pin toggle failed:', err)
      toast.error('Couldn’t update pin')
    })
  }

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

  // CSS visibility — icons appear on hover (set by parent via `alwaysVisible`
  // OR when one of the popovers is open so the icon doesn't vanish under the
  // pointer).
  const iconVisible = alwaysVisible || menuOpen || pickerOpen

  return (
    <Box sx={{ display: 'flex', flexDirection: isSender ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 0.5 }}>
      <IconButton
        size='small'
        aria-label='React to message'
        className='msg-actions'
        data-open={pickerOpen ? 'true' : 'false'}
        onClick={handleOpenPicker}
        disabled={!chat.id}
        sx={{
          opacity: iconVisible ? 1 : 0,
          pointerEvents: iconVisible ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          color: 'customColors.Outline'
        }}
      >
        <Icon icon='mdi:emoticon-happy-outline' fontSize='1.125rem' />
      </IconButton>
      <IconButton
        size='small'
        aria-label='Message actions'
        className='msg-actions'
        data-open={menuOpen ? 'true' : 'false'}
        onClick={handleMenuOpen}
        sx={{
          opacity: iconVisible ? 1 : 0,
          pointerEvents: iconVisible ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          color: 'customColors.Outline'
        }}
      >
        <Icon icon='mdi:chevron-down' fontSize='1.125rem' />
      </IconButton>

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
        {isSender && showEdit ? (
          <MenuItem onClick={handleEdit} disabled={!chat.id}>
            <ListItemIcon>
              <Icon icon='mdi:pencil-outline' fontSize='1rem' />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        ) : null}
        {showCopyText && chat.msg ? (
          <MenuItem onClick={handleCopy}>
            <ListItemIcon>
              <Icon icon='mdi:content-copy' fontSize='1rem' />
            </ListItemIcon>
            <ListItemText>Copy text</ListItemText>
          </MenuItem>
        ) : null}
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

export default MessageActions
