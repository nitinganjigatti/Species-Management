import { useEffect, useState } from 'react'
import { Avatar, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const FallbackAvatar = ({ src = '', fallback = '/branding/antz/Antz_logomark_h_color.svg', sx = {}, ...props }) => {
  const theme = useTheme()

  const [imgSrc, setImgSrc] = useState(src || fallback)
  const [style, setStyle] = useState(sx)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setImgSrc(fallback)
    setStyle({ backgroundColor: theme.palette.customColors.displaybgPrimary, p: 2 })
    setIsLoading(false)
  }

  return (
    <>
      {isLoading && (
        <Skeleton
          variant='rounded'
          animation='wave'
          sx={{
            height: 25,
            width: 25,
            borderRadius: '50%',
            ...sx
          }}
        />
      )}
      <Avatar
        {...props}
        src={imgSrc}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          display: isLoading ? 'none' : 'flex',
          ...style,
          padding: !src && 1
        }}
      />
    </>
  )
}

export default FallbackAvatar
