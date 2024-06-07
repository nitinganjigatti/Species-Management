import { Avatar, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const Comments = [
  {
    user_profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user_name: 'Jordan Stevenson',
    commented_at: '10 min',
    comment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
  },
  {
    user_profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user_name: 'Jordan Stevenson',
    commented_at: '10 min',
    comment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
  },
  {
    user_profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user_name: 'Jordan Stevenson',
    commented_at: '10 min',
    comment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
  }
]
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    paddingRight: '0 !important',
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  }
}))

const EggComment = () => {
  const theme = useTheme()
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24.2px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Add Comment
          </Typography>
          <StyledTextField
            fullWidth
            variant='outlined'
            placeholder='Enter your comments'
            InputProps={{
              endAdornment: (
                <Button
                  sx={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0, height: '57px' }}
                  variant='contained'
                  position='end'
                >
                  <Icon icon={'fluent:send-16-filled'} fontSize='28px' color='#fff' />
                </Button>
              )
            }}
          />
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24.2px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Previous Comments
          </Typography>
        </Box>
        {Comments?.map((item, index) => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pb: '24px',
              borderBottom: Comments.length === index + 1 ? 'none' : '0.5px solid #C3CEC7'
            }}
            key={index}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  variant='square'
                  alt='Medicine Image'
                  sx={{
                    width: 30,
                    height: 30,
                    mr: 4,
                    borderRadius: '50%',
                    background: '#E8F4F2',
                    overflow: 'hidden'
                  }}
                >
                  {item?.user_profile_pic ? (
                    <img
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      src={item?.user_profile_pic}
                      alt='Profile'
                    />
                  ) : (
                    <Icon icon='mdi:user' />
                  )}
                </Avatar>
                <Typography
                  noWrap
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '19.36px',
                    mr: '32px'
                  }}
                >
                  {item?.user_name ? item?.user_name : '-'}
                </Typography>
                {item.commented_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon color={theme.palette.customColors.secondaryBg} icon='ion:time-outline' fontSize={20} />
                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.customColors.secondaryBg,
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '16.94px',
                        verticalAlign: 'middle'
                      }}
                    >
                      {item.commented_at ? item?.commented_at + ' ago' : '-'}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: '12px', justifyContent: { xs: 'end' } }}>
                <Icon color={theme.palette.customColors.secondaryBg} icon='mdi:pencil' fontSize={20} />
                <Icon
                  color={theme.palette.customColors.secondaryBg}
                  icon='material-symbols:delete-outline'
                  fontSize={20}
                />
              </Box>
            </Box>
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '19.36px',
                color: theme.palette.customColors.OnSurfaceVariant,
                ml: 12
              }}
            >
              {item.comment}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

export default EggComment
