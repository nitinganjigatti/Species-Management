'use client'

// ** React Imports
import { ChangeEvent, useRef, useState } from 'react'

// ** Redux Imports
import { useDispatch } from 'react-redux'
import type { AppDispatch } from 'src/store'
import { uploadGroupIcon, addOrReplaceChat, clearChatAvatar } from 'src/store/apps/chat'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MuiAvatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'

// ** Toast
import toast from 'react-hot-toast'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar'
import AttachmentPreviewDialog from 'src/views/apps/chat/AttachmentPreviewDialog'

// ** Chat API
import { removeConversationIcon, getConversation, sdkConversationToChat } from 'src/lib/chat/api'

// ** Image compression
import { maybeCompressImage, ICON_COMPRESS_OPTIONS } from 'src/lib/chat/imageCompression'

interface GroupIconEditorProps {
  chatId: string
  avatar?: string
  fullName: string
  isAdmin: boolean
  currentUserId: string | number
  size?: number
  getInitials: (name: string) => string
}

/**
 * WhatsApp-Web style group-icon control. Renders the avatar (or initials
 * fallback), shows a "Change group icon" overlay on hover for admins, and
 * exposes a click menu with View / Upload / Remove. All state + side
 * effects are local to this component — the parent just gives us the
 * chat identity and admin flag.
 *
 * Networking:
 *   - Upload → existing `uploadGroupIcon` thunk (presigned URL → S3 → setIcon)
 *   - Remove → `removeConversationIcon` REST + `clearChatAvatar` reducer
 *     override (since `addOrReplaceChat` defensively preserves the previous
 *     avatar when the server omits `iconUrl`).
 *   - Failure path on Remove → refetch the conversation so the avatar
 *     visibly returns if the server still has it set.
 */
const GroupIconEditor = ({
  chatId,
  avatar,
  fullName,
  isAdmin,
  currentUserId,
  size = 90,
  getInitials
}: GroupIconEditorProps) => {
  const dispatch = useDispatch<AppDispatch>()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<boolean>(false)
  const [confirmingRemove, setConfirmingRemove] = useState<boolean>(false)

  const openPicker = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    setUploading(true)
    const previewUrl = URL.createObjectURL(file)
    try {
      const compressed = await maybeCompressImage(file, ICON_COMPRESS_OPTIONS)
      const uploadable = {
        uri: previewUrl,
        name: compressed.name,
        type: compressed.type,
        size: compressed.size
      }
      await dispatch(uploadGroupIcon({ chatId, file: uploadable })).unwrap()
      // toast.success('Group icon updated')
    } catch (err) {
      console.error('[GroupIconEditor] upload failed:', err)
      toast.error('Failed to update group icon')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handleRemove = () => {
    setConfirmingRemove(false)
    removeConversationIcon(chatId)
      .then(conv => {
        dispatch(addOrReplaceChat(sdkConversationToChat(conv, String(currentUserId))))
        dispatch(clearChatAvatar({ chatId }))
      })
      .catch(err => {
        console.error('[GroupIconEditor] remove failed:', err)
        toast.error('Failed to remove group icon')
        // Rollback — if the server still has the icon, refetch so the
        // UI re-renders with the avatar restored.
        getConversation(chatId)
          .then(conv => dispatch(addOrReplaceChat(sdkConversationToChat(conv, String(currentUserId)))))
          .catch(refetchErr => console.warn('[GroupIconEditor] rollback failed:', refetchErr))
      })
  }

  const hasAvatar = Boolean(avatar)

  return (
    <>
      <Box
        onClick={e => {
          if (!isAdmin || uploading) return
          setMenuAnchor(e.currentTarget)
        }}
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: isAdmin && !uploading ? 'pointer' : 'default',
          '&:hover .group-icon-overlay': isAdmin ? { opacity: 1 } : {},
          '& .group-icon-overlay': menuAnchor ? { opacity: 1 } : {}
        }}
      >
        {hasAvatar ? (
          <MuiAvatar src={avatar} alt={fullName} sx={{ width: size, height: size }} />
        ) : (
          <CustomAvatar skin='light' color='primary' sx={{ width: size, height: size, fontSize: '2rem' }}>
            {getInitials(fullName)}
          </CustomAvatar>
        )}

        {isAdmin && (
          <Box
            className='group-icon-overlay'
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              color: 'common.white',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              opacity: 0,
              transition: 'opacity 150ms ease',
              pointerEvents: 'none'
            }}
          >
            <Icon icon='mdi:image-outline' fontSize='1.5rem' />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
              <Typography variant='caption' sx={{ color: 'inherit', fontWeight: 500, lineHeight: 1.1 }}>
                Change
              </Typography>
              <Typography variant='caption' sx={{ color: 'inherit', fontWeight: 500, lineHeight: 1.1 }}>
                group icon
              </Typography>
            </Box>
          </Box>
        )}

        {isAdmin && uploading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.45)',
              color: 'common.white'
            }}
          >
            <Icon icon='mdi:loading' fontSize='1.5rem' />
          </Box>
        ) : null}
      </Box>

      {isAdmin ? (
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
      ) : null}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 1 } } }}
      >
        {hasAvatar ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              setViewingPhoto(true)
            }}
          >
            <ListItemIcon>
              <Icon icon='mdi:eye-outline' fontSize='1.25rem' />
            </ListItemIcon>
            <ListItemText primary='View photo' />
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            openPicker()
          }}
        >
          <ListItemIcon>
            <Icon icon='mdi:folder-outline' fontSize='1.25rem' />
          </ListItemIcon>
          <ListItemText primary='Upload photo' />
        </MenuItem>
        {hasAvatar ? <Divider sx={{ my: 0.5 }} /> : null}
        {hasAvatar ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              setConfirmingRemove(true)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Icon icon='mdi:delete-outline' fontSize='1.25rem' color='inherit' />
            </ListItemIcon>
            <ListItemText primary='Remove photo' slotProps={{ primary: { color: 'inherit' } }} />
          </MenuItem>
        ) : null}
      </Menu>

      {hasAvatar ? (
        <AttachmentPreviewDialog
          open={viewingPhoto}
          attachment={{
            id: `group-icon-${chatId}`,
            type: 'image',
            url: avatar as string,
            filename: `${fullName ?? 'Group'} icon`,
            mimeType: 'image/*',
            size: 0
          }}
          onClose={() => setViewingPhoto(false)}
        />
      ) : null}

      <Dialog
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        maxWidth='xs'
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 500, fontSize: '1.125rem', pt: 3, pb: 1.5 }}>
          Remove this group&apos;s icon?
        </DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setConfirmingRemove(false)}
            color='primary'
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            variant='contained'
            color='primary'
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 5, px: 3 }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GroupIconEditor
