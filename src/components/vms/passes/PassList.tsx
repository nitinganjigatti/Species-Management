'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'
import { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, VMS_STATUS_OPTIONS } from 'src/constants/vms'
import type { VmsPass } from 'src/types/vms'
import { usePassesList } from 'src/hooks/vms/useVmsPasses'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import CommonTable from 'src/views/table/data-grid/CommonTable'

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
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`

  return raw
}

// ─── StatusChip ──────────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
const PassList = () => {
  const router = useRouter()
  const theme = useTheme()
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
    page_no: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...(statusFilter && { status: statusFilter }),
    ...(dateRange.startDate && { start_date: dateRange.startDate }),
    ...(dateRange.endDate && { end_date: dateRange.endDate }),
  }
  const { data: passesResponse, isLoading } = usePassesList(params)
  const passes = passesResponse?.data ?? []
  const totalRows = passesResponse?.total ?? 0

  // ── Client-side search filter ──────────────────────────────────────────────
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
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant,
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'visitor_contact',
      headerName: 'Contact',
      width: 140,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.neutralSecondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatContact(value) || '-'}
        </Typography>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: false,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'date_range',
      headerName: 'Date Range',
      width: 155,
      sortable: false,
      valueGetter: (_value: any, row: VmsPass) =>
        `${formatDate(row.start_date)} – ${formatDate(row.end_date)}`,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'created_by_name',
      headerName: 'Created By',
      width: 140,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.neutralSecondary }}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 155,
      sortable: false,
      renderCell: ({ value }) => (
        <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          {formatDateTime(value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 52,
      sortable: false,
      renderCell: () => (
        <IconButton
          size='small'
          onClick={e => e.stopPropagation()}
          sx={{ color: theme.palette.customColors.neutralSecondary }}
        >
          <Icon icon='mdi:dots-horizontal' fontSize={18} />
        </IconButton>
      ),
    },
  ]

  return (
    <PageCardLayout
      title='Passes'
      action={
        <Button variant='contained' startIcon={<Icon icon='mdi:plus' />} onClick={() => router.push('/vms/passes/create/')}>
          Create Pass
        </Button>
      }
    >
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <TextField
          size='small'
          placeholder='Search visitors, contacts...'
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <Icon icon='mdi:magnify' fontSize={20} color={theme.palette.customColors.neutralSecondary} />
              </Box>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { sm: 280 } }}
        />

        <TextField
          select
          size='small'
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: { xs: '45%', sm: 140 } }}
          label='Status'
        >
          {VMS_STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

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

        <Box sx={{ ml: 'auto', maxWidth: { xs: '50%', sm: 300 }, minWidth: { xs: '45%', sm: 280 } }}>
          <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />
        </Box>
      </Box>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <CommonTable
        columns={columns}
        indexedRows={filteredData}
        total={totalRows}
        loading={isLoading}
        paginationModel={paginationModel}
        setPaginationModel={(model: any) => setPaginationModel({ page: model.page, pageSize: model.pageSize })}
        pageSizeOptions={[10, 25, 50]}
        rowHeight={60}
        onRowClick={({ row }: any) => router.push(`/vms/passes/${row.pass_id}`)}
        getRowId={(row: any) => row.pass_id}
      />
    </PageCardLayout>
  )
}

export default PassList
