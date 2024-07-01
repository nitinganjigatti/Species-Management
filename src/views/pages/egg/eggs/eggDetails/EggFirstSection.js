import {
  Avatar,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  ImageListItem,
  ImageListItemBar,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Badge from '@mui/material/Badge'

// ** Third Party Components
import clsx from 'clsx'

// import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { useSettings } from 'src/@core/hooks/useSettings'
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider'

import ConditionSlider from 'src/views/pages/egg/eggs/conditionSlider'
import moment from 'moment'
import AllocationSlider from '../allocationSlider'
import DiscardForm from 'src/components/egg/DiscardForm'

const EggFirstSection = ({ eggDetails, getDetails, GetGalleryImgList }) => {
  const theme = useTheme()

  const {
    settings: { direction }
  } = useSettings()

  // ** States
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openAllocate, setOpenAllocate] = useState(false)
  const [openDiscard, setOpenDiscard] = useState(false)
  const [allocationNurseryId, setAllocationNurseryId] = useState({})

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

  function formatDate(dateString) {
    const now = moment()
    const date = moment(dateString)

    const diffInSeconds = now.diff(date, 'seconds')
    const diffInMinutes = now.diff(date, 'minutes')
    const diffInHours = now.diff(date, 'hours')
    const diffInDays = now.diff(date, 'days')
    const diffInWeeks = now.diff(date, 'weeks')
    const diffInMonths = now.diff(date, 'months')
    const diffInYears = now.diff(date, 'years')

    if (diffInSeconds < 60) {
      return { count: diffInSeconds, label: `Sec` }
    } else if (diffInMinutes < 60) {
      return { count: diffInMinutes, label: `Min${diffInMinutes !== 1 ? 's' : ''}` }
    } else if (diffInHours < 24) {
      return { count: diffInHours, label: `Hour${diffInHours !== 1 ? 's' : ''}` }
    } else if (diffInDays < 7) {
      return { count: diffInDays, label: `Day${diffInDays !== 1 ? 's' : ''}` }
    } else if (diffInWeeks < 4) {
      return { count: diffInWeeks, label: `Week${diffInWeeks !== 1 ? 's' : ''}` }
    } else if (diffInMonths < 12) {
      return { count: diffInMonths, label: `Month${diffInMonths !== 1 ? 's' : ''}` }
    } else {
      return { count: diffInYears, label: `Year${diffInYears !== 1 ? 's' : ''}` }
    }
  }

  const calculatePercentageChange = (value1, value2) => {
    const numValue1 = parseFloat(value1)
    const numValue2 = parseFloat(value2)

    const difference = numValue2 - numValue1
    const percentageChange = (difference / numValue1) * 100

    return percentageChange.toFixed()
  }

  let displayText
  let displayTextColor

  if (eggDetails?.assessments_data?.length == 0 || eggDetails?.assessments_data?.length == 1) {
    displayText = ``
  } else if (eggDetails?.assessments_data?.length > 1) {
    const firstValue = eggDetails?.assessments_data[0]?.assessment_value
    const secondValue = eggDetails?.assessments_data[1]?.assessment_value

    const percentageChange = calculatePercentageChange(secondValue, firstValue)
    displayText =
      percentageChange == 0
        ? 'No Change'
        : percentageChange > 0
        ? `+${percentageChange}% Increased`
        : `${percentageChange}% Reduced`
    displayTextColor =
      percentageChange == 0
        ? theme.palette.customColors.neutralSecondary
        : percentageChange > 0
        ? theme.palette.primary.main
        : theme.palette.formContent.tertiary
  } else {
    displayText = 'No data'
    displayTextColor = theme.palette.customColors.OnSurfaceVariant
  }

  useEffect(() => {
    if (eggDetails?.nursery_id) {
      setAllocationNurseryId({ nursery_id: eggDetails?.nursery_id, nursery_name: eggDetails?.nursery_name })
    }
  }, [])

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
                  <ImageListItem
                    style={{ height: '100%', backgroundColor: theme.palette.background.default, borderRadius: '8px' }}
                  >
                    <img
                      srcSet={eggDetails?.default_icon}
                      src={eggDetails?.default_icon}
                      alt='default_icon'
                      loading='lazy'
                      height={'100%'}
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
                        created on {moment(eggDetails?.created_at).format('DD MMM YYYY')}
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
                    {Number(eggDetails?.action_to_be_taken) === 6 ||
                    Number(eggDetails?.action_to_be_taken) === 7 ? null : (
                      <Box>
                        <Button onClick={() => setOpenDiscard(true)} variant='outlined' sx={{ height: '100%' }}>
                          DISCARD
                        </Button>
                      </Box>
                    )}
                    {Number(eggDetails?.action_to_be_taken) === 4 ? (
                      <Box>
                        <Button onClick={() => setOpenAllocate(true)} variant='contained'>
                          ALLOCATE
                        </Button>
                      </Box>
                    ) : null}
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
                  <Grid container justifyContent='space-between' alignItems='center'>
                    <Grid
                      item
                      xs={3}
                      sx={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        padding: '8px',
                        backgroundColor: theme.palette.primary.light
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.primary.contrastText,
                          fontWeight: 600,
                          fontSize: '28px',
                          lineHeight: '33.89px',
                          textAlign: 'center'
                        }}
                      >
                        {' '}
                        {formatDate(eggDetails?.collection_date)?.count}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.palette.primary.contrastText,
                          fontWeight: 600,
                          fontSize: '16px',
                          lineHeight: '19.36px',
                          textAlign: 'center'
                        }}
                      >
                        {' '}
                        {formatDate(eggDetails?.collection_date)?.label}
                      </Typography>
                    </Grid>

                    <Grid item xs={7}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          mb: '6px',
                          fontSize: { xxl: '20px', xl: '20px', lg: '18px', xs: '20px' },
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {moment(eggDetails?.collection_date).format('DD MMM YYYY')}
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Found date
                      </Typography>
                    </Grid>
                    <Grid item xs={1.2}>
                      <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                    </Grid>
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
                    display: 'flex',
                    height: '88px',
                    backgroundColor: '#AFEFEB4D',
                    p: '12px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Grid container justifyContent='space-between' alignItems='center'>
                    <Grid
                      item
                      xs={3}
                      sx={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        padding: '8px',
                        backgroundColor: '#00D6C9'
                      }}
                    >
                      <Avatar
                        sx={{ width: '100%', height: '100%', borderRadius: '8px', aspectRatio: 2 / 2 }}
                        src={'/icons/weightColor.png'}
                        variant='square'
                      ></Avatar>
                    </Grid>
                    <Grid item xs={7}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '18px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        {eggDetails?.assessments_data &&
                          (eggDetails?.assessments_data?.length === 0
                            ? 'Not Added'
                            : eggDetails?.assessments_data[0]?.assessment_value +
                              ' ' +
                              eggDetails?.assessments_data[0]?.uom_abbr)}
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color:
                            eggDetails?.assessments_data?.length == 1 || eggDetails?.assessments_data?.length == 0
                              ? theme.palette.primary.main
                              : displayTextColor
                        }}
                      >
                        {eggDetails?.assessments_data?.length == 1 || eggDetails?.assessments_data?.length == 0
                          ? 'Current weight'
                          : displayText}
                      </Typography>
                    </Grid>
                    <Grid item xs={1.2}>
                      <Icon style={{ cursor: 'pointer' }} color='#00AFD6' icon='fontisto:angle-right' fontSize={16} />
                    </Grid>
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
                    display: 'flex',
                    height: '88px',
                    backgroundColor:
                      eggDetails?.egg_status === ('Fresh' || 'Fertile' || 'Hatched')
                        ? '#37BD691A'
                        : eggDetails?.egg_status === 'Discard'
                        ? '#FFBDA84D'
                        : '#37BD691A',

                    p: '12px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Grid container justifyContent='space-between' alignItems='center'>
                    <Grid
                      item
                      xs={3}
                      sx={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        padding: '8px',
                        backgroundColor: theme.palette.primary.contrastText
                      }}
                    >
                      <Avatar
                        sx={{ width: '100%', height: '100%', borderRadius: '8px' }}
                        src={
                          eggDetails?.egg_status === ('Fresh' || 'Fertile')
                            ? '/icons/Egg Fertile.png'
                            : eggDetails?.egg_status === 'Discard'
                            ? '/icons/Egg Discard.png'
                            : eggDetails?.egg_status === 'Hatched'
                            ? '/icons/Egg Hatched.png'
                            : '/icons/Egg Fertile.png'
                        }
                        variant='square'
                      ></Avatar>
                    </Grid>

                    <Grid item xs={7}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '18px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {eggDetails?.egg_status}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color:
                            eggDetails?.egg_status === ('Fresh' || 'Fertile' || 'Hatched')
                              ? theme.palette.primary.main
                              : eggDetails?.egg_status == 'Discard'
                              ? theme.palette.formContent.tertiary
                              : theme.palette.primary.main
                        }}
                      >
                        {eggDetails?.egg_state} Condition
                      </Typography>
                    </Grid>

                    <Grid item xs={1.2}>
                      <IconButton
                        disabled={Number(eggDetails?.action_to_be_taken) != 5}
                        onClick={() => setOpenDrawer(true)}
                      >
                        <Icon
                          style={{ cursor: 'pointer' }}
                          color={Number(eggDetails?.action_to_be_taken) != 5 ? '#7A8684' : '#00AFD6'}
                          icon='fontisto:angle-right'
                          fontSize={16}
                        />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {openDrawer && (
        <ConditionSlider
          GetGalleryImgList={GetGalleryImgList}
          eggDetails={eggDetails}
          getDetails={getDetails}
          setOpenDrawer={setOpenDrawer}
          openDrawer={openDrawer}
          eggId={eggDetails?.egg_id}
        />
      )}

      {openAllocate && (
        <AllocationSlider
          allocationValues={allocationNurseryId}
          setOpenDrawer={setOpenAllocate}
          allocateEggId={eggDetails?.egg_id}
        />
      )}
      <DiscardForm isOpen={openDiscard} setIsOpen={setOpenDiscard} eggID={eggDetails?.egg_id} />
    </>
  )
}

export default EggFirstSection
