import { Avatar, Radio, Skeleton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'

const AnimalParentCard = ({ data, backgroundColor, size, animal = false, ondelete, radio }) => {
  const theme = useTheme()

  const [imageLoading, setImageLoading] = useState(true)

  // const handleImageLoad = () => {
  //   setImageLoading(false)
  // }

  useEffect(() => {
    const img = new Image()
    img.src = data?.default_icon

    img.onload = () => {
      setImageLoading(false)
    }

    img.onerror = () => {
      setImageLoading(false) // Handle image loading errors as well
    }
  }, [data?.default_icon])

  const avatarContent = imageLoading ? (
    <Skeleton variant='circular' width={44} height={44} />
  ) : (
    <Avatar
      sx={{
        '& > img': {
          objectFit:
            data?.default_icon?.includes('class_images') && data?.default_icon?.endsWith('.svg') ? 'contain' : 'cover'
        },
        padding: data?.default_icon?.includes('class_images') && data?.default_icon?.endsWith('.svg') ? 0.4 : 0,
        width: 44,
        height: 44,
        border: '1px solid #C3CEC7'
      }}
      alt={data?.default_icon}
      src={data?.default_icon}

      // onLoad={handleImageLoad}
    />
  )

  return (
    <>
      {data && (
        <Box
          sx={{
            width: '100%',
            backgroundColor: radio?.checked ? '#F2FFF8' : backgroundColor || theme.palette.primary.contrastText,
            borderRadius: '8px',
            paddingY: '20px',
            paddingX: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            border: radio?.checked ? `1px solid #37BD69` : '1px solid #C3CEC7'
          }}
        >
          {/* Left content (image + text info) */}
          <Box sx={{ display: 'flex', gap: '10px' }}>
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
                  width: 24,
                  height: 24,
                  bgcolor:
                    data?.type === 'group'
                      ? theme.palette.customColors.addPrimary
                      : data?.sex === 'male'
                      ? theme.palette.customColors.SecondaryContainer
                      : data?.sex === 'female'
                      ? theme.palette.customColors.AntzTertiary
                      : data?.sex === 'undetermined' || data?.sex === 'indeterminate'
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
                  <Typography sx={{ fontSize: 14, color: theme.palette.primary.contrastText, fontWeight: 500 }}>
                    G
                  </Typography>
                ) : data?.sex === 'male' ? (
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSecondaryContainer }}
                  >
                    M
                  </Typography>
                ) : data?.sex === 'female' ? (
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#4A0415' }}>F</Typography>
                ) : data?.sex === 'undetermined' ? (
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.Error }}>
                    UD
                  </Typography>
                ) : data?.sex === 'indeterminate' ? (
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
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
              {/* All your text info here, unchanged */}
              {data?.local_identifier_name && data?.local_identifier_value && (
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  <span> {data?.local_identifier_name}: </span>
                  <span> {data?.local_identifier_value}</span>
                </Typography>
              )}

              {data?.local_identifier_name !== null ? (
                <Typography
                  sx={{
                    fontSize: size ?? '16px',
                    fontWeight: 600,
                    lineHeight: '19.36px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  NAME : {data?.local_identifier_name}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: size ?? '16px',
                    fontWeight: 600,
                    lineHeight: '19.36px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  AID : {data?.animal_id}
                </Typography>
              )}

              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '19.36px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {data?.common_name || data?.default_common_name}
              </Typography>

              <Typography
                sx={{
                  fontSize: animal ? '16px' : '13px',
                  fontWeight: animal ? 400 : 500,
                  fontStyle: 'italic',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {data?.scientific_name}
              </Typography>

              {data?.type === 'group' && (
                <Typography
                  variant='caption'
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    bgcolor: '#DDEBE9',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    width: 'fit-content'
                  }}
                >
                  Count <strong>{data?.total_animal}</strong>
                </Typography>
              )}

              {!animal && (
                <>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>Breed: </span>
                    {data?.breed_name || '-'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>Variant: </span>
                    {data?.morph_name || '-'}
                  </Typography>
                </>
              )}

              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: animal ? 400 : 600,
                  lineHeight: '16.94px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                <span style={{ fontWeight: 400 }}> Encl: </span>
                {data?.user_enclosure_name}
              </Typography>

              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: animal ? 400 : 600,
                  lineHeight: '16.94px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                <span style={{ fontWeight: 400, fontSize: animal && '14px' }}>Sec: </span> {data?.section_name}
              </Typography>

              {!animal && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  <span style={{ fontWeight: 400 }}>Site: </span>
                  {data?.site_name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right-aligned Radio Button */}
          <Box>
            <Radio
              checked={radio?.checked}
              onChange={radio?.onChange}
              sx={{
                width: 24,
                height: 24,
                p: 0,
                '& .MuiSvgIcon-root': {
                  fontSize: 24
                }
              }}
            />
          </Box>
        </Box>
      )}
    </>
  )
}

export default AnimalParentCard
