import { Drawer, LinearProgress, Typography, IconButton, Collapse } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'
import { getActivityLogs } from 'src/lib/api/egg/egg'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import moment from 'moment'
import Utility from 'src/utility'

// Styled Timeline component
const Timeline = styled(MuiTimeline)({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

const EggActivityLogs = ({
  activtyLogData,
  setActivtyLogData,
  activtyLogCount,
  setActivtyLogCount,
  activtyLogSideBar,
  setActivtyLogSideBar,
  egg_id
}) => {
  const theme = useTheme()

  // const [activtyLogData, setActivtyLogData] = useState([])
  // const [activtyLogCount, setActivtyLogCount] = useState(0)
  let [page_no, setPage_no] = useState(1)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [showCommentIndex, setShowCommentIndex] = useState(null)

  const getActivityLogsFunc = () => {
    const params = { page_no }
    try {
      getActivityLogs(egg_id, params).then(res => {
        if (res.success) {
          setActivtyLogData(res?.data?.result)
          setActivtyLogCount(res?.data?.total_count)
        } else {
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (
      container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight &&
      activtyLogData.length < activtyLogCount
    ) {
      // User has reached the bottom, perform your action here
      setPage_no(++page_no)
      setReachedEnd(true)
      const params = { page_no }

      try {
        getActivityLogs(egg_id, params).then(res => {
          if (res?.success) {
            if (res?.data?.result?.length > 0) {
              setActivtyLogData(prev => [...prev, ...res?.data?.result])
              setReachedEnd(false)
            } else {
              setReachedEnd(false)
            }
          } else {
            setReachedEnd(false)
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  useEffect(() => {
    getActivityLogsFunc()
  }, [])

  function formatText(text) {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleToggleComment = index => {
    setShowCommentIndex(showCommentIndex === index ? null : index)
  }

  return (
    <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
      <Drawer
        anchor='right'
        open={activtyLogSideBar}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', 520] },
          height: '100vh',
          '& .css-e1dg5m-MuiCardContent-root': {
            pt: 0
          }
        }}
      >
        <Box
          sx={{
            pb: 4,
            pt: 4,
            px: 4,
            position: 'sticky',
            top: 0,
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 100
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              width: '100%',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'start'
            }}
          >
            <Box
              sx={{
                padding: '4px',
                borderRadius: '4px',
                height: '32px',
                width: '32px',
                backgroundColor: theme.palette.customColors.mdAntzNeutral
              }}
            >
              <Icon icon={'ion:time-outline'} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: '24px' }}>Activity Log</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setActivtyLogSideBar(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <Box onScroll={handleScroll} sx={{ px: 4, pt: 8, overflowY: 'auto' }}>
          {activtyLogData?.length > 0 ? (
            <Timeline>
              {activtyLogData?.map((item, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator
                    sx={{
                      '& span': {
                        backgroundColor:
                          item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                            ? theme.palette.formContent.tertiary
                            : // : theme.palette.primary.main
                              theme.palette.primary.light
                      }
                    }}
                  >
                    <Box
                      sx={{
                        border: '2px solid ',
                        borderColor:
                          item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                            ? theme.palette.formContent.tertiary
                            : // : theme.palette.primary.main,
                              theme.palette.primary.light,

                        // backgroundColor: item.status === 'Fresh' ? theme.palette.primary.main : null,
                        boxSizing: 'border-box',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon
                        height={'16px'}
                        width={'16px'}
                        style={{
                          color:
                            item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                              ? theme.palette.formContent.tertiary
                              : // : theme.palette.primary.main
                                theme.palette.primary.light
                        }}
                        icon={
                          item.status === 'Fresh'
                            ? // ? 'ic:outline-check'
                              'ic:sharp-check-circle'
                            : // : item.status === 'Swapped'
                              // ? 'ic:sharp-check-circle'
                              // : item.status === 'deleted'
                              // ? 'ic:sharp-check-circle'
                              'ic:sharp-check-circle'
                        }
                      />
                    </Box>
                    {activtyLogData.length === index + 1 ? null : <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent
                    onClick={() => handleToggleComment(index)}
                    sx={{
                      ml: 4,
                      borderRadius: '8px',
                      // mb: '20px',
                      position: 'relative',
                      top: -28,
                      p: 0
                    }}
                  >
                    <Box
                      sx={{
                        cursor: 'pointer',
                        backgroundColor:
                          (showCommentIndex === index && item.status === 'Necropsy') ||
                          (showCommentIndex === index && item.status === 'Discard') ||
                          (showCommentIndex === index && item.status === 'Rotten')
                            ? theme.palette.formContent.tertiary
                            : item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                            ? '#FFBDA84D'
                            : showCommentIndex === index
                            ? theme.palette.primary.light
                            : '#37BD691A',
                        // backgroundColor:
                        //   showCommentIndex === index
                        //     ? theme.palette.primary.light
                        //     : item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                        //     ? '#FFBDA84D'
                        //     : '#37BD691A',
                        p: '16px',
                        transition: '0.4s ease-in-out',
                        display: 'flex',
                        borderRadius: showCommentIndex === index ? 'none' : '8px',
                        borderTopLeftRadius: showCommentIndex === index ? '8px' : 'none',
                        borderTopRightRadius: showCommentIndex === index ? '8px' : 'none',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ flex: 5 }}>
                        <Typography
                          sx={{
                            mr: 2,
                            fontSize: 14,
                            fontWeight: showCommentIndex === index ? 500 : 600,
                            lineHeight: '16.94px',
                            letterSpacing: showCommentIndex === index && '0.1px',
                            mb: '4px',
                            color:
                              showCommentIndex === index
                                ? '#FFFFFF'
                                : item.status === 'Necropsy' || item.status === 'Discard' || item.status === 'Rotten'
                                ? theme.palette.formContent.tertiary
                                : theme.palette.primary.light
                          }}
                        >
                          {item.status}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: showCommentIndex === index ? 500 : 400,
                            lineHeight: '19.36px',
                            color: showCommentIndex === index ? '#fff' : theme.palette.primary.light
                          }}
                        >
                          {item.action ? formatText(item.action) : '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 2,
                          justifyContent: 'end'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                          <Typography
                            sx={{
                              color: showCommentIndex === index ? '#fff' : theme.palette.customColors.OnSurfaceVariant,
                              fontSize: 14,
                              mb: '4px',
                              fontWeight: 400,
                              lineHeight: '16.94px'
                            }}
                          >
                            {Utility.formatDisplayDate(Utility.convertUTCToLocal(item?.created_at))}
                          </Typography>
                          <Typography
                            sx={{
                              color: showCommentIndex === index ? '#fff' : theme.palette.customColors.OnSurfaceVariant,
                              fontSize: 14,
                              fontWeight: 400,
                              lineHeight: '16.94px'
                            }}
                          >
                            {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item?.created_at))}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Collapse in={showCommentIndex === index} timeout={400} unmountOnExit>
                      <Typography
                        sx={{
                          backgroundColor: '#FCF4AE',
                          borderBottomLeftRadius: showCommentIndex === index ? '8px' : 'none',
                          borderBottomRightRadius: showCommentIndex === index ? '8px' : 'none',
                          mb: '4px',
                          p: '12px',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: '16.94px',
                          letterSpacing: '0.1px'
                        }}
                      >
                        {item?.comments}
                      </Typography>
                    </Collapse>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : null}
        </Box>
        {reachedEnd ? <LinearProgress /> : null}
      </Drawer>{' '}
    </Box>
  )
}

export default EggActivityLogs
