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
import { uploadChatFiles } from 'src/lib/chat/api'
import type { UploadableFile } from 'src/lib/chat/api'
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      pending.forEach(p => URL.revokeObjectURL(p.previewUrl))
    }

  }, [])

  // When the user picks "Edit" on a bubble, store puts the message into
  // `editingMessage` — prefill the input so the user can amend it inline.
  const editing = store?.editingMessage ?? null
  useEffect(() => {
    if (editing?.originalText) setMsg(editing.originalText)
  }, [editing?.messageId])

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const next: PendingFile[] = files.map(f => ({
      key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      kind: inferKind(f.type)
    }))
    setPending(prev => [...prev, ...next])

    if (fileInputRef.current) fileInputRef.current.value = ''
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
              {replyingTo.textPreview ||
                (replyingTo.hasAttachment ? '📎 Attachment' : '')}
            </Typography>
          </Box>
          <IconButton
            size='small'
            aria-label='Cancel reply'
            onClick={() => dispatch(setReplyingTo(null))}
          >
            <Icon icon='mdi:close' fontSize='1rem' />
          </IconButton>
        </Box>
      ) : null}
      {pending.length > 0 && (
        <PreviewStrip>
          {pending.map(p => {
            const docVisual =
              p.kind === 'document' ? getAttachmentVisual(p.file.type, p.file.name) : null

            return (
              <PreviewChip key={p.key}>
                {p.kind === 'image' ? (
                  <Box
                    component='img'
                    src={p.previewUrl}
                    alt={p.file.name}
                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
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
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={msg}
            size='small'
            placeholder='Type your message here…'
            onChange={e => setMsg(e.target.value)}
            disabled={uploading}
            sx={{ '& .MuiOutlinedInput-input': { pl: 0 }, '& fieldset': { border: '0 !important' } }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            component='label'
            htmlFor='chat-attachment-input'
            disabled={uploading}
            sx={{ mr: 1.5, color: 'text.primary' }}
          >
            <Icon icon='mdi:attachment' fontSize='1.375rem' />
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
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : undefined}
              sx={{ ml: 1.25 }}
            >
              {uploading ? 'Sending…' : 'Send'}
            </Button>
          ) : (
            <IconButton size='small' sx={{ ml: 1.25, color: 'text.primary' }}>
              <Icon icon='mdi:microphone' fontSize='1.375rem' />
            </IconButton>
          )}
        </Box>
      </ChatFormWrapper>
    </Form>
  )
}

export default SendMsgForm
