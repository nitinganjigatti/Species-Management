import React, { useState } from 'react'
import { Box, Typography, Divider, useTheme, Grid, Chip } from '@mui/material'
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import ShippedAnimalsDrawer from '../drawer/ShippedAnimalsDrawer'

const LinkedShipments = ({ shipments = [], totalShipped, totalAllowed }) => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)

  const handleOpenDrawer = shipment => {
    setSelectedShipment(shipment)
    setOpenDrawer(true)
  }

  const handleCloseDrawer = () => {
    setOpenDrawer(false)
    setSelectedShipment(null)
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto' }}>
      <Typography
        sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1.25rem', mb: 6 }}
      >
        Total Shipped: {totalShipped}/{totalAllowed} Animals
      </Typography>

      {shipments.map((shipment, index) => (
        <Box
          key={index}
          sx={{
            mb: 4,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* Shipment Header */}
          <Grid
            container
            spacing={2}
            sx={{
              alignItems: 'flex-start',
              px: 5,
              py: 3,
              margin: 0,
              backgroundColor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1, fontSize: '0.875rem' }}>
                Shipment ID
              </Typography>
              <Typography sx={{ color: theme.palette.primary.OnSurface, fontWeight: 500, fontSize: '1.25rem' }}>{shipment.shipmentId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1, fontSize: '0.875rem' }}>
                Shipment Date
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                {shipment.shipmentDate}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: theme.palette.divider }} />

          {/* Animals Summary */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 6,
              py: 4,
              backgroundColor: theme.palette.customColors.Background
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.Antz_Minor_Medium }}>
              Shipped Animals: {shipment.shippedAnimals} / {shipment.totalAllowed}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src='/icons/pdf_icon2.svg' width='18px' style={{ marginRight: '8px' }} />
              <Typography sx={{ fontWeight: 500, fontSize: '1rem' }}>{shipment.fileName}</Typography>
            </Box>
          </Box>
          {/* Animals List */}
          {shipment.species.map((animal, animalIndex) => (
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
                onClick={() => handleOpenDrawer(shipment)}
              >
                <Box sx={{ flex: 1.8 }}>
                  <Typography sx={{ fontWeight: 500 }}>{animal.commonName}</Typography>
                  <Typography sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>{animal.scientificName}</Typography>
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
                  <span>Count: {animal.totalCount}</span>
                  {animal.maleCount ? (
                    <Chip
                      label={`M - ${animal.maleCount}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                        color: theme.palette.customColors.addPrimary,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {animal.femaleCount ? (
                    <Chip
                      label={`F - ${animal.femaleCount}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                        color: theme.palette.customColors.customDropdownColor,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {animal.unknownCount ? (
                    <Chip
                      label={`UD - ${animal.unknownCount}`}
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
      ))}

      <ShippedAnimalsDrawer open={openDrawer} onClose={handleCloseDrawer} shipment={selectedShipment} />
    </Box>
  )
}

export default LinkedShipments
