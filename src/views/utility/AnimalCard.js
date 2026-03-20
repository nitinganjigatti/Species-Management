import { Avatar, Skeleton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'
import Utility from 'src/utility'

const AnimalCard = ({ data, size, edit, valueColor, cardType = 'animal' }) => {
  const theme = useTheme()
  const [imageLoading, setImageLoading] = useState(true)
  const [src, setSrc] = useState(data?.default_icon)

  // Get sex from either 'sex' or 'gender' field
  const sex = (data?.sex || data?.gender)?.toLowerCase()

  useEffect(() => {
    setSrc(data?.default_icon)
  }, [data?.default_icon])

  const fallBackImage = '/images/branding/Antz_logomark_h_color.svg'

  const isFallback = src === fallBackImage

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
    const img = new Image()
    img.src = data?.default_icon

    img.onload = () => {
      setImageLoading(false)
    }

    img.onerror = () => {
      setImageLoading(false)
    }
  }, [data?.default_icon])

  const avatarContent = imageLoading ? (
    <Skeleton variant='circular' width={44} height={44} />
  ) : (
    <Avatar
      key={src}
      src={src || fallBackImage}
      alt=''
      sx={{
        width: 44,
        height: 44,
        '& img': {
          objectFit: getImageType(src) === 'svg' ? 'contain' : 'cover',
          padding: isFallback ? '4px' : 0
        }
      }}
      imgProps={{
        onError: () => {
          setSrc(fallBackImage)
        }
      }}
    ></Avatar>
  )

  return (
    <Box sx={{ display: 'flex', gap: '16px' }}>
      {/* Avatar section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        {avatarContent}
        <Avatar
          sx={{
            width: sex === 'undetermined' || sex === 'indeterminate' ? 32 : 24,
            height: 24,
            bgcolor:
              data?.type === 'group'
                ? theme.palette.customColors.addPrimary
                : sex === 'male'
                ? theme.palette.customColors.SecondaryContainer
                : sex === 'female'
                ? theme.palette.customColors.AntzTertiary
                : sex === 'undetermined' || sex === 'indeterminate'
                ? theme.palette.customColors.displaybgSecondary
                : theme.palette.customColors.SecondaryContainer,
            objectFit: 'contain',
            pt: 0.2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '4px'
          }}
        >
          {/* Gender / Group initials */}
          {data?.type === 'group' ? (
            <Typography sx={{ fontSize: 14, color: theme.palette.primary.contrastText, fontWeight: 500 }}>G</Typography>
          ) : sex === 'male' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSecondaryContainer }}>
              M
            </Typography>
          ) : sex === 'female' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#4A0415' }}>F</Typography>
          ) : sex === 'undetermined' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.Error }}>UD</Typography>
          ) : sex === 'indeterminate' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              ID
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 14 }}>-</Typography>
          )}
        </Avatar>
      </Box>

      {/* Details section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        {(data?.mortality_date || data?.mortality_created_at) && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: theme.palette.customColors.Tertiary
            }}
          >
            <span>Mortality Date : </span>
            <span>{Utility.convertUtcToLocalReadableDate(data?.mortality_date || data?.mortality_created_at)}</span>
            <span> &bull; </span> {Utility.convertUTCToLocaltime(data?.mortality_date || data?.mortality_created_at)}
          </Typography>
        )}
        {data?.local_identifier_name && data?.local_identifier_value && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography
              sx={{
                color: valueColor || theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '19.36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: edit ? '118px' : '200px'
              }}
            >
              <span> {data?.local_identifier_name}: </span>
              <span> {data?.local_identifier_value}</span>
            </Typography>
            {data?.is_primary === '1' && (
              <Box
                component='span'
                sx={{
                  color: valueColor || theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 400,
                  background: '#37bd6924',
                  px: '5px',
                  py: '2px',
                  borderRadius: '4px',
                  ml: '10px'
                }}
              >
                Primary Diet
              </Box>
            )}
          </Box>
        )}

        {!(data?.local_identifier_name && data?.local_identifier_value) &&
          (data?.animal_id || data?.fetus_code || data?.display_fetus_code) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                sx={{
                  fontSize: size ?? '16px',
                  fontWeight: 600,
                  lineHeight: '19.36px',
                  color: valueColor || theme.palette.customColors.OnSurfaceVariant,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: edit ? '118px' : '200px'
                }}
              >
                {cardType == 'fetus'
                  ? `FID : ${data?.fetus_code || data?.display_fetus_code}`
                  : `AID : ${data?.animal_id}`}
              </Typography>
              {data?.is_primary === '1' && (
                <Box
                  component='span'
                  sx={{
                    color: valueColor || theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: 400,
                    background: '#37bd6924',
                    px: '5px',
                    py: '2px',
                    borderRadius: '4px',
                    ml: '10px'
                  }}
                >
                  Primary Diet
                </Box>
              )}
            </Box>
          )}

        {(data?.common_name || data?.default_common_name) && (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '19.36px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {data?.common_name || data?.default_common_name}
          </Typography>
        )}

        {(data?.scientific_name || data?.complete_name || data?.animal_scientific_name) && (
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              fontStyle: 'italic',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {data?.scientific_name || data?.complete_name || data?.animal_scientific_name}
          </Typography>
        )}

        {data?.age?.trim() && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Age : </span>
            {data?.age}
          </Typography>
        )}

        {data?.weight?.trim() && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Weight : </span>
            {data?.weight}
          </Typography>
        )}

        {data?.type === 'group' && (
          <Typography
            variant='caption'
            sx={{
              color: valueColor || theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              bgcolor: theme.palette.customColors.displaybgSecondary,
              padding: '2px 4px',
              borderRadius: '4px',
              width: 'fit-content'
            }}
          >
            Count <strong>{data?.total_animal}</strong>
          </Typography>
        )}

        {data?.breed_name && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '19.36px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Breed : </span>
            {data?.breed_name || '-'}
          </Typography>
        )}
        {data?.morph_name && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '19.36px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Variant : </span>
            {data?.morph_name || '-'}
          </Typography>
        )}

        {data?.discovered && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Discovered : </span>
            {Utility.convertUtcToLocalReadableDate(data?.discovered)}
            <span> &bull; </span>
            {Utility.convertUTCToLocaltime(data?.discovered)}
          </Typography>
        )}

        {data?.mother_id && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Mother :{data?.mother_id}
          </Typography>
        )}

        {data?.user_enclosure_name && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span> Encl : </span>
            {data?.user_enclosure_name}
          </Typography>
        )}

        {data?.section_name && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Sec : </span> {data?.section_name}
          </Typography>
        )}

        {data?.site_name && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '16.94px',
              color: valueColor || theme.palette.customColors.OnSurfaceVariant
            }}
          >
            <span>Site : </span>
            {data?.site_name}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default AnimalCard
