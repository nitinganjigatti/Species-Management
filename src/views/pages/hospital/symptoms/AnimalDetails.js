import React from 'react'
import { Box, Avatar, Typography, Grid } from '@mui/material'

export default function AnimalDetails({ image, name, scientificName, ageGender, aid, admittedDays, location, vet }) {
  return (
    <Box
      sx={{
        p: 6,
        borderRadius: '8px',
        bgcolor: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 200 }}>
        <Avatar src={image} variant='square' sx={{ width: 58, height: 58, borderRadius: '8px' }} />
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#44544A' }}>{name}</Typography>
          <Typography sx={{ fontStyle: 'italic', color: '#44544A', fontSize: '14px', fontWeight: 400 }}>
            {scientificName}
          </Typography>
          <Typography sx={{ color: '#44544A', fontSize: '14px', fontWeight: 400 }}>{ageGender}</Typography>
        </Box>
      </Box>

      <Grid container spacing={24} sx={{ flex: 1 }}>
        <Grid>
          <Typography variant='caption' sx={{ color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>
            AID
          </Typography>
          <Typography sx={{ fontWeight: 500, color: '#44544A', fontSize: '16px' }}>{aid}</Typography>
        </Grid>
        <Grid>
          <Typography variant='caption' sx={{ color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>
            Admitted days
          </Typography>
          <Typography sx={{ fontWeight: 500, color: '#44544A', fontSize: '16px' }}>{admittedDays}</Typography>
        </Grid>
        <Grid>
          <Typography variant='caption' sx={{ color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>
            Location
          </Typography>
          <Typography sx={{ fontWeight: 500, color: '#44544A', fontSize: '16px' }}>{location}</Typography>
        </Grid>
        <Grid>
          <Typography variant='caption' sx={{ color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>
            Consulting Veterinarian
          </Typography>
          <Typography sx={{ fontWeight: 500, color: '#44544A', fontSize: '16px' }}>{vet}</Typography>
        </Grid>
      </Grid>
    </Box>
  )
}
