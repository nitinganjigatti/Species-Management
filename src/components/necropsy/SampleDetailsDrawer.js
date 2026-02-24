import React, { memo, useMemo } from 'react'
import { Box, Drawer, IconButton, Typography, Skeleton, Tabs, Tab } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Icon from 'src/@core/components/icon'
import NoDataFound from 'src/views/utility/NoDataFound'
import moment from 'moment'

const SampleDetailsDrawer = ({
  open,
  onClose,
  selectedSample,
  activeTab,
  onTabChange,
  tests,
  sampleLogs,
  logsLoading,
  onTestClick
}) => {
  const theme = useTheme()

  const processedSampleLogs = useMemo(() => {
    if (!sampleLogs || typeof sampleLogs !== 'object') {
      return []
    }

    const datesArray = Object.keys(sampleLogs)
      .map(date => {
        const logs = Array.isArray(sampleLogs[date]) ? sampleLogs[date] : []
        const sortedLogs = [...logs].sort((a, b) => {
          const timeA = a?.logDateTime ? moment.utc(a.logDateTime).valueOf() : 0
          const timeB = b?.logDateTime ? moment.utc(b.logDateTime).valueOf() : 0
          return timeB - timeA
        })
        return { date, logs: sortedLogs }
      })
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())

    return datesArray
  }, [sampleLogs])

  const filteredLogs = processedSampleLogs
    .map(dateItem => ({
      ...dateItem,
      logs: dateItem.logs.filter(log => log.sampleName === selectedSample?.sampleName)
    }))
    .filter(dateItem => dateItem.logs.length > 0)

  const renderTestCard = (test, index) => {
    const statusColor =
      test.testStatus === 'Completed'
        ? theme.palette.success.main
        : test.testStatus === 'In Progress'
        ? theme.palette.warning.dark
        : theme.palette.error.main

    const hasSubTests = test.subTestCount > 1

    return (
      <Box
        key={test.tCode || index}
        onClick={() => hasSubTests && onTestClick(test)}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          mx: 3,
          mb: 2,
          overflow: 'hidden',
          cursor: hasSubTests ? 'pointer' : 'default'
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: statusColor,
                mb: 0.5
              }}
            >
              {test.testStatus}
            </Typography>
            <Typography
              sx={{
                fontSize: '15px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                mb: 0.5
              }}
            >
              {test.testName}
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
              }}
            >
              {test.sampleName}
            </Typography>
          </Box>
          {hasSubTests && <ChevronRightIcon sx={{ color: theme.palette.grey[400], ml: 1 }} />}
        </Box>
      </Box>
    )
  }

  const renderSampleLogTimeline = () => (
    <Box sx={{ py: 3 }}>
      {logsLoading ? (
        <Box sx={{ px: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant='rounded' height={60} sx={{ mb: 2 }} />
          ))}
        </Box>
      ) : filteredLogs.length > 0 ? (
        filteredLogs.map(dateItem => (
          <Box key={dateItem.date}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                backgroundColor: theme.palette.customColors?.avatarBackground || theme.palette.grey[100],
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  sx={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                  }}
                >
                  {moment(dateItem.date).format('D')}
                </Typography>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                    }}
                  >
                    {moment(dateItem.date).format('dddd')}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                    }}
                  >
                    {moment(dateItem.date).format('MMM YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ px: 3 }}>
              {dateItem.logs.map((log, logIndex) => {
                const logTime = log?.logDateTime ? moment.utc(log.logDateTime).local().format('h:mm A') : ''
                const hasReasonOrNotes = log?.reason || log?.notes

                return (
                  <Box
                    key={`${log?.logDateTime}-${log?.sNo || logIndex}`}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: logIndex < dateItem.logs.length - 1 ? 3 : 0
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                        width: 60,
                        flexShrink: 0
                      }}
                    >
                      {logTime}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `1px solid ${theme.palette.primary.main}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.palette.background.paper
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </Box>
                      {logIndex < dateItem.logs.length - 1 && (
                        <Box
                          sx={{
                            width: 1,
                            flex: 1,
                            minHeight: 40,
                            backgroundColor: theme.palette.primary.main
                          }}
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: theme.palette.customColors?.avatarBackground || theme.palette.grey[50],
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {hasReasonOrNotes ? (
                        <>
                          <Box
                            sx={{
                              backgroundColor: alpha(
                                theme.palette.customColors?.avatarBackground || theme.palette.grey[200],
                                0.5
                              ),
                              p: 1.5
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '13px',
                                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                              }}
                            >
                              {log?.action}
                            </Typography>
                            {log?.reason && (
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
                                  mt: 0.5
                                }}
                              >
                                {log.reason}
                              </Typography>
                            )}
                          </Box>
                          {log?.notes && (
                            <Box sx={{ p: 1.5 }}>
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                                }}
                              >
                                {log.notes}
                              </Typography>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box sx={{ p: 1.5 }}>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                            }}
                          >
                            {log?.action}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        ))
      ) : (
        <Box sx={{ py: 6 }}>
          <NoDataFound message='No sample logs found' />
        </Box>
      )}
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '80%', md: 560 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            Sample Details
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 600,
            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
          }}
        >
          {selectedSample?.sampleName}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.background.paper }}>
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px'
            }
          }}
        >
          <Tab label='Tests' />
          <Tab label='Sample Log' />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: theme.palette.background.default }}>
        {activeTab === 0 ? (
          <Box sx={{ py: 3 }}>
            {tests.length > 0 ? (
              tests.map((test, index) => renderTestCard(test, index))
            ) : (
              <Box sx={{ py: 6 }}>
                <NoDataFound message='No tests found for this sample' />
              </Box>
            )}
          </Box>
        ) : (
          renderSampleLogTimeline()
        )}
      </Box>
    </Drawer>
  )
}

export default memo(SampleDetailsDrawer)
