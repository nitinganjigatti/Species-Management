import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { Checkbox, Divider, Drawer, Grid, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

const leftMenu = [
  { id: 1, name: 'Expiry Date' },
  { id: 2, name: 'Near Expiry' },
  { id: 3, name: 'Medicine' }
]

const ReturnReportDrawer = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  onApplyFilter,
  selectedOptions,
  setSelectedOptions
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])

  //   const [selectedOptions, setSelectedOptions] = useState({
  //     'Batch Number': [],
  //     pharmacy: [],
  //     Medicine: []
  //   })

  const MEDICINE_ALL = 'all'
  const MEDICINE_CONTROLLED = 'controlled'
  const MEDICINE_PRESCRIPTION = 'prescription'

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
  }

  const handleMenuClick = menu => {
    setSelectedMenu(menu)
  }

  const handleCheckbox = useCallback(
    (id, menuName) => {
      setSelectedOptions(prevOptions => {
        const isSelected = prevOptions[menuName]?.includes(id)

        return {
          ...prevOptions,
          [menuName]: isSelected
            ? prevOptions[menuName].filter(itemId => itemId !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      })
    },
    [setSelectedOptions]
  )

  const handleMedicineCheckbox = useCallback(
    id => {
      handleCheckbox(id, 'Medicine')
    },
    [handleCheckbox]
  )

  const applyFilters = () => {
    const filterData = {}

    let controlled = 0
    let prescription = 0

    if (
      selectedOptions['Medicine'].includes(MEDICINE_CONTROLLED) &&
      selectedOptions['Medicine'].includes(MEDICINE_PRESCRIPTION)
    ) {
      controlled = 1
      prescription = 1
    } else if (selectedOptions['Medicine'].includes(MEDICINE_CONTROLLED)) {
      controlled = 1
      prescription = 0
    } else if (selectedOptions['Medicine'].includes(MEDICINE_PRESCRIPTION)) {
      controlled = 0
      prescription = 1
    }

    // Attach medicine options to object to send
    filterData['Medicine'] = {
      controlled: controlled,
      prescription: prescription
    }

    onApplyFilter(filterData)
    setOpenFilterDrawer(false)
  }

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
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
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
          <Grid item md={4} sm={4} xs={4}>
            {leftMenu?.map(menu => (
              <Box
                key={menu.id}
                sx={{
                  width: '190px',
                  bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px'
                }}
                onClick={() => handleMenuClick(menu)}
              >
                <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                  {menu.name}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item md={8} sm={8} xs={8}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 185px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
            >
              {selectedMenu.name === 'Expiry Date' ? (
                <>
                  <CommonDateRangePickers />
                </>
              ) : selectedMenu.name === 'Near Expiry' ? (
                <></>
              ) : selectedMenu.name === 'Medicine' ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={
                        selectedOptions['Medicine'].includes(MEDICINE_CONTROLLED) &&
                        selectedOptions['Medicine'].includes(MEDICINE_PRESCRIPTION)
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedOptions(prev => ({
                            ...prev,
                            Medicine: [MEDICINE_CONTROLLED, MEDICINE_PRESCRIPTION]
                          }))
                        } else {
                          setSelectedOptions(prev => ({
                            ...prev,
                            Medicine: []
                          }))
                        }
                      }}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={selectedOptions['Medicine'].includes(MEDICINE_CONTROLLED)}
                      onChange={() => handleMedicineCheckbox(MEDICINE_CONTROLLED)}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Controlled</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={selectedOptions['Medicine'].includes(MEDICINE_PRESCRIPTION)}
                      onChange={() => handleMedicineCheckbox(MEDICINE_PRESCRIPTION)}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Prescription</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                </>
              ) : null}
            </Box>
          </Grid>
        </Grid>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCloseDrawer}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default ReturnReportDrawer
