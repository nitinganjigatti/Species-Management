import { Avatar, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'

const AnimalParentCard = ({ data, backgroundColor, size, animal = false }) => {
  const theme = useTheme()

  return (
    <>
      {data && (
        <Box
          sx={{
            width: '100%',
            backgroundColor: backgroundColor ? backgroundColor : '#fff',
            borderRadius: '8px',
            paddingY: '20px',
            paddingX: '16px',
            display: 'flex',
            gap: '10px'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <Avatar
              sx={{
                '& > img': {
                  objectFit:
                    data?.default_icon?.includes('class_images') && data?.default_icon?.endsWith('.svg')
                      ? 'contain'
                      : 'cover'
                },
                padding: data?.default_icon?.includes('class_images') && data?.default_icon.endsWith('.svg') ? 0.4 : 0,
                width: 44,
                height: 44,
                border: '1px solid #C3CEC7'
              }}
              alt={data?.default_icon}
              src={data?.default_icon}
            />
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor:
                  data?.type === 'group'
                    ? '#00AFD6'
                    : data?.sex === 'male'
                    ? '#AFEFEB'
                    : data?.sex === 'female'
                    ? '#FFD3D3'
                    : data?.sex === 'undetermined' || data?.sex === 'indeterminate'
                    ? '#DDEBE9'
                    : '#AFEFEB',
                objectFit: 'contain',
                pt: 0.2,
                height: 24,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              variant='rounded'
            >
              {data?.type === 'group' ? (
                <Typography sx={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>G</Typography>
              ) : data?.sex === 'male' ? (
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1F415B' }}>M</Typography>
              ) : data?.sex === 'female' ? (
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#4A0415' }}>F</Typography>
              ) : data?.sex === 'undetermined' ? (
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#E93353' }}>UD</Typography>
              ) : data?.sex === 'indeterminate' ? (
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#44544A' }}>ID</Typography>
              ) : (
                <Typography sx={{ fontSize: 14 }}>-</Typography>
              )}
            </Avatar>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
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

            <Typography
              sx={{
                fontSize: size ?? '16px',
                fontWeight: 600,
                lineHeight: '19.36px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              AID : {data?.animal_id}
              {/* {Utility?.toPascalSentenceCase(data?.common_name)} */}
            </Typography>

            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                lineHeight: '19.36px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {data?.common_name || data?.default_common_name}
              {/* {Utility?.toPascalSentenceCase(data?.common_name)} */}
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
              {/* {Utility?.toPascalSentenceCase(data?.scientific_name)} */}
            </Typography>
            {/* {data?.breed_name && ( */}
            {!animal && (
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.36px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                <span style={{ fontWeight: 400 }}>Breed: </span>
                {data?.breed_name ? data?.breed_name : '-'}
                {/* {Utility?.toPascalSentenceCase(data?.common_name)} */}
              </Typography>
            )}

            {/* )} */}
            {/* {data?.morph_name && ( */}
            {!animal && (
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.36px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                <span style={{ fontWeight: 400 }}>Variant: </span>
                {data?.morph_name ? data?.morph_name : '-'}
                {/* {Utility?.toPascalSentenceCase(data?.common_name)} */}
              </Typography>
            )}

            {!animal && (
              <>
                {data?.breed_name && (
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Breed : {data?.breed_name}
                  </Typography>
                )}

                {data?.morph_name && (
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Variant : {data?.morph_name}
                  </Typography>
                )}

                {data?.breed_name && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>Breed : </span>
                    {data?.breed_name}
                  </Typography>
                )}

                {data?.morph_name && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>Variant: </span>
                    {data?.morph_name}
                  </Typography>
                )}
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
              {/* {Utility?.toPascalSentenceCase(data?.user_enclosure_name)} */}
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
              {/* {Utility?.toPascalSentenceCase(data?.section_name)} */}
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
                {/* {Utility?.toPascalSentenceCase(data?.site_name)} */}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </>
  )
}

export default AnimalParentCard
