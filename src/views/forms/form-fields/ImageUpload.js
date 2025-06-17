import React, { useState, useCallback } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { CloudUpload as UploadIcon, Close as CloseIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material'
import { useController } from 'react-hook-form'
import { useTheme, alpha } from '@mui/material/styles';

const ImageUpload = ({ name, control, errors, label = 'Upload Permit' }) => {
  const theme = useTheme()
  const [preview, setPreview] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)

  const {
    field: { value, onChange, ref }
  } = useController({
    name,
    control,
    defaultValue: null
  })

  const handleFileChange = useCallback(
    event => {
      const selectedFile = event.target.files[0]
      if (selectedFile) {
        onChange(selectedFile)
        setFileType(selectedFile.type)
        const url = URL.createObjectURL(selectedFile)
        setFileUrl(url)

        if (selectedFile.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onloadend = () => setPreview(reader.result)
          reader.readAsDataURL(selectedFile)
        } else {
          setPreview(null)
        }
      }
    },
    [onChange]
  )

  const handleRemove = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    onChange(null)
    setPreview(null)
    setFileType(null)
    setFileUrl(null)

    const input = document.getElementById(`file-upload-${name}`)
    if (input) input.value = ''
  }, [fileUrl, name, onChange])

  const handleOpenInNewTab = useCallback(() => {
    if (fileUrl) window.open(fileUrl, '_blank')
  }, [fileUrl])

  const isPdf = fileType === 'application/pdf'
  const isImage = fileType?.startsWith('image/')
  const hasError = Boolean(errors?.[name])

  return (
    <Box>
      <Box
        sx={{
          border: `1px solid ${hasError ? theme.palette.error.main : theme.palette.grey[400]}`,
          borderRadius: '8px',
          backgroundColor: value
            ? isPdf
              ? theme.palette.customColors.Surface
              : theme.palette.grey[50]
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          paddingY: theme.spacing(1.2),
          paddingX: 4,
          justifyContent: value ? 'flex-start' : 'center',
          cursor: value ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: value
              ? isPdf
                ? theme.palette.customColors.Surface
                : theme.palette.grey[100]
              : 'transparent'
          },
          minHeight: 56
        }}
        onClick={value ? handleOpenInNewTab : undefined}
      >
        {value ? (
          <>
            {isPdf ? (
              <PdfIcon sx={{ color: theme.palette.error.main, fontSize: 22, mr: 1 }} />
            ) : (
              <UploadIcon sx={{ color: theme.palette.primary.main, fontSize: 22, mr: 1 }} />
            )}
            <Typography variant='body2' sx={{ flex: 1, fontWeight: 500, color: theme.palette.text.primary }}>
              {value.name}
            </Typography>
            <IconButton
              onClick={e => {
                e.stopPropagation()
                handleRemove()
              }}
              size='small'
              sx={{
                backgroundColor: alpha(theme.palette.customColors.neutral05, 0.1),
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <CloseIcon fontSize='small' color={theme.palette.customColors.OnPrimaryContainer} />
            </IconButton>
          </>
        ) : (
          <>
            <input
              accept='image/*,.pdf,.doc,.docx'
              style={{ display: 'none' }}
              id={`file-upload-${name}`}
              type='file'
              onChange={handleFileChange}
              ref={ref}
            />
            <label
              htmlFor={`file-upload-${name}`}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                gap: '8px'
              }}
            >
              <UploadIcon sx={{ color: hasError ? theme.palette.error.main : theme.palette.text.primary, fontSize: 22, mr: 1 }} />
              <Typography variant='body2' sx={{ fontSize: '0.875rem', color: hasError ? theme.palette.error.main : theme.palette.text.secondary }}>
                {label}
              </Typography>
            </label>
          </>
        )}
      </Box>

      {preview && isImage && (
        <Box
          sx={{
            mt: 1,
            borderRadius: 1,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.grey[300]}`,
            cursor: 'pointer'
          }}
          onClick={handleOpenInNewTab}
        >
          <img
            src={preview}
            alt='Preview'
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>
      )}

      {hasError && (
        <Typography variant='caption' sx={{ color: theme.palette.error.main, mt: 0.5, mx: '14px' }}>
          {errors[name]?.message}
        </Typography>
      )}
    </Box>
  )
}

export default ImageUpload
