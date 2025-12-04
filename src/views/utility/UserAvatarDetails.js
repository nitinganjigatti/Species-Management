import React from 'react'
import { Typography, Box, Tooltip, useTheme } from '@mui/material'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Utility from 'src/utility'

function UserAvatarDetails({
  profile_image,
  user_name,
  date,
  text_color,
  description,
  role,
  crby_width,
  size = 'large',
  show_time = false,
  dateType
}) {
  const theme = useTheme()

  const avatarSizes = {
    small: {
      profile_picture: { width: '24px', height: '24px' },
      gap: '8px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '10px', fontWeight: 500 }
    },
    medium: {
      profile_picture: { width: '32px', height: '32px' },
      gap: '8px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '14px' }
    },
    large: {
      profile_picture: { width: '40px', height: '40px' },
      gap: '12px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '21px' }
    }
  }
  const selectedAvatarSize = avatarSizes[size] || avatarSizes[size]

  return (
    <>
      {user_name ? (
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
          {profile_image ? (
            <CustomAvatar
              src={profile_image}
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            />
          ) : (
            <CustomAvatar
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            ></CustomAvatar>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {user_name && (
              <>
                <Tooltip title={user_name}>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      color: text_color ?? 'text.primary',
                      width: crby_width ? crby_width : '100px',
                      // fontSize: fontSize,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',

                      // maxWidth: 100,
                      ...(selectedAvatarSize?.user_name || {})
                    }}

                    // component={'span'}
                  >
                    {user_name ? user_name : 'NA'}
                  </Typography>
                </Tooltip>

                {description && (
                  <>
                    <Tooltip title={description}>
                      <Typography sx={{ color: theme => text_color ?? theme.palette.common.white }} variant='body2'>
                        {description}
                      </Typography>
                    </Tooltip>
                  </>
                )}
              </>
            )}

            {role && (
              <Typography variant='caption' sx={{ lineHeight: 1.6667, ...(selectedAvatarSize?.date || {}) }}>
                <span>{role}</span>
              </Typography>
            )}

            {date && (
              <Typography variant='caption' sx={{ lineHeight: 1.6667, ...(selectedAvatarSize?.date || {}) }}>
                <span>
                  {show_time ? (
                    <>
                      {Utility.convertUTCToLocaltime(date)}
                      <span> &bull; </span>
                    </>
                  ) : (
                    ''
                  )}
                </span>
                {/* <span>{date ? Utility.convertUtcToLocalReadableDate(date) : ''}</span> */}
                {dateType === 'created' ? (
                  <span style={{ color: theme.palette.customColors.neutralSecondary }}>
                    Created on {Utility.convertUtcToLocalReadableDate(date)}
                  </span>
                ) : dateType === 'updated' ? (
                  <span style={{ color: theme.palette.customColors.neutralSecondary }}>
                    Updated on {Utility.convertUtcToLocalReadableDate(date)}
                  </span>
                ) : (
                  <span>{date ? Utility.convertUtcToLocalReadableDate(date) : ''}</span>
                )}
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Typography variant='subtitle2' sx={{ color: 'text.primary', ml: 3, cursor: 'default' }}>
          -
        </Typography>
      )}
    </>
  )
}

export default React.memo(UserAvatarDetails)
