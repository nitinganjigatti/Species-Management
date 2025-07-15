import React from 'react'
import { Box, Typography, Drawer, IconButton, Grid, useMediaQuery, Chip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const ShippedAnimalsDrawer = ({ open, onClose, shipment, specieIndex }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!shipment) return null

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: isMobile ? '100vw' : 570,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: isMobile ? 3 : 4, pt: isMobile ? 2 : 3, pb: isMobile ? 1.5 : 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography sx={{ fontSize: isMobile ? '1.125rem' : '1.5rem', fontWeight: 500 }}>
              Shipped Animals
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: isMobile ? 3 : 4, flex: 1, overflowY: 'auto', pb: isMobile ? 3 : 4 }}>
          {/* Shipment Info */}
          <Typography
            sx={{
              mb: 3,
              fontWeight: 500,
              fontSize: isMobile ? '1rem' : '1.25rem',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Shipment
          </Typography>
          <Box
            sx={{
              p: isMobile ? 2 : 4,
              mb: 3,
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>Shipment ID:</Typography>
                <Typography sx={{ color: theme.palette.primary.OnSurface, fontWeight: 500, fontSize: '1rem' }}>
                  {shipment?.shipment_id}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>
                  Date of Issue:
                </Typography>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                  {Utility.formatDisplayDate(shipment?.shipment_date)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Species Info */}
          <Typography
            sx={{
              mb: 3,
              fontWeight: 500,
              fontSize: isMobile ? '1rem' : '1.25rem',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Species
          </Typography>
          <Box
            sx={{
              mb: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              px: isMobile ? 2 : 4,
              py: isMobile ? 1.5 : 4,
              backgroundColor: theme.palette.common.white
            }}
          >
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>Species Name</Typography>
                <Typography sx={{ fontWeight: 500 }}>{shipment?.species?.[specieIndex]?.common_name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>
                  Scientific Name
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {shipment?.species?.[specieIndex]?.scientific_name || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>CITES</Typography>
                <Typography sx={{ fontWeight: 500 }}>{shipment?.species?.[specieIndex]?.appendix || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>
                  Total Animals
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>{shipment?.species?.[specieIndex]?.total_count}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Gender & Count
              </Typography>
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
                {shipment?.species?.[specieIndex]?.male_count ? (
                  <Chip
                    label={`M - ${shipment?.species?.[specieIndex]?.male_count || 0}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                      color: theme.palette.customColors.addPrimary,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}

                {shipment?.species?.[specieIndex]?.female_count ? (
                  <Chip
                    label={`F - ${shipment?.species?.[specieIndex]?.female_count || 0}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                      color: theme.palette.customColors.customDropdownColor,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}

                {shipment?.species?.[specieIndex]?.undeterminate_count ? (
                  <Chip
                    label={`UD - ${shipment?.species?.[specieIndex]?.undeterminate_count || 0}`}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgSecondary,
                      color: theme.palette.customColors.OnPrimaryContainer,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}
              </Box>
            </Box>
          </Box>

          {/* Animals with Identifier */}
          {shipment?.species?.[specieIndex]?.animals.length ? (
            <Typography
              sx={{
                mb: 3,
                fontWeight: 500,
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Animals with identifier{' '}
              {`${
                shipment?.species?.[specieIndex]?.animals.length
                  ? `(${shipment?.species?.[specieIndex]?.animals.length})`
                  : ''
              }`}
            </Typography>
          ) : null}

          {shipment?.species?.[specieIndex]?.animals?.length ? (
            <Box
              sx={{
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                px: isMobile ? 2 : 4,
                py: isMobile ? 1.5 : 4,
                backgroundColor: theme.palette.common.white,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {shipment?.species?.[specieIndex]?.animals?.map((animal, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    p: isMobile ? 2 : 3
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor:
                        animal.gender === 'male'
                          ? `${theme.palette.customColors.SecondaryContainer}80`
                          : animal.gender === 'female'
                          ? `${theme.palette.customColors.customDropdownColor}4D`
                          : theme.palette.customColors.displaybgSecondary,
                      color:
                        animal.gender === 'male'
                          ? theme.palette.customColors.addPrimary
                          : animal.gender === 'female'
                          ? theme.palette.customColors.customDropdownColor
                          : theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    {animal?.gender?.[0]?.toUpperCase() || '-'}
                  </Box>
                  <Box>
                    <Box sx={{ fontSize: '0.875rem' }}>
                      Species:{' '}
                      <Typography
                        component='span'
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {shipment?.species?.[specieIndex]?.common_name || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ fontSize: '0.875rem' }}>
                      {Utility.formatIdentifierType(animal.identifier_type)}:{' '}
                      <Typography
                        component='span'
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {animal?.identifier_value || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Drawer>
  )
}

export default ShippedAnimalsDrawer
