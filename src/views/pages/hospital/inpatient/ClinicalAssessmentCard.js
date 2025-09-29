import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import Utility from 'src/utility'

const ClinicalAssessmentCard = ({ record, isDifferential = false, handleClick }) => {
  const theme = useTheme()
  const { getSeverityColor, getTypeChipColor, getPrognosisColor } = useHospitalColorUtils()

  const mappedRecord = {
    id: record.id,
    title: record.name,
    type: record.clinical_assessment === 'diagnosis' ? 'Diagnosis' : 'Differential',
    status: record.additional_info?.status || 'active',
    severity: record.additional_info?.severity || '',
    category: record.category,
    activity: record.comment_count ? `+${record.comment_count}` : '+0',
    clinicalAssessment:
      record.clinical_assessment === 'diagnosis'
        ? 'Diagnosis'
        : record.clinical_assessment === 'differential'
        ? 'Differential → Diagnosis'
        : '',
    chronic: record.additional_info?.isChronic ? 'Yes' : 'No',
    prognosis: Utility.capitalizeFirstLetter(record?.prognosis),
    notes:
      record.additional_info?.latest_note || record.additional_info?.start_note || record.additional_info?.stop_note,
    description: record.latest_note?.note || record.additional_info?.latest_note,
    lastUpdated: Utility.formatDisplayDate(record.latest_note?.modified_at || record.created_at),
    resolvedBy: record.additional_info?.closed_at
      ? {
          name: record.additional_info?.resolved_user_name || record.created_by_user_name,
          avatar: record.additional_info?.resolved_user_profile_pic || record.created_by_user_name,
          date: Utility.formatDisplayDate(record.additional_info?.closed_at)
        }
      : null
  }

  // Determine if resolved based on API data
  const resolved = record.additional_info?.status === 'closed' || record.additional_info?.closed_at !== null
  const isActive = record.additional_info?.status === 'active'

  return (
    <Box
      sx={{
        border: isDifferential
          ? `1px solid ${theme.palette.customColors.amber}`
          : `1px solid ${theme.palette.customColors.OnPrimary}`,
        borderRadius: '8px',
        padding: { xs: '16px', sm: '20px', md: '24px' },
        backgroundColor: resolved
          ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
          : !isDifferential && getSeverityColor(mappedRecord.prognosis).bgColor,
        cursor: 'pointer'
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
          alignItems: { xs: 'flex-start', sm: 'center' }
        }}
        onClick={handleClick}
      >
        {/* Left Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MedicalIdChip
            leftImage
            medId={record?.medical_record_id ? `MID-${record.medical_record_id}` : ''}
            rightDot
            dotColor={isActive ? theme.palette.primary.main : theme.palette.success.main}
            textColor={theme.palette.customColors.OnSurface}
          />
          <Typography
            sx={{
              textDecoration: resolved ? 'line-through' : 'none',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: theme.palette.customColors.OnSurfaceVarient,
              fontWeight: 500
            }}
          >
            {mappedRecord.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={mappedRecord.type}
              size='small'
              sx={{
                color: theme.palette.customColors.OnPrimaryContainer,
                backgroundColor: resolved
                  ? theme.palette.customColors.mdAntzNeutral
                  : getTypeChipColor(mappedRecord.type),
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                borderRadius: '4px',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600
              }}
            />

            {mappedRecord?.prognosis && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: resolved
                    ? theme.palette.customColors.neutralSecondary
                    : getSeverityColor(mappedRecord?.prognosis).color,
                  '&:before': {
                    content: { xs: '""', sm: '"•"' },
                    marginRight: { xs: 0, sm: '4px' },
                    fontSize: '1rem'
                  }
                }}
              >
                {mappedRecord.prognosis || ''}
              </Box>
            )}

            {mappedRecord.category && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.neutralSecondary,
                  '&:before': {
                    content: { xs: '""', sm: '"•"' },
                    marginRight: { xs: 0, sm: '4px' },
                    fontSize: '1rem',
                    color: theme.palette.customColors.neutralSecondary
                  }
                }}
              >
                {mappedRecord.category}
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
              {mappedRecord.activity}
            </Typography>
          </Box>

          {mappedRecord.clinicalAssessment && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Clinical Assessment :{' '}
              </Typography>
              <Typography
                sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
              >
                {mappedRecord.clinicalAssessment}
              </Typography>
            </Box>
          )}

          {mappedRecord.chronic && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Is it Chronic :{' '}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: mappedRecord.chronic === 'Yes' ? theme.palette.warning.main : theme.palette.success.main,
                  fontWeight: 600
                }}
              >
                {mappedRecord.chronic}
              </Typography>
            </Box>
          )}

          {mappedRecord.prognosis && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Prognosis :{' '}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: getPrognosisColor
                    ? getSeverityColor(mappedRecord.prognosis).color
                    : theme.palette.customColors.OnSurfaceVarient,
                  fontWeight: 600
                }}
              >
                {mappedRecord.prognosis.charAt(0).toUpperCase() + mappedRecord.prognosis.slice(1)}
              </Typography>
            </Box>
          )}

          {mappedRecord.notes && (
            <Tooltip title={mappedRecord.notes} arrow placement='top'>
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
                Notes : {mappedRecord.notes}
              </Typography>
            </Tooltip>
          )}

          {mappedRecord.description && (
            <Tooltip title={mappedRecord.description} arrow placement='top'>
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
                {mappedRecord.description}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            Last Updated: {mappedRecord.lastUpdated}
          </Typography>
        </Box>

        {/* Right Content - Resolved By */}
        {mappedRecord.resolvedBy && (
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
              profile_image={mappedRecord.resolvedBy.avatar}
              user_name={mappedRecord.resolvedBy.name}
              date={mappedRecord.resolvedBy.date}
              show_time
              compact={true}
            />
          </Box>
        )}

        {/* Created By (for active records) */}
        {!resolved && (
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
              Created by
            </Typography>
            <UserAvatarDetails
              profile_image={record.created_by_user_name}
              user_name={record.created_by_user_name}
              date={Utility.formatDisplayDate(record.created_at)}
              show_time
              compact={true}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default ClinicalAssessmentCard