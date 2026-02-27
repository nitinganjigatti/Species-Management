import { useState, useMemo, useCallback } from 'react'
import { Box, Typography, Avatar, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAnimalsDrawer from './UserAnimalsDrawer'

const UserWiseList = ({ data, pagination, loading, onPaginationChange }) => {
  const theme = useTheme()
  const [selectedUser, setSelectedUser] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const paginationModel = useMemo(
    () => ({
      page: pagination?.page || 0,
      pageSize: pagination?.pageSize || 20
    }),
    [pagination?.page, pagination?.pageSize]
  )

  const handleUserClick = useCallback(user => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedUser(null)
  }, [])

  const handlePaginationChange = useCallback(
    model => {
      onPaginationChange?.(model)
    },
    [onPaginationChange]
  )

  const columns = useMemo(
    () => [
      {
        field: 'keeper_name',
        headerName: 'Caretaker',
        flex: 1,
        minWidth: 250,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={row.profile_pic || row.user_profile_pic}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: theme.palette.customColors?.primaryLight || '#E8F5E9'
              }}
            >
              <Icon icon='mdi:account-outline' fontSize={24} color={theme.palette.primary.main} />
            </Avatar>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {row.keeper_name || row.user_name || '-'}
            </Typography>
          </Box>
        )
      },
      {
        field: 'total_animals',
        headerName: 'Total Animals',
        flex: 0.5,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Chip
            label={row.total_animals || 0}
            size='small'
            sx={{
              backgroundColor: theme.palette.customColors?.primaryLight || '#E8F5E9',
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '14px',
              minWidth: 50
            }}
          />
        )
      },
      {
        field: 'primary_count',
        headerName: 'As Primary',
        flex: 0.5,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon='mdi:crown' fontSize={18} color={theme.palette.warning.main} />
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.warning.main
              }}
            >
              {row.primary_count || 0}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actions',
        headerName: '',
        flex: 0.3,
        minWidth: 60,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: () => <Icon icon='mdi:chevron-right' fontSize={24} color={theme.palette.text.secondary} />
      }
    ],
    [theme]
  )

  const tableData = useMemo(
    () =>
      (data || []).map(user => ({
        ...user,
        id: user.user_id || user.id
      })),
    [data]
  )

  // Show empty state only when not loading and no data
  if (!loading && (!data || data.length === 0)) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography sx={{ color: theme.palette.text.secondary }}>No caretakers found</Typography>
      </Box>
    )
  }

  return (
    <>
      <CommonTable
        columns={columns}
        indexedRows={tableData}
        total={pagination?.total || 0}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={handlePaginationChange}
        pageSizeOptions={[10, 20, 50]}
        rowHeight={70}
        onRowClick={params => handleUserClick(params.row)}
      />

      {selectedUser && <UserAnimalsDrawer open={drawerOpen} onClose={handleCloseDrawer} user={selectedUser} />}
    </>
  )
}

export default UserWiseList
