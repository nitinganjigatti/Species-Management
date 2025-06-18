import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'

const FileUpload = ({ name, file, onFileUpload }) => {
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
        border: '1px dashed #C3CEC7',
        padding: '13px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        mt: 1,
        borderRadius: '10px',
        position: 'relative',
        width: '100%',
        maxWidth: '215px',
        height: '51px'
      }}
    >
      {!file ? (
        <>
          <img
            src='/icons/attach_file_add.svg'
            alt='Grocery Icon'
            width='20px'
            style={{ marginRight: '15px', marginLeft: '10px' }}
          />
          <Typography sx={{ color: '#839D8D', fontWeight: 400 }}> {name}</Typography>
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
          <Typography
            sx={{
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px'
            }}
          >
            <img src='/icons/pdf_icon2.svg' width='18px' style={{ marginRight: '8px' }} />
            {file.name}
          </Typography>
          <IconButton onClick={handleRemoveFile} sx={{ ml: 1, background: '#0000000D', p: 0 }}>
            <Icon icon={'ion:close-outline'} style={{ color: '#1F515B', fontSize: '20px' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

export default FileUpload
