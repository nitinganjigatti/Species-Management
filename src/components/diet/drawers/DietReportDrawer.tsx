import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import {
  Badge,
  Checkbox,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Box, styled } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const leftMenu = [
  { id: 1, name: 'Sites' },
  { id: 2, name: 'Species' }
]

const drugTypeOptions = [
  { id: 'all', name: 'All' },
  { id: 'controlled', name: 'Controlled Substance' },
  { id: 'prescription', name: 'Prescription Required' }
]

const StyledBadge = styled(Badge)(({ theme }: { theme: any }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

interface DietReportDrawerProps {
  openFilterDrawer: boolean
  setOpenFilterDrawer: (open: boolean) => void
  onApplyFilter: (filterData: any) => void
  selectedOptions: any
  setSelectedOptions: React.Dispatch<React.SetStateAction<any>>
  sites: any[]
  productTypes: any[]
  speciesList: any[]
  handleSelectedSpecies: () => void
  handleSelectedAllSites: () => void
  taxonomyListCallback: () => void
  handleScrollforTaxonomy: (e: React.UIEvent<HTMLDivElement>) => void
  taxonomyLoading: boolean
  handleTaxonomySearch: (value: string) => void
  searchTaxonomyQuery: string
}

const DietReportDrawer: React.FC<DietReportDrawerProps> = ({
  openFilterDrawer,
  setOpenFilterDrawer,
  onApplyFilter,
  selectedOptions,
  setSelectedOptions,
  sites,
  productTypes,
  speciesList,
  handleSelectedSpecies,
  handleSelectedAllSites,
  taxonomyListCallback,
  handleScrollforTaxonomy,
  taxonomyLoading,
  handleTaxonomySearch,
  searchTaxonomyQuery
}) => {
  const theme = useTheme()

  const [selectedMenu, setSelectedMenu] = useState<any>(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 50
  })

  // const isAllProductTypesSelected =
  // speciesList?.length > 0 && selectedOptions['Species']?.length === productTypes?.length

  const uniqueSpeciesList = Array.from(new Map(speciesList?.map(item => [item.tsn, item])).values())
  const isAllSpeciesSelected =
    uniqueSpeciesList?.length > 0 && selectedOptions['Species']?.length === uniqueSpeciesList?.length

  const uniqueSites = Array.from(new Map(sites?.map(site => [site.site_id, site])).values())
  const isAllSitesSelected = uniqueSites?.length > 0 && selectedOptions['Sites']?.length === uniqueSites?.length

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
  }

  const handleMenuClick = (menu: any) => {
    setSelectedMenu(menu)
    setSearchQuery('')
  }

  const handleClearAll = () => {
    setSelectedOptions({
      Sites: [],
      'Product Type': [],
      'Drug Type': 'all'
    })
  }

  const handleCheckbox = useCallback(
    (id: any, menuName: string) => {
      setSelectedOptions((prevOptions: any) => {
        const isSelected = prevOptions[menuName]?.includes(id)

        return {
          ...prevOptions,
          [menuName]: isSelected
            ? prevOptions[menuName].filter((itemId: any) => itemId !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      })
    },
    [setSelectedOptions]
  )

  const handleDrugTypeChange = (event: any) => {
    setSelectedOptions((prevOptions: any) => ({
      ...prevOptions,
      'Drug Type': event.target.value
    }))
  }

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  // const handleTaxonomySearch = useCallback(event => {
  //   debugger

  //   console.log(event.target.value)

  //   //handleTaxonomySearch()
  // }, [])

  const applyFilters = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const filterData: any = {}

    //Attach Pharmacy filters to object to send
    if (selectedOptions['Sites'] && selectedOptions['Sites'].length > 0) {
      filterData.Sites = selectedOptions['Sites']
    }

    if (selectedOptions['Species'] && selectedOptions['Species'].length > 0) {
      filterData.Species = selectedOptions['Species']
    }

    if (selectedOptions['Drug Type'] && selectedOptions['Drug Type'] !== 'all') {
      filterData[selectedOptions['Drug Type']] = 1
    }

    onApplyFilter(filterData)
    setOpenFilterDrawer(false)
    setIsSubmitting(false)
  }, [selectedOptions, onApplyFilter, setOpenFilterDrawer, isSubmitting])

  const getMenuBadgeCount = (menuName: string) => {
    if (menuName === 'Drug Type') {
      return selectedOptions[menuName] && selectedOptions[menuName] !== 'all' ? 1 : 0
    }

    return selectedOptions[menuName] ? selectedOptions[menuName].length : 0
  }

  const filteredSitesList = uniqueSites?.filter(site => site.site_name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSiteSelectAll = () => {
    handleSelectedAllSites()
  }

  const handleSpeciesSelectAll = () => {
    handleSelectedSpecies()
  }

  return (
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
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
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
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid size={{ md: 4, sm: 4, xs: 4 }}>
            {leftMenu?.map(menu => (
              <Box
                key={menu.id}
                sx={{
                  width: '190px',
                  bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px'
                }}
                onClick={() => handleMenuClick(menu)}
              >
                <Typography component='div'
                  sx={{
                    color: (theme as any).palette.primary.dark,
                    fontSize: '16px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {menu.name}
                  <StyledBadge badgeContent={getMenuBadgeCount(menu.name)} color='primary' sx={{ ml: 2 }} />
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid size={{ md: 8, sm: 8, xs: 8 }}>
            {/* <Box
              sx={{
                bgcolor: '#FFFFFF',
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100dvh - 190px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            > */}
            {selectedMenu.name === 'Sites' ? (
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  p: '16px',
                  borderRadius: '8px',
                  width: '345px',
                  height: 'calc(100dvh - 190px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 0,
                    height: 0
                  },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
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
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' color={(theme as any).palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={searchQuery}
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
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    checked={isAllSitesSelected}
                    indeterminate={selectedOptions['Sites']?.length > 0 && !isAllSitesSelected}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleSiteSelectAll}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {filteredSitesList?.map(site => (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} key={site?.site_id}>
                    <Checkbox
                      inputProps={{ 'aria-label': 'controlled' }}
                      checked={selectedOptions['Sites']?.includes(site?.site_id) || false}
                      onChange={() => handleCheckbox(site?.site_id, 'Sites')}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                      {site?.site_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : selectedMenu.name === 'Species' ? (
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  p: '16px',
                  borderRadius: '8px',
                  width: '345px',
                  height: 'calc(100dvh - 190px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 0,
                    height: 0
                  },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}
                onScroll={handleScrollforTaxonomy}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px',
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' color={(theme as any).palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={searchTaxonomyQuery || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      handleTaxonomySearch(event.target.value)
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    checked={isAllSpeciesSelected}
                    indeterminate={selectedOptions['Species']?.length > 0 && !isAllSpeciesSelected}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleSpeciesSelectAll}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {uniqueSpeciesList?.map((type, index) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} key={(type as any)?.tsn || index}>
                    <Checkbox
                      inputProps={{ 'aria-label': 'controlled' }}
                      checked={selectedOptions['Species']?.includes((type as any)?.tsn) || false}
                      onChange={() => handleCheckbox((type as any)?.tsn, 'Species')}
                    />

                    <SpeciesCard species={{ common_name: (type as any)?.common_name, scientific_name: (type as any)?.scientific_name }} />
                    {/* <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                      {type?.scientific_name}
                    </Typography> */}
                  </Box>
                ))}
                {taxonomyLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress color='success' size={20} sx={{ margin: '0 auto' }} />
                  </Box>
                )}
              </Box>
            ) : selectedMenu.name === 'Drug Type' ? (
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  p: '16px',
                  borderRadius: '8px',
                  width: '345px',
                  height: 'calc(100dvh - 190px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 0,
                    height: 0
                  },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}
              >
                <FormControl fullWidth>
                  <Select
                    value={selectedOptions['Drug Type'] || 'all'}
                    onChange={handleDrugTypeChange}
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#839D8D'
                      }
                    }}
                  >
                    {drugTypeOptions.map(option => (
                      <MenuItem
                        key={option.id}
                        value={option.id}
                        sx={{
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#839D8D'
                        }}
                      >
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ) : null}
            {/* </Box> */}
          </Grid>
        </Grid>
      </Box>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearAll}>
          CLEAR ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters} disabled={isSubmitting}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

export default DietReportDrawer
