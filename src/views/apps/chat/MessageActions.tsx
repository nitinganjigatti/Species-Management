'use client'

import { useState, MouseEvent } from 'react'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import toast from 'react-hot-toast'

// ** Redux
import { useDispatch, useSelector } from 'react-redux'
import { setReplyingTo, setEditingMessage, setMessageStarred, setInfoMessage } from 'src/store/apps/chat'
import type { AppDispatch, RootState } from 'src/store'

// ** SDK
import {
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

interface MessageActionsProps {
  chat: ChatLogChatType
  isSender: boolean
  senderName?: string
  senderId?: string | number
  canPin?: boolean
  showEdit?: boolean
  showCopyText?: boolean
}

/**
 * 3-dot (chevron) menu trigger that lives INSIDE the message bubble's
 * top-right corner — WhatsApp-Web-style. Owns the action menu + delete
 * confirmation dialog. The reaction picker is a separate component
 * (MessageReactionPicker) that sits OUTSIDE the bubble.
 *
 * Used by:
 *   - MessageBubble (text bubbles)
 *   - ChatLog (attachment-only bubbles)
 */
const MessageActions = ({
  chat,
  isSender,
  senderName,
  senderId,
  canPin,
  showEdit = true,
  showCopyText = true
}: MessageActionsProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<null | 'me' | 'everyone'>(null)
  const [deleting, setDeleting] = useState(false)
  const menuOpen = Boolean(menuAnchor)
  const dispatch = useDispatch<AppDispatch>()

  // Tenant-tunable mutation windows from `Conversation.settings.messageConfig`.
  // Adapter maps them onto `selectedChat.contact`. If undefined, fall back to
  // "always allowed" so we don't accidentally hide actions on a backend that
  // hasn't surfaced messageConfig yet.
  const editWindowSeconds = useSelector(
    (s: RootState) => s.chat?.selectedChat?.contact.editWindowSeconds
  )
  const deleteWindowSeconds = useSelector(
    (s: RootState) => s.chat?.selectedChat?.contact.deleteWindowSeconds
  )

  // Whether `chat.time` is still within `windowSeconds` of now. Defensive
  // against missing window (undefined → no restriction → always allowed) and
  // malformed timestamps (NaN → fail closed = treat as expired).
  const isWithinWindow = (windowSeconds: number | undefined): boolean => {
    if (windowSeconds === undefined || windowSeconds === null) return true
    if (!chat.time) return false
    const sentMs = new Date(chat.time).getTime()
    if (Number.isNaN(sentMs)) return false

    return Date.now() - sentMs <= windowSeconds * 1000
  }

  const canEdit = isWithinWindow(editWindowSeconds)
  const canDeleteForEveryone = isWithinWindow(deleteWindowSeconds)

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
      confirmingDelete === 'everyone' ? deleteMessageOverSocket(chat.id) : deleteMessageForMeOverSocket(chat.id)
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

  return (
    <>
      <IconButton
        size='small'
        aria-label='Message actions'
        className='msg-actions'
        data-open={menuOpen ? 'true' : 'false'}
        onClick={handleMenuOpen}
        disabled={!chat.id}
        sx={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          // Translucent dark backdrop so the chevron reads against EITHER the
          // bubble color OR any white embedded element underneath it (audio
          // controls, pdf preview, light image). Without this, the white
          // chevron disappears on top of audio's default white control row.
          color: 'common.white',
          bgcolor: isSender ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.45)',
          '&:hover': {
            bgcolor: isSender ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.6)'
          },
          p: 0.25
        }}
      >
        <Icon icon='mdi:chevron-down' fontSize='1.25rem' />
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
        {isSender && showEdit && canEdit ? (
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
          <MenuItem
            onClick={() => {
              handleMenuClose()
              if (!chat.id) return
              // Dispatch instead of opening a local drawer — the Sidebar
              // primitive uses `position: absolute` so it must mount at
              // the chat shell root (ChatContent), not inside the bubble
              // (which is buried in a scroll container that traps it).
              dispatch(
                setInfoMessage({
                  messageId: chat.id,
                  messageText: chat.msg,
                  readBy: chat.readBy,
                  deliveredTo: chat.deliveredTo
                })
              )
            }}
            disabled={!chat.id}
          >
            <ListItemIcon>
              <Icon icon='mdi:information-outline' fontSize='1rem' />
            </ListItemIcon>
            <ListItemText>Info</ListItemText>
          </MenuItem>
        ) : null}
        {isSender && canDeleteForEveryone ? (
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

    </>
  )
}

export default MessageActions
