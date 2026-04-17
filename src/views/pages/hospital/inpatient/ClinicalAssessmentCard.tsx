'use client'

import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import Utility from 'src/utility'

interface ClinicalAssessmentCardProps {
  record: any
  isDifferential?: boolean
  handleClick?: () => void
  isDischared?: boolean
  patientData?: any
}

const ClinicalAssessmentCard = ({ record, isDifferential = false, handleClick, isDischared, patientData }: ClinicalAssessmentCardProps) => {
  const theme: any = useTheme()
  const { getSeverityColor, getTypeChipColor, getPrognosisColor }: any = useHospitalColorUtils()

  const mappedRecord: any = {
    id: record.id,
    title: record.name,
    medical_record_code: record?.medical_record_code,
    type: record.clinical_assessment === 'diagnosis' ? 'Diagnosis' : 'Tentative',
    status: record.additional_info?.status || 'active',
    severity: record.additional_info?.severity || '',
    category: record.category,
    activity: record.comment_count - 1 > 0 ? `+${record.comment_count - 1}` : null,
    clinicalAssessment: record.clinical_assessment === 'diagnosis' ? 'Diagnosis' : 'Tentative',

    oldRecord: record?.latest_note?.notes_dump?.old_data?.clinical_assessment,
    newRecord: record?.latest_note?.notes_dump?.new_data?.clinical_assessment,
    chronic: record.latest_note?.notes_dump?.new_data?.is_cronical ? (record.latest_note?.notes_dump?.new_data?.is_cronical ? 'Yes' : 'No') : null,
    prognosis: Utility.capitalizeFirstLetter(record?.prognosis),
    notes:
      record.additional_info?.latest_note || record.additional_info?.start_note || record.additional_info?.stop_note,
    description: record.latest_note?.note || record.additional_info?.latest_note,
    lastUpdated: record.latest_note?.modified_at || record.latest_note?.created_at || record.created_at,
    resolvedBy: {
      name:
        record.additional_info?.status === 'active'
          ? record.created_by_user_name
          : record.additional_info?.resolved_user_name,
      avatar:
        record.additional_info?.status === 'active'
          ? record?.created_user_profile_pic
          : record.additional_info?.resolved_user_profile_pic || record.created_by_user_name,
      date: record?.comment_count > 1 ? record?.latest_note?.modified_at || record.additional_info?.closed_at : record?.additional_info?.recorded_date_time
    }
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
          : (!isDifferential && getSeverityColor(mappedRecord.prognosis).bgColor) || undefined,
        cursor: isDischared ? 'not-allowed' : 'pointer'
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
            medId={record?.medical_record_code}
            rightDot={record?.medical_record_code === patientData?.medical_record_code}
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

            {mappedRecord?.prognosis && !isDifferential && (
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
          </Box>
        </Box>

        {/* Middle Content */}
        <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
          {mappedRecord.activity && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                Activity:
              </Typography>
              <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
                {mappedRecord.activity}
              </Typography>
            </Box>
          )}

          {record?.latest_note?.is_system_generated == 1 && (mappedRecord?.oldRecord || mappedRecord?.newRecord) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                Clinical Assessment :{' '}
              </Typography>
              {mappedRecord?.oldRecord && (
                <Typography
                  sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary, fontWeight: 600 }}
                >
                  {Utility.capitalizeFirstLetter(mappedRecord?.oldRecord)}
                </Typography>
              )}
              {mappedRecord?.newRecord && (
                <Typography
                  sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
                >
                  {mappedRecord?.oldRecord && '→'} {Utility.capitalizeFirstLetter(mappedRecord.newRecord)}
                </Typography>
              )}
            </Box>
          )}

          {record?.latest_note?.is_system_generated == true && mappedRecord.chronic && !isDifferential && (
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

          {record.latest_note?.is_system_generated == true && mappedRecord.prognosis && !isDifferential && (
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

          {record.latest_note?.is_system_generated == true && mappedRecord.notes && (
            <Tooltip
              title={
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {mappedRecord.notes}
                </Box>
              }
              arrow
              placement='top'
            >
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
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                Notes : {mappedRecord.notes}
              </Typography>
            </Tooltip>
          )}

          {record.latest_note?.is_system_generated == false && mappedRecord.description && (
            <Tooltip
              title={
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {mappedRecord.description}
                </Box>
              }
              arrow
              placement='top'
            >
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
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {mappedRecord.description}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            Last Updated:{' '}
            {record?.comment_count > 1 ? `${Utility.convertUtcToLocalReadableDate(mappedRecord.lastUpdated)} • ${Utility.convertUTCToLocaltime(
              mappedRecord.lastUpdated
            )}` : `${Utility.convertUtcToLocalReadableDate(record?.additional_info?.recorded_date_time)} • ${Utility.convertUTCToLocaltime(
              record?.additional_info?.recorded_date_time
            )}`}
          </Typography>
        </Box>

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
            {record.additional_info?.status === 'active'
              ? record?.latest_note?.modified_at?.slice(0, 19) === record?.created_at
                ? 'Created by'
                : 'Updated by'
              : 'Resolved by'}
          </Typography>
          <UserAvatarDetails
            profile_image={
              record?.additional_info?.status === 'active'
                ? record?.updated_by_user_name
                  ? record?.updated_user_profile_pic
                  : record?.created_user_profile_pic
                : record.additional_info?.resolved_user_profile_pic || record.created_by_user_name
            }
            user_name={
              record?.additional_info?.status === 'active'
                ? record?.updated_by_user_name
                  ? record?.updated_by_user_name
                  : record.created_by_user_name
                : record.additional_info?.resolved_user_name
            }
            date={record?.comment_count > 1 ? record?.latest_note?.modified_at || record.additional_info?.closed_at : record?.additional_info?.recorded_date_time}
            show_time
            compact={true}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default ClinicalAssessmentCard
