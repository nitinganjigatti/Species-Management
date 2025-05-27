import React from 'react'
import { Avatar, Box, Tooltip, Typography } from '@mui/material'

const UserInfoCard = ({ avatarUrl, name, description, textColor, fontWeight }) => {
  return (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Avatar src={avatarUrl} />
      <Box>
        {name && (
          <>
            <Tooltip title={name}>
              <Typography
                sx={{ color: theme => textColor ?? theme.palette.common.white }}
                fontWeight={fontWeight ?? 600}
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
    </Box>
  )
}

export default React.memo(UserInfoCard)
