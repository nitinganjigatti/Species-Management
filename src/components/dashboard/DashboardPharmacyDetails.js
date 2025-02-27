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
import { bgcolor } from '@mui/system'
import { Avatar } from '@mui/material'

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

const Slides = () => {
  return (
    <>
      {data.map((slide, index) => {
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
                  maxWidth: 120, // Prevents the image from taking too much space
                  minWidth: 100, // Ensures image does not get too small
                  display: 'flex',
                  mr: 6
                }}
              >
                <Avatar
                  variant='square'
                  sx={{
                    width: '100%', // Takes full width of the box
                    height: '100%', // Matches the height of right content
                    objectFit: 'cover' // Ensures proper scaling without distortion
                  }}
                  src={slide.img}
                />
              </Box>
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography sx={{ mb: 5, fontWeight: 600, color: '#FFFFFF', textAlign: 'start' }}>
                  {slide.title}
                </Typography>
                <Grid container spacing={2.5}>
                  {Object.keys(slide.details).map((key, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CustomAvatar
                          skin='light'
                          variant='rounded'
                          sx={{
                            mr: 1.5,
                            width: 50,
                            height: 40,
                            fontSize: '1.25rem',
                            borderRadius: '6px',
                            color: '#1F515B',
                            bgcolor: '#52F990'
                          }}
                        >
                          {slide.details[key]}
                        </CustomAvatar>
                        <Typography variant='caption' sx={{ color: '#FFFFFF' }}>
                          {key}
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

const DashboardPharmacyDetails = () => {
  // ** States
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

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
            {'Pharmacy'}
          </Typography>
        }
        titleTypographyProps={{
          variant: 'h6',
          sx: { letterSpacing: '0.15px' },
          textAlign: 'start'
        }}
        sx={{ '& .swiper-dots': { mt: 0.75, mr: -1.75 } }}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { color: 'success.main' } }}>
            <Typography variant='caption' sx={{ mr: 1.5, color: '#FFFFFF' }}>
              299 Recent requests
            </Typography>
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
      />
      <CardContent>
        <Box ref={sliderRef} className='keen-slider'>
          <Slides />
        </Box>
      </CardContent>
    </Card>
  )
}

export default DashboardPharmacyDetails
