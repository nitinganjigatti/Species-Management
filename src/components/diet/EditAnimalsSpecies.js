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
  CircularProgress,
  Switch,
  Button,
  Tab
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { deleteSpeciesFromDiet } from 'src/lib/api/diet/dietList'
import Toaster from 'src/components/Toaster'
import { useMediaQuery } from '@mui/material'
import { editAssigntoDiet } from 'src/lib/api/diet/dietList'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { right } from '@popperjs/core'

const EditAnimalSpeciesMapped = ({
  setIsOpenTabs,
  setIsOpenTabsEdit,
  isOpentabEdit,
  speciesData,
  speciesview,
  dietDetails,
  refreshDietDetails,
  searchQuery,
  setSearchQuery,
  speciestotalcount,
  setspeciesview,
  handleScroll,
  loading,
  setPageNo,
  pageNo,
  isLoadingMore,
  tempSelectedSpecies,
  setTempSelectedSpecies,
  setspeciesData,
  selectionType,
  setSelectionType,
  setPrimaryStatus,
  primaryStatus,
  setAllFetchedData,
  allFetchedData,
  setspeciestotalcount,
  debouncedFetchList
}) => {
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [loader, setLoader] = useState(false)
  const [removedIds, setRemovedIds] = useState([])
  const [originalData, setOriginalData] = useState([])

  const handleSearch = event => {
    setSearchQuery(event.target.value)
  }

  const handleChange = (event, newValue) => {
    setSelectionType(newValue)
    setPageNo(1)
  }

  useEffect(() => {
    setPageNo(1)
  }, [isOpentabEdit])

  // Update your remove function to work with the new state
  const handleRemovenew = species => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
    const id = species[idField]

    // Add to removedIds
    setRemovedIds(prev => [...prev, species.assign_id])

    // Filter out from both displayed data and all fetched data
    const updatedSpeciesData = speciesData.filter(item => item.assign_id !== species.assign_id)
    const updatedAllData = allFetchedData.filter(item => item.assign_id !== species.assign_id)

    setspeciesData(updatedSpeciesData)
    setAllFetchedData(updatedAllData)

    // Update tempSelectedSpecies
    const updatedTempSelectedSpecies = tempSelectedSpecies.filter(itemId => itemId !== id)
    setTempSelectedSpecies(updatedTempSelectedSpecies)

    // Update primaryStatus
    setPrimaryStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[id]

      return newStatus
    })

    // Update total count since we removed an item
    setspeciestotalcount(prev => prev - 1)
  }

  useEffect(() => {
    if (speciesData && speciesData.length > 0) {
      setOriginalData(speciesData)
      const initialPrimaryStatus = {}

      speciesData.forEach(item => {
        const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
        const id = item[idField]

        initialPrimaryStatus[id] = item.is_primary || '0'
      })

      // Only update if there are new species not already in primaryStatus
      setPrimaryStatus(prev => {
        const newStatus = { ...prev }
        let needsUpdate = false

        speciesData.forEach(item => {
          const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
          const id = item[idField]
          if (newStatus[id] === undefined) {
            newStatus[id] = item.is_primary || '0'
            needsUpdate = true
          }
        })

        return needsUpdate ? newStatus : prev
      })
    }
  }, [isOpentabEdit, speciesData, selectionType])

  const getChangedRecords = () => {
    return speciesData
      .filter(item => {
        const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
        const id = item[idField]
        const originalItem = originalData.find(original => original.assign_id === item.assign_id)

        return primaryStatus[id] !== undefined && (!originalItem || primaryStatus[id] !== originalItem.is_primary)
      })
      .map(item => {
        const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
        const id = item[idField]

        return {
          assign_id: item.assign_id,
          is_primary: primaryStatus[id] || '0'
        }
      })
  }

  const hasChanges = () => {
    const editData = getChangedRecords()

    return editData.length > 0 || removedIds.length > 0
  }

  const handleAdd = async () => {
    const editData = getChangedRecords()

    // Convert string IDs to numbers
    const numericRemovedIds = removedIds.map(id => Number(id))
    console.log(numericRemovedIds, 'numericRemovedIds')

    const payload = {
      edit_data: JSON.stringify(editData),
      remove_ids: JSON.stringify(numericRemovedIds)
    }

    console.log('Final Payload:', payload)

    setLoader(true)
    try {
      const response = await editAssigntoDiet(payload)
      if (response.success === true) {
        setIsOpenTabsEdit(false)
        setIsOpenTabs(false)
        setRemovedIds([])
        setspeciesview('')
        refreshDietDetails()
        Toaster({
          type: 'success',
          message: 'Primary diet successfully updated'

          //message: response.message
        })
      } else {
        Toaster({
          type: 'error',
          message: response?.message
        })
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
    } finally {
      setLoader(false)
    }
  }

  const handelClose = () => {
    setIsOpenTabsEdit(false)
    refreshDietDetails()

    //setspeciesview('')
    setSearchQuery('')
  }

  const searchClose = () => {
    setSearchQuery('')
    debouncedFetchList('')
  }

  const handleTogglePrimary = item => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
    const id = item[idField]

    setPrimaryStatus(prev => ({
      ...prev,
      [id]: prev[id] === '1' ? '0' : '1' // Toggle between '1' and '0'
    }))
  }

  const mappedSpecies =
    speciesview === 'select'
      ? speciesData.filter(species => tempSelectedSpecies.includes(species.species_id))
      : speciesData.filter(species => species.mapped_to_diet)

  return (
    <Drawer
      anchor='right'
      open={isOpentabEdit}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100vh',
          overflowY: 'unset'
        },
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {speciesview === 'details' ? 'Edit' : 'Assign Diet'}
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
      <Grid item size={{ md: 8, xs: 12 }} sx={{ mb: 14 }}>
        <TabContext value={selectionType}>
          <TabList onChange={handleChange} aria-label='customized tabs example' sx={{ background: '#fff' }}>
            <Tab
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, width: '50%' }}
              value='species'
              label={`SPECIES - ${selectionType === 'species' && !loading ? speciestotalcount || '' : '0'}`}
            />
            <Tab
              style={{ borderRadius: 0, width: '50%' }}
              value='animals'
              label={`ANIMALS - ${selectionType === 'animals' && !loading ? speciestotalcount || '' : '0'}`}
            />
          </TabList>
          {speciesview === 'details' ? (
            <Grid item size={{ md: 8, sm: 8, xs: 8 }}>
              <Box
                sx={{
                  bgcolor: 'background.default',
                  p: '16px',
                  borderRadius: '8px',
                  width: '555px',
                  overflowY: 'auto',
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
                      height: '50px',
                      mb: 0,
                      backgroundColor: theme.palette.background.paper,
                      ml: '10px',
                      mr: '5px'
                    }}
                  >
                    <Icon icon='mi:search' />
                    <TextField
                      variant='outlined'
                      placeholder='Search'
                      value={searchQuery}
                      onChange={handleSearch}
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
                    {searchQuery ? <Icon style={{ marginRight: '14px' }} icon='mdi:close' onClick={searchClose} /> : ''}
                  </Box>
                </>
              </Box>
            </Grid>
          ) : (
            ''
          )}
          <TabPanel value='species' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.default,
                overflowY: 'auto',
                height: 'calc(100vh - 23rem)',
                px: 4,
                pb: 4
              }}
              onScroll={handleScroll}
            >
              {!loading && speciesData?.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '70%',
                    textAlign: 'center'
                  }}
                >
                  <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.secondary.dark,
                      fontSize: '16px',
                      fontWeight: 400,
                      textAlign: 'center'
                    }}
                  >
                    No Species assigned
                  </Typography>
                </Box>
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
                        <Avatar
                          src={dietDetails?.diet_image ? dietDetails?.diet_image : '/icons/icon_diet_fill.png'}
                          alt={dietDetails.diet_name}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={dietDetails.diet_name}
                        slotProps={{
                          primary: {
                            sx: {
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '16px',
                              fontWeight: 600
                            }
                          }
                        }}
                        secondary={
                          <Typography
                            variant='body2'
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '16px',
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
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            pb: 1
                          }}
                        >
                          {tempSelectedSpecies?.length} Species Selected
                        </Typography>
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
                  <List
                    sx={{
                      mb: speciesview === 'select' ? '12%' : '0%'
                    }}
                  >
                    {loading && pageNo === 1 ? (
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                          <CircularProgress />
                        </Box>
                      </CardContent>
                    ) : (
                      <Box sx={{ background: theme.palette.customColors.mdAntzNeutral, borderRadius: '4px' }}>
                        {/* Header Row */}
                        {loading && pageNo === 1 ? (
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                              <CircularProgress />
                            </Box>
                          </CardContent>
                        ) : (
                          <>
                            {/* Header */}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 3,
                                borderRadius: '5px'
                              }}
                            >
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '50%',
                                  pl: 3
                                }}
                              >
                                Species
                              </Typography>
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '30%'
                                }}
                              >
                                Mark as Primary
                              </Typography>
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '12%'
                                }}
                              >
                                Remove
                              </Typography>
                            </Box>

                            {/* Species List */}
                            {mappedSpecies.map(species => (
                              <ListItem
                                key={species.id}
                                sx={{
                                  backgroundColor: theme.palette.background.paper,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    mappedSpecies.length > 1
                                      ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                                      : '',
                                  px: 2,
                                  py: 1.5,

                                  // height: '70px',
                                  borderRadius: mappedSpecies.length > 1 ? '' : '5px',
                                  borderTopRightRadius: mappedSpecies.length > 1 ? '0px' : '0px',
                                  borderTopLeftRadius: mappedSpecies.length > 1 ? '0px' : '0px'
                                }}
                              >
                                {/* Species Image and Name */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
                                  <Avatar
                                    src={species.default_icon ? species.default_icon : '/icons/species.svg'}
                                    alt={species.scientific_name}
                                    sx={{
                                      '& img': { objectFit: 'inherit' },
                                      borderRadius:
                                        species?.default_icon && species.default_icon.includes('.svg')
                                          ? 'unset'
                                          : species?.default_icon
                                          ? '50%'
                                          : 'unset',
                                      height: '44px',
                                      width: '44px',
                                      mr: 2
                                    }}
                                  />
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant='body2'
                                        sx={{
                                          color: theme.palette.customColors.OnSurfaceVariant,
                                          fontSize: '14px',
                                          fontWeight: 400,
                                          fontStyle: 'italic',
                                          lineHeight: 1.6
                                        }}
                                      >
                                        {species.common_name ? species.common_name : '-'}
                                      </Typography>
                                    }
                                    secondary={species.scientific_name ? species.scientific_name : '-'}
                                    slotProps={{
                                      secondary: {
                                        sx: {
                                          color: theme.palette.customColors.OnSurfaceVariant,
                                          fontSize: '16px',
                                          fontWeight: 600,
                                          lineHeight: 1.2
                                        }
                                      }
                                    }}
                                  />
                                </Box>

                                {/* Toggle for Mark as Primary */}
                                <Box sx={{ width: '20%', textAlign: 'center', mr: '10%' }}>
                                  <Switch
                                    //checked={!!primaryStatus[species.species_id]}
                                    checked={
                                      primaryStatus[
                                        selectionType === 'species' ? species.species_id : species.animal_id
                                      ] === '1'
                                    }
                                    onChange={() => handleTogglePrimary(species)}
                                    color='primary'
                                    fontSize={70}
                                  />
                                </Box>

                                {/* Remove Icon */}
                                <Box sx={{ width: '12%', textAlign: 'right' }}>
                                  <IconButton
                                    edge='end'
                                    onClick={() => handleRemovenew(species)}
                                    sx={{
                                      color: theme.palette.error.dark,
                                      mr: 3
                                    }}
                                  >
                                    <Icon icon='carbon:close-outline' fontSize={24} />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            ))}
                          </>
                        )}
                      </Box>
                    )}
                    {!loading && isLoadingMore && (
                      <Box
                        sx={{
                          position: 'fixed',
                          bottom: '155px',
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
          </TabPanel>

          <TabPanel value='animals' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.default,
                overflowY: 'auto',
                height: 'calc(100vh - 23rem)',
                px: 4,
                pb: 4
              }}
              onScroll={handleScroll}
            >
              {!loading && speciesData?.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '70%',
                    textAlign: 'center'
                  }}
                >
                  <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.secondary.dark,
                      fontSize: '16px',
                      fontWeight: 400,
                      textAlign: 'center'
                    }}
                  >
                    No Animals assigned
                  </Typography>
                </Box>
              ) : (
                <>
                  {!loading ? (
                    speciesview === 'select' ? (
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          pb: 1
                        }}
                      >
                        {tempSelectedSpecies?.length} Species Selected
                      </Typography>
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
                        {speciestotalcount || ''} Animals
                      </Typography>
                    )
                  ) : (
                    <Typography>{''}</Typography>
                  )}

                  <List
                    sx={{
                      mb: speciesview === 'select' ? '12%' : '0%'
                    }}
                  >
                    {loading && pageNo === 1 ? (
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                          <CircularProgress />
                        </Box>
                      </CardContent>
                    ) : (
                      <Box sx={{ background: theme.palette.customColors.mdAntzNeutral, borderRadius: '4px' }}>
                        {/* Header Row */}
                        {loading && pageNo === 1 ? (
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                              <CircularProgress />
                            </Box>
                          </CardContent>
                        ) : (
                          <>
                            {/* Header */}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                mb: 2,
                                borderRadius: '5px'
                              }}
                            >
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '50%',
                                  pl: 3
                                }}
                              >
                                Animals
                              </Typography>
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '30%'
                                }}
                              >
                                Mark as Primary
                              </Typography>
                              <Typography
                                variant='body1'
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: theme.palette.customColors.customTextColorGray2,
                                  width: '12%'
                                }}
                              >
                                Remove
                              </Typography>
                            </Box>

                            {/* Species List */}
                            {mappedSpecies.map(species => (
                              <ListItem
                                key={species.id}
                                sx={{
                                  backgroundColor: theme.palette.background.paper,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    mappedSpecies.length > 1
                                      ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                                      : '',
                                  px: 2,
                                  py: 1.5,
                                  borderRadius: mappedSpecies.length > 1 ? '' : '5px',
                                  borderTopRightRadius: mappedSpecies.length > 1 ? '0px' : '0px',
                                  borderTopLeftRadius: mappedSpecies.length > 1 ? '0px' : '0px'
                                }}
                              >
                                {/* Species Image and Name */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
                                  <Avatar
                                    src={species.default_icon ? species.default_icon : '/icons/species.svg'}
                                    alt={species.scientific_name}
                                    sx={{
                                      '& img': { objectFit: 'inherit' },
                                      borderRadius:
                                        species?.default_icon && species.default_icon.includes('.svg')
                                          ? 'unset'
                                          : species?.default_icon
                                          ? '50%'
                                          : 'unset',
                                      height: '44px',
                                      width: '44px',
                                      mr: 2
                                    }}
                                  />
                                  <ListItemText
                                    primary={
                                      <>
                                        <Typography
                                          variant='body2'
                                          sx={{
                                            color: theme.palette.customColors.OnSurfaceVariant,
                                            fontSize: '14px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {/* {species.animal_id ? `AID: ${species.animal_id}` : 'AID: -'} */}
                                          {species.primary_identifier_type && species.identifier
                                            ? `${species.primary_identifier_type}: ${species.identifier}`
                                            : species.animal_id
                                            ? `AID: ${species.animal_id}`
                                            : 'AID: -'}
                                        </Typography>
                                        <Typography
                                          variant='body2'
                                          sx={{
                                            color: theme.palette.customColors.OnSurfaceVariant,
                                            fontSize: '14px',
                                            fontWeight: 400,
                                            fontStyle: 'italic'
                                          }}
                                        >
                                          {species.default_common_name ? species.default_common_name : '-'}
                                        </Typography>
                                      </>
                                    }
                                    slotProps={{
                                      primary: {
                                        sx: {
                                          color: theme.palette.customColors.OnSurfaceVariant,
                                          fontSize: '16px',
                                          fontWeight: 600
                                        }
                                      }
                                    }}
                                    secondary={
                                      <>
                                        <Typography
                                          variant='body1'
                                          sx={{
                                            color: theme.palette.customColors.OnSurfaceVariant,
                                            fontSize: '16px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {species.scientific_name ? species.scientific_name : '-'}
                                        </Typography>

                                        <Typography
                                          variant='body2'
                                          sx={{
                                            color: theme.palette.customColors.secondaryBg,
                                            fontSize: '14px',
                                            fontWeight: 500
                                          }}
                                        >
                                          Site: {species.site_name ? species.site_name : '-'}
                                        </Typography>
                                      </>
                                    }
                                  />
                                </Box>

                                {/* Toggle for Mark as Primary */}
                                <Box sx={{ width: '20%', textAlign: 'center', mr: '10%' }}>
                                  <Switch
                                    //checked={!!primaryStatus[species.species_id]}
                                    checked={
                                      primaryStatus[
                                        selectionType === 'species' ? species.species_id : species.animal_id
                                      ] === '1'
                                    }
                                    onChange={() => handleTogglePrimary(species)}
                                    color='primary'
                                    fontSize={70}
                                  />
                                </Box>

                                {/* Remove Icon */}
                                <Box sx={{ width: '12%', textAlign: 'right' }}>
                                  <IconButton
                                    edge='end'
                                    onClick={() => handleRemovenew(species)}
                                    sx={{
                                      color: theme.palette.error.dark,
                                      mr: 3
                                    }}
                                  >
                                    <Icon icon='carbon:close-outline' fontSize={24} />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            ))}
                          </>
                        )}
                      </Box>
                    )}
                    {!loading && isLoadingMore && (
                      <Box
                        sx={{
                          position: 'fixed',
                          bottom: '155px',
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
          </TabPanel>
        </TabContext>
      </Grid>
      {/* bottom buttons */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '562px',
          height: '150px',
          position: isSmallDevice ? 'absolute' : 'fixed',
          bottom: isSmallDevice ? 75 : 0,
          px: 4,
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123,
          py: 2
        }}
      >
        {/* Informational Text */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnTertiaryContainer,
            mb: 3,
            mt: 2,
            pt: 2,
            pb: 2,
            background: '#FFBDA833',
            borderRadius: '6px',
            px: 2
          }}
        >
          {/* Icon */}
          <Icon
            icon='material-symbols:warning-outline-rounded'
            fontSize={24}
            color={theme.palette.customColors.Tertiary}
            style={{ marginRight: '4px', position: 'relative', top: '-12px' }}
          />

          {/* Text */}
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 400,
              color: theme.palette.customColors.OnTertiaryContainer
            }}
          >
            This diet will override any previously set primary diet for the selected species
          </Typography>
        </Box>

        {/* Buttons Container */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            gap: 2
          }}
        >
          {/* Cancel Button */}
          <Button
            variant='outlined'
            size='medium'
            onClick={handelClose}
            sx={{
              flex: 1,
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              height: '45px'
            }}
          >
            CANCEL
          </Button>

          {/* Assign Diet Button */}
          <LoadingButton
            variant='contained'
            size='medium'
            disabled={!hasChanges()}
            onClick={handleAdd}
            loading={loader}
            sx={{ flex: 1, height: '45px' }}
            loadingIndicator={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1px' }}>
                CONFIRM CHANGES
                <CircularProgress size={20} sx={{ color: '#ccc' }} />
              </span>
            }
          >
            {!loader && 'CONFIRM CHANGES'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditAnimalSpeciesMapped
