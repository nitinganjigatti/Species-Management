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
import { useMediaQuery } from '@mui/material'

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
  refreshSpeciesData,
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
  setSelectedEnclosures
}) => {
  const listInnerRef = useRef(null)
  const theme = useTheme()
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
  }

  const handleSelectedclick = val => {
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
    //setItems({ Site: [], Section: [], Enclosure: [], Taxonomy: [], Species: [] })
    if (selectionType === 'animals') {
      setFilterState('species')
      // refreshSpeciesData('')
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
    setSelectedEnclosures([])
    setSelectedSections([])
    refreshSpeciesData('')
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
              <LoadingButton
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
                {/* {selectedItems && Object.values(selectedItems).some(array => array.length > 0)
                  ? Object.values(selectedItems).reduce((total, array) => total + array.length, 0)
                  : '0'} */}
                {selectedItems
                  ? (() => {
                      const siteCount = selectedItems.Site?.length || 0
                      const speciesCount = selectedItems.Species?.length || 0
                      const taxonomyCount = selectedItems.Taxonomy?.length || 0

                      return speciesCount > 0 ? siteCount + speciesCount : siteCount + taxonomyCount
                    })()
                  : '0'}
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
                  background: '#EAF5EC',
                  border: '1px solid #0000000D'
                }}
              >
                <Typography variant='body2' sx={{ color: '#006D35', fontWeight: 600 }}>
                  {site.site_name}
                </Typography>
                <IconButton
                  edge='end'
                  onClick={() => handleRemove(site.site_id)}
                  sx={{ color: '#1F515B', padding: '4px' }}
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
            {tempSelectedSpecies.length > 0
              ? `Selected ${tempSelectedSpecies.length} / ${speciestotalcount}`
              : selectionType === 'species'
              ? `All species${!loading && speciestotalcount ? ` (${speciestotalcount})` : ''}`
              : `All animals${!loading && speciestotalcount ? ` (${speciestotalcount})` : ''}`}
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
        ) : selectionType === 'species' ? (
          <List>
            {speciesData.length > 0 ? (
              speciesData.map(species => (
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
                          objectFit: 'inherit'
                        },
                        borderRadius:
                          species?.default_icon && species.default_icon.includes('.svg')
                            ? 'unset'
                            : species?.default_icon
                            ? '50%'
                            : 'unset'
                      }}
                      src={species.default_icon ? species.default_icon : '/icons/species.svg'}
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
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 10, fontWeight: '500' }}>No Species Found</Typography>
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
            {speciesData.length > 0 ? (
              speciesData.map(species => (
                <ListItem
                  key={species.id}
                  secondaryAction={
                    <Box
                      sx={{
                        backgroundColor: species.mapped_to_diet ? '' : '#F2FFF8',
                        pl: 3,
                        pr: 4,
                        py: 9.4,
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
                          objectFit: 'inherit'
                        },
                        borderRadius:
                          species?.default_icon && species.default_icon.includes('.svg')
                            ? 'unset'
                            : species?.default_icon
                            ? '50%'
                            : 'unset'
                      }}
                      src={species.default_icon ? species.default_icon : '/icons/species.svg'}
                      alt={species.scientific_name}
                    />
                  </ListItemAvatar>
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
                          {species.animal_id ? `AID: ${species.animal_id}` : 'AID: -'}
                        </Typography>
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
                      </>
                    }
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
                          {species.default_common_name ? species.default_common_name : '-'}
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
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 10, fontWeight: '500' }}>No Animals Found</Typography>
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
          disabled={tempSelectedSpecies?.length === 0}
          onClick={() => handleSelectedclick('select')}
          sx={{ height: '45px' }}
        >
          ADD
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesMappedtoDiet
