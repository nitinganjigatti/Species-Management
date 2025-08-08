import React, { useState } from 'react'
import { Typography, Box, Drawer, IconButton, Paper, Chip, Avatar, Button, Divider, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import AnimalIdentifiers from '../shipment-view/AnimalsIdentifier'

const SpeciesDetails = ({ selectedExportData }) => {
  const theme = useTheme()
  // Flatten all species from all exports
  const allSpecies = selectedExportData?.export?.flatMap(exportItem => exportItem.species || []) || []
  return (
    <Box>
      <Typography
        fontWeight={500}
        sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', mb: 3, mt: 4 }}
      >
        Species ({allSpecies?.length})
      </Typography>

      {allSpecies?.map((species, index) => (
        <Paper
          key={index}
          sx={{
            mb: 2,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            boxShadow: 'none'
          }}
        >
          <Box display='flex' gap={2} alignItems='center' sx={{ px: 3, py: 3 }}>
            <Avatar alt={species?.common_name} src={species?.default_icon} />
            <Box>
              <Typography
                fontWeight={600}
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
              >
                {species?.common_name}
              </Typography>
              <Typography fontStyle='italic' color={theme.palette.customColors.OnSurfaceVariant} fontSize={14}>
                {species?.scientific_name}
              </Typography>
            </Box>
          </Box>

          <Divider />
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            sx={{ px: 4, pb: 3, pt: 2, background: '#E8F4F233' }}
          >
            <Box textAlign='center'>
              <Typography fontSize={16} fontWeight={600} color={theme.palette.customColors.OnSecondaryContainer}>
                {(Number(species?.male_count) || 0) +
                  (Number(species?.female_count) || 0) +
                  (Number(species?.undeterminate_count) || 0)}
                <span
                  style={{
                    fontWeight: '400',
                    fontSize: '15px',
                    marginLeft: '6px',
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {(Number(species?.male_count) || 0) +
                    (Number(species?.female_count) || 0) +
                    (Number(species?.undeterminate_count) || 0) ===
                  1
                    ? 'Animal'
                    : 'Animals'}
                </span>
              </Typography>
            </Box>

            <Box display='flex' gap={1}>
              <Chip
                label={`M - ${species?.male_count || 0}`}
                size='small'
                sx={{
                  background: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                  borderRadius: '4px',
                  px: 2,
                  color: theme.palette.customColors.addPrimary,
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
              <Chip
                label={`F - ${species?.female_count || 0}`}
                size='small'
                sx={{
                  background: alpha(theme.palette.customColors.customDropdownColor, 0.15),
                  borderRadius: '4px',
                  px: 2,
                  color: theme.palette.formContent.tertiary,
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
              <Chip
                label={`U - ${species?.undeterminate_count || 0}`}
                size='small'
                sx={{
                  background: theme.palette.customColors.displaybgSecondary,
                  borderRadius: '4px',
                  px: 2,
                  color: theme.palette.customColors.OnPrimaryContainer,
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
}

const ShippedAnimalsDrawer = ({ open, onClose, title, identifiers, selectedExportData }) => {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
  return (
    <Drawer open={open} anchor='right'>
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
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 5, pb: 6, pt: 2 }}>
          <Box display='flex' gap={2}>
            <Button
              variant={tab === 0 ? 'contained' : 'text'}
              onClick={() => setTab(0)}
              sx={{
                fontSize: '16px',
                borderRadius: '8px',
                mr: 3,
                backgroundColor:
                  tab === 0 ? theme.palette.customColors.OnPrimaryContainer : theme.palette.customColors.mdAntzNeutral,
                color: tab === 0 ? theme.palette.common.white : theme.palette.customColors.OnPrimaryContainer,
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  backgroundColor: tab === 0 ? theme.palette.customColors.OnPrimaryContainer : '#f0f0f0'
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
                backgroundColor:
                  tab === 1 ? theme.palette.customColors.OnPrimaryContainer : theme.palette.customColors.mdAntzNeutral,
                color: tab === 1 ? theme.palette.common.white : theme.palette.customColors.OnPrimaryContainer,
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  backgroundColor: tab === 1 ? theme.palette.customColors.OnPrimaryContainer : '#f0f0f0'
                }
              }}
            >
              Animals with Identifier
            </Button>
          </Box>

          <Box mt={3}>
            {tab === 0 && <SpeciesDetails selectedExportData={selectedExportData} />}
            {tab === 1 && <AnimalIdentifiers selectedExportData={selectedExportData} />}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(ShippedAnimalsDrawer)
