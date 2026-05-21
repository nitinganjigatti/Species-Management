'use client'

import { useEffect, useState, useCallback } from 'react'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import MuiAvatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import Icon from 'src/@core/components/icon'
import { getConversationFiles } from 'src/lib/chat/api'
import type { ChatEntityId } from 'src/types/apps/chatTypes'
import AttachmentPreviewDialog from 'src/views/apps/chat/AttachmentPreviewDialog'
import type { ChatAttachmentType } from 'src/types/apps/chatTypes'

type FileItem = {
  id: string
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  type: 'image' | 'video' | 'audio' | 'document'
  uploadedAt?: string
}

interface MediaLinksDocsDrawerProps {
  open: boolean
  onClose: () => void
  conversationId: ChatEntityId | null | undefined
}

const PAGE_LIMIT = 30

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToAttachment(f: FileItem): ChatAttachmentType {
  return {
    id: f.id,
    type: f.type,
    url: f.url,
    thumbnailUrl: f.thumbnailUrl,
    filename: f.originalFilename || f.filename,
    mimeType: f.mimeType,
    size: f.size
  }
}

export default function MediaLinksDocsDrawer({ open, onClose, conversationId }: MediaLinksDocsDrawerProps) {
  const [tab, setTab] = useState<0 | 1>(0)
  const [mediaItems, setMediaItems] = useState<FileItem[]>([])
  const [docItems, setDocItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [mediaHasMore, setMediaHasMore] = useState(false)
  const [docHasMore, setDocHasMore] = useState(false)
  const [mediaPage, setMediaPage] = useState(1)
  const [docPage, setDocPage] = useState(1)
  const [preview, setPreview] = useState<{
    attachment: ChatAttachmentType
    list: ChatAttachmentType[]
    index: number
  } | null>(null)

  const fetchMedia = useCallback(
    async (page: number, reset = false) => {
      if (!conversationId) return
      setLoading(true)
      try {
        // Fetch both image and video without a type filter, then filter client-side
        const res = await getConversationFiles(String(conversationId), {
          page,
          limit: PAGE_LIMIT
        })
        const mediaOnly = (res.items as FileItem[]).filter(f => f.type === 'image' || f.type === 'video')
        setMediaItems(prev => (reset ? mediaOnly : [...prev, ...mediaOnly]))
        setMediaHasMore(page < res.totalPages)
        setMediaPage(page)
      } catch (err) {
        console.error('[MediaDrawer] fetchMedia error:', err)
      } finally {
        setLoading(false)
      }
    },
    [conversationId]
  )

  const fetchDocs = useCallback(
    async (page: number, reset = false) => {
      if (!conversationId) return
      setLoading(true)
      try {
        const res = await getConversationFiles(String(conversationId), {
          page,
          limit: PAGE_LIMIT,
          type: 'document'
        })
        setDocItems(prev => (reset ? (res.items as FileItem[]) : [...prev, ...(res.items as FileItem[])]))
        setDocHasMore(page < res.totalPages)
        setDocPage(page)
      } catch (err) {
        console.error('[MediaDrawer] fetchDocs error:', err)
      } finally {
        setLoading(false)
      }
    },
    [conversationId]
  )

  useEffect(() => {
    if (!open || !conversationId) return
    setMediaItems([])
    setDocItems([])
    setTab(0)
    fetchMedia(1, true)
    fetchDocs(1, true)
  }, [open, conversationId])

  const mediaAttachments = mediaItems.map(fileToAttachment)

  if (!open) return null

  return (
    <>
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
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>Media, links and docs</Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}`, flexShrink: 0 }}
        >
          <Tab label='Media' sx={{ flex: 1, textTransform: 'none', fontWeight: 500 }} />
          <Tab label='Docs' sx={{ flex: 1, textTransform: 'none', fontWeight: 500 }} />
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading && mediaItems.length === 0 && docItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : tab === 0 ? (
            mediaItems.length === 0 ? (
              <Box sx={{ pt: 6, textAlign: 'center' }}>
                <Icon icon='mdi:image-off-outline' fontSize='2.5rem' color='customColors.OutlineVariant' />
                <Typography variant='body2' sx={{ mt: 1, color: 'customColors.neutralSecondary' }}>
                  No media yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                  {mediaItems.map((item, idx) => (
                    <Box
                      key={item.id}
                      onClick={() =>
                        setPreview({ attachment: fileToAttachment(item), list: mediaAttachments, index: idx })
                      }
                      sx={{
                        aspectRatio: '1',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: 'customColors.SurfaceVariant',
                        '&:hover': { opacity: 0.85 },
                        transition: 'opacity 150ms'
                      }}
                    >
                      <Box
                        component='img'
                        src={item.thumbnailUrl || item.url}
                        alt={item.originalFilename}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                  ))}
                </Box>
                {mediaHasMore && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography
                      variant='caption'
                      onClick={() => fetchMedia(mediaPage + 1)}
                      sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 500 }}
                    >
                      Load more
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          ) : docItems.length === 0 ? (
            <Box sx={{ pt: 6, textAlign: 'center' }}>
              <Icon icon='mdi:file-document-outline' fontSize='2.5rem' color='customColors.OutlineVariant' />
              <Typography variant='body2' sx={{ mt: 1, color: 'customColors.neutralSecondary' }}>
                No documents yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Docs open in the in-app `AttachmentPreviewDialog` (same
                  one the chat bubbles use) instead of downloading. The
                  dialog dynamic-imports `PdfPreview` / `DocxPreview` /
                  `SpreadsheetPreview` based on mime type. We pass the
                  full doc list so the user can step through documents
                  the same way they navigate between media items. */}
              {(() => {
                const docAttachments = docItems.map(fileToAttachment)

                return docItems.map((item, idx) => (
                  <Box
                    key={item.id}
                    onClick={() =>
                      setPreview({
                        attachment: fileToAttachment(item),
                        list: docAttachments,
                        index: idx
                      })
                    }
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      px: 4,
                      py: 2,
                      cursor: 'pointer',
                      borderBottom: theme => `1px solid ${theme.palette.divider}`,
                      '&:hover': { backgroundColor: 'customColors.Surface' },
                      transition: 'background-color 150ms'
                    }}
                  >
                    <MuiAvatar
                      variant='rounded'
                      sx={{ width: 40, height: 40, backgroundColor: 'customColors.Surface', flexShrink: 0 }}
                    >
                      <Icon icon='mdi:file-document-outline' fontSize='1.25rem' color='customColors.Outline' />
                    </MuiAvatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'customColors.OnSurfaceVariant',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.originalFilename || item.filename}
                      </Typography>
                      <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
                        {formatBytes(item.size)}
                        {item.uploadedAt ? ` · ${new Date(item.uploadedAt).toLocaleDateString()}` : ''}
                      </Typography>
                    </Box>
                    <Icon icon='mdi:eye-outline' fontSize='1.25rem' color='customColors.Outline' />
                  </Box>
                ))
              })()}
              {docHasMore && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography
                    variant='caption'
                    onClick={() => fetchDocs(docPage + 1)}
                    sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 500 }}
                  >
                    Load more
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <AttachmentPreviewDialog
        open={preview !== null}
        attachment={preview?.attachment ?? null}
        attachments={preview?.list}
        initialIndex={preview?.index ?? 0}
        onClose={() => setPreview(null)}
      />
    </>
  )
}
