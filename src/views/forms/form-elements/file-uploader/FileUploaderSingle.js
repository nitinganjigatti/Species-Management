// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

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

const FileUploaderSingle = props => {
  // ** State
  const [files, setFiles] = useState([])

  // ** Hook
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      props?.onImageUpload(acceptedFiles.map(file => Object.assign(file)))
      setFiles(acceptedFiles.map(file => Object.assign(file)))
    }
  })

  useEffect(() => {
    if (props?.files?.length === 0) {
      setFiles([])
    }
  }, [props])

  const img = files.map(file => (
    <img
      key={file.name}
      alt={file.name}
      className='single-file-image'
      src={URL.createObjectURL(file)}
      style={{ maxHeight: '300px', maxWidth: '300px', objectFit: 'contain' }}
    />
  ))

  return (
    <Box {...getRootProps({ className: 'dropzone' })} sx={files.length ? {} : {}}>
      <input {...getInputProps()} />

      {files.length > 0 || (props?.image !== '' && props.image !== undefined && props.image !== null) ? (
        files.length > 0 ? (
          img
        ) : (
          <img
            alt='Medicine Picture'
            className='single-file-image'
            src={`${props?.image}`}
            style={{ maxHeight: '300px', maxWidth: '300px', objectFit: 'contain' }}
          />
        )
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
