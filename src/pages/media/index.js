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
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import EventIcon from '@mui/icons-material/Event'

import { useDropzone } from 'react-dropzone'
import { useAuth } from 'src/hooks/useAuth'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { deleteMediaFile, getMediaListById, uploadMediaFile } from 'src/lib/api/media'
import moment from 'moment'
import Image from 'next/image'

const Media = () => {
  const auth = useAuth()
  const theme = useTheme()

  const [filePreviews, setFilePreviews] = useState([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState('all') // Initialize date filter state
  const [selectedFileTypeFilter, setSelectedFileTypeFilter] = useState('all') // Initialize file type filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)

  const userId = auth?.userData?.user?.user_id

  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const getMediaListUserId = useCallback(
    async userId => {
      try {
        setLoading(true)
        const response = await getMediaListById(userId)
        if (response?.success) {
          setFilePreviews(response?.data?.result)
          setLoading(false)
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
        setLoading(false)
      } catch (error) {
        console.error('Error uploading files:', error)
        setBtnLoader(false) // Hide loader on error
        setLoading(false)
      }
    }
  })

  const handleDelete = async id => {
    console.log(selectedId?.id, 'delete')
    setIsModalOpenDelete(true)
    setAnchorEl(null)
  }
  const confirmDeleteAction = async () => {
    try {
      setIsModalOpenDelete(false)
      const res = await deleteMediaFile(selectedId?.id)
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
  const handleDownload = async id => {
    console.log('filePreviews', filePreviews)
    if (selectedId) {
      const link = document.createElement('a')
      link.href = selectedId.user_media
      link.download = selectedId.file_original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      Toaster({ type: 'success', message: 'File downloaded successfully!' })
      setAnchorEl(null)
    } else {
      Toaster({ type: 'error', message: 'No file selected for download.' })
      setAnchorEl(null)
    }
  }

  console.log(imgPath, 'auth')

  const getIconByFileType = fileName => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return { icon: imgPath?.pdf?.image_path, bgColor: imgPath?.pdf?.bg_color }
      case 'xls':
      case 'xlsx':
        return { icon: imgPath?.xls?.image_path, bgColor: imgPath?.xls?.bg_color }
      case 'doc':
      case 'docx':
        return { icon: imgPath?.document?.image_path, bgColor: imgPath?.document?.bg_color }
      case 'mp3':
      case 'wav':
      case 'ogg':
        return { icon: imgPath?.audio?.image_path, bgColor: imgPath?.audio?.bg_color }
      default:
        return { icon: imgPath?.default?.image_path, bgColor: imgPath?.default?.bg_color }
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

  const handleClick = (event, media) => {
    setAnchorEl(event.currentTarget)
    setSelectedId(media)
    console.log(media)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {loading ? (
        <FallbackSpinner />
      ) : (
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
                      sx={{ display: 'flex', alignItems: 'center', margin: '16px 0', fontWeight: 'bold' }}
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
                              <CardContent sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
                                <Tooltip title={media?.file_original_name} arrow>
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
                                </Tooltip>
                              </CardContent>

                              {media?.user_media && (
                                <>
                                  {media?.user_media.match(/\.(jpeg|jpg|gif|png|svg)$/) != null ? (
                                    <CardMedia
                                      component='img'
                                      height='160'
                                      image={media?.user_media}
                                      alt={media?.file_original_name}
                                      sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
                                    />
                                  ) : (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: 120,
                                        borderRadius: 1,
                                        bgcolor: getIconByFileType(media?.file_original_name)?.bgColor,
                                        m: 5
                                      }}
                                    >
                                      <Image
                                        src={getIconByFileType(media?.file_original_name)?.icon}
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
                                  right: 1,
                                  cursor: 'pointer'
                                }}
                                onClick={e => handleClick(e, media)}
                              >
                                <Icon icon='mdi:dots-vertical' />
                              </IconButton>

                              <CardContent
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', pb: 0, pt: 0 }}
                              >
                                <Box>{moment(media?.file_original_name?.created_at).format('hh:mm A')}</Box>
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
            <MenuItem>View</MenuItem>
            <MenuItem onClick={handleDownload}>Download</MenuItem>
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
      )}
    </>
  )
}

export default Media
