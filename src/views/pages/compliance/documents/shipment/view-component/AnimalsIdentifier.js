import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Grid, useMediaQuery, useTheme, Avatar } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SelectAnimalsDrawer from '../drawer/SelectAnimalsDrawer'

const identifiers = [
  {
    gender: 'M',
    species: 'Rainbow Lorikeet',
    microchip: '132143124132143124'
  },
  {
    gender: 'F',
    species: 'Rainbow Lorikeet',
    microchip: '132143124132143124'
  },
  {
    gender: 'U',
    species: 'Rainbow Lorikeet',
    microchip: '132143124132143124'
  }
]

const AnimalIdentifiers = () => {
  // Sample data for multiple cards

  return (
    <>
      <Box>
        <Typography fontWeight={500} sx={{ color: '#44544A', fontSize: '18px', mb: 3, mt: 4 }}>
          Species: Rainbow Lorikeet
        </Typography>
        {identifiers.map((animal, index) => (
          <Box
            key={animal.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #C3CEC7',
              borderRadius: '8px',
              mb: 3
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
                borderRadius: '4px'
                //ml: 4
              }}
            >
              {animal.gender}
            </Avatar>

            {/* Animal Info */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px', mb: 0.5 }}>
                Species : <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.species}</span>
              </Typography>

              <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                Microchip ID :
                <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.microchip}</span>
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  )
}

export default AnimalIdentifiers
