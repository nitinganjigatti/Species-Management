import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Modal,
  Paper,
  Skeleton,
  TextField,
  Typography,
  useTheme
} from '@mui/material'
import React, { useEffect, useState, useCallback } from 'react'
import { styled, alpha } from '@mui/material/styles'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import { timelineOppositeContentClasses } from '@mui/lab'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import Utility from 'src/utility'
import {
  getIncomingNecropsyTransferSummary,
  createIncomingNecropsySummaryComment,
  getIncomingNecropsyBtnStatus,
  acceptNecropsyTransfer,
  getIncomingNecropsyChecklistDetails,
  getTransferAnimalList
} from 'src/lib/api/necropsy'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import TransferPassQRCard from 'src/components/necropsy/TransferPassQRCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import Toaster from '../Toaster'

const groupCommentsByDate = comments => {
  const grouped = {}
  comments?.forEach(item => {
    const date = item?.commented_on?.split(' ')?.[0]
    if (!grouped[date]) {
      grouped[date] = { date: item?.commented_on, entries: [] }
    }
    grouped[date].entries.push(item)
  })

  return Object.values(grouped)
}

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
  backgroundColor: theme.palette.customColors.Background,
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))

const IncomingNecropsyDrawer = ({ open, onClose, transferId, onAcceptSuccess }) => {
  const theme = useTheme()

  const [necropsyData, setNecropsyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [openQRDialog, setOpenQRDialog] = useState(false)
  const [qrDialogData, setQRDialogData] = useState(null)
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [btnStatusData, setBtnStatusData] = useState(null)
  const [btnStatusLoading, setBtnStatusLoading] = useState(false)
  const [checklistComments, setChecklistComments] = useState([])
  const [showChecklistComment, setShowChecklistComment] = useState(false)
  const [showAnimalListDrawer, setShowAnimalListDrawer] = useState(false)
  const [animalList, setAnimalList] = useState([])
  const [animalListLoading, setAnimalListLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  const fetchNecropsyDetails = async () => {
    if (!transferId) return

    setLoading(true)
    try {
      const response = await getIncomingNecropsyTransferSummary({ transfer_id: transferId })
      if (response?.success) {
        setNecropsyData(response?.data)
      }
    } catch (error) {
      console.error('Error fetching incoming necropsy details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBtnStatus = async () => {
    if (!transferId) return
    setBtnStatusLoading(true)
    try {
      const response = await getIncomingNecropsyBtnStatus(transferId)
      if (response?.success) {
        setBtnStatusData(response?.data)
      }
    } catch (error) {
      console.error('Error fetching button status:', error)
    } finally {
      setBtnStatusLoading(false)
    }
  }

  const fetchChecklistDetails = async () => {
    if (!transferId) return
    try {
      const response = await getIncomingNecropsyChecklistDetails({ entity_type: 'carcass_transfer' }, transferId)
      if (response?.success) {
        setChecklistComments(response?.data?.comments || [])
      }
    } catch (error) {
      console.error('Error fetching checklist details:', error)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setCommentLoading(true)
    try {
      const payload = {
        entity_id: transferId,
        entity_type: 'carcass_transfer',
        content: comment,
        action: 'comment'
      }
      const response = await createIncomingNecropsySummaryComment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Comment added successfully' })
        setComment('')
        fetchNecropsyDetails()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add comment' })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleAcceptNecropsy = async () => {
    if (!transferId) return
    setAcceptLoading(true)
    try {
      const response = await acceptNecropsyTransfer(transferId, { status: 'COMPLETED' })
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Necropsy accepted successfully' })
        onAcceptSuccess?.()
        onClose()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to accept necropsy' })
      }
    } catch (error) {
      console.error('Error accepting necropsy:', error)
      Toaster({ type: 'error', message: 'Failed to accept necropsy' })
    } finally {
      setAcceptLoading(false)
    }
  }

  const fetchAnimalList = useCallback(async () => {
    if (!transferId) return
    setAnimalListLoading(true)
    try {
      const response = await getTransferAnimalList(transferId, { status: 'ALL' })
      if (response?.success) {
        setAnimalList(response?.data?.result || [])
      }
    } catch (error) {
      console.error('Error fetching animal list:', error)
    } finally {
      setAnimalListLoading(false)
    }
  }, [transferId])

  const handleViewAnimals = () => {
    setShowAnimalListDrawer(true)
    fetchAnimalList()
  }

  useEffect(() => {
    if (open && transferId) {
      fetchNecropsyDetails()
      fetchBtnStatus()
      fetchChecklistDetails()
    }
  }, [open, transferId])

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 0
            }
          }
        }}
      >
        {loading ? (
          <>
            <Box
              sx={{
                backgroundColor: theme.palette.customColors?.rusticRed || '#4A0415',
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={140} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                <Skeleton variant='circular' width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              </Box>
              <Skeleton variant='text' width={180} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant='circular' width={16} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton variant='text' width={160} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant='circular' width={16} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton variant='text' width={140} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                </Box>
              </Box>
              <Box
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: 1,
                  p: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant='circular' width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Box>
                    <Skeleton variant='text' width={100} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                    <Skeleton variant='text' width={70} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant='circular' width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton variant='circular' width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Card sx={{ overflow: 'visible' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant='circular' width={24} height={24} />
                    <Skeleton variant='text' width={120} height={22} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                    <Skeleton variant='rounded' width={60} height={60} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant='text' width='60%' height={20} />
                      <Skeleton variant='text' width='40%' height={16} />
                      <Skeleton variant='text' width='30%' height={16} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ overflow: 'visible' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant='circular' width={24} height={24} />
                    <Box>
                      <Skeleton variant='text' width={140} height={22} />
                      <Skeleton variant='text' width={80} height={16} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ overflow: 'visible' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant='circular' width={24} height={24} />
                    <Skeleton variant='text' width={100} height={22} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant='rounded' width='100%' height={40} />
                    <Skeleton variant='circular' width={40} height={40} />
                  </Box>
                  {[1, 2].map(i => (
                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                      <Skeleton variant='text' width='90%' height={18} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant='circular' width={28} height={28} />
                        <Skeleton variant='text' width={100} height={14} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>

            <Box
              sx={{
                p: 5,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper
              }}
            >
              <Skeleton variant='rounded' width='100%' height={48} />
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: theme.palette.customColors?.rusticRed || '#4A0415',
                color: theme.palette.customColors.OnPrimary
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 6, pt: 2, mb: 4 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '20px', color: theme.palette.customColors.OnPrimary }}>
                  {necropsyData?.transfer_details?.transfer_code}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: theme.palette.customColors.OnPrimary }}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>

              <Box sx={{ px: 6, pb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '20px', color: theme.palette.customColors.OnPrimary }}>
                      Carcass Transfer
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnPrimary }}
                      >
                        {necropsyData?.transfer_details?.source_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <img src='/images/line_end_square.svg' alt='line-end-square' />
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnPrimary }}
                      >
                        {necropsyData?.transfer_details?.destination_name}
                      </Typography>
                    </Box>
                  </Box>

                  {necropsyData?.transfer_details?.qr_code_full_path && (
                    <IconButton
                      onClick={() => {
                        setOpenQRDialog(true)
                        setQRDialogData({
                          requestId: necropsyData?.transfer_details?.transfer_code,
                          qrCodeUrl: necropsyData?.transfer_details?.qr_code_full_path,
                          title: 'Transfer Pass',
                          subtitle: 'Transfer Request number'
                        })
                      }}
                      sx={{
                        backgroundColor: theme.palette.customColors.OnPrimary,
                        p: 1,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }
                      }}
                    >
                      <Icon
                        icon='mdi:qrcode'
                        fontSize={40}
                        color={theme.palette.customColors?.rusticRed || '#4A0415'}
                      />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  px: 6,
                  py: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Initiated by
                  </Typography>
                  <UserAvatarDetails
                    user_name={`${necropsyData?.transfer_details?.user_first_name} ${necropsyData?.transfer_details?.user_last_name}`}
                    profile_image={necropsyData?.transfer_details?.user_profile_image}
                    date={necropsyData?.transfer_details?.created_at}
                    show_time
                    size='medium'
                    text_color={theme.palette.customColors.OnPrimary}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {necropsyData?.transfer_details?.user_mobile_number && (
                    <IconButton
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: theme.palette.customColors.OnPrimary,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      }}
                      onClick={() => window.open(`tel:${necropsyData?.transfer_details?.user_mobile_number}`, '_self')}
                    >
                      <Icon icon='mdi:phone' fontSize={20} />
                    </IconButton>
                  )}
                  {necropsyData?.transfer_details?.user_mobile_number && (
                    <IconButton
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: theme.palette.customColors.OnPrimary,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      }}
                    >
                      <Icon icon='mdi:message-text' fontSize={20} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                background: theme.palette.customColors.OnPrimary,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                minHeight: 0,
                p: 6
              }}
            >
              {(() => {
                const animalCount = necropsyData?.total_animal_count || necropsyData?.entity_details?.length || 0

                if (animalCount === 1 && necropsyData?.entity_details?.[0]) {
                  return (
                    <Card sx={{ overflow: 'visible' }}>
                      <CardContent>
                        <Box
                          sx={{
                            background: alpha(
                              theme.palette.customColors?.errorContainer || theme.palette.error.light,
                              0.4
                            ),
                            borderRadius: 1,
                            p: 3
                          }}
                        >
                          <AnimalCard data={necropsyData?.entity_details[0]} />
                        </Box>
                      </CardContent>
                    </Card>
                  )
                }

                return (
                  <Card sx={{ overflow: 'visible' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Icon icon='mdi:arrow-top-right' fontSize={24} />
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '14px',
                                color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                              }}
                            >
                              Transfer
                            </Typography>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: '16px',
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              {animalCount} {animalCount === 1 ? 'Carcass' : 'Carcasses'}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant='text'
                          onClick={handleViewAnimals}
                          sx={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )
              })()}

              <Card sx={{ overflow: 'visible' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: 'space-between',
                      border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                      p: 2,
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Icon icon={'uis:check-circle'} color={theme.palette.success.main} fontSize={24} />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          Transfer Checklist
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                          }}
                        >
                          {necropsyData?.transfer_details?.checked_count}/
                          {necropsyData?.transfer_details?.total_checklist_count} Filled
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ overflow: 'visible' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Icon icon={'hugeicons:comment-01'} />
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Comments
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Add a comment...'
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 0.7,
                          px: 2,
                          py: 1
                        }
                      }}
                    />
                    <IconButton
                      onClick={handleAddComment}
                      disabled={!comment.trim() || commentLoading}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.customColors.OnPrimary,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark
                        },
                        '&.Mui-disabled': {
                          backgroundColor: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled
                        }
                      }}
                    >
                      {commentLoading ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : (
                        <Icon icon='mdi:arrow-right' fontSize={20} />
                      )}
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {necropsyData?.comments_details?.length > 0 ? (
                      necropsyData?.comments_details?.map(item => (
                        <Box
                          key={item?.id}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                            borderRadius: 1,
                            px: 4,
                            py: 2
                          }}
                        >
                          <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                            {item?.comments}
                          </Typography>
                          <UserAvatarDetails
                            user_name={`${item?.user_first_name} ${item?.user_last_name}`}
                            profile_image={item?.user_profile_pic}
                            date={item?.commented_on}
                            show_time
                          />
                        </Box>
                      ))
                    ) : (
                      <NoDataFound />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                width: '100%',
                p: 5,
                borderTop: `1px solid ${theme.palette.divider}`,
                borderRadius: showChecklistComment ? '16px 16px 0 0' : 0,
                backgroundColor:
                  necropsyData?.transfer_details?.transfer_status === 'CANCELED'
                    ? theme.palette.error.light
                    : theme.palette.background.paper,
                zIndex: 1,
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {checklistComments?.length > 0 ? (
                <>
                  <Collapse in={showChecklistComment}>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {groupCommentsByDate(checklistComments)?.map((section, sectionIndex) => (
                        <Box key={`section-${sectionIndex}`}>
                          <StyledSectionHeader>
                            <CalendarTodayIcon
                              sx={{ color: theme.palette.customColors?.OnSurfaceVariant, fontSize: '1.25rem' }}
                            />
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: theme.palette.customColors?.OnSurfaceVariant
                              }}
                            >
                              {Utility.convertUtcToLocalReadableDate(section?.date)}
                            </Typography>
                          </StyledSectionHeader>
                          <StyledTimeline>
                            {section?.entries?.map((item, index) => (
                              <TimelineItem key={item?.id || index} sx={{ minHeight: '4rem' }}>
                                <StyledTimelineOppositeContent>
                                  <Typography
                                    sx={{
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >
                                    {Utility.convertUTCToLocaltime(item?.commented_on)}
                                  </Typography>
                                </StyledTimelineOppositeContent>
                                <TimelineSeparator>
                                  <TimelineConnector
                                    sx={{
                                      visibility: index === 0 ? 'hidden' : 'visible',
                                      minHeight: index === 0 ? 0 : '1rem',
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
                                      visibility: index === section?.entries?.length - 1 ? 'hidden' : 'visible',
                                      minHeight: index === section?.entries?.length - 1 ? 0 : '1rem',
                                      backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                                      width: '1.5px'
                                    }}
                                  />
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{
                                      backgroundColor: theme.palette.customColors.Background,
                                      borderRadius: 1,
                                      px: 3,
                                      py: 2,
                                      ml: 1,
                                      flex: 1
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: theme.palette.customColors.OnSurfaceVariant
                                      }}
                                    >
                                      {item?.comments}
                                    </Typography>
                                    {item?.dump?.loaded_count != null && item?.dump?.total_animal_count != null && (
                                      <Typography
                                        sx={{
                                          fontSize: '1rem',
                                          fontWeight: 700,
                                          color: theme.palette.success.main,
                                          mt: 0.5
                                        }}
                                      >
                                        {item.dump.loaded_count}/{item.dump.total_animal_count}
                                      </Typography>
                                    )}
                                  </Box>
                                </TimelineContent>
                              </TimelineItem>
                            ))}
                          </StyledTimeline>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography
                      sx={{ fontSize: '20px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {checklistComments?.[0]?.comments}
                    </Typography>
                    <Button onClick={() => setShowChecklistComment(prev => !prev)}>
                      {showChecklistComment ? 'Hide' : 'See All'}
                    </Button>
                  </Box>
                </>
              ) : null}
              {necropsyData?.transfer_details?.transfer_status === 'CANCELED' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Icon icon={'mdi:cancel-bold'} color={theme.palette.customColors.OnPrimary} />
                  <Typography
                    sx={{ fontWeight: 600, color: theme.palette.customColors.OnPrimary, alignSelf: 'center' }}
                  >
                    Cancelled
                  </Typography>
                </Box>
              ) : (
                <Button
                  variant='contained'
                  fullWidth
                  color='primary'
                  disabled={btnStatusLoading || acceptLoading || btnStatusData?.show_accept_button === 0}
                  onClick={handleAcceptNecropsy}
                  sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors?.rusticRed || '#4A0415' }}
                >
                  {btnStatusLoading || acceptLoading ? <CircularProgress size={24} /> : 'ACCEPT NECROPSY'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Drawer>
      {openQRDialog && (
        <TransferPassQRCard
          open={openQRDialog}
          handleClose={() => {
            setOpenQRDialog(false)
            setQRDialogData(null)
          }}
          transferData={qrDialogData}
        />
      )}

      <Modal
        open={showAnimalListDrawer}
        onClose={() => setShowAnimalListDrawer(false)}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end'
        }}
      >
        <Paper
          sx={{
            width: { xs: '100%', sm: 560 },
            maxHeight: '80vh',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            borderBottomLeftRadius: '16px',
            boxShadow: 24,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 4,
              flexShrink: 0
            }}
          >
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              Transfer Carcass List
            </Typography>
            <IconButton onClick={() => setShowAnimalListDrawer(false)} size='small'>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
            {animalListLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                    <Skeleton variant='rounded' width={60} height={60} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant='text' width='60%' height={20} />
                      <Skeleton variant='text' width='40%' height={16} />
                      <Skeleton variant='text' width='30%' height={16} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : animalList.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>No animals found</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {animalList.map((animal, index) => (
                  <Box
                    key={animal.animal_id || index}
                    sx={{
                      background: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50],
                      borderRadius: 1,
                      p: 3
                    }}
                  >
                    <AnimalCard data={animal} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>
    </>
  )
}

export default IncomingNecropsyDrawer
