import { Drawer, Typography, IconButton, Tab, Chip, Divider } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { LoadingButton, TabContext, TabList } from '@mui/lab'
import { useState } from 'react'

const DiscardEggSlider = ({ openDiscard, setOpenDiscard }) => {
  const theme = useTheme()
  const [status, setStatus] = useState('site_wise')

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}

      {/* <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' /> */}
    </div>
  )

  const handleChange = (event, value) => {
    setStatus(value)
  }

  console.log('Status >', status)

  return (
    <>
      <Drawer
        anchor='right'
        open={openDiscard}
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
              <img src='/icons/egg_dashboard/discard.png' width='32' height='32' />
              <Typography sx={{ fontSize: 24, fontFamily: 'Inter', fontWeight: 500, color: '#44544A' }}>
                Discard Details
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDiscard(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ backgroundColor: '#FFFF' }}>
            <TabContext value={status}>
              <TabList onChange={handleChange}>
                <Tab
                  sx={{ width: '280px', ml: 2, fontWeight: 600, fontSize: '14px' }}
                  value='site_wise'
                  label={<TabBadge label='SITEWISE (12)' />}
                />
                <Tab
                  sx={{ width: '280px', fontWeight: 600, fontSize: '14px' }}
                  value='nursery_wise'
                  label={<TabBadge label='NURSERYWISE (14)' />}
                />
              </TabList>
            </TabContext>
            <Divider />
            <Box
              sx={{
                width: '562px',
                height: '60px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', color: '#44544A', ml: 5 }}>
                  Discarded eggs (6)
                </Typography>
              </Box>
              <Box sx={{ width: '240px', height: '36px', gap: 2, display: 'flex', mr: 3 }}>
                {' '}
                {/* Flexbox layout for spacing and alignment */}
                <Box
                  sx={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    border: '1px solid #C3CEC7',
                    color: '#FFFFFF'
                  }}
                >
                  <img
                    src='/icons/egg_dashboard/search.png'
                    width='20px'
                    height='20px'
                    style={{ marginTop: 6, marginLeft: 7 }}
                  />
                </Box>
                <Box
                  sx={{
                    width: '146px',
                    height: '36px',
                    borderRadius: '4px',
                    border: '1px solid #C3CEC7',
                    color: '#FFFFFF',
                    display: 'flex',
                    gap: 2
                  }}
                >
                  <Box sx={{ width: '98px', height: '17px' }}>
                    <Typography
                      sx={{
                        mt: 1.5,
                        ml: 2,
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        color: '#44544A'
                      }}
                    >
                      Last 3 days
                    </Typography>
                  </Box>
                  <Box sx={{ width: '20px', height: '20px', ml: 4, mt: 1 }}>
                    {/* <Typography>v</Typography> */}
                    <img
                      src='/icons/egg_dashboard/dropdown.png'
                      width='20px'
                      height='20px'
                      style={{ marginTop: '4px', marginLeft: '-2px' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: '35px', height: '35px', borderRadius: '4px', border: '1px solid #C3CEC7' }}>
                  <img
                    src='/icons/egg_dashboard/icon.png'
                    width='18px'
                    height='18px'
                    style={{ marginTop: '7px', marginLeft: '7px' }}
                  />
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                width: '562px',
                height: '610px',
                bgcolor: theme.palette.customColors.lightBg,
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  width: '514px',
                  height: '243px',
                  borderRadius: '8px',
                  border: '1px solid #C3CEC7',
                  position: 'absolute', // Position the box absolutely within the parent
                  top: '15%', // Move it to 50% from the top
                  left: '50%', // Center it horizontally
                  transform: 'translate(-50%, -30%)', // Adjust position: -50% horizontally and slightly above center vertically
                  backgroundColor: '#FFFF'
                }}
              >
                <Box
                  sx={{
                    width: '482px',
                    height: '44px',
                    display: 'flex',
                    mt: 4,
                    ml: 3,
                    alignItems: 'center',
                    justifyContent: 'space-between' // Ensures spacing between Avatar+Text and "05 eggs"
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <img src='/icons/egg_dashboard/discard_species.png' sx={{ width: 44, height: 44 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, width: '300px' }}>
                      <Box sx={{ display: 'flex' }}>
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: '16px',
                              fontWeight: 500,
                              lineHeight: '19.36px',
                              mt: 2,
                              color: '#44544A'
                            }}
                          >
                            0273/24
                          </Typography>
                        </Box>
                        <Box
                          sx={{ width: '69px', height: '25px', borderRadius: '4px', bgcolor: '#FFD3D3', ml: 2, mt: 1 }}
                        >
                          <Typography
                            sx={{
                              mt: 0.5,
                              textAlign: 'center',
                              color: '#E93353',
                              fontSize: '14px',
                              fontWeight: 500,
                              fontStyle: 'Inter'
                            }}
                          >
                            Rotten
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '16px',
                          lineHeight: '19.36px',
                          fontWeight: 500,
                          mt: 1.2,
                          color: '#1F515B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        Rainbow Lorikeet
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: 'Inter',
                      fontSize: '12px',
                      lineHeight: '14.52px',
                      textAlign: 'center',
                      color: '#44544A',
                      fontWeight: 400,
                      ml: 9,
                      color: '#839D8D'
                    }}
                  >
                    Security check pending
                  </Typography>
                </Box>
                <Divider sx={{ mt: 4 ,ml:4,mr:4,border:"1px solid border-bottom: 1px solid #C3CEC7"}} />
                <Box sx={{ width: '482px', height: '122px', gap: 4, mt: 1 }}>
                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex' }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        Discarded on
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>19 APR 2024</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex', mt: 2 }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        Batch
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>202400123 - 3A</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex', mt: 2 }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        AID
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>00273/24</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex', mt: 2 }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        EID
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>00669</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex', mt: 2 }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        Site
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>Site A</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '482px', height: '17px', gap: 16, display: 'flex', mt: 2 }}>
                    <Box sx={{ width: '113px', height: '17px' }}>
                      <Typography
                        sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', color: '#1F415B', ml: 5, mt: 2 }}
                      >
                        Reason
                      </Typography>
                    </Box>
                    <Box sx={{ width: '4px', height: '17px', mt: 1.5, ml: -8 }}>:</Box>
                    <Box
                      sx={{
                        width: '133px',
                        mt: 1.9,
                        ml: -12,
                        height: '17px',
                        color: '#1F415B',
                        fontWeight: 400,
                        fontSize: '14px',
                        fontFamily: 'Inter'
                      }}
                    >
                      <Typography sx={{ color: '#1F415B' }}>Blood ring</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* drower */}
        <Box
          sx={{
            position: 'relative',
            right: 0,
            height: '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            py: '24px',
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            zIndex: 1234
          }}
        >
          <LoadingButton
            sx={{ height: '58px', fontWeight: 500, fontSize: '15px', fontFamily: 'Inter' }}
            fullWidth
            // disabled={loader}
            variant='contained'
            type='submit'
            size='large'

            // loading={loading}
          >
            View Details
          </LoadingButton>
        </Box>
      </Drawer>
    </>
  )
}

export default DiscardEggSlider
