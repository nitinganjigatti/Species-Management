import { Box, Button, Chip, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const DepartmentListView = ({
  departments,
  total,
  loading,
  paginationModel,
  setPaginationModel,
  searchValue,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onRowClick,
  onEdit,
  onDelete,
  onActivate,
  hasPermission
}) => {
  const theme = useTheme()

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {row.name || '-'}
        </Typography>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography
          noWrap
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.neutralSecondary,
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {row.description || '-'}
        </Typography>
      )
    },
    {
      field: 'created_by',
      headerName: 'Created By',
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.neutralSecondary }}>
          {row.created_by_name || row.created_by || '-'}
        </Typography>
      )
    },
    {
      field: 'active',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 110,
      sortable: false,
      renderCell: ({ row }) => {
        const isActive = row.active === 1 || row.active === true || row.active === '1'
        return (
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size='small'
            sx={{
              fontWeight: 500,
              fontSize: '12px',
              backgroundColor: isActive ? theme.palette.customColors.Surface : theme.palette.action.disabledBackground,
              color: isActive ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary
            }}
          />
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => {
        if (!hasPermission) return null
        const isActive = row.active === 1 || row.active === true || row.active === '1'
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                onEdit(row)
              }}
              sx={{ color: theme.palette.customColors.neutralSecondary }}
            >
              <Icon icon='mdi:pencil-outline' fontSize={18} />
            </IconButton>
            {isActive ? (
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  onDelete(row)
                }}
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  '&:hover': { color: theme.palette.error.main }
                }}
              >
                <Icon icon='mdi:delete-outline' fontSize={18} />
              </IconButton>
            ) : (
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  onActivate(row)
                }}
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  '&:hover': { color: theme.palette.success.main }
                }}
              >
                <Icon icon='mdi:restore' fontSize={18} />
              </IconButton>
            )}
          </Box>
        )
      }
    }
  ]

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          placeholder='Search departments...'
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <Icon icon='mdi:magnify' fontSize={20} color={theme.palette.customColors.neutralSecondary} />
              </Box>
            )
          }}
          sx={{ minWidth: 240 }}
        />
        <TextField
          select
          size='small'
          value={filterStatus}
          onChange={e => onFilterChange(e.target.value)}
          sx={{ minWidth: 140 }}
          label='Status'
        >
          <MenuItem value='all'>All</MenuItem>
          <MenuItem value='1'>Active</MenuItem>
          <MenuItem value='0'>Inactive</MenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <CommonTable
        columns={columns}
        indexedRows={departments}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={model => setPaginationModel({ page: model.page, pageSize: model.pageSize })}
        pageSizeOptions={[10, 25, 50]}
        rowHeight={60}
        onRowClick={({ row }) => onRowClick(row)}
      />
    </Box>
  )
}

export default DepartmentListView
