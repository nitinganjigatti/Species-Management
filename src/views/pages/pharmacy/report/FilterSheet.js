import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Drawer,
  Checkbox,
  Typography,
  TextField,
  IconButton,
  Grid,
  Divider,
  CircularProgress,
  FormControlLabel
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'

const FilterSheet = ({
  open,
  setOpenFilterDrawer,
  categories,
  options,
  animalId,
  selectedOptions,
  setSelectedOptions,
  selectedSites,
  handleSelection,
  activeTab,
  isLoader,
  getTotalSelectedFilters
}) => {
  const theme = useTheme()
  const searchInputRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    if (open && animalId) {
      setSelectedOptions(prev => ({
        ...prev,
        Site: selectedSites.length ? selectedSites : []
      }))
    }
  }, [open])

  // const handleSelectAll = event => {
  //   if (event.target.checked) {
  //     const currentOptions = options[activeCategory]?.map(option =>
  //       activeCategory === 'Site' ? option.site_id : option.taxonomy_id
  //     )
  //     setSelectedOptions(prev => ({
  //       ...prev,
  //       [activeCategory]: currentOptions
  //     }))
  //   } else {
  //     setSelectedOptions(prev => ({
  //       ...prev,
  //       [activeCategory]: []
  //     }))
  //   }
  // }

  // const handleSelectAll = event => {
  //   if (event.target.checked) {
  //     const currentOptions = filteredOptions.map(option =>
  //       activeCategory === 'Site' ? option.site_id : option.id
  //     )
  //     setSelectedOptions(prev => ({
  //       ...prev,
  //       [activeCategory]: currentOptions
  //     }))
  //   } else {
  //     setSelectedOptions(prev => ({
  //       ...prev,
  //       [activeCategory]: []
  //     }))
  //   }
  // }

  const handleSelectAll = event => {
    const filteredIds = filteredOptions.map(option =>
      activeCategory === 'Site' ? option.site_id : option.id
    )

    if (event.target.checked) {
      // ✅ Add only filtered IDs to current selection (merge with previous)
      setSelectedOptions(prev => {
        const current = prev[activeCategory] || []
        return {
          ...prev,
          [activeCategory]: Array.from(new Set([...current, ...filteredIds]))
        }
      })
    } else {
      // ❌ Remove only filtered IDs from selection
      setSelectedOptions(prev => {
        const current = prev[activeCategory] || []
        const updated = current.filter(id => !filteredIds.includes(id))
        return {
          ...prev,
          [activeCategory]: updated
        }
      })
    }
  }

  const handleToggleOption = (optionId, category) => {

    setSelectedOptions(prevSelectedOptions => {
      const updatedOptions = { ...prevSelectedOptions }

      if (!updatedOptions[category]) {
        updatedOptions[category] = []
      }

      if (updatedOptions[category].includes(optionId)) {
        updatedOptions[category] = updatedOptions[category].filter(id => id !== optionId)
      } else {
        updatedOptions[category] = [...updatedOptions[category], optionId]
      }

      return updatedOptions
    })
  }

  const handleConfirmSelection = () => {
    const selectedSiteIDs = selectedOptions.Site || []
    handleSelection(selectedSiteIDs, 'Site')

    const selectedOrganizationIDs = selectedOptions.Organization || []
    handleSelection(selectedOrganizationIDs, 'Organization')

    setOpenFilterDrawer(false)
  }

  const handleClearFilter = () => {
    setSelectedOptions([])
  }

  const filteredOptions =
    options[activeCategory]?.filter(option => {
      if (activeCategory === 'Site') {
        return option?.site_name?.toLowerCase().includes(searchValue.toLowerCase())
      }

      if (activeCategory === 'Organization') {
        return option?.organization_name?.toLowerCase().includes(searchValue.toLowerCase())
      }
    }) || []

  const handleCategoryClick = category => {
    setActiveCategory(category)
    setSearchValue('')
  }

  const filteredIds = filteredOptions.map(option =>
    activeCategory === 'Site' ? option.site_id : option.id
  )

  const selectedIds = selectedOptions[activeCategory] || []

  const isAllFilteredSelected = filteredIds.every(id => selectedIds.includes(id))
  const isSomeFilteredSelected = filteredIds.some(id => selectedIds.includes(id))

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100) // slight delay to allow render
    }
  }, [open, activeCategory])


  return (
    <Drawer
      anchor='right'
      open={open}
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500, fontFamily: 'Inter' }}>
            Filter - {getTotalSelectedFilters(selectedOptions)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              setOpenFilterDrawer(false)
              handleClearFilter()
            }}
          >
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
          <Grid item size={{ xs: 4, sm: 4, md: 4 }}>
            {categories.map(menu => (
              <Box
                key={menu}
                sx={{
                  width: '190px',
                  bgcolor: activeCategory === menu ? 'white' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  '&:hover': {
                    backgroundColor: activeCategory === menu ? 'white' : '#f5f5f5'
                  }
                }}
                onClick={() => {
                  handleCategoryClick(menu)
                }}
              >
                <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                  {menu}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 190px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none',
                bgColor: '#fff'
              }}
            >
              <Box
                sx={{
                  p: '16px',
                  bgColor: '#fff',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  bgcolor: theme.palette.primary.contrastText
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px'
                  }}
                >
                  <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />

                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    inputRef={searchInputRef}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      },
                      '& .MuiInputBase-input': {
                        '&::before': {
                          borderBottom: 'none !important'
                        },
                        '&:hover::before': {
                          borderBottom: 'none !important'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>

                  <FormControlLabel sx={{}}
                    label={
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                        Select All
                      </Typography>
                    }
                    control={
                      <Checkbox
                        disabled={filteredOptions.length === 0}
                        checked={isAllFilteredSelected}
                        indeterminate={isSomeFilteredSelected && !isAllFilteredSelected}
                        onChange={handleSelectAll}
                      />
                    }
                  />
                </Box>
                <Divider sx={{ mt: 1.4 }} />
              </Box>
              <Box sx={{ ml: 2, overflowY: 'auto' }}>
                <Box sx={{ ml: 2 }}>
                  {activeCategory === 'Site' ? (
                    filteredOptions.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel label={<Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                          {option.site_name}
                        </Typography>}
                          control={<Checkbox
                            checked={(selectedOptions[activeCategory] || []).includes(option.site_id)}
                            onChange={() => handleToggleOption(option.site_id, activeCategory)}
                          />} />
                      </Box>
                    ))
                  ) : isLoader ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    filteredOptions.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel label={<Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                          {option.organization_name}
                        </Typography>}
                          control={<Checkbox
                            checked={(selectedOptions[activeCategory] || []).includes(option.id)}
                            onChange={() => handleToggleOption(option.id, activeCategory)}
                          />} />
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearFilter}>
          CLEAR ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={handleConfirmSelection}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default FilterSheet
