import React, { useRef, useEffect } from 'react'
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
  CardContent,
  CircularProgress
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

import Icon from 'src/@core/components/icon'
import { useMediaQuery } from '@mui/material'
import AnimalCard from 'src/views/utility/AnimalCard'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { useTranslation } from 'react-i18next'

const SpeciesMappedtoDiet = ({
  isOpen,
  setIsOpen,
  setIsOpennew,
  speciesData,
  selectedSpecies,
  setspeciesview,
  speciestotalcount,
  setOpenFilterDrawer,
  selectedItems,
  searchQuery,
  setSearchQuery,
  handleScroll,
  loading,
  setPageNo,
  isLoadingMore,
  pageNo,
  tempSelectedSpecies,
  setTempSelectedSpecies,
  selectionType,
  items,
  tempSelectedItems,
  setTempSelectedItems,
  setSelectedItems,
  debouncedSearch,
  setFilterState,
  setActiveTab,
  applyfilterCheck,
  setSelectedSections,
  setSelectedEnclosures,
  setSelectedSpeciesIds,
  setSelectedTaxonomyIds,
  speciesview,
  checkForSite,
  setSelectionType,
  authData,
  setPrimaryStatus,
  setIsOpenTabsEdit,
  setSelectedSpecies,
  setCheckForSite,
  fetchList,
  removeFilterTriggered,
  setRemoveFilterTriggered
}) => {
  const listInnerRef = useRef(null)
  const theme = useTheme()
  const { t } = useTranslation()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))

  const handleSearch = event => {
    const value = event.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleToggle = item => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'
    const isAlreadySelected = tempSelectedSpecies.includes(item[idField])

    const updatedTempSelectedSpecies = isAlreadySelected
      ? tempSelectedSpecies.filter(id => id !== item[idField])
      : [...tempSelectedSpecies, item[idField]]

    setTempSelectedSpecies(updatedTempSelectedSpecies)
  }

  const handleSelectAll = () => {
    const idField = selectionType === 'species' ? 'species_id' : 'animal_id'

    if (tempSelectedSpecies?.length === speciesData.filter(item => !item.mapped_to_diet).length) {
      setTempSelectedSpecies([])
    } else {
      const updatedTempSelectedSpecies = speciesData.filter(item => !item.mapped_to_diet).map(item => item[idField])
      setTempSelectedSpecies(updatedTempSelectedSpecies)
    }
  }

  const handelClose = () => {
    setTempSelectedSpecies(selectedSpecies)
    setIsOpen(false)
    setSearchQuery('')
    setSelectedItems([])
    setSelectedSections([])
    setSelectedEnclosures([])
    setSelectedSpeciesIds([])
    setSelectedTaxonomyIds([])

    if (checkForSite === 'site_species') {
      setSelectionType('site_species')
      setSelectedSpecies([])
      setTempSelectedSpecies([])
    }
  }

  const handleSelectedclick = val => {
    if (val === 'select') {
      setIsOpennew(true)
      setCheckForSite('')
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
    setActiveTab('Site')
    if (applyfilterCheck === false) {
      setTempSelectedItems({
        Site: [],
        Section: [],
        Enclosure: [],
        Taxonomy: [],
        Species: []
      })
      setSelectedItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
    }

    if (selectionType === 'animals') {
      setFilterState('species')

      setPageNo(1)
    } else {
      setFilterState('')
    }
  }

  const searchClose = () => {
    setSearchQuery('')
    debouncedSearch('')
  }

  const handleRemove = siteId => {
    if (siteId) {
      setTempSelectedItems(prev => ({
        ...prev,
        Site: prev.Site.filter(id => id !== siteId),
        Section: [],
        Enclosure: []
      }))
      setSelectedItems(prev => ({
        ...prev,
        Site: prev.Site.filter(id => id !== siteId),
        Section: [],
        Enclosure: []
      }))
      setRemoveFilterTriggered(true)
    }
    setSelectedEnclosures([])
    setSelectedSections([])
  }

  useEffect(() => {
    if (removeFilterTriggered && isOpen) {
      fetchList(searchQuery)
      setRemoveFilterTriggered(false)
    }
  }, [removeFilterTriggered])

  const handleEditclick = () => {
    setIsOpenTabsEdit(true)
    setPrimaryStatus({})
    setspeciesview('details')
    setSelectionType('species')
  }

  // useEffect(() => {
  //   if (speciesData.length > 0 && tempSelectedSpecies.length > 0) {
  //     const idField = selectionType === 'species' ? 'species_id' : 'animal_id'

  //     // Create a Set of all valid IDs from speciesData
  //     const validIds = new Set(speciesData.map(item => item[idField]))

  //     // Filter tempSelectedSpecies to only keep IDs that exist in speciesData
  //     const filteredSelectedSpecies = tempSelectedSpecies.filter(id => validIds.has(id))

  //     // Only update state if there were invalid IDs that needed to be removed
  //     if (filteredSelectedSpecies.length !== tempSelectedSpecies.length) {
  //       setTempSelectedSpecies(filteredSelectedSpecies)
  //     }
  //   }
  // }, [speciesData])

  const hasMappedSpecies = speciesData?.some(item => item.mapped_to_diet === true)

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
          <IconButton size='medium' sx={{ color: theme.palette.primary.light }} onClick={handelClose}>
            <Icon icon='mingcute:arrow-left-line' fontSize={28} />
          </IconButton>
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {selectionType === 'species'
              ? 'Select the Species'
              : selectionType === 'animals'
              ? 'Select the Animals'
              : ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mr: '14px', mt: '4px' }}>
          {authData?.userData?.roles?.settings?.assign_diet === true &&
          checkForSite === 'site_species' &&
          hasMappedSpecies &&
          !loading ? (
            <IconButton size='small' sx={{ color: theme.palette.primary.light, mr: 5 }}>
              <Icon icon='mdi:pencil-outline' fontSize={24} onClick={handleEditclick} />
            </IconButton>
          ) : (
            ''
          )}
          <IconButton size='small' sx={{ color: theme.palette.primary.light }}>
            <Icon icon='mdi:close' fontSize={24} onClick={handelClose} />
          </IconButton>
        </Box>
      </Box>
      {/* Search and filter start */}
      <Grid item size={{ md: 8, sm: 8, xs: 8 }}>
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            p: '16px',
            borderRadius: '8px',
            width: '562px',
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
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '4px',
                  padding: '0 8px',
                  height: '44px',
                  mb: 0,
                  backgroundColor: theme.palette.background.paper,
                  width: '80%',
                  mr: 5,
                  ml: 2
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
                {searchQuery ? <Icon icon='mdi:close' onClick={searchClose} style={{ cursor: 'pointer' }} /> : ''}
              </Box>
              <LoadingButton
                size='medium'
                variant={
                  selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                    ? 'outlined'
                    : theme.palette.primary.dark
                }
                startIcon={<Icon icon='mage:filter' style={{ fontSize: '30px' }} />}
                onClick={handleFilter}
                sx={{
                  position: 'relative',
                  height: '45px',
                  pr: '6px',

                  border:
                    selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  mr: '10px'
                }}
              >
                {selectedItems && Object.values(selectedItems).some(array => array.length > 0) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-7px',
                      right: '-5px',
                      backgroundColor: theme.palette.customColors.customDropdownColor,
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {(() => {
                      const siteCount = selectedItems.Site?.length || 0
                      const speciesCount = selectedItems.Species?.length || 0
                      const taxonomyCount = selectedItems.Taxonomy?.length || 0

                      return [siteCount, speciesCount, taxonomyCount].filter(count => count > 0).length
                    })()}
                  </span>
                )}
              </LoadingButton>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {selectedItems &&
            Object.values(selectedItems).some(array => array.length > 0) &&
            items.Site?.filter(site => tempSelectedItems.Site?.includes(site.site_id)).map(site => (
              <Box
                key={site.site_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 4,
                  py: 1,
                  borderRadius: '10px',
                  background: theme.palette.customColors.Primary10,
                  border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.primary.dark, fontWeight: 500, fontSize: '16px' }}
                >
                  {site.site_name}
                </Typography>
                <IconButton
                  edge='end'
                  onClick={() => handleRemove(site.site_id)}
                  sx={{ color: theme.palette.primary.light, padding: '4px' }}
                >
                  <Icon icon='material-symbols:close-rounded' fontSize={20} />
                </IconButton>
              </Box>
            ))}
        </Box>

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
            {tempSelectedSpecies?.length > 0 && speciesData?.length > 0 && !loading
              ? `Selected ${tempSelectedSpecies?.length} / ${speciestotalcount}`
              : selectionType === 'species'
              ? `All species${!loading && speciestotalcount ? ` (${speciestotalcount})` : ''}`
              : `All animals${!loading && speciestotalcount ? ` (${speciestotalcount})` : ''}`}
          </Typography>
          {speciesData?.length ? (
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
                    !loading &&
                    tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  p: 0
                }}
                onClick={handleSelectAll}
              >
                {tempSelectedSpecies?.length === speciesData?.length ? 'Select all' : 'Select all'}
              </Button>

              <Checkbox
                //disabled={tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length}
                checked={
                  !loading &&
                  tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                }
                onChange={handleSelectAll}
                slotProps={{ input: { 'aria-label': 'Select all species' } }}
                sx={{
                  '&.Mui-checked': {
                    color: theme.palette.primary.main
                  },
                  '& .MuiSvgIcon-root': {
                    width: '19px',
                    height: '19px',
                    border: '2px dotted',
                    borderColor:
                      !loading &&
                      tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                        ? theme.palette.primary.main
                        : theme.palette.customColors.OnSurfaceVariant,
                    color:
                      !loading &&
                      tempSelectedSpecies?.length === speciesData.filter(species => !species.mapped_to_diet).length
                        ? theme.palette.primary.main
                        : theme.palette.customColors.OnSurfaceVariant
                  },
                  mr: 1
                }}
              />
            </Box>
          ) : (
            ''
          )}
        </Box>

        {loading && pageNo === 1 ? (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        ) : selectionType === 'species' ? (
          <List>
            {speciesData?.length > 0 ? (
              speciesData.map(species => (
                <Box
                  sx={{
                    position: 'relative',
                    background:
                      speciesview !== 'details' && species.mapped_to_diet
                        ? theme.palette.customColors.SurfaceVariant
                        : theme.palette.background.paper,
                    borderRadius: '8px',
                    border: tempSelectedSpecies.includes(species.species_id)
                      ? `1px solid ${theme.palette.primary.main}`
                      : '',
                    mb: 3,
                    p: 3.5,
                    pr: 14,
                    width: '100%'
                  }}
                >
                  <SpeciesCard species={species} />

                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: species.mapped_to_diet ? '' : theme.palette.customColors.Surface,
                      pl: 3,
                      pr: 4,
                      py: 2.5,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8
                    }}
                  >
                    <Checkbox
                      disabled={species.mapped_to_diet}
                      edge='end'
                      checked={
                        selectionType === 'species'
                          ? tempSelectedSpecies.includes(species.species_id) || species.mapped_to_diet
                          : tempSelectedSpecies.includes(species.animal_id) || species.mapped_to_diet
                      }
                      onChange={() => handleToggle(species)}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        },
                        '& .MuiSvgIcon-root': {
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          color: species.mapped_to_diet
                            ? theme.palette.customColors.secondaryBg
                            : theme.palette.primary.main
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))
            ) : (
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
                <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>
                  {t('diet_module.no_species_found')}
                </Typography>
              </Box>
            )}
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
        ) : (
          <List>
            {speciesData?.length > 0 ? (
              speciesData.map(species => (
                <Box
                  sx={{
                    position: 'relative',
                    background:
                      speciesview !== 'details' && species.mapped_to_diet
                        ? theme.palette.customColors.SurfaceVariant
                        : theme.palette.background.paper,
                    borderRadius: '8px',
                    border: tempSelectedSpecies.includes(species.animal_id)
                      ? `1px solid ${theme.palette.primary.main}`
                      : '',
                    mb: 3,
                    p: 3,
                    pr: 13,
                    width: '100%'
                  }}
                >
                  <AnimalCard data={species} size='16px' />

                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: species.mapped_to_diet ? '' : theme.palette.customColors.Surface,
                      pl: 3,
                      pr: 4,
                      py: 2.5,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8
                    }}
                  >
                    <Checkbox
                      disabled={species.mapped_to_diet}
                      edge='end'
                      checked={
                        selectionType === 'species'
                          ? tempSelectedSpecies.includes(species.species_id) || species.mapped_to_diet
                          : tempSelectedSpecies.includes(species.animal_id) || species.mapped_to_diet
                      }
                      onChange={() => handleToggle(species)}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        },
                        '& .MuiSvgIcon-root': {
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          color: species.mapped_to_diet
                            ? theme.palette.customColors.secondaryBg
                            : theme.palette.primary.main
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))
            ) : (
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
                <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>
                  {t('diet_module.no_animals_found')}
                </Typography>
              </Box>
            )}
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
          position: isSmallDevice ? 'absolute' : 'fixed',
          bottom: isSmallDevice ? 75 : 0,
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
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          disabled={tempSelectedSpecies?.length === 0 || speciesData?.length === 0}
          onClick={() => handleSelectedclick('select')}
          sx={{ height: '45px' }}
        >
          {t('add')}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesMappedtoDiet
