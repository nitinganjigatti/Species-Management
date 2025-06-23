import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import ExportCard from '../view-component/AddExportPermitCard'
import AnimalCardLayout from '../view-component/AddAnimalCard'

const AddAnimalsDrawer = ({ open, onClose, title }) => {
  const theme = useTheme()

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
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

        <Box sx={{ backgroundColor: '#fff', px: 5, pb: 6, pt: 2 }}>
          <Box
            sx={{
              backgroundColor: '#1F515B0D',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '16px',
              width: '100%'
            }}
          >
            {/* Export ID */}
            <Typography
              sx={{
                fontWeight: '500',
                color: '#1F415B',
                marginBottom: '3px',
                fontSize: '16px'
              }}
            >
              Export ID : 8787979
              {/* {data.exportId} */}
            </Typography>

            {/* Animals Available */}
            <Typography
              sx={{
                color: '#44544A', // Golden-yellow color for emphasis
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {/* {data.animalsAvailable} */}
              <span style={{ fontSize: '18px' }}>12/15 </span>Animals available for shipment
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <AnimalCardLayout />
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddAnimalsDrawer)
