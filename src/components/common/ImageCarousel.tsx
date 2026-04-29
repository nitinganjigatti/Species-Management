'use client'

import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'
import Icon from 'src/@core/components/icon'
import { useSettings } from 'src/@core/hooks/useSettings'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

export interface CarouselImage {
  id: string | number
  url: string
  alt?: string
  thumbnail?: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  height?: number | string
  borderRadius?: number | string
  showArrows?: boolean
  showDots?: boolean
  showCounter?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  onImageClick?: (image: CarouselImage, index: number) => void
  objectFit?: 'cover' | 'contain' | 'fill'
  backgroundColor?: string
}

const ImageCarousel = ({
  images,
  height = 300,
  borderRadius = 1,
  showArrows = true,
  showDots = true,
  showCounter = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  onImageClick,
  objectFit = 'cover',
  backgroundColor
}: ImageCarouselProps) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const bgColor = backgroundColor || theme.palette.customColors?.SurfaceVariant || theme.palette.grey[200]
  const arrowBgColor = hexToRGBA(theme.palette.customColors?.dark || theme.palette.grey[900], 0.5)
  const arrowBgHoverColor = hexToRGBA(theme.palette.customColors?.dark || theme.palette.grey[900], 0.7)
  const arrowIconColor = theme.palette.customColors?.OnPrimary || theme.palette.common.white
  const dotActiveColor = theme.palette.primary.main
  const dotInactiveColor = hexToRGBA(theme.palette.customColors?.OnPrimary || theme.palette.common.white, 0.5)
  const dotHoverColor = hexToRGBA(theme.palette.customColors?.OnPrimary || theme.palette.common.white, 0.8)
  const counterBgColor = hexToRGBA(theme.palette.customColors?.dark || theme.palette.grey[900], 0.5)
  const counterTextColor = theme.palette.customColors?.OnPrimary || theme.palette.common.white

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      rtl: settings?.direction === 'rtl',
      initial: 0,
      slideChanged(slider) {
        setCurrentSlide(slider.track.details.rel)
      },
      created() {
        setLoaded(true)
      },
      loop: images.length > 1
    },
    autoPlay && images.length > 1
      ? [
          slider => {
            let timeout: ReturnType<typeof setTimeout>
            let mouseOver = false

            function clearNextTimeout() {
              clearTimeout(timeout)
            }

            function nextTimeout() {
              clearTimeout(timeout)
              if (mouseOver) return
              timeout = setTimeout(() => {
                slider.next()
              }, autoPlayInterval)
            }

            slider.on('created', () => {
              slider.container.addEventListener('mouseover', () => {
                mouseOver = true
                clearNextTimeout()
              })
              slider.container.addEventListener('mouseout', () => {
                mouseOver = false
                nextTimeout()
              })
              nextTimeout()
            })
            slider.on('dragStarted', clearNextTimeout)
            slider.on('animationEnded', nextTimeout)
            slider.on('updated', nextTimeout)
          }
        ]
      : []
  )

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    instanceRef.current?.prev()
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    instanceRef.current?.next()
  }

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    instanceRef.current?.moveToIdx(index)
  }

  const handleSlideClick = (image: CarouselImage, index: number) => {
    if (onImageClick) {
      onImageClick(image, index)
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  // Single image - no carousel needed
  if (images.length === 1) {
    const image = images[0]
    const hasError = imageErrors[0]

    return (
      <Box
        onClick={() => handleSlideClick(image, 0)}
        sx={{
          position: 'relative',
          width: '100%',
          height,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: bgColor,
          cursor: onImageClick ? 'pointer' : 'default'
        }}
      >
        {hasError ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Icon icon='mdi:image-off-outline' fontSize={48} color={theme.palette.text.disabled} />
            <Typography variant='caption' color='text.disabled'>
              Image not available
            </Typography>
          </Box>
        ) : (
          <img
            src={image.url}
            alt={image.alt || 'Image'}
            onError={() => handleImageError(0)}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              display: 'block'
            }}
          />
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius,
        overflow: 'hidden'
      }}
    >
      {/* Slider */}
      <Box
        ref={sliderRef}
        className='keen-slider'
        sx={{
          height,
          backgroundColor: bgColor
        }}
      >
        {images.map((image, index) => {
          const hasError = imageErrors[index]

          return (
            <Box
              key={image.id}
              className='keen-slider__slide'
              onClick={() => handleSlideClick(image, index)}
              sx={{
                cursor: onImageClick ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgColor
              }}
            >
              {hasError ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <Icon icon='mdi:image-off-outline' fontSize={48} color={theme.palette.text.disabled} />
                  <Typography variant='caption' color='text.disabled'>
                    Image not available
                  </Typography>
                </Box>
              ) : (
                <img
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  onError={() => handleImageError(index)}
                  loading='lazy'
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit,
                    display: 'block'
                  }}
                />
              )}
            </Box>
          )
        })}
      </Box>

      {/* Navigation Arrows */}
      {loaded && showArrows && images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: arrowBgColor,
              color: arrowIconColor,
              width: 36,
              height: 36,
              '&:hover': {
                backgroundColor: arrowBgHoverColor
              }
            }}
          >
            <Icon icon='mdi:chevron-left' fontSize={24} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: arrowBgColor,
              color: arrowIconColor,
              width: 36,
              height: 36,
              '&:hover': {
                backgroundColor: arrowBgHoverColor
              }
            }}
          >
            <Icon icon='mdi:chevron-right' fontSize={24} />
          </IconButton>
        </>
      )}

      {/* Counter Badge */}
      {showCounter && images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: counterBgColor,
            color: counterTextColor,
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          {currentSlide + 1} / {images.length}
        </Box>
      )}

      {/* Dots Pagination */}
      {loaded && showDots && images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={e => handleDotClick(e, index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: currentSlide === index ? dotActiveColor : dotInactiveColor,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: currentSlide === index ? dotActiveColor : dotHoverColor
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default ImageCarousel
