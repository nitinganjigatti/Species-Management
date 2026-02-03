import { useTheme, styled } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Badge,
  Checkbox,
  Divider,
  Drawer,
  Grid,
  IconButton,
  TextField,
  Typography,
  Card,
  Collapse,
  CardHeader,
  CardContent,
  Tooltip,
  CircularProgress
} from '@mui/material'
import React, { useState, useEffect } from 'react'
import Icon from 'src/@core/components/icon'
import SelectSiteList from 'src/components/diet/SelectSiteList'
import SelectSectionList from 'src/components/diet/SelectSectionList'
import SelectEnclosureList from 'src/components/diet/SelectEnclosureList'
import { getSpeciesList } from 'src/lib/api/diet/dietList'

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

const SpeciesMappedtoDietFilter = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  tabsforfilter,
  items,
  setSearchTerm,
  searchTerm,
  setSelectedItems,
  selectedItems,
  activeTab,
  setActiveTab,
  setSiteListDrawer,
  openSiteListDrawer,
  setTempSelectedItems,
  tempSelectedItems,
  sectionsData,
  setSectionsData,
  enclosuresData,
  setEnclosuresData,
  setSelectedSpeciesIds,
  selectedSpeciesIds,
  selectedTaxonomyIds,
  setSelectedTaxonomyIds,
  handleScrollforFilter,
  handleScrollforTaxonomy,
  taxonomyList,
  selectionType,
  setSearchQuery,
  searchQuery,
  debouncedSearch,
  speciesDataforFilter,
  setFilterState,
  setspeciesData,
  setPageNo,
  refreshSpeciesData,
  setFilteredTaxonomyList,
  setTaxonomySearchQuery,
  filteredTaxonomyList,
  taxonomySearchQuery,
  setItems,
  debouncedFetchTaxonomyList,
  setapplyfilterCheck,
  applyfilterCheck,
  selectedEnclosures,
  setSelectedEnclosures,
  setSelectedSections,
  selectedSections,
  loadingTaxonomy,
  loadingSpecies,
  checkForSite
}) => {
  const theme = useTheme()

  const [collapsed, setCollapsed] = useState(true)
  const [openSectionListDrawer, setOpenSectionListDrawer] = useState(false)
  const [openEnclosureListDrawer, setOpenEnclosureListDrawer] = useState(false)

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setTaxonomySearchQuery('')
    if (applyfilterCheck === false) {
      setFilterState('')
      setSelectedSpeciesIds([])
      setSelectedTaxonomyIds([])
      setSearchQuery('')
      setTempSelectedItems({
        Site: [],
        Section: [],
        Enclosure: [],
        Taxonomy: [],
        Species: []
      })
      setSelectedItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
      setItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
      setEnclosuresData([])
    }
    if (selectionType === 'animals') {
      setspeciesData([])
      setPageNo(1)
      setFilterState('')
    }
  }

  const handleSpeciesCheckboxChange = speciesId => {
    setSelectedSpeciesIds(prev =>
      prev.includes(speciesId) ? prev.filter(id => id !== speciesId) : [...prev, speciesId]
    )
  }

  const handleTaxonomyCheckboxChange = tsnId => {
    setSelectedTaxonomyIds(prev => (prev.includes(tsnId) ? prev.filter(id => id !== tsnId) : [...prev, tsnId]))
  }

  useEffect(() => {
    setFilteredTaxonomyList(taxonomyList)
  }, [taxonomyList])

  useEffect(() => {
    setActiveTab('Site')
    setSearchQuery('')
    if (checkForSite === 'site_species') {
      setActiveTab('Taxonomy')
    }
  }, [openFilterDrawer])

  const handleApplyFilter = () => {
    setFilterState('')
    setSelectedSpeciesIds([])
    setSelectedTaxonomyIds([])
    setSearchQuery('')
    setPageNo(1)

    setapplyfilterCheck(true)
    const allSectionIds = tempSelectedItems?.Section.map(section_id => section_id)
    const allEnclosureIds = tempSelectedItems?.Enclosure.map(enclosure_id => enclosure_id)

    const allSpeciesIds = selectedSpeciesIds.map(id => Number(id))
    const allTaxonomyIds = selectedTaxonomyIds.map(id => Number(id))

    setSelectedItems({
      ...tempSelectedItems,
      Section: allSectionIds,
      Enclosure: allEnclosureIds,
      Species: allSpeciesIds,
      Taxonomy: allTaxonomyIds
    })

    setOpenFilterDrawer(false)
  }

  const handleCancelAll = async () => {
    const clearedTempSelectedItems = Object.keys(tempSelectedItems).reduce((acc, key) => {
      acc[key] = []

      return acc
    }, {})

    const clearedSelectedItems = Object.keys(selectedItems).reduce((acc, key) => {
      acc[key] = []

      return acc
    }, {})

    setTempSelectedItems(clearedTempSelectedItems)
    setSelectedItems(clearedSelectedItems)
    setOpenFilterDrawer(false)
    setPageNo(1)
    setFilterState('')
    setSelectedSpeciesIds([])
    setSelectedTaxonomyIds([])
    setSearchQuery('')
    setItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
    setEnclosuresData([])
  }

  const handleSelectAll = () => {
    if (activeTab === 'Species') {
      const allSpeciesIds = speciesDataforFilter.map(species => species.species_id.toString())
      const areAllSelected = selectedSpeciesIds.length === speciesDataforFilter.length

      setSelectedSpeciesIds(areAllSelected ? [] : allSpeciesIds)
    } else if (activeTab === 'Taxonomy') {
      const allTaxonomyIds = taxonomyList.map(species => species.tsn.toString())
      const areAllSelected = selectedTaxonomyIds.length === taxonomyList.length

      setSelectedTaxonomyIds(areAllSelected ? [] : allTaxonomyIds)
    } else {
      const allSelectedIds = items[activeTab].map(item =>
        activeTab === 'Site' ? Number(item.site_id) : Number(item.id)
      )
      setTempSelectedItems({
        ...tempSelectedItems,
        [activeTab]: tempSelectedItems[activeTab].length === items[activeTab].length ? [] : allSelectedIds
      })
    }
  }

  const filteredItems = items[activeTab].filter(item => {
    const itemName = activeTab === 'Site' ? item.site_name : item.name

    return itemName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleRemove = siteId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Site: prev.Site.filter(id => id !== siteId)
    }))
  }

  const handleRemoveSection = sectionId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Section: prev.Section.filter(id => id !== sectionId)
    }))

    setSectionsData(prev => prev.filter(section => section.section_id !== sectionId.toString()))

    if (setSelectedSections) {
      setSelectedSections(prev => prev.filter(id => id !== sectionId))
    }
  }

  const handleRemoveEnclosure = enclosureId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Enclosure: prev.Enclosure.filter(id => id !== enclosureId)
    }))

    setEnclosuresData(prev => prev.filter(enclosure => enclosure.enclosure_id !== enclosureId.toString()))

    if (setSelectedEnclosures) {
      setSelectedEnclosures(prev => prev.filter(id => id !== enclosureId))
    }
  }

  useEffect(() => {
    if (activeTab === 'Species' && selectedItems.Species) {
      setSelectedSpeciesIds(selectedItems.Species.map(id => id.toString()))
    } else if (activeTab === 'Taxonomy' && selectedItems.Taxonomy) {
      setSelectedTaxonomyIds(selectedItems.Taxonomy.map(id => id.toString()))
    } else if (activeTab === 'Site') {
      setTempSelectedItems({ ...selectedItems })
    }
  }, [activeTab, selectedItems.Species, openFilterDrawer])

  const handleSearch = event => {
    const value = event.target.value

    if (activeTab === 'Taxonomy') {
      setTaxonomySearchQuery(value)
      setFilteredTaxonomyList(taxonomyList)
      debouncedFetchTaxonomyList(value)
    } else {
      setSearchQuery(value)
      debouncedSearch(value)
    }
  }

  const handlesearchClose = () => {
    if (activeTab === 'Taxonomy') {
      setTaxonomySearchQuery('')
      setFilteredTaxonomyList(taxonomyList)
    } else {
      setSearchQuery('')
      setPageNo(1)
      setspeciesData([])
      refreshSpeciesData('')
    }
  }

  const getTabSelectionCount = tab => {
    if (tab === 'Taxonomy') {
      return selectedTaxonomyIds?.length || tempSelectedItems?.Taxonomy?.length || selectedItems?.Taxonomy?.length || 0
    }

    if (tab === 'Species') {
      return selectedSpeciesIds?.length || tempSelectedItems?.Species?.length || selectedItems?.Species?.length || 0
    }

    return tempSelectedItems?.[tab]?.length || selectedItems?.[tab]?.length || 0
  }

  return (
    <>
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
        {/* header */}
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

        {/* container */}
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: 'background.default',
            height: '100%'
          }}
        >
          <Grid container sx={{ px: 5 }}>
            <Grid item size={{ xs: 4, sm: 4, md: 4 }}>
              {tabsforfilter
                .filter(tab => {
                  if (selectionType === 'species' && tab === 'Species') return false
                  if (selectionType === 'animals' && tab === 'Taxonomy') return false

                  if (selectionType === 'species' && checkForSite === 'site_species') {
                    return tab === 'Taxonomy'
                  }

                  return true
                })
                .map(tab => {
                  const tabCount = getTabSelectionCount(tab)
                  return (
                    <Box
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      sx={{
                        padding: 1,
                        cursor: 'pointer',
                        backgroundColor: activeTab === tab ? theme.palette.common.white : 'transparent',
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
                      {tab} <StyledBadge badgeContent={tabCount} color='primary' sx={{ ml: 5 }} />
                    </Box>
                  )
                })}
            </Grid>
            <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
              <Box
                sx={{
                  bgcolor: theme.palette.customColors.OnPrimary,
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
                {activeTab !== 'Site' ? (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                        borderRadius: '4px',
                        padding: '0 8px',
                        height: '40px',
                        mb: 4
                      }}
                    >
                      <Icon icon='mi:search' />
                      <TextField
                        variant='outlined'
                        placeholder='Search'
                        value={activeTab === 'Taxonomy' ? taxonomySearchQuery : searchQuery}
                        onChange={handleSearch}
                        sx={{
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
                            disableUnderline: false,
                            endAdornment: (activeTab === 'Taxonomy' ? taxonomySearchQuery : searchQuery) && (
                              <IconButton size='small' onClick={handlesearchClose} sx={{ left: '35px' }}>
                                <Icon icon='mdi:close' fontSize={20} />
                              </IconButton>
                            )
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingBottom: '8px' }}>
                        {activeTab === 'Species' ? (
                          <Checkbox
                            checked={
                              selectedSpeciesIds.length === speciesDataforFilter.length &&
                              speciesDataforFilter.length > 0
                            }
                            indeterminate={
                              selectedSpeciesIds.length > 0 && selectedSpeciesIds.length < speciesDataforFilter.length
                            }
                            onChange={handleSelectAll}
                          />
                        ) : activeTab === 'Taxonomy' ? (
                          <Checkbox
                            checked={selectedTaxonomyIds.length === taxonomyList.length && taxonomyList.length > 0}
                            indeterminate={
                              selectedTaxonomyIds.length > 0 && selectedTaxonomyIds.length < taxonomyList.length
                            }
                            onChange={handleSelectAll}
                          />
                        ) : (
                          <Checkbox
                            checked={tempSelectedItems[activeTab].length === items[activeTab].length}
                            onChange={handleSelectAll}
                          />
                        )}
                        <span>Select All</span>
                      </div>
                    </Box>
                    <Divider sx={{ mb: 0 }} />
                  </>
                ) : activeTab === 'Site' ? (
                  <>
                    <Card sx={{ border: `1px solid ${theme.palette.customColors?.OutlineVariant}`, boxShadow: 'none' }}>
                      <CardHeader
                        title='Select Site'
                        onClick={() => {
                          if (tempSelectedItems?.Section?.length === 0) {
                            //setCollapsed(!collapsed)
                            setSiteListDrawer(true)
                          }
                        }}
                        disabled={tempSelectedItems?.Section?.length > 0}
                        sx={{
                          background:
                            tempSelectedItems?.Section?.length > 0
                              ? theme.palette.customColors.mdAntzNeutral
                              : theme.palette.customColors.tableHeaderBg,
                          p: 2,
                          pl: 4,
                          pr: 2,
                          '.MuiCardHeader-title': {
                            fontWeight: '500',
                            fontSize: '16px',
                            color:
                              tempSelectedItems?.Section?.length > 0
                                ? theme.palette.customColors.OnSurfaceVariant
                                : theme.palette.customColors.OnPrimaryContainer,
                            cursor: tempSelectedItems?.Section?.length > 0 ? '' : 'pointer'
                          }
                        }}
                        action={
                          <IconButton
                            size='small'
                            aria-label='collapse'
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                            disabled={tempSelectedItems?.Section?.length > 0}
                          >
                            <Icon
                              fontSize={20}
                              icon={
                                tempSelectedItems?.Section?.length
                                  ? 'mdi:lock'
                                  : collapsed
                                  ? 'mdi:chevron-down'
                                  : 'mdi:chevron-up'
                              }
                            />
                          </IconButton>
                        }
                      />
                      {tempSelectedItems?.Site?.length > 0 && (
                        <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                          {items.Site?.filter(site => tempSelectedItems?.Site?.includes(site.site_id)).map(site => (
                            <Box
                              key={site.site_id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                              }}
                            >
                              <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                {site.site_name}
                              </Typography>
                              <IconButton
                                edge='end'
                                onClick={() => handleRemove(site.site_id)}
                                sx={{ color: theme.palette.error.dark }}
                                disabled={tempSelectedItems?.Section?.length > 0}
                              >
                                <Icon
                                  icon={sectionsData?.length > 0 ? 'carbon:close-outline' : 'carbon:close-outline'}
                                  fontSize={20}
                                />
                              </IconButton>
                            </Box>
                          ))}
                        </CardContent>
                      )}
                    </Card>

                    {/* Display selected sections */}
                    {tempSelectedItems?.Site?.length === 1 && (
                      <Card
                        sx={{
                          border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                          boxShadow: 'none',
                          mt: '6%'
                        }}
                      >
                        <CardHeader
                          title='Select Sections'
                          onClick={() => {
                            if (tempSelectedItems?.Enclosure?.length === 0) {
                              setOpenSectionListDrawer(true)
                            }
                          }}
                          disabled={tempSelectedItems?.Enclosure?.length > 0}
                          sx={{
                            background:
                              tempSelectedItems?.Enclosure?.length > 0
                                ? theme.palette.customColors.mdAntzNeutral
                                : theme.palette.customColors.tableHeaderBg,
                            p: 2,
                            pl: 4,
                            pr: 2,
                            '.MuiCardHeader-title': {
                              fontWeight: '500',
                              fontSize: '16px',
                              color:
                                tempSelectedItems?.Enclosure?.length > 0
                                  ? theme.palette.customColors.OnSurfaceVariant
                                  : theme.palette.customColors.OnPrimaryContainer,
                              cursor: tempSelectedItems?.Enclosure?.length > 0 ? '' : 'pointer'
                            }
                          }}
                          action={
                            <IconButton
                              size='small'
                              aria-label='collapse'
                              sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                              disabled={tempSelectedItems?.Enclosure?.length > 0}
                            >
                              <Icon
                                fontSize={20}
                                icon={
                                  tempSelectedItems?.Enclosure?.length
                                    ? 'mdi:lock'
                                    : collapsed
                                    ? 'mdi:chevron-down'
                                    : 'mdi:chevron-up'
                                }
                              />
                            </IconButton>
                          }
                        />
                        {tempSelectedItems?.Section?.length > 0 &&
                          sectionsData?.filter(section => tempSelectedItems?.Section?.includes(section.section_id))
                            ?.length > 0 && (
                            <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                              {sectionsData
                                .filter(section => tempSelectedItems?.Section?.includes(section.section_id))
                                .map(section => (
                                  <Box
                                    key={section.section_id}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mb: 2
                                    }}
                                  >
                                    <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                      {section.section_name}
                                    </Typography>
                                    <IconButton
                                      edge='end'
                                      onClick={() => handleRemoveSection(section.section_id)}
                                      sx={{ color: theme.palette.error.dark }}
                                      disabled={tempSelectedItems?.Enclosure?.length > 0}
                                    >
                                      <Icon
                                        icon={
                                          enclosuresData?.length > 0 ? 'carbon:close-outline' : 'carbon:close-outline'
                                        }
                                        fontSize={20}
                                      />
                                    </IconButton>
                                  </Box>
                                ))}
                            </CardContent>
                          )}
                      </Card>
                    )}

                    {/* Display selected enclosures */}
                    {tempSelectedItems?.Section?.length === 1 && (
                      <Card
                        sx={{
                          border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                          boxShadow: 'none',
                          mt: '6%',
                          mb: 4
                        }}
                      >
                        <CardHeader
                          title='Select Enclosures'
                          onClick={() => setOpenEnclosureListDrawer(true)}
                          sx={{
                            background: theme.palette.customColors.tableHeaderBg,
                            p: 2,
                            pl: 4,
                            pr: 2,
                            '.MuiCardHeader-title': {
                              fontWeight: '500',
                              fontSize: '16px',
                              color:
                                tempSelectedItems?.Section?.length > 0
                                  ? theme.palette.customColors.OnSurfaceVariant
                                  : theme.palette.customColors.OnPrimaryContainer,
                              cursor: 'pointer'
                            }
                          }}
                          action={
                            <IconButton
                              size='small'
                              aria-label='collapse'
                              sx={{ color: theme.palette.customColors.OnSurfaceVariant }}

                              //disabled={tempSelectedItems.Enclosure?.length > 0} // Disable if enclosures are selected
                            >
                              <Icon fontSize={20} icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} />
                            </IconButton>
                          }
                        />
                        {tempSelectedItems?.Enclosure?.length > 0 &&
                          enclosuresData?.filter(enclosure =>
                            tempSelectedItems?.Enclosure?.includes(enclosure.enclosure_id)
                          )?.length > 0 && (
                            <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                              {enclosuresData
                                .filter(enclosure => tempSelectedItems?.Enclosure?.includes(enclosure.enclosure_id))
                                .map(enclosure => (
                                  <Box
                                    key={enclosure.enclosure_id}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mb: 2
                                    }}
                                  >
                                    <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                      {enclosure.user_enclosure_name}
                                    </Typography>
                                    <IconButton
                                      edge='end'
                                      onClick={() => handleRemoveEnclosure(enclosure.enclosure_id)}
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

                {activeTab === 'Species' && (
                  <>
                    <Box
                      sx={{
                        mt: 2,
                        width: '100%',
                        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
                        overflowY: 'auto',
                        height: '100vh'
                      }}
                      onScroll={handleScrollforFilter}
                    >
                      <Box sx={{ mb: 3, width: '100%' }}>
                        <Box sx={{ mt: 1, height: '100vh', width: '100%' }}>
                          {speciesDataforFilter?.length > 0 ? (
                            speciesDataforFilter.map(item => {
                              const itemName = item.scientific_name
                              const itemId = item.species_id

                              return (
                                <div
                                  key={itemId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    paddingBottom: '8px'
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedSpeciesIds.includes(itemId)}
                                    onChange={() => handleSpeciesCheckboxChange(itemId)}
                                  />

                                  <Tooltip title={itemName}>
                                    <span
                                      role='button'
                                      tabIndex={0}
                                      onClick={() => handleSpeciesCheckboxChange(itemId)}
                                      onKeyDown={event => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                          event.preventDefault()
                                          handleSpeciesCheckboxChange(itemId)
                                        }
                                      }}
                                      style={{
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '85%',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        color: theme.palette.customColors.OnSurfaceVariant
                                      }}
                                    >
                                      {itemName}
                                    </span>
                                  </Tooltip>
                                </div>
                              )
                            })
                          ) : !loadingSpecies ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                //height: '70%',
                                textAlign: 'center'
                              }}
                            >
                              <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
                              <Typography sx={{ textAlign: 'center', fontWeight: '500' }}>No Species Found</Typography>
                            </Box>
                          ) : (
                            ''
                          )}
                        </Box>
                      </Box>
                      {loadingSpecies && speciesDataforFilter?.length > 0 ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '135px',
                            left: '70px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,

                            zIndex: 2
                          }}
                        >
                          <CircularProgress size={30} />
                        </Box>
                      ) : loadingSpecies ? (
                        <Box
                          sx={{
                            position: 'sticky',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,

                            zIndex: 2
                          }}
                        >
                          <CircularProgress size={30} />
                        </Box>
                      ) : (
                        ''
                      )}
                    </Box>
                  </>
                )}

                {activeTab === 'Taxonomy' && (
                  <>
                    <Box
                      sx={{
                        mt: 2,
                        width: '100%',
                        '& .MuiDrawer-paper': { width: ['100%', '562px'] },

                        overflowY: 'auto',
                        height: '100vh'
                      }}
                      onScroll={handleScrollforTaxonomy}
                    >
                      <Box sx={{ mb: 3, width: '100%' }}>
                        <Box sx={{ height: '100vh', mt: 1, width: '100%' }}>
                          {filteredTaxonomyList?.length > 0 ? (
                            filteredTaxonomyList.map(item => {
                              const itemName = item.scientific_name
                              const itemId = item.tsn

                              return (
                                <div
                                  key={itemId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    paddingBottom: '8px'
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedTaxonomyIds.includes(itemId)}
                                    onChange={() => handleTaxonomyCheckboxChange(itemId)}
                                  />
                                  <Tooltip title={itemName}>
                                    <span
                                      role='button'
                                      tabIndex={0}
                                      onClick={() => handleTaxonomyCheckboxChange(itemId)}
                                      onKeyDown={event => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                          event.preventDefault()
                                          handleTaxonomyCheckboxChange(itemId)
                                        }
                                      }}
                                      style={{
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '85%',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        color: theme.palette.customColors.OnSurfaceVariant
                                      }}
                                    >
                                      {itemName}
                                    </span>
                                  </Tooltip>
                                </div>
                              )
                            })
                          ) : !loadingTaxonomy ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                //height: '70%',
                                textAlign: 'center'
                              }}
                            >
                              <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
                              <Typography sx={{ textAlign: 'center', mt: 10 }}>No Taxonomy found</Typography>
                            </Box>
                          ) : (
                            ''
                          )}
                        </Box>
                      </Box>
                      {loadingTaxonomy && filteredTaxonomyList?.length > 0 ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '135px',
                            left: '70px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,

                            zIndex: 2
                          }}
                        >
                          <CircularProgress size={30} />
                        </Box>
                      ) : loadingTaxonomy ? (
                        <Box
                          sx={{
                            position: 'sticky',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,

                            zIndex: 2
                          }}
                        >
                          <CircularProgress size={30} />
                        </Box>
                      ) : (
                        ''
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
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
            disabled={
              !(
                Object.values(tempSelectedItems).some(array => array.length > 0) ||
                selectedSpeciesIds?.length > 0 ||
                selectedTaxonomyIds?.length > 0
              )
            }
          >
            APPLY FILTER
          </LoadingButton>
        </Box>
      </Drawer>
      <SelectSiteList
        setSiteListDrawer={setSiteListDrawer}
        openSiteListDrawer={openSiteListDrawer}
        tabsforfilter={tabsforfilter}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        setSelectedItems={setSelectedItems}
        selectedItems={selectedItems}
        items={items}
        filteredItems={filteredItems}
        tempSelectedItems={tempSelectedItems}
        setTempSelectedItems={setTempSelectedItems}
      />
      <SelectSectionList
        open={openSectionListDrawer}
        setSectionsData={setSectionsData}
        sectionsData={sectionsData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onClose={() => setOpenSectionListDrawer(false)}
        siteId={tempSelectedItems?.Site?.[0]}
        setSelectedSections={setSelectedSections}
        selectedSections={selectedSections}
        tempSelectedItems={tempSelectedItems}
        openFilterDrawer={openFilterDrawer}
        onSelectSections={selectedSections => {
          setTempSelectedItems(prev => ({
            ...prev,
            Section: selectedSections
          }))
          setOpenSectionListDrawer(false)
        }}
      />
      <SelectEnclosureList
        open={openEnclosureListDrawer}
        enclosuresData={enclosuresData}
        setEnclosuresData={setEnclosuresData}
        onClose={() => setOpenEnclosureListDrawer(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sectionId={tempSelectedItems?.Section?.[0]}
        setSelectedEnclosures={setSelectedEnclosures}
        selectedEnclosures={selectedEnclosures}
        tempSelectedItems={tempSelectedItems}
        openFilterDrawer={openFilterDrawer}
        onSelectEnclosures={selectedEnclosures => {
          setTempSelectedItems(prev => ({
            ...prev,
            Enclosure: selectedEnclosures
          }))
          setOpenEnclosureListDrawer(false)
        }}
      />
    </>
  )
}

export default SpeciesMappedtoDietFilter
