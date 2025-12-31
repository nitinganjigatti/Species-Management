import { useEffect, useState, useContext } from 'react'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { AuthContext } from 'src/context/AuthContext'
import { getAllSections } from 'src/lib/api/housing'

const AddQRRequestDrawer = props => {
  const { openDrawer, setOpenDrawer, handleSubmitData, loading } = props
  const theme = useTheme()
  const authData = useContext(AuthContext)

  // Get sites from auth context
  const sites = authData?.userData?.user?.zoos?.[0]?.sites || []

  const [siteId, setSiteId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  // Fetch sections when site is selected
  useEffect(() => {
    if (siteId) {
      const fetchSections = async () => {
        setLoadingSections(true)
        try {
          const response = await getAllSections({
            site_id: siteId,
            basic_only: 1
          })
          if (response?.success && response?.data) {
            setSections(response.data)
          }
        } catch (error) {
          console.error('Error fetching sections:', error)
        } finally {
          setLoadingSections(false)
        }
      }
      fetchSections()
    } else {
      setSections([])
      setSectionId('')
    }
  }, [siteId])

  const onSubmit = e => {
    e.preventDefault()
    setConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setConfirmDialog(false)

    let requestType = 'all'
    if (sectionId) {
      requestType = 'section'
    } else if (siteId) {
      requestType = 'site'
    }

    const payload = {
      request_type: requestType,
      site_id: siteId || null,
      section_id: sectionId || null
    }
    await handleSubmitData(payload)
  }

  const handleClose = () => {
    setSiteId('')
    setSectionId('')
    setSections([])
    setOpenDrawer(false)
  }

  const handleSiteChange = e => {
    setSiteId(e.target.value)
    setSectionId('')
  }

  // Helper text based on current selection
  const getSelectionInfo = () => {
    if (sectionId) {
      const section = sections.find(s => s.section_id === sectionId)
      const site = sites.find(s => s.site_id === siteId)
      return `QR codes will be generated for all enclosures in ${section?.section_name || 'selected section'} (${site?.site_name || 'selected site'})`
    }
    if (siteId) {
      const site = sites.find(s => s.site_id === siteId)
      return `QR codes will be generated for all enclosures in ${site?.site_name || 'selected site'}`
    }
    return 'QR codes will be generated for all enclosures in the zoo'
  }

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '550px'] } }}
    >
      <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 4,
            bgcolor: theme.palette.customColors.lightBg
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:qrcode-plus' fontSize={28} />
            <Typography variant='h6'>Add New Request</Typography>
          </Box>
          <IconButton size='small' onClick={handleClose}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        {/* Form */}
        <form autoComplete='off' onSubmit={onSubmit}>
          <Box
            sx={{
              mx: 4,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '8px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.primary }}>
              Generate QR for
            </Typography>

            {/* Site Dropdown */}
            <TextField
              select
              fullWidth
              label='Select Site (Optional)'
              value={siteId}
              onChange={handleSiteChange}
            >
              <MenuItem value=''>All Sites</MenuItem>
              {sites.map(site => (
                <MenuItem key={site.site_id} value={site.site_id}>
                  {site.site_name}
                </MenuItem>
              ))}
            </TextField>

            {/* Section Dropdown - shows when site is selected */}
            {siteId && (
              <TextField
                select
                fullWidth
                label='Select Section (Optional)'
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                disabled={loadingSections}
              >
                <MenuItem value=''>All Sections</MenuItem>
                {loadingSections ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : sections.length > 0 ? (
                  sections.map(section => (
                    <MenuItem key={section.section_id} value={section.section_id}>
                      {section.section_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No sections available</MenuItem>
                )}
              </TextField>
            )}

            {/* Selection Info */}
            <Box
              sx={{
                p: 3,
                borderRadius: '8px',
                backgroundColor: theme.palette.customColors?.primaryLight || '#E3F2FD'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Icon icon='mdi:information-outline' fontSize={18} color={theme.palette.primary.main} />
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: theme.palette.primary.main }}>
                  Selection Summary
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                {getSelectionInfo()}
              </Typography>
            </Box>
          </Box>

          {/* Submit Button */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: ['100%', '550px'],
              p: 4,
              bgcolor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`
            }}
          >
            <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
              Submit Request
            </LoadingButton>
          </Box>
        </form>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Request</DialogTitle>
        <DialogContent>
          <DialogContentText>{getSelectionInfo()}</DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>Do you want to proceed?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} variant='contained' color='primary'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}

export default AddQRRequestDrawer
