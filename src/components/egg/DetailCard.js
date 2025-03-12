import { Avatar, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const DetailCard = ({ radius, DetailsListData }) => {
  const theme = useTheme()

  return (
    <>
      <Box>
        <Stack
          direction='row'
          sx={{
            px: '16px',
            py: '14px',
            display: 'flex',
            columnGap: { md: 15, sx: 3, sm: 6 },
            rowGap: 7,
            // gap: { md: 15, sx: 3, sm: 6 },
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: '#f2fff8',
            borderRadius: radius
          }}
        >
          {DetailsListData?.AvatarLeft && (
            <Box sx={{ display: 'flex', gap: '12px' }}>
              <Box sx={{ height: '64px', width: '64px', borderRadius: '8px', bgcolor: '#FFE86E' }}>
                <img
                  src={DetailsListData?.AvatarLeft?.profile_Pic}
                  alt='incubator'
                  style={{ height: '100%', width: '100%' }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  {DetailsListData?.AvatarLeft?.key}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {DetailsListData?.AvatarLeft?.value}
                </Typography>
              </Box>
            </Box>
          )}
          {DetailsListData?.list &&
            Object?.entries(DetailsListData?.list).map(([key, value]) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }} key={key}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.neutralSecondary
                  }}
                >
                  {key}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '16.94px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}

          {DetailsListData?.Avatar && (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
              <Avatar
                variant='square'
                alt='Medicine Image'
                sx={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#E8F4F2',
                  overflow: 'hidden'
                }}
              >
                {DetailsListData?.Avatar?.profile_Pic ? (
                  <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    src={DetailsListData?.Avatar?.profile_Pic}
                    alt='Profile'
                  />
                ) : (
                  <Icon icon='mdi:user' />
                )}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
                  {DetailsListData?.Avatar?.user_Name}
                </Typography>
                <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                  {DetailsListData?.Avatar?.create_at
                    ? 'Created on ' +
                      Utility.formatDisplayDate(Utility.convertUTCToLocal(DetailsListData?.Avatar?.create_at))
                    : '-'}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </>
  )
}

export default DetailCard
