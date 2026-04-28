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
  InputAdornment,
  Modal,
  Paper,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import React, { useEffect, useState, useCallback, useMemo, memo, FC } from 'react'
import { styled, alpha, Theme } from '@mui/material/styles'
import { useRouter } from 'next/navigation'
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
import MediaCard from 'src/views/utility/MediaCard'
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
import TransferChecklistDrawer from 'src/components/necropsy/TransferChecklistDrawer'
import NoDataFound from 'src/views/utility/NoDataFound'
import Toaster from '../Toaster'
import moment from 'moment'
import { CreateIncomingNecropsyCommentPayload, IncomingNecropsyDrawerProps } from 'src/types/necropsy'
import { useTranslation } from 'react-i18next'

// Extended theme interface for custom colors
interface ExtendedTheme extends Theme {
  palette: Theme['palette'] & {
    customColors?: {
      OnPrimary?: string
      OnSurfaceVariant?: string
      neutralSecondary?: string
      neutralPrimary?: string
      OnPrimaryContainer?: string
      OutlineVariant?: string
      Background?: string
      mdAntzNeutral?: string
      avatarBackground?: string
      rusticRed?: string
      deepDark?: string
      displaybgPrimary?: string
    }
  }
}

// Internal interfaces for necropsy data structures
interface TransferDetails {
  transfer_id?: number
  transfer_code?: string
  transfer_status?: string
  source_name?: string
  destination_name?: string
  qr_code_full_path?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_image?: string
  user_mobile_number?: string
  created_at?: string
  reason_for_transfer?: string
  checked_count?: number
  total_checklist_count?: number
}

interface EntityDetail {
  animal_id?: number
  [key: string]: unknown
}

interface TransferAttachment {
  id?: number
  file?: string
  url?: string
  file_url?: string
  file_original_name?: string
  name?: string
  created_at?: string
  type?: string
  file_type?: string
}

interface CommentDetail {
  id?: number
  comments?: string
  commented_on?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
}

interface NecropsyData {
  total_animal_count?: number
  transferred_animal_count?: number
  entity_details?: EntityDetail[]
  transfer_details?: TransferDetails
  transfer_attachment?: TransferAttachment[]
  comments_details?: CommentDetail[]
}

interface QRDialogData {
  requestId?: string
  qrCodeUrl?: string
  title?: string
  subtitle?: string
}

interface BtnStatusData {
  show_accept_button?: number
}

interface ChecklistComment {
  id?: number
  comments?: string
  commented_on?: string
  dump?: {
    loaded_count?: number
    total_animal_count?: number
  }
  pending_count?: number
}

interface GroupedChecklistSection {
  date?: string
  entries: ChecklistComment[]
}

interface AnimalItem {
  animal_id?: number
  transfer_status?: string
  [key: string]: unknown
}

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
  backgroundColor: (theme as ExtendedTheme).palette.customColors?.Background || theme.palette.grey[100],
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}))

const IncomingNecropsyDrawer: FC<IncomingNecropsyDrawerProps> = ({
  open,
  onClose,
  transferId,
  onAcceptSuccess,
  hideAcceptButton = false
}) => {
  const theme = useTheme<ExtendedTheme>()
  const router = useRouter()
  const { t } = useTranslation()

  const [necropsyData, setNecropsyData] = useState<NecropsyData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [openQRDialog, setOpenQRDialog] = useState<boolean>(false)
  const [qrDialogData, setQRDialogData] = useState<QRDialogData | null>(null)
  const [comment, setComment] = useState<string>('')
  const [commentLoading, setCommentLoading] = useState<boolean>(false)
  const [btnStatusData, setBtnStatusData] = useState<BtnStatusData | null>(null)
  const [btnStatusLoading, setBtnStatusLoading] = useState<boolean>(false)
  const [checklistComments, setChecklistComments] = useState<ChecklistComment[]>([])
  const [showChecklistComment, setShowChecklistComment] = useState<boolean>(false)
  const [showAnimalListDrawer, setShowAnimalListDrawer] = useState<boolean>(false)
  const [animalList, setAnimalList] = useState<AnimalItem[]>([])
  const [animalListLoading, setAnimalListLoading] = useState<boolean>(false)
  const [acceptLoading, setAcceptLoading] = useState<boolean>(false)
  const [showChecklistDrawer, setShowChecklistDrawer] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchAllDrawerData = useCallback(async (): Promise<void> => {
    if (!transferId) return

    setLoading(true)
    setBtnStatusLoading(true)

    try {
      const [detailsRes, btnStatusRes, checklistRes] = await Promise.all([
        getIncomingNecropsyTransferSummary({ transfer_id: transferId }),
        getIncomingNecropsyBtnStatus(transferId),
        getIncomingNecropsyChecklistDetails({ entity_type: 'carcass_transfer' }, transferId)
      ])

      if (detailsRes?.success) {
        setNecropsyData(detailsRes?.data as NecropsyData)
      }

      if (btnStatusRes?.success) {
        setBtnStatusData(btnStatusRes?.data as BtnStatusData)
      }

      if (checklistRes?.success) {
        setChecklistComments(checklistRes?.data?.comments || [])
      }
    } catch (error) {
      console.error('Error fetching drawer data:', error)
    } finally {
      setLoading(false)
      setBtnStatusLoading(false)
    }
  }, [transferId])

  const fetchNecropsyDetails = useCallback(async (): Promise<void> => {
    if (!transferId) return
    try {
      const response = await getIncomingNecropsyTransferSummary({ transfer_id: transferId })
      if (response?.success) {
        setNecropsyData(response?.data as NecropsyData)
      }
    } catch (error) {
      console.error('Error fetching incoming necropsy details:', error)
    }
  }, [transferId])

  const handleAddComment = async (): Promise<void> => {
    if (!comment.trim() || !transferId) return
    setCommentLoading(true)
    try {
      const payload: CreateIncomingNecropsyCommentPayload = {
        entity_id: transferId,
        entity_type: 'carcass_transfer',
        content: comment,
        action: 'comment'
      }
      const response = await createIncomingNecropsySummaryComment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('necropsy_module.comment_added_successfully') })
        setComment('')
        fetchNecropsyDetails()
      } else {
        Toaster({ type: 'error', message: response?.message || t('necropsy_module.failed_to_add_comment') })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleAcceptNecropsy = async (): Promise<void> => {
    if (!transferId) return
    setAcceptLoading(true)
    try {
      const response = await acceptNecropsyTransfer(transferId, { status: 'COMPLETED' })
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('necropsy_module.necropsy_accepted_successfully') })
        onAcceptSuccess?.()
        onClose()
      } else {
        Toaster({ type: 'error', message: response?.message || t('necropsy_module.failed_to_accept_necropsy') })
      }
    } catch (error) {
      console.error('Error accepting necropsy:', error)
      Toaster({ type: 'error', message: t('necropsy_module.failed_to_accept_necropsy') })
    } finally {
      setAcceptLoading(false)
    }
  }

  const fetchAnimalList = useCallback(async (): Promise<void> => {
    if (!transferId) return
    setAnimalListLoading(true)
    try {
      const response = await getTransferAnimalList(transferId, { status: 'ALL' })
      if (response?.success) {
        setAnimalList((response?.data?.result || []) as AnimalItem[])
      }
    } catch (error) {
      console.error('Error fetching animal list:', error)
    } finally {
      setAnimalListLoading(false)
    }
  }, [transferId])

  const handleViewAnimals = (): void => {
    setShowAnimalListDrawer(true)
    fetchAnimalList()
  }

  const handleAnimalClick = (animalId?: number): void => {
    if (animalId) {
      router.push(`/housing/animals/${animalId}`)
    }
  }

  useEffect(() => {
    if (open && transferId) {
      fetchAllDrawerData()
    }
  }, [open, transferId, fetchAllDrawerData])

  const groupedChecklistComments = useMemo(() => groupCommentsByDate(checklistComments), [checklistComments])

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
                backgroundColor: theme.palette.customColors?.rusticRed,
                color: theme.palette.customColors?.OnPrimary
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 6, pt: 4, mb: 4 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '20px', color: theme.palette.customColors?.OnPrimary }}>
                  {necropsyData?.transfer_details?.transfer_code}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: theme.palette.customColors?.OnPrimary }}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>

              <Box sx={{ px: 6, pb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '20px', color: theme.palette.customColors?.OnPrimary }}
                    >
                      {t('necropsy_module.carcass_transfer')}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnPrimary }}
                      >
                        {necropsyData?.transfer_details?.source_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <img src='/images/line_end_square.svg' alt='line-end-square' />
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors?.OnPrimary }}
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
                          title: t('necropsy_module.transfer_pass'),
                          subtitle: t('necropsy_module.transfer_request_number')
                        })
                      }}
                    >
                      <Icon icon='ic:outline-qr-code-2' fontSize={46} color={theme.palette.customColors?.OnPrimary} />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  px: 6,
                  py: 4,
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
                    gap: 2,
                    color: `${theme.palette.customColors?.OnPrimary} !important`
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: alpha(theme.palette.customColors?.OnPrimary || '#fff', 0.8)
                    }}
                  >
                    {t('necropsy_module.initiated_by')}
                  </Typography>
                  <UserAvatarDetails
                    user_name={`${necropsyData?.transfer_details?.user_first_name} ${necropsyData?.transfer_details?.user_last_name}`}
                    profile_image={necropsyData?.transfer_details?.user_profile_image}
                    date={necropsyData?.transfer_details?.created_at}
                    show_time
                    size='medium'
                    text_color={theme.palette.customColors?.OnPrimary}
                    description={undefined}
                    role={undefined}
                    crby_width={undefined}
                    dateType={undefined}
                  />
                </Box>
                {necropsyData?.transfer_details?.user_mobile_number && (
                  <>
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                      <IconButton
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                          }
                        }}
                        onClick={() =>
                          window.open(`tel:${necropsyData?.transfer_details?.user_mobile_number}`, '_self')
                        }
                      >
                        <Icon icon='mdi:phone' fontSize={20} />
                      </IconButton>
                      <IconButton
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          color: theme.palette.customColors?.OnPrimary,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                          }
                        }}
                        onClick={() =>
                          window.open(`sms:${necropsyData?.transfer_details?.user_mobile_number}`, '_self')
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
                          '&:hover': { backgroundColor: alpha(theme.palette.customColors?.OnPrimary || '#fff', 0.1) }
                        }}
                      >
                        <Icon icon='mdi:phone' fontSize={18} />
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
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.customColors?.OnPrimary,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {necropsyData?.transfer_details?.user_mobile_number}
                        </Typography>
                        <Tooltip title={copied ? t('necropsy_module.copied') : t('necropsy_module.copy_number')}>
                          <IconButton
                            size='small'
                            onClick={() => handleCopyNumber(necropsyData?.transfer_details?.user_mobile_number || '')}
                            sx={{
                              color: theme.palette.customColors?.OnPrimary,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.customColors?.OnPrimary || '#fff', 0.1)
                              }
                            }}
                          >
                            <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} fontSize={18} />
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
              {(() => {
                const animalCount = necropsyData?.total_animal_count || necropsyData?.entity_details?.length || 0
                const transferredCount = necropsyData?.transferred_animal_count ?? 0
                const loadedCount = transferredCount >= 1 && transferredCount !== animalCount ? transferredCount : null

                if (animalCount === 1 && necropsyData?.entity_details?.[0]) {
                  return (
                    <Box
                      onClick={() => handleAnimalClick(necropsyData?.entity_details?.[0]?.animal_id)}
                      sx={{
                        background: theme.palette.customColors?.avatarBackground,
                        p: 3,
                        cursor: necropsyData?.entity_details[0]?.animal_id ? 'pointer' : 'default',
                        '&:hover': necropsyData?.entity_details[0]?.animal_id
                          ? {
                              opacity: 0.85
                            }
                          : {}
                      }}
                    >
                      <AnimalCard
                        data={necropsyData?.entity_details[0]}
                        size={undefined}
                        edit={undefined}
                        valueColor={undefined}
                      />
                    </Box>
                  )
                }

                return (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 6,
                      py: 2,
                      background: theme.palette.customColors?.avatarBackground
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Icon
                        icon='proicons:arrow-enter'
                        fontSize={20}
                        style={{ transform: 'rotate(180deg)' }}
                        color={theme.palette.customColors?.neutralPrimary}
                      />
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        >
                          {t('necropsy_module.transfer')}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '16px',
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        >
                          {loadedCount != null
                            ? t('necropsy_module.carcasses_count', { loaded: loadedCount, total: animalCount })
                            : `${animalCount} ${
                                animalCount === 1 ? t('necropsy_module.carcass') : t('necropsy_module.carcasses')
                              }`}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      onClick={handleViewAnimals}
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: theme.palette.primary.main,
                        cursor: 'pointer'
                      }}
                    >
                      {t('necropsy_module.view')}
                    </Box>
                  </Box>
                )
              })()}

              {necropsyData?.transfer_details?.reason_for_transfer && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    background: theme.palette.customColors?.avatarBackground,
                    px: 6,
                    py: 2,
                    mt: '1px'
                  }}
                >
                  <Icon icon='mdi:note-outline' fontSize={20} color={theme.palette.customColors?.OnSurfaceVariant} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                      }}
                    >
                      {t('necropsy_module.notes')}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      {necropsyData?.transfer_details?.reason_for_transfer}
                    </Typography>
                  </Box>
                </Box>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  justifyContent: 'space-between',
                  backgroundColor: theme.palette.customColors?.avatarBackground,
                  px: 6,
                  py: 2,
                  mt: '1px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Icon icon={'uis:check-circle'} color={theme.palette.customColors?.neutralSecondary} fontSize={20} />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors?.OnSurfaceVariant }}
                    >
                      {t('necropsy_module.transfer_checklist')}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      {necropsyData?.transfer_details?.checked_count}/
                      {necropsyData?.transfer_details?.total_checklist_count} {t('necropsy_module.filled')}
                    </Typography>
                  </Box>
                </Box>
                {(necropsyData?.transfer_details?.checked_count || 0) > 0 && (
                  <Box
                    onClick={() => setShowChecklistDrawer(true)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: theme.palette.primary.main,
                      cursor: 'pointer'
                    }}
                  >
                    {t('necropsy_module.view')}
                  </Box>
                )}
              </Box>
              {necropsyData?.transfer_attachment && necropsyData.transfer_attachment.length > 0 && (
                <Box sx={{ px: 6, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Icon icon='mdi:attachment' fontSize={20} />
                    <Typography
                      sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors?.OnSurfaceVariant }}
                    >
                      {t('necropsy_module.attachments')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 3
                    }}
                  >
                    {necropsyData?.transfer_attachment?.map((attachment, index) => (
                      <Box
                        key={attachment?.id || index}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => attachment?.file && window.open(attachment.file, '_blank')}
                      >
                        <MediaCard
                          media={{
                            file: attachment?.file || attachment?.url || attachment?.file_url || '',
                            file_original_name:
                              attachment?.file_original_name || attachment?.name || t('necropsy_module.file'),
                            created_at: attachment?.created_at,
                            type: attachment?.type || attachment?.file_type
                          }}
                          isBorderedCard
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, px: 6, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Icon
                    icon={'mdi-light:message-text'}
                    color={theme.palette.customColors?.OnSurfaceVariant}
                    fontSize={20}
                  />
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '14px', color: theme.palette.customColors?.neutralPrimary }}
                  >
                    {t('necropsy_module.comments')}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  size='small'
                  placeholder={t('necropsy_module.add_your_comment')}
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
                  {necropsyData?.comments_details && necropsyData.comments_details.length > 0 ? (
                    necropsyData?.comments_details?.map(item => (
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
                        <Typography
                          sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors?.neutralPrimary }}
                        >
                          {item?.comments}
                        </Typography>
                        <UserAvatarDetails
                          user_name={`${item?.user_first_name} ${item?.user_last_name}`}
                          profile_image={item?.user_profile_pic}
                          date={item?.commented_on}
                          show_time={true}
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
                backgroundColor:
                  necropsyData?.transfer_details?.transfer_status === 'CANCELED'
                    ? theme.palette.error.light
                    : theme.palette.background.paper,
                zIndex: 1,
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
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
                    backgroundColor: theme.palette.customColors?.OutlineVariant || theme.palette.grey[300],
                    borderRadius: 2
                  }}
                />
              </Box>
              {checklistComments?.length > 0 ? (
                <>
                  <Collapse in={showChecklistComment}>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {groupedChecklistComments?.map((section, sectionIndex) => (
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
                                    {Utility.convertUTCToLocaltime(item?.commented_on || '')}
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography
                      sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors?.neutralSecondary }}
                    >
                      {t('necropsy_module.current_status')} <span> &bull; </span>
                      {Utility.AgeConverter(Utility.convertUTCToLocal(checklistComments?.[0]?.commented_on || ''))}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Typography
                        sx={{ fontSize: '20px', fontWeight: 600, color: theme.palette.customColors?.OnSurfaceVariant }}
                      >
                        {checklistComments?.[0]?.comments}
                      </Typography>
                      <Button onClick={() => setShowChecklistComment(prev => !prev)}>
                        {showChecklistComment ? t('necropsy_module.hide') : t('necropsy_module.see_all')}
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : null}
              {necropsyData?.transfer_details?.transfer_status === 'CANCELED' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Icon icon={'mdi:cancel-bold'} color={theme.palette.customColors?.OnPrimary} />
                  <Typography
                    sx={{ fontWeight: 600, color: theme.palette.customColors?.OnPrimary, alignSelf: 'center' }}
                  >
                    {t('necropsy_module.cancelled')}
                  </Typography>
                </Box>
              ) : !hideAcceptButton && btnStatusData?.show_accept_button === 1 ? (
                <Button
                  variant='contained'
                  fullWidth
                  color='primary'
                  disabled={btnStatusLoading || acceptLoading}
                  onClick={handleAcceptNecropsy}
                  sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.primary.main }}
                >
                  {btnStatusLoading || acceptLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    t('necropsy_module.accept_for_necropsy')
                  )}
                </Button>
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

      <TransferChecklistDrawer
        open={showChecklistDrawer}
        onClose={() => setShowChecklistDrawer(false)}
        transferId={transferId}
      />

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
            width: { xs: '100%', sm: '80%', md: 560 },
            maxHeight: '80vh',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            borderBottomRightRadius: '0px',
            borderBottomLeftRadius: '0px',
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
              {t('necropsy_module.transfer_carcass_list')}
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
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
                  {t('necropsy_module.no_animals_found')}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {animalList.map((animal, index) => (
                  <Box
                    key={animal.animal_id || index}
                    onClick={() => handleAnimalClick(animal?.animal_id)}
                    sx={{
                      background: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50],
                      borderRadius: 1,
                      p: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: animal?.animal_id ? 'pointer' : 'default',
                      '&:hover': animal?.animal_id
                        ? {
                            opacity: 0.85
                          }
                        : {}
                    }}
                  >
                    <AnimalCard data={animal} size={undefined} edit={undefined} valueColor={undefined} />
                    {animal?.transfer_status === 'PENDING' && (
                      <Box
                        sx={{
                          backgroundColor: alpha(theme.palette.error.light, 0.4),
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.error.main
                          }}
                        >
                          {t('necropsy_module.excluded')}
                        </Typography>
                      </Box>
                    )}
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

export default memo(IncomingNecropsyDrawer)
