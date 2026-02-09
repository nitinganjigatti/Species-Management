import React from 'react'
import { Box, Card, CardContent, Divider, Grid, useTheme, Button, Badge, Typography, Avatar } from '@mui/material'
import NecropsyDropdown from 'src/components/necropsy/NecropsyDropdown'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { AirportShuttle } from '@mui/icons-material'
import RenderUtility from 'src/utility/render'

const NecropsyAnalytics = ({
  disabled = false,
  filterDate,
  setFilterDate,
  badgeCount = 1,
  onCarcassTransfer,
  allowCarcassCollection,
  showCarcassTransferButton = true
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ margin: '0 auto' }}>
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container alignItems='center' rowSpacing={1}>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {RenderUtility.pageTitle('Necropsy')}
              {allowCarcassCollection && showCarcassTransferButton && (
                <Button
                  onClick={onCarcassTransfer}
                  sx={{
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    CARCASS TRANSFER
                  </Typography>
                  <Badge badgeContent={badgeCount} color='error'>
                    <AirportShuttle sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                  </Badge>
                </Button>
              )}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid size={{ xs: 12 }} container spacing={4} alignItems='center' justifyContent='space-between'>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Necropsy Center
                    </Typography>
                    <NecropsyDropdown disabled={disabled} />
                  </Box>
                </Box>
              </Grid>
              {!disabled && (
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Date Range
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        minWidth: { xs: 0, sm: '300px' },
                        py: '6px'
                      }}
                    >
                      <CommonDateRangePickers
                        filterDates={filterDate}
                        onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NecropsyAnalytics
