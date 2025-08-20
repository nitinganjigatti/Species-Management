import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { Circle as CircleIcon } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'

const ClinicalAssessmentCard = ({ record, isDifferential = false, isResolved }) => {
  const theme = useTheme()
  const { getSeverityColor, getTypeChipColor } = useHospitalColorUtils()

  return (
    <Box
      sx={{
        border: isDifferential
          ? `1px solid ${theme.palette.customColors.amber}`
          : `1px solid ${theme.palette.customColors.OnPrimary}`,
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: isResolved
          ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
          : !isDifferential && getSeverityColor(record.severity).bgColor
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          gap: 2,
          alignItems: 'center'
        }}
      >
        {/* Left Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MedicalIdChip
            leftImage
            medId={record.id}
            rightDot
            dotColor={theme.palette.primary.main}
            textColor={theme.palette.customColors.OnSurface}
          />
          <Typography
            sx={{
              textDecoration: isResolved ? 'line-through' : 'none',
              fontSize: '1.25rem',
              color: theme.palette.customColors.OnSurfaceVarient,
              fontWeight: 500
            }}
          >
            {record.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={record.type}
              size='small'
              sx={{
                color: theme.palette.customColors.OnPrimaryContainer,
                backgroundColor: isResolved ? theme.palette.customColors.mdAntzNeutral : getTypeChipColor(record.type),
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600
              }}
            />

            {!isDifferential && record.severity && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isResolved
                    ? theme.palette.customColors.neutralSecondary
                    : getSeverityColor(record.severity).color,
                  '&:before': {
                    content: '"•"',
                    marginRight: '4px',
                    fontSize: '1rem'
                  }
                }}
              >
                {record.severity}
              </Box>
            )}

            {record.category && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.neutralSecondary,
                  '&:before': {
                    content: '"•"',
                    marginRight: '4px',
                    fontSize: '1rem',
                    color: theme.palette.customColors.neutralSecondary
                  }
                }}
              >
                {record.category}
              </Box>
            )}
          </Box>
        </Box>

        {/* Middle Content */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
              Activity:
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
              {record.activity}
            </Typography>
          </Box>

          {record.clinicalAssessment && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Clinical Assessment :{' '}
              </Typography>
              <Typography
                sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
              >
                {record.clinicalAssessment}
              </Typography>
            </Box>
          )}

          {record.chronic && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Is it Chronic :{' '}
              </Typography>
              <Typography
                sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
              >
                {record.chronic}
              </Typography>
            </Box>
          )}

          {record.prognosis && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Prognosis :{' '}
              </Typography>
              <Typography
                sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
              >
                {record.prognosis}
              </Typography>
            </Box>
          )}

          {record.notes && (
            <Tooltip title={record.notes} arrow placement='top'>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVarient,
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4'
                }}
              >
                Notes : {record.notes}
              </Typography>
            </Tooltip>
          )}

          {record.description && (
            <Tooltip title={record.description} arrow placement='top'>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVarient,
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4'
                }}
              >
                {record.description}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            Last Updated: {record.lastUpdated}
          </Typography>
        </Box>

        {/* Right Content - Resolved By */}
        <Box>
          {record.resolvedBy && (
            <>
              <Typography
                sx={{ mb: 2, color: theme.palette.customColors.neutralSecondary, fontSize: '0.75rem', ml: 1 }}
              >
                Resolved by
              </Typography>
              <UserAvatarDetails
                profile_image={record.resolvedBy.avatar}
                user_name={record.resolvedBy.name}
                date={record.resolvedBy.date}
                show_time
              />
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ClinicalAssessmentCard
