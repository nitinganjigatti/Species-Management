'use client'

import { useMemo, useState, ChangeEvent } from 'react'

// ** MUI
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Radio from '@mui/material/Radio'
import Divider from '@mui/material/Divider'

// ** Redux
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { AppDispatch, RootState } from 'src/store'
import { forwardMessage, setForwardingMessage } from 'src/store/apps/chat'

// ** Components
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { getInitials } from 'src/@core/utils/get-initials'

// ** Forward marker
import { stripForwardMarker } from 'src/lib/chat/forwardMarker'

// ** Types
import type { ChatEntityId, ChatsArrType } from 'src/types/apps/chatTypes'

// Display label for the source preview when the message has no text body.
// Mirrors the WhatsApp pattern of showing an attachment summary instead.
const attachmentSummary = (attachments?: { type: string }[]) => {
  if (!attachments?.length) return ''
  if (attachments.length === 1) {
    const t = attachments[0].type
    if (t === 'image') return '📷 Photo'
    if (t === 'video') return '🎬 Video'
    if (t === 'audio') return '🎵 Audio'

    return '📎 Document'
  }

  return `📎 ${attachments.length} attachments`
}

const ForwardMessageDialog = () => {
  const dispatch = useDispatch<AppDispatch>()

  const forwarding = useSelector((s: RootState) => s.chat?.forwardingMessage ?? null)
  const chats = useSelector((s: RootState) => s.chat?.chats ?? [])

  const open = forwarding !== null
  const [query, setQuery] = useState('')
  const [targetId, setTargetId] = useState<ChatEntityId | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onClose = () => {
    if (submitting) return
    setQuery('')
    setTargetId(null)
    dispatch(setForwardingMessage(null))
  }

  const previewText = useMemo(() => stripForwardMarker(forwarding?.messageText).trim(), [forwarding?.messageText])
  const previewAttachmentSummary = useMemo(() => attachmentSummary(forwarding?.attachments), [forwarding?.attachments])

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats

    return chats.filter(c => c.fullName?.toLowerCase().includes(q))
  }, [chats, query])

  const handleSubmit = async () => {
    if (!forwarding || !targetId) return
    setSubmitting(true)
    try {
      await dispatch(
        forwardMessage({
          sourceMessageId: forwarding.messageId,
          sourceText: forwarding.messageText,
          sourceAttachments: forwarding.attachments,
          targetChatId: targetId,
          // Stay on the source chat after forwarding. Without this the
          // thunk dispatches `selectChat(targetChatId)`, which swaps the
          // open conversation + refetches its messages — felt to the user
          // like the page "refreshed" into the recipient's thread.
          openTargetAfter: false
        })
      ).unwrap()
      toast.success('Message forwarded')
      setQuery('')
      setTargetId(null)
    } catch (err) {
      console.error('[chat] forward failed:', err)
      toast.error('Forward failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2 }}>
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Forward message
        </Typography>
        <IconButton size='small' onClick={onClose} disabled={submitting} aria-label='Close'>
          <Icon icon='mdi:close' fontSize='1.25rem' />
        </IconButton>
      </Box>
      <Divider />

      {/* Source preview */}
      {forwarding ? (
        <Box
          sx={{
            mx: 3,
            mt: 2,
            p: 2,
            borderRadius: 1,
            borderLeft: theme => `3px solid ${theme.palette.primary.main}`,
            backgroundColor: 'customColors.Surface'
          }}
        >
          {forwarding.senderName ? (
            <Typography variant='caption' sx={{ fontWeight: 600, color: 'primary.main' }}>
              {forwarding.senderName}
            </Typography>
          ) : null}
          {previewText ? (
            <Typography
              variant='body2'
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'text.primary',
                mt: forwarding.senderName ? 0.25 : 0
              }}
            >
              {previewText}
            </Typography>
          ) : null}
          {!previewText && previewAttachmentSummary ? (
            <Typography variant='body2' sx={{ color: 'text.secondary', mt: forwarding.senderName ? 0.25 : 0 }}>
              {previewAttachmentSummary}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {/* Search */}
      <Box sx={{ px: 3, pt: 2 }}>
        <TextField
          fullWidth
          size='small'
          placeholder='Search chats'
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' fontSize='1.25rem' />
                </InputAdornment>
              )
            }
          }}
        />
      </Box>

      {/* Chat list */}
      <DialogContent sx={{ px: 0, pt: 1, pb: 0, maxHeight: 320 }}>
        {filteredChats.length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant='body2'>No chats match</Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {filteredChats.map((c: ChatsArrType) => {
              const selected = c.id === targetId

              return (
                <ListItem key={String(c.id)} disablePadding>
                  <ListItemButton onClick={() => setTargetId(c.id)} selected={selected}>
                    <ListItemAvatar>
                      {c.avatar ? (
                        <CustomAvatar src={c.avatar} alt={c.fullName} sx={{ width: 36, height: 36 }} />
                      ) : (
                        <CustomAvatar
                          skin='light'
                          color={c.avatarColor ?? 'primary'}
                          sx={{ width: 36, height: 36, fontSize: '0.875rem' }}
                        >
                          {getInitials(c.fullName)}
                        </CustomAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={c.fullName}
                      secondary={c.isGroup ? 'Group' : undefined}
                      primaryTypographyProps={{ noWrap: true, variant: 'subtitle2' }}
                    />
                    <Radio
                      edge='end'
                      checked={selected}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-label': `Select ${c.fullName}` }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>

      {/* Footer */}
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, px: 3, py: 2 }}>
        <Button variant='outlined' color='inherit' onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!targetId || submitting}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <Icon icon='mdi:share-outline' />}
        >
          Forward
        </Button>
      </Box>
    </Dialog>
  )
}

export default ForwardMessageDialog
