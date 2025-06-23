import React, { useState } from 'react'
import { Box, Typography, Divider, useTheme, Grid, Chip, alpha } from '@mui/material'
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import AnimalDetailDrawer from '../drawer/AnimalDetailDrawer'

const SpeciesDetail = ({ species = [], totalShipped, totalAllowed }) => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedSpecie, setSelectedSpecie] = useState(null)

  const handleOpenDrawer = shipment => {
    setSelectedSpecie(shipment)
    setOpenDrawer(true)
  }

  const handleCloseDrawer = () => {
    setOpenDrawer(false)
    setSelectedSpecie(null)
  }

  if (!species?.length) {
    return (
      <Box
        sx={{
          height: '150px',
          width: '100%',
          mx: 'auto',
          backgroundColor: alpha(theme.palette.common.black, 0.05),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          mt: 4
        }}
      >
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}>
          No Species Found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', mt: 6 }}>
        <Box
          sx={{
            mb: 4,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* Shipment Header */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 6,
              py: 4,
              margin: 0,
              backgroundColor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
              {species?.length} Species
            </Typography>
            <Typography
              component='span'
              sx={{
                width: 6,
                height: 6,
                backgroundColor: theme.palette.customColors.OnSurfaceVariant,
                borderRadius: '50%'
              }}
            />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
              {100} Animal
            </Typography>
          </Box>

          <Divider sx={{ borderColor: theme.palette.divider }} />

          {/* Animals List */}
          {species.map((specie, animalIndex) => (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Box
                key={animalIndex}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 6,
                  py: 4,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                onClick={() => handleOpenDrawer(specie)}
              >
                <Box sx={{ flex: 1.8 }}>
                  <Typography sx={{ fontWeight: 500 }}>{specie.common_name}</Typography>
                  <Typography sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>{specie.scientific_name}</Typography>
                  <Typography sx={{ fontSize: '0.875rem' }}>{specie.appendix}</Typography>
                </Box>
                <Box
                  sx={{
                    flex: 2,
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start'
                  }}
                >
                  <span>Count: {specie.total_count}</span>
                  {specie.male_count ? (
                    <Chip
                      label={`M - ${specie.male_count}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                        color: theme.palette.customColors.addPrimary,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {specie.female_count ? (
                    <Chip
                      label={`F - ${specie.female_count}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                        color: theme.palette.customColors.customDropdownColor,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {specie.undeterminate_count ? (
                    <Chip
                      label={`UD - ${specie.undeterminate_count}`}
                      size='small'
                      sx={{
                        bgcolor: theme.palette.customColors.displaybgSecondary,
                        color: theme.palette.customColors.OnPrimaryContainer,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}
                </Box>
                <Box sx={{ flex: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <ChevronRightIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
                </Box>
              </Box>
            </>
          ))}
        </Box>

      <AnimalDetailDrawer open={openDrawer} onClose={handleCloseDrawer} specie={selectedSpecie} />
    </Box>
  )
}

export default SpeciesDetail
