import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar, Box, Chip, CircularProgress, Drawer, IconButton,
  Tab, Tabs, Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import MuiTimeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import { getZooSettingsHistory } from 'src/lib/api/zoo-settings'

const PAGE_SIZE = 10

const Timeline = styled(MuiTimeline)({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': { display: 'none' }
  }
})

const SECTION_LABELS = {
  general: 'General',
  cluster_management: 'Cluster Management',
  diet_pdf_type: 'Diet PDF',
  request_management: 'Request Management',
  report_recipients: 'Report Distribution'
}

const HistoryEntry = ({ entry }) => {
  const [expanded, setExpanded] = useState(false)
  const theme = useTheme()
  const { custom_data, user_name, user_profile_pic, created_on } = entry
  const hasChange = custom_data?.old_value != null && custom_data?.new_value != null

  return (
    <TimelineItem>
      <TimelineSeparator>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'primary.main',
            boxSizing: 'border-box',
            width: 22, height: 22, borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Icon height='16px' width='16px' icon='material-symbols:edit' />
        </Box>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent
        onClick={() => hasChange && setExpanded(p => !p)}
        sx={{
          py: 0, mb: '20px', cursor: hasChange ? 'pointer' : 'default',
          pb: '20px', borderBottom: '1px solid', borderColor: 'customColors.SurfaceVariant'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
          <Typography
            variant='body2'
            sx={{
              fontSize: 15, fontWeight: 500, lineHeight: 'normal',
              color: 'customColors.OnSurfaceVariant'
            }}
          >
            {custom_data?.message || 'Settings updated'}
          </Typography>
          {hasChange && (
            <Icon
              icon='mdi:chevron-down'
              fontSize={16}
              style={{
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0
              }}
            />
          )}
        </Box>

        {expanded && hasChange && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: '8px', flexWrap: 'wrap' }}>
            <Chip
              size='small'
              label={custom_data.old_value || '(empty)'}
              sx={{
                bgcolor: 'customColors.BgTeritary', color: 'customColors.Tertiary', fontWeight: 500, fontSize: '11px',
                maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
              }}
            />
            <Icon icon='mdi:arrow-right' fontSize={14} style={{ color: theme.palette.customColors.Outline }} />
            <Chip
              size='small'
              label={custom_data.new_value || '(empty)'}
              sx={{
                bgcolor: 'customColors.Surface', color: 'primary.main', fontWeight: 500, fontSize: '11px',
                maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              src={user_profile_pic || '/default-avatar.png'}
              alt={user_name}
              sx={{ width: 24, height: 24 }}
            />
            <Typography
              variant='caption'
              sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant', fontSize: 13 }}
            >
              {user_name}
            </Typography>
          </Box>
          <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: 12 }}>
            {created_on ? Utility.convertUTCToLocaltime(created_on) : ''}
          </Typography>
        </Box>
      </TimelineContent>
    </TimelineItem>
  )
}

const ZooSettingsHistoryDrawer = ({ open, onClose }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all') // 'all' | 'mine'
  const cooldownRef = useRef(false)
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setFilter('all')
    }
  }, [open])

  // Cancel queries when drawer closes
  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries(['zoo-settings-history'])
      cooldownRef.current = false
    }
  }, [open, queryClient])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['zoo-settings-history', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getZooSettingsHistory({ page_no: pageParam, filter })

      return {
        entries: res?.data || [],
        nextPage: (res?.data?.length || 0) === PAGE_SIZE ? pageParam + 1 : undefined,
        total_count: res?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: open,
    retry: false
  })

  const entries = useMemo(() => data?.pages?.flatMap(p => p.entries) || [], [data])

  // Group entries by date
  const grouped = useMemo(() => {
    const groups = {}
    entries.forEach(entry => {
      const date = entry.created_on
        ? Utility.convertUtcToLocalReadableDate(entry.created_on)
        : 'Unknown'
      if (!groups[date]) groups[date] = []
      groups[date].push(entry)
    })

    return Object.entries(groups)
  }, [entries])

  const loadMore = useCallback(() => {
    if (cooldownRef.current || isFetchingNextPage || !hasNextPage) return
    cooldownRef.current = true
    fetchNextPage().finally(() => setTimeout(() => { cooldownRef.current = false }, 300))
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => { if (inView) loadMore() }, [inView, loadMore])

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '520px'] } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.customColors.bodyBg }}>

        {/* Header */}
        <Box sx={{ px: 4, pt: 4, pb: 2, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box
                sx={{
                  p: '4px', borderRadius: '4px', height: 32, width: 32,
                  bgcolor: theme.palette.customColors.mdAntzNeutral,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icon icon='ion:time-outline' />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: '20px', color: 'customColors.OnSurfaceVariant' }}>
                  Settings History
                </Typography>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  Track all changes made to zoo settings
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => refetch()} size='small' disabled={isFetching}>
                <Icon icon='mdi:refresh' fontSize={20} />
              </IconButton>
              <IconButton onClick={onClose} size='small'>
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={filter}
            onChange={(_, val) => setFilter(val)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: 13, fontWeight: 500 },
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
            }}
          >
            <Tab value='all' label='All Changes' />
            <Tab value='mine' label='My Changes' />
          </Tabs>
        </Box>

        {/* Content */}
        {isFetching && entries.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : grouped.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Icon icon='mdi:history' fontSize={48} style={{ marginBottom: 12 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
              No history found
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1, overflowY: 'auto', px: 4, pb: 4,
              '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none'
            }}
          >
            {grouped.map(([date, items]) => (
              <Box key={date}>
                {/* Date header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
                  <Box
                    sx={{
                      display: 'flex', p: '6px 12px', borderRadius: '8px',
                      border: `1px solid ${theme.palette.primary.dark}`
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 'normal', color: theme.palette.primary.dark }}>
                      {date}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1, height: '1px',
                      background: 'linear-gradient(to right, #999 50%, transparent 50%)',
                      backgroundSize: '8px 1px'
                    }}
                  />
                </Box>

                {/* Timeline entries */}
                <Timeline>
                  {items.map(entry => (
                    <HistoryEntry key={entry.id} entry={entry} />
                  ))}
                </Timeline>
              </Box>
            ))}

            {/* Infinite scroll loader */}
            {hasNextPage && (
              <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default ZooSettingsHistoryDrawer
