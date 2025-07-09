import React, { useMemo } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useController } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'

const ControlledFileUpload = ({
  name,
  control,
  label,
  errors,
  color,
  acceptFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
}) => {
  const {
    field: { value, onChange },
    fieldState: { error }
  } = useController({
    name,
    control,
    defaultValue: null
  })

  const auth = useAuth()

  const imgPath = useMemo(() => auth?.userData?.settings?.DEFAULT_IMAGE_MASTER, [auth])

  const getFileIcon = () => {
    const fileName = getFileName().toLowerCase()
    console.log('fileName', fileName)
    const ext = fileName?.split('.')?.pop()?.toLowerCase()
    if (['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'].includes(ext)) return imgPath.image
    if (['pdf'].includes(ext)) return imgPath.pdf
    if (['xls', 'xlsx'].includes(ext)) return imgPath.xls
    if (['doc', 'docx'].includes(ext)) return imgPath.document
    if (['mp3', 'wav', 'ogg'].includes(ext)) return imgPath.audio

    return imgPath.default
  }

  const handleFileChange = event => {
    const selectedFile = event.target.files[0]
    onChange(selectedFile || null)
  }

  const handleRemoveFile = e => {
    e.stopPropagation() // Prevent triggering the file open when removing
    onChange(null)
    const input = document.getElementById(`file-upload-${name}`)
    if (input) input.value = ''
  }

  const handleFileClick = () => {
    if (!value) return

    // If it's a File object (new upload)
    if (value instanceof File) {
      const fileURL = URL.createObjectURL(value)
      window.open(fileURL, '_blank')

      // Clean up the object URL when done
      setTimeout(() => URL.revokeObjectURL(fileURL), 100)
    }

    // If it's an existing file with path (from API)
    else if (value.file_path) {
      window.open(value.file_path, '_blank')
    }
  }

  const hasError = Boolean(errors?.[name] || error)

  // Get file name whether it's a File object or API response object
  const getFileName = () => {
    if (!value) return ''

    return value.name || value.file_original_name || ''
  }

  return (
    <Box>
      <Box
        sx={{
          border: `1px dashed ${hasError ? '#FF4C51' : '#C3CEC7'}`,
          padding: '13px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mt: 1,
          borderRadius: '10px',
          position: 'relative',
          width: '100%',
          height: '50px',
          backgroundColor: value ? '#F4F6F5' : 'transparent'
        }}
        onClick={handleFileClick}
      >
        {!value ? (
          <>
            <img
              src={color ? '/images/compliance/attach_file_add_colored.svg' : '/icons/attach_file_add.svg'}
              alt='Attach File'
              width='20px'
              style={{ marginRight: '15px', marginLeft: '10px' }}
            />
            <Typography sx={{ color: color ?? '#839D8D', fontWeight: 400 }}>{label || 'Upload File'}</Typography>
            <input
              type='file'
              id={`file-upload-${name}`}
              onChange={handleFileChange}
              accept={acceptFileTypes}
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
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                flex: 1
              }}
            >
              <Box
                component='img'
                src={getFileIcon()?.image_path}
                width='18px'
                sx={{ mr: 2, backgroundColor: getFileIcon()?.bg_color }}
              />
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {getFileName()}
              </Typography>
            </Box>

            <IconButton
              onClick={handleRemoveFile}
              sx={{
                ml: 1,
                background: '#0000000D',
                p: 0,
                '&:hover': {
                  background: '#0000001A'
                }
              }}
            >
              <Icon icon='ion:close-outline' style={{ color: '#1F515B', fontSize: '20px' }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {hasError && (
        <Typography variant='caption' sx={{ color: '#FF4C51', mt: 0.5, ml: '14px' }}>
          {errors?.[name]?.message || error?.message}
        </Typography>
      )}
    </Box>
  )
}

export default ControlledFileUpload
