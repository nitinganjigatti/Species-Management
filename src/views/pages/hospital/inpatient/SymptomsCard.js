import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'

const SymptomsCard = ({ record, isResolved }) => {
  const theme = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: { xs: '16px', sm: '20px', md: '24px' },
        backgroundColor: isResolved
          ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
          : getSymptomsSeverityColor(record.severity).bgColor
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 2fr',
            md: '1fr 2fr 1fr'
          },
          gap: { xs: 1.5, sm: 2 },
          alignItems: { xs: 'flex-start', sm: 'center' },
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
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: isResolved
                ? theme.palette.customColors.OnSurfaceVarient
                : getSymptomsSeverityColor(record.severity).color,
              fontWeight: 500
            }}
          >
            {record.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={record.severity}
              size='small'
              sx={{
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
                  fontSize: '0.9rem',
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
        <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
              Activity:
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
              {record.activity}
            </Typography>
          </Box>

          {record.clinicalAssessment && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
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
        {record.resolvedBy && (
          <Box
            sx={{
              gridColumn: { xs: '1', sm: '1 / span 2', md: '3' },
              mt: { xs: 1, md: 0 },
              borderTop: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' },
              pt: { xs: 1.5, md: 0 }
            }}
          >
            <Typography
              sx={{
                mb: { xs: 1, md: 2 },
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.75rem',
                ml: { xs: 0, md: 1 }
              }}
            >
              Resolved by
            </Typography>
            <UserAvatarDetails
              profile_image={record.resolvedBy.avatar}
              user_name={record.resolvedBy.name}
              date={record.resolvedBy.date}
              show_time
              compact={true}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default SymptomsCard
