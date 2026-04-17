'use client'

import { Button } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React from 'react'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'

// @ts-ignore - module may not exist at build time
import PatientMontoring from '../utility/PatientMontoring'

const InpatinetTreatmentMonitoring = () => {
  return (
    <>
      <Box sx={{ mt: 6 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, sm: 10 }}>
            <HorizontalDateNav numberOfDays={7} />
          </Grid>
          <Grid
            size={{ xs: 12, sm: 2 }}
            sx={{ display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'stretch' }}
          >
            <Button variant='contained' sx={{ height: '100%' }}>
              SCHEDULE
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 8 }}>
          <PatientMontoring
            onTimeSlotClick={(id: any, value: any) => console.log(id, value)}
            onRemoveMetric={(id: any) => console.log(id)}
          />
        </Box>
      </Box>
    </>
  )
}

export default InpatinetTreatmentMonitoring
