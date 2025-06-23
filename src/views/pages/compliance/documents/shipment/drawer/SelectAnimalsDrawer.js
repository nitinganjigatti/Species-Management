import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton, Avatar, Checkbox, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'

const animalData = [
  { id: 1, gender: 'M', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' },
  { id: 2, gender: 'M', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' },
  { id: 3, gender: 'F', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' },
  { id: 4, gender: 'F', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' },
  { id: 4, gender: 'F', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' },
  { id: 4, gender: 'F', species: 'Vulpes vulpes (red fox)', microchipId: '132143124132143124' }
]

const SelectAnimalsDrawer = ({ open, onClose, title }) => {
  const theme = useTheme()

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

            <Typography
              sx={{
                color: '#44544A',
                fontWeight: '500',
                fontSize: '16px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 400 }}>Species : </span>Vulpes vulpes (red fox)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxWidth: '600px', // Adjust based on your layout
              margin: 'auto',
              px: 6,
              borderRadius: '8px'
            }}
          >
            <Typography sx={{ pt: 3, fontWeight: 500, fontSize: '18px', color: '#44544A' }}>Animals (4)</Typography>
            {animalData.map(animal => (
              <Box
                key={animal.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px'
                }}
              >
                {/* Gender Avatar */}
                <Avatar
                  sx={{
                    backgroundColor: animal.gender === 'M' ? '#AFEFEB80' : '#FA614026',
                    color: animal.gender === 'M' ? '#00AFD6' : '#FA6140',
                    fontWeight: '500',
                    marginRight: '16px',
                    fontSize: '14px',
                    width: 40,
                    height: 40,
                    borderRadius: '4px',
                    ml: 4
                  }}
                >
                  {animal.gender}
                </Avatar>

                {/* Animal Info */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                    Species :{' '}
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.species}</span>
                  </Typography>

                  <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                    Microchip ID :{' '}
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.microchipId}</span>
                  </Typography>
                </Box>

                {/* Checkbox */}
                <Box
                  sx={{
                    background: '#F2FFF8',
                    borderLeft: '1px solid #C3CEC7',
                    height: '68px',
                    width: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                >
                  <Checkbox />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        {/* Sticky footer */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            px: 5,
            py: 4,
            mt: 4,
            backgroundColor: theme.palette.common.white,
            boxShadow: `0px -4px 21px 0px ${
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
            }`,
            zIndex: 1
          }}
        >
          <Button
            fullWidth
            variant='contained'
            //onClick={handleDone}
            //disabled={newlySelectedItems.length === 0}
          >
            Select Animals
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SelectAnimalsDrawer)
