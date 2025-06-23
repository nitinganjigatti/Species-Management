import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton, Paper, Grid, Chip, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import ExportCard from '../view-component/AddExportPermitCard'
import AnimalCardLayout from '../view-component/AddAnimalCard'
import AnimalIdentifiers from '../view-component/AnimalsIdentifier'

const species = {
  name: 'Red fox',
  scientificName: 'Vulpes vulpes',
  cites: 'Appendix 1',
  count: 5,
  male: 3,
  female: 2,
  unknown: 2
}

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

const AnimalDetailsDrawer = ({ open, onClose, title }) => {
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
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
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

        <Box sx={{ px: '20px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: '#44544A',
              mb: 4
            }}
          >
            Species
          </Typography>

          <Paper
            elevation={1}
            sx={{
              borderRadius: '10px',
              padding: 4,
              border: '1px solid #C3CEC7',
              boxShadow: 'none'
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Species Name</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {species.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Scientific Name</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {species.scientificName}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>CITES</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {species.cites}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Animal count</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {species.count}
                </Typography>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Gender & Count</Typography>
                <Box display='flex' gap={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`M - ${species.male}`}
                    size='small'
                    sx={{
                      background: '#AFEFEB80',
                      borderRadius: '4px',
                      px: 3,
                      color: '#00AFD6',
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`F - ${species.female}`}
                    size='small'
                    sx={{
                      background: '#FA614026',
                      borderRadius: '4px',
                      px: 3,
                      color: '#FA6140',
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`U - ${species.unknown}`}
                    size='small'
                    sx={{
                      background: '#DDEBE9',
                      borderRadius: '4px',
                      px: 3,
                      color: '#1F515B',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Box sx={{ px: '20px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: '#44544A',
              mb: 4,
              mt: 4
            }}
          >
            Animals with identifier ( 1 )
          </Typography>
          <Box sx={{ backgroundColor: '#FFFFFF', p: 4, borderRadius: '8px', border: '1px solid #C3CEC7' }}>
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
                    Species :{' '}
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.species}</span>
                  </Typography>

                  <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                    Microchip ID :
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>
                      {' '}
                      11222{animal.microchip}
                    </span>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AnimalDetailsDrawer)
