import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const AddGallery = () => {
  const theme = useTheme()
  return (
    <>
      <Grid>
        <Grid sx={{ width: '200px', ml: 5,mt:2, display: 'flex', overflowX: 'auto', py: 2 }}>
          <Card>
            <CardContent>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24.2px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {/* {item?.type} */}
              </Typography>
              <Avatar alt='image' sx={{ width: '100%', height: '100%' }} variant='rounded' src={''} />
              {/* //////////////////////////////////////////// */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                <Avatar
                  variant='square'
                  alt='Medicine Image'
                  sx={{
                    width: 35,
                    height: 35,
                    mr: 2,
                    mt:1,
                    borderRadius: '50%',
                    background: '#E8F4F2',
                    overflow: 'hidden'
                  }}
                >
                  <Icon icon='mdi:user' />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column',mt:1 }}>
                  <Typography
                    noWrap
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: '500',
                      lineHeight: '16.94px'
                    }}
                  >
                    John Steveson
                    {/* {item?.user_full_name ? item?.user_full_name : '-'} */}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '12px',
                      fontWeight: '400',
                      lineHeight: '14.52px',
                      mt: 0.5
                    }}
                  >
                    01 July 2024
                    {/* {item?.created_at ? 'Created on' + ' ' + moment(item?.created_at).format('DD MMM YYYY') : '-'} */}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
export default AddGallery
