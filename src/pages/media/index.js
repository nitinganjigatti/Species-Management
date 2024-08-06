import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
  Menu,
  debounce
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
import InfiniteScroll from 'react-infinite-scroll-component'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Utility from 'src/utility'

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
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(null)

  // const userId = auth?.userData?.user?.user_id
  // const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER
  const userId = useMemo(() => auth?.userData?.user?.user_id, [auth])
  const imgPath = useMemo(() => auth?.userData?.settings?.DEFAULT_IMAGE_MASTER, [auth])

  const searchMediaData = useCallback(
    debounce(async q => {
      setSearchQuery(q)
      setPage(1)
      try {
        await getMediaListUserId(userId, q, 1)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const getMediaListUserId = useCallback(
    async (userId, q, page) => {
      if (!hasMore && page !== 1) return
      try {
        setLoading(true)
        const params = {
          q,
          userId,
          page
        }
        const response = await getMediaListById({ params })
        if (response?.success) {
          setTotalCount(response?.data?.total_count)
          if (page === 1) {
            setFilePreviews(response?.data?.result)
          } else {
            setFilePreviews(prev => [...prev, ...response?.data?.result])
          }
          setLoading(false)
          setHasMore(response?.data?.result.length > 0)
        } else {
          // Handle error scenario
          setLoading(false)
          setHasMore(false)
        }
      } catch (e) {
        console.error(e)
        setLoading(false)
      }
    },
    [hasMore]
  )

  useEffect(() => {
    if (userId !== undefined) {
      getMediaListUserId(userId, searchQuery, page)
    }
  }, [userId, searchQuery, page, getMediaListUserId])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'video/*': ['.mp4'],
      'audio/mpeg': ['.mp3'],
      'video/quicktime': ['.mov']
    },
    onDrop: async acceptedFiles => {
      try {
        setBtnLoader(true) // Show loader
        let successCount = 0 // Track successful uploads count
        let message = ''

        for (const file of acceptedFiles) {
          const payload = {
            user_id: userId,
            user_attachment: [file]
          }
          // Call your upload API function with formData
          const res = await uploadMediaFile(payload)
          if (res?.success) {
            successCount++ // Increment successful uploads count
            message = res?.message
            // Toaster({ type: 'success', message: res?.message })
            // await getMediaListUserId(userId)
          } else {
            Toaster({ type: 'error', message: res?.message })
          }
        }
        if (successCount === acceptedFiles.length) {
          Toaster({ type: 'success', message: message })
          await getMediaListUserId(userId, searchQuery, 1)
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
        await getMediaListUserId(userId, searchQuery, 1)
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  const handleDownload = async () => {
    if (selectedId && selectedId.user_media) {
      try {
        const response = await fetch(selectedId.user_media)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = encodeURIComponent(selectedId.file_original_name)
        link.target = '_blank' // Open the download link in a new tab
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setAnchorEl(null)
        const fileExtension = selectedId.file_original_name.split('.').pop().toLowerCase()
        const isImage = ['jpeg', 'jpg', 'gif', 'png', 'svg'].includes(fileExtension)
        setTimeout(() => {
          if (isImage) {
            Toaster({ type: 'success', message: 'Image downloaded successfully!' })
          } else {
            Toaster({ type: 'success', message: 'File downloaded successfully!' })
          }
        }, 500)
      } catch (error) {
        console.error('Error downloading file:', error)
        Toaster({ type: 'error', message: 'Failed to download file.' })
        setAnchorEl(null)
      }
    } else {
      Toaster({ type: 'error', message: 'No file selected for download.' })
      setAnchorEl(null)
    }
  }

  const handleView = media => {}

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
    const value = event.target.value
    setSearchQuery(value)
    searchMediaData(value)
  }

  // const renderDateHeader = useMemo(
  //   () => date => {
  //     const today = moment().startOf('day')
  //     const yesterday = moment().subtract(1, 'days').startOf('day')

  //     if (moment(date).isSame(today, 'day')) {
  //       return 'Today ' + moment(date).format('DD MMMM YYYY')
  //     } else if (moment(date).isSame(yesterday, 'day')) {
  //       return 'Yesterday ' + moment(date).format('DD MMMM YYYY')
  //     } else {
  //       return moment.utc(date).format('DD MMMM YYYY')
  //     }
  //   },
  //   []
  // )

  const renderDateHeader = useMemo(
    () => date => {
      const today = moment().startOf('day')
      const yesterday = moment().subtract(1, 'days').startOf('day')

      if (moment(date).isSame(today, 'day')) {
        return 'Today ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      } else if (moment(date).isSame(yesterday, 'day')) {
        return 'Yesterday ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      } else {
        return Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      }
    },
    []
  )

  const handleClick = (event, media) => {
    setAnchorEl(event.currentTarget)
    setSelectedId(media)
    console.log(media)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleScroll = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1)
    }
  }, [hasMore, loading])

  return (
    <>
      {loading ? (
        <FallbackSpinner />
      ) : (
        <>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display='flex' flexDirection='column'>
              <Card sx={{ p: 4, mb: 6 }}>
                <Grid container spacing={2} direction='column' alignItems='flex-start'>
                  <Grid item xs={12} width='100%'>
                    <Grid container justifyContent='space-between' alignItems='center'>
                      <Grid item>
                        <Typography
                          variant='h6'
                          gutterBottom
                          sx={{ display: 'flex', alignItems: 'center', margin: '10px 0', fontWeight: 'bold' }}
                        >
                          Media
                        </Typography>
                      </Grid>
                      <Grid item sx={{ display: { xs: 'none', sm: 'block' } }}>
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
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
                    <Button
                      size='large'
                      variant='outlined'
                      fullWidth
                      sx={{ color: '#7A8684', cursor: 'pointer', mt: 2 }}
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
                </Grid>
                {/* <Grid container spacing={2} alignItems='center'>
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
                  <Grid item xs={12} md={6} container alignItems='center' justifyContent='flex-end'>
                    <Grid item>
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
                  </Grid>


                </Grid> */}
                {/* <Grid item xs={12} sm={4} mt={6} sx={{ display: 'flex', justifyContent: 'start' }}>
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
                </Grid> */}
              </Card>

              <InfiniteScroll
                dataLength={filePreviews.length}
                next={handleScroll}
                hasMore={hasMore}
                // loader={loading ? <CircularProgress /> : null}
                style={{ overflow: 'hidden' }}
                endMessage={
                  <Typography variant='body2' color='textSecondary' align='center' sx={{ mt: 6 }}>
                    No more media files to load.
                  </Typography>
                }
              >
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
                              <Card sx={{ position: 'relative', height: '100%', bgcolor: '#FFFFFF' }}>
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
                                    ) : media?.user_media.match(/\.(mp4|mov)$/) != null ? (
                                      <CardMedia
                                        component='video'
                                        controls
                                        height='160'
                                        // image={media?.user_media}
                                        src={media?.user_media}
                                        alt={media?.file_original_name}
                                        sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
                                        type='video/mp4'
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
                                    right: 4,
                                    cursor: 'pointer'
                                  }}
                                  onClick={e => handleClick(e, media)}
                                >
                                  <Icon icon='mdi:dots-vertical' />
                                </IconButton>

                                <CardContent
                                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', pb: 0, pt: 0 }}
                                >
                                  <Box>
                                    {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(media?.created_at))}
                                  </Box>
                                  {/* <Box>{moment.utc(media?.created_at).local().format('hh:mm A')}</Box> */}
                                </CardContent>
                              </Card>
                            </Grid>
                          </React.Fragment>
                        ))}
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </InfiniteScroll>
            </Box>
          </CardContent>

          <Menu keepMounted id='long-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
            {/* <MenuItem onClick={handleView}>View</MenuItem> */}
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
