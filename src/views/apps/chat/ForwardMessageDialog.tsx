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

const MAX_FORWARD_TARGETS = 5

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
  const [selectedIds, setSelectedIds] = useState<Set<ChatEntityId>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const onClose = () => {
    if (submitting) return
    setQuery('')
    setSelectedIds(new Set())
    dispatch(setForwardingMessage(null))
  }

  const previewText = useMemo(() => stripForwardMarker(forwarding?.messageText).trim(), [forwarding?.messageText])
  const previewAttachmentSummary = useMemo(() => attachmentSummary(forwarding?.attachments), [forwarding?.attachments])

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats

    return chats.filter(c => c.fullName?.toLowerCase().includes(q))
  }, [chats, query])

  const toggleChat = (id: ChatEntityId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_FORWARD_TARGETS) {
        next.add(id)
      }

      return next
    })
  }

  const handleSubmit = async () => {
    if (!forwarding || selectedIds.size === 0) return
    setSubmitting(true)
    try {
      await dispatch(
        forwardMessage({
          sourceMessageId: forwarding.messageId,
          sourceText: forwarding.messageText,
          sourceAttachments: forwarding.attachments,
          targetChatIds: Array.from(selectedIds),
          isOwnMessage: forwarding.isOwnMessage
        })
      ).unwrap()
      setQuery('')
      setSelectedIds(new Set())
    } catch (err) {
      console.error('[chat] forward failed:', err)
      toast.error('Forward failed')
    } finally {
      setSubmitting(false)
    }
  }

  const forwardLabel = selectedIds.size > 1 ? `Forward (${selectedIds.size})` : 'Forward'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.75,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <IconButton size='small' onClick={onClose} disabled={submitting} aria-label='Close' edge='start'>
          <Icon icon='mdi:arrow-left' fontSize='1.3rem' />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3, color: 'text.primary' }}>
            Forward to
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.disabled', lineHeight: 1 }}>
            Select up to {MAX_FORWARD_TARGETS}
          </Typography>
        </Box>

        {submitting && <CircularProgress size={22} color='primary' />}
      </Box>

      {/* ── Forwarding preview ──────────────────────────────── */}
      {forwarding && (
        <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '10px',
              borderLeft: theme => `4px solid ${theme.palette.primary.main}`,
              backgroundColor: theme => `${theme.palette.primary.main}0D`
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 0.5 }}>
              Forwarding
            </Typography>
            {previewText ? (
              <Typography
                variant='body2'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'text.secondary',
                  lineHeight: 1.5
                }}
              >
                {previewText}
              </Typography>
            ) : null}
            {!previewText && previewAttachmentSummary ? (
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                {previewAttachmentSummary}
              </Typography>
            ) : null}
          </Box>
        </Box>
      )}

      {/* ── Search ─────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <TextField
          fullWidth
          size='small'
          placeholder='Search people or groups…'
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' fontSize='1.2rem' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                </InputAdornment>
              )
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              backgroundColor: 'action.hover',
              '& fieldset': { border: 'none' },
              '&.Mui-focused': {
                backgroundColor: 'background.paper',
                boxShadow: theme => `0 0 0 2px ${theme.palette.primary.main}40`
              }
            }
          }}
        />

        {/* Selection counter */}
        <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', mt: 1.5, px: 0.5 }}>
          {selectedIds.size > 0 && (
            <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {selectedIds.size} of {MAX_FORWARD_TARGETS} selected
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Chat list ──────────────────────────────────────── */}
      <DialogContent sx={{ px: 1.5, pt: 0, pb: 1, maxHeight: 400, overflowY: 'auto' }}>
        {filteredChats.length > 0 && (
          <Typography
            variant='overline'
            sx={{
              display: 'block',
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              color: 'text.disabled',
              px: 1.5,
              mb: 0.5
            }}
          >
            Conversations
          </Typography>
        )}

        {filteredChats.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Icon icon='mdi:chat-outline' fontSize='2.5rem' style={{ color: 'var(--mui-palette-text-disabled)' }} />
            <Typography variant='body2' sx={{ color: 'text.disabled', mt: 1 }}>
              No chats found
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredChats.map((c: ChatsArrType) => {
              const selected = selectedIds.has(c.id)
              const limitReached = !selected && selectedIds.size >= MAX_FORWARD_TARGETS

              return (
                <ListItem key={String(c.id)} disablePadding>
                  <ListItemButton
                    onClick={() => toggleChat(c.id)}
                    disabled={limitReached}
                    sx={{
                      borderRadius: '10px',
                      py: 0.75,
                      px: 1.25,
                      mb: 0.25,
                      backgroundColor: selected
                        ? theme => `${theme.palette.primary.main}12`
                        : 'transparent',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        backgroundColor: selected
                          ? theme => `${theme.palette.primary.main}1C`
                          : 'action.hover'
                      },
                      '&.Mui-disabled': { opacity: 0.4 }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44, mr: 0.5 }}>
                      {c.avatar ? (
                        <CustomAvatar src={c.avatar} alt={c.fullName} sx={{ width: 38, height: 38 }} />
                      ) : (
                        <CustomAvatar
                          skin='light'
                          color={c.avatarColor ?? 'primary'}
                          sx={{ width: 38, height: 38, fontSize: '0.9rem', fontWeight: 600 }}
                        >
                          {getInitials(c.fullName)}
                        </CustomAvatar>
                      )}
                    </ListItemAvatar>

                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant='body2'
                          noWrap
                          sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
                        >
                          {c.fullName}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant='caption'
                          sx={{ color: 'text.disabled', fontWeight: 400, lineHeight: 1.2, display: 'block' }}
                        >
                          {c.isGroup ? 'Group' : 'Direct message'}
                        </Typography>
                      }
                    />

                    <Box sx={{ ml: 1.5, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {selected ? (
                        <Icon
                          icon='mdi:check-circle'
                          fontSize='1.25rem'
                          style={{ color: 'var(--mui-palette-primary-main)' }}
                        />
                      ) : (
                        <Icon
                          icon='mdi:circle-outline'
                          fontSize='1.25rem'
                          style={{ color: 'var(--mui-palette-action-disabled)' }}
                        />
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <>
          <Divider />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1.5,
              px: 3,
              py: 2.25,
              backgroundColor: 'background.paper'
            }}
          >
            <Button
              variant='outlined'
              color='inherit'
              onClick={onClose}
              disabled={submitting}
              sx={{
                flex: 1,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1.1,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { borderColor: 'text.secondary', backgroundColor: 'action.hover' }
              }}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={
                submitting
                  ? <CircularProgress size={16} color='inherit' />
                  : <Icon icon='mdi:share-outline' fontSize='1.1rem' />
              }
              sx={{
                flex: 2,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                py: 1.1,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              {submitting ? 'Forwarding…' : forwardLabel}
            </Button>
          </Box>
        </>
      )}
    </Dialog>
  )
}

export default ForwardMessageDialog
