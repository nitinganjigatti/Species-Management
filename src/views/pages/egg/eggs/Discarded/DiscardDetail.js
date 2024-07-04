import { Avatar, Box, Card, CardContent, Drawer, Grid, IconButton, Typography, Tab, Divider, Chip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { display } from '@mui/system'

import AddGallery from '../../../../../components/egg/AddGallery'
import EggDisCarded from '../../../../../components/egg/EggDiscarded'


const DiscardDetail = ({ setDetailDrawer, DetailDrawer }) => {
  const theme = useTheme()

  //   const [openDrawer, setOpenDrawer] = useState(false)
  const [status, setStatus] = useState('Overview')

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
  console.log('Status>>', status)

  return (
    <>
      <Drawer
        anchor='right'
        open={DetailDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
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

        <Box className='sidebar-body' sx={{ backgroundColor: 'background.default', height: '120%' }}>
          {status === 'Overview' ? (
            <Box>
              <Box sx={{ px: 4 }}>
                {/* <Typography variant='h6' sx={{ mt: 5 }}>
                Incubator Selection
              </Typography> */}

                <CardContent sx={{ mt: 4, px: 0.5, bgcolor: '#fff', borderRadius: '8px' }}>
                  <Grid sx={{ display: 'flex', mb: 2 }}>
                    <Grid>
                      <Avatar
                        sx={{ width: '150px', height: '150px', borderRadius: '8px', ml: 4, backgroundColor: '#4A0415' }}
                        src={'/icons/Incubator_CON.png'}
                        variant='square'
                      ></Avatar>
                    </Grid>

                    <Grid
                      item
                      xl={3.75}
                      lg={3.9}
                      md={12}
                      sm={5.8}
                      xs={12}
                      sx={{
                        height: '70px',
                        backgroundColor: '#FFD3D3',
                        p: '12px',
                        borderRadius: '8px',
                        width: '330px',
                        alignItems: 'center',
                        ml: 4,
                        mt: 1
                      }}
                    >
                      <Grid container gap={4} alignItems='center'>
                        <Box item xs={7}>
                          <Box sx={{ display: 'flex' }}>
                            <Box>
                              {' '}
                              <Avatar
                                src={'/icons/bar.png'}
                                sx={{
                                  width: '20px',
                                  height: '20px',
                                  mt: 0.5
                                }}
                              />
                            </Box>
                            <Box>
                              {' '}
                              <Typography
                                sx={{
                                  fontWeight: 500,
                                  ml: 2,
                                  mb: '6px',
                                  fontSize: { xxl: '20px', xl: '20px', lg: '18px', xs: '20px' },
                                  lineHeight: '24.2px',
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                Nursery
                              </Typography>
                            </Box>
                          </Box>

                          <Typography
                            sx={{
                              ml: 7,
                              fontWeight: 500,
                              fontSize: '16px',
                              lineHeight: '16.94px',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Nursery Name
                          </Typography>
                        </Box>
                        {/* <Grid item xs={1.2}>
                      <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                    </Grid> */}
                      </Grid>
                      <Box sx={{ mt: 3.5 }}>
                        <Grid
                          item
                          xl={3.75}
                          lg={3.9}
                          md={12}
                          sm={5.8}
                          xs={12}
                          sx={{
                            height: '70px',
                            position: 'relative',
                            backgroundColor: '#FFD3D3',
                            p: '12px',
                            borderRadius: '8px',
                            width: '330px',
                            right: '12px',
                            alignItems: 'center'
                          }}
                        >
                          <Grid container gap={4} alignItems='center'>
                            <Box item xs={7}>
                              <Box sx={{ display: 'flex' }}>
                                <Box>
                                  {' '}
                                  <Avatar
                                    src={'/icons/trash.png'}
                                    sx={{
                                      width: '20px',
                                      height: '20px',
                                      mt: 0.5
                                    }}
                                  />
                                </Box>
                                <Box>
                                  <Typography
                                    sx={{
                                      fontWeight: 500,
                                      ml: 2,
                                      mb: '6px',
                                      fontSize: { xxl: '20px', xl: '20px', lg: '18px', xs: '20px' },
                                      lineHeight: '24.2px',
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >
                                    Discard
                                  </Typography>
                                </Box>
                              </Box>

                              <Typography
                                sx={{
                                  ml: 7,
                                  fontWeight: 500,
                                  fontSize: '16px',
                                  lineHeight: '19.36px',
                                  mb: 3,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                8 Eggs
                              </Typography>
                            </Box>
                            {/* <Grid item xs={1.2}>
                      <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                    </Grid> */}
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid
                    item
                    xl={3.75}
                    lg={3.9}
                    md={12}
                    sm={5.8}
                    xs={12}
                    sx={{
                      height: '78px',
                      backgroundColor: '#FCF4AE',
                      p: '12px',
                      borderRadius: '8px',
                      ml: 3,
                      mt: 6,
                      width: '500px'
                    }}
                  >
                    <Grid container gap={4} alignItems='center'>
                      <Box item xs={7}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            mb: '6px',
                            fontSize: { xl: '14px', lg: '18px', xs: '14px' },
                            fontFamily: 'Inter',
                            lineHeight: '24.2px',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          Notes
                        </Typography>

                        <Typography
                          sx={{
                            mt: 1,
                            fontWeight: 500,
                            fontSize: '16px',
                            lineHeight: '16.94px',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          Type Notes Description Here
                        </Typography>
                      </Box>
                      {/* <Grid item xs={1.2}>
                      <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                    </Grid> */}
                    </Grid>
                  </Grid>
                </CardContent>
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

              <Card>
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: 0,
                    height: '180px',
                    backgroundColor: '#fff',
                    width: '562px',
                    px: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Grid
                    item
                    xl={3.75}
                    lg={3.9}
                    md={12}
                    sm={5.8}
                    xs={12}
                    sx={{
                      height: '78px',
                      backgroundColor: '#FFD3D3',
                      p: '12px',
                      borderRadius: '8px',
                      ml: 3,
                      mb: 12,
                      width: '525px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        variant='square'
                        alt='Medicine Image'
                        sx={{
                          width: 35,
                          height: 35,
                          mr: 2,
                          mt: 1,
                          borderRadius: '50%',
                          background: '#E8F4F2',
                          overflow: 'hidden'
                        }}
                      >
                        <Icon icon='mdi:user' />
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                        <Typography
                          noWrap
                          sx={{
                            color: '#44544A',
                            fontSize: '16px',
                            fontWeight: '400',
                            lineHeight: '16px',
                            fontFamily: 'Inter'
                          }}
                        >
                          Balwinder Singh
                          {/* {item?.user_full_name ? item?.user_full_name : '-'} */}
                        </Typography>
                        <Grid sx={{ display: 'flex' }}>
                          <Grid>
                            <Typography
                              noWrap
                              sx={{
                                color: theme.palette.customColors.neutralSecondary,
                                fontSize: '14px',
                                fontWeight: '400',
                                fontFamily: 'Inter',
                                lineHeight: '16.94px',
                                mt: 0.5
                              }}
                            >
                              Gate12345
                              {/* {item?.created_at ? 'Created on' + ' ' + moment(item?.created_at).format('DD MMM YYYY') : '-'} */}
                            </Typography>
                          </Grid>
                          <Grid>
                            <Typography
                              noWrap
                              sx={{
                                color: theme.palette.customColors.neutralSecondary,
                                fontSize: '14px',
                                fontWeight: '400',
                                fontFamily: 'Inter',
                                lineHeight: '16.94px',
                                mt: 0.5,
                                ml: 56
                              }}
                            >
                              10 April 2024 ,3:34PM
                              {/* {item?.created_at ? 'Created on' + ' ' + moment(item?.created_at).format('DD MMM YYYY') : '-'} */}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography
                          noWrap
                          sx={{
                            color: '#E93353',
                            fontSize: '14px',
                            fontWeight: '400',
                            fontFamily: 'Inter',
                            lineHeight: '16.94px',
                            mt: 0.5
                          }}
                        >
                          Lorem Inpsum dolar sit amer
                          {/* {item?.created_at ? 'Created on' + ' ' + moment(item?.created_at).format('DD MMM YYYY') : '-'} */}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 3
                      }}
                    >
                      <Box>
                        <Avatar
                          src={'/icons/security.png'}
                          sx={{
                            width: '20px',
                            height: '20px',
                            mt: 4
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            textAlign: 'center',
                            mt: 4,
                            color: '#37BD69',
                            fontSize: '16px',
                            fontWeight: 500,
                            fontFamily: 'Inter'
                          }}
                        >
                          SECURITY CHECKED
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Box>
              </Card>
            </Box>
          ) : (
            <EggDisCarded />
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default DiscardDetail
