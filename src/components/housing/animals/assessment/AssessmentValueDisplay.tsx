import React from 'react'
import { Box, Typography, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { AssessmentValue, AssessmentResponseType, MeasurementUnit } from 'src/types/housing/assessment'
import Utility, { AgeConverter } from 'src/utility'

interface AssessmentValueDisplayProps {
  values: AssessmentValue[]
  responseType: AssessmentResponseType
  measurementUnits: MeasurementUnit[]
  onValueClick: (value: AssessmentValue, index: number) => void
}

const AssessmentValueDisplay: React.FC<AssessmentValueDisplayProps> = ({
  values,
  responseType,
  measurementUnits,
  onValueClick
}) => {
  const theme = useTheme() as any

  // Format date using utility functions - convert UTC to local, then format
  const formatDate = (dateTime: string): string => {
    if (!dateTime) return ''

    try {
      // Convert UTC to local time first, then use AgeConverter
      const localDateTime = Utility.convertUTCToLocal(dateTime)

      return AgeConverter(localDateTime)
    } catch {
      return dateTime
    }
  }

  const getUnitAbbr = (unitId?: string): string => {
    if (!unitId) return ''
    // Use loose equality to handle string/number type mismatch (matching mobile behavior)
    const unit = measurementUnits.find(u => String(u.id) === String(unitId))

    return unit?.uom_abbr || ''
  }

  const getDisplayValue = (value: AssessmentValue): { main: string; unit: string } => {
    switch (responseType) {
      case 'text':
        return { main: value.assessment_value?.toString() || '', unit: '' }

      case 'numeric_value':
        return {
          main: value.assessment_value?.toString() || '',
          unit: getUnitAbbr(value.assessment_unit_id)
        }

      case 'numeric_scale':
      case 'list':
        return {
          main: value.asssessment_label || value.assessment_value?.toString() || '',
          unit: ''
        }

      default:
        return { main: value.assessment_value?.toString() || '', unit: '' }
    }
  }

  const renderValue = (value: AssessmentValue, index: number) => {
    const { main, unit } = getDisplayValue(value)

    return (
      <Box
        key={value.assessment_id}
        onClick={() => onValueClick(value, index)}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            opacity: 0.8
          }
        }}
      >
        {/* Value with Unit */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '20px',
              color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.customColors?.OnPrimaryContainer
            }}
          >
            {main}
          </Typography>
          {unit && (
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '14px',
                color: theme.palette.text.secondary
              }}
            >
              {unit}
            </Typography>
          )}
        </Box>

        {/* Time */}
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            color: theme.palette.text.secondary,
            mt: 0.5
          }}
        >
          {formatDate(value.recorded_date_time)}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        gap: 3,
        flexWrap: 'wrap'
      }}
    >
      {values.map((value, index) => (
        <React.Fragment key={value.assessment_id}>
          {renderValue(value, index)}
          {index < values.length - 1 && (
            <Divider
              orientation='vertical'
              flexItem
              sx={{
                borderColor: theme.palette.divider,
                mx: 1,
                height: 'auto',
                alignSelf: 'stretch'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  )
}

export default AssessmentValueDisplay
