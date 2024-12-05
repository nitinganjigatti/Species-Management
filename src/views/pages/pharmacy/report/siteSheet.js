import { Button, Checkbox, Divider, Drawer, FormControlLabel, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useState } from 'react'
import { LoadingButton } from '@mui/lab'

const SiteSheet = ({
  openSiteDrawer,
  setOpenSiteDrawer,
  sites,
  setSites,
  selectedSites,
  setSelectedSites,
  handleSelectedSite
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [tempSelectedSites, setTempSelectedSites] = useState([...selectedSites])

  const handleSelectAll = event => {
    if (event.target.checked) {
      setTempSelectedSites(sites.map(site => site.site_id))
    } else {
      setTempSelectedSites([])
    }
  }

  const handleToggleSite = siteId => {
    if (tempSelectedSites.includes(siteId)) {
      setTempSelectedSites(tempSelectedSites.filter(id => id !== siteId))
    } else {
      setTempSelectedSites([...tempSelectedSites, siteId])
    }
  }

  const filteredSites = sites.filter(site => site.site_name.toLowerCase().includes(searchValue.toLowerCase()))

  // const handleConfirmSelection = () => {
  //   console.log('Selected Sites >', tempSelectedSites)

  //   // setSelectedSites(tempSelectedSites) // Update the main state
  //   // handleSelectedSite(tempSelectedSites) // Apply filtering
  //   // setOpenSiteDrawer(false) // Close the drawer
  // }

  // const handleConfirmSelection = () => {
  //   // const totalSites = [...selectedSites]
  //   const SelectedArr = [...tempSelectedSites]

  //   const sortSelectedSelection = SelectedArr.sort((a, b) => a - b)
  //   setSelectedSites(totalSlected)
  //   console.log('SortSelected >>', totalSlected)
  //   // setSelectedSites(tempSelectedSites) // Update parent state
  //   // handleSelectedSite(tempSelectedSites) // Trigger data filtering
  //   // setOpenSiteDrawer(false) // Close the drawer
  // }

  // const handleConfirmSelection = () => {
  //   debugger
  //   const totalSites = [...sites] // Assuming sites is an array of objects
  //   const selectedArr = [...tempSelectedSites] // Array of selected site IDs

  //   const sortedSelectedSites = selectedArr.sort((a, b) => a - b)

  //   const sortedUnSelectedSites = totalSites
  //     .filter(site => !sortedSelectedSites.includes(site.site_id))
  //     .sort((a, b) => a.site_name.localeCompare(b.site_name))

  //   setSelectedSites([...sortedUnSelectedSites.map(site => site.site_id), ...sortedSelectedSites])

  //   console.log('Sorted Sites:', [...sortedUnSelectedSites.map(site => site.site_id), ...sortedSelectedSites])

  //   handleSelectedSite(sortedSelectedSites)

  //   setOpenSiteDrawer(false)
  // }

  const handleConfirmSelection = () => {
    debugger
    const totalSites = [...sites] // Assuming sites is an array of objects
    const selectedArr = [...tempSelectedSites] // Array of selected site IDs

    // Sort the selected site IDs
    const sortedSelectedSites = selectedArr.sort((a, b) => a - b)

    // Get unselected sites and sort them alphabetically
    const sortedUnSelectedSites = totalSites
      .filter(site => !sortedSelectedSites.includes(site.site_id))
      .sort((a, b) => a.site_name.localeCompare(b.site_name))

    // Update selectedSites with merged and sorted list
    setSelectedSites([...sortedUnSelectedSites.map(site => site.site_id), ...sortedSelectedSites])

    // Merge and update the `sites` prop
    const mergedSites = [
      ...totalSites.filter(site => sortedSelectedSites.includes(site.site_id)),
      ...sortedUnSelectedSites
    ]

    setSites(mergedSites) // Assuming `setSites` is a state setter for `sites`

    console.log('Merged and Sorted Sites:', mergedSites)

    handleSelectedSite(sortedSelectedSites) // Additional action
    setOpenSiteDrawer(false) // Close the drawer
  }

  const theme = useTheme()

  return (
    // <Drawer
    //   anchor='right'
    //   open={openSiteDrawer}
    //   ModalProps={{ keepMounted: true }}
    //   sx={{
    //     '& .MuiDrawer-paper': { width: ['100%', '562px'] },
    //     position: 'relative',
    //     display: 'flex',
    //     flexDirection: 'column',
    //     gap: '24px'
    //   }}
    // >
    //   <Box
    //     sx={{
    //       bgcolor: theme => theme.palette.customColors.lightBg,
    //       width: '100%',
    //       height: '100%',
    //       p: 3
    //     }}
    //   >
    //     {/* Header */}
    //     <Box
    //       className='sidebar-header'
    //       sx={{
    //         display: 'flex',
    //         justifyContent: 'space-between',
    //         alignItems: 'center',
    //         mb: 2
    //       }}
    //     >
    //       <Typography variant='h6'>
    //         Sites - {selectedSites.length}/{sites.length}
    //       </Typography>
    //       <IconButton size='small' onClick={() => setOpenDrawer(false)}>
    //         <Icon icon='mdi:close' fontSize={20} />
    //       </IconButton>
    //     </Box>

    //     {/* Search Field */}
    //     <TextField
    //       fullWidth
    //       placeholder='Search'
    //       value={searchValue}
    //       onChange={e => setSearchValue(e.target.value)}
    //       sx={{ mb: 2 }}
    //     />

    //     {/* Select All */}
    //     <FormControlLabel
    //       control={
    //         <Checkbox
    //           checked={selectedSites.length === sites.length}
    //           onChange={handleSelectAll}
    //           indeterminate={selectedSites.length > 0 && selectedSites.length < sites.length}
    //         />
    //       }
    //       label='Select All'
    //       sx={{ mb: 2 }}
    //     />

    //     {/* Site List */}
    //     <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
    //       {filteredSites.map(site => (
    //         <FormControlLabel
    //           key={site.site_id}
    //           control={
    //             <Checkbox
    //               checked={selectedSites.includes(site.site_id)}
    //               onChange={() => handleSiteToggle(site.site_id)}
    //             />
    //           }
    //           label={site.site_name}
    //         />
    //       ))}
    //     </Box>

    //     {/* Confirm Button */}
    //     <Button fullWidth variant='contained' color='primary' onClick={handleConfirm} sx={{ mt: 3 }}>
    //       Confirm
    //     </Button>
    //   </Box>
    // </Drawer>
    <Drawer
      anchor='right'
      open={openSiteDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, fontFamily: 'Inter' }}>
            Sites - {tempSelectedSites.length}/{sites.length}
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpenSiteDrawer(false)}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Drawer Content */}
      <Box sx={{ p: 5, backgroundColor: 'background.default', overflowY: 'auto' }}>
        <Box
          sx={{
            p: 3,
            flex: 1,
            width: '100%',
            display: 'flex',
            backgroundColor: '#FFFF !important',
            flexDirection: 'column',
            gap: 3,
            borderRadius: '8px'
          }}
        >
          {/* Search Field */}
          <TextField
            fullWidth
            placeholder='Search'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Select All */}
          <FormControlLabel
            control={
              <Checkbox
                checked={tempSelectedSites.length === sites.length}
                onChange={handleSelectAll}
                indeterminate={tempSelectedSites.length > 0 && tempSelectedSites.length < sites.length}
              />
            }
            label={
              <Typography sx={{ color: '#839D8D', fontSize: '16px', fontFamily: 'Inter', fontWeight: 400 }}>
                Select All
              </Typography>
            }
            sx={{ mb: 1, ml: 1 }}
          />
          <Divider sx={{ mb: 4 }} />

          {/* Sites List */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: '600px'
            }}
          >
            {filteredSites.map(site => (
              <Box
                key={site.site_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ml: 1,
                  cursor: 'pointer'
                }}
                onClick={() => handleToggleSite(site.site_id)}
              >
                <Checkbox
                  checked={tempSelectedSites.includes(site.site_id)}
                  onChange={e => {
                    e.stopPropagation()
                    handleToggleSite(site.site_id)
                  }}
                />
                <Typography
                  variant='body2' 
                  sx={{
                    fontWeight: 400,
                    fontFamily: 'Inter',
                    color: '#839D8D',
                    fontSize: '16px',
                    flex: 1 // Allows text to grow naturally while respecting spacing
                  }}
                >
                  {site.site_name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Bottom Buttons */}
      <Box
        sx={{
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton fullWidth variant='contained' size='large' onClick={() => handleConfirmSelection()}>
          Confirm
        </LoadingButton>
      </Box>
    </Drawer>
  )
}
export default SiteSheet
