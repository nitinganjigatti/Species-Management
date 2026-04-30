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
  Tab,
  Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { useMediaQuery } from '@mui/material'
import { editAssigntoDiet } from 'src/lib/api/diet/dietList'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { right } from '@popperjs/core'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalCard from 'src/views/utility/AnimalCard'
import { useTranslation } from 'react-i18next'

interface Props {
  setIsOpenTabs: (...args: any[]) => any
  setIsOpenTabsEdit: (...args: any[]) => any
  isOpentabEdit: boolean
  speciesData: any[]
  speciesview: any
  dietDetails: any
  refreshDietDetails: (...args: any[]) => any
  searchQuery: string
  setSearchQuery: (...args: any[]) => any
  speciestotalcount: any
  setspeciesview: (...args: any[]) => any
  handleScroll: (...args: any[]) => any
  loading: boolean
  setPageNo: (...args: any[]) => any
  pageNo: number
  isLoadingMore: boolean
  tempSelectedSpecies: any[]
  setTempSelectedSpecies: (...args: any[]) => any
  setspeciesData: (...args: any[]) => any
  selectionType: any
  setSelectionType: (...args: any[]) => any
  setPrimaryStatus: (...args: any[]) => any
  primaryStatus: any
  setAllFetchedData: (...args: any[]) => any
  allFetchedData: any[]
  setspeciestotalcount: (...args: any[]) => any
  debouncedFetchList: (...args: any[]) => any
  checkForSite: any
  siteId: any
  setIsOpen: (...args: any[]) => any
  setCheckForSite: (...args: any[]) => any
  setSiteListDrawer: (...args: any[]) => any
  siteSpeciesTotalCount: any
}

const EditAnimalSpeciesMapped: React.FC<Props> = ({
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
  debouncedFetchList,
  checkForSite,
  siteId,
  setIsOpen,
  setCheckForSite,
  setSiteListDrawer,
  siteSpeciesTotalCount
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [loader, setLoader] = useState<boolean>(false)
  const [removedIds, setRemovedIds] = useState<any[]>([])
  const [originalData, setOriginalData] = useState<any[]>([])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleChange = (event: any, newValue: any) => {
    setSelectionType(newValue)
    setPageNo(1)
  }

  useEffect(() => {
    setPageNo(1)
  }, [isOpentabEdit])

  const handleRemovenew = (species: any) => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
    const id = species[idField]

    setRemovedIds(prev => [...prev, species.assign_id])

    // Filter out from both displayed data and all fetched data
    const updatedSpeciesData = speciesData.filter(item => item.assign_id !== species.assign_id)
    const updatedAllData = allFetchedData.filter(item => item.assign_id !== species.assign_id)

    setspeciesData(updatedSpeciesData)
    setAllFetchedData(updatedAllData)

    const updatedTempSelectedSpecies = tempSelectedSpecies.filter(itemId => itemId !== id)
    setTempSelectedSpecies(updatedTempSelectedSpecies)

    setPrimaryStatus((prev: any) => {
      const newStatus = { ...prev }
      delete newStatus[id]

      return newStatus
    })

    setspeciestotalcount((prev: any) => prev - 1)
  }

  const handleRemoveSiteSpecies = (species: any) => {
    const id = species.species_id

    setRemovedIds(prev => [...prev, species.assign_id])

    const updatedSiteSpeciesData = speciesData.map(site => ({
      ...site,
      species: site.species.filter((sp: any) => sp.assign_id !== species.assign_id)
    }))

    setspeciesData(updatedSiteSpeciesData)
    setAllFetchedData(updatedSiteSpeciesData)

    setTempSelectedSpecies((prev: any[]) => prev.filter(itemId => itemId !== id))

    setPrimaryStatus((prev: any) => {
      const newStatus = { ...prev }
      delete newStatus[id]
      return newStatus
    })

    setspeciestotalcount((prev: any) => prev - 1)
  }

  // useEffect(() => {
  //   if (speciesData && speciesData.length > 0) {
  //     setOriginalData(speciesData)
  //     const initialPrimaryStatus = {}

  //     speciesData.forEach(item => {
  //       const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
  //       const id = item[idField]

  //       initialPrimaryStatus[id] = item.is_primary || '0'
  //     })

  //     setPrimaryStatus(prev => {
  //       const newStatus = { ...prev }
  //       let needsUpdate = false

  //       speciesData.forEach(item => {
  //         const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
  //         const id = item[idField]
  //         if (newStatus[id] === undefined) {
  //           newStatus[id] = item.is_primary || '0'
  //           needsUpdate = true
  //         }
  //       })

  //       return needsUpdate ? newStatus : prev
  //     })
  //   }
  // }, [isOpentabEdit, speciesData, selectionType])

  useEffect(() => {
    if (speciesData && speciesData.length > 0) {
      setOriginalData(speciesData)

      setPrimaryStatus((prev: any) => {
        const newStatus = { ...prev }
        let needsUpdate = false

        if (selectionType === 'species' || selectionType === 'animals') {
          speciesData.forEach(item => {
            const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
            const id = item[idField]

            if (newStatus[id] === undefined) {
              newStatus[id] = item.is_primary || '0'
              needsUpdate = true
            }
          })
        }

        if (selectionType === 'site_species') {
          speciesData.forEach(site => {
            site.species?.forEach((species: any) => {
              const id = species.assign_id

              if (newStatus[id] === undefined) {
                newStatus[id] = species.is_primary || '0'
                needsUpdate = true
              }
            })
          })
        }

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

  const getChangedRecordsSiteSpecies = () => {
    return speciesData
      .flatMap(site => site.species)
      .filter((species: any) => {
        const id = species?.assign_id

        const originalItem = originalData
          .flatMap(site => site.species)
          .find((original: any) => original?.assign_id === species?.assign_id)

        return primaryStatus[id] !== undefined && (!originalItem || primaryStatus[id] !== originalItem.is_primary)
      })
      .map((species: any) => {
        const id = species?.assign_id

        return {
          assign_id: species?.assign_id,
          is_primary: primaryStatus[id] || '0'
        }
      })
  }

  const hasChanges = () => {
    const editData = selectionType === 'site_species' ? getChangedRecordsSiteSpecies() : getChangedRecords()

    return editData.length > 0 || removedIds.length > 0
  }

  const handleAdd = async () => {
    const editData = selectionType === 'site_species' ? getChangedRecordsSiteSpecies() : getChangedRecords()

    const numericRemovedIds = removedIds.map(id => Number(id))

    const payload = {
      edit_data: JSON.stringify(editData),
      remove_ids: JSON.stringify(numericRemovedIds)
      // ...(siteId && { site_id: siteId })
    }

    setLoader(true)
    try {
      const response = await editAssigntoDiet(payload)
      if (response.success === true) {
        setIsOpenTabsEdit(false)
        setIsOpenTabs(false)
        setRemovedIds([])
        setspeciesview('')
        refreshDietDetails()
        setIsOpen(false)
        setSiteListDrawer(false)
        Toaster({
          type: 'success',
          message: 'Primary diet successfully updated'
        })
      } else {
        Toaster({
          type: 'error',
          message: response?.message
        })
        setLoader(false)
      }
    } catch (error: any) {
      setLoader(false)
    } finally {
      setLoader(false)
    }
  }

  const handelClose = () => {
    setIsOpenTabsEdit(false)
    refreshDietDetails()
    setSearchQuery('')
    if (checkForSite === 'site_species') {
      setspeciesview('select')
      setCheckForSite('site_species')

      setPageNo(1)
    }
  }

  const searchClose = () => {
    setSearchQuery('')
    debouncedFetchList('')
  }

  const handleTogglePrimary = (item: any) => {
    const idField =
      selectionType === 'site_species' ? 'assign_id' : selectionType === 'species' ? 'species_id' : 'animal_id'

    const id = item[idField]

    setPrimaryStatus((prev: any) => ({
      ...prev,
      [id]: prev[id] === '1' ? '0' : '1'
    }))
  }

  const mappedSpecies =
    selectionType === 'site_species'
      ? speciesData
      : speciesview === 'select'
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
      <Grid size={{ md: 8, xs: 12 }} sx={{ mb: 14 }}>
        {!selectionType ? null : (
        <TabContext value={selectionType}>
          {checkForSite !== 'site_species' && speciesview === 'details' ? (
            <TabList onChange={handleChange} aria-label='customized tabs example' sx={{ background: '#fff' }}>
              <Tab
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, width: '33.33%' }}
                value='species'
                label={`SPECIES - ${selectionType === 'species' && !loading ? speciestotalcount || '' : '0'}`}
              />
              <Tab
                style={{ borderRadius: 0, width: '33.33%' }}
                value='animals'
                label={`ANIMALS - ${selectionType === 'animals' && !loading ? speciestotalcount || '' : '0'}`}
              />
              <Tab
                style={{ borderRadius: 0, width: '33.33%' }}
                value='site_species'
                label={`SITE SPECIES`}
                //label={`SITE SPECIES - ${selectionType === 'site_species' && !loading ? speciestotalcount || '' : '0'}`}
              />
            </TabList>
          ) : (
            ''
          )}
          {speciesview === 'details' ? (
            <Grid size={{ md: 8, sm: 8, xs: 8 }}>
              <Box
                sx={{
                  bgcolor: 'background.default',
                  p: '16px',
                  borderRadius: '0px',
                  width: '100%',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 0,
                    height: 0
                  },
                  msOverflowStyle: 'none',
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
                height: checkForSite === 'site_species' ? 'calc(100vh - 18rem)' : 'calc(100vh - 23rem)',
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
                                  width: '60%',
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
                            {mappedSpecies.map((species, index) => (
                              <ListItem
                                key={species.id}
                                sx={{
                                  backgroundColor: theme.palette.background.paper,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    index !== speciesData.length - 1
                                      ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                                      : 'none',
                                  px: 3,
                                  py: 3.5,

                                  borderRadius: mappedSpecies.length > 1 ? '' : '5px',
                                  borderTopRightRadius: mappedSpecies.length > 1 ? '0px' : '0px',
                                  borderTopLeftRadius: mappedSpecies.length > 1 ? '0px' : '0px'
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                    width: '60%',
                                    minHeight: '100%'
                                  }}
                                >
                                  <SpeciesCard species={species} edit={true} />
                                </Box>

                                <Box sx={{ width: '20%', textAlign: 'center', mr: '10%' }}>
                                  <Switch
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
                    {t('diet_module.no_animals_assigned')}
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
                        {speciestotalcount || ''} {t('navigation.animals')}
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
                                  width: '60%',
                                  pl: 3
                                }}
                              >
                                {t('diet_module.animals')}
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
                                {t('diet_module.mark_as_primary')}
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
                                {t('remove')}
                              </Typography>
                            </Box>

                            {/* Species List */}
                            {mappedSpecies.map((species, index) => (
                              <ListItem
                                key={species.id}
                                sx={{
                                  backgroundColor: theme.palette.background.paper,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    index !== speciesData.length - 1
                                      ? `1px solid ${theme.palette.customColors.OutlineVariant}`
                                      : 'none',
                                  px: 3,
                                  py: 3.5,
                                  borderRadius: mappedSpecies.length > 1 ? '' : '5px',
                                  borderTopRightRadius: mappedSpecies.length > 1 ? '0px' : '0px',
                                  borderTopLeftRadius: mappedSpecies.length > 1 ? '0px' : '0px'
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                    width: '60%',
                                    minHeight: '100%'
                                  }}
                                >
                                  <AnimalCard data={species} size='16px' edit={true} />
                                </Box>

                                <Box sx={{ width: '20%', textAlign: 'center', mr: '10%' }}>
                                  <Switch
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

          <TabPanel value='site_species' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.default,
                overflowY: 'auto',
                height: checkForSite === 'site_species' ? 'calc(100vh - 18rem)' : 'calc(100vh - 23rem)',
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
                    {t('diet_module.no_species_assigned')}
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
                          {tempSelectedSpecies?.length} {t('diet_module.species_selected')}
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
                          {speciestotalcount || ''} {speciestotalcount == 1 ? 'Site' : 'Sites'}
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
                        {loading && pageNo === 1 ? (
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                              <CircularProgress />
                            </Box>
                          </CardContent>
                        ) : (
                          <>
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
                                  width: '60%',
                                  pl: 3
                                }}
                              >
                                {t('navigation.species')}
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
                                {t('diet_module.mark_as_primary')}
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
                                {t('remove')}
                              </Typography>
                            </Box>

                            {mappedSpecies.map((site, siteIndex) => {
                              if (!site.species || site.species.length === 0) return null

                              return (
                                <Box key={siteIndex}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      px: 4,
                                      py: 2,
                                      background: theme.palette.customColors.Primary10
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        color: theme.palette.primary.dark
                                      }}
                                    >
                                      Site Name : {site.site_name}
                                    </Typography>

                                    <Chip
                                      label={`${
                                        site.species?.length === 1
                                          ? '1 Species'
                                          : `${site.species?.length || 0} Species`
                                      }`}
                                      size='small'
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.primary.main}`
                                      }}
                                    />
                                  </Box>

                                  {site.species?.map((species: any, index: any) => (
                                    <ListItem
                                      key={species.species_id}
                                      sx={{
                                        backgroundColor: theme.palette.background.paper,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                        px: 3,
                                        py: 3.5
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: 2,
                                          width: '60%',
                                          minHeight: '100%'
                                        }}
                                      >
                                        <SpeciesCard species={species} edit={true} />
                                      </Box>

                                      <Box sx={{ width: '20%', textAlign: 'center', mr: '10%' }}>
                                        <Switch
                                          checked={
                                            primaryStatus[
                                              selectionType === 'site_species' ? species.assign_id : species.species_id
                                            ] === '1'
                                          }
                                          onChange={() => handleTogglePrimary(species)}
                                          color='primary'
                                        />
                                      </Box>

                                      <Box sx={{ width: '12%', textAlign: 'right' }}>
                                        <IconButton
                                          edge='end'
                                          onClick={() => handleRemoveSiteSpecies(species)}
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
                                </Box>
                              )
                            })}
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
        )}
      </Grid>
      {/* bottom buttons */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '562px',
          height: isSmallDevice ? '170px' : checkForSite === 'site_species' ? '120px' : '150px',
          position: isSmallDevice ? 'absolute' : 'fixed',
          bottom: isSmallDevice ? 65 : 0,
          px: 4,
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123,
          py: checkForSite === 'site_species' ? 10 : 2
        }}
      >
        {/* Informational Text */}
        {checkForSite !== 'site_species' ? (
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
              {t('diet_module.diet_override')}
            </Typography>
          </Box>
        ) : (
          ''
        )}

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
            {t('cancel')}
          </Button>

          <LoadingButton
            variant='contained'
            size='medium'
            disabled={!hasChanges()}
            onClick={handleAdd}
            loading={loader}
            sx={{ flex: 1, height: '45px' }}
            loadingIndicator={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1px' }}>
                {t('diet_module.confirm_changes')}
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
