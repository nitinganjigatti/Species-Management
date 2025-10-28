import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'

const UploadDocument = ({ name, file, onFileUpload }) => {
  const auth = useAuth()
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER // Get image paths from user data

  const getFileIcon = () => {
    const fileName = (file?.name || file?.file_original_name || '').toLowerCase()
    const ext = fileName?.split('.')?.pop()?.toLowerCase()

    if (!ext) return imgPath?.default // Fallback if no extension found

    if (['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'].includes(ext)) {
      return imgPath?.image
    }

    if (['pdf'].includes(ext)) {
      return imgPath?.pdf
    }

    if (['xls', 'xlsx'].includes(ext)) {
      return imgPath?.xls
    }

    if (['doc', 'docx'].includes(ext)) {
      return imgPath?.document
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return imgPath?.audio
    }

    return imgPath?.default
  }

  const handleFileChange = event => {
    const selectedFile = event.target.files[0]
    onFileUpload(selectedFile || null)
  }

  const handleRemoveFile = () => {
    onFileUpload(null)
  }

  return (
    <Box
      sx={{
        border: '1px solid #C3CEC7',
        padding: '13px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        mt: 1,
        borderRadius: '10px',
        position: 'relative',
        width: '100%',
        maxWidth: '255px',
        height: '51px',
        background: file?.file_original_name || file?.name ? '#F2FFF8' : '#fff'
      }}
    >
      {file?.file_original_name === null || file === null ? (
        <>
          <img
            src='/icons/attach_file_add_dark.svg'
            alt='Grocery Icon'
            width='20px'
            style={{ marginRight: '15px', marginLeft: '5px', color: '#006D35' }}
          />
          <Typography sx={{ color: '#006D35', fontWeight: 500 }}> {name}</Typography>
          <input
            type='file'
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0, // This is crucial for text overflow to work
              flex: 1
            }}
          >
            <img
              src={getFileIcon()?.image_path}
              width='18px'
              style={{ marginRight: '8px', flexShrink: 0 }}
              alt='File icon'
            />
            <Typography
              sx={{
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0 // This is crucial for text overflow to work
              }}
            >
              {file?.name || file?.file_original_name}
            </Typography>
          </Box>
          <IconButton onClick={handleRemoveFile} sx={{ ml: 1, background: '#0000000D', p: 0 }}>
            <Icon icon={'ion:close-outline'} style={{ color: '#1F515B', fontSize: '20px' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

export default UploadDocument
