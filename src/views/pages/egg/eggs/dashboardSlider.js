import { Avatar, Box, Card, CircularProgress, Drawer, IconButton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const DashboardSlider = ({
  status,
  openDrawer,
  setOpenDrawer,
  drawerHeading,
  setDrawerHeading,
  drawerHeadingCount,
  setDrawerHeadingCount,
  drawerList,
  drawerLoading
}) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '24px',
          position: 'fixed',
          width: '100%',
          zIndex: 100,
          top: 0,
          justifyContent: 'space-between',
          bgcolor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor
        }}
      >
        <Box sx={{ width: '514px', display: 'flex', justifyContent: 'space-between' }}>
          <Box
            sx={{
              gap: '12px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <img src='/icons/egg_dashboard/species_logo.png' width='32' height='32' />
            <Typography sx={{ fontSize: 24, fontFamily: 'Inter', fontWeight: 500 }}>
              {drawerHeading}
              {drawerHeadingCount > 0 ? <span> &#40;{drawerHeadingCount}&#41;</span> : ''}
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={() => {
              setOpenDrawer(false)
              setDrawerHeadingCount(0)
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor,
          height: '140%',
          px: '24px'
        }}
      >
        <Box sx={{ pb: '24px', pt: '85px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {drawerLoading ? (
            <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            drawerList?.length > 0 &&
            drawerList?.map((item, index) => (
              <Box
                key={index}
                sx={{
                  background: theme.palette.primary.contrastText,
                  border: '1px solid #C3CEC7',
                  borderRadius: '8px',
                  px: '20px',
                  py: '16px'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar
                      variant='rounded'
                      alt='Medicine Image'
                      sx={{
                        width: 44,
                        height: 44,
                        mr: 4,
                        border: '1px solid #C3CEC7',
                        borderRadius: '50%',
                        background: '#E8F4F2',
                        overflow: 'hidden'
                      }}
                    >
                      {item?.default_icon ? (
                        <img style={{ width: '100%', height: '100%' }} src={item?.default_icon} alt='Profile' />
                      ) : (
                        <Icon icon='mdi:user' />
                      )}
                    </Avatar>

                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Tooltip title={item?.complete_name}>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '19.36px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '240px',
                            boxSizing: 'border-box'
                          }}
                        >
                          {item?.complete_name}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={item?.default_common_name}>
                        <Typography
                          sx={{
                            color: theme.palette.primary.light,
                            fontSize: '16px',
                            fontWeight: '400',
                            lineHeight: '19.36px',
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '240px'
                          }}
                        >
                          {item?.default_common_name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      textAlign: 'end',
                      width: '110px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '16px',
                      fontWeight: '600',
                      lineHeight: '19.36px'
                    }}
                  >
                    {item?.total_eggs} Eggs
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default DashboardSlider
