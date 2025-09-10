import { useEffect, useState } from 'react'
import Link from 'next/link'

import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { useDropzone } from 'react-dropzone'
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import Image from 'next/image'

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

const CustomFileUploaderSingle = ({ onImageUpload, imageData, props, uploadedImagenew }) => {
  // ** State
  const [uploadedImage, setUploadedImage] = useState(imageData || [])

  // ** Hook
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles
      setUploadedImage(file)
      onImageUpload(file)
    }
  })
  console.log(uploadedImage, 'lll')

  const handleimage = e => {
    setUploadedImage([])
    onImageUpload(null)
  }
  useEffect(() => {
    if (uploadedImagenew) {
      if (typeof uploadedImagenew === 'string') {
        setUploadedImage([uploadedImagenew])
      } else {
        setUploadedImage(uploadedImagenew)
      }
    } else {
      setUploadedImage([])
    }
  }, [uploadedImagenew])

  return (
    <>
      {!uploadedImage.length > 0 ? (
        <Box
          {...getRootProps({ className: 'dropzone' })}
          sx={uploadedImage.length ? { position: 'absolute', width: '34%' } : {}}
        >
          <input {...getInputProps()} />
          <Box
            sx={{
              alignItems: 'center',
              flexDirection: ['column', 'column', 'row'],
              alignSelf: 'left',
              border: '1px solid #D8D8DD',
              padding: '20px',
              borderRadius: '12px'
            }}
            className='wwwr'
          >
            {/* <Img width={300} alt='Upload img' src='/images/misc/upload.png' /> */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'left',
                flex: 1,
                textAlign: ['left', 'left', 'inherit']
              }}
              className='ppp'
            >
              <div className='' style={{ alignContent: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* <div
                  style={{ border: '2px dotted #D8D8DD', padding: '20px', borderRadius: '4px', marginRight: '14px' }}
                >
                  <Icon icon='fluent:image-add-20-regular' style={{ fontSize: '40px' }} />
                </div> */}
                <Image alt={'filename'} src={imageUploader} width={80} height={80} />

                <Typography color='textSecondary' sx={{ '& a': { color: 'primary.main', textDecoration: 'none' } }}>
                  <span>Drop your image here</span>
                  <Link href='/' onClick={e => e.preventDefault()}></Link>{' '}
                </Typography>
              </div>
            </Box>
          </Box>
        </Box>
      ) : (
        ''
      )}
      {console.log(uploadedImage, 'uploadedImage')}
      {uploadedImage.length > 0 ? (
        <div
          style={{
            borderRadius: '12px',
            width: '135px',
            height: '135px',
            position: 'relative',
            left: '0%',
            background: '#E8F4F2',
            padding: '20px'
          }}
        >
          <img
            alt='Uploaded Image'
            src={typeof uploadedImage[0] === 'string' ? uploadedImage[0] : URL.createObjectURL(uploadedImage[0])}
            style={{
              height: '100%',
              width: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <Icon
            onClick={handleimage}
            style={{ position: 'absolute', right: '0px', top: '0px', cursor: 'pointer' }}
            icon='basil:cancel-solid'
          />
        </div>
      ) : (
        <Box
          {...getRootProps({ className: 'dropzone' })}
          sx={uploadedImage.length ? { position: 'absolute', width: '34%' } : {}}
        ></Box>
      )}
    </>
  )
}

export default CustomFileUploaderSingle
