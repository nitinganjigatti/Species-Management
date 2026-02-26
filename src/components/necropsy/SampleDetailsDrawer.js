import React, { memo, useMemo } from 'react'
import { Box, Drawer, IconButton, Typography, Skeleton, Tabs, Tab } from '@mui/material'
import { useTheme, styled } from '@mui/material/styles'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent, { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
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
                color: theme.palette.customColors?.OnSurfaceVariant,
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
        <Box sx={{ px: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <Skeleton variant='text' width={50} height={16} />
              <Skeleton variant='circular' width={28} height={28} />
              <Skeleton variant='rounded' width='100%' height={50} />
            </Box>
          ))}
        </Box>
      ) : filteredLogs.length > 0 ? (
        filteredLogs.map(dateItem => (
          <Box key={dateItem.date} sx={{ mb: 2 }}>
            <StyledSectionHeader>
              <CalendarTodayIcon
                sx={{
                  fontSize: 18,
                  color: theme.palette.customColors?.OnPrimary
                }}
              />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnPrimary
                }}
              >
                {moment(dateItem.date).format('ddd, D MMM YYYY')}
              </Typography>
            </StyledSectionHeader>

            <StyledTimeline>
              {dateItem.logs.map((log, logIndex) => {
                const logTime = log?.logDateTime ? moment.utc(log.logDateTime).local().format('h:mm A') : ''
                const isFirst = logIndex === 0
                const isLast = logIndex === dateItem.logs.length - 1

                return (
                  <TimelineItem key={`${log?.logDateTime}-${log?.sNo || logIndex}`} sx={{ minHeight: '4rem' }}>
                    <StyledOppositeContent>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: theme.palette.customColors?.OnSurfaceVariant
                        }}
                      >
                        {logTime}
                      </Typography>
                    </StyledOppositeContent>

                    <TimelineSeparator>
                      <TimelineConnector
                        sx={{
                          visibility: isFirst ? 'hidden' : 'visible',
                          minHeight: isFirst ? 0 : '1rem',
                          backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                          width: '1.5px'
                        }}
                      />
                      <Box
                        sx={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          border: `1px solid ${theme.palette.customColors?.OnPrimaryContainer}`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            color: theme.palette.customColors?.OnPrimaryContainer,
                            fontSize: '1.5rem'
                          }}
                        />
                      </Box>
                      <TimelineConnector
                        sx={{
                          visibility: isLast ? 'hidden' : 'visible',
                          minHeight: isLast ? 0 : '1rem',
                          backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                          width: '1.5px'
                        }}
                      />
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: 1,
                          px: 3,
                          py: 2,
                          ml: 1,
                          flex: 1
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: theme.palette.customColors?.OnSurfaceVariant
                          }}
                        >
                          {log?.action}
                        </Typography>
                        {log?.reason && (
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                              mt: 0.5
                            }}
                          >
                            {log.reason}
                          </Typography>
                        )}
                        {log?.notes && (
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                              mt: 0.5
                            }}
                          >
                            {log.notes}
                          </Typography>
                        )}
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </StyledTimeline>
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
              color: theme.palette.customColors?.OnSurfaceVariant
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
            color: theme.palette.customColors?.OnSurfaceVariant
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

const StyledTimeline = styled(Timeline)(() => ({
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: 0,
    minWidth: '5rem',
    padding: 0
  },
  margin: 0,
  padding: '0 1rem',
  '& .MuiTimelineItem-root:before': {
    display: 'none'
  }
}))

const StyledOppositeContent = styled(TimelineOppositeContent)(() => ({
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center'
}))

const StyledSectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '0.5rem',
  marginLeft: '1rem',
  marginRight: '1rem'
}))
