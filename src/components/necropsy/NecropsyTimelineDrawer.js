import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Divider,
  Avatar,
  Skeleton,
  CircularProgress,
  Button
} from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineOppositeContent, { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent'
import { useTheme, styled, alpha } from '@mui/material/styles'
import { Close as CloseIcon, CalendarToday as CalendarIcon, CheckCircle as CheckCircleIcon, Block as BlockIcon } from '@mui/icons-material'
import Utility from 'src/utility'
import { getNecropsyTimeline } from 'src/lib/api/necropsy'

const LIMIT = 10

const NecropsyTimelineDrawer = ({ open, onClose, mortalityId }) => {
  const theme = useTheme()

  const [timelineData, setTimelineData] = useState([])
  const [rawData, setRawData] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchTimeline = useCallback(async (pageNo = 1) => {
    if (!mortalityId) return

    try {
      if (pageNo === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getNecropsyTimeline({
        page_no: pageNo,
        limit: LIMIT,
        type: 'necropsy',
        mortality_id: mortalityId
      })

      if (res?.success && Array.isArray(res.data?.result)) {
        const totalCount = res.data.total_count || 0
        setTotalPages(Math.ceil(totalCount / LIMIT))
        setPage(pageNo)

        const merged = pageNo === 1 ? res.data.result : [...rawData, ...res.data.result]
        setRawData(merged)

        const grouped = merged.reduce((acc, item) => {
          const date = item.created_at?.split(' ')[0]
          if (!date) return acc
          if (!acc[date]) acc[date] = { date, entries: [] }
          acc[date].entries.push(item)

          return acc
        }, {})

        setTimelineData(Object.values(grouped))
      }
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [mortalityId, rawData])

  useEffect(() => {
    if (open && mortalityId) {
      setRawData([])
      setTimelineData([])
      setPage(1)
      fetchTimeline(1)
    }
  }, [open, mortalityId])

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchTimeline(page + 1)
    }
  }

  const hasMore = page < totalPages

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          height: '100%',
          backgroundColor: theme.palette.background.paper
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary }}>
            History
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Timeline Content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 3 }}>
          {loading ? (
            <TimelineSkeleton />
          ) : timelineData.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
                No timeline data available
              </Typography>
            </Box>
          ) : (
            <>
              {timelineData.map((section, sIndex) => (
                <Box key={section.date} sx={{ mb: 2 }}>
                  {/* Date Header */}
                  <StyledSectionHeader>
                    <CalendarIcon sx={{ fontSize: 18, color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main }} />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
                      }}
                    >
                      {Utility.convertUtcToLocalReadableDate(section.date)}
                    </Typography>
                  </StyledSectionHeader>

                  {/* Timeline Items */}
                  <StyledTimeline>
                    {section.entries.map((entry, eIndex) => {
                      const isUnsuitable = entry.comment === 'Marked as unsuitable'
                      const isDraft = entry.comment === 'Saved as draft'
                      const isFirst = eIndex === 0
                      const isLast = eIndex === section.entries.length - 1

                      return (
                        <TimelineItem key={`${sIndex}-${eIndex}`} sx={{ minHeight: '4rem' }}>
                          <StyledOppositeContent>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
                              }}
                            >
                              {Utility.convertUTCToLocaltime(entry.created_at)}
                            </Typography>
                          </StyledOppositeContent>

                          <TimelineSeparator>
                            <TimelineConnector
                              sx={{
                                visibility: isFirst ? 'hidden' : 'visible',
                                minHeight: isFirst ? 0 : '1rem',
                                backgroundColor: isUnsuitable
                                  ? (theme.palette.customColors?.Error || theme.palette.error.main)
                                  : (theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main),
                                width: '1.5px'
                              }}
                            />
                            <Box
                              sx={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                border: `1px solid ${isUnsuitable
                                  ? (theme.palette.customColors?.Error || theme.palette.error.main)
                                  : (theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main)}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              {isUnsuitable ? (
                                <BlockIcon
                                  sx={{
                                    color: theme.palette.customColors?.Error || theme.palette.error.main,
                                    fontSize: '1.5rem'
                                  }}
                                />
                              ) : (
                                <CheckCircleIcon
                                  sx={{
                                    color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                                    fontSize: '1.5rem'
                                  }}
                                />
                              )}
                            </Box>
                            <TimelineConnector
                              sx={{
                                visibility: isLast ? 'hidden' : 'visible',
                                minHeight: isLast ? 0 : '1rem',
                                backgroundColor: isUnsuitable
                                  ? (theme.palette.customColors?.Error || theme.palette.error.main)
                                  : (theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main),
                                width: '1.5px'
                              }}
                            />
                          </TimelineSeparator>

                          <TimelineContent sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                backgroundColor: isUnsuitable
                                  ? (theme.palette.customColors?.errorContainer || alpha(theme.palette.error.main, 0.1))
                                  : (theme.palette.customColors?.Background || theme.palette.grey[100]),
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
                                  color: isUnsuitable
                                    ? (theme.palette.customColors?.Error || theme.palette.error.main)
                                    : (theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary)
                                }}
                              >
                                {entry.comment}
                              </Typography>

                              {/* User Info */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                                <Avatar
                                  src={entry.user_profile_pic}
                                  sx={{ width: 28, height: 28, fontSize: '12px' }}
                                >
                                  {entry.user_name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography
                                    sx={{
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                                    }}
                                  >
                                    {entry.user_name}
                                  </Typography>
                                  {!isDraft && entry.reason && (
                                    <Typography
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        color: isUnsuitable
                                          ? (theme.palette.customColors?.Tertiary || theme.palette.error.dark)
                                          : theme.palette.text.secondary
                                      }}
                                    >
                                      {entry.reason}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </TimelineContent>
                        </TimelineItem>
                      )
                    })}
                  </StyledTimeline>
                </Box>
              ))}

              {/* Load More */}
              {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Button
                    variant='text'
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    sx={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    {loadingMore ? <CircularProgress size={20} /> : 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default NecropsyTimelineDrawer

// ── Styled Components ────────────────────────────────

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
  backgroundColor: theme.palette.customColors?.Background || theme.palette.grey[100],
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '0.5rem'
}))

const TimelineSkeleton = () => (
  <Box sx={{ px: 2 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Skeleton variant='text' width={50} height={16} />
        <Skeleton variant='circular' width={28} height={28} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant='rounded' width='100%' height={36} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Skeleton variant='circular' width={28} height={28} />
            <Skeleton variant='text' width={100} height={16} />
          </Box>
        </Box>
      </Box>
    ))}
  </Box>
)
