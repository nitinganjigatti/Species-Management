import { Avatar, Card, CardContent, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import moment from 'moment'

const GalleryData = [
  {
    title: 'Collection',
    img: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    title: 'Collection',
    img: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user: {
      profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    title: 'Collection',
    img: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user: {
      profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  },
  {
    title: 'Collection',
    img: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
    user: {
      profile_pic: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=248&fit=crop&auto=format&dpr=2 2',
      user_name: 'Jordan Stevenson',
      created_at: '10/10/2023'
    }
  }
]
const EggImageGallery = () => {
  const theme = useTheme()
  return (
    <Box>
      <Typography
        sx={{
          color: theme.palette.customColors.OnSurfaceVariant,
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '29.05px',
          mb: '12px'
        }}
      >
        Image Gallery
      </Typography>
      <Grid container sx={{ justifyContent: 'space-between', gap: '24px' }}>
        {GalleryData?.map((item, index) => (
          <Grid key={index} item xs={12} sm={5.7} md={3.7} xl={3.8} xxl={3.8}>
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '20px',
                    lineHeight: '24.2px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {item?.title}
                </Typography>
                <Avatar alt='image' sx={{ width: '100%', height: '100%' }} variant='rounded' src={item?.img} />
                {/* //////////////////////////////////////////// */}
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
                    {item?.user?.profile_pic ? (
                      <img
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={item?.user?.profile_pic}
                        alt='Profile'
                      />
                    ) : (
                      <Icon icon='mdi:user' />
                    )}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '16.94px'
                      }}
                    >
                      {item?.user?.user_name ? item?.user?.user_name : '-'}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '14.52px'
                      }}
                    >
                      {item?.user?.created_at
                        ? 'Created on' + ' ' + moment(item?.user?.created_at).format('DD MMM YYYY')
                        : '-'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default EggImageGallery
