import React, { useState, useMemo } from 'react'
import { Box, IconButton, useTheme, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import UserAvatarDetails from './UserAvatarDetails'
import FileDialog from 'src/components/utility/FileDialog'
import { useAuth } from 'src/hooks/useAuth'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import SignedMediaPlayer from 'src/components/utility/SignedMediaPlayer'
import MenuWithDots from 'src/components/MenuWithDots'
import Utility from 'src/utility'
import ConfirmationDialog from 'src/components/confirmation-dialog'

// File type mapping to extensions
const EXT_ICON_MAP = {
  image: ['jpeg', 'jpg', 'png', 'webp', 'heic'],
  pdf: ['pdf'],
  xls: ['xls', 'xlsx'],
  document: ['doc', 'docx'],
  audio: ['mp3', 'wav'],
  video: ['mp4', 'webm', 'ogv'],
  ppt: ['ppt', 'pptx'],
  text: ['txt'],
  csv: ['csv'],
  zip: ['zip', 'rar']
}

// Helper to determine file type based on extension or MIME
const getFileType = (fileName, fileTypeFromApi) => {
  if (!fileName) return 'unknown'
  const ext = fileName?.split('.').pop().toLowerCase() || ''

  return Object.entries(EXT_ICON_MAP).find(([_, exts]) => exts.includes(ext))?.[0] || 'unknown'
}

// Get fallback icon if not image/video/audio
const getFileIcon = (fileType, imgPath) => {
  return imgPath?.[fileType] || imgPath?.default || {}
}

// Main Component
const FilePreviewCard = ({
  fileUrl,
  fileName,
  fileType: fileTypeFromApi,
  user,
  width,
  height,
  showTitle = false,
  showTitleIcon = false,
  onTitleIconClick,
  cardStyle = {},
  actions = null,
  onDeleteaction,
  ondownloadaction,
  isDeleteLoading = false
}) => {
  const theme = useTheme()
  const { userData } = useAuth()
  const imgPath = userData?.settings?.DEFAULT_IMAGE_MASTER || {}
  const [previewFile, setPreviewFile] = useState(null)
  const [isImageError, setIsImageError] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Derive file name safely
  const derivedFileName = () => {
    if (fileName) return fileName.trim()

    try {
      const lastSegment = fileUrl?.split('/')?.pop() || ''

      return decodeURIComponent(lastSegment.split('?')[0] || 'unknown')
    } catch {
      return 'unknown'
    }
  }

  // Determine file type and icon
  const fileType = getFileType(derivedFileName(), fileTypeFromApi)
  const fileIcon = getFileIcon(fileType, imgPath)

  // Handle preview click
  const handlePreviewClick = () => {
    if (!fileUrl || typeof fileUrl !== 'string') return
    const typeMap = { image: 'image', video: 'video', pdf: 'pdf', audio: 'audio' }
    setPreviewFile({
      src: fileUrl,
      type: typeMap[fileType] || 'other',
      name: derivedFileName(),
      fileIcon: fileIcon
    })
  }

  // Render preview
  const renderPreview = () => {
    const commonProps = {
      sx: {
        width: '100%',
        display: 'flex',
        height: '100%',
        borderRadius: showTitle ? '8px' : '4px',
        overflow: 'hidden',
        cursor: 'pointer'
      },
      onClick: handlePreviewClick
    }

    if (fileType == 'image') {
      if (isImageError || !fileUrl) {
        // Show fallback icon when broken or missing
        return (
          <Box
            {...commonProps}
            sx={{
              ...commonProps.sx,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: fileIcon?.bg_color || theme.palette.action.hover
            }}
          >
            <Icon icon='mdi:image-off-outline' fontSize={50} color={theme.palette.text.secondary} />
          </Box>
        )
      }

      return (
        <Box {...commonProps} sx={{ ...commonProps.sx, maxHeight: '144px' }}>
          <img
            src={fileUrl}
            alt={derivedFileName()}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setIsImageError(true)}
          />
        </Box>
      )
    }

    if (fileType == 'video')
      return (
        <Box
          {...commonProps}
          sx={{
            ...commonProps.sx,
            position: 'relative', // needed for overlay
            overflow: 'hidden'
          }}
        >
          {/* <video src={fileUrl}  muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
          <SignedMediaPlayer
            src={fileUrl}
            preload='auto'
            type='video'
            controls={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <Box
            onClick={handlePreviewClick}
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimary,
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 200ms',
                '&:hover': { backgroundColor: theme.palette.customColors.OnPrimary50 }
              }}
            >
              <Icon icon='mdi:play' fontSize={28} color={theme.palette.customColors.neutralPrimary} />
            </Box>
          </Box>
        </Box>
      )

    // fallback icon for other/unknown types
    return (
      <Box
        {...commonProps}
        sx={{
          ...commonProps.sx,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fileIcon?.bg_color || theme.palette.action.hover
        }}
      >
        {fileIcon?.image_path ? (
          <Box
            component='img'
            src={fileIcon?.image_path}
            alt='file icon'
            sx={{ width: showTitle ? 60 : 32, height: showTitle ? 60 : 32, objectFit: 'contain' }}
          />
        ) : (
          <Icon
            icon={fileIcon?.icon || 'mdi:file'}
            fontSize={50}
            color={fileIcon?.icon_color || theme.palette.primary.main}
          />
        )}
      </Box>
    )
  }

  const menuOptions = useMemo(() => {
    const opts = []

    if (ondownloadaction) {
      opts.push({
        label: <Typography>Download</Typography>,

        // icon: <Icon icon='mdi:download' fontSize={20} />,
        action: () => Utility.downloadFileFromURLWithBlob(fileUrl, derivedFileName())
      })
    }

    if (onDeleteaction) {
      opts.push({
        label: <Typography>Delete</Typography>,

        // icon: <Icon icon='mdi:delete-outline' fontSize={20} />,
        action: () => setIsDeleteModalOpen(true)
      })
    }

    if (actions && Array.isArray(actions)) {
      opts.push(...actions)
    }

    return opts
  }, [actions, onDeleteaction, ondownloadaction, fileUrl])

  return (
    <>
      {isDeleteModalOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={'Delete Media'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={async () => {
            await onDeleteaction()
            setIsDeleteModalOpen(false)
          }}
          loading={isDeleteLoading}
          ConfirmationText={'DELETE'}
          description={' Are you sure you want to delete this media?'}
        />
      )}
      {previewFile && (
        <FileDialog
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          src={previewFile?.src}
          type={previewFile?.type}
          title={previewFile?.name}
          fileIcon={previewFile?.fileIcon}
        />
      )}

      <Box
        sx={{
          width,
          height,
          borderRadius: '8px',
          border: `1px solid ${theme.palette?.customColors?.OutlineVariant}`,
          p: showTitle ? '8px' : '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: showTitle ? '8px' : '4px',
          backgroundColor: theme.palette?.customColors?.OnPrimary,
          ...cardStyle
        }}
      >
        {/* Title & optional close icon */}
        {(showTitle || showTitleIcon) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {showTitle && (
              <TextEllipsisWithModal
                enableDialog={false}
                text={derivedFileName()}
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  maxWidth: width
                }}
              />
            )}

            {/* {showTitleIcon && (
                <IconButton
                  onClick={e => {
                    onTitleIconClick?.()
                  }}
                  sx={{ padding: 0, color: theme.palette.customColors.neutralSecondary }}
                >
                  <Icon icon='mdi:close-circle' fontSize={22} />
                </IconButton>
              )} */}
            {menuOptions.length > 0 && <MenuWithDots options={menuOptions} iconSx={{ p: 0 }} />}
          </Box>
        )}

        {renderPreview()}

        {user && (
          <UserAvatarDetails
            date={user?.modified_at || user?.created_at}
            user_name={user?.user_profile?.user_full_name}
            profile_image={user?.user_profile?.user_profile_pic}
            size='medium'
            show_time
          />
        )}
      </Box>
    </>
  )
}

export default FilePreviewCard
