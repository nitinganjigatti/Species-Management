import {
  Avatar,
  CardContent,
  Drawer,
  Grid,
  Typography,
  debounce,
  CircularProgress,
  InputAdornment
} from '@mui/material'
import { Box } from '@mui/system'
import TextField from '@mui/material/TextField'
import React, { useEffect, useState, useCallback } from 'react'
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

interface ActivityLogsProps {
  activitySidebarOpen: boolean
  handleSidebarClose: () => void
  searchValue: string
  setSearchValue: (value: string) => void
  detailsValue: any
  activity_type: string
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({
  activitySidebarOpen,
  handleSidebarClose,
  searchValue,
  setSearchValue,
  detailsValue,
  activity_type
}) => {
  const [activitydata, setActivityData] = useState<any[]>([])
  const [loader, setLoader] = useState<boolean>(false)
  const [page_no, setPage_no] = useState<number>(1)
  const [limit, setLimit] = useState<number>(20)

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

  const getActivityLogs = async (searchVal?: string) => {
    try {
      setLoader(true)

      const params = {
        activity_type_id: detailsValue?.id,
        activity_type,
        page_no,
        limit,
        search_term: searchVal || searchValue
      }
      await getDietActivityLogs(params).then(res => {
        if (res?.data?.success) {
          setLoader(false)
          setActivityData(res?.data?.data)
        } else {
          setLoader(false)
          Toaster({ type: 'error', message: JSON.stringify(res?.data?.message) })
        }
      })
    } catch (error) {
      console.log('error', error)
      setLoader(false)
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

  const activityLogSearch = useCallback(
    debounce(async (value: string) => {
      try {
        await getActivityLogs(value)
      } catch (e) {
        console.log(e)
      }
    }, 500),
    []
  )

  const handleClearSearch = () => {
    setSearchValue('')
    activityLogSearch('')
  }

  useEffect(() => {
    if (detailsValue?.id) {
      getActivityLogs()
    }
  }, [detailsValue?.id, detailsValue?.active, activitySidebarOpen])

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
                      handleSidebarClose(), setSearchValue('')
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value
                    setSearchValue(value)

                    if (value.trim() === '') {
                      activityLogSearch('')
                    } else {
                      activityLogSearch(value)
                    }
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon={'ion:search-outline'} />
                        </InputAdornment>
                      ),
                      endAdornment: searchValue && (
                        <InputAdornment position='end'>
                          <IconButton size='small' onClick={handleClearSearch} edge='end'>
                            <Icon icon={'mdi:close'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Box>
            </Box>
            {loader ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            ) : activitydata?.length > 0 ? (
              <Box>
                {activitydata?.map((item, index) => (
                  <Box key={index}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 'auto' }}>
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
                        size='grow'
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
                      {item?.date_activity?.map((item: any, index: number) => (
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
                                    {/* {item.action === 'diet_assign'
                                      ? Utility.convertUTCToLocalDateTime(item.activity_time)
                                      : `${item.action.charAt(0).toUpperCase() + item.action.slice(1) + ' '} ${
                                          activity_type.charAt(0).toUpperCase() + activity_type.slice(1)
                                        }`} */}
                                    {item.action === 'diet_assign'
                                      ? 'Diet Assigned'
                                      : item?.action === 'is_primary'
                                      ? 'Marked as Primary Diet'
                                      : item?.action === 'unmark_primary'
                                      ? 'Unmarked as Primary Diet'
                                      : `${item.action.charAt(0).toUpperCase() + item.action.slice(1)} ${
                                          activity_type === 'combo'
                                            ? 'Mix'
                                            : activity_type.charAt(0).toUpperCase() + activity_type.slice(1)
                                        }`}
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
                                  {Utility.convertUTCToLocaltime(item.activity_time)}
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
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '70%',
                  textAlign: 'center'
                }}
              >
                <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
              </Box>
            )}
          </Box>
        </CardContent>
      </Drawer>
    </Box>
  )
}

export default ActivityLogs
