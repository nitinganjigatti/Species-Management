import React from 'react'
import { Box, Card, CardContent, Grid, useTheme, Button, IconButton, Badge, Typography } from '@mui/material'
import NecropsyDropdown from 'src/components/necropsy/NecropsyDropdown'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { AirportShuttle } from '@mui/icons-material'

const NecropsyAnalytics = ({ disabled = false, filterDate, setFilterDate, badgeCount = 1 }) => {
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
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'end' }}>
              <Button
                onClick={() => {
                  alert('its working fine')
                }}
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
            </Grid>
            <Grid
              item
              size={{ xs: 12 }}
              container
              justifyContent='space-between'
              rowSpacing={4}
              sx={{
                display: 'flex',
                flexDirection: {
                  xs: 'column-reverse',
                  sm: 'row ',
                  alignItems: 'center'
                }
              }}
            >
              {/* Necropsy Info Section */}
              <Grid
                item
                size={{ xs: 12, sm: 6 }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'start',
                    fontSize: '14px',
                    color: theme.palette.customColors.secondaryBg
                  }}
                >
                  Necropsy Center
                </Typography>
                <Box
                  sx={{
                    textAlign: { md: 'left' }
                  }}
                >
                  <NecropsyDropdown disabled={disabled} />
                </Box>
              </Grid>
              <Grid
                item
                size={{ xs: 12, sm: 'auto' }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography sx={{ display: 'flex', fontSize: '14px', color: theme.palette.customColors.secondaryBg }}>
                  Date Range
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    minWidth: { xs: 0, sm: '300px' },
                    alignItems: 'center',
                    py: '6px'
                  }}
                >
                  <CommonDateRangePickers
                    filterDates={filterDate}
                    onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NecropsyAnalytics
