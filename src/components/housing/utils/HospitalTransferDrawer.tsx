import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Grid,
  ClickAwayListener
} from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import { timelineOppositeContentClasses } from '@mui/lab'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import NoDataFound from 'src/views/utility/NoDataFound'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import AnimalCard from 'src/views/utility/AnimalCard'

import TransferPassQRCard from 'src/components/necropsy/TransferPassQRCard'
import TransferChecklistDrawer from 'src/components/necropsy/TransferChecklistDrawer'
import { getPatientDetailsByTransferId } from 'src/lib/api/hospital/incomingPatient'
import { createIncomingNecropsySummaryComment, getIncomingNecropsyChecklistDetails } from 'src/lib/api/necropsy'

import type {
  StyledTypographyProps,
  QRDialogData,
  HospitalTransferDrawerProps,
  HospitalTransferData,
  ChecklistComment,
  GroupedChecklistSection,
  HospitalTransferCommentPayload
} from 'src/types/housing/hospitalTransfer'

// Groups checklist comments by date for timeline display
const groupCommentsByDate = (comments: ChecklistComment[]): GroupedChecklistSection[] => {
  const grouped: Record<string, GroupedChecklistSection> = {}
  comments?.forEach(item => {
    const date = item?.commented_on?.split(' ')?.[0]
    if (date) {
      if (!grouped[date]) {
        grouped[date] = { date: item?.commented_on, entries: [] }
      }
      grouped[date].entries.push(item)
    }
  })

  return Object.values(grouped)
}

const HospitalTransferDrawer: React.FC<HospitalTransferDrawerProps> = ({ open, onClose, transferId, showQRCode }) => {
  const theme = useTheme() as any
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)
  const [hospitalTransferData, setHospitalTransferData] = useState<HospitalTransferData | null>(null)
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [checklistComments, setChecklistComments] = useState<ChecklistComment[]>([])
  const [showChecklistComment, setShowChecklistComment] = useState<boolean>(false)
  const [showChecklistDrawer, setShowChecklistDrawer] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [openQRDialog, setOpenQRDialog] = useState<boolean>(false)
  const [qrDialogData, setQRDialogData] = useState<QRDialogData | null>(null)

  // Fetch transfer details and checklist comments simultaneously
  const fetchAllDrawerData = useCallback(async (): Promise<void> => {
    if (!transferId) return

    setLoading(true)
    try {
      const [detailsRes, checklistRes] = await Promise.all([
        getPatientDetailsByTransferId({ transfer_id: transferId }),
        getIncomingNecropsyChecklistDetails({ entity_type: 'hospital_transfer' }, transferId as number)
      ])

      if (detailsRes?.success) {
        setHospitalTransferData(detailsRes?.data as HospitalTransferData)
      }
      if (checklistRes?.success) {
        setChecklistComments(checklistRes?.data?.comments as ChecklistComment[])
      }
    } catch (error: any) {
      console.error('Error fetching drawer data:', error?.message)
    } finally {
      setLoading(false)
    }
  }, [transferId])

  // Adds a comment to the transfer
  const handleAddComment = async (): Promise<void> => {
    if (!comment.trim()) return

    setCommentLoading(true)
    try {
      const payload: HospitalTransferCommentPayload = {
        entity_id: transferId as number,
        entity_type: 'hospital_transfer',
        content: comment,
        action: 'comment'
      }
      const response = await createIncomingNecropsySummaryComment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Comment added successfully' })
        setComment('')
        fetchAllDrawerData()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add comment' })
      }
    } catch (error: any) {
      console.error('Error adding comment:', error?.message)
    } finally {
      setCommentLoading(false)
    }
  }

  // Derived state for transfer status and visibility flags
  const details = hospitalTransferData?.transfer_details
  const isCheckListFilled = details?.activity_status !== 'PENDING' && details?.transfer_type !== 'intra' // Check if checklist is already filled based on activity and transfer type
  const isHospitalSource = details?.source_type !== 'hospital' // Checks if transfer source is not hospital
  const isTransferCancelled = details?.transfer_status === 'CANCELED' // Flag indicating transfer was cancelled
  const isTransferRejected = details?.transfer_status === 'REJECTED' // Flag indicating transfer was rejected

  // Copies mobile number to clipboard
  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Navigate to animal details page when card is clicked
  const handleAnimalClick = (animalId?: number): void => {
    if (animalId) {
      router.push(`/housing/animals/${animalId}`)
    }
  }

  // Memoized grouping of checklist comments for timeline rendering
  const groupedChecklistComments = useMemo(() => groupCommentsByDate(checklistComments), [checklistComments])

  useEffect(() => {
    if (open && transferId) {
      fetchAllDrawerData()
    }
  }, [open, transferId, fetchAllDrawerData])

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
              backgroundColor: theme.palette.customColors?.OnPrimary,
              p: 0
            }
          }
        }}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Header Section */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                color: theme.palette.customColors?.OnPrimary
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
                <StyledTypography fontWeight={500} fontSize={'20px'} color={theme.palette.customColors?.OnPrimary}>
                  {hospitalTransferData?.transfer_details?.transfer_code}
                </StyledTypography>
                <IconButton onClick={onClose} sx={{ color: theme.palette.customColors?.OnPrimary }}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>

              {/* Transfer Locations */}
              <Box sx={{ px: 4, pb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    <StyledTypography fontWeight={500} fontSize={'20px'} color={theme.palette.customColors?.OnPrimary}>
                      Hospitalize Animal
                    </StyledTypography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        width: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                          <StyledTypography fontWeight={500} color={theme.palette.customColors?.OnPrimary}>
                            {hospitalTransferData?.transfer_details?.source_name}
                          </StyledTypography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <img src='/images/line_end_square.svg' alt='line-end-square' />
                          <StyledTypography fontWeight={500} color={theme.palette.customColors?.OnPrimary}>
                            {hospitalTransferData?.transfer_details?.destination_name}
                          </StyledTypography>
                        </Box>
                      </Box>
                      {showQRCode && hospitalTransferData?.transfer_details?.qr_code_full_path && (
                        <IconButton
                          onClick={() => {
                            setOpenQRDialog(true)
                            setQRDialogData({
                              requestId: hospitalTransferData?.transfer_details?.transfer_code,
                              qrCodeUrl: hospitalTransferData?.transfer_details?.qr_code_full_path,
                              title: 'Transfer Pass',
                              subtitle: 'Transfer Request number'
                            })
                          }}
                          sx={{ p: 0 }}
                        >
                          <Icon
                            icon='ic:outline-qr-code-2'
                            fontSize={46}
                            color={theme.palette.customColors?.OnPrimary}
                          />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* User / Contact Information */}
              <Box
                sx={{
                  p: 4,
                  backgroundColor: alpha(theme.palette.customColors?.deepDark || '#000', 0.12),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <StyledTypography fontSize={'12px'} color={alpha(theme.palette.customColors?.OnPrimary, 0.8)}>
                    Initiated by
                  </StyledTypography>
                  <UserAvatarDetails
                    user_name={`${hospitalTransferData?.transfer_details?.user_first_name} ${hospitalTransferData?.transfer_details?.user_last_name}`}
                    profile_image={hospitalTransferData?.transfer_details?.user_profile_image}
                    date={hospitalTransferData?.transfer_details?.created_at}
                    show_time
                    size='medium'
                    text_color={theme.palette.customColors?.OnPrimary}
                  />
                </Box>
                {hospitalTransferData?.transfer_details?.user_mobile_number && (
                  <>
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                      <IconButton
                        sx={{
                          backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.3)', 0.3),
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.5)', 0.5)
                          }
                        }}
                        onClick={() =>
                          window.open(`tel:${hospitalTransferData?.transfer_details?.user_mobile_number}`, '_self')
                        }
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <IconButton
                        sx={{
                          backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.3)', 0.3),
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.customColors?.deepDark || 'rgba(0, 0, 0, 0.5)', 0.5)
                          }
                        }}
                        onClick={() =>
                          window.open(`sms:${hospitalTransferData?.transfer_details?.user_mobile_number}`, '_self')
                        }
                      >
                        <Icon icon='mdi:message-text' fontSize={20} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size='small'
                        onClick={() => setShowMobileNumber(prev => !prev)}
                        sx={{
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnPrimary, 0.1) }
                        }}
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          overflow: 'hidden',
                          maxWidth: showMobileNumber ? '200px' : '0px',
                          opacity: showMobileNumber ? 1 : 0,
                          transition: 'max-width 0.3s ease-in-out, opacity 0.3s ease-in-out'
                        }}
                      >
                        <StyledTypography
                          fontWeight={500}
                          fontSize={'14px'}
                          color={theme.palette.customColors?.OnPrimary}
                        >
                          {hospitalTransferData?.transfer_details?.user_mobile_number}
                        </StyledTypography>
                        <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleCopyNumber(hospitalTransferData?.transfer_details?.user_mobile_number || '')
                            }
                            sx={{
                              color: theme.palette.customColors?.OnPrimary,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.customColors?.OnPrimary, 0.1)
                              }
                            }}
                          >
                            <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                background: theme.palette.customColors?.OnPrimary,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              {/* Selected Animal Card */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 4, py: 3 }}>
                <Icon icon='ph:paw-print' fontSize={24} />
                <StyledTypography fontWeight={600}>Selected Animal</StyledTypography>
              </Box>
              <Box
                onClick={() => handleAnimalClick(hospitalTransferData?.entity_details?.[0]?.animal_id)}
                sx={{
                  background: theme.palette.customColors?.antzSecondaryBg,
                  p: 3,
                  mx: 4,
                  mb: 3,
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
              >
                <AnimalCard data={hospitalTransferData?.entity_details?.[0]} />
              </Box>
              <Divider />

              {/* Transfer Details Grid */}
              <Grid container px={4} py={3} spacing={2}>
                {hospitalTransferData?.transfer_details?.transfer_reference_code && (
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ flexShrink: 0 }}>
                        <Icon
                          icon='solar:heart-pulse-outline'
                          fontSize={24}
                          color={theme.palette.customColors.OnSurfaceVariant}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <StyledTypography fontWeight={600}>Medical ID</StyledTypography>

                        <StyledTypography>
                          {hospitalTransferData?.transfer_details?.transfer_reference_code}
                        </StyledTypography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {hospitalTransferData?.transfer_details?.visit_type && (
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ flexShrink: 0 }}>
                        <Icon
                          icon='mdi:label-outline'
                          fontSize={24}
                          color={theme.palette.customColors?.OnSurfaceVariant}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <StyledTypography fontWeight={600}>Visit Type</StyledTypography>

                        <StyledTypography sx={{ textTransform: 'capitalize' }}>
                          {hospitalTransferData?.transfer_details?.visit_type}
                        </StyledTypography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
              {hospitalTransferData?.transfer_details?.reason_for_transfer && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      px: 4,
                      py: 3
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexShrink: 0 }}>
                        <Icon
                          icon='mdi:help-circle-outline'
                          fontSize={26}
                          color={theme.palette.customColors?.OnSurfaceVariant}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <StyledTypography fontSize={'14px'}>Pupose for visit</StyledTypography>
                        <StyledTypography fontSize={'14px'} fontWeight={500}>
                          {hospitalTransferData?.transfer_details?.reason_for_transfer}
                        </StyledTypography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}

              {/* Transfer Checklist Summary */}
              {isCheckListFilled && isHospitalSource && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 4,
                      py: 3
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Icon icon='icon-park-solid:check-one' fontSize={26} color={theme.palette.primary.main} />

                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <StyledTypography fontSize={'14px'}>Transfer Checklist</StyledTypography>
                        <StyledTypography fontWeight={500}>
                          {hospitalTransferData?.transfer_details?.checked_count}/
                          {hospitalTransferData?.transfer_details?.total_checklist_count} Filled
                        </StyledTypography>
                      </Box>
                    </Box>
                    {(hospitalTransferData?.transfer_details?.checked_count || 0) > 0 && (
                      <Button
                        onClick={() => setShowChecklistDrawer(true)}
                        sx={{
                          fontSize: '14px',
                          color: theme.palette.primary.main,
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </Button>
                    )}
                  </Box>
                </>
              )}

              {/* Attachments Section */}
              {hospitalTransferData?.transfer_attachment && hospitalTransferData?.transfer_attachment?.length > 0 && (
                <>
                  <Divider />

                  <Box sx={{ px: 4, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Icon icon='mdi:attachment' fontSize={20} />
                      <StyledTypography fontWeight={600}>Attachments</StyledTypography>
                    </Box>
                    <Grid container spacing={3}>
                      {hospitalTransferData?.transfer_attachment?.map((attachment, index) => (
                        <Grid key={attachment?.id || index} size={{ xs: 12, sm: 6 }}>
                          <FilePreviewCard
                            fileUrl={attachment?.file || attachment?.url}
                            fileName={attachment?.file_original_name}
                            user={{
                              created_at: attachment?.created_at,
                              user_profile: {
                                user_full_name:
                                  `${attachment?.user_first_name || ''} ${attachment?.user_last_name || ''}` ||
                                  attachment?.user_full_name ||
                                  attachment?.user_name,
                                user_profile_pic: attachment?.user_profile_pic || attachment?.profile_image
                              }
                            }}
                            showTitle={true}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}
              <Divider />

              {/* Comments and Input Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, px: 4, py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Icon
                    icon={'mdi-light:message-text'}
                    color={theme.palette.customColors?.OnSurfaceVariant}
                    fontSize={20}
                  />
                  <StyledTypography fontSize={'14px'} fontWeight={500}>
                    Comments
                  </StyledTypography>
                </Box>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Add your comment'
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
                            '&:hover': {
                              backgroundColor: 'transparent'
                            },
                            '&.Mui-disabled': {
                              color: theme.palette.action.disabled
                            }
                          }}
                        >
                          {commentLoading ? (
                            <CircularProgress size={18} color='inherit' />
                          ) : (
                            <Icon icon='mdi:send-outline' fontSize={20} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {hospitalTransferData?.comments_details && hospitalTransferData.comments_details.length > 0 ? (
                    hospitalTransferData?.comments_details?.map(item => (
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
                          user_name={`${item?.user_first_name} ${item?.user_last_name}`}
                          profile_image={item?.user_profile_pic || ''}
                          date={item?.commented_on}
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
                backgroundColor: isTransferCancelled
                  ? theme.palette.customColors.secondaryBg
                  : isTransferRejected
                  ? theme.palette.error.light
                  : theme.palette.background.paper,
                zIndex: 1,
                boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark || 'rgba(0, 0, 0, 0.06)', 0.1)}`,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {!isTransferCancelled && !isTransferRejected && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 4,
                      backgroundColor: theme.palette.customColors?.OutlineVariant,
                      borderRadius: 2
                    }}
                  />
                </Box>
              )}
              {!isTransferCancelled && !isTransferRejected && checklistComments?.length > 0 ? (
                <ClickAwayListener onClickAway={() => setShowChecklistComment(false)}>
                  <Box>
                    <Collapse in={showChecklistComment}>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                        {groupedChecklistComments?.map((section, sectionIndex) => (
                          <Box key={`section-${sectionIndex}`}>
                            <StyledSectionHeader>
                              <CalendarTodayIcon
                                sx={{ color: theme.palette.customColors?.OnSurfaceVariant, fontSize: '1.25rem' }}
                              />
                              <StyledTypography fontWeight={500}>
                                {Utility.convertUtcToLocalReadableDate(section?.date || '')}
                              </StyledTypography>
                            </StyledSectionHeader>
                            <StyledTimeline>
                              {section?.entries?.map((item, index) => (
                                <TimelineItem key={item?.id || index} sx={{ minHeight: '4rem' }}>
                                  <StyledTimelineOppositeContent>
                                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                                      {Utility.convertUTCToLocaltime(item?.commented_on || '')}
                                    </StyledTypography>
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
                                        backgroundColor: theme.palette.customColors?.Background,
                                        borderRadius: 1,
                                        px: 3,
                                        py: 2,
                                        ml: 1,
                                        flex: 1
                                      }}
                                    >
                                      <StyledTypography fontSize={'14px'} fontWeight={500}>
                                        {item?.comments}
                                      </StyledTypography>
                                      {item?.dump?.loaded_count != null && item?.dump?.total_animal_count != null && (
                                        <StyledTypography
                                          fontWeight={700}
                                          sx={{ color: theme.palette.customColors.OnPrimaryContainer, mt: 0.5 }}
                                        >
                                          {item.dump.loaded_count}/{item.dump.total_animal_count}
                                        </StyledTypography>
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

                    {/* Quick Status */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <StyledTypography fontSize={'14px'} color={theme.palette.customColors?.neutralSecondary}>
                        Current Status <span> &bull; </span>
                        {Utility.AgeConverter(Utility.convertUTCToLocal(checklistComments?.[0]?.commented_on || ''))}
                      </StyledTypography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <StyledTypography
                          fontSize={'20px'}
                          fontWeight={600}
                          color={theme.palette.customColors?.OnPrimaryContainer}
                        >
                          {checklistComments?.[0]?.comments}
                        </StyledTypography>
                        <Button onClick={() => setShowChecklistComment(prev => !prev)}>
                          {showChecklistComment ? 'Hide' : 'See All'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </ClickAwayListener>
              ) : null}

              {/* Cancelled and Rejected Status */}
              {isTransferCancelled ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Icon icon={'mdi:cancel-bold'} color={theme.palette.customColors?.OnPrimary} />
                  <StyledTypography fontSize={'20px'} fontWeight={600} color={theme.palette.customColors?.OnPrimary}>
                    Cancelled
                  </StyledTypography>
                </Box>
              ) : isTransferRejected ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Icon icon={'mdi:cancel-bold'} color={theme.palette.customColors?.OnPrimary} />
                  <StyledTypography fontSize={'20px'} fontWeight={600} color={theme.palette.customColors?.OnPrimary}>
                    Rejected
                  </StyledTypography>
                </Box>
              ) : null}
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

      {showChecklistDrawer && (
        <TransferChecklistDrawer
          open={showChecklistDrawer}
          onClose={() => setShowChecklistDrawer(false)}
          transferId={Number(transferId)}
        />
      )}
    </>
  )
}

export default React.memo(HospitalTransferDrawer)

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

// Loading Skeleton UI
function LoadingSkeleton() {
  const theme = useTheme()

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant='text' width={140} height={28} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
        <Skeleton variant='text' width={180} height={28} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant='circular' width={16} height={16} />
            <Skeleton variant='text' width={160} height={22} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant='circular' width={16} height={16} />
            <Skeleton variant='text' width={140} height={22} />
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
            <Skeleton variant='circular' width={40} height={40} />
            <Box>
              <Skeleton variant='text' width={100} height={18} />
              <Skeleton variant='text' width={70} height={14} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant='circular' width={36} height={36} />
            <Skeleton variant='circular' width={36} height={36} />
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
  )
}
