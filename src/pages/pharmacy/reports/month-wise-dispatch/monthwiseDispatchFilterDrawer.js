import React, { useRef, useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { LoadingButton } from '@mui/lab'
import { Box, Checkbox, debounce, Divider, Drawer, Grid, IconButton, TextField, Typography } from '@mui/material'

import Icon from 'src/@core/components/icon'

const MonthWisedispatchFilter = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  handleFruitSelection,
  selectedFruits,
  handleSelectAllChange,
  handleSearchChange,
  searchClose,
  storeList,
  fullStoreList,
  onApplyFilters,
  handleCloseDrawer,
  loading,
  setFilterSearchValue,
  filtersApplied,
  loadMoreData,
  isFetching,
  setFiltersApplied,
  filtersearchValue,
  tempSelectedStores,
  handleClose,
  setSelectedStores
}) => {
  const listInnerRef = useRef(null)

  const handleScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        loadMoreData()
      }
    }
  }

  useEffect(() => {
    console.log(filtersApplied, 'lll')
    const ref = listInnerRef.current

    if (tempSelectedStores.length > 0 && filtersApplied === true) {
      setFiltersApplied(false)
    }
    if (filtersApplied === true) {
      setFiltersApplied(false)
    }

    // Ensure that we are attaching the scroll event to the correct element
    if (ref) {
      ref.addEventListener('scroll', handleScroll)
    }

    // Cleanup event listener on unmount or when ref changes
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll)
      }
    }
  }, [listInnerRef, loading, filtersApplied, searchClose])

  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
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
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter - {tempSelectedStores.length} </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handleClose}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '525px',
                height: { xs: 'calc(100vh - 150px)', md: 'calc(100vh - 200px)' },
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
              ref={listInnerRef}
            >
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px',
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={filtersearchValue}
                    onChange={handleSearchChange}
                    sx={{
                      flex: 1,
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                    slotProps={{
                      input: {
                        disableUnderline: false
                      }
                    }}
                  />
                  {filtersearchValue ? <Icon icon='mdi:close' onClick={searchClose} /> : ''}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    checked={fullStoreList.length > 0 && tempSelectedStores.length === fullStoreList.length}
                    indeterminate={tempSelectedStores.length > 0 && tempSelectedStores.length < storeList.length}
                    onChange={handleSelectAllChange}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              <Box sx={{ mt: 2 }}>
                {!loading ? (
                  fullStoreList.length > 0 ? (
                    fullStoreList.map(fruit => (
                      <Box key={fruit.id} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Checkbox
                          checked={tempSelectedStores.includes(fruit.id)}
                          onChange={() => handleFruitSelection(fruit.id)}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                          {fruit.name}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ textAlign: 'center', mt: 6 }}>No data to show</Typography>
                  )
                ) : null}
              </Box>

              {isFetching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
      {/* bottom buttons */}
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCloseDrawer}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          onClick={onApplyFilters}
          disabled={tempSelectedStores.length > 0 || selectedFruits.length > 0 ? false : true}
        >
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

export default MonthWisedispatchFilter
