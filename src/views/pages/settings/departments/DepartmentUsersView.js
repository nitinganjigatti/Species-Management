import { Box, Chip, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const DepartmentUsersView = ({
  users,
  total,
  loading,
  paginationModel,
  setPaginationModel,
  searchValue,
  onSearchChange,
  onEdit,
  onRemove,
  hasPermission
}) => {
  const theme = useTheme()

  const columns = [
    {
      field: 'user_name',
      headerName: 'User Name',
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => {
        const name =
          row.full_name ||
          row.user_name ||
          ((row.first_name || '') + ' ' + (row.last_name || '')).trim() ||
          '-'
        return (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {name}
          </Typography>
        )
      }
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => {
        const role = row.role || row.role_name || ''
        const isApprover = role === 'approver'
        const isProcessor = role === 'processor'

        return (
          <Chip
            label={role ? role.charAt(0).toUpperCase() + role.slice(1) : '-'}
            size='small'
            sx={{
              fontWeight: 500,
              fontSize: '12px',
              backgroundColor: isApprover
                ? theme.palette.info.light
                : isProcessor
                ? theme.palette.customColors.antzSecondaryBg
                : theme.palette.action.disabledBackground,
              color: isApprover
                ? theme.palette.info.dark
                : isProcessor
                ? theme.palette.primary.dark
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
            flex: 0.5,
            minWidth: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: ({ row }) => (
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
                  <Icon icon='mdi:account-remove-outline' fontSize={18} />
                </IconButton>
              </Box>
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
          placeholder='Search users...'
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
        indexedRows={users}
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

export default DepartmentUsersView
