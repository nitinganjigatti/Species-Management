import React from 'react'
import { Typography, Grid, Box, Paper, Chip, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'

const ShipmentCard = ({ shipment }) => {
  const theme = useTheme()
  return (
    <Box mb={6}>
      {/* Shipment ID */}
      <Typography sx={{ fontSize: '18px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, mb: 3 }}>
        Shipment ID :{' '}
        <Box component='span' sx={{ fontSize: '18px', fontWeight: 500, color: theme.palette.primary.dark }}>
          {shipment.id}
        </Box>
      </Typography>

      <Paper
        elevation={1}
        sx={{
          mt: 1,
          borderRadius: '8px',
          backgroundColor: theme.palette.common.white,
          px: 4,
          py: 3,
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          boxShadow: 'none'
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 7 }}>
            <Box mb={4}>
              <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.secondaryBg, fontWeight: 400 }}>
                Shipment Date
              </Typography>
              <Typography
                sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {moment(shipment.shipment_date).format('DD/MM/YYYY')}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.secondaryBg, fontWeight: 400 }}>
                Total Species
              </Typography>
              <Typography
                sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {shipment.species_count}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 5 }} display='flex' flexDirection='column' justifyContent='flex-end'>
            <Box mt='28px'>
              {' '}
              <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.statusText, fontWeight: 400 }}>
                Animals Part of Shipment
              </Typography>
              <Box display='flex' gap={1} mt={0.5}>
                <Chip
                  label={`M - ${shipment.male_count}`}
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
                  label={`F - ${shipment.female_count}`}
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
                  label={`U - ${shipment.undeterminate_count}`}
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
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default ShipmentCard
