'use client'

import React from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import Utility from 'src/utility'
import { useTranslation } from 'react-i18next'
import { ClinicalAssessmentCardList } from 'src/types/hospital/models'

interface ClinicalAssessmentCardProps {
  record: ClinicalAssessmentCardList
  isDifferential?: boolean
  isResolved?: boolean
  handleClick?: () => void
  isDischared?: boolean
  patientData?: any
}

const ClinicalAssessmentCard = ({ record, isDifferential = false, handleClick, isDischared, patientData }: ClinicalAssessmentCardProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const { getSeverityColor, getTypeChipColor, getPrognosisColor }: any = useHospitalColorUtils()

  const getTypeLabel = (type: string) => {
    return type === 'diagnosis' ? t('hospital_module.diagnosis') : t('hospital_module.tentative')
  }

  const activity = Number(record.comment_count) - 1 > 0 ? `+${Number(record.comment_count) - 1}` : null
  const oldRecord = record?.latest_note?.notes_dump?.old_data?.clinical_assessment
  const newRecord = record?.latest_note?.notes_dump?.new_data?.clinical_assessment
  const chronic = record.latest_note?.notes_dump?.new_data?.is_cronical === 1 ? t('yes') : null
  const prognosis = Utility.capitalizeFirstLetter(record?.prognosis)
  const notes = record.additional_info?.latest_note || record.additional_info?.start_note || record.additional_info?.stop_note
  const description = record.latest_note?.note || record.additional_info?.latest_note
  const lastUpdated = record.latest_note?.modified_at || record.latest_note?.created_at || record.created_at

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
          : (!isDifferential && getSeverityColor(prognosis).bgColor) || undefined,
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
            {record.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={getTypeLabel(record.clinical_assessment)}
              size='small'
              sx={{
                color: theme.palette.customColors.OnPrimaryContainer,
                backgroundColor: resolved
                  ? theme.palette.customColors.mdAntzNeutral
                  : getTypeChipColor(getTypeLabel(record.clinical_assessment)),
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                borderRadius: '4px',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600
              }}
            />

            {prognosis && !isDifferential && (
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: resolved
                    ? theme.palette.customColors.neutralSecondary
                    : getSeverityColor(prognosis).color,
                  '&:before': {
                    content: { xs: '""', sm: '"•"' },
                    marginRight: { xs: 0, sm: '4px' },
                    fontSize: '1rem'
                  }
                }}
              >
                {prognosis || ''}
              </Box>
            )}
          </Box>
        </Box>

        {/* Middle Content */}
        <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
          {activity && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                {t('hospital_module.activity')}:
              </Typography>
              <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
                {activity}
              </Typography>
            </Box>
          )}

          {record?.latest_note?.is_system_generated == 1 && (oldRecord || newRecord) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                {t('hospital_module.clinical_assessment')} :{' '}
              </Typography>
              {oldRecord && (
                <Typography
                  sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary, fontWeight: 600 }}
                >
                  {Utility.capitalizeFirstLetter(oldRecord)}
                </Typography>
              )}
              {newRecord && (
                <Typography
                  sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient, fontWeight: 600 }}
                >
                  {oldRecord && '→'} {Utility.capitalizeFirstLetter(newRecord)}
                </Typography>
              )}
            </Box>
          )}

          {record?.latest_note?.is_system_generated == true && chronic && !isDifferential && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                {t('hospital_module.is_it_chronic')} :{' '}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: chronic === 'Yes' ? theme.palette.warning.main : theme.palette.success.main,
                  fontWeight: 600
                }}
              >
                {chronic}
              </Typography>
            </Box>
          )}

          {record.latest_note?.is_system_generated == true && prognosis && !isDifferential && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                {t('hospital_module.prognosis')} :{' '}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: getPrognosisColor
                    ? getSeverityColor(prognosis).color
                    : theme.palette.customColors.OnSurfaceVarient,
                  fontWeight: 600
                }}
              >
                {prognosis.charAt(0).toUpperCase() + prognosis.slice(1)}
              </Typography>
            </Box>
          )}

          {record.latest_note?.is_system_generated == true && notes && (
            <Tooltip
              title={
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {notes}
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
                {t('hospital_module.notes_label')} : {notes}
              </Typography>
            </Tooltip>
          )}

          {record.latest_note?.is_system_generated == false && description && (
            <Tooltip
              title={
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {description}
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
                {description}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            {t('hospital_module.last_updated')}:{' '}
            {Number(record?.comment_count) > 1 ? `${Utility.convertUtcToLocalReadableDate(lastUpdated)} • ${Utility.convertUTCToLocaltime(
              lastUpdated
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
                ? t('hospital_module.created_by')
                : t('hospital_module.updated_by')
              : t('hospital_module.resolved_by')}
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
            date={Number(record?.comment_count) > 1 ? record?.latest_note?.modified_at || record.additional_info?.closed_at : record?.additional_info?.recorded_date_time}
            show_time
            compact={true}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default ClinicalAssessmentCard
