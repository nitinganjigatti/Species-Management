import React from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import ShipmentCard from '../shipment-view/LinkedShipmentCard'

interface LinkedShipmentData {
  shipment_number?: string
  shipment_date?: string
  species_count?: number
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  [key: string]: unknown
}

interface LinkedShipmentsDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  linkedShipmentsData: LinkedShipmentData[]
}

const LinkedShipmentsDrawer = ({ open, onClose, title, linkedShipmentsData }: LinkedShipmentsDrawerProps) => {
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

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto', mt: 3 }}>
          <Box px={5}>
            {linkedShipmentsData?.length > 0 ? (
              linkedShipmentsData?.map((shipment, index) => <ShipmentCard shipment={shipment} key={index} />)
            ) : (
              <Typography
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  p: 12,
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: '500',
                  mt: 7
                }}
              >
                No Linked shipments to show
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(LinkedShipmentsDrawer)
