import React, { useEffect, useState, Fragment } from 'react'
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
  FormControl,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { deleteSpeciesFromDiet } from 'src/lib/api/diet/dietList'
import Toaster from 'src/components/Toaster'
import { useMediaQuery } from '@mui/material'
import { addAssigntoDiet } from 'src/lib/api/diet/dietList'
import SingleDatePicker from '../SingleDatePicker'
import { format } from 'date-fns'

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
  setTempSelectedSpecies,
  setIsOpen,
  selectionType,
  setapplyfilterCheck
}) => {
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [loader, setLoader] = useState(false)
  const [primaryStatus, setPrimaryStatus] = useState({})
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [errors, setErrors] = useState({})
  const [openModal, setOpenModal] = useState(false)

  const handleClickOpen = () => {
    setOpenModal(true)
  }
  const handleClose = () => setOpenModal(false)

  const handleSearch = event => {
    setSearchQuery(event.target.value)
  }

  useEffect(() => {
    setPageNo(1)
  }, [isOpennew])

  const handleRemove = async item => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'

    if (speciesview === 'select') {
      const updatedTempSelectedSpecies = tempSelectedSpecies.filter(id => id !== item[idField])
      setTempSelectedSpecies(updatedTempSelectedSpecies)

      const newPrimaryStatus = { ...primaryStatus }
      delete newPrimaryStatus[item[idField]]
      setPrimaryStatus(newPrimaryStatus)
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
    setIsOpennew(false)

    //refreshDietDetails()
    setspeciesview('')
    setStartDate(null)
    setEndDate(null)

    //setSearchQuery('')
    // setPrimaryStatus({}) // Reset primary status when closing
  }

  const searchClose = () => {
    setSearchQuery('')
  }

  const handleTogglePrimary = item => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
    const id = item[idField]

    setPrimaryStatus(prev => ({
      ...prev,
      [id]: prev[id] === '1' ? '0' : '1'
    }))
  }

  const handleAdd = async () => {
    // Prepare payload based on selection type
    const payloadData = tempSelectedSpecies.map(id => ({
      [selectionType === 'species' ? 'species_id' : 'animal_id']: id,
      is_primary: primaryStatus[id] ? '1' : '0'
    }))

    setLoader(true)
    setapplyfilterCheck(false)

    const payload = {
      diet_id: dietId,
      start_date: formatDisplayDate(startDate),
      end_date: formatDisplayDate(endDate),
      [selectionType === 'species' ? 'species_ids' : 'animal_ids']: JSON.stringify(payloadData)
    }

    try {
      const response = await addAssigntoDiet(payload, selectionType)
      console.log('API Response:', response)
      if (response.success === true) {
        Toaster({
          type: 'success',
          message: response.message
        })
        onSelectedSpeciesChange(tempSelectedSpecies)
        refreshDietDetails()
        setIsOpen(false)
        setIsOpennew(false)
        refreshSpeciesData()
        setspeciesview('')
        setTempSelectedSpecies([])
        setPageNo(1)
        setSearchQuery('')
        setPrimaryStatus({})
        setLoader(false)
        setOpenModal(false)
        setStartDate(null)
        setEndDate(null)
      } else {
        Toaster({
          type: 'error',
          message: response?.message
        })
        setLoader(false)
      }
    } catch (error) {
      console.error('Error adding species to diet:', error)
      setLoader(false)
    }
  }

  // Handle date changes
  const handleStartDateChange = date => {
    setStartDate(date)
    if (endDate && date > endDate) {
      setErrors({ ...errors, startDate: 'Start date cannot be after end date' })
    } else {
      setErrors({ ...errors, startDate: null })
    }
  }

  const handleEndDateChange = date => {
    setEndDate(date)
    if (startDate && date < startDate) {
      setErrors({ ...errors, endDate: 'End date cannot be before start date' })
    } else {
      setErrors({ ...errors, endDate: null })
    }
  }

  // Format date for display in TextField
  const formatDisplayDate = date => {
    return date ? format(date, 'yyyy-MM-dd') : ''
  }

  const mappedSpecies =
    speciesview === 'select' && selectionType === 'species'
      ? speciesData.filter(species => tempSelectedSpecies.includes(species.species_id))
      : speciesview === 'select' && selectionType === 'animals'
      ? speciesData.filter(species => tempSelectedSpecies.includes(species.animal_id))
      : speciesData.filter(species => species.mapped_to_diet)

  return (
    <Drawer
      anchor='right'
      open={isOpennew}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100vh'
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
            {speciesview === 'details' ? 'Species assigned' : 'Assign Diet'}
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
      {speciesview === 'details' ? (
        <Grid item size={{ md: 8, sm: 8, xs: 8 }}>
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
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
                  backgroundColor: theme.palette.background.paper
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
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          overflowY: 'auto',
          height: 'calc(100vh - 195px)',
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
                  <Avatar
                    src={dietDetails?.diet_image ? dietDetails?.diet_image : '/icons/icon_diet_fill.png'}
                    alt={dietDetails.diet_name}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={dietDetails.diet_name}
                  slotProps={{
                    primary: {
                      sx: { color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }
                    }
                  }}
                  // primaryTypographyProps={{
                  //   sx: { color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }
                  // }}
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
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  px: '16px',
                  mb: '26px',
                  mt: '26px',
                  mr: '30px'
                }}
              >
                <Box sx={{ display: 'flex', gap: 5 }}>
                  <FormControl sx={{ width: '200px' }}>
                    <SingleDatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      customInput={
                        <TextField
                          label='From Date'
                          value={formatDisplayDate(startDate)}
                          error={Boolean(errors.startDate)}
                          sx={{
                            '& .MuiInputBase-input': {
                              padding: '14px'
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#44544a82'
                              }
                            },
                            width: '100%'
                          }}
                          slotProps={{
                            input: {
                              sx: {
                                mt: 1,
                                height: '40px',
                                padding: '0 14px',
                                alignItems: 'center'
                              }
                            },

                            inputLabel: {
                              shrink: true,
                              sx: {
                                color: '#44544A'
                              }
                            }
                          }}
                        />
                      }
                      maxDate={endDate || new Date()}
                    />
                    {errors.startDate && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.startDate}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl sx={{ width: '200px' }}>
                    <SingleDatePicker
                      selected={endDate}
                      onChange={handleEndDateChange}
                      customInput={
                        <TextField
                          label='To Date'
                          value={formatDisplayDate(endDate)}
                          error={Boolean(errors.endDate)}
                          sx={{
                            '& .MuiInputBase-input': {
                              padding: '14px'
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#44544a82'
                              }
                            },
                            width: '100%'
                          }}
                          slotProps={{
                            input: {
                              sx: {
                                mt: 1,
                                height: '40px',
                                padding: '0 14px',
                                alignItems: 'center'
                              }
                            },

                            inputLabel: {
                              shrink: true,
                              sx: {
                                color: '#44544A'
                              }
                            }
                          }}
                        />
                      }
                      minDate={startDate}
                      maxDate={new Date()}
                    />
                    {errors.endDate && <FormHelperText sx={{ color: 'error.main' }}>{errors.endDate}</FormHelperText>}
                  </FormControl>
                </Box>
              </Box>
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
                      {mappedSpecies.map(species =>
                        selectionType === 'species' ? (
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
                                onClick={() => handleRemove(species)}
                                sx={{
                                  color: theme.palette.error.dark,
                                  mr: 3
                                }}
                              >
                                <Icon icon='carbon:close-outline' fontSize={24} />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ) : (
                          <ListItem
                            key={species.id}
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                              px: 2,
                              py: 1.5
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
                                      : 'unset'
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
                                onClick={() => handleRemove(species)}
                                sx={{
                                  color: theme.palette.error.dark,
                                  mr: 3
                                }}
                              >
                                <Icon icon='carbon:close-outline' fontSize={24} />
                              </IconButton>
                            </Box>
                          </ListItem>
                        )
                      )}
                    </>
                  )}
                </Box>
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
      {/* bottom buttons */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '562px',
          height: '127px',
          position: isSmallDevice ? 'absolute' : 'fixed',
          bottom: isSmallDevice ? 75 : 0,
          px: 4,
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123,
          py: 9
        }}
      >
        {/* Informational Text */}

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
            size='large'
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
            size='large'
            disabled={tempSelectedSpecies?.length === 0 || (startDate && !endDate)}
            //onClick={handleAdd}
            onClick={handleClickOpen}
            sx={{ flex: 1, height: '45px' }}
          >
            ASSIGN DIET
          </LoadingButton>
        </Box>
      </Box>
      <Fragment>
        <Dialog
          open={openModal}
          disableEscapeKeyDown
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
          onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
              handleClose()
            }
          }}
        >
          {/* <DialogTitle id='alert-dialog-title'></DialogTitle> */}
          <DialogContent style={{ paddingBottom: '5px' }}>
            <DialogContentText id='alert-dialog-description'>
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
                  pt: 4,
                  pb: 4,
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
            </DialogContentText>
          </DialogContent>
          <DialogActions
            //className='dialog-actions-dense'
            style={{ paddingBottom: '25px', justifyContent: 'center' }}
          >
            <LoadingButton
              variant='outlined'
              onClick={handleClose}
              sx={{
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                mr: 4,
                width: '120px',
                height: '40px'
              }}
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              variant='contained'
              onClick={handleAdd}
              sx={{
                height: '40px',
                mr: 4,
                width: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              loading={loader}
              loadingIndicator={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Proceed
                  <CircularProgress size={20} sx={{ color: '#ccc' }} />
                </span>
              }
            >
              {!loader && 'Proceed'}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Fragment>
    </Drawer>
  )
}

export default ListOfSpeciesMapped
