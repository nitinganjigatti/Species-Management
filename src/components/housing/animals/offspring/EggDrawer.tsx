import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useTheme,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  ClickAwayListener,
  Collapse,
  TextField,
  InputAdornment,
  Grid
} from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import { timelineOppositeContentClasses } from '@mui/lab'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter'

import FilePreviewCard from 'src/views/utility/NewMediaCard'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import NoDataFound from 'src/views/utility/NoDataFound'
import Utility from 'src/utility'
import { StyledTypographyProps, AnimalItem, LitterItem } from 'src/types/housing/animalsOffspring'
import {
  getEggDetails,
  getEggParentDetails,
  getEggHistory,
  eggAddComment,
  eggUploadImages,
  getEggMediaList
} from 'src/lib/api/housing'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AnimalCard from 'src/views/utility/AnimalCard'
import Toaster from 'src/components/Toaster'
import { useQuery } from '@tanstack/react-query'
import EggStatusDrawer from './EggStatusDrawer'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface EggDrawerProps {
  open: boolean
  onClose: () => void
  eggDetails: AnimalItem | null
}

const EggDrawer = ({ open, onClose, eggDetails }: EggDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useSafeRouter()

  const [isEggFetching, setIsEggFetching] = useState<boolean>(false)
  const [eggData, setEggData] = useState<any | null>(null)
  const [showChecklistComment, setShowChecklistComment] = useState(false)
  const [groupedChecklistComments, setGroupedChecklistComments] = useState<any[]>([])
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [isParentOpen, setIsParentOpen] = useState(false)
  const [eggStatusOpen, setEggStatusOpen] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showAllMedia, setShowAllMedia] = useState(false)
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<any | null>(null)
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false)

  const { control, watch, reset } = useForm({
    defaultValues: {
      images: []
    }
  })

  const images = watch('images')

  const fetchEggDetails = async () => {
    setIsEggFetching(true)
    try {
      const response = await getEggDetails({
        eggId: Number(eggDetails?.egg_id)
      })
      if (response?.success) {
        const result = response.data
        setEggData(result)
      } else {
        setEggData([])
      }
    } catch (error: any) {
      console.error(error?.message)
      setEggData([])
    } finally {
      setIsEggFetching(false)
    }
  }

  // Fetch egg parent details
  const { data: eggParentData, isFetching: isEggParentFetching } = useQuery({
    queryKey: ['egg-parent-details', eggDetails?.egg_id],
    queryFn: () =>
      getEggParentDetails({
        eggId: Number(eggDetails?.egg_id)
      }),
    enabled: !!eggDetails?.egg_id && isParentOpen,
    select: res => (res?.success ? res.data : null) as any
  })

  // Fetch egg history
  const { data: eggHistoryData, isFetching: isEggHistoryFetching } = useQuery({
    queryKey: ['egg-history', eggDetails?.egg_id],
    queryFn: () => getEggHistory({ eggId: Number(eggDetails?.egg_id) }),
    enabled: !!eggDetails?.egg_id && showChecklistComment,
    select: res => (res?.success ? res.data : null) as any
  })

  // Adds a comment to the transfer
  const handleAddComment = async (): Promise<void> => {
    if (!comment.trim()) return

    setCommentLoading(true)
    try {
      const payload = {
        egg_id: eggDetails?.egg_id,
        comments: comment
      }
      const response = await eggAddComment(payload as any)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Comment added successfully' })
        setComment('')
        fetchEggDetails()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add comment' })
      }
    } catch (error: any) {
      console.error('Error adding comment:', error?.message)
    } finally {
      setCommentLoading(false)
    }
  }

  // Upload egg images
  const handleUploadImages = async () => {
    if (!images || images.length === 0) return

    try {
      const cleanedFiles = images.filter((file: any) => file instanceof File)

      const payload = {
        egg_id: eggDetails?.egg_id,
        egg_attachment: cleanedFiles
      }

      const response = await eggUploadImages(payload as any)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Images uploaded successfully' })
        fetchEggDetails()
        setShowImageUpload(false)
        reset({ images: [] }) // ✅ clear after upload
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to upload images' })
      }
    } catch (error: any) {
      console.error('Error uploading images:', error?.message)
    }
  }

  // Fetch egg parent details
  const { data: eggMediaData, isFetching: isEggMediaFetching } = useQuery({
    queryKey: ['egg-media-details', eggDetails?.egg_id],
    queryFn: () =>
      getEggMediaList({
        ref_id: Number(eggDetails?.egg_id),
        ref_type: 'egg'
      }),
    enabled: !!eggDetails?.egg_id,
    select: res => (res?.success ? res.data : null) as any
  })
  console.log('eggMediaData', eggMediaData)
  const handleEggStatusClose = () => {
    setEggStatusOpen(false)
  }
  const renderInfoItem = (label: string, value?: string | number | null) => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <StyledTypography color={theme.palette.customColors.secondaryBg} fontSize={'12px'}>
        {label}
      </StyledTypography>

      <StyledTypography fontWeight={500} fontSize={'14px'}>
        {value || '-'}
      </StyledTypography>
    </Box>
  )
  const getDaysFromToday = (date: string) => {
    const today = new Date()
    const givenDate = new Date(date)

    const diffTime = today.getTime() - givenDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    return diffDays
  }

  useEffect(() => {
    fetchEggDetails()
  }, [eggDetails?.egg_id])

  const mediaList = eggMediaData?.result || []

  const visibleMedia = showAllMedia ? mediaList : mediaList.slice(0, 4)

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', 562] }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            px: 4,
            py: 6,
            backgroundImage: `
              url('/icons/egg_module_icons/defaultEgg.png'),
              linear-gradient(180deg, #1BC5BD 0%, #0F5B63 100%)
            `,
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundPosition: 'right center, center',
            backgroundSize: '100% auto, cover',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 6
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.customColors.OnPrimary, p: 0 }}>
                <Icon icon='mdi:arrow-left' fontSize={24} />
              </IconButton>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnPrimary }}>
                {t('animals_module.egg_details')}
              </Typography>
            </Box>
            <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.customColors.OnPrimary }}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: 3,
              backgroundColor: alpha(theme.palette.customColors.deepDark, 0.3),
              borderRadius: '4px',
              width: 'fit-content',
              minWidth: '180px',
              backdropFilter: 'blur(4px)',
              border: `1px solid ${alpha(theme.palette.customColors.OnPrimary, 0.1)}`
            }}
          >
            <StyledTypography fontSize='14px' fontWeight={500} color={theme.palette.customColors.OnPrimary}>
              {eggData?.egg_condition}
            </StyledTypography>
            <StyledTypography fontSize='24px' fontWeight={600} color={theme.palette.customColors.OnPrimary}>
              {eggData?.egg_code}
            </StyledTypography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
            <StyledTypography fontWeight={600} color={theme.palette.customColors.OnPrimary}>
              {eggData?.default_common_name}
            </StyledTypography>
            <StyledTypography fontSize='14px' fontWeight={400} color={alpha(theme.palette.customColors.OnPrimary, 0.8)}>
              {eggData?.complete_name}
            </StyledTypography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            cursor: 'pointer',
            my: 4,
            mx: 4,
            gap: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: theme.palette.customColors.antzNotes,
              p: 4,
              borderRadius: 1,
              gap: 4
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                borderRadius: '4px',
                p: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <img src='/icons/egg_module_icons/eggVectorImage.svg' alt='egg' />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography>
                {' '}
                <b>{getDaysFromToday(eggData?.collection_date)}</b> {t('animals_module.day')}
              </Typography>
              <Typography>{Utility.convertUtcToLocalReadableDate(eggData?.created_at)}</Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              backgroundColor: theme.palette.customColors.displaybgPrimary,
              p: 4,
              borderRadius: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <Box
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '4px',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <img src='/icons/egg_module_icons/golden-egg.svg' alt='egg' style={{ width: '24px', height: '24px' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <StyledTypography fontWeight={600} fontSize={'16px'}>
                  {eggData?.egg_status}
                </StyledTypography>
                <StyledTypography fontSize={'14px'}>{eggData?.egg_state}</StyledTypography>
              </Box>
            </Box>

            <Button
              sx={{
                color: theme.palette.customColors.addPrimary,
                textTransform: 'none',
                fontWeight: 600
              }}
              onClick={() => setEggStatusOpen(true)}
            >
              {t('animals_module.change')}
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.displaybgPrimary,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <Card sx={{ p: 4, boxShadow: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Accordion
              onChange={(_, expanded) => setIsParentOpen(expanded)}
              sx={{
                boxShadow: 0,
                '&:before': { display: 'none' },
                m: 0
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                aria-controls='panel1-content'
                id='panel1-header'
                sx={{
                  p: 0,
                  minHeight: 'unset',
                  '& .MuiAccordionSummary-content': {
                    m: 0
                  }
                }}
              >
                <StyledTypography fontSize={'18px'} fontWeight={500}>
                  {t('animals_module.found_details')}
                </StyledTypography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isEggParentFetching ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  eggParentData?.parent_list?.mother_list?.[0] && (
                    <Box
                      sx={{ border: `1px solid ${theme.palette.customColors?.customTableBorderBg}`, borderRadius: 1 }}
                    >
                      <Box
                        sx={{
                          backgroundColor: theme.palette.customColors.displaybgPrimary,
                          borderRadius: '8px 8px 0 0',
                          p: 3
                        }}
                      >
                        <StyledTypography fontWeight={600}>{t('animals_module.mother')}</StyledTypography>
                      </Box>
                      <Box sx={{ p: 3 }}>
                        <AnimalCard data={eggParentData?.parent_list?.mother_list?.[0]} />
                      </Box>
                    </Box>
                  )
                )}
                {eggParentData?.parent_list?.father_list?.[0] && (
                  <Box sx={{ border: `1px solid ${theme.palette.customColors?.customTableBorderBg}`, borderRadius: 1 }}>
                    <Box
                      sx={{
                        backgroundColor: theme.palette.customColors.displaybgPrimary,
                        borderRadius: '8px 8px 0 0',
                        p: 3
                      }}
                    >
                      <StyledTypography fontWeight={600}>{t('animals_module.father')}</StyledTypography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <AnimalCard data={eggParentData?.parent_list?.father_list?.[0]} />
                    </Box>
                  </Box>
                )}

                <Grid container spacing={4} mt={4}>
                  <Grid size={{ xs: 6 }}>{renderInfoItem(t('housing_module.site'), (eggParentData as any)?.site_name)}</Grid>
                  <Grid size={{ xs: 6 }}>{renderInfoItem(t('section'), (eggParentData as any)?.section_name)}</Grid>
                  <Grid size={{ xs: 6 }}>
                    {renderInfoItem(t('housing_module.enclosure'), (eggParentData as any)?.user_enclosure_name)}
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    {renderInfoItem(
                      t('animals_module.collected_on'),
                      (eggParentData as any)?.collection_date
                        ? Utility.convertUtcToLocalReadableDate((eggParentData as any)?.collection_date)
                        : 'NA'
                    )}
                  </Grid>
                  <Grid size={{ xs: 6 }}>{renderInfoItem(t('animals_module.clutch_no'), (eggParentData as any)?.clutch_number)}</Grid>
                  <Grid size={{ xs: 6 }}>
                    {renderInfoItem(
                      t('animals_module.lay_date'),
                      (eggParentData as any)?.lay_date
                        ? Utility.convertUtcToLocalReadableDate((eggParentData as any)?.lay_date)
                        : 'NA'
                    )}
                  </Grid>
                  <Grid size={{ xs: 6 }}>{renderInfoItem(t('animals_module.collected_by'), (eggParentData as any)?.collected_by)}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>
          <Card sx={{ p: 4, boxShadow: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ClickAwayListener onClickAway={() => setShowChecklistComment(false)}>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StyledTypography fontWeight={500} color={theme.palette.customColors?.OnPrimaryContainer}>
                        {t('animals_module.egg_journey')} -
                      </StyledTypography>
                      <StyledTypography color={theme.palette.customColors.secondaryBg}>{t('animals_module.current_stage')}</StyledTypography>
                    </Box>
                    <Button
                      onClick={() => setShowChecklistComment(prev => !prev)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {showChecklistComment ? t('animals_module.hide') : t('animals_module.view_all')}
                    </Button>
                  </Box>
                  {isEggHistoryFetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      {!showChecklistComment && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                          <Box
                            sx={{
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              border: `1px solid ${theme.palette.customColors?.OnPrimaryContainer}`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <CheckCircleIcon
                              sx={{
                                color: theme.palette.customColors?.OnPrimaryContainer,
                                fontSize: '1.5rem'
                              }}
                            />
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: theme.palette.customColors?.Background,
                              borderRadius: '4px',
                              px: 3,
                              py: 2,
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1
                            }}
                          >
                            <StyledTypography fontWeight={600} color={theme.palette.error.OnPrimaryContainer}>
                              {eggData?.activity_log?.[0]?.action.split('_').join(' ')}
                            </StyledTypography>
                            <StyledTypography fontSize={'12px'}>
                              {Utility.convertUtcToLocalReadableDate(eggData?.activity_log?.[0]?.created_at)}{' '}
                              <span>&bull;</span>{' '}
                              {Utility.convertUTCToLocaltime(eggData?.activity_log?.[0]?.created_at)}
                            </StyledTypography>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
                <Collapse in={showChecklistComment}>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                    {eggHistoryData?.result?.map((section: any, sectionIndex: number) => (
                      <Box key={`section-${sectionIndex}`}>
                        <StyledTimeline>
                          <TimelineItem
                            key={section?.id || sectionIndex}
                            sx={{ minHeight: '4rem', cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedTimelineItem(section)
                              setStatusDrawerOpen(true)
                            }}
                          >
                            {' '}
                            <TimelineSeparator>
                              <TimelineConnector
                                sx={{
                                  visibility: sectionIndex === 0 ? 'hidden' : 'visible',
                                  minHeight: sectionIndex === 0 ? 0 : '1rem',
                                  backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                                  width: '1.5px'
                                }}
                              />
                              <Box
                                sx={{
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  border: `1px solid ${theme.palette.customColors?.OnPrimaryContainer}`,
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}
                              >
                                <CheckCircleIcon
                                  sx={{
                                    color: theme.palette.customColors?.OnPrimaryContainer,
                                    fontSize: '1.5rem'
                                  }}
                                />
                              </Box>
                              <TimelineConnector
                                sx={{
                                  visibility:
                                    sectionIndex === eggHistoryData?.result?.length - 1 ? 'hidden' : 'visible',
                                  minHeight: sectionIndex === eggHistoryData?.result?.length - 1 ? 0 : '1rem',
                                  backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                                  width: '1.5px'
                                }}
                              />
                            </TimelineSeparator>
                            <TimelineContent sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  backgroundColor:
                                    sectionIndex === 0
                                      ? theme.palette.customColors.OnPrimaryContainer
                                      : theme.palette.customColors?.Background,
                                  borderRadius: '4px',
                                  px: 3,
                                  py: 2,
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1
                                }}
                              >
                                <StyledTypography
                                  fontWeight={600}
                                  color={
                                    sectionIndex === 0
                                      ? theme.palette.error.contrastText
                                      : theme.palette.customColors?.OnPrimaryContainer
                                  }
                                >
                                  {section?.action.split('_').join(' ')}
                                </StyledTypography>
                                <StyledTypography
                                  fontSize={'12px'}
                                  color={sectionIndex === 0 ? theme.palette.error.contrastText : undefined}
                                >
                                  {Utility.convertUtcToLocalReadableDate(section?.created_at)} <span>&bull;</span>{' '}
                                  {Utility.convertUTCToLocaltime(section?.created_at)}
                                </StyledTypography>
                              </Box>
                            </TimelineContent>
                          </TimelineItem>
                        </StyledTimeline>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            </ClickAwayListener>
          </Card>
          <Card sx={{ p: 4, boxShadow: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StyledTypography fontWeight={500} color={theme.palette.customColors?.OnPrimaryContainer}>
                {t('animals_module.image_gallery')}
              </StyledTypography>
              <Button
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
                onClick={() => {
                  setShowImageUpload(prev => {
                    if (prev) {
                      reset({ images: [] })
                    }
                    return !prev
                  })
                }}
              >
                {showImageUpload ? (
                  <>
                    {/* <Icon icon='mdi:close' fontSize={18} /> */}
                    {t('cancel')}
                  </>
                ) : (
                  <>
                    {/* <Icon icon='mdi:plus' fontSize={18} /> */}
                    {t('add')}
                  </>
                )}
              </Button>
            </Box>
            {showImageUpload && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ControlledMultiFileUpload
                  control={control}
                  name='images'
                  label={t('upload_images') as string}
                  acceptedFileTypes='images'
                  preview
                  previewPlacement='top'
                />
                <Button variant='contained' onClick={handleUploadImages} disabled={!images || images.length === 0}>
                  {t('upload')}
                </Button>
              </Box>
            )}
            <Grid container spacing={3}>
              {visibleMedia?.map((attachment: any, index: number) => (
                <Grid key={attachment?.id || index} size={{ xs: 12, sm: 6 }}>
                  <FilePreviewCard
                    fileUrl={attachment?.file_name}
                    fileName={attachment?.file_original_name}
                    user={{
                      created_at: attachment?.created_at,
                      user_profile: {
                        user_full_name: attachment?.user_full_name,
                        user_profile_pic: attachment?.user_profile_pic
                      }
                    }}
                    showTitle={true}
                  />
                </Grid>
              ))}
            </Grid>
            {mediaList.length > 4 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                  onClick={() => setShowAllMedia(prev => !prev)}
                >
                  {showAllMedia ? (
                    <>
                      <Icon icon='mdi:chevron-up' fontSize={20} />
                      {t('hide')}
                    </>
                  ) : (
                    <>
                      <Icon icon='mdi:chevron-down' fontSize={20} />
                      {t('view_more')}
                    </>
                  )}
                </Button>
              </Box>
            )}
          </Card>
          <Card sx={{ p: 4, boxShadow: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Comment Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon
                  icon={'mdi-light:message-text'}
                  color={theme.palette.customColors?.OnSurfaceVariant}
                  fontSize={20}
                />

                <StyledTypography fontSize={'14px'} fontWeight={500}>
                  {t('comments')}
                </StyledTypography>
              </Box>

              {/* Comment Input */}
              <TextField
                fullWidth
                size='small'
                placeholder={t('add_your_comment') as string}
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0.4,
                    p: 2
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={handleAddComment}
                        disabled={!comment.trim() || commentLoading}
                        size='small'
                        sx={{
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          '&:hover': { backgroundColor: 'transparent' }
                        }}
                      >
                        {commentLoading ? (
                          <CircularProgress size={18} />
                        ) : (
                          <Icon icon='mdi:send-outline' fontSize={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Comments List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {eggData?.comments_data && eggData?.comments_data?.length > 0 ? (
                  eggData?.comments_data?.map((item: any) => (
                    <Box
                      key={item?.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        backgroundColor: theme.palette.customColors?.mdAntzNeutral,
                        borderRadius: 0.4,
                        px: 4,
                        py: 2
                      }}
                    >
                      <StyledTypography fontSize={'14px'}>{item?.comments}</StyledTypography>

                      <UserAvatarDetails
                        user_name={item?.created_by}
                        profile_image={item?.user_profile_pic}
                        date={item?.created_at}
                        show_time
                        size='medium'
                      />
                    </Box>
                  ))
                ) : (
                  <NoDataFound />
                )}
              </Box>
            </Box>
          </Card>
        </Box>
      </Drawer>
      {eggStatusOpen && (
        <EggStatusDrawer
          open={eggStatusOpen}
          onClose={handleEggStatusClose}
          eggDetails={eggData}
          refetch={fetchEggDetails}
        />
      )}
      {statusDrawerOpen && (
        <Drawer
          anchor='right'
          open={statusDrawerOpen}
          onClose={() => setStatusDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: ['100%', '562px'],
              height: 'auto',
              position: 'fixed',
              right: 0,
              bottom: 0,
              top: 'auto',
              borderTopLeftRadius: 16
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.customColors?.mdAntzNeutral}`,
                p: 4
              }}
            >
              <StyledTypography fontSize={'18px'} fontWeight={600}>
                {t('animals_module.egg_status')}
              </StyledTypography>
              <IconButton onClick={() => setStatusDrawerOpen(false)}>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  backgroundColor: '#E6F0F1',
                  borderRadius: '4px',
                  p: 3
                }}
              >
                <StyledTypography fontSize={'16px'} fontWeight={600}>
                  {selectedTimelineItem?.action?.split('_').join(' ')}
                </StyledTypography>
                <StyledTypography fontSize={'12px'}>
                  {t('animals_module.reported_on')} {Utility.convertUtcToLocalReadableDate(selectedTimelineItem?.created_at)} •{' '}
                  {Utility.convertUTCToLocaltime(selectedTimelineItem?.created_at)}
                </StyledTypography>
              </Box>

              <Box
                sx={{
                  backgroundColor: '#FFF3CD',
                  borderRadius: '4px',
                  p: 3
                }}
              >
                <StyledTypography fontWeight={600}>{t('notes')}</StyledTypography>
                <StyledTypography>{selectedTimelineItem?.comments}</StyledTypography>
              </Box>
            </Box>
          </Box>
        </Drawer>
      )}
    </>
  )
}

export default React.memo(EggDrawer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))
const StyledTimeline = styled(Timeline)(() => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: 0,
    minWidth: '5rem',
    padding: 0
  },
  margin: 0,
  padding: '0 1rem',
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
}))

const StyledTimelineOppositeContent = styled(TimelineOppositeContent)(() => ({
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center'
}))

const StyledSectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: (theme as any).palette.customColors?.Background,
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))
