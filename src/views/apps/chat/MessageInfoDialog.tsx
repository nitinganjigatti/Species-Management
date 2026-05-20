'use client'

// WhatsApp-Web-style "Message info" right-side panel — mirrors the layout
// from the user's reference design:
//   • X close + "Message info" title (header)
//   • Replica of the actual message bubble (green, ticks + time inline)
//   • Read row    (blue ✓✓)  — latest read timestamp or "—"
//   • Delivered row (grey ✓✓) — latest delivered timestamp or "—"
//
// Driven entirely from Redux `state.chat.infoMessage` so the component is
// mounted once at the ChatContent root (alongside UserProfileRight) — the
// Sidebar primitive uses `position: absolute`, so it must live in a
// positioned ancestor that's the chat shell, not the message bubble.

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from 'src/store'

import Icon from 'src/@core/components/icon'
import { getMessage } from 'src/lib/chat/api'
import { setInfoMessage } from 'src/store/apps/chat'

// Reuse the same Sidebar primitive UserProfileRight uses — keeps the
// chat-app shell consistent (backdrop, transition timing, z-index).
import Sidebar from 'src/@core/components/sidebar'

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
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  if (sameDay) return `Today at ${time}`
  const oneDayAgo = new Date(now)
  oneDayAgo.setDate(now.getDate() - 1)
  if (d.toDateString() === oneDayAgo.toDateString()) return `Yesterday at ${time}`

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

const latestTime = (entries: Array<{ readAt?: string; deliveredAt?: string }>): string | undefined => {
  let best: string | undefined
  entries.forEach(e => {
    const iso = e.readAt ?? e.deliveredAt
    if (!iso) return
    if (!best || new Date(iso).getTime() > new Date(best).getTime()) best = iso
  })

  return best
}

const MessageInfoDialog = () => {
  const dispatch = useDispatch<AppDispatch>()

  const infoMessage = useSelector((s: RootState) => s.chat?.infoMessage ?? null)
  const open = infoMessage !== null
  const onClose = () => dispatch(setInfoMessage(null))

  const messageId = infoMessage?.messageId
  const messageText = infoMessage?.messageText
  const cachedReadBy = infoMessage?.readBy
  const cachedDeliveredTo = infoMessage?.deliveredTo

  const currentUserId = useSelector((s: RootState) => String(s.chat?.userProfile?.id ?? ''))

  const [loading, setLoading] = useState(false)
  const [fetchedReadBy, setFetchedReadBy] = useState<Array<{ userId: string; readAt: string }>>([])
  const [fetchedDeliveredTo, setFetchedDeliveredTo] = useState<
    Array<{ userId: string; deliveredAt: string }>
  >([])
  // The bubble's own send-time — pulled from the live message fetch so the
  // displayed bubble shows the same timestamp the user sees in the chat.
  const [bubbleSentAt, setBubbleSentAt] = useState<string | undefined>(undefined)

  // Fetch fresh data when the drawer opens. Falls back to cached values
  // from the bubble if the fetch fails.
  useEffect(() => {
    if (!open || !messageId) return
    let cancelled = false
    setLoading(true)
    setFetchedReadBy(cachedReadBy ?? [])
    setFetchedDeliveredTo(cachedDeliveredTo ?? [])
    setBubbleSentAt(undefined)

    getMessage(messageId)
      .then(m => {
        if (cancelled) return
        const r = (m as { readBy?: Array<{ userId: string; readAt: string }> }).readBy ?? []
        const d =
          (m as { deliveredTo?: Array<{ userId: string; deliveredAt: string }> }).deliveredTo ?? []
        const sentAt =
          (m as { sentAt?: string; createdAt?: string }).sentAt ??
          (m as { sentAt?: string; createdAt?: string }).createdAt
        setFetchedReadBy(r)
        setFetchedDeliveredTo(d)
        if (sentAt) setBubbleSentAt(sentAt)
      })
      .catch(() => {
        // Silent — keep the cached values.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messageId])

  // Exclude the sender from both lists (no "you read your own message").
  // We DO NOT filter delivered by read here — a recipient who later read
  // the message still has a delivered-at timestamp we want to display.
  // The two rows answer different questions: "when did it arrive?" vs
  // "when did they open it?", so each shows its own latest timestamp
  // independently.
  const displayedRead = fetchedReadBy.filter(r => String(r.userId) !== currentUserId)
  const displayedDelivered = fetchedDeliveredTo.filter(d => String(d.userId) !== currentUserId)

  const latestReadAt = latestTime(displayedRead)
  const latestDeliveredAt = latestTime(displayedDelivered)

  return (
    <Sidebar
      direction='right'
      show={open}
      backDropClick={onClose}
      sx={{
        zIndex: 9,
        height: '100%',
        width: { xs: '100%', sm: 380 },
        borderTopRightRadius: theme => theme.shape.borderRadius,
        borderBottomRightRadius: theme => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header — X close + title */}
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

        {/* Bubble replica — green sender bubble with the message + time + ticks
            all on a single horizontal line (mirrors the WhatsApp Web pattern
            in the user's reference). Uses `inline-flex` + `align-items: baseline`
            so text and meta sit on the same baseline; wraps to a second line
            only if text is too long. */}
        {messageText ? (
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              px: 3,
              py: 3,
              bgcolor: 'customColors.Surface'
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                columnGap: 1.25,
                rowGap: 0.25,
                maxWidth: '85%',
                width: 'fit-content',
                px: 2,
                py: 1.25,
                borderRadius: 1.5,
                borderTopRightRadius: 0,
                bgcolor: 'primary.main',
                color: 'common.white',
                boxShadow: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: 'inherit'
                }}
              >
                {messageText}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  ml: 'auto',
                  color: 'rgba(255,255,255,0.85)'
                }}
              >
                {bubbleSentAt ? (
                  <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'inherit' }}>
                    {formatBubbleTime(bubbleSentAt)}
                  </Typography>
                ) : null}
                <Icon icon='mdi:check-all' fontSize='0.875rem' />
              </Box>
            </Box>
          </Box>
        ) : null}

        {/* Body — Read + Delivered rows */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
          {loading && displayedRead.length === 0 && displayedDelivered.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {/* Read — uses our chat-green theme color to match the
                  primary palette (was blue/info before; "as per the design"
                  means following the chat module's green design language). */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <Box sx={{ color: 'success.main', display: 'inline-flex' }}>
                  <Icon icon='mdi:check-all' fontSize='1.5rem' />
                </Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Read
                </Typography>
              </Box>
              <Typography
                variant='body2'
                sx={{ color: 'customColors.neutralSecondary', mb: 3, pl: 5 }}
              >
                {formatRowTime(latestReadAt)}
              </Typography>

              {/* Delivered */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <Box sx={{ color: 'customColors.Outline', display: 'inline-flex' }}>
                  <Icon icon='mdi:check-all' fontSize='1.5rem' />
                </Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Delivered
                </Typography>
              </Box>
              <Typography
                variant='body2'
                sx={{ color: 'customColors.neutralSecondary', pl: 5 }}
              >
                {formatRowTime(latestDeliveredAt)}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Sidebar>
  )
}

export default MessageInfoDialog
