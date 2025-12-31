import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Box, useTheme } from '@mui/material'

const FALLBACK_IMAGE = '/images/branding/Antz_logomark_h_color.svg'

const ImageComponent = ({ icon }) => {
  const theme = useTheme()

  const [imgSrc, setImgSrc] = useState(icon || FALLBACK_IMAGE)

  const getImageType = url => {
    if (!url || typeof url !== 'string') return 'img'

    try {
      const parsedUrl = new URL(url)
      const encodedPath = parsedUrl.searchParams.get('path')
      if (!encodedPath) return 'img'

      const decodedPath = decodeURIComponent(encodedPath)

      return decodedPath.toLowerCase().endsWith('.svg') ? 'svg' : 'img'
    } catch {
      return 'img'
    }
  }

  const imageType = useMemo(() => getImageType(imgSrc), [imgSrc])

  const handleError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE)
    }
  }

  return (
    <>
      {getImageType(icon) === 'svg' ? (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            width={44}
            height={44}
            onError={handleError}
            style={{ objectFit: 'contain', transform: 'scale(1.0)', transition: 'transform 0.2s ease' }}
            src={icon}
            alt='antz_icon'
          />
        </Box>
      ) : (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            width={44}
            onError={handleError}
            height={44}
            style={{
              borderRadius: 50,
              backgroundColor: theme.palette.customColors.neutral10,
              objectFit: 'cover',
              transition: 'transform 0.2s ease'
            }}
            src={icon}
            alt='antz_icon'
          />
        </Box>
      )}
    </>
  )
}

export default ImageComponent
