import { Box, Grid } from '@mui/system'
import React from 'react'
import TreatmentTypeRadioButons from '../utility/TreatmentTypeRadioButtons'
import ClinicalAssesmentCard from 'src/views/utility/ClinicalAssesmentCard'

const InpatientOverview = () => {
  return (
    <>
      <Box sx={{ mt: 6 }}>
        <Grid container>
          <ClinicalAssesmentCard />
        </Grid>
      </Box>
    </>
  )
}

export default InpatientOverview
