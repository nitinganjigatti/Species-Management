import React, { useEffect } from 'react'
import {
  Box,
  Drawer,
  List,
  Typography,
  IconButton,
  Grid,
  TextField,
  CardContent,
  CircularProgress,
  Tab,
  Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import Utility from 'src/utility'
import AnimalCard from 'src/views/utility/AnimalCard'
import RenderUtility from 'src/utility/render'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const SpeciesAnimalsMapped = ({
  setIsOpenTabs,
  isOpentab,
  setIsOpenTabsEdit,
  speciesData,
  speciesview,
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
  selectionType,
  setSelectionType,
  setPrimaryStatus,
  debouncedFetchList,
  selectedItems,
  setTempSelectedItems,
  tempSelectedItems,
  items,
  setOpenFilterDrawer,
  applyfilterCheck,
  setFilterState,
  setSelectedItems,
  setapplyfilterCheck,
  setSelectedSections,
  setSelectedEnclosures,
  setspeciesData,
  authData,
  dietDetails,
  filterState,
  refreshSpeciesData,
  fetchList,
  removeFilterTriggered,
  setRemoveFilterTriggered,
  setCheckForSite
}) => {
  const theme = useTheme()

  const handleSearch = event => {
    setSearchQuery(event.target.value)
  }

  const handleChange = (event, newValue) => {
    setSelectionType(newValue)
    setapplyfilterCheck(false)
    setSelectedItems([])
    setPageNo(1)
    setspeciesData([])
    if (newValue === 'species') {
      setCheckForSite('')
    }
  }

  useEffect(() => {
    setPageNo(1)
  }, [isOpentab])

  const handelClose = () => {
    setIsOpenTabs(false)
    refreshDietDetails()
    setspeciesview('')
    setSearchQuery('')
    setPrimaryStatus({})
    setSelectedItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
    setTempSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      Taxonomy: [],
      Species: []
    })
    setSelectedSections([])
    setSelectedEnclosures([])
  }

  const handleEditclick = () => {
    setIsOpenTabsEdit(true)
    setPrimaryStatus({})
    if (selectionType === 'site_species') {
      setspeciesview('details')
    }
  }

  useEffect(() => {
    debouncedFetchList('')
  }, [searchQuery])

  const searchClose = () => {
    setSearchQuery('')
    debouncedFetchList('')
  }

  const handleFilter = val => {
    setOpenFilterDrawer(true)
    setSelectionType(val)
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

    //setItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
    if (val === 'animals') {
      setFilterState('species')
      setPageNo(1)
    } else if (val === 'species' && selectionType === 'site_species') {
      setCheckForSite('site_species')
    } else {
      setFilterState('')
    }
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
      setFilterState('')
    }
    setSelectedEnclosures([])
    setSelectedSections([])
  }

  useEffect(() => {
    if (removeFilterTriggered && isOpentab) {
      fetchList(searchQuery, 'mapped')
      setRemoveFilterTriggered(false)
    }
  }, [removeFilterTriggered])

  const mappedSpecies =
    selectionType === 'site_species'
      ? speciesData
      : speciesview === 'select'
      ? speciesData.filter(species => tempSelectedSpecies.includes(species.species_id))
      : speciesData.filter(species => species.mapped_to_diet)

  return (
    <Drawer
      anchor='right'
      open={isOpentab}
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
          <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {speciesview === 'details' ? 'Diet Assigned' : 'Assign Diet'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mr: '14px', mt: '4px' }}>
          {authData?.userData?.roles?.settings?.assign_diet === true ? (
            <IconButton size='small' sx={{ color: theme.palette.primary.light, mr: 5 }}>
              <Icon icon='mdi:pencil-outline' fontSize={24} onClick={handleEditclick} />
            </IconButton>
          ) : (
            ''
          )}
          <IconButton size='small' sx={{ color: theme.palette.primary.light }} onClick={handelClose}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Grid item size={{ md: 8, xs: 12 }}>
        <TabContext value={selectionType}>
          {dietDetails?.total_animals !== '0' &&
          dietDetails?.total_species !== '0' &&
          dietDetails?.total_sites !== '0' ? (
            <TabList
              onChange={handleChange}
              aria-label='customized tabs example'
              sx={{ background: theme.palette.common.white }}
            >
              <Tab
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, width: '33.33%', fontWeight: '600' }}
                value='species'
                label={`SPECIES  ${selectionType === 'species' && !loading ? ' - ' + speciestotalcount || ' ' : ' '}`}
              />

              <Tab
                style={{ borderRadius: 0, width: '33.33%', fontWeight: '600' }}
                value='animals'
                label={`ANIMALS  ${selectionType === 'animals' && !loading ? ' - ' + speciestotalcount || ' ' : ' '}`}
              />

              <Tab
                style={{ borderRadius: 0, width: '33.33%', fontWeight: '600' }}
                value='site_species'
                label={`SITE SPECIES `}
                // label={`SITE SPECIES ${
                //   selectionType === 'site_species' && !loading ? ' - ' + speciestotalcount || ' ' : ' '
                // }`}
              />
            </TabList>
          ) : (
            ''
          )}

          <TabPanel value='species' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            {speciesview === 'details' ? (
              <Grid item size={{ md: 8, sm: 8, xs: 8 }} sx={{ background: 'background.default' }}>
                <Box
                  sx={{
                    bgcolor: 'background.default',
                    p: '0px',
                    width: '555px',
                    overflowY: 'auto',
                    display: 'flex',
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
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '7px',
                        padding: '0 8px',
                        height: '45px',
                        mb: 0,
                        width: '77%',
                        mr: '17px',
                        ml: '13px',
                        mt: '10px',
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
                      {searchQuery ? (
                        <Icon
                          style={{ marginRight: '14px', cursor: 'pointer' }}
                          icon='mdi:close'
                          onClick={searchClose}
                        />
                      ) : (
                        ''
                      )}
                    </Box>
                    <LoadingButton
                      size='medium'
                      variant={
                        selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                          ? 'outlined'
                          : theme.palette.primary.dark
                      }
                      startIcon={<Icon icon='mage:filter' style={{ fontSize: '30px' }} />}
                      onClick={() => handleFilter('species')}
                      sx={{
                        position: 'relative',
                        height: '45px',
                        pr: '6px',
                        mt: '10px',

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

                            return speciesCount > 0 ? siteCount + speciesCount : siteCount + taxonomyCount
                          })()}
                        </span>
                      )}
                    </LoadingButton>
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
                height: 'calc(100vh - 162px)',
                px: 4,
                py: 3,
                mt: 2
              }}
              onScroll={handleScroll}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
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
              {!loading && speciesData?.length === 0 && searchQuery !== '' ? (
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
                  {!loading ? (
                    speciesview === 'select' ? (
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          pb: 1
                        }}
                      >
                        You have selected {tempSelectedSpecies?.length} species
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
                        Species ({speciestotalcount || ''})
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
                    ) : mappedSpecies?.length > 0 ? (
                      mappedSpecies.map((species, index) => (
                        <Box
                          key={index}
                          sx={{
                            background:
                              speciesview !== 'details' && species.mapped_to_diet
                                ? theme.palette.customColors.SurfaceVariant
                                : theme.palette.background.paper,
                            padding: '20px 48px 20px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                            mb: 3
                          }}
                        >
                          {' '}
                          <SpeciesCard species={species} />
                          <Box sx={{ display: 'flex', alignItems: 'center', pt: 1, ml: '11%', mt: '3px' }}>
                            {speciesview === 'details'
                              ? species.user_details
                                ? RenderUtility.renderUserAvatarDetails({
                                    profile_image: species.user_details.created_by_profile_image,
                                    user_name: species.user_details.created_by,
                                    date: species?.user_details?.created_at,
                                    text_color: theme.palette.customColors.OnSurfaceVariant,
                                    show_time: true,
                                    size: 'small'
                                  })
                                : null
                              : ''}
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
                        <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>No Species Found</Typography>
                      </Box>
                    )}
                    {!loading && isLoadingMore && (
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
          </TabPanel>

          <TabPanel value='animals' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            {speciesview === 'details' ? (
              <Grid item size={{ md: 8, sm: 8, xs: 8 }} sx={{ background: 'background.default', mb: '5%' }}>
                <Box
                  sx={{
                    bgcolor: 'background.default',
                    p: '0px',
                    width: '555px',
                    display: 'flex',
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
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '7px',
                        padding: '0 8px',
                        height: '45px',
                        mb: 0,
                        width: '77%',
                        mr: '17px',
                        ml: '13px',
                        mt: '10px',
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
                      {searchQuery ? (
                        <Icon
                          style={{ marginRight: '14px', cursor: 'pointer' }}
                          icon='mdi:close'
                          onClick={searchClose}
                        />
                      ) : (
                        ''
                      )}
                    </Box>
                    <LoadingButton
                      size='medium'
                      variant={
                        selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                          ? 'outlined'
                          : theme.palette.primary.dark
                      }
                      startIcon={<Icon icon='mage:filter' style={{ fontSize: '30px' }} />}
                      onClick={() => handleFilter('animals')}
                      sx={{
                        position: 'relative',
                        height: '45px',
                        pr: '6px',
                        mt: '10px',
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

                            return speciesCount > 0 ? siteCount + speciesCount : siteCount + taxonomyCount
                          })()}
                        </span>
                      )}
                    </LoadingButton>
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
                height: 'calc(100vh - 162px)',
                px: 4,
                py: 3,
                mt: 2
              }}
              onScroll={handleScroll}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
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
              {!loading && speciesData?.length === 0 && searchQuery !== '' ? (
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
                        You have selected {tempSelectedSpecies?.length}species
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
                        Animals ({speciestotalcount || ''})
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
                    ) : mappedSpecies?.length > 0 ? (
                      mappedSpecies.map((species, index) => (
                        <Box
                          key={index}
                          sx={{
                            background:
                              speciesview !== 'details' && species.mapped_to_diet
                                ? theme.palette.customColors.SurfaceVariant
                                : theme.palette.background.paper,
                            padding: '20px 48px 20px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                            mb: 3
                          }}
                        >
                          {' '}
                          <AnimalCard data={species} size='16px' />
                          <Box sx={{ display: 'flex', alignItems: 'center', pt: 1, ml: '14%', mt: '3px' }}>
                            {speciesview === 'details'
                              ? species.user_details
                                ? RenderUtility.renderUserAvatarDetails({
                                    profile_image: species.user_details.created_by_profile_image,
                                    user_name: species.user_details.created_by,
                                    date: species?.user_details?.created_at,
                                    text_color: theme.palette.customColors.OnSurfaceVariant,
                                    show_time: true,
                                    size: 'small'
                                  })
                                : null
                              : ''}
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
                        <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>No Animals Found</Typography>
                      </Box>
                    )}
                    {!loading && isLoadingMore && (
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
          </TabPanel>

          <TabPanel value='site_species' sx={{ background: theme.palette.customColors.tableHeaderBg }}>
            {speciesview === 'details' ? (
              <Grid item size={{ md: 8, sm: 8, xs: 8 }} sx={{ background: 'background.default' }}>
                <Box
                  sx={{
                    bgcolor: 'background.default',
                    p: '0px',
                    width: '555px',
                    overflowY: 'auto',
                    display: 'flex',
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
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '7px',
                        padding: '0 8px',
                        height: '45px',
                        mb: 0,
                        width: '77%',
                        mr: '17px',
                        ml: '13px',
                        mt: '10px',
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
                      {searchQuery ? (
                        <Icon
                          style={{ marginRight: '14px', cursor: 'pointer' }}
                          icon='mdi:close'
                          onClick={searchClose}
                        />
                      ) : (
                        ''
                      )}
                    </Box>
                    <LoadingButton
                      size='medium'
                      variant={
                        selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                          ? 'outlined'
                          : theme.palette.primary.dark
                      }
                      startIcon={<Icon icon='mage:filter' style={{ fontSize: '30px' }} />}
                      onClick={() => handleFilter('site_species')}
                      sx={{
                        position: 'relative',
                        height: '45px',
                        pr: '6px',
                        mt: '10px',

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

                            return speciesCount > 0 ? siteCount + speciesCount : siteCount + taxonomyCount
                          })()}
                        </span>
                      )}
                    </LoadingButton>
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
                height: 'calc(100vh - 162px)',
                px: 4,
                py: 3,
                mt: 2
              }}
              onScroll={handleScroll}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
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
              {!loading && speciesData?.length === 0 && searchQuery !== '' ? (
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
                  {!loading ? (
                    speciesview === 'select' ? (
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          pb: 1
                        }}
                      >
                        You have selected {tempSelectedSpecies?.length} species
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
                        Total Sites ({speciestotalcount || 0})
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
                    ) : mappedSpecies?.length > 0 ? (
                      selectionType === 'site_species' ? (
                        mappedSpecies.map((site, siteIndex) => (
                          <Box key={siteIndex} sx={{ mb: 4 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2
                              }}
                            >
                              <Typography
                                variant='body2'
                                sx={{
                                  fontSize: '16px',
                                  fontWeight: 700,
                                  color: theme.palette.primary.dark
                                }}
                              >
                                Site Name : {site.site_name}
                              </Typography>

                              <Chip
                                label={`${
                                  site.species?.length === 1 ? '1 Specie' : `${site.species?.length || 0} Species`
                                }`}
                                size='small'
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: theme.palette.customColors.Primary10,
                                  color: theme.palette.primary.dark,
                                  borderRadius: '8px'
                                }}
                              />
                            </Box>

                            {site.species?.map((species, index) => (
                              <Box
                                key={index}
                                sx={{
                                  background:
                                    speciesview !== 'details' && species.mapped_to_diet
                                      ? theme.palette.customColors.SurfaceVariant
                                      : theme.palette.background.paper,
                                  padding: '20px 48px 20px 16px',
                                  borderRadius: '8px',
                                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  mb: 3
                                }}
                              >
                                <SpeciesCard species={species} />

                                <Box sx={{ display: 'flex', alignItems: 'center', pt: 1, ml: '11%', mt: '3px' }}>
                                  {speciesview === 'details'
                                    ? species.user_details
                                      ? RenderUtility.renderUserAvatarDetails({
                                          profile_image: species.user_details.created_by_profile_image,
                                          user_name: species.user_details.created_by,
                                          date: species?.user_details?.created_at,
                                          text_color: theme.palette.customColors.OnSurfaceVariant,
                                          show_time: true,
                                          size: 'small'
                                        })
                                      : null
                                    : ''}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        ))
                      ) : (
                        mappedSpecies.map((species, index) => (
                          <Box
                            key={index}
                            sx={{
                              background:
                                speciesview !== 'details' && species.mapped_to_diet
                                  ? theme.palette.customColors.SurfaceVariant
                                  : theme.palette.background.paper,
                              padding: '20px 48px 20px 16px',
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                              mb: 3
                            }}
                          >
                            <SpeciesCard species={species} />
                          </Box>
                        ))
                      )
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
                        <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>No Species Found</Typography>
                      </Box>
                    )}
                    {!loading && isLoadingMore && (
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
          </TabPanel>
        </TabContext>
      </Grid>
    </Drawer>
  )
}

export default SpeciesAnimalsMapped
