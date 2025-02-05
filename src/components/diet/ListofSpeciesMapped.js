import React, { useEffect, useState } from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  IconButton,
  Grid,
  TextField,
  CardContent,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { deleteSpeciesFromDiet } from 'src/lib/api/diet/dietList'
import Toaster from 'src/components/Toaster'

const ListOfSpeciesMapped = ({
  isOpennew,
  setIsOpennew,
  onSelectedSpeciesChange,
  setSelectedSpecies,
  speciesData,
  speciesview,
  dietDetails,
  dietId,
  refreshSpeciesData,
  refreshDietDetails,
  searchQuery,
  setSearchQuery,
  speciestotalcount,
  setspeciesview,
  handleScroll,
  setLoading,
  loading,
  setPageNo,
  pageNo,
  isLoadingMore,
  tempSelectedSpecies,
  setTempSelectedSpecies
}) => {
  const theme = useTheme()

  const handleSearch = event => {
    setSearchQuery(event.target.value)
  }

  useEffect(() => {
    setPageNo(1)
  }, [isOpennew])

  const handleRemove = async species => {
    if (speciesview === 'select') {
      // Remove the matching species_id from tempSelectedSpecies
      const updatedTempSelectedSpecies = tempSelectedSpecies.filter(id => id !== species.species_id)
      setTempSelectedSpecies(updatedTempSelectedSpecies)
    } else {
      const speciesIds = [species.species_id]
      setLoading(true)
      const payload = {
        diet_id: dietId,
        species_ids: JSON.stringify(speciesIds)
      }
      try {
        const response = await deleteSpeciesFromDiet(payload)
        console.log(response, 'response')
        if (response.success === true) {
          await refreshSpeciesData()
          // const updatedSelectedSpecies = selectedSpecies.filter(item => item.species_id !== species.species_id)
          // onSelectedSpeciesChange(updatedSelectedSpecies)
          setPageNo(1)
          Toaster({ type: 'success', message: response?.message, duration: 2000 })
          setTempSelectedSpecies([])
          setSelectedSpecies([])
        } else {
          Toaster({
            type: 'error',
            message: response?.message
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Error removing species:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handelClose = () => {
    //alert('hi')
    setIsOpennew(false)
    refreshDietDetails()
    setspeciesview('')
  }

  const searchClose = () => {
    setSearchQuery('')
  }

  const mappedSpecies =
    speciesview === 'select'
      ? speciesData.filter(species => tempSelectedSpecies.includes(species.species_id))
      : speciesData.filter(species => species.mapped_to_diet)
  console.log(tempSelectedSpecies, 'tempSelectedSpecies')
  console.log(mappedSpecies, 'mappedSpecies')
  return (
    <Drawer
      anchor='right'
      open={isOpennew}
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>
            {speciesview === 'details' ? 'Species assigned' : 'Selected species'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handelClose}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      {speciesview === 'details' ? (
        <Grid item md={8} sm={8} xs={8}>
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              p: '16px',
              borderRadius: '8px',
              width: '525px',
              overflowY: 'auto',
              //height: 'calc(100vh - 250px)',
              '&::-webkit-scrollbar': {
                width: 0,
                height: 0
              },
              '-ms-overflow-style': 'none',
              scrollbarWidth: 'none'
            }}
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
                  mb: 0,
                  backgroundColor: theme.palette.background.paper
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
            </>
          </Box>
        </Grid>
      ) : (
        ''
      )}

      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          overflowY: 'auto',
          height: 'calc(100vh - 68px)',
          px: 6,
          py: 3
        }}
        onScroll={handleScroll}
      >
        {!loading && speciesData?.length === 0 ? (
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.secondary.dark,
              fontSize: '16px',
              fontWeight: 400,
              textAlign: 'center',
              mt: 4
            }}
          >
            No species selected.
          </Typography>
        ) : (
          <>
            {speciesview === 'select' ? (
              <ListItem
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  borderRadius: '8px'
                }}
              >
                <ListItemAvatar>
                  <Avatar src={dietDetails.diet_image} alt={dietDetails.diet_name} />
                </ListItemAvatar>
                <ListItemText
                  primary={dietDetails.diet_name}
                  primaryTypographyProps={{
                    sx: { color: theme.palette.secondary.dark, fontSize: '16px', fontWeight: 600 }
                  }}
                  secondary={
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.secondary.dark,
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                    >
                      {dietDetails.diet_no}
                    </Typography>
                  }
                ></ListItemText>
              </ListItem>
            ) : (
              ''
            )}
            <>
              {!loading ? (
                speciesview === 'select' ? (
                  // <Typography>You have selected {speciestotalcount || ''} species</Typography>
                  <Typography>You have selected {tempSelectedSpecies?.length} species</Typography>
                ) : (
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.secondary.dark,
                      fontSize: '14px',
                      fontWeight: 600,
                      pb: 1
                    }}
                  >
                    {speciestotalcount || ''} Species
                  </Typography>
                )
              ) : (
                <Typography>{''}</Typography>
              )}
            </>
            <List>
              {loading && pageNo === 1 ? (
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                    <CircularProgress />
                  </Box>
                </CardContent>
              ) : (
                mappedSpecies.map(species => (
                  <ListItem
                    key={species.id}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      borderRadius: '8px'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={species.default_icon}
                        alt={species.scientific_name}
                        sx={{
                          '& img': {
                            objectFit: 'contain'
                          }
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={species.scientific_name ? species.scientific_name : '-'}
                      primaryTypographyProps={{
                        sx: { color: theme.palette.secondary.dark, fontSize: '16px', fontWeight: 600 }
                      }}
                      secondary={
                        <>
                          <Typography
                            variant='body2'
                            sx={{
                              color: theme.palette.secondary.dark,
                              fontSize: '14px',
                              fontWeight: 400,
                              fontStyle: 'italic'
                            }}
                          >
                            {species.common_name ? species.common_name : '-'}
                          </Typography>
                        </>
                      }
                    />
                    <IconButton
                      edge='end'
                      onClick={() => handleRemove(species)}
                      sx={{
                        color: theme.palette.error.main,
                        position: 'absolute',
                        right: 38,
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'theme.palette.error.main',
                        padding: '0px'
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={18} />
                    </IconButton>
                  </ListItem>
                ))
              )}
              {isLoadingMore && (
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: '25px',
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
          </>
        )}
      </Box>
    </Drawer>
  )
}

export default ListOfSpeciesMapped
