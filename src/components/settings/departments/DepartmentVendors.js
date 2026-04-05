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
import { getDepartmentVendors, removeVendorFromDepartment } from 'src/lib/api/request-department'
import DepartmentVendorsView from 'src/views/pages/settings/departments/DepartmentVendorsView'
import AssignVendorDrawer from './AssignVendorDrawer'

const DepartmentVendors = ({ departmentId, hasPermission }) => {
  const theme = useTheme()

  const [vendors, setVendors] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [searchValue, setSearchValue] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)

  const [removeDialog, setRemoveDialog] = useState({ open: false, vendor: null })
  const [removeLoading, setRemoveLoading] = useState(false)

  const searchDebounceRef = useRef(null)

  const fetchVendors = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(searchValue && { q: searchValue })
      }
      const response = await getDepartmentVendors(departmentId, params)
      if (response?.success || response?.status) {
        const list = response?.data?.result || response?.data?.vendors || []
        const totalCount = parseInt(response?.data?.total_count || response?.data?.total) || list.length
        const indexed = Array.isArray(list) ? list.map((item, idx) => ({
          ...item,
          id: item.id || item.vendor_id || idx
        })) : []
        setVendors(indexed)
        setTotal(totalCount)
      }
    } catch (error) {
      console.error('Error fetching department vendors:', error)
    } finally {
      setLoading(false)
    }
  }, [departmentId, paginationModel, searchValue])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleSearchChange = value => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchValue(value)
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 300)
  }

  const handleAdd = () => {
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleDrawerSuccess = () => {
    fetchVendors()
  }

  const handleRemoveClick = row => {
    setRemoveDialog({ open: true, vendor: row })
  }

  const handleRemoveClose = () => {
    setRemoveDialog({ open: false, vendor: null })
  }

  const handleRemoveConfirm = async () => {
    const vendor = removeDialog.vendor
    if (!vendor) return

    setRemoveLoading(true)
    try {
      const response = await removeVendorFromDepartment({
        department_id: departmentId,
        vendor_id: vendor.vendor_id || vendor.id
      })
      if (response?.success || response?.status) {
        toast.success('Vendor removed from department')
        handleRemoveClose()
        fetchVendors()
      } else {
        toast.error(response?.message || 'Failed to remove vendor')
      }
    } catch (error) {
      console.error('Error removing department vendor:', error)
      toast.error('Failed to remove vendor')
    } finally {
      setRemoveLoading(false)
    }
  }

  const vendorName =
    removeDialog.vendor?.vendor_name || removeDialog.vendor?.name || 'this vendor'

  return (
    <>
      {/* Assign Vendor Button */}
      {hasPermission && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:store-plus-outline' />}
            onClick={handleAdd}
          >
            Assign Vendor
          </Button>
        </Box>
      )}

      <DepartmentVendorsView
        vendors={vendors}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onRemove={handleRemoveClick}
        hasPermission={hasPermission}
      />

      <AssignVendorDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        departmentId={departmentId}
        existingVendorIds={vendors.map(v => String(v.vendor_id || v.id))}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialog.open} onClose={handleRemoveClose} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='mdi:alert-circle-outline' fontSize={22} color={theme.palette.error.main} />
          <Typography variant='h6'>Remove Vendor</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{vendorName}</strong> from this department?
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

export default DepartmentVendors
