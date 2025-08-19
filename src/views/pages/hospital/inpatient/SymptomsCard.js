import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { Circle as CircleIcon } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'

const SymptomsCard = ({ record, isResolved }) => {
  const theme = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: isResolved
          ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
          : getSymptomsSeverityColor(record.severity).bgColor
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircleIcon sx={{ color: '#4CAF50', fontSize: 8 }} />
            <Typography variant='body2' color='text.secondary'>
              {record.id}
            </Typography>
          </Box>

          <Typography
            sx={{
              textDecoration: isResolved ? 'line-through' : 'none',
              fontSize: '1.25rem',
              color: isResolved
                ? theme.palette.customColors.OnSurfaceVarient
                : getSymptomsSeverityColor(record.severity).color,
              fontWeight: 500
            }}
          >
            {record.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={record.severity}
              size='small'
              sx={{
                color: theme.palette.customColors.OnPrimaryContainer,
                backgroundColor: theme.palette.customColors.OnPrimary,
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                color: isResolved
                  ? theme.palette.customColors.neutralSecondary
                  : getSymptomsSeverityColor(record.severity).color,
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />

            {record?.days && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVarient
                }}
              >
                {record?.days} Days
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
                Severity :{' '}
              </Typography>
              <Typography
                sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
              >
                {record.clinicalAssessment}
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

export default SymptomsCard
