import { useEffect, useState, useContext, useRef, useCallback } from 'react'
import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { AuthContext } from 'src/context/AuthContext'
import { getAllSections, getEnclosureListSectionWise } from 'src/lib/api/housing'

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

  // Enclosure states
  const [selectedEnclosures, setSelectedEnclosures] = useState([])
  const [enclosures, setEnclosures] = useState([])
  const [loadingEnclosures, setLoadingEnclosures] = useState(false)
  const [enclosureSearchText, setEnclosureSearchText] = useState('')
  const [enclosurePage, setEnclosurePage] = useState(1)
  const [hasMoreEnclosures, setHasMoreEnclosures] = useState(true)
  const [loadingMoreEnclosures, setLoadingMoreEnclosures] = useState(false)
  const [totalEnclosureCount, setTotalEnclosureCount] = useState(0)
  const listboxRef = useRef(null)

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

  // Fetch enclosures when section is selected
  useEffect(() => {
    if (sectionId) {
      const fetchEnclosures = async () => {
        setLoadingEnclosures(true)
        setEnclosurePage(1)
        setHasMoreEnclosures(true)
        setTotalEnclosureCount(0)
        try {
          const response = await getEnclosureListSectionWise({
            section_id: sectionId,
            page_no: 1
          })
          if (response?.success && response?.data?.list_items) {
            const items = response.data.list_items
            const total = parseInt(response.data.total_count, 10) || 0
            setEnclosures(items)
            setTotalEnclosureCount(total)
            setHasMoreEnclosures(items.length < total)
          }
        } catch (error) {
          console.error('Error fetching enclosures:', error)
        } finally {
          setLoadingEnclosures(false)
        }
      }
      fetchEnclosures()
    } else {
      setEnclosures([])
      setSelectedEnclosures([])
      setEnclosurePage(1)
      setHasMoreEnclosures(true)
      setTotalEnclosureCount(0)
    }
  }, [sectionId])

  // Load more enclosures
  const loadMoreEnclosures = useCallback(async () => {
    if (loadingMoreEnclosures || !hasMoreEnclosures || !sectionId) return

    setLoadingMoreEnclosures(true)
    const nextPage = enclosurePage + 1
    try {
      const response = await getEnclosureListSectionWise({
        section_id: sectionId,
        page_no: nextPage
      })
      if (response?.success && response?.data?.list_items) {
        const newItems = response.data.list_items
        setEnclosures(prev => {
          const updatedList = [...prev, ...newItems]
          setHasMoreEnclosures(updatedList.length < totalEnclosureCount)
          return updatedList
        })
        setEnclosurePage(nextPage)
      } else {
        setHasMoreEnclosures(false)
      }
    } catch (error) {
      console.error('Error loading more enclosures:', error)
    } finally {
      setLoadingMoreEnclosures(false)
    }
  }, [loadingMoreEnclosures, hasMoreEnclosures, sectionId, enclosurePage, totalEnclosureCount])

  // Handle scroll in listbox
  const handleListboxScroll = useCallback(
    event => {
      const listbox = event.target
      if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 50) {
        loadMoreEnclosures()
      }
    },
    [loadMoreEnclosures]
  )

  const onSubmit = e => {
    e.preventDefault()
    setConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setConfirmDialog(false)

    let requestType = 'all'
    if (selectedEnclosures.length > 0) {
      requestType = 'enclosure'
    } else if (sectionId) {
      requestType = 'section'
    } else if (siteId) {
      requestType = 'site'
    }

    const payload = {
      request_type: requestType,
      site_id: siteId || null,
      section_id: sectionId || null,
      enclosure_ids: selectedEnclosures.length > 0 ? selectedEnclosures.map(e => e.enclosure_id) : null
    }
    await handleSubmitData(payload)
  }

  const handleClose = () => {
    setSiteId('')
    setSectionId('')
    setSections([])
    setEnclosures([])
    setSelectedEnclosures([])
    setEnclosureSearchText('')
    setEnclosurePage(1)
    setHasMoreEnclosures(true)
    setTotalEnclosureCount(0)
    setOpenDrawer(false)
  }

  const handleSiteChange = e => {
    setSiteId(e.target.value)
    setSectionId('')
    setSelectedEnclosures([])
    setEnclosures([])
    setEnclosurePage(1)
    setHasMoreEnclosures(true)
    setTotalEnclosureCount(0)
  }

  const handleSectionChange = e => {
    setSectionId(e.target.value)
    setSelectedEnclosures([])
    setEnclosurePage(1)
    setHasMoreEnclosures(true)
    setTotalEnclosureCount(0)
  }

  // Helper text based on current selection
  const getSelectionInfo = () => {
    if (selectedEnclosures.length > 0) {
      const enclosureNames = selectedEnclosures.map(e => e.user_enclosure_name || e.enclosure_name).join(', ')
      return `QR codes will be generated for ${selectedEnclosures.length} selected enclosure${selectedEnclosures.length > 1 ? 's' : ''}: ${enclosureNames}`
    }
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

  // Filter enclosures based on search text
  const filteredEnclosures = enclosures.filter(enclosure => {
    const name = enclosure.user_enclosure_name || enclosure.enclosure_name || ''
    return name.toLowerCase().includes(enclosureSearchText.toLowerCase())
  })

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
                onChange={handleSectionChange}
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

            {/* Enclosure Multi-Select - shows when section is selected */}
            {sectionId && (
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={filteredEnclosures}
                value={selectedEnclosures}
                onChange={(event, newValue) => {
                  if (newValue.length <= 10) {
                    setSelectedEnclosures(newValue)
                  }
                }}
                getOptionDisabled={option =>
                  selectedEnclosures.length >= 10 &&
                  !selectedEnclosures.some(e => e.enclosure_id === option.enclosure_id)
                }
                getOptionLabel={option => option.user_enclosure_name || option.enclosure_name || ''}
                isOptionEqualToValue={(option, value) => option.enclosure_id === value.enclosure_id}
                loading={loadingEnclosures || loadingMoreEnclosures}
                onInputChange={(event, newInputValue) => setEnclosureSearchText(newInputValue)}
                ListboxProps={{
                  onScroll: handleListboxScroll,
                  ref: listboxRef,
                  style: { maxHeight: 250 }
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                      checkedIcon={<CheckBoxIcon fontSize='small' />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.user_enclosure_name || option.enclosure_name}
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.enclosure_id}
                      label={option.user_enclosure_name || option.enclosure_name}
                      size='small'
                    />
                  ))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label={`Select Enclosures (Optional - Max 10)`}
                    placeholder={selectedEnclosures.length === 0 ? 'Search & select enclosures' : ''}
                    helperText={selectedEnclosures.length > 0 ? `${selectedEnclosures.length}/10 selected` : ''}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {(loadingEnclosures || loadingMoreEnclosures) ? (
                            <CircularProgress color='inherit' size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                noOptionsText={loadingEnclosures ? 'Loading...' : 'No enclosures found'}
              />
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
