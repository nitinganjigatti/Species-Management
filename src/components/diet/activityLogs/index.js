import { Avatar, CardContent, Drawer, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import TextField from '@mui/material/TextField'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'

// import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import Icon from 'src/@core/components/icon'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import { getDietActivityLogs } from 'src/lib/api/diet/getIngredients'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

// import UserSnackbar from 'src/components/utility/snackbar'

const ActivityLogs = ({
  activitySidebarOpen,
  handleSidebarClose,
  searchValue,
  setSearchValue,
  detailsValue,
  activity_type
}) => {
  const [activitydata, setActivityData] = useState([])
  const [page_no, setPage_no] = useState(1)
  const [limit, setLimit] = useState(20)

  // const [openSnackbar, setOpenSnackbar] = useState({
  //   open: false,
  //   severity: '',
  //   message: ''
  // })
  const theme = useTheme()

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

  const getActivityLogs = async searchVal => {
    try {
      const params = {
        activity_type_id: detailsValue?.id,
        activity_type,
        page_no,
        limit,
        search_term: searchVal || searchValue
      }
      await getDietActivityLogs(params).then(res => {
        if (res?.data?.success) {
          setActivityData(res?.data?.data)
        } else {
          Toaster({ type: 'error', message: JSON.stringify(res?.data?.message) })
        }
      })
    } catch (error) {
      console.log('error', error)
      Toaster({ type: 'error', message: JSON.stringify(error) })

      // Toaster({ type: 'error', message: JSON.stringify(error) })

      // setOpenSnackbar({
      //   ...openSnackbar,
      //   open: true,
      //   message: JSON.stringify(error),
      //   severity: 'error'
      // })
    }
  }

  // const activityLogSearch = useCallback(
  //   debounce(async value => {
  //     try {
  //       await getActivityLogs(value)
  //     } catch (e) {
  //       console.log(e)
  //     }
  //   }, 500),
  //   []
  // )

  useEffect(() => {
    if (detailsValue?.id) {
      getActivityLogs()
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
      <Drawer
        anchor='right'
        open={activitySidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', 520] },
          height: '100vh',
          '& .css-e1dg5m-MuiCardContent-root': {
            pt: 0
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box sx={{ pb: 4, pt: 4, position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
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
                  <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                    {/* View a detailed history of ingredient actions, including updates, activations, and deactivations */}
                    View a detailed history of {activity_type.charAt(0).toUpperCase() + activity_type.slice(1)} actions,
                    including updates, activations, and deactivations
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size='small'
                    onClick={() => {
                      handleSidebarClose()
                    }}
                    sx={{ color: 'text.primary' }}
                  >
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ mt: '24px' }}>
                <TextField
                  value={searchValue}
                  fullWidth
                  label='Search activity'
                  InputProps={{
                    startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
                  }}
                  onChange={e => {
                    setSearchValue(e.target.value)
                    activityLogSearch(e.target.value)
                  }}
                />
              </Box>
            </Box>
            {activitydata?.length > 0 ? (
              <Box>
                {activitydata?.map((item, index) => (
                  <Box key={index}>
                    <Grid container spacing={3}>
                      <Grid item xs='auto'>
                        <Box
                          sx={{
                            display: 'flex',
                            p: '8px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.primary.dark}`
                          }}
                        >
                          {/* <Typography
                    sx={{ fontSize: 14, fontWeight: 500, lineHeight: 'normal', color: theme.palette.primary.dark }}
                  >
                    Today,&nbsp;
                  </Typography> */}
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: 'normal',
                              color: theme.palette.primary.dark
                            }}
                          >
                            {item.date}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        item
                        xs
                      >
                        <Box
                          sx={{
                            flex: 1,
                            height: '1px',
                            background: 'linear-gradient(to right, #999 50%, transparent 50%)',
                            backgroundSize: '8px 1px'
                          }}
                        ></Box>
                      </Grid>
                    </Grid>
                    <Timeline>
                      {item?.date_activity?.map((item, index) => (
                        <TimelineItem key={index}>
                          <TimelineSeparator
                            sx={{
                              '& span': {
                                backgroundColor: item.action === 'activated' ? theme.palette.primary.main : null
                              }
                            }}
                          >
                            {/* <TimelineDot color='success' /> */}
                            <Box
                              sx={{
                                border: '1px solid ',
                                borderColor: item.action === 'activated' ? theme.palette.primary.main : null,
                                backgroundColor: item.action === 'activated' ? theme.palette.primary.main : null,
                                boxSizing: 'border-box',
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon
                                height={'16px'}
                                width={'16px'}
                                icon={
                                  item.action === 'activated'
                                    ? 'mdi:clipboard-outline'
                                    : item.action === 'deactivated'
                                    ? 'mdi:clipboard-off-outline'
                                    : item.action === 'Swapped'
                                    ? 'material-symbols:repeat'
                                    : item.action === 'edited'
                                    ? 'material-symbols:edit'
                                    : item.action === 'deleted'
                                    ? 'ic:baseline-delete'
                                    : null
                                }
                                color={item.action === 'activated' ? '#fff' : null}

                                // style={item.action === 'Swapped' ? { transform: 'rotateY(180deg)' } : null}
                              />
                            </Box>
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: 0, mb: '20px' }}>
                            <Typography
                              variant='body2'
                              sx={{
                                mr: 2,
                                fontSize: 16,
                                fontWeight: 500,
                                lineHeight: 'normal',
                                mb: '12px',
                                color:
                                  item.action === 'activated'
                                    ? theme.palette.primary.main
                                    : theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              {item.title}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                justifyContent: 'space-between',
                                mb: '20px'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Avatar src={item?.profile_pic} sx={{ width: '2rem', height: '2rem', mr: 2 }} />
                                <Box>
                                  <Typography
                                    variant='subtitle2'
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: 14,
                                      fontWeight: 500,
                                      lineHeight: 'normal'
                                    }}
                                  >
                                    {item.user_name}
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      fontSize: 14,
                                      fontWeight: 400,
                                      lineHeight: 'normal',
                                      color: theme.palette.customColors.neutralSecondary
                                    }}
                                  >
                                    {item.action.charAt(0).toUpperCase() + item.action.slice(1) + ' '}
                                    {activity_type.charAt(0).toUpperCase() + activity_type.slice(1)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ alignSelf: 'self-start' }}>
                                <Typography
                                  sx={{
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    lineHeight: 'normal'
                                  }}
                                  variant='caption'
                                >
                                  {item.activity_time}
                                </Typography>
                              </Box>
                            </Box>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </Box>
                ))}
                {/* {openSnackbar.open ? (
                  <UserSnackbar
                    severity={openSnackbar?.severity}
                    status={true}
                    message={openSnackbar?.message}
                    handleClose={() => setOpenSnackbar({ ...openSnackbar, open: false })}
                  />
                ) : null} */}
              </Box>
            ) : null}
          </Box>
        </CardContent>
      </Drawer>
    </Box>
  )
}

export default ActivityLogs
