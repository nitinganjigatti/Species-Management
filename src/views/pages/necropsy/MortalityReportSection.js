import React from 'react'
import { Box, Card, CardContent, Typography, alpha, useTheme } from '@mui/material'
import Utility from 'src/utility'

const FieldRow = ({ label, value, theme }) => {
  return (
    <Box
      sx={{
        borderBottom: `1px solid ${theme.palette.customColors?.OnPrimary}`,
        px: 4,
        py: 3
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: theme.palette.customColors?.OnSurfaceVariant,
          mb: 0.5
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: theme.palette.customColors?.OnSurfaceVariant
        }}
      >
        {value || '--'}
      </Typography>
    </Box>
  )
}

const MortalityReportSection = ({ data }) => {
  const theme = useTheme()

  const mortalityDate = data?.discovered_date || data?.mortality_created_at

  const dateTimeValue = mortalityDate
    ? `${Utility.convertUtcToLocalReadableDate(mortalityDate)} • ${Utility.convertUTCToLocaltime(mortalityDate)}`
    : '--'

  const fields = [
    { label: 'Suspected Cause of Death', value: data?.manner_of_death || '--' },
    { label: 'Date and Time of Death', value: dateTimeValue },
    { label: 'Carcass Condition', value: data?.caracass_condition || '--' },
    { label: 'Short History of Illness', value: data?.history_of_illness || '--' },
    { label: 'Notes', value: data?.notes || data?.notes || '--' }
  ]

  return (
    <Card
      sx={{
        mt: 6,
        border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 500,
            color: theme.palette.customColors?.OnSurfaceVariant,
            mb: 4
          }}
        >
          Mortality Report
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            backgroundColor: theme.palette.customColors?.avatarBackground
          }}
        >
          {fields.map((field, index) => (
            <FieldRow key={index} label={field.label} value={field.value} theme={theme} />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default MortalityReportSection
