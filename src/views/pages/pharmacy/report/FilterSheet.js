import React, { useState } from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Typography,
  TextField,
  IconButton,
  Grid,
  useRadioGroup,
  Divider
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'

const FilterSheet = ({ open, setOpenFilterDrawer, categories, options, selectedOptions, setSelectedOptions }) => {
  const theme = useTheme()
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const handleToggleOption = option => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(item => item !== option))
    } else {
      setSelectedOptions([...selectedOptions, option])
    }
  }

  const handleSelectAll = () => {
    const currentOptions = options[activeCategory]
    if (selectedOptions.length === currentOptions.length) {
      setSelectedOptions([])
    } else {
      setSelectedOptions([...currentOptions])
    }
  }

  const handleApplyFilter = () => {
    setOpenFilterDrawer(false)
  }

  const handleClearFilter = () => {
    setSelectedOptions([])
  }

  const filteredOptions =
    options[activeCategory]?.filter(option => option?.site_name?.toLowerCase().includes(searchValue.toLowerCase())) ||
    []

  const isAllSelected =
    filteredOptions?.length > 0 && filteredOptions.length === (selectedOptions[selectedCategory]?.length || 0)

  const handleCategoryClick = category => {
    setSelectedCategory(category)
  }

  // Function to handle option selection
  const handleOptionClick = option => {
    setSelectedOptions(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory]?.includes(option)
        ? prev[selectedCategory].filter(item => item !== option)
        : [...(prev[selectedCategory] || []), option]
    }))
  }

  const handleOptionToggle = option => {
    setSelectedOptions(prevSelectedOptions => {
      const currentCategoryOptions = prevSelectedOptions[activeCategory] || []

      if (currentCategoryOptions.includes(option.site_name)) {
        // Remove the option if it's already selected
        return {
          ...prevSelectedOptions,
          [activeCategory]: currentCategoryOptions.filter(item => item !== option.site_name)
        }
      } else {
        // Add the option if it's not selected
        return {
          ...prevSelectedOptions,
          [activeCategory]: [...currentCategoryOptions, option.site_name]
        }
      }
    })
  }

  return (
    // <Drawer
    //   anchor='right'
    //   open={open}
    //   ModalProps={{ keepMounted: true }}
    //   sx={{
    //     '& .MuiDrawer-paper': { width: ['100%', '600px'], height: '100vh', display: 'flex', flexDirection: 'column' }
    //   }}
    // >
    //   {/* Header */}
    //   <Box
    //     sx={{
    //       display: 'flex',
    //       alignItems: 'center',
    //       justifyContent: 'space-between',
    //       p: 2,
    //       borderBottom: '1px solid #E0E0E0'
    //     }}
    //   >
    //     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //       <Icon icon='mdi:filter' fontSize={24} />
    //       <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>Filter - 5</Typography>
    //     </Box>
    //     <IconButton size='small' onClick={() => setOpenFilterDrawer(false)}>
    //       <Icon icon='mdi:close' fontSize={24} />
    //     </IconButton>
    //   </Box>

    //   {/* Content */}
    //   <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    //     {/* Categories List */}
    //     <Box
    //       sx={{
    //         width: '200px',
    //         backgroundColor: '#E9F3EA',
    //         borderRight: '1px solid #E0E0E0'
    //       }}
    //     >
    //       <List>
    //         {categories.map(category => (
    //           <ListItem
    //             button
    //             key={category}
    //             onClick={() => setActiveCategory(category)}
    //             sx={{
    //               ml: 2,
    //               gap: 3,

    //               backgroundColor: activeCategory === category ? '#FFF' : 'transparent',
    //               '&:hover': { backgroundColor: '#E9F3EA' }
    //             }}
    //           >
    //             <ListItemText
    //               primary={category}
    //               primaryTypographyProps={{
    //                 fontSize: '14px',
    //                 fontWeight: activeCategory === category ? 500 : 400
    //               }}
    //             />
    //           </ListItem>
    //         ))}
    //       </List>
    //     </Box>

    //     {/* Options Panel */}
    //     <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
    //       {/* Search Bar */}
    //       <TextField
    //         placeholder='Search'
    //         size='small'
    //         variant='outlined'
    //         value={searchQuery}
    //         onChange={e => setSearchQuery(e.target.value)}
    //         sx={{ mb: 2 }}
    //       />

    //       {/* Select All */}
    //       <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    //         <Checkbox
    //           checked={selectedOptions.length === options[activeCategory].length}
    //           indeterminate={selectedOptions.length > 0 && selectedOptions.length < options[activeCategory].length}
    //           onChange={handleSelectAll}
    //         />
    //         <Typography>Select All</Typography>
    //       </Box>

    //       {/* Options List */}
    //       <Box sx={{ flex: 1, overflowY: 'auto' }}>
    //         {filteredOptions.map(option => (
    //           <Box
    //             key={option}
    //             sx={{
    //               display: 'flex',
    //               alignItems: 'center',
    //               mb: 1
    //             }}
    //           >
    //             <Checkbox checked={selectedOptions.includes(option)} onChange={() => handleToggleOption(option)} />
    //             <Typography>{option}</Typography>
    //           </Box>
    //         ))}
    //       </Box>
    //     </Box>
    //   </Box>

    //   {/* Footer */}
    //   <Box
    //     sx={{
    //       p: 2,
    //       borderTop: '1px solid #E0E0E0',
    //       display: 'flex',
    //       justifyContent: 'space-between'
    //     }}
    //   >
    //     <Button variant='outlined' color='primary' onClick={handleClearFilter} sx={{ width: '48%' }}>
    //       Clear All
    //     </Button>
    //     <Button variant='contained' color='primary' onClick={handleApplyFilter} sx={{ width: '48%' }}>
    //       Apply Filter
    //     </Button>
    //   </Box>
    // </Drawer>

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
            Filter - {selectedOptions[activeCategory].length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              setOpenFilterDrawer(false)
            }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      {/* Drawer Content */}
      <Box sx={{ width: '562px', height: '753px', display: 'flex', backgroundColor: 'background.default' }}>
        <Box sx={{ width: '180px', height: '900px', backgroundColor: 'background.default' }}>
          <Grid container>
            <Grid item md={4} sm={4} xs={4}>
              <Box
                sx={{
                  ml: 3,
                  bgcolor: 'white',
                  width: '300%', // Adjust this value based on your desired width, e.g., '300px' or '80%'
                  padding: 2, // Add padding for some internal spacing
                  borderRadius: 1 // Optional: Add rounded corners
                  // boxShadow: 2 // Optional: Add a shadow for a better appearance
                }}
              >
                {categories?.map((item, index) => (
                  <Typography
                    key={index} // Use index if items are simple strings; otherwise use unique keys
                    variant='body2'
                    onClick={() => handleCategoryClick(item)}
                    sx={{
                      mb: 4,
                      mt: 3,
                      ml: 10,
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      color: '#006D35'
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ width: '360px', height: '753px', backgroundColor: '#FFF', borderRadius: '4px' }}>
          <Box
            sx={{
              display: 'flex',
              width: '330px',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px',
              mt: 3,
              ml: 3
            }}
          >
            <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
            <TextField
              variant='outlined'
              placeholder='Search'
              value={''}
              onChange={''}
              InputProps={{
                disableUnderline: false
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
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, ml: 2 }}>
            <Checkbox
              checked={isAllSelected}
              onChange={e => handleSelectAll(e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>Select All</Typography>
          </Box>
          <Divider sx={{ m: 3 }} />
          <Box sx={{ ml: 2, height: '700px', overflowY: 'auto' }}>
            <Box sx={{ ml: 2, overflowX: 'hidden' }}>
              {filteredOptions.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Checkbox
                    checked={selectedOptions[activeCategory]?.includes(option.site_name) || false}
                    onChange={() => handleOptionToggle(option)}
                    inputProps={{ 'aria-label': option.site_name }}
                  />
                  <Typography sx={{ fontSize: '14px', color: '#004D25' }}>{option.site_name}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
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
        <LoadingButton fullWidth variant='outlined' size='large' onClick={''}>
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={''}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default FilterSheet
