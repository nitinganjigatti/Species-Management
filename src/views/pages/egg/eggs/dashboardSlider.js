import { Avatar, Box, Card, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const DashboardSlider = ({ openDrawer, setOpenDrawer }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',

        gap: '24px'
      }}
    >
      <Box
        sx={{
          bgcolor: theme.palette.customColors.lightBg,
          width: '100%',
          height: '100%'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px',
            mt: 2,
            ml: 2,

            bgcolor: theme.palette.customColors.lightBg
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', ml: -2 }}>
            <img src='/icons/egg_dashboard/species_logo.png' width='32' height='32' />
            <Typography sx={{fontSize:24, fontFamily:"Inter" , fontWeight:500 }}>Nursery A (50)</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        {/* drower */}
        <Box className='sidebar-body'>
          <Box sx={{ width: '562px', height: '740px', gap: 12 }}>
            <Box
              sx={{
                width: '510px',
                height: '84px',
                borderRadius: '8px',
                ml: 6,
                mt: 4,
                backgroundColor: '#FFFF',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Box
                sx={{
                  width: '482px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between' // Ensures spacing between Avatar+Text and "05 eggs"
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* <Avatar
                    variant='rounded'
                    alt='Medicine Image'
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#E8F4F2',
                      overflow: 'hidden'
                    }}
                  > */}
                  <img src='/icons/egg_dashboard/nursery_species.png' sx={{ width: 44, height: 44 }} />
                  {/* <Icon icon='mdi:user' /> */}

                  {/* </Avatar> */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, width: '300px' }}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        fontWeight: 600,
                        lineHeight: '19.36px',
                        color: '#44544A'
                      }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        fontWeight: 400,
                        mt: 1.2,
                        fontStyle: 'italic',
                        color: '#44544A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      Trichoglossus Moluccanus
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    lineHeight: '19.36px',
                    color: '#44544A',
                    fontWeight: 600
                  }}
                >
                  05 Eggs
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default DashboardSlider
