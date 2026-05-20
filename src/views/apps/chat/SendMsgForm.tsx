'use client'

import { useEffect, useRef, useState, SyntheticEvent, ChangeEvent } from 'react'

import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Box, { BoxProps } from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'

import { SendMsgComponentType } from 'src/types/apps/chatTypes'
import type { ChatAttachmentType } from 'src/types/apps/chatTypes'
import { uploadChatFiles, typingOverSocket } from 'src/lib/chat/api'
import type { UploadableFile } from 'src/lib/chat/api'
import { maybeCompressImage } from 'src/lib/chat/imageCompression'
import { getAttachmentVisual } from 'src/views/apps/chat/attachmentIcon'
import { setReplyingTo, setEditingMessage } from 'src/store/apps/chat'
import { updateMessageOverSocket } from 'src/lib/chat/api'

const ChatFormWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  borderRadius: 8,
  alignItems: 'center',
  boxShadow: theme.shadows[1],
  padding: theme.spacing(1.25, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.paper
}))

const Form = styled('form')(({ theme }) => ({
  padding: theme.spacing(0, 5, 5)
}))

const PreviewStrip = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 0)
}))

const PreviewChip = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  maxWidth: 220
}))

type PendingFile = {
  key: string
  file: File
  previewUrl: string
  kind: 'image' | 'video' | 'audio' | 'document'
}

const inferKind = (mime: string): PendingFile['kind'] => {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'

  return 'document'
}

const kindMediaIcon: Record<'video' | 'audio', string> = {
  video: 'mdi:video-outline',
  audio: 'mdi:music-note'
}

const SendMsgForm = (props: SendMsgComponentType) => {
  const { store, dispatch, sendMsg } = props

  const [msg, setMsg] = useState<string>('')
  const [pending, setPending] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── Audio recording ────────────────────────────────────────────────────────
  // Click 🎤 → recording overlay (timer + stop/cancel). Click ⏹ → blob lands
  // in the pending strip as an audio chip with playback. Click ✕ → cancel.
  // The recorded file flows through the same upload pipeline as picked files.
  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number>(0)
  const tickRef = useRef<number | null>(null)
  const cancelledRef = useRef<boolean>(false)

  // Pick a MIME the browser can actually record. Chrome/FF: webm/opus,
  // Safari: mp4/aac. Fall through to whatever MediaRecorder accepts.
  const pickRecordingMime = (): { mime: string; ext: string } => {
    const candidates: { mime: string; ext: string }[] = [
      { mime: 'audio/webm;codecs=opus', ext: 'webm' },
      { mime: 'audio/webm', ext: 'webm' },
      { mime: 'audio/mp4', ext: 'm4a' },
      { mime: 'audio/ogg;codecs=opus', ext: 'ogg' }
    ]
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime)) return c
    }

    return { mime: '', ext: 'webm' } // empty mime = browser default
  }

  const stopTimer = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const releaseMic = () => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    recorderRef.current = null
    recordedChunksRef.current = []
    stopTimer()
    setElapsedMs(0)
    setRecording(false)
  }

  const startRecording = async () => {
    if (recording) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Audio recording is not supported in this browser')

      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      console.warn('[chat] mic permission denied:', err)
      toast.error('Please enable your microphone to continue')

      return
    }
    const { mime, ext } = pickRecordingMime()
    let rec: MediaRecorder
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch (err) {
      console.error('[chat] MediaRecorder construct failed:', err)
      toast.error('Could not start recording')
      stream.getTracks().forEach(t => t.stop())

      return
    }

    cancelledRef.current = false
    recordedChunksRef.current = []
    mediaStreamRef.current = stream
    recorderRef.current = rec

    rec.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      const wasCancelled = cancelledRef.current
      const chunks = recordedChunksRef.current.slice()
      // Strip codec/params from the MIME — MediaRecorder reports
      // `audio/webm;codecs=opus` but the server's allow-list expects the
      // canonical form `audio/webm`. Server rejects the full string.
      const rawMime = rec.mimeType || mime || 'audio/webm'
      const finalMime = rawMime.split(';')[0].trim() || 'audio/webm'
      releaseMic()
      if (wasCancelled || !chunks.length) return

      const blob = new Blob(chunks, { type: finalMime })
      const filename = `voice-${Date.now()}.${ext}`
      const file = new File([blob], filename, { type: finalMime })
      const previewUrl = URL.createObjectURL(blob)
      setPending(prev => [
        ...prev,
        {
          key: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl,
          kind: 'audio'
        }
      ])
    }

    recordingStartRef.current = Date.now()
    setElapsedMs(0)
    setRecording(true)
    tickRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - recordingStartRef.current)
    }, 200)
    rec.start()
  }

  const stopRecording = () => {
    cancelledRef.current = false
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
  }

  const cancelRecording = () => {
    cancelledRef.current = true
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    } else {
      releaseMic()
    }
  }

  // Format milliseconds → mm:ss for the recording timer.
  const formatElapsed = (ms: number) => {
    const sec = Math.floor(ms / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60

    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    return () => {
      pending.forEach(p => URL.revokeObjectURL(p.previewUrl))
      // Release mic if the form unmounts mid-recording.
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
      stopTimer()
    }
  }, [])

  // When the user picks "Edit" on a bubble, store puts the message into
  // `editingMessage` — prefill the input so the user can amend it inline.
  const editing = store?.editingMessage ?? null
  useEffect(() => {
    if (editing?.originalText) setMsg(editing.originalText)
  }, [editing?.messageId])

  // Typing indicator — emit typing(true) on keystrokes, auto-stop after 2s idle
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const emitTyping = () => {
    const conversationId = store?.selectedChat?.contact?.id
    if (!conversationId || typeof conversationId !== 'string') return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      typingOverSocket(conversationId, true)
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        typingOverSocket(conversationId, false)
      }
    }, 2000)
  }

  const stopTyping = () => {
    const conversationId = store?.selectedChat?.contact?.id
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (isTypingRef.current && conversationId && typeof conversationId === 'string') {
      isTypingRef.current = false
      typingOverSocket(conversationId, false)
    }
  }

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!files.length) return

    setProcessingFiles(true)
    try {
      const processed = await Promise.all(files.map(f => maybeCompressImage(f)))
      const next: PendingFile[] = processed.map(f => ({
        key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        kind: inferKind(f.type)
      }))
      setPending(prev => [...prev, ...next])
    } finally {
      setProcessingFiles(false)
    }
  }

  const removePending = (key: string) => {
    setPending(prev => {
      const drop = prev.find(p => p.key === key)
      if (drop) URL.revokeObjectURL(drop.previewUrl)

      return prev.filter(p => p.key !== key)
    })
  }

  const hasContent = Boolean(msg.trim().length || pending.length)

  const handleSendMsg = async (e: SyntheticEvent) => {
    e.preventDefault()
    if (!store?.selectedChat) return
    const trimmed = msg.trim()
    if (!trimmed.length && !pending.length) return
    if (uploading) return

    // Edit branch — calls `updateMessageOverSocket` and clears edit state.
    // Skips attachment upload (you can't change attachments on edit).
    if (editing) {
      if (!trimmed.length) return
      if (trimmed === editing.originalText) {
        dispatch(setEditingMessage(null))
        setMsg('')

        return
      }
      try {
        await updateMessageOverSocket(editing.messageId, trimmed)
      } catch (err) {
        console.error('[chat] updateMessage failed:', err)
        toast.error('Edit failed')

        return
      }
      dispatch(setEditingMessage(null))
      setMsg('')

      return
    }

    let uploaded: ChatAttachmentType[] | undefined
    const conversationId = store.selectedChat.contact.id

    if (pending.length) {
      if (typeof conversationId !== 'string') {
        toast.error('Cannot send attachments before the conversation is ready')

        return
      }
      setUploading(true)
      try {
        const uploadables: UploadableFile[] = pending.map(p => ({
          uri: p.previewUrl,
          name: p.file.name,
          type: p.file.type,
          size: p.file.size
        }))
        const result = await uploadChatFiles(uploadables, conversationId)
        if (result.failed.length) {
          result.failed.forEach(f => toast.error(`${f.filename}: ${f.error}`))
        }
        if (!result.attachments.length) {
          setUploading(false)

          return
        }
        uploaded = result.attachments.map(a => ({
          id: a.fileId,
          type: a.type,
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size
        }))
      } catch (err) {
        console.error('[chat] attachment upload failed:', err)
        toast.error('Failed to upload attachments')
        setUploading(false)

        return
      }
      setUploading(false)
    }

    dispatch(
      sendMsg({
        ...store.selectedChat,
        message: trimmed,
        ...(uploaded ? { attachments: uploaded } : {})
      })
    )

    pending.forEach(p => URL.revokeObjectURL(p.previewUrl))
    setPending([])
    setMsg('')
    stopTyping()
  }

  const replyingTo = store?.replyingTo ?? null

  return (
    <Form onSubmit={handleSendMsg}>
      {editing ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            px: 3,
            py: 1.5,
            borderRadius: 1,
            borderLeft: theme => `3px solid ${theme.palette.warning.main}`,
            backgroundColor: 'customColors.Surface'
          }}
        >
          <Icon icon='mdi:pencil-outline' fontSize='1.25rem' />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant='caption' sx={{ display: 'block', fontWeight: 600 }}>
              Editing message
            </Typography>
            <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
              {editing.originalText}
            </Typography>
          </Box>
          <IconButton
            size='small'
            aria-label='Cancel edit'
            onClick={() => {
              dispatch(setEditingMessage(null))
              setMsg('')
            }}
          >
            <Icon icon='mdi:close' fontSize='1rem' />
          </IconButton>
        </Box>
      ) : replyingTo ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            px: 3,
            py: 1.5,
            borderRadius: 1,
            borderLeft: theme => `3px solid ${theme.palette.primary.main}`,
            backgroundColor: 'customColors.Surface'
          }}
        >
          <Icon icon='mdi:reply' fontSize='1.25rem' />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant='caption' sx={{ display: 'block', fontWeight: 600 }}>
              Replying to {replyingTo.senderName ?? 'message'}
            </Typography>
            <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
              {replyingTo.textPreview || (replyingTo.hasAttachment ? '📎 Attachment' : '')}
            </Typography>
          </Box>
          <IconButton size='small' aria-label='Cancel reply' onClick={() => dispatch(setReplyingTo(null))}>
            <Icon icon='mdi:close' fontSize='1rem' />
          </IconButton>
        </Box>
      ) : null}
      {pending.length > 0 && (
        <PreviewStrip>
          {pending.map(p => {
            const docVisual = p.kind === 'document' ? getAttachmentVisual(p.file.type, p.file.name) : null

            return (
              <PreviewChip key={p.key}>
                {p.kind === 'image' ? (
                  <Box
                    component='img'
                    src={p.previewUrl}
                    alt={p.file.name}
                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                  />
                ) : p.kind === 'audio' ? (
                  // Inline audio preview — user can listen before sending.
                  // `controlsList="nodownload"` hides the download button in
                  // Chrome's overflow menu; Firefox honours it too.
                  <Box
                    component='audio'
                    src={p.previewUrl}
                    controls
                    controlsList='nodownload noplaybackrate'
                    onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                    sx={{ height: 32, width: 200 }}
                  />
                ) : p.kind === 'document' && docVisual ? (
                  <Icon icon={docVisual.icon} color={docVisual.color} fontSize='1.75rem' />
                ) : (
                  <Icon icon={kindMediaIcon[p.kind as 'video' | 'audio']} fontSize='1.75rem' />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='caption' noWrap sx={{ display: 'block', maxWidth: 120 }}>
                    {p.file.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {(p.file.size / 1024).toFixed(0)} KB
                  </Typography>
                </Box>
                <IconButton size='small' onClick={() => removePending(p.key)} disabled={uploading}>
                  <Icon icon='mdi:close' fontSize='1rem' />
                </IconButton>
              </PreviewChip>
            )
          })}
        </PreviewStrip>
      )}

      <ChatFormWrapper>
        {recording ? (
          // Recording overlay — replaces the text input until the user stops
          // or cancels. The recorded blob then drops into the pending strip
          // and the form returns to its normal state.
          <>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: 'msg-rec-pulse 1s ease-in-out infinite',
                  '@keyframes msg-rec-pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.35 }
                  }
                }}
              />
              <Typography variant='body2' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Recording · {formatElapsed(elapsedMs)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size='small'
                aria-label='Cancel recording'
                onClick={cancelRecording}
                sx={{ color: 'text.secondary' }}
              >
                <Icon icon='mdi:close' fontSize='1.375rem' />
              </IconButton>
              <IconButton size='small' aria-label='Stop recording' onClick={stopRecording} sx={{ color: 'error.main' }}>
                <Icon icon='mdi:stop-circle' fontSize='1.5rem' />
              </IconButton>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                value={msg}
                size='small'
                placeholder='Type your message here…'
                onChange={e => {
                  setMsg(e.target.value)
                  if (e.target.value.trim()) emitTyping()
                }}
                disabled={uploading}
                sx={{ '& .MuiOutlinedInput-input': { pl: 0 }, '& fieldset': { border: '0 !important' } }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size='small'
                component='label'
                htmlFor='chat-attachment-input'
                disabled={uploading || processingFiles}
                sx={{ mr: 1.5, color: 'text.primary' }}
              >
                {processingFiles ? (
                  <CircularProgress size={18} color='inherit' />
                ) : (
                  <Icon icon='mdi:attachment' fontSize='1.375rem' />
                )}
                <input
                  ref={fileInputRef}
                  hidden
                  type='file'
                  multiple
                  id='chat-attachment-input'
                  onChange={handleFiles}
                />
              </IconButton>
              {hasContent ? (
                <Button
                  type='submit'
                  variant='contained'
                  disabled={uploading || processingFiles}
                  startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : undefined}
                  sx={{ ml: 1.25 }}
                >
                  {uploading ? 'Sending…' : 'Send'}
                </Button>
              ) : (
                <IconButton
                  size='small'
                  aria-label='Record voice message'
                  onClick={startRecording}
                  disabled={uploading}
                  sx={{ ml: 1.25, color: 'text.primary' }}
                >
                  <Icon icon='mdi:microphone' fontSize='1.375rem' />
                </IconButton>
              )}
            </Box>
          </>
        )}
      </ChatFormWrapper>
    </Form>
  )
}

export default SendMsgForm
