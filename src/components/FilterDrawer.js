// FilterDrawer.js
import React, { useState } from 'react'
import { Drawer, Box, Typography, IconButton, List, ListItemText, Button } from '@mui/material'
import { Icon } from '@iconify/react'

import ListItemButton from '@mui/material/ListItemButton'

const FilterDrawer = ({
  open,
  onClose,
  selectedItem,
  onSelectItem,
  filterLists,
  children,
  handleApplyFilter,
  handleClearFilter
}) => {
  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: 'customColors.Background',
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Header Section (Fixed Height) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          flexShrink: 0
        }}
      >
        <Typography
          variant='h6'
          sx={{
            fontWeight: 'bold',
            ml: 3
          }}
        >
          Filter
        </Typography>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>
      {/* Content Section (Scrollable) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'row' },
          flex: 1,
          overflow: 'hidden' ,// Prevent overflow,
          width: 'auto'
        }}
      >
        {/* Filter List Section */}
        <Box
          sx={{
            flex: { sm: 24 }, // Adjust flex for smaller screens
            display: 'flex',
            flexDirection: {xs: 'row', sm: 'column'},
            width: { xs: '55%', sm: 'auto' },
            overflowY: 'auto'
          }}
        >
          <List sx={{ p: 0, ml: {sm: 5} }}>
            {filterLists.map(item => (
              <ListItemButton
                key={item}
                onClick={() => onSelectItem(item)}
                sx={{
                  color: 'primary.light',
                  fontSize: '16px',
                  fontWeight: 400,
                  backgroundColor: selectedItem === item ? '#FFFFFF' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#f0f0f0'
                  }
                }}
              >
                <ListItemText
                  primary={item}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: 'customColors.OnPrimaryContainer',
                      fontSize: '16px',
                      width: '100%',
                      fontWeight: 400
                    }
                  }}
                />
              </ListItemButton>
            ))}
            
          </List>
          
        </Box>

        {/* Main Content Section */}

        <Box
          sx={{
            width: { xs: '100%', sm: 360 },
            backgroundColor: '#FFFFFF',
            overflowY: 'auto'
          }}
        >
          {children}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          p: 4,
          boxShadow: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          flexShrink: 0
        }}
      >
        <Button size='large' variant='outlined' sx={{ width: '100%' }} onClick={handleClearFilter}>
          Clear All
        </Button>
        <Button size='large' variant='contained' sx={{ width: '100%' }} onClick={handleApplyFilter}>
          Apply Filter
        </Button>
      </Box>
    </Drawer>
  )
}

export default FilterDrawer
