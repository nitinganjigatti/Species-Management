'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'
import { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, VMS_STATUS_OPTIONS } from 'src/constants/vms'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import { useReportVisitors } from 'src/hooks/vms/useVmsReports'
import { exportReportCsv } from 'src/lib/api/vms'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import CommonTable from 'src/views/table/data-grid/CommonTable'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

const formatTime = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)

  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── StatusChip ────────────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const cfg = VMS_STATUS_CONFIG[status] ?? { label: status, color: '#616161', bgColor: '#F0F0F0' }

  return (
    <Chip
      label={cfg.label}
      size='small'
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        backgroundColor: cfg.bgColor,
        color: cfg.color,
      }}
    />
  )
}

// ─── Filter state ──────────────────────────────────────────────────────────────

interface ReportFilters {
  startDate: string
  endDate: string
  status: string
  siteId: string
}

const SITE_OPTIONS = [
  { value: '', label: 'All Sites' },
  { value: '1', label: 'Main Gate' },
  { value: '2', label: 'North Entry' },
  { value: '3', label: 'Admin Block' },
  { value: '4', label: 'African Savanna' },
]

// ─── Main Component ────────────────────────────────────────────────────────────

const VisitorReports = () => {
  const theme = useTheme()
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    status: '',
    siteId: '',
  })
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const formattedStart = Utility.formatDate(startDate)
      const formattedEnd = Utility.formatDate(endDate)
      setDateRange({ startDate: formattedStart, endDate: formattedEnd })
      setFilters(prev => ({ ...prev, startDate: formattedStart, endDate: formattedEnd }))
    } else {
      setDateRange({ startDate: '', endDate: '' })
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }))
    }
  }

  const handleClear = () => {
    setFilters({ startDate: '', endDate: '', status: '', siteId: '' })
    setDateRange({ startDate: '', endDate: '' })
  }

  const hasActiveFilters = !!(filters.startDate || filters.endDate || filters.status || filters.siteId)

  const reportParams = {
    ...(filters.startDate && { start_date: filters.startDate }),
    ...(filters.endDate && { end_date: filters.endDate }),
    ...(filters.status && { status: filters.status }),
  }

  const { data: visitorsResponse, isLoading } = useReportVisitors(reportParams)
  const visitors = visitorsResponse?.data ?? []

  const handleExportCsv = async () => {
    try {
      const blob = await exportReportCsv(reportParams)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `visitors_report_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleExportPdf = () => {
    toast.success('PDF export started')
  }

  const columns: GridColDef[] = [
    {
      field: 'pass_id',
      headerName: 'Pass ID',
      width: 120,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          variant='caption'
          title={value}
          sx={{
            fontFamily: "'Courier New', Courier, monospace",
            color: theme.palette.customColors.neutralSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          {String(value).slice(0, 8)}...
        </Typography>
      ),
    },
    {
      field: 'visitor_name',
      headerName: 'Visitor Name',
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            color: theme.palette.customColors.OnSurfaceVariant,
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: 'visitor_contact',
      headerName: 'Contact',
      width: 130,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.neutralSecondary,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'purpose_of_visit',
      headerName: 'Purpose',
      width: 160,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          noWrap
          title={value}
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.neutralSecondary,
            maxWidth: 160,
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      width: 100,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      width: 100,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      field: 'time_in',
      headerName: 'Time In',
      width: 110,
      sortable: false,
      renderCell: ({ value }) =>
        value ? (
          <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {formatTime(value)}
          </Typography>
        ) : (
          <Typography variant='body2' sx={{ fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary }}>
            —
          </Typography>
        ),
    },
    {
      field: 'time_out',
      headerName: 'Time Out',
      width: 110,
      sortable: false,
      renderCell: ({ value }) =>
        value ? (
          <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {formatTime(value)}
          </Typography>
        ) : (
          <Typography variant='body2' sx={{ fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary }}>
            —
          </Typography>
        ),
    },
    {
      field: 'created_by_name',
      headerName: 'Created By',
      width: 130,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ),
    },
  ]

  return (
    <PageCardLayout
      title='Visitor Reports'
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant='outlined'
            onClick={handleExportCsv}
            startIcon={<Icon icon='mdi:download' fontSize={16} />}
            sx={{ textTransform: 'none' }}
          >
            Export CSV
          </Button>
          <Button
            variant='outlined'
            onClick={handleExportPdf}
            startIcon={<Icon icon='mdi:file-pdf-box' fontSize={16} />}
            sx={{ textTransform: 'none' }}
          >
            Export PDF
          </Button>
        </Box>
      }
    >
      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <TextField
          select
          size='small'
          value={filters.status}
          onChange={e => handleFilterChange('status', e.target.value)}
          sx={{ minWidth: 140 }}
          label='Status'
        >
          {VMS_STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size='small'
          value={filters.siteId}
          onChange={e => handleFilterChange('siteId', e.target.value)}
          sx={{ minWidth: 140 }}
          label='Site'
        >
          {SITE_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ ml: 'auto', maxWidth: { xs: '50%', sm: 300 }, minWidth: { xs: '45%', sm: 280 } }}>
          <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />
        </Box>

        {hasActiveFilters && (
          <Button
            variant='text'
            size='small'
            onClick={handleClear}
            startIcon={<Icon icon='mdi:filter-off-outline' fontSize={16} />}
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              textTransform: 'none',
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <CommonTable
        columns={columns}
        indexedRows={visitors}
        total={visitors.length}
        loading={isLoading}
        paginationModel={paginationModel}
        setPaginationModel={(model: any) => setPaginationModel({ page: model.page, pageSize: model.pageSize })}
        pageSizeOptions={[10, 25, 50]}
        rowHeight={52}
        getRowId={(row: any) => row.pass_id}
      />
    </PageCardLayout>
  )
}

export default VisitorReports
