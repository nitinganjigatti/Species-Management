import React from 'react'
import { Avatar, Box, Tooltip, Typography } from '@mui/material'

const UserInfoCard = ({ avatarUrl, name, description, textColor, fontWeight }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {name ? (
        <>
          <Avatar src={avatarUrl} sx={{ width: '34px', height: '34px' }} />
          <Box>
            {name && (
              <>
                <Tooltip title={name}>
                  <Typography
                    sx={{
                      maxWidth: '180px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      fontWeight: fontWeight ?? 600,
                      color: theme => textColor ?? theme.palette.common.white
                    }}
                  >
                    {name}
                  </Typography>
                </Tooltip>
              </>
            )}
            {description && (
              <>
                <Tooltip title={description}>
                  <Typography sx={{ color: theme => textColor ?? theme.palette.common.white }} variant='body2'>
                    {description}
                  </Typography>
                </Tooltip>
              </>
            )}
          </Box>
        </>
      ) : (
        <Typography
          sx={{
            fontWeight: fontWeight ?? 600,
            ml: 3,
            color: theme => textColor ?? theme.palette.common.white
          }}
        ></Typography>
      )}
    </Box>
  )
}

export default React.memo(UserInfoCard)
