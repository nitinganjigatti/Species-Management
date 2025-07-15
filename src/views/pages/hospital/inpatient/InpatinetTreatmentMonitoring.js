import { Button } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useState } from 'react'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import PatientMontoring from '../utility/PatientMontoring'
import Utility from 'src/utility'

const InpatinetTreatmentMonitoring = () => {
  return (
    <>
      <Box sx={{ mt: 6 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid item size={{ xs: 12, sm: 10 }}>
            <HorizontalDateNav numberOfDays={6} />
          </Grid>
          <Grid
            item
            size={{ xs: 12, sm: 2 }}
            sx={{ display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'stretch' }}
          >
            <Button variant='contained' sx={{ height: '100%' }}>
              SCHEDULE
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 8 }}>
          <PatientMontoring />
        </Box>
      </Box>
    </>
  )
}

export default InpatinetTreatmentMonitoring
