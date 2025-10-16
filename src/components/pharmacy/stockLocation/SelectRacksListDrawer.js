import { useTheme } from '@emotion/react'
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import SearchIcon from '@mui/icons-material/Search'

const SelectRacksListDrawer = ({
  setRackListDrawer,
  openRackListDrawer,
  items,
  setTempSelectedItems,
  tempSelectedItems
}) => {
  const theme = useTheme()

  const [pendingSelections, setPendingSelections] = useState({ Racks: [] })
  const [searchTerm, setSearchTerm] = useState('')

  const handleCloseDrawer = () => {
    setRackListDrawer(false)
    setTempSelectedItems(pendingSelections)
  }

  const handleCloseDrawericon = () => {
    setRackListDrawer(false)
  }

  const handleRackCheckboxChange = rack => {
    const isSelected = pendingSelections.Racks.includes(rack.id)

    const updatedSelection = isSelected
      ? pendingSelections.Racks.filter(id => id !== rack.id)
      : [...pendingSelections.Racks, rack.id]

    setPendingSelections({
      ...pendingSelections,
      Racks: updatedSelection
    })
  }

  useEffect(() => {
    if (openRackListDrawer) {
      setPendingSelections(tempSelectedItems)
    }
  }, [openRackListDrawer])

  const handleSelectAllRacks = () => {
    const allRackIds = items.Racks.map(rack => rack.id)
    setPendingSelections({
      ...pendingSelections,
      Racks: pendingSelections?.Racks?.length === allRackIds?.length ? [] : allRackIds
    })
  }

  //   const filteredRacks = items?.Racks.filter(rack => rack.name?.toLowerCase().includes(searchTerm?.toLowerCase()))

  const filteredRacks = Array.isArray(items?.Racks)
    ? items.Racks.filter(
        rack =>
          typeof rack.name === 'string' &&
          (searchTerm ? rack.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
      )
    : []

  return (
    <>
      <Drawer
        anchor='right'
        open={openRackListDrawer}
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
          sx={{
            bgcolor: '#FFF',
            borderRadius: '8px',
            overflow: 'hidden',
            width: '100%',
            maxWidth: 522,
            margin: '15px 20px 0px 20px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant='h6'
                sx={{
                  fontWeight: '500',
                  color: '#1F515B'
                }}
              >
                Choose Rack
              </Typography>
              <Typography variant='body2' sx={{ color: '#44544A' }}>
                Select a Rack from the list below
              </Typography>
            </Box>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawericon}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0' }}>
            <TextField
              fullWidth
              placeholder='Search'
              variant='outlined'
              size='small'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon sx={{ color: '#1F515B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        onClick={() => {
                          setSearchTerm('')
                        }}
                      >
                        <Icon icon='mdi:close' fontSize={20} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: { background: '#EFF5F2', borderRadius: '4px', padding: '4px 8px', color: '#1F515B' }
                }
              }}
            />
          </Box>

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ color: '#44544A' }}>
              Selected {pendingSelections?.Racks?.length} / {items?.Racks?.length}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Button
                size='small'
                sx={{
                  color:
                    pendingSelections?.Racks?.length === items?.Racks?.length ? theme.palette.primary.main : '#44544A',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  p: 0
                }}
                onClick={handleSelectAllRacks}
              >
                {/* {tempSelectedSpecies?.length === speciesData.length ? 'Select all' : 'Select all'} */}
                Select all
              </Button>

              <Checkbox
                checked={pendingSelections?.Racks?.length === items?.Racks?.length}
                onChange={handleSelectAllRacks}
                slotProps={{ 'aria-label': 'Select all racks' }}
                sx={{
                  '&.Mui-checked': {
                    color: theme.palette.primary.main
                  },
                  '& .MuiSvgIcon-root': {
                    width: '19px',
                    height: '19px',
                    border: '2px dotted'
                  },
                  mr: 1
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 2,
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.grey[400],
                borderRadius: '2px'
              }
            }}
          >
            {filteredRacks.length > 0 ? (
              filteredRacks.map(rack => (
                <ListItem
                  key={rack.id}
                  sx={{
                    pr: 1.5,
                    pl: 3,
                    mb: 4,
                    border: '1px solid',
                    borderColor: pendingSelections?.Racks.includes(rack.id) ? '#80E0A3' : '#C3CEC7',
                    borderRadius: '8px',
                    bgcolor: pendingSelections.Racks.includes(rack.id) ? '#E1F9ED' : 'transparent',
                    height: '70px'
                  }}
                >
                  <ListItemText
                    primary={rack.name}
                    slotProps={{
                      primary: { fontWeight: 'bold', color: '#1F515B' },
                      secondary: { color: '#44544A' }
                    }}
                  />
                  <Checkbox
                    checked={pendingSelections?.Racks.includes(rack.id)}
                    onChange={() => handleRackCheckboxChange(rack)}
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 15 }}>No Racks found</Typography>
            )}
          </Box>
          <Box
            sx={{
              alignSelf: 'center',
              width: '100%',
              p: 2
            }}
          >
            <Button
              fullWidth
              variant='contained'
              color='primary'
              onClick={handleCloseDrawer}
              sx={{
                alignSelf: 'center',
                mb: 20,
                mt: 5,
                zIndex: 1,
                p: 2
              }}
              disabled={pendingSelections.Racks.length === 0}
            >
              CONTINUE
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SelectRacksListDrawer
