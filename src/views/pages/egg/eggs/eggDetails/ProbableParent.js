import { Avatar, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React from 'react'
import { useTheme } from '@mui/material/styles'

const ProbableParent = ({ probableParentSideBar, setProbableParentSideBar, parent, parentList }) => {
  const theme = useTheme()
  return (
    <Drawer
      anchor='right'
      open={probableParentSideBar}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560], height: '100vh' } }}
    >
      <Box sx={{ height: '100%', backgroundColor: 'background.default' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
          </Box>
          <Typography variant='h6'>
            Probable {parent} - {parentList?.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setProbableParentSideBar(false)} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: 'background.default',
            px: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pb: '24px'
          }}
        >
          {parentList?.length &&
            parentList?.map((item, i) => (
              <Box
                key={i}
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  paddingY: '20px',
                  paddingX: '16px',
                  border: '1px solid #C3CEC7',
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
                        objectFit: item?.default_icon.endsWith('.svg') ? 'contain' : 'cover'
                      },
                      width: 44,
                      height: 44
                    }}
                    alt={item?.default_icon}
                    src={item?.default_icon}
                  />
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#AFEFEB', objectFit: 'cover' }} variant='rounded'>
                    {item?.sex === 'male' ? (
                      <Typography sx={{ fontSize: 14 }}>M</Typography>
                    ) : item?.sex === 'female' ? (
                      <Typography sx={{ fontSize: 14 }}>F</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 14 }}>U</Typography>
                    )}
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.common_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {' '}
                    {item?.scientific_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.site_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.user_enclosure_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.section_name}
                  </Typography>
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
    </Drawer>
  )
}

export default ProbableParent
