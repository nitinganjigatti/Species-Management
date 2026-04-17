import { useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  CircularProgress,
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
import { getDepartmentById, updateDepartment } from 'src/lib/api/request-department'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import DepartmentDetailView from 'src/views/pages/settings/departments/DepartmentDetailView'
import DepartmentOverviewView from 'src/views/pages/settings/departments/DepartmentOverviewView'
import DepartmentDrawer from './DepartmentDrawer'
import DepartmentUsers from './DepartmentUsers'
import DepartmentVendors from './DepartmentVendors'
import DepartmentRequests from './DepartmentRequests'

const DepartmentDetail = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)

  const hasPermission = Boolean(authData?.userData?.permission?.user_settings?.add_departments)

  const [department, setDepartment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchDepartment = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await getDepartmentById(id)
      if ((response?.success || response?.status) && response?.data) {
        setDepartment(response.data)
      } else {
        toast.error(response?.message || 'Failed to load department')
      }
    } catch (error) {
      console.error('Error fetching department:', error)
      toast.error('Failed to load department')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDepartment()
  }, [fetchDepartment])

  const handleTabChange = val => setActiveTab(val)

  const handleEdit = () => setDrawerOpen(true)

  const handleDrawerClose = () => setDrawerOpen(false)

  const handleDrawerSuccess = () => {
    fetchDepartment()
  }

  const handleDeleteOpen = () => setDeleteDialog({ open: true })

  const handleDeleteClose = () => setDeleteDialog({ open: false })

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      const formData = new FormData()
      formData.append('active', '0')
      const response = await updateDepartment(id, formData)
      if (response?.success || response?.status) {
        toast.success('Department deactivated successfully')
        handleDeleteClose()
        router.push('/settings/departments')
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
        title={department?.name || ''}
        subtitle='Departments'
        showIcon
        icon='mdi:arrow-left'
        onIconClick={() => router.push('/settings/departments')}
        action={
          hasPermission ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant='outlined'
                startIcon={<Icon icon='mdi:pencil-outline' />}
                onClick={handleEdit}
                disabled={loading}
              >
                Edit
              </Button>
              <Button
                variant='outlined'
                color='error'
                startIcon={<Icon icon='mdi:delete-outline' />}
                onClick={handleDeleteOpen}
                disabled={loading}
              >
                Delete
              </Button>
            </Box>
          ) : null
        }
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <DepartmentDetailView
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showVendorsTab={department?.settings?.enable_vendor_selection === '1' || department?.settings?.enable_vendor_selection === true}
            overviewContent={<DepartmentOverviewView department={department} />}
            usersContent={<DepartmentUsers departmentId={id} hasPermission={hasPermission} />}
            vendorsContent={<DepartmentVendors departmentId={id} hasPermission={hasPermission} />}
            requestsContent={<DepartmentRequests departmentId={id} hasPermission={hasPermission} />}
          />
        )}
      </PageCardLayout>

      <DepartmentDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        editData={department}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteClose} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='mdi:alert-circle-outline' fontSize={22} color={theme.palette.error.main} />
          <Typography variant='h6'>Deactivate Department</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate <strong>{department?.name}</strong>? This will mark the department as
            inactive.
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

export default DepartmentDetail
