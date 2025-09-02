import { alpha, Box, Chip, Drawer, Grid, IconButton, Skeleton, styled, Typography, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { getSpeciesShipmentDetails } from 'src/lib/api/compliance/species'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const getGenderChipProps = (gender, theme) => {
  switch (gender) {
    case 'male':
      return {
        label: 'M',
        bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
        color: theme.palette.customColors.addPrimary
      }
    case 'female':
      return {
        label: 'F',
        bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
        color: theme.palette.customColors.customDropdownColor
      }
    case 'undeterminate':
    default:
      return {
        label: 'U',
        bgcolor: theme.palette.customColors.displaybgSecondary,
        color: theme.palette.customColors.OnPrimaryContainer
      }
  }
}

const SpeciesShipmentDetailsDrawer = ({ open, onClose, speciesId, shipmentId }) => {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    const getSpeciesDetails = async () => {
      setLoading(true)
      try {
        await getSpeciesShipmentDetails({ speciesId, shipmentId }).then(res => {
          if (res?.success === true) {
            setData(res?.data)
            setLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot fetch shipment details', error)
        setLoading(false)
      }
    }

    getSpeciesDetails()
  }, [shipmentId, speciesId])

  const genderCount = () => {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {data?.male_count && (
            <Chip
              label={`M - ${data?.male_count}`}
              size='small'
              sx={{
                bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                color: theme.palette.customColors.addPrimary,
                borderRadius: 0.5
              }}
            />
          )}

          {data?.female_count && (
            <Chip
              label={`F - ${data?.female_count}`}
              size='small'
              sx={{
                bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                color: theme.palette.customColors.customDropdownColor,
                borderRadius: 0.5
              }}
            />
          )}

          {data?.undeterminate_count && (
            <Chip
              label={`U - ${data?.undeterminate_count}`}
              size='small'
              sx={{
                bgcolor: theme.palette.customColors.displaybgSecondary,
                color: theme.palette.customColors.OnPrimaryContainer,
                borderRadius: 0.5
              }}
            />
          )}
        </Box>
      </>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: 'background.default'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Shipment Details</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: 'background.default',
            height: '100%',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box
            sx={{
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: 1,
              background: theme.palette.customColors.OnPrimary,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {loading ? (
              <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant='circular' width={48} height={48} />
                  <Box>
                    <Skeleton variant='text' width={120} height={24} />
                    <Skeleton variant='text' width={200} height={20} />
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 4,
                  background: alpha(theme.palette.customColors.SecondaryContainer, 0.2),
                  borderBottom: `1px solid ${theme.palette.customColors.mdAntzNeutral}`
                }}
              >
                <SpeciesCard
                  species={{
                    common_name: data?.common_name,
                    scientific_name: data?.scientific_name,
                    default_icon: data?.default_icon || '/images/branding/antz/Antz_logomark_h_color.svg'
                  }}
                />
              </Box>
            )}
            <Box sx={{ px: 4, py: 5 }}>
              {loading ? (
                <Grid container spacing={2} rowSpacing={4}>
                  {[...Array(6)].map((_, idx) => (
                    <StyledGrid item xs={12} sm={6} key={idx}>
                      <Skeleton variant='text' width={100} height={20} />
                      <Skeleton variant='text' width={160} height={28} />
                    </StyledGrid>
                  ))}
                </Grid>
              ) : (
                <Grid container spacing={2} rowSpacing={4}>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Shipment ID</StyledTypography>
                    <StyledTypography fontWeight={500} color={theme.palette.primary.OnSurface}>
                      {data?.shipment_number}
                    </StyledTypography>
                  </StyledGrid>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Date of Issue</StyledTypography>
                    <StyledTypography fontWeight={500} color={theme.palette.customColors.OnSurfaceVariant}>
                      {Utility.formatDisplayDate(data?.issued_date)}
                    </StyledTypography>
                  </StyledGrid>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Animal Count</StyledTypography>
                    <StyledTypography fontWeight={500} color={theme.palette.customColors.OnSurfaceVariant}>
                      {data?.total_animals}
                    </StyledTypography>
                  </StyledGrid>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Gender & Count</StyledTypography>
                    {genderCount()}
                  </StyledGrid>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Imports</StyledTypography>
                    <StyledTypography fontWeight={500} color={theme.palette.customColors.OnSurfaceVariant}>
                      {data?.total_imports}
                    </StyledTypography>
                  </StyledGrid>
                  <StyledGrid item size={{ xs: 12, sm: 6 }}>
                    <StyledTypography>Exports</StyledTypography>
                    <StyledTypography fontWeight={500} color={theme.palette.customColors.OnSurfaceVariant}>
                      {data?.total_exports}
                    </StyledTypography>
                  </StyledGrid>
                </Grid>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 4, mb: 5 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              Animals with identifier {data?.animals?.length > 0 ? `(${data?.animals?.length})` : ''}
            </Typography>
            <Box
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: 1,
                background: theme.palette.customColors.OnPrimary,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                p: 4
              }}
            >
              {loading ? (
                [...Array(3)].map((_, idx) => (
                  <IdentifierCard key={idx}>
                    <Skeleton variant='circular' width={40} height={40} sx={{ mr: 2 }} />
                    <Skeleton variant='text' width={200} height={24} />
                  </IdentifierCard>
                ))
              ) : data?.animals?.length > 0 ? (
                data?.animals.map((animal, idx) => {
                  const chipProps = getGenderChipProps(animal?.gender, theme)

                  return (
                    <IdentifierCard key={animal?.shipment_animal_id}>
                      <Chip
                        label={chipProps.label}
                        size='small'
                        sx={{
                          bgcolor: chipProps.bgcolor,
                          color: chipProps.color,
                          fontWeight: 500,
                          fontSize: 16,
                          width: 40,
                          height: 40,
                          borderRadius: 0.5,
                          mr: 2
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 400 }}
                        >
                          {animal?.identifier_type} ID:{' '}
                          <span
                            style={{
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '14px'
                            }}
                          >
                            {animal?.identifier_value}
                          </span>
                        </Typography>
                      </Box>
                    </IdentifierCard>
                  )
                })
              ) : (
                <NoDataFound />
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SpeciesShipmentDetailsDrawer

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

const StyledTypography = styled(Typography)(({ theme, fontSize, fontWeight, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.neutralSecondary
}))

const IdentifierCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  background: theme.palette.customColors.OnPrimary,
  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
  borderRadius: '8px',
  padding: '16px'
}))
