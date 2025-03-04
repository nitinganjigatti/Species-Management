import React, { useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Checkbox,
  Drawer,
  Grid,
  IconButton,
  TextField,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  CardContent,
  CircularProgress,
  ListItemText
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Toaster from 'src/components/Toaster'
import Icon from 'src/@core/components/icon'
import { addSpeciestoDiet } from 'src/lib/api/diet/dietList'

const SpeciesMappedtoDiet = ({
  isOpen,
  setIsOpen,
  setIsOpennew,
  speciesData,
  onSelectedSpeciesChange,
  selectedSpecies,
  setspeciesview,
  speciestotalcount,
  setOpenFilterDrawer,
  selectedItems,
  dietId,
  dietname,
  refreshSpeciesData,
  refreshDietDetails,
  searchQuery,
  setSearchQuery,
  handleScroll,
  loading,
  setPageNo,
  isLoadingMore,
  pageNo,
  tempSelectedSpecies,
  setTempSelectedSpecies
}) => {
  const listInnerRef = useRef(null)

  const theme = useTheme()

  const handleSearch = event => {
    setSearchQuery(event.target.value)
  }

  const handleToggle = species => {
    const isAlreadySelected = tempSelectedSpecies.includes(species.species_id)

    const updatedTempSelectedSpecies = isAlreadySelected
      ? tempSelectedSpecies.filter(id => id !== species.species_id)
      : [...tempSelectedSpecies, species.species_id]

    setTempSelectedSpecies(updatedTempSelectedSpecies)
  }

  const handleSelectAll = () => {
    if (tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length) {
      setTempSelectedSpecies([])
    } else {
      const updatedTempSelectedSpecies = speciesData
        .filter(species => !species.mapped_to_diet)
        .map(species => species.species_id)
      setTempSelectedSpecies(updatedTempSelectedSpecies)
    }
  }

  const handleAdd = async () => {
    const updatedSpeciesIds = tempSelectedSpecies
    const speciesIdsNumbers = updatedSpeciesIds.map(id => Number(id))
    const payload = {
      diet_id: dietId,
      species_ids: JSON.stringify(speciesIdsNumbers)
    }

    try {
      const response = await addSpeciestoDiet(payload)
      console.log('API Response:', response)
      if (response.success === true) {
        Toaster({
          type: 'success',
          //message: tempSelectedSpecies?.length + ' ' + `Species successfully added to ${dietname} diet`,
          message: response.message
        })
        onSelectedSpeciesChange(updatedSpeciesIds)
        refreshDietDetails()
        setIsOpen(false)
        refreshSpeciesData()
        setspeciesview('')
        setTempSelectedSpecies([])
        setPageNo(1)
        setSearchQuery('')
      } else {
        Toaster({
          type: 'error',
          message: response?.message
        })
      }
    } catch (error) {
      console.error('Error adding species to diet:', error)
    }
  }

  const handelClose = () => {
    setTempSelectedSpecies(selectedSpecies)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleSelectedclick = val => {
    console.log(tempSelectedSpecies, 'ppp')
    if (val === 'select') {
      setIsOpennew(true)
      // setIsOpen(false)
      setspeciesview(val)
    } else {
      setIsOpennew(true)
      setIsOpen(false)
      setspeciesview(val)
      setTempSelectedSpecies([...selectedSpecies])
    }
  }

  const handleFilter = () => {
    setOpenFilterDrawer(true)
  }

  const searchClose = () => {
    setSearchQuery('')
  }

  return (
    <Drawer
      anchor='right'
      open={isOpen}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      {console.log(theme, 'theme')}
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
          <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Assign species
          </Typography>
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mr: '14px', mt: '4px' }}
          onClick={handelClose}
        >
          <IconButton size='small' sx={{ color: theme.palette.primary.light }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      {/* Search and filter start */}

      <Grid item md={8} sm={8} xs={8}>
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            p: '16px',
            borderRadius: '8px',
            width: '575px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 0, height: 0 },
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
                justifyContent: 'space-between',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #C3CEC7',
                  borderRadius: '4px',
                  padding: '0 8px',
                  height: '40px',
                  mb: 0,
                  backgroundColor: theme.palette.background.paper,
                  width: '100%',
                  mr: 5
                }}
              >
                <Icon icon='mi:search' />
                <TextField
                  variant='outlined'
                  placeholder='Search'
                  value={searchQuery}
                  onChange={handleSearch}
                  InputProps={{
                    disableUnderline: false
                  }}
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
                />
                {searchQuery ? <Icon icon='mdi:close' onClick={searchClose} /> : ''}
              </Box>
              {/* <LoadingButton
                size='medium'
                variant={
                  selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                    ? theme.palette.primary.dark
                    : 'outlined'
                }
                startIcon={<Icon icon='bi:filter' />}
                //onClick={handlefilterButton}
                sx={{
                  lineHeight: '2',
                  backgroundColor:
                    selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                      ? theme.palette.primary.dark
                      : '',
                  color:
                    selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                      ? '#fff'
                      : theme.palette.customColors.OnSurfaceVariant,
                  '&:hover': {
                    backgroundColor:
                      selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                        ? theme.palette.primary.main
                        : ''
                  }
                }}
                onClick={handleFilter}
              >
                {selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                  ? Object.values(selectedItems).reduce((total, array) => total + array.length, 0)
                  : '0'}
              </LoadingButton> */}
            </Box>
          </>
        </Box>
      </Grid>

      {/* Search and filter end */}

      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          overflowY: 'auto',
          height: 'calc(100vh - 250px)',
          pb: '122px',
          pl: 6,
          pr: 6,
          pb: 6,
          pt: 3
        }}
        onScroll={handleScroll}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            pb: 1
          }}
        >
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            All species ({speciestotalcount})
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
                  tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                    ? theme.palette.primary.main
                    : '#44544A',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                p: 0
              }}
              onClick={handleSelectAll}
            >
              {tempSelectedSpecies?.length === speciesData.length ? 'Select all' : 'Select all'}
            </Button>

            <Checkbox
              //disabled={tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length}
              checked={tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length}
              onChange={handleSelectAll}
              inputProps={{ 'aria-label': 'Select all species' }}
              sx={{
                '&.Mui-checked': {
                  color: theme.palette.primary.main
                },
                '& .MuiSvgIcon-root': {
                  width: '19px',
                  height: '19px',
                  border: '2px dotted',
                  borderColor:
                    tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                      ? theme.palette.primary.main
                      : '#44544A',
                  color:
                    tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                      ? theme.palette.primary.main
                      : '#44544A'
                },
                mr: 1
              }}
            />
          </Box>
        </Box>

        {loading && pageNo === 1 ? (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        ) : (
          <List>
            {speciesData.map(species => (
              <ListItem
                key={species.id}
                secondaryAction={
                  <Box
                    sx={{
                      backgroundColor: species.mapped_to_diet ? '' : '#F2FFF8',
                      pl: 3,
                      pr: 4,
                      py: 4.3,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Checkbox
                      disabled={species.mapped_to_diet}
                      edge='end'
                      checked={tempSelectedSpecies.includes(species.species_id) || species.mapped_to_diet}
                      onChange={() => handleToggle(species)}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        },
                        '& .MuiSvgIcon-root': {
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          color: species.mapped_to_diet ? '#7A8684' : theme.palette.primary.main
                        }
                      }}
                    />
                  </Box>
                }
                sx={{
                  background: species.mapped_to_diet ? '#DAE7DF' : theme.palette.background.paper,
                  borderRadius: '8px',
                  border: tempSelectedSpecies.includes(species.species_id)
                    ? '1px solid' + theme.palette.primary.main
                    : '',
                  mb: 3,

                  '& .MuiListItemSecondaryAction-root': {
                    right: 0
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      '& img': {
                        objectFit: 'contain'
                      }
                    }}
                    src={species.default_icon}
                    alt={species.scientific_name}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={species.scientific_name ? species.scientific_name : '-'}
                  primaryTypographyProps={{
                    sx: { color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }
                  }}
                  secondary={
                    <>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '16px',
                          fontWeight: 400,
                          fontStyle: 'italic'
                        }}
                      >
                        {species.common_name ? species.common_name : '-'}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            {isLoadingMore && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: '135px',
                  transform: 'translateX(217px)',
                  zIndex: 999,
                  justifyContent: 'center',
                  display: 'flex'
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </List>
        )}
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
          justifyContent: 'space-between',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123,
          pl: 7
        }}
      >
        {tempSelectedSpecies?.length > 0 ? (
          <Box
            sx={{ display: 'flex', alignItems: 'center', width: '35%', color: theme.palette.primary.main }}
            onClick={() => handleSelectedclick('select')}
          >
            <Typography
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '14px',
                mr: 1
              }}
            >
              {/* {speciesData.filter(species => species.mapped_to_diet)?.length} Selected */}
              {tempSelectedSpecies?.length} Selected
            </Typography>
            <Icon icon='mdi:chevron-down' />
          </Box>
        ) : (
          ''
        )}

        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          disabled={tempSelectedSpecies?.length === 0}
          onClick={handleAdd}
        >
          ASSIGN
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesMappedtoDiet
