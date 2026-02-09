import React from 'react'
import { Box, Typography, Paper, IconButton, alpha, CircularProgress } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useTheme } from '@mui/material/styles'
import ActivityListShimmer from 'src/views/pages/hospital/inpatient/shimmer/ActivityListShimmer'
import Utility from 'src/utility'

const ActivityList = ({ activities, onEdit, activityLoader, isFromAssessment = false }) => {
  const theme = useTheme()

  if (activityLoader) {
    return <ActivityListShimmer count={3} />
  }

  const formatDurationUnit = (value, unit) => {
    if (!unit) return ''

    return Number(value) === 1 || Number(value) === 0 ? unit.replace(/s$/i, '') : unit
  }
  return (
    <Box sx={{ px: 5, py: 5 }}>
      {activityLoader ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Activity</Typography>
          {activities.map((activity, i) => {
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
                      Status Update
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
                          Severity: <strong>{activity?.oldSeverity}</strong>
                          {activity?.oldSeverity && activity?.newSeverity && ' → '}
                          <strong>{activity?.newSeverity}</strong>
                        </Typography>
                      )}
                      {activity?.isSystemGenerated && (activity?.oldRecord || activity?.newRecord) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVarient }}>
                            Clinical Assessment :{' '}
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
                            Prognosis :{' '}
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
                            Is Cronical :{' '}
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
                          Status:{' '}
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
                            Duration:{' '}
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
                            {isFromAssessment ? 'Notes' : 'Comment'}
                          </Typography>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 400,
                              fontSize: '14px'
                            }}
                          >
                            {activity?.note.charAt(0).toUpperCase() + activity?.note.slice(1)}
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
                            mb: 1
                          }}
                        >
                          {activity?.note.charAt(0).toUpperCase() + activity?.note.slice(1)}
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
