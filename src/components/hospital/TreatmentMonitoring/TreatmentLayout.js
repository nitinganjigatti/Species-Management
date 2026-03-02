import { Grid } from '@mui/material'
import React from 'react'
import TreatmentMonitoringGrid from './TreatmentMonitoringGrid'

const TreatmentLayout = ({ patientData }) => {
  return (
    <>
      <div>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <TreatmentMonitoringGrid patientData={patientData} />
        </Grid>
      </div>
    </>
  )
}

export default TreatmentLayout
