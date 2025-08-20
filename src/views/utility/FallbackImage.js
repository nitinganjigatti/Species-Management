import { useEffect, useState, useCallback } from 'react'
import { Box, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const FallbackImage = ({
  src = '',
  fallback = '/branding/antz/Antz_logomark_h_color.svg',
  sx = {},
  alt = 'Image',
  ...props
}) => {
  const theme = useTheme()

  const [imgSrc, setImgSrc] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset state when src changes
  useEffect(() => {
    if (src && src.trim() !== '') {
      setImgSrc(src)
      setIsLoading(true)
      setHasError(false)
      setImageLoaded(false)

      // Preload the image
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
        setIsLoading(false)
        setHasError(false)
      }
      img.onerror = () => {
        // If main image fails, try fallback
        if (src !== fallback) {
          const fallbackImg = new Image()
          fallbackImg.onload = () => {
            setImgSrc(fallback)
            setImageLoaded(true)
            setIsLoading(false)
            setHasError(false)
          }
          fallbackImg.onerror = () => {
            setIsLoading(false)
            setHasError(true)
            setImageLoaded(false)
          }
          fallbackImg.src = fallback
        } else {
          setIsLoading(false)
          setHasError(true)
          setImageLoaded(false)
        }
      }
      img.src = src
    } else {
      // If no src provided, immediately use fallback
      setImgSrc(fallback)
      setIsLoading(false)
      setHasError(false)
      setImageLoaded(true)
    }
  }, [src, fallback])

  const handleLoad = useCallback(() => {
    // Additional load handler if needed
  }, [])

  const handleError = useCallback(() => {
    // Additional error handler if needed
  }, [])

  // Render skeleton while loading
  if (isLoading) {
    return (
      <Skeleton
        variant='rectangular'
        animation='wave'
        sx={{
          width: '100%',
          height: '100%',
          ...sx
        }}
      />
    )
  }

  // Render error state with fallback icon
  if (hasError) {
    return (
      <Box
        component='div'
        {...props}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.customColors.displaybgPrimary || theme.palette.grey[100],
          color: theme.palette.text.secondary,
          fontSize: '1.5rem',
          borderRadius: '4px',
          ...sx
        }}
      >
        📷
      </Box>
    )
  }

  // Render image
  return (
    <Box
      component='img'
      src={imgSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
      sx={{
        display: 'block',
        backgroundColor: theme.palette.customColors.displaybgPrimary || theme.palette.grey[100],
        borderRadius: '4px',
        ...sx,
        objectFit: imgSrc === fallback ? 'fill !important' : 'cover'
      }}
    />
  )
}

export default FallbackImage
