// FilterDrawer.js
import React, { useState } from 'react'
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemText, Button } from '@mui/material'
import { Icon } from '@iconify/react'

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
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 560 },
          backgroundColor: 'customColors.Background',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
        <Typography variant='h6' fontWeight='bold' ml={3}>
          Filter
        </Typography>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexGrow: 1 }}>
        <Box sx={{ flex: 24, display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: 'auto' } }}>
          <List sx={{ p: 0, ml: 5 }}>
            {filterLists.map(item => (
              <ListItem
                button
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
                      fontWeight: 400
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', sm: 360 },
            backgroundColor: '#FFFFFF',
            flexGrow: 1,
            pt: 3
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
          gap: 2
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
