import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AddQRRequestDrawer from 'src/views/pages/settings/AddQRRequestDrawer'
import Toaster from 'src/components/Toaster'
import { getJobStats, getJobsList, cancelJob, triggerJob, createJobRequest } from 'src/lib/api/settings'
import Utility from 'src/utility'
import moment from 'moment'

// Constants
const JOB_TYPE = 'qr_export_enclosure'
const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: STATUS.PENDING, label: 'Pending' },
  { value: STATUS.PROCESSING, label: 'Processing' },
  { value: STATUS.COMPLETED, label: 'Completed' },
  { value: STATUS.FAILED, label: 'Failed' },
  { value: STATUS.CANCELLED, label: 'Cancelled' }
]

const INITIAL_STATS = {
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
  total: 0
}

// StatCard Component
const StatCard = ({ count, label, color, theme }) => (
  <Box
    sx={{
      flex: 1,
      p: 3,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '8px',
      backgroundColor: theme.palette.background.paper
    }}
  >
    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: color || theme.palette.text.primary }}>
      {count}
    </Typography>
    <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>{label}</Typography>
  </Box>
)

// ActionCell Component
const ActionCell = ({ row, onTrigger, onCancel, onDownload, actionLoadingId }) => {
  const status = row.status?.toLowerCase()
  const downloadUrl = row.result?.download_url
  const jobId = row.job_id || row.id
  const isLoading = actionLoadingId === jobId

  if (status === STATUS.PENDING) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size='small'
          color='primary'
          onClick={() => onTrigger(jobId)}
          disabled={isLoading}
          title='Start Job'
        >
          {isLoading ? <CircularProgress size={18} /> : <Icon icon='mdi:play' fontSize={20} />}
        </IconButton>
        <IconButton size='small' color='error' onClick={() => onCancel(jobId)} disabled={isLoading} title='Cancel'>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>
    )
  }

  if (status === STATUS.PROCESSING) {
    return (
      <IconButton size='small' color='error' onClick={() => onCancel(jobId)} disabled={isLoading} title='Cancel'>
        {isLoading ? <CircularProgress size={18} /> : <Icon icon='mdi:close' fontSize={20} />}
      </IconButton>
    )
  }

  if (downloadUrl) {
    return (
      <IconButton size='small' onClick={() => onDownload(downloadUrl)} title='Download'>
        <Icon icon='mdi:download' fontSize={20} />
      </IconButton>
    )
  }

  return null
}

const RequestEnclosureQRCode = () => {
  const theme = useTheme()

  // State
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [statsData, setStatsData] = useState(INITIAL_STATS)
  const [jobsData, setJobsData] = useState([])
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [cancelDialog, setCancelDialog] = useState({ open: false, jobId: null })

  // API Calls
  const fetchStats = useCallback(async () => {
    try {
      const response = await getJobStats({ job_type: JOB_TYPE })
      if (response?.success && response?.data) {
        setStatsData(response.data)
      }
    } catch (error) {
      console.error('Error fetching job stats:', error)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        job_type: JOB_TYPE,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(filterType !== 'all' && { status: filterType })
      }
      const response = await getJobsList(params)
      if (response?.success && response?.data) {
        setJobsData(response.data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [filterType, paginationModel])

  const refreshData = useCallback(() => {
    fetchStats()
    fetchJobs()
  }, [fetchStats, fetchJobs])

  // Effects
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Handlers
  const handleDownload = useCallback(url => {
    if (url) window.open(url, '_blank')
  }, [])

  const handleTrigger = useCallback(
    async jobId => {
      setActionLoadingId(jobId)
      try {
        const response = await triggerJob(jobId)
        if (response?.success) {
          Toaster({ type: 'success', message: 'Job triggered successfully' })
          refreshData()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to trigger job' })
        }
      } catch (error) {
        console.error('Error triggering job:', error)
        Toaster({ type: 'error', message: 'Failed to trigger job' })
      } finally {
        setActionLoadingId(null)
      }
    },
    [refreshData]
  )

  const openCancelDialog = useCallback(jobId => {
    setCancelDialog({ open: true, jobId })
  }, [])

  const closeCancelDialog = useCallback(() => {
    setCancelDialog({ open: false, jobId: null })
  }, [])

  const handleConfirmCancel = useCallback(async () => {
    const { jobId } = cancelDialog
    closeCancelDialog()
    setActionLoadingId(jobId)
    try {
      const response = await cancelJob(jobId)
      if (response?.success) {
        Toaster({ type: 'success', message: 'Request cancelled successfully' })
        refreshData()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to cancel request' })
      }
    } catch (error) {
      console.error('Error cancelling job:', error)
      Toaster({ type: 'error', message: 'Failed to cancel request' })
    } finally {
      setActionLoadingId(null)
    }
  }, [cancelDialog, closeCancelDialog, refreshData])

  const handleSubmitData = useCallback(
    async formData => {
      setSubmitLoading(true)
      try {
        const payload = {
          job_type: JOB_TYPE,
          payload: {
            filter_type: formData.request_type === 'all' ? 'zoo' : formData.request_type
          }
        }

        if (formData.request_type === 'enclosure' && formData.enclosure_ids?.length > 0) {
          payload.payload.filter_ids = formData.enclosure_ids.map(id => Number(id))
        } else if (formData.request_type === 'site' && formData.site_id) {
          payload.payload.filter_id = Number(formData.site_id)
        } else if (formData.request_type === 'section' && formData.section_id) {
          payload.payload.filter_id = Number(formData.section_id)
        }

        const response = await createJobRequest(payload)
        if (response?.success) {
          Toaster({ type: 'success', message: 'Request submitted successfully' })
          setOpenDrawer(false)
          refreshData()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to submit request' })
        }
      } catch (error) {
        console.error('Error submitting request:', error)
        Toaster({ type: 'error', message: 'Failed to submit request' })
      } finally {
        setSubmitLoading(false)
      }
    },
    [refreshData]
  )

  // Helper functions
  const getStatusStyles = useCallback(
    status => {
      const styles = {
        [STATUS.COMPLETED]: {
          backgroundColor: theme.palette.customColors?.successLight || '#E8F5E9',
          color: theme.palette.success.main || '#4CAF50'
        },
        [STATUS.PROCESSING]: {
          backgroundColor: theme.palette.customColors?.infoLight || '#E3F2FD',
          color: theme.palette.info.main || '#2196F3'
        },
        [STATUS.PENDING]: {
          backgroundColor: theme.palette.customColors?.warningLight || '#FFF8E1',
          color: theme.palette.warning.dark || '#F57C00'
        },
        [STATUS.FAILED]: {
          backgroundColor: theme.palette.customColors?.errorLight || '#FFEBEE',
          color: theme.palette.error.main || '#F44336'
        }
      }
      return (
        styles[status] || {
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.text.primary
        }
      )
    },
    [theme]
  )

  // Table columns
  const columns = [
    {
      field: 'job_id',
      headerName: 'Request Id',
      flex: 0.8,
      minWidth: 150,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {row.job_id || row.id ? `REQ-${row.job_id || row.id}` : '-'}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
      minWidth: 120,
      renderCell: ({ row }) => {
        const status = row.status || STATUS.PENDING
        const styles = getStatusStyles(status)
        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size='small'
            sx={{
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              fontWeight: 500,
              fontSize: '12px',
              textTransform: 'capitalize'
            }}
          />
        )
      }
    },
    {
      field: 'created_at',
      headerName: 'Created On',
      flex: 0.6,
      minWidth: 150,
      renderCell: ({ row }) => {
        const dateTime = row.created_at || row.created
        if (!dateTime) {
          return (
            <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>-</Typography>
          )
        }

        const date = Utility.convertUtcToLocalReadableDate(dateTime)
        const time = Utility.convertUTCToLocaltime(dateTime)
        const status = row.status?.toLowerCase()
        const showElapsed = status === STATUS.PENDING || status === STATUS.PROCESSING

        return (
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              {date}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              {time}
              {showElapsed && ` (${moment.utc(dateTime).local().fromNow()})`}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <ActionCell
          row={row}
          onTrigger={handleTrigger}
          onCancel={openCancelDialog}
          onDownload={handleDownload}
          actionLoadingId={actionLoadingId}
        />
      )
    }
  ]

  const tableData = jobsData.map(job => ({ ...job, id: job.job_id || job.id }))

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.customColors?.primaryLight || '#E3F2FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon icon='mdi:qrcode' fontSize={28} color={theme.palette.primary.main} />
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  QR Code Generator
                </Typography>
                <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
                  Manage QR codes for zoo locations
                </Typography>
              </Box>
            </Box>
            <Button variant='contained' startIcon={<Icon icon='mdi:plus' />} onClick={() => setOpenDrawer(true)}>
              Add New Request
            </Button>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ display: 'flex', gap: 3, mb: 5 }}>
            <StatCard count={statsData.pending} label='Pending' theme={theme} />
            <StatCard count={statsData.processing} label='Processing' theme={theme} />
            <StatCard count={statsData.completed} label='Completed' color={theme.palette.success.main} theme={theme} />
            <StatCard count={statsData.failed} label='Failed' color={theme.palette.error.main} theme={theme} />
            <StatCard count={statsData.cancelled} label='Cancelled' color={theme.palette.warning.main} theme={theme} />
            <StatCard count={statsData.total} label='Total Requests' theme={theme} />
          </Box>

          {/* Filter Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='mdi:filter-variant' fontSize={20} color={theme.palette.text.secondary} />
              <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>Filter by type:</Typography>
            </Box>
            <TextField
              select
              size='small'
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {FILTER_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Table */}
          <CommonTable
            columns={columns}
            indexedRows={tableData}
            total={statsData.total}
            loading={loading}
            paginationModel={paginationModel}
            setPaginationModel={model => setPaginationModel({ page: model.page, pageSize: model.pageSize })}
            pageSizeOptions={[10, 25, 50]}
            rowHeight={70}
          />
        </CardContent>
      </Card>

      {/* Add New Request Drawer */}
      {openDrawer && (
        <AddQRRequestDrawer
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          handleSubmitData={handleSubmitData}
          loading={submitLoading}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onClose={closeCancelDialog}>
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} color='inherit'>
            No, Keep It
          </Button>
          <Button onClick={handleConfirmCancel} color='error' variant='contained'>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RequestEnclosureQRCode
