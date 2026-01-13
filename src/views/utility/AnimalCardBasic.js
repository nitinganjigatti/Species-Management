import React, { useEffect, useState } from 'react'
import { Box, Avatar, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const FALLBACK_IMAGE = '/icons/antz.svg'

const AnimalCardBasic = ({ image, name, scientificName, age, gender }) => {
  const theme = useTheme()
  const [imgSrc, setImgSrc] = useState(FALLBACK_IMAGE)
  const [imageLoading, setImageLoading] = useState(true)

  const capitalize = str => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '-')
  const hasAge = age !== null && age !== '' && age !== 'null'

  const isFallback = imgSrc === FALLBACK_IMAGE

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

  useEffect(() => {
    setImageLoading(true)

    if (!image || typeof image !== 'string') {
      setImgSrc(FALLBACK_IMAGE)
      setImageLoading(false)

      return
    }

    const img = new Image()
    img.src = image

    img.onload = () => {
      setImgSrc(image)
      setImageLoading(false)
    }

    img.onerror = () => {
      setImgSrc(FALLBACK_IMAGE)
      setImageLoading(false)
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [image])

  const avatarContent = imageLoading ? (
    <Skeleton variant='rectangular' width={56} height={56} sx={{ borderRadius: '8px', flexShrink: 0 }} />
  ) : (
    <Avatar
      src={imgSrc || FALLBACK_IMAGE}
      alt={name}
      sx={{
        width: 56,
        height: 56,
        borderRadius: '8px',
        '& img': {
          objectFit: getImageType(imgSrc) === 'svg' ? 'contain' : 'cover',
          padding: isFallback ? '4px' : 0
        }
      }}
      slotProps={{
        img: {
          onError: () => setImgSrc(FALLBACK_IMAGE)
        }
      }}
    />
  )

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        maxWidth: '100%'
      }}
    >
      {avatarContent}

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TextEllipsisWithModal
          enableDialog={false}
          text={capitalize(name)}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 600,
            maxWidth: '100%'
          }}
        />
        <TextEllipsisWithModal
          enableDialog={false}
          text={capitalize(scientificName)}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            fontStyle: 'italic',
            maxWidth: '100%'
          }}
        />

        <TextEllipsisWithModal
          enableDialog={false}
          text={`${hasAge ? age : ''} ${hasAge && gender ? '•' : ''} ${capitalize(gender)}`}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            maxWidth: '100%'
          }}
        />
      </Box>
    </Box>
  )
}

export default AnimalCardBasic
