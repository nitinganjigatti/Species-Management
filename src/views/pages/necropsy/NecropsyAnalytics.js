import React from 'react'
import { Box, Card, CardContent, Grid, useTheme, Button } from '@mui/material'
import NecropsyDropdown from 'src/components/necropsy/NecropsyDropdown'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

const NecropsyAnalytics = ({ disabled = false, filterDate, setFilterDate }) => {
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
          <Grid container spacing={4} alignItems='center' justifyContent='space-between'>
            {/* Necropsy Info Section */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  textAlign: { md: 'left' }
                }}
              >
                <NecropsyDropdown disabled={disabled} />
              </Box>
            </Grid>

            {/* Metrics Section / Actions */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  gap: 4
                }}
              >
                <Box sx={{ width: '300px' }}>
                  <CommonDateRangePickers
                    filterDates={filterDate}
                    onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                  />
                </Box>
                <Button variant='contained' onClick={() => {}}>
                  CARCASS TRANSFER
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NecropsyAnalytics
