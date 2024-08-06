import { Avatar, Card, CardContent, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

const EggImageGallery = ({ galleryList }) => {
  const theme = useTheme()

  return (
    <>
      {galleryList?.length ? (
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
          <Grid container spacing={6} sx={{ justifyContent: 'start' }}>
            {galleryList?.map((item, index) => (
              <Grid key={index} item xs={12} sm={6} md={4} xl={4} xxl={4}>
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
                      {item?.type}
                    </Typography>
                    <Avatar
                      alt='image'
                      sx={{ width: '100%', height: '100%', aspectRatio: '16/9' }}
                      variant='rounded'
                      src={item?.file_name}
                    />
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
                          {item?.user_full_name ? item?.user_full_name : '-'}
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
                          {/* {item?.created_at ? ' ' + moment(item?.created_at).format('DD MMM YYYY') : '-'} */}
                          {/* {item?.created_at
                            ? ' ' + moment(moment.utc(item?.created_at).toDate().toLocaleString()).format('DD MMM YYYY')
                            : '-'} */}
                          {Utility?.formatDisplayDate(Utility.convertUTCToLocal(item?.created_at))}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}
    </>
  )
}

export default EggImageGallery
