import {
  Avatar,
  Box,
  Card,
  CardContent,
  Drawer,
  Grid,
  IconButton,
  Typography,
  Tab,
  Divider,
  Chip,
  Stack
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'

import AddGallery from '../../../../../components/egg/AddGallery'
import EggDisCarded from '../../../../../components/egg/EggDiscarded'
import { GetDiscardedSummary } from 'src/lib/api/egg/discard'
import { position } from 'stylis'

const DiscardDetail = ({ setDetailDrawer, detailDrawer, eggDiscardedId }) => {
  const theme = useTheme()
  const [status, setStatus] = useState('Overview')
  const [summary, setSummary] = useState({})
  console.log('summary :>> ', summary)

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', width: '250px' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const handleChange = (event, newValue) => {
    // setTotal(0)
    setStatus(newValue)
  }

  const getSummary = async id => {
    const params = {
      egg_discard_id: id
    }
    try {
      const res = await GetDiscardedSummary(params)
      setSummary(res?.data?.data)
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    if (eggDiscardedId) {
      getSummary(eggDiscardedId)
    }
  }, [detailDrawer])

  return (
    <>
      <Drawer
        anchor='right'
        open={detailDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' }

          // backgroundColor: 'background.default'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            <Typography variant='h6'>Discard Details</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setDetailDrawer(false)} />
            </IconButton>
          </Box>
        </Box>

        <TabContext value={status} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <TabList onChange={handleChange} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tab value='Overview' label={<TabBadge label='Overview' />} />
            <Tab value='Eggs-8' label={<TabBadge label='Eggs-8' />} />
          </TabList>
          <TabPanel value='Overview' sx={{ p: 0 }}>
            {' '}
            <Divider sx={{ width: '200px' }} />
            {/* {tableData()} */}
          </TabPanel>
          <TabPanel value='Eggs-8' sx={{ p: 0 }}>
            <Divider />
            {/* {tableData()} */}
          </TabPanel>
        </TabContext>

        {/* drower */}

        <Box
          className='sidebar-body'
          sx={{ backgroundColor: 'background.default', height: 'calc(100vh - 144px)', overflowY: 'auto' }}
        >
          {status === 'Overview' ? (
            <Box sx={{ mb: 20 }}>
              <Box sx={{ px: 4 }}>
                <Card
                  sx={{
                    mt: 4,
                    p: '20px 16px 20px 16px',
                    bgcolor: '#fff',
                    borderRadius: '8px',
                    gap: '24px'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '24px' }}>
                    <Box sx={{ p: 1, width: '135px', height: '135px' }}>
                      <img
                        src={summary?.qr_code ? summary?.qr_code : '/icons/Incubator_CON.png'}
                        style={{ width: '100%', height: '100%' }}
                        alt='QR Code'
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '340px' }}>
                      <Box
                        sx={{
                          bgcolor: '#FFD3D3',
                          widows: '340px',
                          height: '60px',
                          px: '12px',
                          py: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={'/icons/bar.png'}
                            sx={{
                              width: '20px',
                              height: '20px'
                            }}
                          />

                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              color: '#44544A'
                            }}
                          >
                            Nursery
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            color: '#44544A',
                            ml: 7
                          }}
                        >
                          {summary?.nursery_name ? summary?.nursery_name : '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: '#FFD3D3',
                          widows: '340px',
                          height: '60px',
                          px: '12px',
                          py: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          borderBottomLeftRadius: '8px',
                          borderBottomRightRadius: '8px'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={'/icons/trash.png'}
                            sx={{
                              width: '20px',
                              height: '20px'
                            }}
                          />

                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              color: '#44544A'
                            }}
                          >
                            Discard
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            color: '#44544A',
                            ml: 7
                          }}
                        >
                          {summary?.egg_count ? summary?.egg_count : '-'} Eggs
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: '100%',
                      height: '64px',
                      borderRadius: '8px',
                      gap: '12px',
                      bgcolor: '#FCF4AE',
                      mt: '20px',
                      p: '12px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        color: '#44544A'
                      }}
                    >
                      Notes
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '16px',
                        color: '#44544A'
                      }}
                    >
                      {summary?.reason ? summary?.reason : '-'}
                    </Typography>
                  </Box>
                </Card>
              </Box>
              <Typography
                sx={{
                  mt: 6,
                  ml: 4,
                  fontSize: '20px',
                  fontWeight: 500,
                  fontFamily: 'Inter',
                  lineHeight: '24.2px',
                  color: '#44544A'
                }}
              >
                Added Photos
              </Typography>
              <AddGallery />

              {summary?.activity_status === 'DISCARD_REQUEST_GENERATED' ? (
                <Box
                  sx={{
                    width: '562px',
                    height: '82px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: theme.palette.background.paper,
                    position: 'fixed',
                    bottom: 0
                  }}
                >
                  <Stack direction='row' gap={2} alignItems={'center'}>
                    <img src='/icons/pending_security_check_icon.png' alt='Pending' />
                    <Typography sx={{ textTransform: 'uppercase', fontSize: '15px', fontWeight: 500 }}>
                      Security Check Pending
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '562px',
                    height: '174px',
                    display: 'flex',
                    justifyContent: 'center',
                    px: '24px',
                    py: '16px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: theme.palette.background.paper,
                    position: 'fixed',
                    bottom: 0,
                    gap: '16px'
                  }}
                >
                  <Box
                    sx={{
                      width: '530px',
                      height: '86px',
                      p: '12px',
                      display: 'flex',
                      gap: '12px',
                      borderRadius: '8px',
                      bgcolor: '#FFD3D3'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Avatar
                        variant='circular'
                        alt='User Profile'
                        sx={{
                          width: 30,
                          height: 30,
                          mr: 4,
                          borderRadius: '50%',
                          background: '#E8F4F2',
                          overflow: 'hidden'
                        }}
                      >
                        {summary.profile_pic ? (
                          <img
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            src={summary.profile_pic}
                            alt='Profile'
                          />
                        ) : (
                          <Icon icon='mdi:user' fontSize={25} color={'#FA6140'} />
                        )}
                      </Avatar>

                      <Stack>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Balwinder Singh</Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Gate12345</Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#E93353' }}>
                          {' '}
                          Lorem ipsum dolar sit amet
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                  <Box>
                    <Stack direction='row' gap={2} alignItems={'center'}>
                      <img src='/icons/security_check_icon.png' alt='Pending' />
                      <Typography
                        sx={{
                          textTransform: 'uppercase',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: theme.palette.primary.main
                        }}
                      >
                        Security Checked
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <EggDi sCarded />
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default DiscardDetail
