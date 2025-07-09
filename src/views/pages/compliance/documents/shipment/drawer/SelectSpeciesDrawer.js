import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Box,
  Drawer,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Radio,
  Divider,
  Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import SelectSpeciesCard from '../view-component/SelectSpeciesCard'
import AddNewSpeciesCard from '../view-component/AddNewSpeciesCard'

const SelectSpeciesDrawer = ({ open, onClose, title }) => {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
  const handleTabChange = (event, newValue) => setTab(newValue)

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          //height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2, background: '#fff' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: '#fff' }}>
          <Box p={3}>
            {/* Tabs */}
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label='Antz Database' sx={{ fontWeight: 600, width: '50%' }} />
              <Tab label='New Species' sx={{ fontWeight: 600, width: '50%' }} />
            </Tabs>
          </Box>
        </Box>

        {/* Tab Content */}
        {tab === 0 && <SelectSpeciesCard />}

        {/* New Species Tab Placeholder */}
        {tab === 1 && (
          <Box mt={2}>
            <AddNewSpeciesCard />
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default React.memo(SelectSpeciesDrawer)
