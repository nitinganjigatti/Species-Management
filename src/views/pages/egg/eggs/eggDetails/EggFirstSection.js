import { Avatar, Button, Card, CardContent, Grid, ImageListItem, ImageListItemBar, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Badge from '@mui/material/Badge'

// ** Third Party Components
import clsx from 'clsx'
// import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { useSettings } from 'src/@core/hooks/useSettings'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'

import ConditionSlider from 'src/views/pages/egg/eggs/oonditionSlider'
import moment from 'moment'

const EggFirstSection = ({ eggDetails }) => {
  const theme = useTheme()
  const {
    settings: { direction }
  } = useSettings()
  // ** States
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [openDrawer, setOpenDrawer] = useState(false)

  // ** Hook
  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: direction === 'rtl',
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    created() {
      setLoaded(true)
    }
  })
  return (
    <>
      <Card>
        <CardContent>
          <Grid container>
            <Grid
              sx={{ pr: { xl: '24px', lg: '10px', md: '24px', alignSelf: 'stretch' } }}
              item
              xs={12}
              md={6}
              lg={2.7}
              xl={3}
            >
              <Box sx={{ borderRadius: '8px', height: '100%' }}>
                {eggDetails?.egg_images?.length ? (
                  <KeenSliderWrapper>
                    <>
                      <Box sx={{ position: 'relative' }} className='navigation-wrapper'>
                        <Box sx={{ position: 'absolute' }} ref={sliderRef} className='keen-slider'>
                          {eggDetails?.egg_images?.map(item => (
                            <Box key={item?.id} className='keen-slider__slide'>
                              <ImageListItem>
                                <img
                                  srcSet={item?.egg_image || eggDetails?.default_icon}
                                  src={item?.egg_image || eggDetails?.default_icon}
                                  alt={item?.action}
                                  loading='lazy'
                                />
                                <ImageListItemBar sx={{ pb: 5 }} title={item?.action} subtitle={item?.action} />
                              </ImageListItem>
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ width: '100%', position: 'absolute', bottom: 14 }} className='swiper-dots'>
                          {loaded && instanceRef.current && (
                            <Box className='swiper-dots'>
                              {[...Array(instanceRef.current.track.details.slides.length).keys()].map(idx => {
                                return (
                                  <Badge
                                    key={idx}
                                    variant='dot'
                                    component='div'
                                    className={clsx({
                                      active: currentSlide === idx
                                    })}
                                    style={{ backgroundColor: '#fff' }}
                                    //   sx={{ backgroundColor: '#FFFFFF66' }}
                                    onClick={() => {
                                      instanceRef.current?.moveToIdx(idx)
                                    }}
                                  ></Badge>
                                )
                              })}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </>
                  </KeenSliderWrapper>
                ) : (
                  <ImageListItem>
                    <img
                      srcSet={eggDetails?.default_icon}
                      src={eggDetails?.default_icon}
                      alt='default_icon'
                      loading='lazy'
                    />

                    <ImageListItemBar
                      sx={{ pb: 0 }}
                      title={eggDetails?.default_common_name}
                      // subtitle={'Trichoglossus Moluccanus'}
                    />
                  </ImageListItem>
                )}
              </Box>
            </Grid>
            <Grid
              sx={{
                alignSelf: 'stretch',
                height: '100%',
                py: { xs: '24px', sm: '24px', md: '0px', lg: '0px', xl: '0px' }
              }}
              xs={12}
              md={6}
              // lg={9}
              lg={9.3}
              xl={9}
              item
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'column', md: 'column', lg: 'row' },
                  justifyContent: 'space-between',
                  mb: '24px'
                }}
              >
                <Typography
                  sx={{
                    textAlign: { xs: 'center', sm: 'start' },
                    fontWeight: 600,
                    fontSize: '36px',
                    lineHeight: '43.57px',
                    mb: { xs: 4 },
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {eggDetails?.egg_code || 'egg_code'}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: { sm: 'space-between' },
                    gap: '24px',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Box>
                      <Avatar src={eggDetails?.user_profile_pic} alt={eggDetails?.user_profile_pic}></Avatar>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {eggDetails?.user_full_name || 'user_full_name'}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '14.52px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        Updated on 1 Apr 2024
                      </Typography>
                    </Box>
                    {/* <Box>
                      {' '}
                      <Icon
                        style={{ cursor: 'pointer' }}
                        color={theme.palette.customColors.OnSurfaceVariant}
                        icon='bi:pencil'
                        fontSize={32}
                      />
                    </Box> */}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '8px' }}>
                    <Box>
                      <Button variant='outlined' sx={{ height: '100%' }}>
                        DISCARD
                      </Button>
                    </Box>
                    <Box>
                      <Button variant='contained' onClick={() => setOpenDrawer(true)}>
                        ALLOCATE
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Grid
                container
                gap={{ xs: '24px', sm: '16px', md: '16px', lg: '0px', xl: '2px', xxl: '2px' }}
                sx={{ justifyContent: 'space-between' }}
              >
                <Grid
                  item
                  xl={3.75}
                  lg={3.9}
                  md={12}
                  sm={5.8}
                  xs={12}
                  sx={{
                    display: 'flex',
                    height: '88px',
                    backgroundColor: '#FCF4AEB3',
                    p: '12px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Avatar sx={{ width: '64px', height: '64px', borderRadius: '8px' }} variant='square'></Avatar>
                  <Box sx={{}}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        mb: '6px',
                        fontSize: '20px',
                        lineHeight: '24.2px',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {moment(eggDetails?.lay_date).format('DD MMM YYYY')}
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Lay date
                    </Typography>
                  </Box>
                  <Box>
                    <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                  </Box>
                </Grid>
                <Grid
                  item
                  xl={3.75}
                  lg={3.9}
                  md={12}
                  sm={5.8}
                  xs={12}
                  sx={{
                    display: 'flex',
                    height: '88px',
                    backgroundColor: '#AFEFEB4D                   ',
                    p: '12px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Avatar sx={{ width: '64px', height: '64px', borderRadius: '8px' }} variant='square'></Avatar>

                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        Not Added
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.primary.main
                        }}
                      >
                        Current weight
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                  </Box>
                </Grid>
                <Grid
                  item
                  xl={3.75}
                  lg={3.9}
                  md={12}
                  sm={5.8}
                  xs={12}
                  sx={{
                    display: 'flex',
                    height: '88px',
                    backgroundColor: '#37BD691A',
                    p: '12px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Avatar sx={{ width: '64px', height: '64px', borderRadius: '8px' }} variant='square'></Avatar>

                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {eggDetails?.egg_condition}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.primary.main
                        }}
                      >
                        Warm Condition
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {openDrawer && <ConditionSlider setOpenDrawer={setOpenDrawer} />}
    </>
  )
}

export default EggFirstSection
