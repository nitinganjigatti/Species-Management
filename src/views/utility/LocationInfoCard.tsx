import React, { useEffect, useState } from 'react'
import { Box, Typography, Avatar, useTheme, Skeleton } from '@mui/material'

interface RefData {
  ref_type?: string
  type?: string
  siteData?: any
  sectionData?: any
  enclosureData?: any
  animalData?: any
}

interface LocationInfoCardProps {
  data: RefData[]
  variant?: 'single' | 'multiple'
  showCount?: boolean
}

const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ data = [], variant = 'single', showCount = false }) => {
  const theme = useTheme() as any
  const FALLBACK_IMAGE = '/icons/antz.svg'

  if (!data.length) return null

  const getDisplayData = (ref: RefData) => {
    const type = ref.type || ref.ref_type

    let title = ''
    const subtitles: string[] = []
    let imageUrl: string | undefined

    // ENCLOSURE → Section → Site
    if (type === 'enclosure' && ref?.enclosureData) {
      title = `Enc: ${ref.enclosureData.user_enclosure_name || '-'}`

      if (ref.enclosureData.section_name) subtitles.push(`Sec: ${ref.enclosureData.section_name}`)
      if (ref.enclosureData.site_name) subtitles.push(`Site: ${ref.enclosureData.site_name}`)

      imageUrl = ref.enclosureData.image
    }

    // SECTION → Site
    else if (type === 'section' && ref?.sectionData) {
      title = `Sec: ${ref.sectionData.section_name || '-'}`

      if (ref.sectionData.site_name) subtitles.push(`Site: ${ref.sectionData.site_name}`)

      imageUrl = ref.sectionData.image
    }

    // SITE only
    else if (type === 'site' && ref?.siteData) {
      title = `Site: ${ref.siteData.site_name || '-'}`
      imageUrl = ref.siteData.image
    }

    return { title, subtitles, imageUrl }
  }

  // Avatar with fallback
  const ImageAvatar = ({ imageUrl, title }: any) => {
    const [imgSrc, setImgSrc] = useState(FALLBACK_IMAGE)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      setLoading(true)

      if (!imageUrl) {
        setImgSrc(FALLBACK_IMAGE)
        setLoading(false)
        return
      }

      const img = new Image()
      img.src = imageUrl

      img.onload = () => {
        setImgSrc(imageUrl)
        setLoading(false)
      }

      img.onerror = () => {
        setImgSrc(FALLBACK_IMAGE)
        setLoading(false)
      }

      return () => {
        img.onload = null
        img.onerror = null
      }
    }, [imageUrl])

    if (loading) {
      return <Skeleton variant='rectangular' width={48} height={48} sx={{ borderRadius: '8px' }} />
    }

    return (
      <Avatar
        src={imgSrc}
        sx={{
          width: 48,
          height: 48,
          '& img': {
            objectFit: imgSrc === FALLBACK_IMAGE ? 'contain' : 'cover',
            padding: imgSrc === FALLBACK_IMAGE ? '4px' : 0
          }
        }}
        slotProps={{
          img: {
            onError: () => setImgSrc(FALLBACK_IMAGE)
          }
        }}
      />
    )
  }

  // multiple mode (Details Screen)
  if (variant === 'multiple') {
    return (
      <Box>
        {data.map((item, index) => {
          const { title, subtitles, imageUrl } = getDisplayData(item)

          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
                borderBottom:
                  index < data.length - 1 ? `1px solid ${theme.palette.customColors?.OutlineVariant}` : 'none'
              }}
            >
              <ImageAvatar imageUrl={imageUrl} title={title} />
              <Box>
                <Typography sx={{ fontWeight: 500 }}>{title}</Typography>

                {subtitles.map((sub, idx) => (
                  <Typography key={idx} sx={{ fontSize: 14 }}>
                    {sub}
                  </Typography>
                ))}
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  }

  // single mode (List Screen)
  const { title, subtitles, imageUrl } = getDisplayData(data[0])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* LEFT */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ImageAvatar imageUrl={imageUrl} title={title} />

        <Box>
          <Typography sx={{ fontWeight: 500 }}>{title}</Typography>

          {subtitles.map((sub, idx) => (
            <Typography key={idx} sx={{ fontSize: 14 }}>
              {sub}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* COUNT */}
      {showCount && data.length > 1 && (
        <Box
          sx={{
            minWidth: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: theme.palette.customColors.SurfaceVariant,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>+{data.length - 1}</Typography>
        </Box>
      )}
    </Box>
  )
}

export default React.memo(LocationInfoCard)
