'use client'

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
  Divider,
  Menu,
  MenuItem,
  debounce
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import EventIcon from '@mui/icons-material/Event'
import Image from 'next/image'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useDropzone } from 'react-dropzone'
import moment from 'moment'

import { useTranslation } from 'react-i18next'
import { useAuth } from 'src/hooks/useAuth'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { deleteMediaFile, getMediaListById, uploadMediaFile } from 'src/lib/api/media'
import type { MediaItem, MediaGroup } from 'src/types/media'
import Utility from 'src/utility'

interface AuthData {
  userData?: {
    user?: { user_id?: string | number }
    settings?: {
      DEFAULT_IMAGE_MASTER?: {
        pdf?: { image_path: string; bg_color: string }
        xls?: { image_path: string; bg_color: string }
        document?: { image_path: string; bg_color: string }
        audio?: { image_path: string; bg_color: string }
        default?: { image_path: string; bg_color: string }
      }
    }
  } | null
}

const Media = () => {
  const auth = useAuth() as AuthData
  const theme = useTheme()
  const { t } = useTranslation()

  const [filePreviews, setFilePreviews] = useState<MediaGroup[]>([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState<MediaItem | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const userId = useMemo(() => auth?.userData?.user?.user_id, [auth])
  const imgPath = useMemo(() => auth?.userData?.settings?.DEFAULT_IMAGE_MASTER, [auth])

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const getMediaListUserId = useCallback(
    async (uid: string | number | undefined, q: string, pg: number) => {
      if (!hasMore && pg !== 1) return
      try {
        setLoading(true)
        const response = await getMediaListById({ params: { userId: uid, q, page: pg } })
        if (response?.success) {
          if (pg === 1) {
            setFilePreviews(response?.data?.result)
          } else {
            setFilePreviews(prev => [...prev, ...response?.data?.result])
          }
          setHasMore(response?.data?.result.length > 0)
        } else {
          setHasMore(false)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [hasMore]
  )

  const searchMediaData = useCallback(
    debounce(async (q: string) => {
      setPage(1)
      try {
        await getMediaListUserId(userId, q, 1)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    if (userId !== undefined) {
      getMediaListUserId(userId, '', page)
    }
  }, [userId, page])

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
    onDrop: async (acceptedFiles: File[]) => {
      try {
        setBtnLoader(true)
        let successCount = 0
        let message = ''

        for (const file of acceptedFiles) {
          const res = await uploadMediaFile({ user_id: userId, user_attachment: file })
          if ((res as { success?: boolean })?.success) {
            successCount++
            message = (res as { message?: string })?.message ?? ''
          } else {
            Toaster({ type: 'error', message: (res as { message?: string })?.message ?? 'Upload failed' })
          }
        }

        if (successCount === acceptedFiles.length) {
          Toaster({ type: 'success', message })
          await getMediaListUserId(userId, '', 1)
        }
      } catch (error) {
        console.error('Error uploading files:', error)
      } finally {
        setBtnLoader(false)
        setLoading(false)
      }
    }
  })

  const handleDelete = () => {
    setIsModalOpenDelete(true)
    setAnchorEl(null)
  }

  const confirmDeleteAction = async () => {
    try {
      setIsModalOpenDelete(false)
      if (!selectedId?.id) return
      const res = await deleteMediaFile(selectedId.id)
      if ((res as { success?: boolean })?.success) {
        Toaster({ type: 'success', message: (res as { message?: string })?.message ?? '' })
        await getMediaListUserId(userId, '', 1)
      } else {
        Toaster({ type: 'error', message: (res as { message?: string })?.message ?? 'Delete failed' })
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleDownload = async () => {
    if (!selectedId?.user_media) {
      Toaster({ type: 'error', message: 'No file selected for download.' })
      setAnchorEl(null)

      return
    }
    try {
      const response = await fetch(selectedId.user_media)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = encodeURIComponent(selectedId.file_original_name)
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setAnchorEl(null)
      const ext = selectedId.file_original_name.split('.').pop()?.toLowerCase() ?? ''
      const isImage = ['jpeg', 'jpg', 'gif', 'png', 'svg'].includes(ext)
      setTimeout(() => {
        Toaster({
          type: 'success',
          message: isImage ? 'Image downloaded successfully!' : 'File downloaded successfully!'
        })
      }, 500)
    } catch (error) {
      console.error('Error downloading file:', error)
      Toaster({ type: 'error', message: 'Failed to download file.' })
      setAnchorEl(null)
    }
  }

  const getIconByFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
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

  const renderDateHeader = useMemo(
    () => (date: string) => {
      const today = moment().startOf('day')
      const yesterday = moment().subtract(1, 'days').startOf('day')

      if (moment(date).isSame(today, 'day')) {
        return t('report_module.today') + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      } else if (moment(date).isSame(yesterday, 'day')) {
        return t('report_module.yesterday') + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      } else {
        return Utility.formatDisplayDate(Utility.convertUTCToLocal(date))
      }
    },
    []
  )

  const handleClick = (event: React.MouseEvent<HTMLElement>, media: MediaItem) => {
    setAnchorEl(event.currentTarget)
    setSelectedId(media)
  }

  const handleClose = () => setAnchorEl(null)

  const handleScroll = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }, [hasMore, loading])

  return (
    <>
      {loading && filePreviews.length === 0 ? (
        <FallbackSpinner sx={{}} />
      ) : (
        <>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Card sx={{ p: 4, mb: 6 }}>
                <Grid container spacing={2} direction='column' sx={{ alignItems: 'flex-start' }}>
                  <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
                    <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Grid>
                        <Typography
                          variant='h6'
                          gutterBottom
                          sx={{ display: 'flex', alignItems: 'center', margin: '10px 0', fontWeight: 700 }}
                        >
                          {t('media')}
                        </Typography>
                      </Grid>
                      <Grid sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button
                          size='large'
                          variant='outlined'
                          sx={{ color: theme.palette.customColors.neutralSecondary, cursor: 'pointer' }}
                          {...getRootProps()}
                          disabled={btnLoader}
                        >
                          {btnLoader ? (
                            <CircularProgress
                              size={20}
                              sx={{ color: theme.palette.customColors.neutralSecondary, mr: 1 }}
                            />
                          ) : (
                            <Icon icon='ic:outline-file-upload' />
                          )}
                          &nbsp; {t('upload_file')}
                          <input {...getInputProps()} />
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
                    <Button
                      size='large'
                      variant='outlined'
                      fullWidth
                      sx={{ color: theme.palette.customColors.neutralSecondary, cursor: 'pointer', mt: 2 }}
                      {...getRootProps()}
                      disabled={btnLoader}
                    >
                      {btnLoader ? (
                        <CircularProgress
                          size={20}
                          sx={{ color: theme.palette.customColors.neutralSecondary, mr: 1 }}
                        />
                      ) : (
                        <Icon icon='ic:outline-file-upload' />
                      )}
                      &nbsp; Upload File
                      <input {...getInputProps()} />
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              <InfiniteScroll
                dataLength={filePreviews.length}
                next={handleScroll}
                hasMore={hasMore}
                loader={<CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
                style={{ overflow: 'hidden' }}
                endMessage={
                  <Typography variant='body2' color='textSecondary' align='center' sx={{ mt: 6 }}>
                    {t('report_module.no_more_media')}
                  </Typography>
                }
              >
                <Grid container spacing={4}>
                  {filePreviews.map((group, groupIndex) => (
                    <Grid key={groupIndex} size={{ xs: 12 }}>
                      <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', margin: '16px 0', fontWeight: 700 }}
                      >
                        <Divider sx={{ width: 30, marginRight: '5px' }} orientation='horizontal' />
                        <EventIcon sx={{ marginRight: '5px' }} />
                        {renderDateHeader(group.date)}
                        <Divider sx={{ flexGrow: 1, marginLeft: '5px' }} orientation='horizontal' />
                      </Typography>

                      <Grid container spacing={6}>
                        {group.media.map((media, mediaIndex) => (
                          <React.Fragment key={mediaIndex}>
                            <Grid size={{ xs: 12, md: 4, sm: 6, lg: 3 }}>
                              <Card sx={{ position: 'relative', height: '100%' }}>
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
                                        maxWidth: 180
                                      }}
                                    >
                                      {media?.file_original_name}
                                    </Typography>
                                  </Tooltip>
                                </CardContent>

                                {media?.file_type && (
                                  <>
                                    {media.file_type.match(/^image\/(jpeg|jpg|gif|png|svg)$/) ? (
                                      <CardMedia
                                        component='img'
                                        height='160'
                                        image={media.user_media}
                                        alt={media.file_original_name}
                                        sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
                                      />
                                    ) : media.file_type.match(/^video\/(mp4|mov)$/) ? (
                                      <CardMedia
                                        component='video'
                                        controls
                                        height='160'
                                        src={media.user_media}
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
                                          bgcolor: getIconByFileType(media.file_original_name)?.bgColor,
                                          m: 5
                                        }}
                                      >
                                        {getIconByFileType(media.file_original_name)?.icon && (
                                          <Image
                                            src={getIconByFileType(media.file_original_name)!.icon!}
                                            alt=''
                                            width={80}
                                            height={80}
                                          />
                                        )}
                                      </Box>
                                    )}
                                  </>
                                )}

                                <IconButton
                                  aria-label='more'
                                  aria-controls='long-menu'
                                  aria-haspopup='true'
                                  sx={{ position: 'absolute', top: 12, right: 4, cursor: 'pointer' }}
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
            <MenuItem onClick={handleDownload}>{t('download')}</MenuItem>
            <MenuItem onClick={handleDelete}>{t('delete')}</MenuItem>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
                <Box
                  sx={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }}
                >
                  <Icon width='70px' height='70px' color={theme.palette.customColors.Tertiary} icon='mdi:delete' />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                    {t('report_module.delete_media_confirm')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                  <Button
                    disabled={btnLoader}
                    onClick={() => setIsModalOpenDelete(false)}
                    variant='outlined'
                    sx={{ color: 'gray', width: '45%' }}
                  >
                    {t('cancel')}
                  </Button>
                  <LoadingButton
                    loading={btnLoader}
                    size='large'
                    variant='contained'
                    sx={{ width: '45%' }}
                    onClick={confirmDeleteAction}
                  >
                    {t('delete')}
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
