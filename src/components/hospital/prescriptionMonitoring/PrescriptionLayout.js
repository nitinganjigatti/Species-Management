import { Grid } from '@mui/system'
import React from 'react'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import PrescriptionMonitoringGrid from './PrescriptionMonitoringGrid'

function PrescriptionLayout() {
  return (
    <div>
      <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid item size={{ xs: 12, sm: 10 }}>
          {/* <HorizontalDateNav numberOfDays={6} /> */}
          <HorizontalDateNav numberOfDays={7} />
        </Grid>
        {/* <PatientMonitoring /> */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <PrescriptionMonitoringGrid />
        </Grid>
      </Grid>
    </div>
  )
}

export default React.memo(PrescriptionLayout)
