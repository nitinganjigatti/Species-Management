'use client'

// WhatsApp-Web-style "Message info" right-side panel.
//
// DM chat  → single-row "Read" + "Delivered" with timestamps
// Group chat → per-user "Read by" list + "Delivered to" list with names + times

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
import { getMessage } from 'src/lib/chat/api'
import { setInfoMessage } from 'src/store/apps/chat'
import { getInitials } from 'src/@core/utils/get-initials'

import Sidebar from 'src/@core/components/sidebar'

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── sub-components ─────────────────────────────────────────────────────────

interface UserRowProps {
  name: string
  avatar?: string
  avatarColor?: string
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

// ─── main component ──────────────────────────────────────────────────────────

const MessageInfoDialog = () => {
  const dispatch = useDispatch<AppDispatch>()

  const infoMessage   = useSelector((s: RootState) => s.chat?.infoMessage ?? null)
  const currentUserId = useSelector((s: RootState) => String(s.chat?.userProfile?.id ?? ''))
  const contacts      = useSelector((s: RootState) => s.chat?.contacts ?? [])
  const selectedChat  = useSelector((s: RootState) => s.chat?.selectedChat)

  const isGroup = selectedChat?.contact?.isGroup === true

  const open    = infoMessage !== null
  const onClose = () => dispatch(setInfoMessage(null))

  const messageId        = infoMessage?.messageId
  const messageText      = infoMessage?.messageText
  const cachedReadBy     = infoMessage?.readBy
  const cachedDeliveredTo = infoMessage?.deliveredTo

  const [loading, setLoading]               = useState(false)
  const [fetchedReadBy, setFetchedReadBy]   = useState<Array<{ userId: string; readAt: string }>>([])
  const [fetchedDelivered, setFetchedDelivered] = useState<Array<{ userId: string; deliveredAt: string }>>([])
  const [bubbleSentAt, setBubbleSentAt]     = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open || !messageId) return
    let cancelled = false
    setLoading(true)
    setFetchedReadBy(cachedReadBy ?? [])
    setFetchedDelivered(cachedDeliveredTo ?? [])
    setBubbleSentAt(undefined)

    getMessage(messageId)
      .then(m => {
        if (cancelled) return
        const r = (m as any).readBy ?? []
        const d = (m as any).deliveredTo ?? []
        const sentAt = (m as any).sentAt ?? (m as any).createdAt
        setFetchedReadBy(r)
        setFetchedDelivered(d)
        if (sentAt) setBubbleSentAt(sentAt)
      })
      .catch(() => { /* keep cached values */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messageId])

  // Resolve userId → display name + avatar from contacts list,
  // falling back to the group's participants array.
  const resolveUser = (userId: string): { name: string; avatar?: string } => {
    const contact = contacts.find(c => String(c.id) === String(userId))
    if (contact) return { name: contact.fullName, avatar: contact.avatar }
    const participant = selectedChat?.contact?.participants?.find(p => String(p.userId) === String(userId))
    if (participant) return { name: participant.displayName ?? participant.username ?? userId }

    return { name: userId }
  }

  // Exclude the current user (sender) from both lists.
  const displayedRead = fetchedReadBy.filter(r => String(r.userId) !== currentUserId)

  // "Delivered to" = delivered but NOT yet read.
  const readUserIds = new Set(displayedRead.map(r => String(r.userId)))
  const displayedDelivered = fetchedDelivered.filter(
    d => String(d.userId) !== currentUserId && !readUserIds.has(String(d.userId))
  )

  // "Not received" = active group participants who are neither in readBy nor
  // deliveredTo. These members haven't received the message yet (offline /
  // push-only / etc.).
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
  // For "Delivered" in DM we use the raw fetchedDelivered list (minus self) so
  // a recipient who has already read the message still shows a delivery time.
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
        zIndex: 11,           // above ChatLog FAB (zIndex 10) and UserProfileRight (9)
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
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>Message info</Typography>
        </Box>

        {/* Body — scrollable; bubble preview lives here so long messages don't
            clip or bleed outside — the whole panel scrolls as one unit. */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* Message bubble replica */}
          {messageText ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                px: 3,
                py: 3,
                bgcolor: 'customColors.Surface'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '85%',
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  borderTopRightRadius: 0,
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  boxShadow: 1
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: 'inherit' }}>
                  {messageText}
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
            /* ── GROUP: per-user lists ── */
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
                    const { name, avatar } = resolveUser(r.userId)

                    return <UserRow key={r.userId} name={name} avatar={avatar} timeLabel={formatRowTime(r.readAt)} />
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Delivered to — received but not yet read */}
              <SectionHeader icon='mdi:check-all' iconColor='customColors.Outline' label={`Delivered to (${displayedDelivered.length})`} />
              {displayedDelivered.length === 0 ? (
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5, mb: 3 }}>
                  —
                </Typography>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {displayedDelivered.map(d => {
                    const { name, avatar } = resolveUser(d.userId)

                    return <UserRow key={d.userId} name={name} avatar={avatar} timeLabel={formatRowTime(d.deliveredAt)} />
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Not received — members the message hasn't reached yet */}
              <SectionHeader icon='mdi:check' iconColor='customColors.neutralSecondary' label={`Not received (${notReceivedUsers.length})`} />
              {notReceivedUsers.length === 0 ? (
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', pl: 5 }}>
                  —
                </Typography>
              ) : (
                <Box>
                  {notReceivedUsers.map(u => (
                    <UserRow key={u.userId} name={u.name} avatar={u.avatar} timeLabel='Pending' />
                  ))}
                </Box>
              )}
            </>
          ) : (
            /* ── DM: single-timestamp rows ── */
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
