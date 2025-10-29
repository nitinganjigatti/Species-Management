import { Box, Card, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'

const AddStaffsDrawer = ({ open, setOpen }) => {
  const theme = useTheme()

  const onClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
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
            backgroundColor: theme.palette.customColors.OnPrimary,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src='/icons/Activity.svg' alt='activity icons' />

              <Typography
                variant='h6'
                sx={{
                  fontWeight: 'bold'
                }}
              >
                Add Staffs
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ p: 4 }}>
          <Card sx={{ mt: 2, p: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Box></Box>
          </Card>
        </Box>
      </Drawer>
    </>
  )
}

export default AddStaffsDrawer
