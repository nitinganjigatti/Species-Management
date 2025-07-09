import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Box,
  Drawer,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import AnimalIdentifiers from '../view-component/AnimalsIdentifier'

const speciesList = [
  {
    name: 'Rainbow Lorikeet',
    scientificName: 'Trichoglossus moluccanus',
    count: 25,
    male: 3,
    female: 2,
    unknown: 0,
    image: '/lorikeet.png'
  },
  {
    name: 'Rainbow Lorikeet',
    scientificName: 'Trichoglossus moluccanus',
    count: 25,
    male: 3,
    female: 2,
    unknown: 0,
    image: '/lorikeet.png'
  }
  // Repeat this or map over real data
]

const SpeciesDetails = () => (
  <Box>
    <Typography fontWeight={500} sx={{ color: '#44544A', fontSize: '16px', mb: 3, mt: 4 }}>
      Species ({speciesList.length})
    </Typography>

    {speciesList.map((species, index) => (
      <Paper
        key={index}
        sx={{
          mb: 2,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #C3CEC7',
          boxShadow: 'none'
        }}
      >
        {/* Top Section: Avatar and Name */}
        <Box display='flex' gap={2} alignItems='center' sx={{ px: 3, py: 3 }}>
          <Avatar alt={species.name} src={species.image} />
          <Box>
            <Typography fontWeight={600} sx={{ color: '#44544A', fontSize: '16px' }}>
              {species.name}
            </Typography>
            <Typography fontStyle='italic' color='#44544A' fontSize={14}>
              {species.scientificName}
            </Typography>
          </Box>
        </Box>

        {/* Bottom Section: Count and Chips */}
        <Divider />
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ px: 4, pb: 3, pt: 2, background: '#E8F4F233' }}
        >
          <Box textAlign='center'>
            <Typography fontSize={16} fontWeight={600} color={'#1F415B'}>
              {species.count}
              <span style={{ fontWeight: '400', fontSize: '15px', marginLeft: '6px', color: '#1F415B' }}>
                Animals
              </span>{' '}
            </Typography>
          </Box>

          <Box display='flex' gap={1}>
            <Chip
              label={`M - ${species.male}`}
              size='small'
              sx={{
                background: '#AFEFEB80',
                borderRadius: '4px',
                px: 2,
                color: '#00AFD6',
                fontSize: '14px',
                fontWeight: 500
              }}
            />
            <Chip
              label={`F - ${species.female}`}
              size='small'
              sx={{
                background: '#FA614026',
                borderRadius: '4px',
                px: 2,
                color: '#FA6140',
                fontSize: '14px',
                fontWeight: 500
              }}
            />
            <Chip
              label={`U - ${species.unknown}`}
              size='small'
              sx={{
                background: '#DDEBE9',
                borderRadius: '4px',
                px: 2,
                color: '#1F515B',
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          </Box>
        </Box>
      </Paper>
    ))}
  </Box>
)

const ShippedAnimalsDrawer = ({ open, onClose, title, identifiers }) => {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
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

        <Box sx={{ px: 5, pb: 6, pt: 2 }}>
          {/* Button Tabs */}
          <Box display='flex' gap={2}>
            <Button
              variant={tab === 0 ? 'contained' : 'text'}
              onClick={() => setTab(0)}
              sx={{
                fontSize: '16px',
                borderRadius: '8px',
                mr: 3,
                backgroundColor: tab === 0 ? '#1E5650' : '#0000000D',
                color: tab === 0 ? '#fff' : '#1F515B',
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  backgroundColor: tab === 0 ? '#1E5650' : '#f0f0f0'
                }
              }}
            >
              Species Details
            </Button>
            <Button
              variant={tab === 1 ? 'contained' : 'text'}
              onClick={() => setTab(1)}
              sx={{
                fontSize: '16px',
                borderRadius: '8px',
                backgroundColor: tab === 1 ? '#1E5650' : '#0000000D',
                color: tab === 1 ? '#fff' : '#1F515B',
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  backgroundColor: tab === 1 ? '#1E5650' : '#f0f0f0'
                }
              }}
            >
              Animals with Identifier (4)
            </Button>
          </Box>

          {/* Content */}
          <Box mt={3}>
            {tab === 0 && <SpeciesDetails />}
            {tab === 1 && <AnimalIdentifiers />}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(ShippedAnimalsDrawer)
