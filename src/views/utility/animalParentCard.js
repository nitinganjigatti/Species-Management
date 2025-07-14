import { Avatar, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'

const AnimalParentCard = ({ data, backgroundColor }) => {
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
                      : 'cover',
                  padding:
                    data?.default_icon?.includes('class_images') && data?.default_icon.endsWith('.svg') ? '3px' : 0
                },
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
            {data?.local_identifier_name && data?.local_identifier_value ? (
              <Tooltip
                title={
                  data?.local_identifier_name && data?.local_identifier_value
                    ? `${data?.local_identifier_name} : ${data?.local_identifier_value}`
                    : '-'
                }
              >
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span> {data?.local_identifier_name} : </span>
                  <span> {data?.local_identifier_value}</span>
                </Typography>
              </Tooltip>
            ) : (
              data?.animal_id && (
                <Tooltip title={data?.animal_id ? `AID: ${data?.animal_id}` : '-'}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    AID: {data?.animal_id}
                  </Typography>
                </Tooltip>
              )
            )}

            {(data?.common_name || data?.default_common_name) && (
              <Tooltip title={data?.common_name || data?.default_common_name}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: '19.36px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {data?.common_name || data?.default_common_name}
                </Typography>
              </Tooltip>
            )}

            {data?.scientific_name && (
              <Tooltip title={data?.scientific_name ? data?.scientific_name : '-'}>
                <Typography
                  sx={{
                    fontSize: '13px',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {data?.scientific_name}
                </Typography>
              </Tooltip>
            )}

            {data?.type === 'group' && (
              <Tooltip title={data?.total_animal ? `Count: ${data?.total_animal}` : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                    fontSize: '14px',
                    textAlign: 'center',
                    bgcolor: '#DDEBE9',
                    fontWeight: 600,
                    paddingY: '4px',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                    // width: 'fit-content'
                  }}
                >
                  Count <strong>{data?.total_animal}</strong>
                </Typography>
              </Tooltip>
            )}

            {data?.breed_name && (
              <Tooltip title={data?.breed_name ? `Breed: ${data?.breed_name}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400 }}>Breed : </span>
                  {data?.breed_name}
                </Typography>
              </Tooltip>
            )}

            {data?.morph_name && (
              <Tooltip title={data?.morph_name ? `Variant: ${data?.morph_name}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400 }}>Variant: </span>
                  {data?.morph_name}
                </Typography>
              </Tooltip>
            )}

            {data?.age && (
              <Tooltip title={data?.age ? `Age: ${data?.age}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400 }}> Age: </span>
                  {data?.age}
                </Typography>
              </Tooltip>
            )}

            {data?.user_enclosure_name && (
              <Tooltip title={data?.user_enclosure_name ? `Encl: ${data?.user_enclosure_name}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400 }}> Encl: </span>
                  {data?.user_enclosure_name}
                </Typography>
              </Tooltip>
            )}

            {data?.section_name && (
              <Tooltip title={data?.section_name ? `Sec: ${data?.section_name}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400, fontSize: animal && '14px' }}>Sec: </span> {data?.section_name}
                </Typography>
              </Tooltip>
            )}

            {data?.site_name && (
              <Tooltip title={data?.site_name ? `Site: ${data?.site_name}` : '-'}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ fontWeight: 400 }}>Site: </span>
                  {data?.site_name}
                </Typography>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
    </>
  )
}

export default AnimalParentCard
