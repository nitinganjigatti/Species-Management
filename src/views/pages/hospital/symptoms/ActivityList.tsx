'use client'

import React from 'react'
import { Box, Typography, Paper, IconButton, alpha, CircularProgress } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import ActivityListShimmer from 'src/views/pages/hospital/inpatient/shimmer/ActivityListShimmer'
import Utility from 'src/utility'
import { ComplaintNotes, DiagnosisNotes, DurationUnit, Id, NotesDump, Prognosis, Severity, SymptomStatus } from 'src/types/hospital/models'
import { UpdateNotesPayload } from 'src/types/hospital/api/Inpatient/symptomClinical'

interface ActivityListProps {
  activities?: ActivityFormData[]
  onEdit?: (activity: ActivityFormData) => void
  activityLoader?: boolean
  isFromAssessment?: boolean
}
export interface ActivityFormData {
  isSystemGenerated?: boolean
  createdBy?: Id
  formattedTime: string
  oldSeverity?: Severity
  newSeverity?: Severity
  oldRecord?: string
  newRecord?: string
  oldPrognosis?: Prognosis
  newPrognosis?: Prognosis
  oldIsChronical?: number
  newIsChronical?: number
  note: string
  status?: SymptomStatus
  duration?: string | number
  duration_unit?: DurationUnit
  created_at?: string
  notes_dump?: NotesDump
  created_by_user_name?: string
  is_system_generated?: number
  note_id?: Id
}


const ActivityList = ({ activities = [], onEdit, activityLoader, isFromAssessment = false }: ActivityListProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  if (activityLoader) {
    return <ActivityListShimmer count={3} />
  }

  const formatDurationUnit = (value: any, unit: any) => {
    if (!unit) return ''

    return Number(value) === 1 || Number(value) === 0 ? unit.replace(/s$/i, '') : unit;
  }
  return (
    <Box sx={{ px: 5, py: 5 }}>
      {activityLoader ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>{t('hospital_module.activity_label')}</Typography>
          {activities.map((activity: ActivityFormData, i: number) => {
            return (
              <Paper
                key={i}
                sx={{
                  p: 3,
                  mb: 3,
                  background: activity?.isSystemGenerated
                    ? theme.palette.customColors.bodyBg
                    : alpha(theme.palette.customColors.antzNotes, 0.4),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                <Box>
                  {activity?.isSystemGenerated && (
                    <Typography
                      sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}
                    >
                      {t('hospital_module.status_update')}
                    </Typography>
                  )}

                  {activity?.isSystemGenerated ? (
                    <>
                      <Typography
                        sx={{
                          color: theme.palette.customColors.neutralSecondary,
                          mb: 2,
                          fontWeight: 400,
                          fontSize: '12px'
                        }}
                      >
                        {activity?.createdBy} • {activity?.formattedTime}
                      </Typography>
                      {(activity?.oldSeverity || activity?.newSeverity) && (
                        <Typography
                          sx={{
                            mb: 1,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          {t('hospital_module.severity_label')} <strong>{activity?.oldSeverity}</strong>
                          {activity?.oldSeverity && activity?.newSeverity && ' → '}
                          <strong>{activity?.newSeverity}</strong>
                        </Typography>
                      )}
                      {activity?.isSystemGenerated && (activity?.oldRecord || activity?.newRecord) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                            {t('hospital_module.clinical_assessment_label')}{' '}
                          </Typography>
                          {activity?.oldRecord && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.neutralSecondary,
                                fontWeight: 600
                              }}
                            >
                              {Utility.capitalizeFirstLetter(activity?.oldRecord)}
                            </Typography>
                          )}
                          {activity?.newRecord && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.OnSurfaceVarient,
                                fontWeight: 600
                              }}
                            >
                              {activity?.oldRecord && '→'} {Utility.capitalizeFirstLetter(activity.newRecord)}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {activity?.isSystemGenerated && (activity?.oldPrognosis || activity?.newPrognosis) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                            {t('hospital_module.prognosis_label')}{' '}
                          </Typography>
                          {activity?.oldPrognosis && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.neutralSecondary,
                                fontWeight: 600
                              }}
                            >
                              {Utility.capitalizeFirstLetter(activity?.oldPrognosis)}
                            </Typography>
                          )}
                          {activity?.newPrognosis && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.OnSurfaceVarient,
                                fontWeight: 600
                              }}
                            >
                              {activity?.oldPrognosis && '→'} {Utility.capitalizeFirstLetter(activity.newPrognosis)}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {activity?.isSystemGenerated && (activity?.oldIsChronical || activity?.newIsChronical) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                            {t('hospital_module.is_chronic_label')}{' '}
                          </Typography>
                          {activity?.oldIsChronical !== undefined && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.neutralSecondary,
                                fontWeight: 600
                              }}
                            >
                              {activity?.oldIsChronical == 1 ? 'Yes' : 'No'}
                            </Typography>
                          )}

                          {activity?.newIsChronical !== undefined && (
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                color: theme.palette.customColors.OnSurfaceVarient,
                                fontWeight: 600
                              }}
                            >
                              {activity?.oldIsChronical !== undefined && ` →`}{' '}
                              {activity?.newIsChronical == 1 ? 'Yes' : 'No'}
                            </Typography>
                          )}
                        </Box>
                      ) : null}

                      {activity?.status && (
                        <Typography
                          sx={{
                            mb: 1,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          {t('hospital_module.status_label')}:{' '}
                          <strong>{activity?.status.charAt(0).toUpperCase() + activity?.status.slice(1)}</strong>
                        </Typography>
                      )}

                      {activity?.duration !== '' &&
                        activity?.duration != 'null' &&
                        activity?.duration !== 0 &&
                        activity?.duration !== '0' &&
                        !isFromAssessment && (
                          <Typography
                            sx={{
                              mb: 2,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 400,
                              fontSize: '12px'
                            }}
                          >
                            {t('hospital_module.duration_label')}:{' '}
                            <strong>
                              {activity.duration} {formatDurationUnit(activity.duration, activity.duration_unit)}
                            </strong>
                          </Typography>
                        )}

                      {activity?.note && (
                        <>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.neutralSecondary,
                              fontWeight: 400,
                              fontSize: '12px',
                              mb: 0.5
                            }}
                          >
                            {isFromAssessment ? t('hospital_module.notes_label') : t('hospital_module.comment_label')}
                          </Typography>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 400,
                              fontSize: '14px',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {activity?.note}
                          </Typography>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {activity?.note && (
                        <Typography
                          sx={{
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '14px',
                            mb: 1,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {activity?.note}
                        </Typography>
                      )}

                      <Typography
                        sx={{
                          color: theme.palette.customColors.neutralSecondary,
                          fontWeight: 400,
                          fontSize: '12px'
                        }}
                      >
                        {activity?.createdBy} • {activity?.formattedTime}
                      </Typography>
                    </>
                  )}
                </Box>

                {!activity?.isSystemGenerated && (
                  <IconButton size='small' style={{ padding: 1 }} onClick={() => onEdit?.(activity)}>
                    <EditOutlinedIcon sx={{ fontSize: 21, color: theme.palette.customColors.OnPrimaryContainer }} />
                  </IconButton>
                )}
              </Paper>
            )
          })}
        </>
      )}
    </Box>
  )
}

export default ActivityList
