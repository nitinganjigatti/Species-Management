// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Components
import clsx from 'clsx'
import { useKeenSlider } from 'keen-slider/react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import { bgcolor, fontWeight, padding } from '@mui/system'
import { Avatar } from '@mui/material'
import Utility from 'src/utility'

const data = [
  {
    title: 'Transactions',
    img: '/dashboard/medical_record1.svg',
    details: {
      Requests: '5k',
      Purchase: '2k',
      Received: '6k',
      Return: '1k'
    }
  },
  {
    title: 'Active records',
    img: '/dashboard/p1.svg',
    details: {
      'Medical Records': '18',
      Complaints: '28',
      Diagnosis: '30',
      Prescriptions: '80'
    }
  }
]

const slidesImg = {
  Pharmacy: '/dashboard/medical_record1.svg',
  'Medical records': '/dashboard/p1.svg'
}

const Slides = ({ sliderData }) => {
  console.log(sliderData, 'sliderData')

  const formatTitleCase = str => {
    return str
      .replace(/_/g, ' ') // Replace underscores with spaces
      .toLowerCase() // Convert the entire string to lowercase
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
  }

  return (
    <>
      {sliderData.length > 0 &&
        sliderData.map((slide, index) => {
          return (
            <Box key={index} className='keen-slider__slide'>
              <Box sx={{ mb: 5, display: 'flex', alignItems: 'stretch' }}>
                {/* <Box component='img' src={slide.img} alt={slide.title} sx={{ mr: 3, width: 100 }} /> */}
                {/* <Avatar
                variant='square'
                sx={{
                  width: 'auto', // Automatically adjust width
                  height: '100%', // Match right-side height
                  mr: 3
                }}
                src={slide.img}
              /> */}

                {/* Image Box */}
                <Box
                  sx={{
                    flexShrink: 0, // Prevents the image from shrinking
                    maxWidth: 140, // Prevents the image from taking too much space
                    minWidth: 120, // Ensures image does not get too small
                    display: 'flex',
                    mr: 6
                  }}
                >
                  <Avatar
                    variant='square'
                    sx={{
                      width: '100%', // Takes full width of the box
                      height: '100%', // Matches the height of right content
                      objectFit: 'cover', // Ensures proper scaling without distortion
                      alignItems: 'flex-end'
                    }}
                    src={slidesImg[slide.title]}
                  />
                </Box>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography sx={{ mb: 5, fontWeight: 600, color: '#FFFFFF', textAlign: 'start' }}>
                    {slide.subtitle}
                  </Typography>
                  <Grid container spacing={2.5}>
                    {Object.keys(slide.details).map((key, index) => (
                      <Grid item size={{ xs: 6 }} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CustomAvatar
                            skin='light'
                            variant='rounded'
                            sx={{
                              mr: 2,
                              width: 48,
                              height: 38,
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              color: '#1F515B',
                              bgcolor: '#52F990'
                            }}
                          >
                            {Utility.formatAmountCompactDisplay(slide.details[key])}
                          </CustomAvatar>
                          <Typography variant='caption' sx={{ color: '#FFFFFF', letterSpacing: 0, textAlign: 'left' }}>
                            {formatTitleCase(key)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Box>
          )
        })}
    </>
  )
}

const DashboardPharmacyDetails = ({ pharmacyData }) => {
  // ** States
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  console.log(pharmacyData, 'pharmacyData')

  // ** Hook
  const theme = useTheme()

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    rtl: theme.direction === 'rtl',
    slides: {
      spacing: 16
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    created() {
      setLoaded(true)
    }
  })

  return (
    <Card sx={{ bgcolor: '#1F515B' }}>
      <CardHeader
        // title='Pharmacy'
        title={
          <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#FFFFFF', textAlign: 'start' }}>
            {pharmacyData[currentSlide]?.title}
          </Typography>
        }
        sx={{ '& .swiper-dots': { mt: 0.75, mr: -1.75 } }}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { color: 'success.main' } }}>
            {pharmacyData[currentSlide]?.title === 'Pharmacy' ? (
              <Typography variant='caption' sx={{ mr: 1.5, color: '#FFFFFF' }}>
                {pharmacyData[currentSlide]?.title_value} recent requests
              </Typography>
            ) : (
              <Typography variant='caption' sx={{ mr: 1.5, color: '#FFFFFF' }}>
                Total sick animals : {pharmacyData[currentSlide]?.title_value}
              </Typography>
            )}
          </Box>
        }
        action={
          loaded &&
          instanceRef.current && (
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
                    onClick={() => {
                      instanceRef.current?.moveToIdx(idx)
                    }}
                    sx={{
                      mr: theme => `${theme.spacing(2.5)} !important`,
                      '& .MuiBadge-dot': {
                        height: '6px !important',
                        width: '6px !important',
                        minWidth: '6px !important',
                        backgroundColor: '#E1F9ED !important'
                      },
                      '&.active .MuiBadge-dot': {
                        background: 'linear-gradient(116.5deg, #00D6C9 8.77%, #37BD69 101.99%) !important'
                      }
                    }}
                  ></Badge>
                )
              })}
            </Box>
          )
        }
        slotProps={{
          title: {
            variant: 'h6',
            sx: { letterSpacing: '0.15px' },
            textAlign: 'start'
          }
        }}
      />
      <CardContent>
        {pharmacyData.length > 0 && (
          <Box ref={sliderRef} className='keen-slider'>
            <Slides sliderData={pharmacyData} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardPharmacyDetails
