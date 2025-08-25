import { Box, Drawer, IconButton, Typography } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'

const DoctorsDrawer = ({ open, setOpen, doctors }) => {
  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: '100%',
                sm: '80%',
                md: 560
              },
              backgroundColor: 'customColors.Background',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            p: 4,
            position: 'sticky',
            top: 0,
            backgroundColor: 'customColors.Background',
            zIndex: 1,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography
              variant='h6'
              sx={{
                fontWeight: 'bold'
              }}
            >
              Select Attending Doctor
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default DoctorsDrawer
