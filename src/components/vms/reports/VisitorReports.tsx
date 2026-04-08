'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, VMS_STATUS_OPTIONS } from 'src/constants/vms'
import type { VmsPass } from 'src/types/vms'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import { useReportVisitors } from 'src/hooks/vms/useVmsReports'
import { exportReportCsv } from 'src/lib/api/vms'

// ─── Status → theme token mappings ───────────────────────────────────────────

// Status colors come from VMS_STATUS_CONFIG directly (hex is acceptable for status-specific colors)

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)

  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

const formatTime = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)

  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const cfg = VMS_STATUS_CONFIG[status] ?? { label: status, color: '#616161', bgColor: '#F0F0F0' }

  return (
    <Chip
      size='small'
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box
            component='span'
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: cfg.color,
            }}
          />
          <Typography
            component='span'
            sx={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: 'inherit' }}
          >
            {cfg.label}
          </Typography>
        </Box>
      }
      sx={{
        height: 'auto',
        maxHeight: 24,
        borderRadius: '100px',
        px: '10px',
        py: '4px',
        color: cfg.color,
        bgcolor: cfg.bgColor,
        '& .MuiChip-label': { px: 0, display: 'flex', alignItems: 'center' },
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
      a.download = `visitors_report_${new Date().toISOString().slice(0,10)}.csv`
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
      renderCell: ({ value }) => (
        <Typography
          title={value}
          sx={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 12,
            color: 'text.secondary',
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
      renderCell: ({ value }) => (
        <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: 14, whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'visitor_contact',
      headerName: 'Contact',
      width: 130,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontSize: 13,
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.3px',
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
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{value}</Typography>
      ),
    },
    {
      field: 'purpose_of_visit',
      headerName: 'Purpose',
      width: 160,
      renderCell: ({ value }) => (
        <Typography
          title={value}
          sx={{
            fontSize: 13,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            display: 'block',
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
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusChip status={value} />
        </Box>
      ),
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      width: 100,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      width: 100,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      field: 'time_in',
      headerName: 'Time In',
      width: 110,
      renderCell: ({ value }) =>
        value ? (
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.primary',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(value)}
          </Typography>
        ) : (
          <Typography
            component='span'
            sx={{ fontStyle: 'italic', color: 'customColors.OutlineVariant', fontSize: 13 }}
          >
            —
          </Typography>
        ),
    },
    {
      field: 'time_out',
      headerName: 'Time Out',
      width: 110,
      renderCell: ({ value }) =>
        value ? (
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.primary',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(value)}
          </Typography>
        ) : (
          <Typography
            component='span'
            sx={{ fontStyle: 'italic', color: 'customColors.OutlineVariant', fontSize: 13 }}
          >
            —
          </Typography>
        ),
    },
    {
      field: 'created_by_name',
      headerName: 'Created By',
      width: 130,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ),
    },
  ]

  return (
    <Card
      sx={{
        borderRadius: '10px',
        boxShadow: theme =>
          `0 1px 3px ${theme.palette.divider}, 0 1px 2px ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 6,
          py: 5,
          borderBottom: '1px solid',
          borderColor: 'customColors.OutlineVariant',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
          Visitor Reports
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant='outlined'
            onClick={handleExportCsv}
            startIcon={<Icon icon='mdi:download' fontSize={16} />}
            sx={{
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'none',
              color: 'text.primary',
              borderColor: 'customColors.OutlineVariant',
              borderRadius: '8px',
              px: '14px',
              py: '7px',
              minWidth: 'unset',
              lineHeight: 1.5,
              '&:hover': {
                bgcolor: 'customColors.Surface',
                borderColor: 'text.secondary',
              },
            }}
          >
            Export CSV
          </Button>

          <Button
            variant='outlined'
            onClick={handleExportPdf}
            startIcon={<Icon icon='mdi:file-pdf-box' fontSize={16} />}
            sx={{
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'none',
              color: 'text.primary',
              borderColor: 'customColors.OutlineVariant',
              borderRadius: '8px',
              px: '14px',
              py: '7px',
              minWidth: 'unset',
              lineHeight: 1.5,
              '&:hover': {
                bgcolor: 'customColors.Surface',
                borderColor: 'text.secondary',
              },
            }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          px: 6,
          py: 4,
          borderBottom: '1px solid',
          borderColor: 'customColors.OutlineVariant',
          flexWrap: 'wrap',
        }}
      >
        <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />

        <FormControl size='small' sx={{ minWidth: 130 }}>
          <Select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            displayEmpty
            sx={{
              fontSize: 14,
              color: 'text.primary',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'customColors.OutlineVariant' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              '& .MuiSelect-icon': { color: 'text.secondary' },
            }}
          >
            {VMS_STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 14 }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 130 }}>
          <Select
            value={filters.siteId}
            onChange={e => handleFilterChange('siteId', e.target.value)}
            displayEmpty
            sx={{
              fontSize: 14,
              color: 'text.primary',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'customColors.OutlineVariant' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              '& .MuiSelect-icon': { color: 'text.secondary' },
            }}
          >
            {SITE_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 14 }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button
            variant='text'
            size='small'
            onClick={handleClear}
            startIcon={<Icon icon='mdi:filter-off-outline' fontSize={16} />}
            sx={{
              color: 'text.secondary',
              fontSize: 14,
              fontWeight: 400,
              textTransform: 'none',
              borderRadius: '6px',
              px: 2,
              py: 1.5,
              '&:hover': { bgcolor: 'customColors.Surface', color: 'text.primary' },
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* ── DataGrid ──────────────────────────────────────────────────────── */}
      <DataGrid
        rows={visitors}
        columns={columns}
        loading={isLoading}
        getRowId={row => row.pass_id}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: 'none',
          fontFamily: 'inherit',

          // ── Column headers ──────────────────────────────────────────
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'customColors.Surface',
            borderBottom: '1px solid',
            borderColor: 'customColors.OutlineVariant',
            minHeight: '44px !important',
            maxHeight: '44px !important',
          },
          '& .MuiDataGrid-columnHeader': {
            px: 4,
            bgcolor: 'customColors.Surface',
            '&:focus, &:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '11px !important',
            fontWeight: '600 !important',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'text.secondary',
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-sortIcon': { color: 'text.secondary' },
          '& .MuiDataGrid-menuIconButton': { color: 'text.secondary' },

          // ── Rows ────────────────────────────────────────────────────
          '& .MuiDataGrid-row': {
            cursor: 'default',
            '&:hover': { bgcolor: 'customColors.Surface' },
            '&.Mui-selected': {
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'customColors.Surface' },
            },
            '&:last-child .MuiDataGrid-cell': { borderBottom: 'none' },
          },

          // ── Cells ───────────────────────────────────────────────────
          '& .MuiDataGrid-cell': {
            px: 4,
            fontSize: '14px',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'customColors.OutlineVariant',
            display: 'flex',
            alignItems: 'center',
            '&:focus, &:focus-within': { outline: 'none' },
          },

          // ── Footer / pagination ─────────────────────────────────────
          '& .MuiDataGrid-footerContainer': {
            px: 6,
            borderTop: '1px solid',
            borderColor: 'customColors.OutlineVariant',
            minHeight: '52px',
          },
          '& .MuiTablePagination-root': {
            fontSize: '13px',
            color: 'text.secondary',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '13px',
            color: 'text.secondary',
            margin: 0,
          },
          '& .MuiTablePagination-select': {
            fontSize: '13px',
            color: 'text.primary',
            padding: '4px 24px 4px 8px',
          },
          '& .MuiTablePagination-actions .MuiIconButton-root': {
            color: 'text.secondary',
            '&:hover': { bgcolor: 'customColors.Surface' },
            '&.Mui-disabled': { opacity: 0.4 },
          },

          // ── Misc ────────────────────────────────────────────────────
          '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
          '& .MuiDataGrid-overlay': { bgcolor: 'background.paper' },
        }}
      />
    </Card>
  )
}

export default VisitorReports
