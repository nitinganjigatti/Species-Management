import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { getDepartmentUsers, updateDepartmentUser } from 'src/lib/api/request-department'
import DepartmentUsersView from 'src/views/pages/settings/departments/DepartmentUsersView'
import AssignUserDrawer from './AssignUserDrawer'

const DepartmentUsers = ({ departmentId, hasPermission }) => {
  const theme = useTheme()

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [searchValue, setSearchValue] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  const [removeDialog, setRemoveDialog] = useState({ open: false, user: null })
  const [removeLoading, setRemoveLoading] = useState(false)

  const searchDebounceRef = useRef(null)

  const fetchUsers = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(searchValue && { q: searchValue })
      }
      const response = await getDepartmentUsers(departmentId, params)
      if (response?.success || response?.status) {
        const list = response?.data?.users || response?.data?.list || []
        const totalCount = response?.data?.total || list.length
        const indexed = Array.isArray(list) ? list.map((item, idx) => ({
          ...item,
          id: item.id || item.user_id || idx
        })) : []
        setUsers(indexed)
        setTotal(totalCount)
      }
    } catch (error) {
      console.error('Error fetching department users:', error)
    } finally {
      setLoading(false)
    }
  }, [departmentId, paginationModel, searchValue])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchChange = value => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchValue(value)
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 300)
  }

  const handleEdit = row => {
    setEditData(row)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditData(null)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditData(null)
  }

  const handleDrawerSuccess = () => {
    fetchUsers()
  }

  const handleRemoveClick = row => {
    setRemoveDialog({ open: true, user: row })
  }

  const handleRemoveClose = () => {
    setRemoveDialog({ open: false, user: null })
  }

  const handleRemoveConfirm = async () => {
    const user = removeDialog.user
    if (!user) return

    setRemoveLoading(true)
    try {
      const response = await updateDepartmentUser(user.user_id, {
        department_id: departmentId,
        active: 0
      })
      if (response?.success || response?.status) {
        toast.success('User removed from department')
        handleRemoveClose()
        fetchUsers()
      } else {
        toast.error(response?.message || 'Failed to remove user')
      }
    } catch (error) {
      console.error('Error removing department user:', error)
      toast.error('Failed to remove user')
    } finally {
      setRemoveLoading(false)
    }
  }

  const userName =
    removeDialog.user?.user_name ||
    ((removeDialog.user?.first_name || '') + ' ' + (removeDialog.user?.last_name || '')).trim() ||
    'this user'

  return (
    <>
      {/* Assign User Button */}
      {hasPermission && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:account-plus-outline' />}
            onClick={handleAdd}
          >
            Assign User
          </Button>
        </Box>
      )}

      <DepartmentUsersView
        users={users}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onEdit={handleEdit}
        onRemove={handleRemoveClick}
        hasPermission={hasPermission}
      />

      <AssignUserDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        departmentId={departmentId}
        existingUserIds={users.map(u => String(u.user_id || u.id))}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialog.open} onClose={handleRemoveClose} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='mdi:alert-circle-outline' fontSize={22} color={theme.palette.error.main} />
          <Typography variant='h6'>Remove User</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{userName}</strong> from this department?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveClose} color='inherit' disabled={removeLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveConfirm}
            color='error'
            variant='contained'
            disabled={removeLoading}
          >
            {removeLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DepartmentUsers
