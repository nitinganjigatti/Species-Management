import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
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
import { AuthContext } from 'src/context/AuthContext'
import { getDepartments, updateDepartment } from 'src/lib/api/request-department'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import DepartmentListView from 'src/views/pages/settings/departments/DepartmentListView'
import DepartmentDrawer from './DepartmentDrawer'

const DepartmentList = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

  // Permission check — matches mobile: permission["add_departments"]
  const hasPermission = Boolean(authData?.userData?.permission?.user_settings?.add_departments)

  // List state
  const [departments, setDepartments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('1')

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, department: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Debounce ref for search
  const searchDebounceRef = useRef(null)

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(searchValue && { search: searchValue }),
        ...(filterStatus !== 'all' && { active: filterStatus })
      }
      const response = await getDepartments(params)
      if (response?.success || response?.status) {
        const list = response?.data?.departments || response?.data?.list || response?.data || []
        const totalCount = response?.data?.total || response?.total || list.length
        // Ensure each row has an `id` field for DataGrid
        const indexed = list.map((item, idx) => ({ ...item, id: item.id || item.department_id || idx }))
        setDepartments(indexed)
        setTotal(totalCount)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, searchValue, filterStatus])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const handleSearchChange = value => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchValue(value)
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 300)
  }

  const handleFilterChange = value => {
    setFilterStatus(value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleRowClick = row => {
    router.push(`/settings/departments/${row.id}`)
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
    fetchDepartments()
  }

  const handleDelete = row => {
    setDeleteDialog({ open: true, department: row })
  }

  const handleDeleteClose = () => {
    setDeleteDialog({ open: false, department: null })
  }

  const handleDeleteConfirm = async () => {
    const dept = deleteDialog.department
    if (!dept) return

    setDeleteLoading(true)
    try {
      const formData = new FormData()
      formData.append('active', '0')
      const response = await updateDepartment(dept.id, formData)
      if (response?.success || response?.status) {
        toast.success('Department deactivated successfully')
        handleDeleteClose()
        fetchDepartments()
      } else {
        toast.error(response?.message || 'Failed to deactivate department')
      }
    } catch (error) {
      console.error('Error deactivating department:', error)
      toast.error('Failed to deactivate department')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <PageCardLayout
        title='Departments'
        action={
          hasPermission ? (
            <Button variant='contained' startIcon={<Icon icon='mdi:plus' />} onClick={handleAdd}>
              Add Department
            </Button>
          ) : null
        }
      >
        <DepartmentListView
          departments={departments}
          total={total}
          loading={loading}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          hasPermission={hasPermission}
        />
      </PageCardLayout>

      <DepartmentDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        editData={editData}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteClose} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='mdi:alert-circle-outline' fontSize={22} color={theme.palette.error.main} />
          <Typography variant='h6'>Deactivate Department</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate{' '}
            <strong>{deleteDialog.department?.name}</strong>? This will mark the department as inactive.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} color='inherit' disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' disabled={deleteLoading}>
            {deleteLoading ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DepartmentList
