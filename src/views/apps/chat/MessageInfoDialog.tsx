'use client'

// WhatsApp-Web-style "Message info" right-side panel.
//
// DM chat  → single-row "Read" + "Delivered" with timestamps
// Group chat → per-user "Read by" list + "Delivered to" list with names + times
//
// Data flow (SDK 1.2.3+):
//   1. On open: call getReceipts(messageId) — returns readBy[] + deliveredTo[]
//      with displayName + avatarUrl pre-resolved. No secondary user lookup needed.
//   2. Live: listen to read_receipt and message_delivered socket events and
//      move users between the three buckets in real time.

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import type { Theme } from '@mui/material/styles'

import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from 'src/store'

import Icon from 'src/@core/components/icon'
import { getMessageReceipts, getChatSocket } from 'src/lib/chat/api'
import type { ReadReceiptEvent, MessageDeliveredEvent } from '@antzsoft/chat-core'
import { setInfoMessage } from 'src/store/apps/chat'
import { getInitials } from 'src/@core/utils/get-initials'
import { isForwarded, stripForwardMarker } from 'src/lib/chat/forwardMarker'
import ForwardedTag from 'src/views/apps/chat/ForwardedTag'

import Sidebar from 'src/@core/components/sidebar'

// ─── types ───────────────────────────────────────────────────────────────────

type ReadEntry      = { userId: string; displayName?: string; avatarUrl?: string; readAt: string }
type DeliveredEntry = { userId: string; displayName?: string; avatarUrl?: string; deliveredAt: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatBubbleTime = (iso: string | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

const formatRowTime = (iso: string | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface UserRowProps {
  name: string
  avatar?: string
  timeLabel: string
}

const UserRow = ({ name, avatar, timeLabel }: UserRowProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 1.5 }}>
    {avatar ? (
      <Avatar src={avatar} sx={{ width: 36, height: 36 }} />
    ) : (
      <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: 'customColors.SurfaceVariant', color: 'customColors.OnSurfaceVariant' }}>
        {getInitials(name).slice(0, 2)}
      </Avatar>
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant='subtitle2' noWrap sx={{ fontWeight: 500 }}>
        {name}
      </Typography>
      <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
        {timeLabel}
      </Typography>
    </Box>
  </Box>
)

interface SectionHeaderProps {
  icon: string
  iconColor: string
  label: string
}

const SectionHeader = ({ icon, iconColor, label }: SectionHeaderProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
    <Box sx={{ color: iconColor, display: 'inline-flex' }}>
      <Icon icon={icon} fontSize='1.4rem' />
    </Box>
    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
  </Box>
)

// ─── main component ───────────────────────────────────────────────────────────

const MessageInfoDialog = () => {
  const dispatch = useDispatch<AppDispatch>()

  const infoMessage   = useSelector((s: RootState) => s.chat?.infoMessage ?? null)
  const currentUserId = useSelector((s: RootState) => String(s.chat?.userProfile?.id ?? ''))
  const contacts      = useSelector((s: RootState) => s.chat?.contacts ?? [])
  const selectedChat  = useSelector((s: RootState) => s.chat?.selectedChat)

  const isGroup = selectedChat?.contact?.isGroup === true

  const open    = infoMessage !== null
  const onClose = () => dispatch(setInfoMessage(null))

  const messageId   = infoMessage?.messageId
  const messageText = infoMessage?.messageText

  const [loading, setLoading]               = useState(false)
  const [fetchedReadBy, setFetchedReadBy]   = useState<ReadEntry[]>([])
  const [fetchedDelivered, setFetchedDelivered] = useState<DeliveredEntry[]>([])
  const [bubbleSentAt, setBubbleSentAt]     = useState<string | undefined>(undefined)

  // ── initial load via getReceipts ──────────────────────────────────────────
  useEffect(() => {
    if (!open || !messageId) return
    let cancelled = false
    setLoading(true)
    setFetchedReadBy([])
    setFetchedDelivered([])
    // `getReceipts` doesn't return the message body / sentAt — derive the
    // bubble's sent time from the message already in Redux (no extra call).
    const sentFromStore = selectedChat?.chat?.messages?.find(m => String(m.id) === String(messageId))?.time
    setBubbleSentAt(sentFromStore ? String(sentFromStore) : undefined)

    getMessageReceipts(messageId)
      .then(res => {
        if (cancelled) return
        setFetchedReadBy(res.readBy ?? [])
        setFetchedDelivered(res.deliveredTo ?? [])
      })
      .catch(() => { /* keep empty — panel still renders with "—" */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messageId])

  // Live updates — while the info screen is open, keep the read / delivered
  // buckets in sync with incoming socket events (per chat-core 1.2.3 docs).
  // Without this the screen only reflects the snapshot from when it opened —
  // a recipient reading or receiving the message while the panel is open
  // wouldn't appear until the user closed and reopened it.
  //   • read_receipt    → add the user to readBy (the derived buckets
  //                        below automatically move them out of "delivered"
  //                        since displayedDelivered excludes read user ids)
  //   • message_delivered → add the user to deliveredTo
  // Both update-or-replace by userId so repeated events don't duplicate rows.
  useEffect(() => {
    if (!open || !messageId) return
    const socket = getChatSocket()
    if (!socket) return

    const onRead = (evt: ReadReceiptEvent) => {
      if (!evt) return
      const matches = evt.messageId === messageId || Boolean(evt.updatedMessageIds?.includes(messageId))
      if (!matches || !evt.userId) return
      setFetchedReadBy(prev => {
        const others = prev.filter(r => String(r.userId) !== String(evt.userId))

        return [...others, { userId: String(evt.userId), readAt: evt.readAt }]
      })
    }

    const onDelivered = (evt: MessageDeliveredEvent) => {
      if (!evt || evt.messageId !== messageId) return
      const userId = evt.deliveredTo?.userId
      const deliveredAtRaw = evt.deliveredTo?.deliveredAt
      if (!userId) return
      const deliveredAt =
        typeof deliveredAtRaw === 'string' ? deliveredAtRaw : new Date(deliveredAtRaw).toISOString()
      setFetchedDelivered(prev => {
        const others = prev.filter(d => String(d.userId) !== String(userId))

        return [...others, { userId: String(userId), deliveredAt }]
      })
    }

    socket.on('read_receipt', onRead)
    socket.on('message_delivered', onDelivered)

    return () => {
      socket.off('read_receipt', onRead)
      socket.off('message_delivered', onDelivered)
    }
  }, [open, messageId])

  // Resolve userId → display name + avatar. Receipt entries from
  // `getReceipts` already carry `displayName` / `avatarUrl`; this fallback
  // covers (a) cached entries that only have userId, and (b) the
  // "Not received" bucket derived from the participants array.
  const resolveUser = (userId: string): { name: string; avatar?: string } => {
    const contact = contacts.find(c => String(c.id) === String(userId))
    if (contact) return { name: contact.fullName, avatar: contact.avatar }
    const participant = selectedChat?.contact?.participants?.find(p => String(p.userId) === userId)
    if (participant) return { name: participant.displayName ?? participant.username ?? userId }
    return { name: userId }
  }

  // ── bucket derivation ─────────────────────────────────────────────────────

  // Exclude the current user (sender) and deduplicate.
  const seenReadIds = new Set<string>()
  const displayedRead = fetchedReadBy.filter(r => {
    const id = String(r.userId)
    if (id === currentUserId || seenReadIds.has(id)) return false
    seenReadIds.add(id)
    return true
  })

  const readUserIds = new Set(displayedRead.map(r => String(r.userId)))
  const seenDeliveredIds = new Set<string>()
  const displayedDelivered = fetchedDelivered.filter(d => {
    const id = String(d.userId)
    if (id === currentUserId || readUserIds.has(id) || seenDeliveredIds.has(id)) return false
    seenDeliveredIds.add(id)
    return true
  })

  // "Not received" = active participants not in readBy or deliveredTo.
  const deliveredUserIds = new Set(fetchedDelivered.map(d => String(d.userId)))
  const notReceivedUsers: Array<{ userId: string; name: string; avatar?: string }> = (() => {
    if (!isGroup) return []
    const participants = selectedChat?.contact?.participants ?? []
    return participants
      .filter(p =>
        p.isActive &&
        String(p.userId) !== currentUserId &&
        !readUserIds.has(String(p.userId)) &&
        !deliveredUserIds.has(String(p.userId))
      )
      .map(p => {
        const resolved = resolveUser(p.userId)
        return { userId: p.userId, ...resolved }
      })
  })()

  // DM helpers — latest timestamp from the single recipient.
  const latestReadAt = displayedRead.length
    ? displayedRead.reduce((a, b) => new Date(a.readAt) > new Date(b.readAt) ? a : b).readAt
    : undefined

  const dmDeliveredList = fetchedDelivered.filter(d => String(d.userId) !== currentUserId)
  const latestDeliveredAt = dmDeliveredList.length
    ? dmDeliveredList.reduce((a, b) => new Date(a.deliveredAt) > new Date(b.deliveredAt) ? a : b).deliveredAt
    : undefined

  return (
    <Sidebar
      direction='right'
      show={open}
      backDropClick={onClose}
      sx={{
        zIndex: 11,
        height: '100%',
        width: { xs: '100%', sm: 380 },
        borderTopRightRadius: (theme: Theme) => theme.shape.borderRadius,
        borderBottomRightRadius: (theme: Theme) => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': { zIndex: 10, borderRadius: 1 }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 2.5,
            borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`
          }}
        >
          <IconButton size='small' onClick={onClose} sx={{ mr: 1.5 }} aria-label='Close message info'>
            <Icon icon='mdi:close' fontSize='1.25rem' />
          </IconButton>
          {/* Title color matches the chat header name so the panel reads
              as part of the same chat surface. */}
          <Typography variant='subtitle1' sx={{ flex: 1, fontWeight: 600, color: 'customColors.chatBubbleSent' }}>
            Message info
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* Message bubble replica — mirrors the real sent bubble in
              MessageBubble.tsx (dark teal + white text + zeroed top-right
              corner) on the chat's light-green Surface, so the preview
              reads identically to the actual chat. */}
          {messageText ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, py: 3, bgcolor: 'customColors.Surface' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '85%',
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  borderTopRightRadius: 0,
                  bgcolor: 'customColors.chatBubbleSent',
                  color: 'common.white',
                  boxShadow: 1
                }}
              >
                {isForwarded(messageText) && <ForwardedTag isSender />}
                <Typography sx={{ fontSize: '0.875rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: 'inherit' }}>
                  {stripForwardMarker(messageText)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5, color: 'rgba(255,255,255,0.85)' }}>
                  {bubbleSentAt && (
                    <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'inherit' }}>
                      {formatBubbleTime(bubbleSentAt)}
                    </Typography>
                  )}
                  <Icon icon='mdi:check-all' fontSize='0.875rem' />
                </Box>
              </Box>
            </Box>
          ) : null}

          <Box sx={{ px: 3, py: 3 }}>
          {loading && displayedRead.length === 0 && displayedDelivered.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : isGroup ? (
            <>
              {/* Read by */}
              <SectionHeader icon='mdi:check-all' iconColor='success.main' label={`Read by (${displayedRead.length})`} />
              {displayedRead.length === 0 ? (
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5, mb: 3 }}>
                  No one has read this yet
                </Typography>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {displayedRead.map(r => {
                    // Prefer the profile resolved by getReceipts; fall back
                    // to the contacts/participants lookup for cached entries.
                    const fallback = resolveUser(r.userId)
                    const name = r.displayName || fallback.name
                    const avatar = r.avatarUrl || fallback.avatar

                    return <UserRow key={r.userId} name={name} avatar={avatar} timeLabel={formatRowTime(r.readAt)} />
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Delivered to */}
              <SectionHeader icon='mdi:check-all' iconColor='customColors.Outline' label={`Delivered to (${displayedDelivered.length})`} />
              {displayedDelivered.length === 0 ? (
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5, mb: 3 }}>—</Typography>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {displayedDelivered.map(d => {
                    const fallback = resolveUser(d.userId)
                    const name = d.displayName || fallback.name
                    const avatar = d.avatarUrl || fallback.avatar

                    return <UserRow key={d.userId} name={name} avatar={avatar} timeLabel={formatRowTime(d.deliveredAt)} />
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Not received */}
              <SectionHeader icon='mdi:check' iconColor='customColors.neutralSecondary' label={`Not received (${notReceivedUsers.length})`} />
              {notReceivedUsers.length === 0 ? (
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5 }}>—</Typography>
              ) : (
                <Box>
                  {notReceivedUsers.map(u => (
                    <UserRow key={u.userId} name={u.name} avatar={u.avatar} timeLabel='Pending' />
                  ))}
                </Box>
              )}
            </>
          ) : (
            /* DM: single-timestamp rows */
            <>
              <SectionHeader icon='mdi:check-all' iconColor='success.main' label='Read' />
              <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', mb: 3, pl: 5 }}>
                {formatRowTime(latestReadAt)}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <SectionHeader icon='mdi:check-all' iconColor='customColors.Outline' label='Delivered' />
              <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5 }}>
                {formatRowTime(latestDeliveredAt)}
              </Typography>
            </>
          )}
          </Box>
        </Box>
      </Box>
    </Sidebar>
  )
}

export default MessageInfoDialog
