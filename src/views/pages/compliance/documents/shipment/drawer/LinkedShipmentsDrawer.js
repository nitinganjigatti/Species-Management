import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import ShipmentCard from '../view-component/LinkedShipmentCard'

const LinkedShipmentsDrawer = ({ open, onClose, title, linkedShipmentsData }) => {
  const theme = useTheme()

  return (
    <Drawer
      open={open}
      // onClose={onClose}
      anchor='right'
    >
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
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>
                {title + ' - ' + linkedShipmentsData?.length}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <Box px={5}>
            {linkedShipmentsData?.map((shipment, index) => (
              <ShipmentCard shipment={shipment} key={index} />
            ))}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(LinkedShipmentsDrawer)
