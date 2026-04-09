'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, VMS_STATUS_OPTIONS } from 'src/constants/vms'
import type { VmsPass } from 'src/types/vms'
import { usePassesList } from 'src/hooks/vms/useVmsPasses'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'

// Status colors come from VMS_STATUS_CONFIG (hex is acceptable for status-specific colors)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

const formatContact = (raw: string) => {
  // Format 10-digit Indian mobile → "987 654 3210"
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`

  return raw
}

// ─── StatusChip ──────────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
const PassList = () => {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setDateRange({ startDate: Utility.formatDate(startDate), endDate: Utility.formatDate(endDate) })
    } else {
      setDateRange({ startDate: '', endDate: '' })
    }
  }

  // ── API ───────────────────────────────────────────────────────────────────
  const params = {
    page_no: paginationModel.page + 1, // DataGrid is 0-based, API is 1-based
    limit: paginationModel.pageSize,
    ...(statusFilter && { status: statusFilter }),
    ...(dateRange.startDate && { start_date: dateRange.startDate }),
    ...(dateRange.endDate && { end_date: dateRange.endDate }),
  }
  const { data: passesResponse, isLoading } = usePassesList(params)
  const passes = passesResponse?.data ?? []
  const totalRows = passesResponse?.total ?? 0

  // ── Client-side search filter (server handles status/date filtering) ───────
  const filteredData = searchValue
    ? passes.filter((pass: VmsPass) => {
        const q = searchValue.toLowerCase()

        return (
          pass.visitor_name.toLowerCase().includes(q) ||
          pass.visitor_contact.includes(q) ||
          pass.department.toLowerCase().includes(q)
        )
      })
    : passes

  const hasActiveFilters = !!(searchValue || statusFilter || dateRange.startDate || dateRange.endDate)

  const handleClear = () => {
    setSearchValue('')
    setStatusFilter('')
    setDateRange({ startDate: '', endDate: '' })
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: GridColDef[] = [
    {
      field: 'visitor_name',
      headerName: 'Visitor Name',
      flex: 1,
      minWidth: 150,
      renderCell: ({ value }) => (
        <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: 14 }}>
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
            fontVariantNumeric: 'tabular-nums',
            fontSize: 13,
            color: 'text.secondary',
            letterSpacing: '0.3px',
          }}
        >
          {formatContact(value)}
        </Typography>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{value}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusChip status={value} />
        </Box>
      ),
    },
    {
      field: 'date_range',
      headerName: 'Date Range',
      width: 145,
      sortable: false,
      valueGetter: (_value: any, row: VmsPass) =>
        `${formatDate(row.start_date)} – ${formatDate(row.end_date)}`,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'created_by_name',
      headerName: 'Created By',
      width: 140,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{value}</Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 155,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {formatDateTime(value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 52,
      sortable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <IconButton
          size='small'
          onClick={e => e.stopPropagation()}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'customColors.Surface' },
          }}
        >
          <Icon icon='mdi:dots-horizontal' fontSize={18} />
        </IconButton>
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
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 6,
          py: 5,
          borderBottom: '1px solid',
          borderColor: 'customColors.OutlineVariant',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
            Passes
          </Typography>
          <Chip
            label={totalRows}
            size='small'
            sx={{
              height: 24,
              minWidth: 28,
              borderRadius: '12px',
              px: 2,
              bgcolor: 'customColors.Surface',
              color: 'text.primary',
              fontSize: 12,
              fontWeight: 600,
              '& .MuiChip-label': { px: 0 },
            }}
          />
        </Box>

        <Button
          variant='contained'
          onClick={() => router.push('/vms/passes/create/')}
          startIcon={<Icon icon='mdi:plus' fontSize={18} />}
          sx={{
            bgcolor: 'primary.main',
            color: 'customColors.Surface',
            px: 4,
            py: 2,
            borderRadius: '8px',
            fontSize: 14,
            fontWeight: 500,
            textTransform: 'none',
            gap: '6px',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: theme => `0 2px 8px ${theme.palette.primary.main}4D`,
            },
          }}
        >
          Create Pass
        </Button>
      </Box>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
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
        {/* Search */}
        <TextField
          size='small'
          placeholder='Search visitors, contacts...'
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='mdi:magnify' fontSize={18} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            maxWidth: 280,
            '& .MuiOutlinedInput-root': {
              fontSize: 14,
              color: 'text.primary',
              borderRadius: '8px',
              '& fieldset': { borderColor: 'customColors.OutlineVariant' },
              '&:hover fieldset': { borderColor: 'text.secondary' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
            '& .MuiInputAdornment-root': { color: 'text.secondary' },
            '& input::placeholder': { color: 'text.secondary', opacity: 1 },
          }}
        />

        {/* Status filter */}
        <FormControl size='small' sx={{ minWidth: 130 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
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

        {/* Date range */}
        <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />

        {/* Clear */}
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

      {/* ── Data Grid ───────────────────────────────────────────────────── */}
      <DataGrid
        rows={filteredData}
        columns={columns}
        getRowId={row => row.pass_id}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        paginationMode='server'
        rowCount={totalRows}
        loading={isLoading}
        disableRowSelectionOnClick
        onRowClick={params => router.push(`/vms/passes/${params.row.pass_id}`)}
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
            cursor: 'pointer',
            '&:hover': { bgcolor: 'customColors.Surface' },
            '&.Mui-selected': {
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'customColors.Surface' },
            },
          },

          // ── Cells ───────────────────────────────────────────────────
          '& .MuiDataGrid-cell': {
            px: 4,
            py: '14px',
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

export default PassList
