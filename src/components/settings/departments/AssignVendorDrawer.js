import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Typography
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { assignVendorsToDepartment } from 'src/lib/api/request-department'
import { axiosGet } from 'src/lib/api/utility'

const AssignVendorDrawer = ({ open, onClose, onSuccess, departmentId, existingVendorIds = [] }) => {
  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedVendors, setSelectedVendors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const searchDebounceRef = useRef(null)

  const fetchVendors = useCallback(async (searchQ = '', pageNo = 1, append = false) => {
    setLoading(true)
    try {
      const response = await axiosGet({
        url: 'v1/vendors',
        params: { q: searchQ, page: pageNo, limit: 25 }
      })
      const data = response?.data
      if (data?.success || data?.status) {
        const list = Array.isArray(data?.data) ? data.data : (data?.data?.vendors || data?.data?.result || data?.data?.list || [])
        if (append) {
          setVendors(prev => [...prev, ...list])
        } else {
          setVendors(list)
        }
        setHasMore(list.length === 25)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setSelectedVendors([])
      setSearchValue('')
      setPage(1)
      fetchVendors('', 1)
    }
  }, [open, fetchVendors])

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchValue(val)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setPage(1)
      fetchVendors(val, 1)
    }, 300)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchVendors(searchValue, nextPage, true)
  }

  const toggleVendor = vendor => {
    const vendorId = vendor.vendor_id || vendor.id
    const isSelected = selectedVendors.some(v => (v.vendor_id || v.id) === vendorId)
    if (isSelected) {
      setSelectedVendors(prev => prev.filter(v => (v.vendor_id || v.id) !== vendorId))
    } else {
      setSelectedVendors(prev => [...prev, vendor])
    }
  }

  const removeSelected = vendor => {
    const vendorId = vendor.vendor_id || vendor.id
    setSelectedVendors(prev => prev.filter(v => (v.vendor_id || v.id) !== vendorId))
  }

  const isVendorSelected = vendor => {
    const vendorId = vendor.vendor_id || vendor.id
    return selectedVendors.some(v => (v.vendor_id || v.id) === vendorId)
  }

  const isAlreadyAssigned = vendor => {
    const vendorId = String(vendor.vendor_id || vendor.id)
    return existingVendorIds.includes(vendorId)
  }

  const getVendorName = vendor => vendor.vendor_name || vendor.name || '—'

  const getVendorContact = vendor => {
    const parts = []
    if (vendor.vendor_email || vendor.email) parts.push(vendor.vendor_email || vendor.email)
    if (vendor.vendor_phone || vendor.phone) parts.push(vendor.vendor_phone || vendor.phone)
    return parts.join(' · ') || '—'
  }

  const handleSubmit = async () => {
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        department_id: departmentId,
        vendor_ids: selectedVendors.map(v => String(v.vendor_id || v.id))
      }
      const response = await assignVendorsToDepartment(payload)
      if (response?.success || response?.status) {
        toast.success(`${selectedVendors.length} vendor(s) assigned successfully`)
        onSuccess?.()
        handleClose()
      } else {
        toast.error(response?.message || 'Failed to assign vendors')
      }
    } catch (error) {
      console.error('Error assigning vendors:', error)
      toast.error('Failed to assign vendors')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedVendors([])
    setSearchValue('')
    setVendors([])
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '420px'] } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            p: 5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>Assign Vendors</Typography>
            <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
              Search and select vendors to map
            </Typography>
          </Box>
          <IconButton size='small' onClick={handleClose} sx={{ mt: 0.5 }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5, py: 4 }}>
          {/* Search */}
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Icon
              icon='mdi:magnify'
              fontSize={20}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.palette.customColors.neutralSecondary
              }}
            />
            <input
              type='text'
              placeholder='Search vendors by name...'
              value={searchValue}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '14px',
                color: theme.palette.text.primary,
                outline: 'none',
                background: 'transparent'
              }}
            />
          </Box>

          {/* Selected Chips */}
          {selectedVendors.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {selectedVendors.map(vendor => (
                <Chip
                  key={vendor.vendor_id || vendor.id}
                  label={getVendorName(vendor)}
                  size='small'
                  onDelete={() => removeSelected(vendor)}
                  deleteIcon={<Icon icon='mdi:close' fontSize={14} />}
                  sx={{
                    backgroundColor: theme.palette.customColors.OnBackground,
                    color: theme.palette.primary.dark,
                    fontWeight: 500,
                    fontSize: '12px'
                  }}
                />
              ))}
            </Box>
          )}

          {/* Section Label */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant='caption'
              sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: theme.palette.customColors.neutralSecondary }}
            >
              Vendors
            </Typography>
            {selectedVendors.length > 0 && (
              <Chip
                label={`${selectedVendors.length} selected`}
                size='small'
                sx={{
                  height: 22,
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: theme.palette.customColors.Surface,
                  color: theme.palette.primary.dark
                }}
              />
            )}
          </Box>

          {/* Vendor List */}
          <Box>
            {vendors.map(vendor => {
              const selected = isVendorSelected(vendor)
              const assigned = isAlreadyAssigned(vendor)

              return (
                <Box
                  key={vendor.vendor_id || vendor.id}
                  onClick={() => !assigned && toggleVendor(vendor)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    py: 2.5,
                    px: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    cursor: assigned ? 'default' : 'pointer',
                    borderRadius: '6px',
                    opacity: assigned ? 0.5 : 1,
                    backgroundColor: selected ? theme.palette.customColors.OnBackground : 'transparent',
                    transition: 'background 150ms',
                    '&:hover': {
                      backgroundColor: assigned ? 'transparent' : theme.palette.customColors.Surface
                    }
                  }}
                >
                  {/* Vendor Icon */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '6px',
                      backgroundColor: theme.palette.customColors.antzSecondaryBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon icon='mdi:store' fontSize={18} style={{ color: theme.palette.secondary.main }} />
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='body2' sx={{ fontWeight: 500 }} noWrap>
                      {getVendorName(vendor)}
                    </Typography>
                    <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }} noWrap>
                      {getVendorContact(vendor)}
                      {assigned && ' · Already mapped'}
                    </Typography>
                  </Box>

                  {/* Checkbox */}
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '4px',
                      border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant}`,
                      backgroundColor: selected ? theme.palette.primary.main : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 150ms'
                    }}
                  >
                    {selected && <Icon icon='mdi:check' fontSize={16} style={{ color: theme.palette.primary.contrastText }} />}
                  </Box>
                </Box>
              )
            })}

            {/* Load More */}
            {hasMore && !loading && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button size='small' onClick={handleLoadMore} sx={{ color: theme.palette.primary.main }}>
                  Load more
                </Button>
              </Box>
            )}

            {loading && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>Loading...</Typography>
              </Box>
            )}

            {!loading && vendors.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>No vendors found</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            px: 5,
            py: 3,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button variant='outlined' color='inherit' onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            onClick={handleSubmit}
            loading={submitting}
            disabled={selectedVendors.length === 0}
            startIcon={<Icon icon='mdi:store-plus-outline' fontSize={18} />}
          >
            Assign {selectedVendors.length > 0 ? `${selectedVendors.length} Vendor${selectedVendors.length > 1 ? 's' : ''}` : ''}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AssignVendorDrawer
