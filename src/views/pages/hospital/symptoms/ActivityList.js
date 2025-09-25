import React from 'react'
import { Box, Typography, Paper, IconButton, alpha, CircularProgress } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useTheme } from '@mui/material/styles'

const ActivityList = ({ activities, onEdit, activityLoader }) => {
  const theme = useTheme()

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

                      {activity?.status && (
                        <Typography
                          sx={{
                            mb: 2,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          Status:{' '}
                          <strong>{activity?.status.charAt(0).toUpperCase() + activity?.status.slice(1)}</strong>
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
                            Comment
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
