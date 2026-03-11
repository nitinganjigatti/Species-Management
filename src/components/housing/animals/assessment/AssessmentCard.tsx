import React from 'react'
import { Box, Card, IconButton, Typography, Button } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AssessmentValueDisplay from './AssessmentValueDisplay'
import type { AssessmentType, AssessmentValue, MeasurementUnit } from 'src/types/housing/assessment'

interface AssessmentCardProps {
  assessment: AssessmentType
  measurementUnits: MeasurementUnit[]
  canAdd: boolean
  onAddClick: (assessment: AssessmentType) => void
  onValueClick: (assessment: AssessmentType, value: AssessmentValue, index: number) => void
  onHeaderClick: (assessment: AssessmentType) => void
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  measurementUnits,
  canAdd,
  onAddClick,
  onValueClick,
  onHeaderClick
}) => {
  const theme = useTheme() as any

  const hasValues = assessment.assessment_values && assessment.assessment_values.length > 0

  // Header background color - teal/cyan like mobile
  const headerBgColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.15)
    : '#E0F2F1' // Light teal color matching mobile

  const handleValueClick = (value: AssessmentValue, index: number) => {
    onValueClick(assessment, value, index)
  }

  const handleAddClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onAddClick(assessment)
  }

  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Card Header - Matching Mobile Design */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          backgroundColor: headerBgColor,
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => onHeaderClick(assessment)}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Assessment Name with Chevron */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '16px',
                color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#00796B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {assessment.assessment_name}
            </Typography>
            <Icon
              icon='mdi:chevron-right'
              fontSize={20}
              color={theme.palette.mode === 'dark' ? theme.palette.primary.main : '#00796B'}
            />
          </Box>

          {/* Category Name */}
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#004D40',
              mt: 0.5
            }}
          >
            {assessment.assessment_category_name}
          </Typography>
        </Box>

        {/* Plus Icon - Only shown when hasValues && canAdd (matching mobile) */}
        {hasValues && canAdd && (
          <IconButton
            size='small'
            onClick={handleAddClick}
            sx={{
              color: theme.palette.mode === 'dark'
                ? theme.palette.primary.main
                : '#4DB6AC', // Sky blue / teal color like mobile
              p: 0.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <Icon icon='mdi:plus-circle-outline' fontSize={28} />
          </IconButton>
        )}
      </Box>

      {/* Card Body */}
      <Box
        sx={{
          px: 3,
          py: 3,
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: hasValues ? 'flex-start' : 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: theme.palette.background.paper
        }}
      >
        {hasValues ? (
          <AssessmentValueDisplay
            values={assessment.assessment_values}
            responseType={assessment.response_type}
            measurementUnits={measurementUnits}
            onValueClick={handleValueClick}
          />
        ) : canAdd ? (
          <Button
            variant='outlined'
            onClick={(e) => {
              e.stopPropagation()
              onAddClick(assessment)
            }}
            sx={{
              borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#00796B',
              color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#00796B',
              px: 6,
              py: 1,
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : '#004D40',
                backgroundColor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            Add
          </Button>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No data available
          </Typography>
        )}
      </Box>
    </Card>
  )
}

export default AssessmentCard
