import { useEffect, useState, useCallback } from 'react'
import { Avatar, Skeleton, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const FallbackAvatar = ({
  src = '',
  variant = 'circular',
  fallback = '/branding/antz/Antz_logomark_h_color.svg',
  alt = 'Avatar',
  size = 'medium',
  sx = {},
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}) => {
  const theme = useTheme()
  const [imgSrc, setImgSrc] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Size presets for avatars
  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 40, height: 40 },
    large: { width: 56, height: 56 },
    xlarge: { width: 80, height: 80 }
  }

  const currentSize = typeof size === 'object' ? size : sizeMap[size] || sizeMap.medium

  // Reset state when src changes
  useEffect(() => {
    if (src) {
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
      setImgSrc(fallback)
      setIsLoading(false)
      setHasError(false)
      setImageLoaded(true)
    }
  }, [src, fallback])

  const handleLoad = useCallback(() => {
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    onError?.()
  }, [onError])

  // Render skeleton while loading
  if (isLoading && showSkeleton) {
    return (
      <Skeleton
        variant={variant}
        animation='wave'
        sx={{
          ...currentSize,
          ...sx
        }}
      />
    )
  }

  // Render error state with user icon
  if (hasError) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.customColors.displaybgPrimary || theme.palette.grey[100],
          borderRadius: '50%',
          color: theme.palette.text.secondary,
          ...currentSize,
          ...sx
        }}
      >
        <Icon icon='mdi:account' fontSize={currentSize.width * 0.5} color={theme.palette.text.secondary} />
      </Box>
    )
  }

  // Render avatar
  return (
    <Avatar
      alt={alt}
      {...props}
      src={imgSrc}
      variant={variant}
      onLoad={handleLoad}
      onError={handleError}
      sx={{
        ...currentSize,
        backgroundColor: theme.palette.customColors.displaybgPrimary || theme.palette.grey[100],
        '& img': {
          objectFit: 'inherit'
        },
        ...sx,
        padding: imgSrc === fallback ? '5px' : sx.padding
      }}
    />
  )
}

export default FallbackAvatar
