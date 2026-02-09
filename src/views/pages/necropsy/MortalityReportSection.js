import React from 'react'
import { Box, Card, CardContent, Divider, Grid, Typography, useTheme } from '@mui/material'
import Utility from 'src/utility'

const LabelValue = ({ label, value }) => {
  const theme = useTheme()

  return (
    <Box sx={{ py: 2 }}>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: theme.palette.customColors.neutralSecondary,
          mb: 1
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {value || '--'}
      </Typography>
    </Box>
  )
}

const MortalityReportSection = ({ data }) => {
  const theme = useTheme()

  const mortalityDate = data?.mortality_created_at
  const dateTimeValue = mortalityDate
    ? `${Utility.convertUtcToLocalReadableDate(mortalityDate)} ${Utility.convertUTCToLocaltime(mortalityDate)}`
    : '--'

  const fields = [
    { label: 'Suspected Cause of Death', value: '--' },
    { label: 'Date and Time of Death', value: dateTimeValue },
    { label: 'Carcass Condition', value: '--' },
    { label: 'Short History of Illness', value: '--' },
    { label: 'Notes', value: '--' }
  ]

  return (
    <Card sx={{ mt: 6, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: 6 }}>
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant,
            mb: 3
          }}
        >
          Mortality Report
        </Typography>
        <Divider />
        <Grid container spacing={4}>
          {fields.map((field, index) => (
            <React.Fragment key={field.label}>
              <Grid item xs={12} sm={6}>
                <LabelValue label={field.label} value={field.value} />
              </Grid>
              {index < fields.length - 1 && index % 2 === 1 && (
                <Grid item xs={12}>
                  <Divider />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default MortalityReportSection
