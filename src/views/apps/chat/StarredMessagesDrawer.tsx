'use client'

import { useEffect, useState, useCallback } from 'react'

import Box from '@mui/material/Box'
import MuiAvatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { listStarredMessages } from 'src/lib/chat/api'
import { getInitials } from 'src/@core/utils/get-initials'
import type { ChatEntityId } from 'src/types/apps/chatTypes'
import type { Message } from 'src/lib/chat/api'

interface StarredMessagesDrawerProps {
  open: boolean
  onClose: () => void
  conversationId: ChatEntityId | null | undefined
  conversationName: string
  currentUserId: string | number
  /**
   * Optional callback fired when the user clicks a starred message
   * row. Parent should scroll the main chat to that messageId (and
   * typically close the right drawer so the user sees the chat). When
   * omitted, rows render as before but click is a no-op.
   */
  onMessageClick?: (messageId: string) => void
}

const PAGE_LIMIT = 30

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
}

type AttachmentInfo =
  | { kind: 'text'; text: string }
  | { kind: 'image'; url: string; thumbnailUrl?: string; caption?: string }
  | { kind: 'video'; url: string; thumbnailUrl?: string }
  | { kind: 'audio' }
  | { kind: 'document'; filename: string; url: string }

function getAttachmentInfo(msg: Message): AttachmentInfo {
  if (msg.content?.text) return { kind: 'text', text: msg.content.text }
  const att = (msg.content?.attachments as any)?.[0]
  if (!att) return { kind: 'text', text: '' }
  if (att.type === 'image')
    return { kind: 'image', url: att.url ?? '', thumbnailUrl: att.thumbnailUrl, caption: att.filename }
  if (att.type === 'video') return { kind: 'video', url: att.url ?? '', thumbnailUrl: att.thumbnailUrl }
  if (att.type === 'audio') return { kind: 'audio' }
  return { kind: 'document', filename: att.filename ?? att.originalFilename ?? 'File', url: att.url ?? '' }
}

export default function StarredMessagesDrawer({
  open,
  onClose,
  conversationId,
  conversationName,
  currentUserId,
  onMessageClick
}: StarredMessagesDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchStarred = useCallback(
    async (p: number, reset = false) => {
      if (!conversationId) return
      setLoading(true)
      try {
        const res = (await listStarredMessages({
          page: p,
          limit: PAGE_LIMIT,
          conversationId: String(conversationId)
        })) as any
        // Handle flat shape { messages/data/items, total, page, limit } or nested { data, meta }
        const items: Message[] = res.messages ?? res.data ?? res.items ?? []
        const total: number = res.total ?? res.meta?.total ?? 0
        const lim: number = res.limit ?? res.meta?.limit ?? PAGE_LIMIT
        const totalPages: number = res.totalPages ?? res.meta?.totalPages ?? (Math.ceil(total / lim) || 1)
        setMessages(prev => (reset ? items : [...prev, ...items]))
        setHasMore(p < totalPages)
        setPage(p)
      } catch (err) {
        console.error('[StarredDrawer] fetch error:', err)
      } finally {
        setLoading(false)
      }
    },
    [conversationId]
  )

  useEffect(() => {
    if (!open || !conversationId) return
    setMessages([])
    fetchStarred(1, true)
  }, [open, conversationId])

  if (!open) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
          py: 3.5,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          gap: 1.5,
          flexShrink: 0
        }}
      >
        <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Icon icon='mdi:arrow-left' fontSize='1.25rem' />
        </IconButton>
        <Typography sx={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>Starred messages</Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ pt: 8, textAlign: 'center', px: 4 }}>
            <Icon icon='mdi:star-outline' fontSize='2.5rem' color='customColors.OutlineVariant' />
            <Typography variant='body2' sx={{ mt: 1, color: 'customColors.neutralSecondary' }}>
              No starred messages
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMe = String(msg.senderId) === String(currentUserId)
              const senderName = isMe ? 'You' : msg.sender?.displayName ?? 'Unknown'
              const recipientLabel = isMe ? conversationName : 'You'
              const attInfo = getAttachmentInfo(msg)
              const time = formatTime(msg.sentAt)

              return (
                <Box key={msg.id}>
                  {/* Row — click jumps to that message in the main chat
                      (flash + scroll). Parent decides whether to close
                      the drawer; we just emit the click. */}
                  <Box
                    onClick={() => onMessageClick?.(msg.id)}
                    sx={{
                      px: 3,
                      py: 2.5,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'customColors.Surface' },
                      transition: 'background-color 150ms'
                    }}
                  >
                    {/* Top: avatar + context row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      {/* Avatar */}
                      {msg.sender?.avatarUrl ? (
                        <MuiAvatar
                          src={msg.sender.avatarUrl}
                          alt={senderName}
                          sx={{ width: 36, height: 36, flexShrink: 0 }}
                        />
                      ) : (
                        <CustomAvatar skin='light' sx={{ width: 36, height: 36, fontSize: '0.75rem', flexShrink: 0 }}>
                          {getInitials(senderName)}
                        </CustomAvatar>
                      )}

                      {/* Sender › Recipient */}
                      <Typography
                        variant='body2'
                        sx={{ flex: 1, fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}
                      >
                        {senderName}
                        <Box component='span' sx={{ mx: 0.5, color: 'customColors.neutralSecondary', fontWeight: 400 }}>
                          ›
                        </Box>
                        {recipientLabel}
                      </Typography>

                      {/* Time + chevron */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
                          {time}
                        </Typography>
                        <Icon icon='mdi:chevron-right' fontSize='1rem' color='customColors.Outline' />
                      </Box>
                    </Box>

                    {/* Message bubble */}
                    <Box sx={{ pl: '52px' }}>
                      {attInfo.kind === 'image' ? (
                        /* Image bubble */
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'inline-block',
                            borderRadius: 2,
                            overflow: 'hidden',
                            maxWidth: 200,
                            backgroundColor: 'customColors.SurfaceVariant'
                          }}
                        >
                          <Box
                            component='img'
                            src={attInfo.thumbnailUrl || attInfo.url}
                            alt='photo'
                            sx={{ width: 200, height: 140, objectFit: 'cover', display: 'block' }}
                          />
                          {/* Star + time overlay */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              right: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.4,
                              backgroundColor: 'rgba(0,0,0,0.45)',
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.25
                            }}
                          >
                            <Icon icon='mdi:star' fontSize='0.65rem' color='white' />
                            <Typography
                              variant='caption'
                              sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}
                            >
                              {time}
                            </Typography>
                          </Box>
                        </Box>
                      ) : attInfo.kind === 'video' ? (
                        /* Video bubble */
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'inline-block',
                            borderRadius: 2,
                            overflow: 'hidden',
                            maxWidth: 200,
                            backgroundColor: 'customColors.SurfaceVariant'
                          }}
                        >
                          {attInfo.thumbnailUrl ? (
                            <Box
                              component='img'
                              src={attInfo.thumbnailUrl}
                              alt='video'
                              sx={{ width: 200, height: 140, objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 200,
                                height: 140,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon icon='mdi:play-circle-outline' fontSize='2.5rem' color='customColors.Outline' />
                            </Box>
                          )}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              right: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.4,
                              backgroundColor: 'rgba(0,0,0,0.45)',
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.25
                            }}
                          >
                            <Icon icon='mdi:star' fontSize='0.65rem' color='white' />
                            <Typography
                              variant='caption'
                              sx={{ color: 'white', fontSize: '0.65rem', whiteSpace: 'nowrap' }}
                            >
                              {time}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        /* Text / document / audio bubble */
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'flex-end',
                            gap: 1.5,
                            backgroundColor: 'customColors.SurfaceVariant',
                            borderRadius: 2,
                            px: 2,
                            py: 1.25,
                            maxWidth: '100%'
                          }}
                        >
                          {attInfo.kind === 'document' && (
                            <Icon icon='mdi:paperclip' fontSize='0.9rem' color='customColors.Outline' />
                          )}
                          {attInfo.kind === 'audio' && (
                            <Icon icon='mdi:microphone' fontSize='0.9rem' color='customColors.Outline' />
                          )}
                          <Typography
                            variant='body2'
                            sx={{ color: 'customColors.OnSurfaceVariant', wordBreak: 'break-word', flex: 1 }}
                          >
                            {attInfo.kind === 'text'
                              ? attInfo.text
                              : attInfo.kind === 'document'
                              ? attInfo.filename
                              : 'Voice message'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <Icon icon='mdi:star' fontSize='0.75rem' color='customColors.Outline' />
                            <Typography
                              variant='caption'
                              sx={{ color: 'customColors.neutralSecondary', whiteSpace: 'nowrap' }}
                            >
                              {time}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {idx < messages.length - 1 && <Divider sx={{ mx: '5%' }} />}
                </Box>
              )
            })}

            {hasMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography
                  variant='caption'
                  onClick={() => fetchStarred(page + 1)}
                  sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 500 }}
                >
                  Load more
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
