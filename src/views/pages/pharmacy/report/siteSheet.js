import { Checkbox, Divider, Drawer, FormControlLabel, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useEffect, useRef, useState } from 'react'
import { LoadingButton } from '@mui/lab'

const SiteSheet = ({
  openSiteDrawer,
  setOpenSiteDrawer,
  sites,
  setSites,
  selectedSites,
  setSelectedSites,
  apiFilterParams,
  handleSelectedSite
}) => {
  const searchInputRef = useRef(null)

  const [searchValue, setSearchValue] = useState('')
  const [tempSelectedSites, setTempSelectedSites] = useState([])

  // console.log('selected Sites >', selectedSites)

  useEffect(() => {
    if (openSiteDrawer) {
      const storedSiteIds = selectedSites.includes('All Sites') ? ['All Sites'] : selectedSites
      setTempSelectedSites(storedSiteIds)
    } else {
      // Clear search when drawer closes
      setSearchValue('')
    }
  }, [openSiteDrawer, selectedSites])

  useEffect(() => {
    if (openSiteDrawer) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100) // shorter delay for better UX
    }
  }, [openSiteDrawer])

  const handleSelectAll = event => {
    const filteredSiteIds = filteredSites.map(site => site.site_id)
    if (event.target.checked) {
      // Add only filteredSiteIds (merge with previous)
      setTempSelectedSites(prev => [...new Set([...prev, ...filteredSiteIds])])
    } else {
      // Remove only filteredSiteIds from current selection
      setTempSelectedSites(prev => prev.filter(site_id => !filteredSiteIds.includes(site_id)))
    }
  }

  const handleClearFilter = () => {
    setTempSelectedSites([]) // Clear temporary selection
    setSearchValue('') // Clear search input
    // setSelectedSites([]) // Clear selected sites in context
  }

  const handleToggleSite = siteId => {
    if (tempSelectedSites.includes(siteId)) {
      setTempSelectedSites(tempSelectedSites.filter(id => id !== siteId))
    } else {
      setTempSelectedSites([...tempSelectedSites, siteId])
    }
  }

  const filteredSites = sites.filter(site => site.site_name.toLowerCase().includes(searchValue.toLowerCase()))

  const handleConfirmSelection = () => {
    const totalSites = [...sites]
    const selectedArr = [...tempSelectedSites]

    const sortedSelectedSites = selectedArr.sort((a, b) => a - b)

    const sortedUnSelectedSites = totalSites
      .filter(site => !sortedSelectedSites.includes(site.site_id))
      .sort((a, b) => a.site_name.localeCompare(b.site_name))

    setSelectedSites([...sortedUnSelectedSites.map(site => site.site_id), ...sortedSelectedSites])

    const mergedSites = [
      ...totalSites.filter(site => sortedSelectedSites.includes(site.site_id)),
      ...sortedUnSelectedSites
    ]

    setSites(mergedSites)

    console.log('Merged and Sorted Sites:', mergedSites)

    handleSelectedSite(sortedSelectedSites)
    setOpenSiteDrawer(false)
  }

  const theme = useTheme()

  return (
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

      <Box sx={{ p: 5, backgroundColor: 'background.default', overflowY: 'auto', height: 'calc(100dvh - 120px)' }}>
        <Box
          sx={{
            p: 3,
            flex: 1,
            width: '100%',
            height: 'calc(100% - 60px)',
            display: 'flex',
            backgroundColor: '#FFFF !important',
            flexDirection: 'column',
            gap: 3,
            borderRadius: '8px'
          }}
        >
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder='Search'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            sx={{ mb: 2 }}
          />

          {filteredSites.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox

                  // checked={tempSelectedSites.length === sites.length}
                  onChange={handleSelectAll}

                  // indeterminate={tempSelectedSites.length > 0 && tempSelectedSites.length < sites.length}
                  checked={filteredSites.every(site => tempSelectedSites.includes(site.site_id))}
                  indeterminate={
                    filteredSites.some(site => tempSelectedSites.includes(site.site_id)) &&
                    !filteredSites.every(site => tempSelectedSites.includes(site.site_id))
                  }
                />
              }
              label={
                <Typography
                  sx={{
                    color: theme.palette.customColors.Outline,
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    fontWeight: 400
                  }}
                >
                  Select All
                </Typography>
              }
              sx={{ mb: 1, ml: 1 }}
            />
          )}
          <Divider sx={{ mb: 4 }} />

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
                    color: theme.palette.customColors.Outline,
                    fontSize: '16px',
                    flex: 1
                  }}
                >
                  {site.site_name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearFilter}>
          CLEAR ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={() => handleConfirmSelection()}>
          Confirm
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SiteSheet
