import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { AssessmentHistoryEntry, AssessmentType, MeasurementUnit } from 'src/types/housing/assessment'
import Utility from 'src/utility'

interface AssessmentHistoryCardProps {
  entry: AssessmentHistoryEntry
  assessment: AssessmentType
  measurementUnits: MeasurementUnit[]
  canEdit: boolean
  onEditClick: (entry: AssessmentHistoryEntry) => void
  onViewClick: (entry: AssessmentHistoryEntry) => void
}

const AssessmentHistoryCard: React.FC<AssessmentHistoryCardProps> = ({
  entry,
  assessment,
  measurementUnits,
  canEdit,
  onEditClick,
  onViewClick
}) => {
  const theme = useTheme() as any

  // Get display value based on response type
  const getDisplayValue = () => {
    const responseType = assessment.response_type

    switch (responseType) {
      case 'text':
        return entry.assessment_value?.toString() || '-'

      case 'numeric_value': {
        let value = entry.assessment_value?.toString() || '-'

        // Add unit abbreviation if available
        // Use string comparison to handle type mismatch (matching mobile behavior)
        if (entry.assessment_unit_id) {
          const unit = measurementUnits.find(u => String(u.id) === String(entry.assessment_unit_id))
          if (unit) {
            value = `${value} ${unit.uom_abbr}`
          }
        }

        return value
      }

      case 'numeric_scale':
      case 'list':
        // Use the label for scale and list types
        return entry.asssessment_label || entry.assessment_value?.toString() || '-'

      default:
        return entry.assessment_value?.toString() || '-'
    }
  }

  // Format date and time - convert UTC to local time
  const formatDateTime = () => {
    if (entry.record_date && entry.record_time) {
      // Combine date and time, then convert to local
      const dateTimeStr = `${entry.record_date} ${entry.record_time}`

      return Utility.convertUTCToLocalDateTime(dateTimeStr)
    }

    if (entry.recorded_date_time) {
      return Utility.convertUTCToLocalDateTime(entry.recorded_date_time)
    }

    return '-'
  }

  const handleClick = () => {
    if (canEdit) {
      onEditClick(entry)
    } else {
      onViewClick(entry)
    }
  }

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: '8px',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.main
        }
      }}
      onClick={handleClick}
    >
      {/* Value Display */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            color: theme.palette.text.primary,
            wordBreak: 'break-word',
            flex: 1
          }}
        >
          {getDisplayValue()}
        </Typography>
        <IconButton
          size='small'
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          sx={{ ml: 1 }}
        >
          <Icon icon={canEdit ? 'mdi:pencil' : 'mdi:eye'} fontSize={18} />
        </IconButton>
      </Box>

      {/* Date/Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Icon icon='mdi:calendar-clock' fontSize={16} color={theme.palette.text.secondary} />
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            color: theme.palette.text.secondary
          }}
        >
          {formatDateTime()}
        </Typography>
      </Box>

      {/* Notes */}
      {entry.comments && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
          <Icon icon='mdi:note-text' fontSize={16} color={theme.palette.text.secondary} />
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              wordBreak: 'break-word'
            }}
          >
            {entry.comments}
          </Typography>
        </Box>
      )}

      {/* Created By */}
      {entry.created_by_name && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Icon icon='mdi:account' fontSize={16} color={theme.palette.text.disabled} />
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 500,
              color: theme.palette.text.disabled
            }}
          >
            By: {entry.created_by_name}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default AssessmentHistoryCard
