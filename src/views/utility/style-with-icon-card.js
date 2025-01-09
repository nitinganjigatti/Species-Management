import React from 'react'
import { Box, Grid, Typography, Avatar } from '@mui/material'
import Icon from 'src/@core/components/icon'

const StyleWithIconCardComponent = ({ value, description, icon, bgColor, onClick, showIcon }) => {
  return (
    <Grid item xs={12} sm={4}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: bgColor ? bgColor : null,
          borderRadius: '8px',
          p: 4,
          cursor: 'pointer'
        }}
        onClick={onClick ? onClick : null}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            borderRadius: '8px',
            backgroundColor: '#FFFFFF80',
            width: '60px',
            height: '60px',
            justifyContent: 'center'
          }}
        >
          <Avatar variant='square' alt='' src={icon ? icon : null} sx={{ width: '34px', height: '34px' }} />
        </Box>
        <Box flex='1' ml={2}>
          <Typography
            variant='body1'
            sx={{
              color: 'customColors.customHeadingTextColor',
              fontWeight: 500,
              fontSize: '20px'
            }}
          >
            {value ? value : 0}
          </Typography>
          <Typography
            variant='body2'
            sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '14px' }}
          >
            {description ? description : null}
          </Typography>
        </Box>
        {showIcon && (
          <Typography variant='body2' color='customColors.customHeadingTextColor'>
            <Icon icon='weui:arrow-filled' />
          </Typography>
        )}
      </Box>
    </Grid>
  )
}

export default StyleWithIconCardComponent
