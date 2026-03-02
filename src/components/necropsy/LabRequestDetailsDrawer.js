import React, { useState, useEffect, useCallback, memo } from 'react'
import { Box, Drawer, IconButton, Typography, Skeleton, Tabs, Tab, Divider, Chip, Button, Alert } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
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

const LabRequestDetailsDrawer = ({ open, onClose, requestGuid, labCode }) => {
  const theme = useTheme()
  const [labDetails, setLabDetails] = useState(null)
  const [samples, setSamples] = useState([])
  const [notes, setNotes] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [tabLoading, setTabLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [subTests, setSubTests] = useState([])
  const [subTestsLoading, setSubTestsLoading] = useState(false)

  const [sampleDialogOpen, setSampleDialogOpen] = useState(false)
  const [selectedSample, setSelectedSample] = useState(null)
  const [sampleLogs, setSampleLogs] = useState({})
  const [sampleLogsLoading, setSampleLogsLoading] = useState(false)
  const [sampleDialogTab, setSampleDialogTab] = useState(0)
  const [error, setError] = useState(null)

  const fetchLabDetails = useCallback(async () => {
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
    } catch (error) {
      console.error('Error fetching lab details:', error)
      setError('Failed to load lab request details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [requestGuid])

  const fetchSamples = useCallback(async () => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestSamples(requestGuid)
      if (response?.success) {
        setSamples(response.data?.sampleDetails || [])
      }
    } catch (error) {
      console.error('Error fetching samples:', error)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchNotes = useCallback(async () => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestNotes(requestGuid)
      if (response?.success) {
        setNotes(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchReports = useCallback(async () => {
    if (!requestGuid) return
    setTabLoading(true)
    try {
      const response = await getLabRequestReports(requestGuid)
      if (response?.success) {
        setReports(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setTabLoading(false)
    }
  }, [requestGuid])

  const fetchSubTests = useCallback(async tCode => {
    if (!tCode) return
    setSubTestsLoading(true)
    try {
      const response = await getLabSubTests(tCode)
      let list = []
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
    } catch (error) {
      console.error('Error fetching sub tests:', error)
      setSubTests([])
    } finally {
      setSubTestsLoading(false)
    }
  }, [])

  const fetchSampleLogs = useCallback(async () => {
    if (!requestGuid) return
    setSampleLogsLoading(true)
    try {
      const response = await getLabSampleLogs(requestGuid)
      if (response?.success && response?.data?.logList) {
        setSampleLogs(response.data.logList)
      } else {
        setSampleLogs({})
      }
    } catch (error) {
      console.error('Error fetching sample logs:', error)
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleTestClick = test => {
    if (test.subTestCount > 1) {
      setSelectedTest(test)
      setTestDialogOpen(true)
      fetchSubTests(test.tCode)
    }
  }

  const handleSampleClick = sample => {
    setSelectedSample(sample)
    setSampleDialogTab(0)
    setSampleDialogOpen(true)
  }

  const handleSampleDialogTabChange = (event, newValue) => {
    setSampleDialogTab(newValue)
    if (newValue === 1) {
      fetchSampleLogs()
    }
  }

  const getTestsForSample = sampleName => {
    if (!labDetails?.testDetails || !sampleName) return []

    return labDetails.testDetails.filter(test => test.sampleName === sampleName)
  }

  const getSummaryBackgroundColor = () => {
    const antzNotesColor = theme.palette.customColors?.antzNotes
    const primaryColor = theme.palette.primary.main
    const tertiaryContainerColor = theme.palette.customColors?.TertiaryContainer

    if (!labDetails) return alpha(antzNotesColor, 0.5) // notes with 50% opacity

    const allCompleted =
      labDetails.totalReceivedSamples === labDetails.totalSamples &&
      labDetails.totalTestsCompleted === labDetails.totalTests
    const noneStarted = labDetails.totalReceivedSamples === 0 && labDetails.totalTestsCompleted === 0

    // Use exact mobile colors with opacity (matching mobile backgroundColorCheck)
    if (allCompleted) return alpha(primaryColor, 0.15) // primary with 15% opacity
    if (noneStarted) return alpha(tertiaryContainerColor, 0.2) // tertiaryContainer with 20% opacity

    return alpha(antzNotesColor, 0.5) // notes with 50% opacity (partial completion)
  }

  const getSummaryTextColor = () => {
    const moderateSecondaryColor = theme.palette.customColors?.moderateSecondary
    const primaryColor = theme.palette.primary.main
    const tertiaryColor = theme.palette.customColors?.Tertiary

    if (!labDetails) return moderateSecondaryColor // moderateSecondary

    const allCompleted =
      labDetails.totalReceivedSamples === labDetails.totalSamples &&
      labDetails.totalTestsCompleted === labDetails.totalTests
    const noneStarted = labDetails.totalReceivedSamples === 0 && labDetails.totalTestsCompleted === 0

    // Use exact mobile colors (matching mobile textColorCheck)
    if (allCompleted) return primaryColor // primary
    if (noneStarted) return tertiaryColor // tertiary

    return moderateSecondaryColor // moderateSecondary (partial completion)
  }

  const renderLoadingSkeleton = () => (
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

  const renderHeader = () => {
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
              <img src={'/images/necropsy/labtest_white.svg'} />
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
              {/* Contact Actions */}
              <IconButton
                size='small'
                onClick={() => {
                  const phoneNumber = labDetails.user_details.user_mobile_number
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
                  const phoneNumber = labDetails.user_details.user_mobile_number
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
          )}
        </Box>

        <Divider />

        {labDetails?.entity_items?.length > 0 && (
          <>
            <Box sx={{ px: 4 }}>
              {labDetails.entity_items.map((animal, index) => (
                <Box
                  key={animal.animal_id || index}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: theme.palette.customColors?.OnPrimary,
                    mb: index < labDetails.entity_items.length - 1 ? 2 : 0
                  }}
                >
                  <AnimalCard data={animal} />
                </Box>
              ))}
            </Box>
            {/* <Divider /> */}
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
                backgroundColor: alpha(theme.palette.customColors.antzNotes, 0.4),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Icon icon='mdi:note-text' fontSize={18} color={theme.palette.customColors.moderateSecondary} />
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.customColors.OnSurfaceVariant
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

  const renderSummaryCards = () => (
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

  const renderTestCard = (test, index, clickable = true) => {
    const primaryColor = theme.palette.primary.main
    const moderateSecondaryColor = theme.palette.customColors?.moderateSecondary
    const errorColor = theme.palette.customColors?.Error

    const statusColor =
      test.testStatus === 'Completed'
        ? primaryColor
        : test.testStatus === 'In Progress'
        ? moderateSecondaryColor
        : errorColor

    const hasSubTests = test.subTestCount > 1

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

  const renderSampleCard = (sample, index) => {
    const primaryColor = theme.palette.primary.main
    const errorColor = theme.palette.customColors?.Error
    const tertiaryColor = theme.palette.customColors?.Tertiary
    const onPrimaryColor = theme.palette.customColors?.OnPrimary

    const statusBgColor =
      sample.overallStatus === 'received'
        ? primaryColor
        : sample.overallStatus === 'rejected'
        ? errorColor
        : 'transparent'

    const statusTextColor =
      sample.overallStatus === 'received' || sample.overallStatus === 'rejected' ? onPrimaryColor : tertiaryColor

    // Process departmentList to extract collection/rejection metadata (like mobile)
    const departmentList = Array.isArray(sample?.departmentList) ? sample.departmentList : []

    let collected_by = sample?.sampleCollectedBy ?? null
    let collected_at = sample?.sampleCollectedAt ?? null
    let rejected_at = sample?.rejectedCollectionAt ?? null
    let rejected_by = sample?.rejectedCollectionBy ?? null
    let rejected_lab = 'Lab'
    let rejected_notes = sample?.rejected_notes ?? null
    let rejected_reason = sample?.collectedRejectionReason ?? null

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

        {/* Rejection Details - Enhanced like mobile */}
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

        {/* Collection Metadata - For received or rejected samples */}
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
                    : sample.totalTestsCompleted > 0
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

  const renderNoteCard = (note, index) => (
    <Box
      key={note.id || index}
      sx={{
        backgroundColor: theme.palette.customColors.antzNotes,
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

  const renderReportCard = (report, index) => (
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
          : null
      }
      cardStyle={{
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        minWidth: 0
      }}
      height={220}
    />
  )

  const renderTabContent = () => {
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
            {labDetails?.testDetails?.length > 0 ? (
              <Box sx={{ mt: 3, mx: 3 }}>
                {labDetails.testDetails.map((test, index) => renderTestCard(test, index))}
              </Box>
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound message='No tests found' />
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
                <NoDataFound message='No samples found' />
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
                <NoDataFound message='No lab reports found' />
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
                <NoDataFound message='No notes found' />
              </Box>
            )}
          </Box>
        )
      default:
        return null
    }
  }

  const handleTestClickFromSample = test => {
    if (test.subTestCount > 1) {
      setSelectedTest(test)
      setTestDialogOpen(true)
      fetchSubTests(test.tCode)
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
              <NoDataFound message='No lab request details found' />
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
