import { Box, Chip, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const DepartmentVendorsView = ({
  vendors,
  total,
  loading,
  paginationModel,
  setPaginationModel,
  searchValue,
  onSearchChange,
  onRemove,
  hasPermission
}) => {
  const theme = useTheme()

  const columns = [
    {
      field: 'vendor_name',
      headerName: 'Vendor Name',
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {row.vendor_name || row.name || '-'}
        </Typography>
      )
    },
    {
      field: 'contact',
      headerName: 'Contact',
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.neutralSecondary
          }}
        >
          {row.vendor_email || row.email || row.vendor_phone || row.phone || '-'}
        </Typography>
      )
    },
    {
      field: 'active',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: ({ row }) => {
        const isActive =
          row.active === 1 || row.active === true || row.active === '1'
        return (
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size='small'
            sx={{
              fontWeight: 500,
              fontSize: '12px',
              backgroundColor: isActive
                ? theme.palette.customColors.Surface
                : theme.palette.action.disabledBackground,
              color: isActive
                ? theme.palette.primary.main
                : theme.palette.customColors.neutralSecondary
            }}
          />
        )
      }
    },
    ...(hasPermission
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.4,
            minWidth: 80,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: ({ row }) => (
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  onRemove(row)
                }}
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  '&:hover': { color: theme.palette.error.main }
                }}
              >
                <Icon icon='mdi:link-off' fontSize={18} />
              </IconButton>
            )
          }
        ]
      : [])
  ]

  return (
    <Box>
      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          size='small'
          placeholder='Search vendors...'
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
      </Box>

      {/* Table */}
      <CommonTable
        columns={columns}
        indexedRows={vendors}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={model =>
          setPaginationModel({ page: model.page, pageSize: model.pageSize })
        }
        pageSizeOptions={[10, 25, 50]}
        rowHeight={60}
      />
    </Box>
  )
}

export default DepartmentVendorsView
