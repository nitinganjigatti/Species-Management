import { Box, Chip, MenuItem, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'all_pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' }
]

const DepartmentRequestsView = ({
  requests,
  total,
  loading,
  paginationModel,
  setPaginationModel,
  searchValue,
  onSearchChange,
  filterStatus,
  onFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onRowClick
}) => {
  const theme = useTheme()

  const getStatusChipSx = status => {
    switch (status) {
      case 'pending':
      case 'awaiting_approval':
        return {
          backgroundColor: theme.palette.customColors.BgTeritary,
          color: theme.palette.customColors.Tertiary
        }
      case 'approved':
        return {
          backgroundColor: theme.palette.customColors.Surface,
          color: theme.palette.primary.dark
        }
      case 'completed':
        return {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }
      case 'in_progress':
        return {
          backgroundColor: theme.palette.customColors.antzSecondaryBg,
          color: theme.palette.secondary.main
        }
      case 'rejected':
        return {
          backgroundColor: theme.palette.customColors.BgTeritary,
          color: theme.palette.error.main
        }
      case 'cancelled':
        return {
          backgroundColor: theme.palette.action.disabledBackground,
          color: theme.palette.customColors.neutralSecondary
        }
      default:
        return {
          backgroundColor: theme.palette.action.disabledBackground,
          color: theme.palette.customColors.neutralSecondary
        }
    }
  }

  const formatStatusLabel = status => {
    if (!status) return '-'
    return status
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const columns = [
    {
      field: 'id',
      headerName: 'Request ID',
      flex: 0.7,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {row.request_code || (row.request_id ? `REQ-${row.request_id}` : '-')}
        </Typography>
      )
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Typography
          variant='body2'
          noWrap
          sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
        >
          {row.title || row.item_name || row.subject || '-'}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 140,
      renderCell: ({ row }) => {
        const status = row.status || ''
        return (
          <Chip
            label={formatStatusLabel(status)}
            size='small'
            sx={{
              fontWeight: 500,
              fontSize: '12px',
              ...getStatusChipSx(status)
            }}
          />
        )
      }
    },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.6,
      minWidth: 100,
      renderCell: ({ row }) => {
        const priority = (row.priority || '').toLowerCase()
        let color = theme.palette.customColors.neutralSecondary
        if (priority === 'high') color = theme.palette.error.main
        else if (priority === 'medium') color = theme.palette.warning.main
        return (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color,
              textTransform: 'capitalize'
            }}
          >
            {row.priority || '-'}
          </Typography>
        )
      }
    },
    {
      field: 'created_at',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => {
        const dateStr = row.created_at || row.date || ''
        const formatted = dateStr
          ? new Date(dateStr).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit'
            })
          : '-'
        return (
          <Typography
            sx={{ fontSize: '14px', color: theme.palette.customColors.neutralSecondary }}
          >
            {formatted}
          </Typography>
        )
      }
    }
  ]

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <TextField
          size='small'
          placeholder='Search requests...'
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <Icon
                  icon='mdi:magnify'
                  fontSize={20}
                  color={theme.palette.customColors.neutralSecondary}
                />
              </Box>
            )
          }}
          sx={{ minWidth: 240 }}
        />

        {/* Status Filter */}
        <TextField
          select
          size='small'
          label='Status'
          value={filterStatus}
          onChange={e => onFilterChange(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Date From */}
        <TextField
          size='small'
          label='From'
          type='date'
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        {/* Date To */}
        <TextField
          size='small'
          label='To'
          type='date'
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
      </Box>

      {/* Table */}
      <CommonTable
        columns={columns}
        indexedRows={requests}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={model =>
          setPaginationModel({ page: model.page, pageSize: model.pageSize })
        }
        pageSizeOptions={[10, 25, 50]}
        rowHeight={60}
        onRowClick={({ row }) => onRowClick?.(row)}
      />
    </Box>
  )
}

export default DepartmentRequestsView
