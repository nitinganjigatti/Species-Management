// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'

// Styled component for the upload image inside the dropzone area
const Img = styled('img')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    width: 250
  }
}))

// Styled component for the heading inside the dropzone area
const HeadingTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4)
  }
}))

const FileUploaderSingle = ({ files: availableFiles, onImageUpload, image, onRemoveImage = null }) => {
  // ** State
  const [files, setFiles] = useState([])

  // ** Hook
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      onImageUpload(acceptedFiles.map(file => Object.assign(file)))
      setFiles(acceptedFiles.map(file => Object.assign(file)))
    }
  })

  useEffect(() => {
    if (!availableFiles?.length)
      setFiles([])
  }, [availableFiles])

  const handleRemoveImage = () => {
    setFiles([])
    onImageUpload([])
    if (image && onRemoveImage) {
      onRemoveImage()
    }
  }

  return (
    <Box {...getRootProps({ className: 'dropzone' })} sx={files.length ? {} : {}}>
      <input {...getInputProps()} />

      {files.length || image ? (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          {onRemoveImage && (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                handleRemoveImage()
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                backgroundColor: 'white',
                '&:hover': { backgroundColor: 'grey.200' }
              }}
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          )}

          <img
            alt='Medicine Picture'
            className='single-file-image'
            src={files.length ? URL.createObjectURL(files[0]) : image}
            style={{ maxHeight: '300px', maxWidth: '300px', objectFit: 'contain' }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: ['column', 'column', 'row'],
            alignSelf: 'center'
          }}
        >
          {/* <Img width={300} alt='Upload img' src='/images/misc/upload.png' /> */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              textAlign: ['center', 'center', 'inherit']
            }}
          >
            <div style={{ alignContent: 'center' }}>
              <HeadingTypography variant='h5'>Drop files here or click to upload.</HeadingTypography>
              <Typography color='textSecondary' sx={{ '& a': { color: 'primary.main', textDecoration: 'none' } }}>
                Drop files here or click{' '}
                <Link href='/' onClick={e => e.preventDefault()}>
                  browse
                </Link>{' '}
                through your machine
              </Typography>
            </div>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default FileUploaderSingle
