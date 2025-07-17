import { Chip, Typography } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React from 'react'

// This is pending
const ClinicalAssesmentCard = ({ bgColor = 'cyan', containerStyle, diagnosisData }) => {
  return (
    <>
      <Box sx={{ background: bgColor, p: 5, borderRadius: 0.5, minHeight: 80, width: '100%', ...containerStyle }}>
        <Grid container gap={4}>
          <Grid item size={{ xs: 12, sm: 12, md: 4 }}>
            <Box>
              <Typography>{diagnosisData?.diagnosis}</Typography>
              <Chip />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default ClinicalAssesmentCard
