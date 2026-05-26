import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Badge from '@mui/material/Badge'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Avatar, Tooltip } from '@mui/material'
import clsx from 'clsx'
import { useKeenSlider } from 'keen-slider/react'
import Utility from 'src/utility'
import type { SlidesProps, DashboardPharmacyDetailsProps } from 'src/types/dashboard/components'

const slidesImg: Record<string, string> = {
  Pharmacy: '/dashboard/medical_record1.svg',
  'Medical records': '/dashboard/p1.svg'
}

const formatTitleCase = (str: string): string =>
  str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())

const Slides: React.FC<SlidesProps> = ({ sliderData }) => (
  <>
    {sliderData.map((slide, index) => (
      <Box key={index} className='keen-slider__slide'>
        <Box sx={{ mb: 5, display: 'flex', alignItems: 'stretch', gap: '10px' }}>
          <Box sx={{ flexShrink: 0, maxWidth: 140, minWidth: 120, display: 'flex', alignItems: 'center', mr: 3 }}>
            <Avatar
              variant='square'
              sx={{ width: '100%', height: '100%', objectFit: 'cover', alignItems: 'flex-end' }}
              src={slidesImg[slide.title]}
            />
          </Box>
          <Grid container sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
            <Typography sx={{ mb: 5, fontWeight: 600, color: '#FFFFFF', textAlign: 'start' }}>
              {slide.subtitle}
            </Typography>
            <Grid container spacing={{ xs: 2.5, lg: 1 }}>
              {Object.keys(slide.details).map((key, idx) => (
                <Grid size={{ xs: 12, lg: 6 }} key={idx}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
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
                    </Avatar>
                    <Tooltip title={formatTitleCase(key)}>
                      <Typography
                        variant='caption'
                        sx={{
                          color: '#FFFFFF',
                          letterSpacing: 0,
                          textAlign: 'left',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          overflow: 'hidden'
                        }}
                      >
                        {formatTitleCase(key)}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Box>
      </Box>
    ))}
  </>
)

const DashboardPharmacyDetails: React.FC<DashboardPharmacyDetailsProps> = ({ pharmacyData }) => {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const theme = useTheme()

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    rtl: theme.direction === 'rtl',
    slides: { spacing: 16 },
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
                {pharmacyData[currentSlide]?.title_value} {t('dashboard.recent_requests')}
              </Typography>
            ) : (
              <Typography variant='caption' sx={{ mr: 1.5, color: '#FFFFFF' }}>
                {t('dashboard.total_sick_animals')} : {pharmacyData[currentSlide]?.title_value}
              </Typography>
            )}
          </Box>
        }
        action={
          loaded &&
          instanceRef.current && (
            <Box className='swiper-dots'>
              {[...Array(instanceRef.current.track.details.slides.length).keys()].map(idx => (
                <Badge
                  key={idx}
                  variant='dot'
                  component='div'
                  className={clsx({ active: currentSlide === idx })}
                  onClick={() => instanceRef.current?.moveToIdx(idx)}
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
                />
              ))}
            </Box>
          )
        }
        slotProps={{
          title: { variant: 'h6', sx: { letterSpacing: '0.15px' }, textAlign: 'start' }
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
  )
}

export default DashboardPharmacyDetails
