import React, { useState, useEffect, useCallback, memo, FC } from 'react'
import { Box, Drawer, IconButton, Typography, Skeleton, Tabs, Tab, Divider, Chip, Button, Alert, Tooltip } from '@mui/material'
import { useTheme, alpha, Theme } from '@mui/material/styles'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PhoneIcon from '@mui/icons-material/Phone'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RefreshIcon from '@mui/icons-material/Refresh'
import Icon from 'src/@core/components/icon'
import {
  getLabRequestDetails,
  getLabRequestSamples,
  getLabRequestNotes,
  getLabRequestReports,
  getLabSubTests,
  getLabSampleLogs
} from 'src/lib/api/lab/labDetails'
import NoDataFound from 'src/views/utility/NoDataFound'
import AnimalCard from 'src/views/utility/AnimalCard'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import TestDetailsDrawer from './TestDetailsDrawer'
import SampleDetailsDrawer from './SampleDetailsDrawer'
import Utility from 'src/utility'
import { LabRequestDetailsDrawerProps } from 'src/types/necropsy'

// Extended theme interface for custom colors
interface ExtendedTheme extends Theme {
  palette: Theme['palette'] & {
    customColors?: {
      OnSurfaceVariant?: string
      neutralSecondary?: string
      neutralPrimary?: string
      OnPrimary?: string
      OnSurface?: string
      SurfaceVariant?: string
      displaybgSecondary?: string
      Secondary?: string
      Tertiary?: string
      TertiaryContainer?: string
      antzNotes?: string
      moderateSecondary?: string
      Error?: string
    }
  }
}

// Internal interfaces for lab data structures
interface UserDetails {
  user_name?: string
  user_mobile_number?: string
}

interface EntityItem {
  animal_id?: number
  [key: string]: unknown
}

interface TestDetail {
  tCode?: string
  testName?: string
  testStatus?: string
  sampleName?: string
  subTestCount?: number
}

interface Department {
  isSampleReceived?: boolean
  sampleReceivedBy?: string | null
  sampleReceivedAt?: string | null
  rejectedLab?: boolean
  rejectedBy?: string | null
  rejectedAt?: string | null
  departmentName?: string | null
  rejectedNotes?: string | null
  rejectedReason?: string | null
}

interface SampleDetail {
  sampleId?: number
  sampleName?: string
  overallStatus?: 'received' | 'rejected' | 'pending' | string
  totalTests?: number
  totalTestsCompleted?: number
  departmentCount?: number
  departmentList?: Department[]
  sampleCollectedBy?: string | null
  sampleCollectedAt?: string | null
  rejectedCollectionAt?: string | null
  rejectedCollectionBy?: string | null
  rejected_notes?: string | null
  collectedRejectionReason?: string | null
}

interface LabDetails {
  antz_lab_code?: string
  entity_code?: string
  created_at?: string
  priority?: string
  user_details?: UserDetails
  entity_items?: EntityItem[]
  labRequestNotes?: string
  totalReceivedSamples?: number
  totalSamples?: number
  totalTestsCompleted?: number
  totalTests?: number
  testDetails?: TestDetail[]
}

interface LabNote {
  id?: number
  NoteText?: string
  UserName?: string
  NotesDateTime?: string
}

interface LabReport {
  id?: number
  file?: string
  file_original_name?: string
  file_type?: string
  report_uploaded_by?: string
  report_uploaded_at?: string
}

interface SubTest {
  slNo?: number
  subTestName?: string
  testName?: string
}

interface SampleLogItem {
  [key: string]: unknown
}

interface SampleLogsMap {
  [key: string]: SampleLogItem[]
}

const LabRequestDetailsDrawer: FC<LabRequestDetailsDrawerProps> = ({ open, onClose, requestGuid, labCode }) => {
  const theme = useTheme<ExtendedTheme>()
  const [labDetails, setLabDetails] = useState<LabDetails | null>(null)
  const [samples, setSamples] = useState<SampleDetail[]>([])
  const [notes, setNotes] = useState<LabNote[]>([])
  const [reports, setReports] = useState<LabReport[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [tabLoading, setTabLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<number>(0)

  const [testDialogOpen, setTestDialogOpen] = useState<boolean>(false)
  const [selectedTest, setSelectedTest] = useState<TestDetail | null>(null)
  const [subTests, setSubTests] = useState<SubTest[]>([])
  const [subTestsLoading, setSubTestsLoading] = useState<boolean>(false)

  const [sampleDialogOpen, setSampleDialogOpen] = useState<boolean>(false)
  const [selectedSample, setSelectedSample] = useState<SampleDetail | null>(null)
  const [sampleLogs, setSampleLogs] = useState<SampleLogsMap>({})
  const [sampleLogsLoading, setSampleLogsLoading] = useState<boolean>(false)
  const [sampleDialogTab, setSampleDialogTab] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [showMobileNumber, setShowMobileNumber] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopyNumber = (number: string): void => {
    navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchLabDetails = useCallback(async (): Promise<void> => {
    if (!requestGuid) return
    setLoading(true)
    setError(null)
    try {
      const response = await getLabRequestDetails(requestGuid)
      if (response?.success) {
        setLabDetails(response.data)
      } else {
        setError('Failed to load lab request details')
      }
    } catch (err) {
      console.error('Error fetching lab details:', err)
      setError('Failed to load lab request details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [requestGuid])

  const fetchSamples = useCallback(async (): Promise<void> => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestSamples(requestGuid)
      if (response?.success) {
        setSamples(response.data?.sampleDetails || [])
      }
    } catch (err) {
      console.error('Error fetching samples:', err)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchNotes = useCallback(async (): Promise<void> => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestNotes(requestGuid)
      if (response?.success) {
        setNotes(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchReports = useCallback(async (): Promise<void> => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestReports(requestGuid)
      if (response?.success) {
        setReports(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchSubTests = useCallback(async (tCode: string): Promise<void> => {
    if (!tCode) return
    setSubTestsLoading(true)
    try {
      const response = await getLabSubTests(tCode)
      let list: SubTest[] = []
      if (Array.isArray(response?.data)) {
        list = response.data
      } else if (Array.isArray(response?.data?.subtests)) {
        list = response.data.subtests
      } else if (Array.isArray(response?.data?.testList)) {
        list = response.data.testList
      } else if (Array.isArray(response?.subtests)) {
        list = response.subtests
      }
      setSubTests(list)
    } catch (err) {
      console.error('Error fetching sub tests:', err)
      setSubTests([])
    } finally {
      setSubTestsLoading(false)
    }
  }, [])

  const fetchSampleLogs = useCallback(async (): Promise<void> => {
    if (!requestGuid) return
    setSampleLogsLoading(true)
    try {
      const response = await getLabSampleLogs(requestGuid)
      if (response?.success && response?.data?.logList) {
        setSampleLogs(response.data.logList)
      } else {
        setSampleLogs({})
      }
    } catch (err) {
      console.error('Error fetching sample logs:', err)
      setSampleLogs({})
    } finally {
      setSampleLogsLoading(false)
    }
  }, [requestGuid])

  useEffect(() => {
    if (open && requestGuid) {
      setActiveTab(0)
      fetchLabDetails()
    }
  }, [open, requestGuid, fetchLabDetails])

  useEffect(() => {
    if (!open || !requestGuid) return
    if (activeTab === 1) {
      fetchSamples()
    } else if (activeTab === 2) {
      fetchReports()
    } else if (activeTab === 3) {
      fetchNotes()
    }
  }, [activeTab, open, requestGuid, fetchSamples, fetchReports, fetchNotes])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue)
  }

  const handleTestClick = (test: TestDetail): void => {
    if (test.subTestCount && test.subTestCount > 1) {
      setSelectedTest(test)
      setTestDialogOpen(true)
      if (test.tCode) {
        fetchSubTests(test.tCode)
      }
    }
  }

  const handleSampleClick = (sample: SampleDetail): void => {
    setSelectedSample(sample)
    setSampleDialogTab(0)
    setSampleDialogOpen(true)
  }

  const handleSampleDialogTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setSampleDialogTab(newValue)
    if (newValue === 1) {
      fetchSampleLogs()
    }
  }

  const getTestsForSample = (sampleName?: string): TestDetail[] => {
    if (!labDetails?.testDetails || !sampleName) return []

    return labDetails.testDetails.filter(test => test.sampleName === sampleName)
  }

  const getSummaryBackgroundColor = (): string => {
    const antzNotesColor = theme.palette.customColors?.antzNotes || theme.palette.warning.light
    const primaryColor = theme.palette.primary.main
    const tertiaryContainerColor = theme.palette.customColors?.TertiaryContainer || theme.palette.info.light

    if (!labDetails) return alpha(antzNotesColor, 0.5)

    const allCompleted =
      labDetails.totalReceivedSamples === labDetails.totalSamples &&
      labDetails.totalTestsCompleted === labDetails.totalTests
    const noneStarted = labDetails.totalReceivedSamples === 0 && labDetails.totalTestsCompleted === 0

    if (allCompleted) return alpha(primaryColor, 0.15)
    if (noneStarted) return alpha(tertiaryContainerColor, 0.2)

    return alpha(antzNotesColor, 0.5)
  }

  const getSummaryTextColor = (): string => {
    const moderateSecondaryColor = theme.palette.customColors?.moderateSecondary || theme.palette.warning.dark
    const primaryColor = theme.palette.primary.main
    const tertiaryColor = theme.palette.customColors?.Tertiary || theme.palette.info.main

    if (!labDetails) return moderateSecondaryColor

    const allCompleted =
      labDetails.totalReceivedSamples === labDetails.totalSamples &&
      labDetails.totalTestsCompleted === labDetails.totalTests
    const noneStarted = labDetails.totalReceivedSamples === 0 && labDetails.totalTestsCompleted === 0

    if (allCompleted) return primaryColor
    if (noneStarted) return tertiaryColor

    return moderateSecondaryColor
  }

  const renderLoadingSkeleton = (): React.ReactNode => (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='text' width={150} height={28} />
        </Box>
        <Skeleton variant='text' width={200} height={20} sx={{ mb: 1 }} />
        <Skeleton variant='text' width={180} height={20} sx={{ mb: 2 }} />
        <Skeleton variant='rounded' height={60} sx={{ mb: 2 }} />
      </Box>
      <Skeleton variant='rounded' height={48} sx={{ mb: 3 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant='rounded' height={80} sx={{ mb: 2 }} />
      ))}
    </Box>
  )

  const renderHeader = (): React.ReactNode => {
    const isPriorityLow = (labDetails?.priority || '').toLowerCase() === 'low'

    const priorityColor = isPriorityLow ? theme.palette.customColors?.Secondary : theme.palette.customColors?.Tertiary

    return (
      <Box sx={{ backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ px: 4, pt: 2, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: priorityColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img src={'/images/necropsy/labtest_white.svg'} alt='' />
            </Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              {labDetails?.antz_lab_code || labCode || 'Lab Request'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {labDetails?.entity_code && (
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                Case ID:{' '}
                <Typography
                  component='span'
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.customColors?.OnSurfaceVariant
                  }}
                >
                  {labDetails.entity_code}
                </Typography>
              </Typography>
            )}
            {labDetails?.entity_code && labDetails?.created_at && (
              <Typography sx={{ color: theme.palette.customColors?.neutralSecondary }}>&bull;</Typography>
            )}
            {labDetails?.created_at && (
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                {Utility.convertUtcToLocalReadableDate(labDetails.created_at)} &bull;{' '}
                {Utility.convertUTCToLocaltime(labDetails.created_at)}
              </Typography>
            )}
          </Box>

          {labDetails?.user_details?.user_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                By
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  backgroundColor: theme.palette.customColors?.SurfaceVariant
                }}
              >
                <PersonOutlineIcon
                  sx={{
                    fontSize: 20,
                    color: theme.palette.customColors?.OnSurface
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurface
                  }}
                >
                  {labDetails.user_details.user_name}
                </Typography>
              </Box>
              {labDetails.user_details?.user_mobile_number && (
                <>
                  {/* Mobile view - direct call/sms buttons */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => {
                        const phoneNumber = labDetails.user_details?.user_mobile_number
                        if (phoneNumber) {
                          window.open(`tel:${phoneNumber}`, '_self')
                        }
                      }}
                      sx={{
                        backgroundColor: theme.palette.customColors?.SurfaceVariant,
                        '&:hover': {
                          backgroundColor: theme.palette.customColors?.displaybgSecondary || theme.palette.grey[300]
                        }
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnSurface }} />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => {
                        const phoneNumber = labDetails.user_details?.user_mobile_number
                        if (phoneNumber) {
                          window.open(`sms:${phoneNumber}`, '_self')
                        }
                      }}
                      sx={{
                        backgroundColor: theme.palette.customColors?.SurfaceVariant,
                        '&:hover': {
                          backgroundColor: theme.palette.customColors?.displaybgSecondary || theme.palette.grey[300]
                        }
                      }}
                    >
                      <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnSurface }} />
                    </IconButton>
                  </Box>

                  {/* Desktop view - expandable phone number with copy */}
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => setShowMobileNumber(prev => !prev)}
                      sx={{
                        backgroundColor: theme.palette.customColors?.SurfaceVariant,
                        '&:hover': {
                          backgroundColor: theme.palette.customColors?.displaybgSecondary || theme.palette.grey[300]
                        }
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnSurface }} />
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
                          color: theme.palette.customColors?.OnSurface,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {labDetails.user_details?.user_mobile_number}
                      </Typography>
                      <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                        <IconButton
                          size='small'
                          onClick={() => handleCopyNumber(labDetails.user_details?.user_mobile_number || '')}
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.customColors?.displaybgSecondary || theme.palette.grey[300]
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
          )}
        </Box>

        <Divider />

        {labDetails?.entity_items && labDetails.entity_items.length > 0 && (
          <>
            <Box sx={{ px: 4 }}>
              {labDetails.entity_items.map((animal, index) => (
                <Box
                  key={animal.animal_id || index}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: theme.palette.customColors?.OnPrimary,
                    mb: index < labDetails.entity_items!.length - 1 ? 2 : 0
                  }}
                >
                  <AnimalCard data={animal} size={undefined} edit={undefined} valueColor={undefined} />
                </Box>
              ))}
            </Box>
          </>
        )}

        {labDetails?.labRequestNotes && (
          <>
            <Box
              sx={{
                mx: 4,
                my: 2,
                px: 3,
                py: '12px',
                borderRadius: '6px',
                backgroundColor: alpha(theme.palette.customColors?.antzNotes || theme.palette.warning.light, 0.4),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Icon
                icon='mdi:note-text'
                fontSize={18}
                color={theme.palette.customColors?.moderateSecondary || theme.palette.warning.dark}
              />
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
                noWrap
              >
                {labDetails.labRequestNotes}
              </Typography>
            </Box>
            <Divider />
          </>
        )}
      </Box>
    )
  }

  const renderSummaryCards = (): React.ReactNode => (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        p: 3,
        backgroundColor: getSummaryBackgroundColor()
      }}
    >
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: getSummaryTextColor() }}>
          {labDetails?.totalTestsCompleted || 0} / {labDetails?.totalTests || 0}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors?.neutralPrimary
          }}
        >
          Completed
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: getSummaryTextColor() }}>
          {labDetails?.totalReceivedSamples || 0} / {labDetails?.totalSamples || 0}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors?.neutralPrimary
          }}
        >
          Sample Received
        </Typography>
      </Box>
    </Box>
  )

  const renderTestCard = (test: TestDetail, index: number, clickable: boolean = true): React.ReactNode => {
    const primaryColor = theme.palette.primary.main
    const moderateSecondaryColor = theme.palette.customColors?.moderateSecondary || theme.palette.warning.dark
    const errorColor = theme.palette.customColors?.Error || theme.palette.error.main

    const statusColor =
      test.testStatus === 'Completed'
        ? primaryColor
        : test.testStatus === 'In Progress'
        ? moderateSecondaryColor
        : errorColor

    const hasSubTests = (test.subTestCount || 0) > 1

    return (
      <Box
        key={test.tCode || index}
        onClick={() => clickable && hasSubTests && handleTestClick(test)}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '4px',
          mb: 2,
          overflow: 'hidden',
          cursor: clickable && hasSubTests ? 'pointer' : 'default'
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: statusColor,
                mb: 0.5
              }}
            >
              {test.testStatus}
            </Typography>
            <Typography
              sx={{
                fontSize: '15px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant,
                mb: 0.5
              }}
            >
              {test.testName}
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.neutralSecondary
              }}
            >
              {test.sampleName}
            </Typography>
          </Box>
          {hasSubTests && <ChevronRightIcon sx={{ color: theme.palette.grey[400], ml: 1 }} />}
        </Box>
      </Box>
    )
  }

  const renderSampleCard = (sample: SampleDetail, index: number): React.ReactNode => {
    const primaryColor = theme.palette.primary.main
    const errorColor = theme.palette.customColors?.Error || theme.palette.error.main
    const tertiaryColor = theme.palette.customColors?.Tertiary || theme.palette.info.main
    const onPrimaryColor = theme.palette.customColors?.OnPrimary || theme.palette.common.white

    const statusBgColor =
      sample.overallStatus === 'received'
        ? primaryColor
        : sample.overallStatus === 'rejected'
        ? errorColor
        : 'transparent'

    const statusTextColor =
      sample.overallStatus === 'received' || sample.overallStatus === 'rejected' ? onPrimaryColor : tertiaryColor

    const departmentList: Department[] = Array.isArray(sample?.departmentList) ? sample.departmentList : []

    let collected_by: string | null = sample?.sampleCollectedBy ?? null
    let collected_at: string | null = sample?.sampleCollectedAt ?? null
    let rejected_at: string | null = sample?.rejectedCollectionAt ?? null
    let rejected_by: string | null = sample?.rejectedCollectionBy ?? null
    let rejected_lab: string = 'Lab'
    let rejected_notes: string | null = sample?.rejected_notes ?? null
    let rejected_reason: string | null = sample?.collectedRejectionReason ?? null

    if (sample?.overallStatus === 'received' && departmentList.length) {
      const receivedDepartment = departmentList.find(department => department?.isSampleReceived)
      if (receivedDepartment) {
        collected_by = receivedDepartment?.sampleReceivedBy ?? collected_by
        collected_at = receivedDepartment?.sampleReceivedAt ?? collected_at
      }
    } else if (sample?.overallStatus === 'rejected') {
      const rejectionDepartment = departmentList.find(department => department?.rejectedLab)
      if (rejectionDepartment) {
        collected_by = rejectionDepartment?.rejectedBy ?? rejected_by
        collected_at = rejectionDepartment?.rejectedAt ?? rejected_at
        rejected_lab = rejectionDepartment?.departmentName ?? rejected_lab
        rejected_notes = rejectionDepartment?.rejectedNotes ?? rejected_notes
        rejected_reason = rejectionDepartment?.rejectedReason ?? rejected_reason
      } else {
        collected_by = rejected_by
        collected_at = rejected_at
      }
    }

    return (
      <Box
        key={sample.sampleId || index}
        onClick={() => handleSampleClick(sample)}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '4px',
          mx: 3,
          mb: 2,
          p: 3,
          cursor: 'pointer'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnSurfaceVariant
            }}
          >
            {sample.sampleName}
          </Typography>
          {sample.overallStatus && (
            <Chip
              label={sample.overallStatus.charAt(0).toUpperCase() + sample.overallStatus.slice(1)}
              size='small'
              sx={{
                backgroundColor: statusBgColor,
                color: statusTextColor,
                fontWeight: 600,
                fontSize: '12px',
                height: 24,
                border: sample.overallStatus === 'pending' ? `1px solid ${tertiaryColor}` : 'none'
              }}
            />
          )}
        </Box>

        {sample.overallStatus === 'rejected' && (
          <Box
            sx={{
              backgroundColor: alpha(theme.palette.error.light, 0.1),
              borderRadius: '6px',
              p: 2,
              mb: 2
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.error.dark,
                mb: 0.5
              }}
            >
              {rejected_lab ? `Rejected by ${rejected_lab}` : 'Rejected by Lab'}
            </Typography>
            {rejected_reason && (
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.palette.error.dark
                }}
              >
                {rejected_reason}
              </Typography>
            )}
            {rejected_notes && (
              <>
                <Divider sx={{ my: 1, borderColor: alpha(theme.palette.error.main, 0.2) }} />
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme.palette.error.dark,
                    fontStyle: 'italic'
                  }}
                >
                  {rejected_notes}
                </Typography>
              </>
            )}
          </Box>
        )}

        {(sample.overallStatus === 'received' || sample.overallStatus === 'rejected') && collected_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonOutlineIcon sx={{ fontSize: 16, color: theme.palette.customColors?.neutralSecondary }} />
              <Typography
                sx={{
                  fontSize: '12px',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                {collected_by}
              </Typography>
            </Box>
            {collected_at && (
              <>
                <Typography sx={{ color: theme.palette.customColors?.neutralSecondary, fontSize: '12px' }}>
                  &bull;
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme.palette.customColors?.neutralSecondary
                  }}
                >
                  {Utility.convertUtcToLocalReadableDate(collected_at)} &bull;{' '}
                  {Utility.convertUTCToLocaltime(collected_at)}
                </Typography>
              </>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              Tests:
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color:
                  sample.totalTestsCompleted === sample.totalTests
                    ? primaryColor
                    : (sample.totalTestsCompleted || 0) > 0
                    ? theme.palette.customColors?.moderateSecondary
                    : errorColor
              }}
            >
              {sample.totalTestsCompleted}/{sample.totalTests}
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              Completed
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.neutralSecondary
              }}
            >
              Departments{' '}
              <Typography
                component='span'
                sx={{
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {sample.departmentCount || 0}
              </Typography>
            </Typography>
            <ChevronRightIcon sx={{ color: theme.palette.grey[400] }} />
          </Box>
        </Box>
      </Box>
    )
  }

  const renderNoteCard = (note: LabNote, index: number): React.ReactNode => (
    <Box
      key={note.id || index}
      sx={{
        backgroundColor: theme.palette.customColors?.antzNotes || theme.palette.warning.light,
        borderRadius: '8px',
        mx: 3,
        mb: 2,
        p: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      {note.NoteText && (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors?.OnSurfaceVariant,
            mb: 2
          }}
        >
          {note.NoteText}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {note.UserName && (
          <Typography
            sx={{
              fontSize: '13px',
              color: theme.palette.customColors?.neutralSecondary
            }}
          >
            {note.UserName}
          </Typography>
        )}
        {note.UserName && note.NotesDateTime && (
          <Typography sx={{ color: theme.palette.customColors?.neutralSecondary }}>&bull;</Typography>
        )}
        {note.NotesDateTime && (
          <Typography
            sx={{
              fontSize: '13px',
              color: theme.palette.customColors?.neutralSecondary
            }}
          >
            {Utility.convertUtcToLocalReadableDate(note.NotesDateTime)} &bull;{' '}
            {Utility.convertUTCToLocaltime(note.NotesDateTime)}
          </Typography>
        )}
      </Box>
    </Box>
  )

  const renderReportCard = (report: LabReport, index: number): React.ReactNode => (
    <NewMediaCard
      key={report.id || index}
      fileUrl={report.file}
      fileName={report.file_original_name || 'Report'}
      fileType={report.file_type}
      width='100%'
      showTitle={true}
      user={
        report.report_uploaded_by || report.report_uploaded_at
          ? {
              created_at: report.report_uploaded_at,
              user_profile: {
                user_full_name: report.report_uploaded_by || ''
              }
            }
          : undefined
      }
      cardStyle={{
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        minWidth: 0
      }}
      height={220}
      onTitleIconClick={undefined}
      onDeleteaction={undefined}
      ondownloadaction={undefined}
    />
  )

  const renderTabContent = (): React.ReactNode => {
    if (tabLoading && activeTab !== 0) {
      return (
        <Box sx={{ py: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant='rounded' height={80} sx={{ mx: 3, mb: 2 }} />
          ))}
        </Box>
      )
    }

    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ pb: 3 }}>
            {renderSummaryCards()}
            {labDetails?.testDetails && labDetails.testDetails.length > 0 ? (
              <Box sx={{ mt: 3, mx: 3 }}>
                {labDetails.testDetails.map((test, index) => renderTestCard(test, index))}
              </Box>
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound />
              </Box>
            )}
          </Box>
        )
      case 1:
        return (
          <Box sx={{ py: 3 }}>
            {samples.length > 0 ? (
              samples.map((sample, index) => renderSampleCard(sample, index))
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound />
              </Box>
            )}
          </Box>
        )
      case 2:
        return (
          <Box sx={{ py: 3, px: 4, overflow: 'hidden' }}>
            {reports.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                  '& > *': {
                    minWidth: 0
                  }
                }}
              >
                {reports.map((report, index) => renderReportCard(report, index))}
              </Box>
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound />
              </Box>
            )}
          </Box>
        )
      case 3:
        return (
          <Box sx={{ py: 3 }}>
            {notes.length > 0 ? (
              notes.map((note, index) => renderNoteCard(note, index))
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound />
              </Box>
            )}
          </Box>
        )
      default:
        return null
    }
  }

  const handleTestClickFromSample = (test: TestDetail): void => {
    if (test.subTestCount && test.subTestCount > 1) {
      setSelectedTest(test)
      setTestDialogOpen(true)
      if (test.tCode) {
        fetchSubTests(test.tCode)
      }
    }
  }

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
              backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '20px',
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              Lab Request Details
            </Typography>
            <IconButton onClick={onClose} sx={{ color: theme.palette.customColors?.OnSurfaceVariant }}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            renderLoadingSkeleton()
          ) : error ? (
            <Box sx={{ py: 10, px: 4, textAlign: 'center' }}>
              <Alert
                severity='error'
                sx={{ mb: 3, justifyContent: 'center' }}
                action={
                  <Button color='error' size='small' startIcon={<RefreshIcon />} onClick={fetchLabDetails}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
              <Button variant='outlined' onClick={onClose} sx={{ mt: 2 }}>
                Go Back
              </Button>
            </Box>
          ) : labDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
              {renderHeader()}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.background.paper }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant='scrollable'
                  scrollButtons='auto'
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '14px',
                      minWidth: 100
                    },
                    '& .Mui-selected': {
                      color: theme.palette.primary.main
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                >
                  <Tab label='Tests' />
                  <Tab label='Samples' />
                  <Tab label='Lab Reports' />
                  <Tab label='Notes' />
                </Tabs>
              </Box>
              <Box sx={{ backgroundColor: theme.palette.background.default, flex: 1 }}>{renderTabContent()}</Box>
            </Box>
          ) : (
            <Box sx={{ py: 10 }}>
              <NoDataFound />
            </Box>
          )}
        </Box>
      </Drawer>

      <TestDetailsDrawer
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        selectedTest={selectedTest}
        subTests={subTests}
        loading={subTestsLoading}
      />

      <SampleDetailsDrawer
        open={sampleDialogOpen}
        onClose={() => setSampleDialogOpen(false)}
        selectedSample={selectedSample}
        activeTab={sampleDialogTab}
        onTabChange={handleSampleDialogTabChange}
        tests={getTestsForSample(selectedSample?.sampleName)}
        sampleLogs={sampleLogs}
        logsLoading={sampleLogsLoading}
        onTestClick={handleTestClickFromSample}
      />
    </>
  )
}

export default memo(LabRequestDetailsDrawer)
