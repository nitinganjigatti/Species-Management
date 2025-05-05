import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { Card, CardContent, CardHeader, Drawer, Grid, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import SelectRacksListDrawer from './SelectRacksListDrawer'
import SelectShelfListDrawer from './SelectShelfListDrawer'

const StockLocationFilter = ({
  openFilter,
  setOpenFilter,
  tabsForFilter,
  activeTab,
  setActiveTab,
  selectedItems,
  setSelectedItems,
  tempSelectedItems,
  setTempSelectedItems,
  openRackListDrawer,
  setRackListDrawer,
  items,
  setItems,
  shelvesData,
  setShelvesData,
  selectedShelves,
  setSelectedShelves,
  applyFilterCheck,
  setApplyFilterCheck,
  onApplyFilter
}) => {
  const theme = useTheme()

  const [collapsed, setCollapsed] = useState(true)
  const [openShelvesListDrawer, setOpenShelvesListDrawer] = useState(false)

  const handleCloseDrawer = () => {
    setOpenFilter(false)
    if (applyFilterCheck === false) {
      setTempSelectedItems({
        Racks: [],
        Shelves: []
      })
      setSelectedItems({
        Racks: [],
        Shelves: []
      })

      //   setItems({
      //     Racks: [],
      //     Shelves: []
      //   })
    }
  }

  const handleApplyFilter = () => {
    setApplyFilterCheck(true)
    const allShelvesId = tempSelectedItems?.Shelves.map(id => id)
    setSelectedItems({
      ...tempSelectedItems,
      Shelves: allShelvesId
    })

    console.log(allShelvesId)

    onApplyFilter(tempSelectedItems)
  }

  const handleCancelAll = () => {
    // Clear all tabs in tempSelectedItems
    const clearedTempSelectedItems = Object.keys(tempSelectedItems).reduce((acc, key) => {
      acc[key] = []

      return acc
    }, {})

    // Clear all tabs in selectedItems
    const clearedSelectedItems = Object.keys(selectedItems).reduce((acc, key) => {
      acc[key] = []

      return acc
    }, {})

    setTempSelectedItems(clearedTempSelectedItems)
    setSelectedItems(clearedSelectedItems)
    setOpenFilter(false)

    // setItems({ Racks: [], Shelves: [] })
  }

  const handleRemove = rackId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Racks: prev.Racks.filter(id => id !== rackId)
    }))
  }

  const handleRemoveShelves = shelfId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Shelves: prev.Shelves.filter(id => id !== shelfId)
    }))

    setShelvesData(prev => prev.filter(shelf => shelf.id !== shelfId.toString()))

    // Also update selectedShelves state
    if (setSelectedShelves) {
      setSelectedShelves(prev => prev.filter(id => id !== shelfId))
    }
  }

  useEffect(() => {
    if (activeTab === 'Racks') {
      setTempSelectedItems({ ...selectedItems })
    }
  }, [activeTab, openFilter])

  return (
    <>
      <Drawer
        anchor='right'
        open={openFilter}
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
              {tabsForFilter.map(tab => (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    padding: 1,
                    cursor: 'pointer',
                    backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                    color: theme.palette.primary.dark,
                    fontSize: '16px',
                    fontWeight: 400,
                    py: 4,
                    pl: 4,
                    borderTopLeftRadius: '6px',
                    borderBottomLeftRadius: '6px'
                  }}
                >
                  {tab}
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
                {activeTab === 'Racks' ? (
                  <>
                    <Card sx={{ border: '1px solid #C3CEC7', boxShadow: 'none' }}>
                      <CardHeader
                        title='Select Rack'
                        onClick={() => {
                          if (tempSelectedItems?.Shelves?.length === 0) {
                            //setCollapsed(!collapsed)
                            setRackListDrawer(true)
                          }
                        }}
                        disabled={tempSelectedItems?.Shelves?.length > 0}
                        sx={{
                          background: tempSelectedItems?.Shelves?.length > 0 ? '#0000000D' : '#E8F4F2',
                          p: 2,
                          pl: 4,
                          pr: 2,
                          '.MuiCardHeader-title': {
                            fontWeight: '500',
                            fontSize: '16px',
                            color: tempSelectedItems?.Shelves?.length > 0 ? '#44544A' : '#1F515B',
                            cursor: tempSelectedItems?.Shelves?.length > 0 ? '' : 'pointer'
                          }
                        }}
                        action={
                          <IconButton
                            size='small'
                            aria-label='collapse'
                            sx={{
                              color: '#44544A'
                            }}
                            disabled={tempSelectedItems?.Shelves?.length > 0}
                          >
                            <Icon
                              fontSize={20}
                              icon={
                                tempSelectedItems?.Shelves?.length
                                  ? 'mdi:lock'
                                  : collapsed
                                  ? 'mdi:chevron-down'
                                  : 'mdi:chevron-up'
                              }
                            />
                          </IconButton>
                        }
                      />
                      {tempSelectedItems?.Racks?.length > 0 && (
                        <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                          {items.Racks?.filter(rack => tempSelectedItems?.Racks?.includes(rack.id)).map(rack => (
                            <Box
                              key={rack.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                              }}
                            >
                              <Typography variant='body2' sx={{ color: '#000000' }}>
                                {rack.name}
                              </Typography>
                              <IconButton
                                edge='end'
                                onClick={() => handleRemove(rack.id)}
                                sx={{ color: theme.palette.error.dark }}
                                disabled={tempSelectedItems?.Shelves?.length > 0}
                              >
                                <Icon
                                  icon={shelvesData?.length > 0 ? 'carbon:close-outline' : 'carbon:close-outline'}
                                  fontSize={20}
                                />
                              </IconButton>
                            </Box>
                          ))}
                        </CardContent>
                      )}
                    </Card>

                    {/* Display selected shelves */}
                    {tempSelectedItems?.Racks?.length === 1 && (
                      <Card sx={{ border: '1px solid #C3CEC7', boxShadow: 'none', mt: '6%' }}>
                        <CardHeader
                          title='Select Shelves'
                          onClick={() => setOpenShelvesListDrawer(true)}
                          sx={{
                            background: tempSelectedItems?.Shelves?.length > 0 ? '#0000000D' : '#E8F4F2',
                            p: 2,
                            pl: 4,
                            pr: 2,
                            '.MuiCardHeader-title': {
                              fontWeight: '500',
                              fontSize: '16px',
                              color: tempSelectedItems?.Shelves?.length > 0 ? '#44544A' : '#1F515B',
                              cursor: tempSelectedItems?.Shelves?.length > 0 ? '' : 'pointer'
                            }
                          }}
                          action={
                            <IconButton size='small' aria-label='collapse' sx={{ color: '#44544A' }}>
                              <Icon fontSize={20} icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} />
                            </IconButton>
                          }
                        />
                        {tempSelectedItems?.Shelves?.length > 0 &&
                          shelvesData?.filter(shelf => tempSelectedItems?.Shelves?.includes(shelf.id))?.length > 0 && (
                            <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                              {shelvesData
                                .filter(shelf => tempSelectedItems?.Shelves?.includes(shelf.id))
                                .map(shelf => (
                                  <Box
                                    key={shelf.id}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mb: 2
                                    }}
                                  >
                                    <Typography variant='body2' sx={{ color: '#000000' }}>
                                      {shelf.name}
                                    </Typography>
                                    <IconButton
                                      edge='end'
                                      onClick={() => handleRemoveShelves(shelf.id)}
                                      sx={{ color: theme.palette.error.dark }}
                                    >
                                      <Icon icon='carbon:close-outline' fontSize={20} />
                                    </IconButton>
                                  </Box>
                                ))}
                            </CardContent>
                          )}
                      </Card>
                    )}
                  </>
                ) : (
                  ''
                )}
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
          <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCancelAll}>
            CANCEL ALL
          </LoadingButton>
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            onClick={handleApplyFilter}
            disabled={!Object.values(tempSelectedItems).some(array => array.length > 0)}
          >
            APPLY FILTER
          </LoadingButton>
        </Box>
      </Drawer>
      {openRackListDrawer && (
        <SelectRacksListDrawer
          setRackListDrawer={setRackListDrawer}
          openRackListDrawer={openRackListDrawer}
          tabsForFilter={tabsForFilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          items={items}
          tempSelectedItems={tempSelectedItems}
          setTempSelectedItems={setTempSelectedItems}
        />
      )}
      {openShelvesListDrawer && (
        <SelectShelfListDrawer
          open={openShelvesListDrawer}
          onClose={() => setOpenShelvesListDrawer(false)}
          rackId={tempSelectedItems?.Racks?.[0]}
          shelvesData={shelvesData}
          setShelvesData={setShelvesData}
          tempSelectedItems={tempSelectedItems}
          selectedShelves={selectedShelves}
          setSelectedShelves={setSelectedShelves}
          openFilterDrawer={openFilter}
          onSelectShelves={selectedShelves => {
            setTempSelectedItems(prev => ({
              ...prev,
              Shelves: selectedShelves
            }))
            setOpenShelvesListDrawer(false)
          }}
        />
      )}
    </>
  )
}

export default StockLocationFilter
