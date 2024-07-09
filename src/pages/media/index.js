import React, { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DescriptionIcon from '@mui/icons-material/Description'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { useDropzone } from 'react-dropzone'
import { useAuth } from 'src/hooks/useAuth'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { deleteMediaFile, getMediaListById, uploadMediaFile } from 'src/lib/api/media'
import moment from 'moment'

import pdfIcon from 'public/icons/pdf_icon.svg'
import xlsIcon from 'public/icons/xls_icon.svg'
import docIcon from 'public/icons/doc_icon.svg'
import Image from 'next/image'

const Media = () => {
  const auth = useAuth()
  const theme = useTheme()

  const [filePreviews, setFilePreviews] = useState([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const userId = auth?.userData?.user?.user_id

  const getMediaListUserId = useCallback(
    async userId => {
      try {
        const response = await getMediaListById(userId)
        if (response?.success) {
          setFilePreviews(response?.data?.result)
        } else {
          // Handle error scenario
        }
      } catch (e) {
        console.log(e)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (userId !== undefined) {
      getMediaListUserId(userId)
    }
  }, [getMediaListUserId, userId])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: async acceptedFiles => {
      try {
        setBtnLoader(true) // Show loader
        for (const file of acceptedFiles) {
          const payload = {
            user_id: userId,
            user_attachment: [file]
          }

          // Call your upload API function with formData
          const res = await uploadMediaFile(payload)
          if (res?.success) {
            Toaster({ type: 'success', message: res?.message })

            await getMediaListUserId(userId)
          } else {
            Toaster({ type: 'error', message: res?.message })
          }
        }
        setBtnLoader(false) // Hide loader after processing files
      } catch (error) {
        console.error('Error uploading files:', error)
        setBtnLoader(false) // Hide loader on error
      }
    }
  })

  const handleDelete = async id => {
    console.log(id, 'delete')
    setSelectedId(id)
    setIsModalOpenDelete(true)
  }
  const confirmDeleteAction = async () => {
    try {
      setIsModalOpenDelete(false)
      const res = await deleteMediaFile(selectedId)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message })
        await getMediaListUserId(userId)
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  const getFileIcon = fileName => {
    const fileExtension = fileName.split('.').pop().toLowerCase()
    switch (fileExtension) {
      case 'pdf':
        return <PictureAsPdfIcon />
      case 'doc':
      case 'docx':
        return <DescriptionIcon />
      case 'xls':
      case 'xlsx':
        return <InsertDriveFileIcon />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon />
      default:
        return <InsertDriveFileIcon />
    }
  }
  const getIconByFileType = fileName => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return pdfIcon
      case 'xls':
      case 'xlsx':
        return xlsIcon
      case 'doc':
      case 'docx':
        return docIcon
      default:
        return '' // default icon if the file type is unknown
    }
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box display='flex' flexDirection='column'>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
            <Typography variant='h6' gutterBottom alignItems='center' m={0}>
              Media
            </Typography>
            <Button
              size='large'
              variant='outlined'
              sx={{ color: '#7A8684', cursor: 'pointer' }}
              {...getRootProps()}
              disabled={btnLoader}
            >
              {btnLoader ? (
                <CircularProgress size={20} sx={{ color: '#7A8684', mr: 1 }} />
              ) : (
                <Icon icon='ic:outline-file-upload' />
              )}
              &nbsp; Upload File
              <input {...getInputProps()} />
            </Button>
          </Box>

          <Grid container spacing={4}>
            {filePreviews.map((group, groupIndex) => (
              <Grid item key={groupIndex} xs={12}>
                <Typography
                  variant='subtitle1'
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    display: 'block',
                    mb: '1rem'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: '#37BD69',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        component='span'
                        sx={{
                          display: 'inline-block',
                          borderRight: '2px solid white',
                          paddingRight: '10px',
                          marginRight: '10px',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}
                      >
                        {moment(group.date).format('DD')}
                      </Typography>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography
                          component='span'
                          sx={{ display: 'block', fontWeight: 'bold', fontSize: '14px', color: 'white' }}
                        >
                          {moment(group.date).format('dddd')}
                        </Typography>
                        <Typography
                          component='span'
                          sx={{ display: 'block', fontWeight: 'bold', fontSize: '14px', color: 'white' }}
                        >
                          {moment(group.date).format('MMM YYYY')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Typography>

                {/* <Typography variant='subtitle1' gutterBottom sx={{ margin: '10px 0', fontWeight: 'bold' }}>
                  {moment(group.date).format('DD/MM/YYYY')}
                  {moment(group.date).format('DD MMMM YYYY')}
                </Typography> */}

                <Grid container spacing={6}>
                  {group.media.map((media, mediaIndex) => (
                    <Grid item key={mediaIndex} xs={12} sm={6} md={4} lg={3}>
                      <Card sx={{ position: 'relative', height: '100%', bgcolor: '#f2f2f2' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', pb: 7 }} />
                        {media?.user_media && (
                          <>
                            {media?.user_media.match(/\.(jpeg|jpg|gif|png|svg)$/) != null ? (
                              <CardMedia
                                component='img'
                                height='160'
                                image={media?.user_media}
                                alt={media?.file_original_name}
                                sx={{ objectFit: 'cover', borderRadius: 2, p: 3 }}
                              />
                            ) : (
                              <a
                                href={media?.user_media}
                                target='_blank'
                                rel='noopener noreferrer'
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <Tooltip title='Download' arrow>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      height: '160px'
                                    }}
                                  >
                                    <Image
                                      src={getIconByFileType(media?.file_original_name)}
                                      alt=''
                                      width={80}
                                      height={80}
                                    />

                                    {/* {getFileIcon(media?.file_original_name)} */}
                                  </Box>
                                </Tooltip>
                              </a>
                            )}
                          </>
                        )}
                        <IconButton
                          aria-label='delete'
                          onClick={() => handleDelete(media?.id)}
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)'
                            },
                            cursor: 'pointer'
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>

                        <CardContent sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
                          <Tooltip title={media?.file_original_name} arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getFileIcon(media?.file_original_name)}
                              <Typography
                                variant='subtitle2'
                                gutterBottom
                                sx={{
                                  ml: 2,
                                  mb: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 200 // Adjust this based on your design
                                }}
                              >
                                {media?.file_original_name}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
      <Dialog open={isModalOpenDelete} onClose={() => setIsModalOpenDelete(false)}>
        <DialogTitle>
          <IconButton
            aria-label='close'
            onClick={() => setIsModalOpenDelete(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: theme.palette.customColors.mdAntzNeutral
              }}
            >
              <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                Are you sure you want to delete this media?
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Button
                disabled={btnLoader}
                onClick={() => setIsModalOpenDelete(false)}
                variant='outlined'
                sx={{
                  color: 'gray',
                  width: '45%'
                }}
              >
                Cancel
              </Button>

              <LoadingButton
                loading={btnLoader}
                size='large'
                variant='contained'
                sx={{ width: '45%' }}
                onClick={() => confirmDeleteAction()}
              >
                Delete
              </LoadingButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent />
      </Dialog>
    </Card>
  )
}

export default Media
