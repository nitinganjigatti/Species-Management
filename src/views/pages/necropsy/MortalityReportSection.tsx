import React, { FC, memo } from 'react'
import { Box, Card, CardContent, Typography, useTheme, Theme } from '@mui/material'
import Utility from 'src/utility'

interface FieldRowProps {
  label: string
  value: string
  theme: Theme
}

const FieldRow: FC<FieldRowProps> = ({ label, value, theme }) => {
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

interface MortalityData {
  discovered_date?: string
  mortality_created_at?: string
  manner_of_death?: string
  caracass_condition?: string
  history_of_illness?: string
  notes?: string
}

interface MortalityReportSectionProps {
  data?: MortalityData | null
}

const MortalityReportSection: FC<MortalityReportSectionProps> = ({ data }) => {
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

export default memo(MortalityReportSection)
