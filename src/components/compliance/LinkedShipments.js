import React, { useState } from 'react'
import { Box, Typography, Divider, useTheme, Grid, Chip, alpha } from '@mui/material'
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import ShippedAnimalsDrawer from 'src/components/compliance/drawer/ShippedAnimalsDrawer'
import Utility from 'src/utility'

const LinkedShipments = ({ shipments = [], totalShipped, totalAllowed, selectedExportData }) => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [selectedSpecieIndex, setSelectedSpecieIndex] = useState(null)

  const handleOpenDrawer = (shipment, specieIndex) => {
    setSelectedShipment(shipment)
    setSelectedSpecieIndex(specieIndex)
    setOpenDrawer(true)
  }

  const handleCloseDrawer = () => {
    setOpenDrawer(false)
    setSelectedShipment(null)
  }

  if (!shipments?.length) {
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
          borderRadius: '8px'
        }}
      >
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}>
          No Linked Shipments
        </Typography>
      </Box>
    )
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1, fontSize: '0.875rem' }}>
                Shipment ID
              </Typography>
              <Typography sx={{ color: theme.palette.primary.OnSurface, fontWeight: 500, fontSize: '1.25rem' }}>
                {shipment?.shipment_number || (shipment?.shipment_number).replace(/\s+/g, '') || ''}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1, fontSize: '0.875rem' }}>
                Shipment Date
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                {Utility.formatDisplayDate(shipment?.shipment_date) || ''}
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
              Shipped Animals: {totalShipped} / {totalAllowed}
            </Typography>
            {shipment?.file_original_name && shipment?.file_path && (
              <a
                href={shipment.file_path}
                target='_blank'
                rel='noopener noreferrer'
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img src='/icons/pdf_icon2.svg' width='18px' style={{ marginRight: '8px' }} />
                  <Typography sx={{ fontWeight: 500, fontSize: '1rem' }}>{shipment.file_original_name}</Typography>
                </Box>
              </a>
            )}
          </Box>
          {/* Animals List */}
          {shipment.species.map((specie, specieIndex) => (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Box
                key={specieIndex}
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
                onClick={() => handleOpenDrawer(shipment, specieIndex)}
              >
                <Box sx={{ flex: 1.8 }}>
                  <Typography sx={{ fontWeight: 500 }}>{specie?.common_name || 'N/A'}</Typography>
                  <Typography sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                    {specie?.scientific_name || '-'}
                  </Typography>
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
                  <span>Count: {specie?.total_count || 0}</span>
                  {specie?.male_count ? (
                    <Chip
                      label={`M - ${specie?.male_count}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                        color: theme.palette.customColors.addPrimary,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {specie?.female_count ? (
                    <Chip
                      label={`F - ${specie?.female_count}`}
                      size='small'
                      sx={{
                        bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                        color: theme.palette.customColors.customDropdownColor,
                        borderRadius: 0.5
                      }}
                    />
                  ) : null}

                  {specie?.undeterminate_count ? (
                    <Chip
                      label={`UD - ${specie?.undeterminate_count}`}
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

      <ShippedAnimalsDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        specieIndex={selectedSpecieIndex}
        shipment={selectedShipment}
        selectedExportData={selectedExportData}
      />
    </Box>
  )
}

export default LinkedShipments
