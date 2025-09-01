import { Grid } from '@mui/system'
import React from 'react'
import PatientMonitoring from 'src/views/pages/hospital/utility/PatientMontoring'
import HorizontalDateNav from 'src/views/utility/HorizontalDateNav'
import PrescriptionGrid from './PrescriptionGrid'

function Prescription() {
  return (
    <div>
      <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid item size={{ xs: 12, sm: 10 }}>
          {/* <HorizontalDateNav numberOfDays={6} /> */}
          <HorizontalDateNav numberOfDays={6} />
        </Grid>
        {/* <PatientMonitoring /> */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <PrescriptionGrid />
        </Grid>
      </Grid>
    </div>
  )
}

export default React.memo(Prescription)
