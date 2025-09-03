import { Grid } from '@mui/material'
import React from 'react'
import TreatmentMonitoringGrid from './TreatmentMonitoringGrid'

const TreatmentLayout = () => {
  return (
    <>
      <div>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <TreatmentMonitoringGrid />
        </Grid>
      </div>
    </>
  )
}

export default TreatmentLayout
