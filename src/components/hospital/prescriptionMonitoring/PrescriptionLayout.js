import { Grid } from '@mui/system'
import React from 'react'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'
import { Button } from '@mui/material'

function PrescriptionLayout() {
  return (
    <div>
      <Grid container spacing={2} sx={{ alignItems: 'center', my: 10, justifyContent: 'space-between' }}>
        {/* <Grid item size={{ xs: 10, sm: 10 }}>
          <HorizontalDateNav numberOfDays={6} />
        </Grid>
        <Grid item size={{ xs: 2, sm: 2 }}>
          <Button sx={{ height: '48px', width: '100%', border: '1px solid blue' }} variant='contained'>
            Schedule
          </Button>
        </Grid>

        <PatientMonitoring />
        <Grid item size={{ xs: 12, sm: 12 }}>
          <PrescriptionMonitoringGrid />
        </Grid> */}
        <PrescriptionMonitoringGrid />
      </Grid>
    </div>
  )
}

export default React.memo(PrescriptionLayout)
