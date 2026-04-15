import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  LinearProgress,
  Modal,
  Paper,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import { timelineOppositeContentClasses } from '@mui/lab'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import React, { useEffect, useState, useCallback, useMemo, memo, FC } from 'react'
import { styled, alpha, Theme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import NoDataFound from 'src/views/utility/NoDataFound'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import TransferPassQRCard from 'src/components/necropsy/TransferPassQRCard'
import TransferChecklistDrawer from 'src/components/necropsy/TransferChecklistDrawer'
import {
  getAnimalTransferSummary,
  getAnimalTransferButtonStatus,
  getAnimalTransferLogs,
  addAnimalTransferComment,
  updateAnimalTransferStatus,
  getTransferMembers,
  approveTransferRequest,
  rejectTransferRequest,
  getAnimalListBySpecies,
  TransferSummaryData,
  TransferButtonStatus,
  TransferEntityDetail,
  TransferMemberUser,
  TransferApprovalItem,
  SpeciesWithAnimalsItem,
  AnimalDetailItem,
  AnimalTransferLogItem
} from 'src/lib/api/housing'
import { useAuth } from 'src/hooks/useAuth'

interface ExtendedTheme extends Theme {
  palette: Theme['palette'] & {
    customColors?: {
      OnPrimary?: string
      OnSurfaceVariant?: string
      neutralSecondary?: string
      neutralPrimary?: string
      OnPrimaryContainer?: string
      onPrimaryContainer?: string
      OutlineVariant?: string
      Background?: string
      mdAntzNeutral?: string
      avatarBackground?: string
      displaybgPrimary?: string
      deepDark?: string
      editIconColor?: string
      onSurface?: string
      skyblue?: string
    }
  }
}

interface AnimalTransferDetailsDrawerProps {
  open: boolean
  onClose: () => void
  transferId: number | string | null
  transferType?: 'intra' | 'inter' | 'external'
  siteId?: number | string
  onStatusChange?: () => void
}

interface GroupedActivitySection {
  date?: string
  entries: AnimalTransferLogItem[]
}

const groupActivitiesByDate = (activities: AnimalTransferLogItem[]): GroupedActivitySection[] => {
  const grouped: Record<string, GroupedActivitySection> = {}
  activities?.forEach(item => {
    const dateStr = item?.commented_on || item?.created_at
    const date = dateStr?.split(' ')?.[0] || dateStr?.split('T')?.[0]
    if (date) {
      if (!grouped[date]) {
        grouped[date] = { date: dateStr, entries: [] }
      }
      grouped[date].entries.push(item)
    }
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
  backgroundColor: (theme as ExtendedTheme).palette.customColors?.Background,
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))

const AnimalTransferDetailsDrawer: FC<AnimalTransferDetailsDrawerProps> = ({
  open,
  onClose,
  transferId,
  transferType = 'intra',
  siteId,
  onStatusChange
}) => {
  const theme = useTheme<ExtendedTheme>()
  const router = useRouter()
  const auth = useAuth()
  const settings = (auth as any)?.userData?.settings

  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  const loggedInUserId = (auth as any)?.userData?.user?.user_id
  const animalTransferApproval = settings?.ANIMAL_TRANSFER_REQUIRES_APPROVAL ?? false

  const [summaryData, setSummaryData] = useState<TransferSummaryData | null>(null)
  const [buttonStatus, setButtonStatus] = useState<TransferButtonStatus | null>(null)
  const [activityList, setActivityList] = useState<AnimalTransferLogItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [showActivityCollapse, setShowActivityCollapse] = useState<boolean>(false)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false)
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [rejectReason, setRejectReason] = useState<string>('')
  const [showAnimalListModal, setShowAnimalListModal] = useState<boolean>(false)
  const [showMemberListModal, setShowMemberListModal] = useState<boolean>(false)
  const [speciesWithAnimals, setSpeciesWithAnimals] = useState<SpeciesWithAnimalsItem[]>([])
  const [totalAnimalCount, setTotalAnimalCount] = useState<number>(0)
  const [memberList, setMemberList] = useState<TransferMemberUser[]>([])
  const [animalListLoading, setAnimalListLoading] = useState<boolean>(false)
  const [memberListLoading, setMemberListLoading] = useState<boolean>(false)
  const [openQRDialog, setOpenQRDialog] = useState<boolean>(false)
  const [showChecklistDrawer, setShowChecklistDrawer] = useState<boolean>(false)

  const transferDetails = summaryData?.transfer_details
  const entityDetails = summaryData?.entity_details || summaryData?.animal_details || []
  const commentsDetails = summaryData?.comments_details || []
  const approvalList = summaryData?.approval_list || []

  const groupedActivities = useMemo(() => groupActivitiesByDate(activityList), [activityList])

  const shouldShowStatusFooter = useMemo((): boolean => {
    return activityList.length > 0
  }, [activityList.length])

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchAllData = useCallback(async (): Promise<void> => {
    if (!transferId) return

    setLoading(true)

    try {
      const [summaryRes, buttonRes, activityRes] = await Promise.all([
        getAnimalTransferSummary({ animal_movement_id: transferId }),
        getAnimalTransferButtonStatus({ animal_movement_id: transferId }),
        getAnimalTransferLogs(transferId)
      ])

      if (summaryRes?.success) {
        setSummaryData(summaryRes?.data || null)
      }

      if (buttonRes?.success) {
        setButtonStatus(buttonRes?.data || null)
      }

      if (activityRes?.success) {
        const responseData = activityRes?.data as
          | { logs?: AnimalTransferLogItem[] }
          | AnimalTransferLogItem[]
          | undefined
        let logs: AnimalTransferLogItem[] = []

        if (responseData) {
          if (Array.isArray(responseData)) {
            logs = responseData
          } else if (responseData.logs && Array.isArray(responseData.logs)) {
            logs = responseData.logs
          }
        }

        const transferType = summaryRes?.data?.transfer_details?.transfer_type
        const approvalList = summaryRes?.data?.approval_list || []
        const isApproved = approvalList[0]?.status === 'APPROVED'

        const approvedOn =
          (approvalList[0] as any)?.commented_on || (summaryRes?.data?.transfer_details as any)?.approved_on

        if (transferType === 'intra' && isApproved) {
          const approvedLog: AnimalTransferLogItem = {
            status: 'APPROVED',
            comments: 'Approved',
            commented_on: approvedOn || ''
          }
          logs = [approvedLog, ...logs]
        }

        setActivityList(logs)
      }
    } catch (error) {
      console.error('Error fetching transfer details:', error)
    } finally {
      setLoading(false)
    }
  }, [transferId, siteId])

  const fetchSummaryOnly = useCallback(async (): Promise<void> => {
    if (!transferId) return
    try {
      const response = await getAnimalTransferSummary({ animal_movement_id: transferId })
      if (response?.success) {
        setSummaryData(response?.data || null)
      }
    } catch (error) {
      console.error('Error fetching transfer summary:', error)
    }
  }, [transferId])

  const handleAddComment = async (): Promise<void> => {
    if (!comment.trim() || !transferId) return
    setCommentLoading(true)
    try {
      const payload = {
        animal_movement_id: transferId,
        comments: comment
      }
      const response = await addAnimalTransferComment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Comment added successfully' })
        setComment('')
        fetchSummaryOnly()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add comment' })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      Toaster({ type: 'error', message: 'Failed to add comment' })
    } finally {
      setCommentLoading(false)
    }
  }

  const handleApprove = async (): Promise<void> => {
    if (!transferId) return
    setActionLoading('APPROVED')
    try {
      const response = await approveTransferRequest({ animal_movement_id: transferId })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Transfer approved successfully' })
        fetchAllData()
        onStatusChange?.()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to approve transfer' })
      }
    } catch (error) {
      console.error('Error approving transfer:', error)
      Toaster({ type: 'error', message: 'Failed to approve transfer' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (): Promise<void> => {
    if (!transferId || !rejectReason.trim()) return
    setActionLoading('REJECTED')
    try {
      const payload = {
        animal_movement_id: transferId,
        transfer_status: 'REJECTED',
        activity_status: 'REJECTED',
        comments: rejectReason
      }
      const response = await rejectTransferRequest(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Transfer rejected' })
        setShowRejectModal(false)
        setRejectReason('')
        fetchAllData()
        onStatusChange?.()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to reject transfer' })
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error)
      Toaster({ type: 'error', message: 'Failed to reject transfer' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (): Promise<void> => {
    if (!transferId) return
    setActionLoading('CANCELED')
    try {
      const payload = {
        animal_movement_id: transferId,
        activity_status: 'CANCELED',
        comments: cancelReason
      }
      const response = await updateAnimalTransferStatus(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Transfer cancelled' })
        setShowCancelModal(false)
        setCancelReason('')
        fetchAllData()
        onStatusChange?.()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to cancel transfer' })
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error)
      Toaster({ type: 'error', message: 'Failed to cancel transfer' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewAnimals = async (): Promise<void> => {
    if (!transferId) return
    setAnimalListLoading(true)
    try {
      const response = await getAnimalListBySpecies({ animal_movement_id: transferId })
      if (response?.success) {
        setSpeciesWithAnimals(response?.data?.result || [])
        setTotalAnimalCount(response?.data?.total_animal_count || 0)
        setShowAnimalListModal(true)
      }
    } catch (error) {
      console.error('Error fetching animal list:', error)
    } finally {
      setAnimalListLoading(false)
    }
  }

  const handleViewMembers = async (): Promise<void> => {
    if (!transferId) return
    setMemberListLoading(true)
    try {
      const response = await getTransferMembers({ animal_movement_id: transferId })
      if (response?.success) {
        setMemberList(response?.data?.user_details || [])
        setShowMemberListModal(true)
      }
    } catch (error) {
      console.error('Error fetching member list:', error)
    } finally {
      setMemberListLoading(false)
    }
  }

  const handleAnimalClick = (animalId?: number): void => {
    if (animalId) {
      router.push(`/housing/animals/${animalId}`)
    }
  }

  useEffect(() => {
    if (open && transferId) {
      fetchAllData()
    }

    return () => {
      if (!open) {
        setSummaryData(null)
        setButtonStatus(null)
        setActivityList([])
        setShowActivityCollapse(false)
        setSpeciesWithAnimals([])
        setTotalAnimalCount(0)
        setMemberList([])
      }
    }
  }, [open, transferId, fetchAllData])

  // Format animal count display
  const getAnimalCountDisplay = (): string => {
    const total = summaryData?.total_animal_count || entityDetails.length || 0
    const transferred = summaryData?.transferred_animal_count || 0

    if (transferred >= 1 && transferred < total) {
      return `${transferred} / ${total}`
    }

    return `${total}`
  }

  // Get transfer type label
  const getTransferTypeLabel = (): string => {
    const type = transferDetails?.transfer_type || transferType
    switch (type) {
      case 'intra':
        return 'In-house Transfer'
      case 'inter':
        return 'Inter-Site Transfer'
      case 'external':
        return 'External Transfer'
      default:
        return 'Animal Transfer'
    }
  }

  // Get approval status label
  const getApprovalStatus = (): string => {
    const status = transferDetails?.activity_status
    if (status === 'REJECTED') return 'Approval Rejected'
    if (status === 'CANCELED') return 'Cancelled by'
    if (approvalList.some(item => item.status === 'APPROVED')) return 'Approved by'

    return 'Awaiting Approval'
  }

  // Get recent activity for footer
  const recentActivity = activityList?.[activityList?.length - 1]

  // Get current status display
  const getStatusDisplay = (): string => {
    const status = transferDetails?.activity_status
    switch (status) {
      case 'PENDING':
        return 'Awaiting Approval'
      case 'APPROVED':
        return 'Approved'
      case 'REJECTED':
        return 'Rejected'
      case 'CANCELED':
        return 'Cancelled'
      case 'COMPLETED':
        return 'Transfer Completed'
      case 'REACHED_DESTINATION':
        return 'Reached Destination'
      case 'LOADED_ANIMALS':
        return 'Animals Loaded'
      case 'RIDE_STARTED':
        return 'Ride Started'
      case 'ALLOCATION_COMPLETED':
        return 'Allocation Completed'
      default:
        return status?.replace(/_/g, ' ') || 'Pending'
    }
  }

  // Get progress percentage
  const getProgressPercentage = (): number => {
    const status = transferDetails?.activity_status

    const statusOrder = [
      'PENDING',
      'APPROVED',
      'LOADED_ANIMALS',
      'RIDE_STARTED',
      'REACHED_DESTINATION',
      'ALLOCATION_COMPLETED',
      'COMPLETED'
    ]
    const index = statusOrder.indexOf(status || 'PENDING')

    return index >= 0 ? ((index + 1) / statusOrder.length) * 100 : 10
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: false,
          BackdropProps: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
          }
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              height: '100vh',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.paper,
              p: 0,
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0
            }
          }
        }}
      >
        {loading ? (
          /* Loading Skeleton */
          <>
            <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={140} height={28} />
                <Skeleton variant='circular' width={32} height={32} />
              </Box>
              <Skeleton variant='text' width={180} height={24} />
              <Skeleton variant='text' width={120} height={20} />
              <Skeleton variant='text' width={160} height={18} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={40} height={40} />
                <Skeleton variant='text' width={120} height={20} />
                <Skeleton variant='circular' width={32} height={32} />
                <Skeleton variant='circular' width={32} height={32} />
              </Box>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, p: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant='rounded' width='100%' height={60} />
              ))}
            </Box>
          </>
        ) : (
          <>
            {/* Header Section - White background matching mobile */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: theme.palette.customColors?.OnPrimary,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Title Bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 3 }}>
                <IconButton onClick={onClose} size='small'>
                  <Icon icon='mdi:arrow-left' />
                </IconButton>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: theme.palette.customColors?.OnPrimaryContainer
                  }}
                >
                  {transferDetails?.request_id?.toUpperCase() || ''}
                </Typography>
                {/* QR Code Button - Show when qr_code_full_path exists */}
                {transferDetails?.qr_code_full_path &&
                (transferDetails?.transfer_type === 'intra' ||
                  !['PENDING', 'FILL_TRANSFER_CHECKLIST', 'LOADED_ANIMALS'].includes(
                    transferDetails?.activity_status || ''
                  )) ? (
                  <IconButton
                    onClick={() => setOpenQRDialog(true)}
                    size='small'
                    sx={{
                      backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.customColors?.OnPrimaryContainer || '#000', 0.85)
                      }
                    }}
                  >
                    <Icon icon='ic:outline-qr-code-2' fontSize={28} color={theme.palette.customColors?.OnPrimary} />
                  </IconButton>
                ) : (
                  <Box sx={{ width: 32 }} />
                )}
              </Box>

              {/* Transfer Type & Destination */}
              <Box sx={{ px: 4, pb: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '16px',
                    color: theme.palette.customColors?.OnPrimaryContainer,
                    mb: 1
                  }}
                >
                  {getTransferTypeLabel()}
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '18px',
                    color: theme.palette.customColors?.OnPrimaryContainer,
                    mb: 1
                  }}
                >
                  {transferDetails?.destination_name || transferDetails?.destination_site_name || 'Destination'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.neutralSecondary
                  }}
                >
                  {Utility.convertUTCToLocalDateTime(transferDetails?.requested_on || '')}
                </Typography>
              </Box>

              {/* User Info Row */}
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar
                  src={transferDetails?.user_profile_pic}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.customColors?.OnPrimaryContainer
                  }}
                >
                  {(transferDetails?.user_first_name?.[0] || '') + (transferDetails?.user_last_name?.[0] || '')}
                </Avatar>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnPrimaryContainer,
                    flex: 1
                  }}
                >
                  {`${transferDetails?.user_first_name || ''} ${transferDetails?.user_last_name || ''}`.trim()}
                </Typography>

                {transferDetails?.user_mobile_number && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => window.open(`tel:${transferDetails?.user_mobile_number}`, '_self')}
                      sx={{
                        backgroundColor: alpha(theme.palette.customColors?.neutralPrimary || '#000', 0.05),
                        '&:hover': { backgroundColor: alpha(theme.palette.customColors?.neutralPrimary || '#000', 0.1) }
                      }}
                    >
                      <Icon icon='mdi:phone' fontSize={18} />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => window.open(`sms:${transferDetails?.user_mobile_number}`, '_self')}
                      sx={{
                        backgroundColor: alpha(theme.palette.customColors?.neutralPrimary || '#000', 0.05),
                        '&:hover': { backgroundColor: alpha(theme.palette.customColors?.neutralPrimary || '#000', 0.1) }
                      }}
                    >
                      <Icon icon='mdi:message-text-outline' fontSize={18} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Content Section */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                backgroundColor: theme.palette.customColors.Background,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              {/* Transfer Animals Section */}
              <Box
                onClick={handleViewAnimals}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 4,
                  py: 3,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Icon icon='mdi:arrow-top-right' fontSize={22} color={theme.palette.customColors?.editIconColor} />
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '13px',
                        color: theme.palette.customColors?.neutralSecondary
                      }}
                    >
                      Transfer
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      {getAnimalCountDisplay()} Animals
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: theme.palette.customColors?.onSurface
                  }}
                >
                  {animalListLoading ? <CircularProgress size={16} /> : 'View'}
                </Typography>
              </Box>

              <Divider />

              {/* Reason for Transfer */}
              {transferDetails?.reason && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, px: 4, py: 3 }}>
                    <Icon
                      icon='mdi:help-circle-outline'
                      fontSize={22}
                      color={theme.palette.customColors?.editIconColor}
                      style={{ marginTop: 2 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '13px',
                          color: theme.palette.customColors?.neutralSecondary
                        }}
                      >
                        Reason for transfer
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '16px',
                          color: theme.palette.customColors?.OnSurfaceVariant
                        }}
                      >
                        {transferDetails?.reason}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Transfer To (for intra with enclosure) */}
              {transferDetails?.transfer_type === 'intra' && transferDetails?.assign_to?.enclosure_id && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, px: 4, py: 3 }}>
                    <Icon icon='mdi:arrow-top-right' fontSize={22} color={theme.palette.customColors?.editIconColor} />
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '13px',
                          color: theme.palette.customColors?.neutralSecondary
                        }}
                      >
                        Transfer To
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '16px',
                          color: theme.palette.customColors?.OnSurfaceVariant
                        }}
                      >
                        {transferDetails?.assign_to?.enclosure_name}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Transfer Checklist - Show only when show_checklist_button is true (matching mobile) */}
              {buttonStatus?.show_checklist_button && (
                <>
                  <Box
                    onClick={() => setShowChecklistDrawer(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: 'space-between',
                      backgroundColor: theme.palette.background.paper,
                      px: 4,
                      py: 3,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon icon='mdi:check-circle' color={theme.palette.customColors?.skyblue} fontSize={22} />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '13px',
                            color: theme.palette.customColors?.neutralSecondary
                          }}
                        >
                          Transfer Checklist
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        height: 36,
                        width: 36,
                        borderRadius: '50%',
                        border: `1px solid ${theme.palette.primary.main}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: theme.palette.customColors?.onSurface
                        }}
                      >
                        {transferDetails?.checked_count || 0}/{transferDetails?.total_checklist_count || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Transfer Team - Conditional on ANIMAL_TRANSFER_REQUIRES_APPROVAL */}
              {animalTransferApproval && (
                <>
                  <Box
                    onClick={handleViewMembers}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 4,
                      py: 3,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon icon='mdi:account' fontSize={22} color={theme.palette.customColors?.editIconColor} />
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '13px',
                            color: theme.palette.customColors?.neutralSecondary
                          }}
                        >
                          Transfer Team
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '16px',
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        >
                          {summaryData?.total_members || 0} Members
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: theme.palette.customColors?.onSurface
                      }}
                    >
                      {memberListLoading ? <CircularProgress size={16} /> : 'View'}
                    </Typography>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Approved by Section - Conditional on ANIMAL_TRANSFER_REQUIRES_APPROVAL */}
              {animalTransferApproval && (
                <>
                  <Box sx={{ px: 4, py: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {transferDetails?.activity_status === 'REJECTED' ||
                      transferDetails?.activity_status === 'CANCELED' ? (
                        <Icon
                          icon='mdi:close-octagon'
                          fontSize={22}
                          color={
                            transferDetails?.activity_status === 'CANCELED'
                              ? theme.palette.customColors?.neutralSecondary
                              : theme.palette.error.main
                          }
                        />
                      ) : (
                        <Icon
                          icon='mdi:check-circle'
                          fontSize={22}
                          color={
                            approvalList.some(item => item.status === 'APPROVED')
                              ? theme.palette.success.main
                              : theme.palette.customColors?.neutralSecondary
                          }
                        />
                      )}
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '13px',
                          color: theme.palette.customColors?.neutralSecondary
                        }}
                      >
                        {getApprovalStatus()}
                      </Typography>
                    </Box>

                    {/* Approval List */}
                    {approvalList.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          ml: 5,
                          mb: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={item.user_profile_pic} sx={{ width: 32, height: 32 }}>
                            {(item.user_first_name?.[0] || '') + (item.user_last_name?.[0] || '')}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  color: theme.palette.customColors?.OnSurfaceVariant
                                }}
                              >
                                {`${item.user_first_name || ''} ${item.user_last_name || ''}`.trim()}
                              </Typography>
                              {item.status === 'APPROVED' && (
                                <Icon icon='mdi:star' fontSize={14} color={theme.palette.warning.main} />
                              )}
                            </Box>
                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: '12px',
                                color: theme.palette.customColors?.neutralSecondary
                              }}
                            >
                              Sites: {item.site_name}
                            </Typography>
                          </Box>
                        </Box>
                        {item.status === 'APPROVED' && (
                          <Icon icon='mdi:check-circle-outline' fontSize={20} color={theme.palette.success.main} />
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Divider />
                </>
              )}

              {/* Comments Section */}
              <Box sx={{ px: 4, py: 3, backgroundColor: theme.palette.customColors.OnPrimary }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Icon
                    icon='mdi:message-text-outline'
                    fontSize={22}
                    color={theme.palette.customColors?.OnSurfaceVariant}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      color: theme.palette.customColors?.OnSurfaceVariant
                    }}
                  >
                    Comments
                  </Typography>
                </Box>

                {/* Comment Input */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: theme.palette.customColors?.mdAntzNeutral,
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    mb: 3
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {((auth as any)?.userData?.user?.user_first_name?.[0] || '') +
                      ((auth as any)?.userData?.user?.user_last_name?.[0] || '')}
                  </Avatar>
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='Add your comment'
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                    variant='standard'
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            onClick={handleAddComment}
                            disabled={!comment.trim() || commentLoading}
                            size='small'
                          >
                            {commentLoading ? (
                              <CircularProgress size={18} />
                            ) : (
                              <Icon icon='mdi:send' fontSize={20} color={theme.palette.primary.main} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '14px'
                      }
                    }}
                  />
                </Box>

                {/* Comments List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {commentsDetails && commentsDetails.length > 0 ? (
                    commentsDetails.map(item => {
                      // Get user display name
                      const userName =
                        item?.user_name ||
                        item?.user_full_name ||
                        `${item?.user_first_name || ''} ${item?.user_last_name || ''}`.trim() ||
                        'User'

                      // Check if this is the logged-in user
                      const isCurrentUser = item?.user_id === loggedInUserId

                      // Get initials for avatar
                      const initials = item?.user_name
                        ? item.user_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()
                        : (item?.user_first_name?.[0] || '') + (item?.user_last_name?.[0] || '')

                      // Get profile pic - check both field names (matching mobile)
                      const profilePic = item?.profile_pic || item?.user_profile_pic

                      return (
                        <Box
                          key={item?.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            backgroundColor: theme.palette.customColors?.mdAntzNeutral,
                            borderRadius: 2,
                            p: 3
                          }}
                        >
                          <Avatar
                            src={profilePic}
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: theme.palette.customColors?.OnPrimaryContainer,
                              fontSize: '13px',
                              fontWeight: 600
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            {/* User Name and Time */}
                            <Box
                              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: theme.palette.customColors?.OnPrimaryContainer
                                }}
                              >
                                {userName}
                                {isCurrentUser && (
                                  <Typography
                                    component='span'
                                    sx={{
                                      fontSize: '13px',
                                      fontWeight: 400,
                                      color: theme.palette.customColors?.neutralSecondary,
                                      ml: 0.5
                                    }}
                                  >
                                    (You)
                                  </Typography>
                                )}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: theme.palette.customColors?.neutralSecondary
                                }}
                              >
                                {Utility.convertUTCToLocaltime(item?.commented_on || item?.created_at || '')}
                              </Typography>
                            </Box>
                            {/* Comment Text */}
                            <Typography
                              sx={{
                                fontSize: '14px',
                                fontWeight: 400,
                                color: theme.palette.customColors?.neutralPrimary
                              }}
                            >
                              {item?.comments || item?.content}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors?.neutralSecondary,
                        textAlign: 'center',
                        py: 2
                      }}
                    >
                      No comments yet
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Footer Section - Status Display Only (matching mobile BottomsheetTransferBtns.js) */}
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                width: '100%',
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                zIndex: 10
              }}
            >
              {/* Current Status & Activity Section */}
              {shouldShowStatusFooter && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 400,
                          color: theme.palette.customColors?.neutralSecondary
                        }}
                      >
                        Current Status{' '}
                        {recentActivity?.commented_on && (
                          <span>
                            &bull; {Utility.AgeConverter(Utility.convertUTCToLocal(recentActivity.commented_on))}
                          </span>
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: theme.palette.customColors?.OnPrimaryContainer
                        }}
                      >
                        {getStatusDisplay()}
                      </Typography>
                    </Box>
                    {activityList?.length > 0 && (
                      <Button
                        onClick={() => setShowActivityCollapse(prev => !prev)}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                      >
                        {showActivityCollapse ? 'Hide' : 'See all'}
                      </Button>
                    )}
                  </Box>

                  {/* Activity Timeline Collapse */}
                  <Collapse in={showActivityCollapse}>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {groupedActivities?.map((section, sectionIndex) => (
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
                              {Utility.convertUtcToLocalReadableDate(section?.date || '')}
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
                                      color: theme.palette.customColors?.OnSurfaceVariant
                                    }}
                                  >
                                    {Utility.convertUTCToLocaltime(item?.commented_on || item?.created_at || '')}
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
                                      backgroundColor: theme.palette.customColors?.Background,
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
                                        color: theme.palette.customColors?.OnSurfaceVariant
                                      }}
                                    >
                                      {item?.comments || item?.content || item?.status?.replace(/_/g, ' ')}
                                    </Typography>
                                  </Box>
                                </TimelineContent>
                              </TimelineItem>
                            ))}
                          </StyledTimeline>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* 1. Progress Bar - Mobile condition: transferLogs?.length >= 1 && (!reinitiate_button || !already_rejected) && status !== "CANCELED" */}
              {activityList?.length >= 1 &&
              (!buttonStatus?.reinitiate_button || !buttonStatus?.already_rejected) &&
              transferDetails?.activity_status !== 'CANCELED' ? (
                <Box sx={{ px: 3, pb: 2 }}>
                  <LinearProgress
                    variant='determinate'
                    value={getProgressPercentage()}
                    sx={{
                      height: 10,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.customColors?.onSurface,
                        borderRadius: '10px'
                      }
                    }}
                  />
                </Box>
              ) : null}

              {/* 2. Approved Badge */}
              {buttonStatus?.reset_approval ||
              (buttonStatus?.already_approved &&
                !buttonStatus?.show_check_temperature_button &&
                !buttonStatus?.show_load_animals_button) ? (
                <Box sx={{ px: 3, pt: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      py: 2,
                      px: 6,
                      backgroundColor: theme.palette.success.main,
                      borderRadius: '50px',
                      width: '90%'
                    }}
                  >
                    <Icon icon='mdi:check' fontSize={20} color={theme.palette.customColors?.OnPrimary} />
                    <Typography
                      sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.customColors?.OnPrimary }}
                    >
                      {buttonStatus?.show_you_approved ? 'You Approved' : 'Approved'}
                    </Typography>
                  </Box>
                </Box>
              ) : null}

              {/* 3. Rejected Badge - Mobile condition: (reinitiate_button || already_rejected) && status !== "CANCELED" */}
              {(buttonStatus?.reinitiate_button || buttonStatus?.already_rejected) &&
              transferDetails?.activity_status !== 'CANCELED' ? (
                <Box sx={{ px: 3, pb: 3, pt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      py: 2,
                      px: 6,
                      backgroundColor: theme.palette.error.main,
                      borderRadius: '50px',
                      width: '90%'
                    }}
                  >
                    <Icon icon='mdi:close' fontSize={20} color={theme.palette.customColors?.OnPrimary} />
                    <Typography
                      sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.customColors?.OnPrimary }}
                    >
                      {buttonStatus?.show_you_rejected ? 'You Rejected' : 'Rejected'}
                    </Typography>
                  </Box>
                </Box>
              ) : null}

              {/* 4. Canceled Badge - Mobile condition: status === "CANCELED" */}
              {transferDetails?.activity_status === 'CANCELED' ? (
                <Box sx={{ px: 3, pb: 3, pt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      py: 2,
                      px: 6,
                      backgroundColor: theme.palette.customColors?.neutralSecondary,
                      borderRadius: '50px',
                      width: '90%'
                    }}
                  >
                    <Icon icon='mdi:close' fontSize={20} color={theme.palette.customColors?.OnPrimary} />
                    <Typography
                      sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.customColors?.OnPrimary }}
                    >
                      Canceled
                    </Typography>
                  </Box>
                </Box>
              ) : null}
            </Box>
          </>
        )}
      </Drawer>

      {/* Animal List Modal */}
      <Modal
        open={showAnimalListModal}
        onClose={() => setShowAnimalListModal(false)}
        sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
      >
        <Paper
          sx={{
            width: { xs: '100%', sm: '80%', md: 560 },
            maxHeight: '80vh',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            boxShadow: 24,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Animals ({totalAnimalCount})</Typography>
            <IconButton onClick={() => setShowAnimalListModal(false)} size='small'>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {speciesWithAnimals.length === 0 ? (
              <NoDataFound />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {speciesWithAnimals.map((species, speciesIndex) => (
                  <Box key={species.taxonomy_id || speciesIndex}>
                    {/* Species Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                        pb: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      {species.default_icon && (
                        <Avatar
                          src={species.default_icon}
                          sx={{ width: 32, height: 32, bgcolor: theme.palette.grey[200] }}
                        >
                          <Icon icon='mdi:paw' fontSize={18} />
                        </Avatar>
                      )}
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '15px',
                            color: theme.palette.customColors?.OnPrimaryContainer
                          }}
                        >
                          {species.common_name || 'Unknown Species'}
                        </Typography>
                        {species.scientific_name && (
                          <Typography
                            sx={{
                              fontStyle: 'italic',
                              fontSize: '12px',
                              color: theme.palette.customColors?.neutralSecondary
                            }}
                          >
                            {species.scientific_name}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          ml: 'auto',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: theme.palette.customColors?.neutralSecondary
                        }}
                      >
                        {species.animal_details?.length || 0} animals
                      </Typography>
                    </Box>

                    {/* Animals List within Species */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 1 }}>
                      {species.animal_details?.map((animal, animalIndex) => (
                        <Box
                          key={animal.animal_id || animalIndex}
                          onClick={() => handleAnimalClick(animal?.animal_id)}
                          sx={{
                            backgroundColor: theme.palette.grey[50],
                            borderRadius: 1,
                            p: 2,
                            cursor: animal?.animal_id ? 'pointer' : 'default',
                            '&:hover': animal?.animal_id ? { opacity: 0.85 } : {}
                          }}
                        >
                          <AnimalCard
                            data={{
                              ...animal,
                              // Map fields for AnimalCard compatibility
                              default_common_name: animal.common_name || species.common_name,
                              complete_name: animal.scientific_name || species.scientific_name,
                              default_icon: animal.default_icon || species.default_icon,
                              sex: animal.sex || animal.gender
                            }}
                            size={undefined}
                            edit={undefined}
                            valueColor={undefined}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>

      {/* Member List Modal */}
      <Modal
        open={showMemberListModal}
        onClose={() => setShowMemberListModal(false)}
        sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
      >
        <Paper
          sx={{
            width: { xs: '100%', sm: '80%', md: 560 },
            maxHeight: '80vh',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            boxShadow: 24,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnPrimaryContainer
              }}
            >
              Transfer Members
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='mdi:account-circle' fontSize={24} color={theme.palette.customColors?.OnPrimaryContainer} />
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnPrimaryContainer
                }}
              >
                {memberList.length}
              </Typography>
              <IconButton onClick={() => setShowMemberListModal(false)} size='small' sx={{ ml: 1 }}>
                <Icon icon='mdi:close' />
              </IconButton>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {memberList.length === 0 ? (
              <NoDataFound />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {memberList.map((member, index) => {
                  // Get display name - use user_name if available, otherwise construct from first/last name
                  const displayName =
                    member.user_name ||
                    `${member.user_first_name || ''} ${member.user_last_name || ''}`.trim() ||
                    'Unknown'

                  // Get initials for avatar
                  const initials = member.user_name
                    ? member.user_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : (member.user_first_name?.[0] || '') + (member.user_last_name?.[0] || '')

                  return (
                    <Box
                      key={member.user_id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 2,
                        backgroundColor: theme.palette.grey[50],
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Avatar
                        src={member.user_profile_pic}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: theme.palette.customColors?.OnPrimaryContainer,
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        {/* User Name with Star Icon */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '15px',
                              color: theme.palette.customColors?.OnPrimaryContainer
                            }}
                          >
                            {displayName}
                          </Typography>
                          {/* Star icon - shown when user can perform action (API returns 0/1 or "0"/"1") */}
                          {Boolean(Number(member.can_perform_action)) && (
                            <Icon icon='mdi:star-circle' fontSize={16} color={theme.palette.warning.dark} />
                          )}
                        </Box>

                        {/* Role Name */}
                        {member.role_name && (
                          <Typography
                            sx={{
                              fontSize: '13px',
                              fontWeight: 400,
                              color: theme.palette.customColors?.neutralSecondary,
                              mt: 0.25
                            }}
                          >
                            {member.role_name}
                          </Typography>
                        )}

                        {/* Site Name */}
                        {(member.source_site_name || member.destination_name) && (
                          <Typography
                            sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: theme.palette.customColors?.neutralSecondary,
                              mt: 0.25
                            }}
                          >
                            Site: {member.source_site_name || member.destination_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>

      {/* Reject Modal */}
      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            p: 4,
            borderRadius: 2
          }}
        >
          <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 3 }}>Reject Transfer</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder='Please provide a reason for rejection'
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant='outlined' fullWidth onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant='contained'
              fullWidth
              color='error'
              disabled={!rejectReason.trim() || actionLoading === 'REJECTED'}
              onClick={handleReject}
            >
              {actionLoading === 'REJECTED' ? <CircularProgress size={24} color='inherit' /> : 'Reject'}
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            p: 4,
            borderRadius: 2
          }}
        >
          <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 3 }}>Cancel Transfer</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder='Please provide a reason for cancellation'
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant='outlined' fullWidth onClick={() => setShowCancelModal(false)}>
              Close
            </Button>
            <Button
              variant='contained'
              fullWidth
              color='error'
              disabled={actionLoading === 'CANCELED'}
              onClick={handleCancel}
            >
              {actionLoading === 'CANCELED' ? <CircularProgress size={24} color='inherit' /> : 'Confirm Cancel'}
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* QR Code Dialog */}
      <TransferPassQRCard
        open={openQRDialog}
        handleClose={() => setOpenQRDialog(false)}
        transferData={{
          requestId: transferDetails?.request_id,
          qrCodeUrl: transferDetails?.qr_code_full_path,
          title: 'Transfer Pass',
          subtitle: 'Transfer Request number'
        }}
      />

      {/* Transfer Checklist Drawer */}
      <TransferChecklistDrawer
        open={showChecklistDrawer}
        onClose={() => setShowChecklistDrawer(false)}
        transferId={transferId ? Number(transferId) : null}
      />
    </>
  )
}

export default memo(AnimalTransferDetailsDrawer)
