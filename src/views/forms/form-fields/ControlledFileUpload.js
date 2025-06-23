import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useController } from 'react-hook-form'
import Icon from 'src/@core/components/icon'

const ControlledFileUpload = ({ name, control, label, errors, color }) => {
  const {
    field: { value, onChange },
    fieldState: { error }
  } = useController({
    name,
    control,
    defaultValue: null
  })

  const handleFileChange = event => {
    const selectedFile = event.target.files[0]
    onChange(selectedFile || null)
  }

  const handleRemoveFile = () => {
    onChange(null)
    const input = document.getElementById(`file-upload-${name}`)
    if (input) input.value = ''
  }

  const hasError = Boolean(errors?.[name] || error)

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
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
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
                overflow: 'hidden'
              }}
            >
              <Box component='img' src='/icons/pdf_icon2.svg' width='18px' sx={{ mr: 2 }} />
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {value.name}
              </Typography>
            </Box>

            <IconButton onClick={handleRemoveFile} sx={{ ml: 1, background: '#0000000D', p: 0 }}>
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
