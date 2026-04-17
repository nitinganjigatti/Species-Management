import { Grid } from '@mui/material'
import React from 'react'
import TreatmentMonitoringGrid from './TreatmentMonitoringGrid'

interface TreatmentLayoutProps {
  patientData?: any
  refetchPatient?: () => void
}

const TreatmentLayout = ({ patientData, refetchPatient }: TreatmentLayoutProps) => {
  return (
    <>
      <div>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <TreatmentMonitoringGrid patientData={patientData} refetchPatient={refetchPatient} />
        </Grid>
      </div>
    </>
  )
}

export default TreatmentLayout
