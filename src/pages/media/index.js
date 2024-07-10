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
  Tooltip,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputAdornment,
  Divider,
  Menu
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DescriptionIcon from '@mui/icons-material/Description'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import SearchIcon from '@mui/icons-material/Search'
import EventIcon from '@mui/icons-material/Event'
import MoreVertIcon from '@mui/icons-material/MoreVert'

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
import { isSameDay } from 'date-fns'

const Media = () => {
  const auth = useAuth()
  const theme = useTheme()

  const [filePreviews, setFilePreviews] = useState([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState('all') // Initialize date filter state
  const [selectedFileTypeFilter, setSelectedFileTypeFilter] = useState('all') // Initialize file type filter state
  const [searchQuery, setSearchQuery] = useState('')

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
    console.log(selectedId, 'delete')
    // setSelectedId(id)
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

  const handleDateFilterChange = event => {
    setSelectedDateFilter(event.target.value)
    // Implement filtering logic based on date filter selection
  }

  const handleFileTypeFilterChange = event => {
    setSelectedFileTypeFilter(event.target.value)
    // Implement filtering logic based on file type filter selection
  }

  const handleSearchInputChange = event => {
    setSearchQuery(event.target.value)
    // Implement search logic based on input value
  }

  const handleSearch = () => {
    // Implement search logic here
    // Example: Filter filePreviews based on searchQuery
    const filteredFiles = filePreviews.filter(file =>
      file.file_original_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilePreviews(filteredFiles)
  }

  const renderDateHeader = date => {
    const today = moment().startOf('day')
    const yesterday = moment().subtract(1, 'days').startOf('day')

    if (moment(date).isSame(today, 'day')) {
      return 'Today ' + moment(date).format('DD MMMM YYYY')
    } else if (moment(date).isSame(yesterday, 'day')) {
      return 'Yesterday ' + moment(date).format('DD MMMM YYYY')
    } else {
      return moment(date).format('DD MMMM YYYY')
    }
  }

  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = (event, id) => {
    setAnchorEl(event.currentTarget)
    setSelectedId(id)
    console.log(id)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box display='flex' flexDirection='column'>
          <Card sx={{ p: 4, mb: 6 }}>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography
                  variant='h6'
                  gutterBottom
                  alignContent='center'
                  sx={{ display: 'flex', alignItems: 'center', margin: '10px 0', fontWeight: 'bold' }}
                >
                  Media
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} container alignItems='center' justifyContent='flex-end' spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Select value={selectedDateFilter} onChange={handleDateFilterChange} variant='outlined' fullWidth>
                    <MenuItem value='all'>All Dates</MenuItem>
                    {/* Add more date filter options as needed */}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Select
                    value={selectedFileTypeFilter}
                    onChange={handleFileTypeFilterChange}
                    variant='outlined'
                    fullWidth
                  >
                    <MenuItem value='all'>All Types</MenuItem>
                    {/* Add more file type filter options as needed */}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <TextField
                      label='Search'
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder='Search...'
                      variant='outlined'
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4} mt={6} sx={{ display: 'flex', justifyContent: 'start' }}>
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
            </Grid>
          </Card>

          <Grid container spacing={4}>
            {filePreviews.map((group, groupIndex) => (
              <Grid item key={groupIndex} xs={12}>
                <Typography
                  variant='subtitle1'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', margin: '10px 0', fontWeight: 'bold' }}
                >
                  <Divider sx={{ width: 30, marginRight: '5px' }} orientation='horizontal' />
                  <EventIcon sx={{ marginRight: '5px' }} />
                  {renderDateHeader(group.date)}
                  <Divider sx={{ flexGrow: 1, marginLeft: '5px' }} orientation='horizontal' />
                </Typography>

                <Grid container spacing={6}>
                  {group.media.map((media, mediaIndex) => (
                    <React.Fragment key={mediaIndex}>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ position: 'relative', height: '100%', bgcolor: '#f2f2f2' }}>
                          <CardContent sx={{ display: 'flex', alignItems: 'center', pb: 7 }}>
                            <Typography
                              variant='subtitle2'
                              gutterBottom
                              sx={{
                                ml: 2,
                                mb: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 180 // Adjust this based on your design
                              }}
                            >
                              {media?.file_original_name}
                            </Typography>
                          </CardContent>

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
                                </Box>
                              )}
                            </>
                          )}

                          <IconButton
                            aria-label='more'
                            aria-controls='long-menu'
                            aria-haspopup='true'
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 8,
                              cursor: 'pointer'
                            }}
                            onClick={e => handleClick(e, media?.id)}
                          >
                            <Icon icon='mdi:dots-vertical' />
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
                    </React.Fragment>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>

      <Menu keepMounted id='long-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
        <MenuItem onClick={e => onHandleDropdown(e)}>View</MenuItem>
        <MenuItem>Download</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

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
    </>
  )
}

export default Media
