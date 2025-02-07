import { LoadingButton } from '@mui/lab'
import { Avatar, Drawer, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

function SpeciesDetails({ speciesDetailsDrawer, setSpeciesDetailsDrawer, fileInputRef }) {
  const default_icon =
    'https://api.dev.antzsystems.com/api/image/download/uploaded/file?path=uploads/677d0045451531736245317.jpg'
  const default_common_name = 'Rainbow Lorikeet'
  const complete_name = 'Trichoglossus moluccanus'
  const theme = useTheme()

  const SpeciesDietCard = () => (
    <Box
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        backgroundColor: 'background.default',
        height: '100%'
      }}
    >
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #C3CEC7',
          display: 'flex',
          gap: 1,
          padding: '20px 16px',
          marginX: 4
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              variant='rounded'
              alt='Medicine Image'
              sx={{
                width: 35,
                height: 35,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {default_icon ? (
                <img style={{ width: '100%', height: '100%' }} src={default_icon} alt='Profile' />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Tooltip title={complete_name ? complete_name : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.primary.light,
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '19.36px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 240
                  }}
                >
                  {complete_name ? complete_name : '-'}
                </Typography>
              </Tooltip>
              <Tooltip title={default_common_name ? default_common_name : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.primary.light,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 240
                  }}
                >
                  {default_common_name ? default_common_name : '-'}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.tableHeaderBg,
            borderRadius: '4px',
            width: '64px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <Typography
            sx={{ color: theme.palette.primary.light, fontSize: '16px', fontWeight: '600', lineHeight: '19.36px' }}
          >
            2
          </Typography>
          <Typography
            sx={{ color: theme.palette.primary.light, fontSize: '14px', fontWeight: '400', lineHeight: '16.94px' }}
          >
            Deits
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  const SpeciesDietUploadingCard = () => (
    <Box
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        backgroundColor: 'background.default',
        height: '100%'
      }}
    >
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #C3CEC7',
          display: 'flex',
          gap: 1,
          padding: '20px 16px',
          marginX: 4
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              variant='rounded'
              alt='Medicine Image'
              sx={{
                width: 48,
                height: 48,
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              <img style={{ width: '100%', height: '100%' }} src={'/icons/files_green.png'} alt='Profile' />
            </Avatar>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Tooltip title={complete_name ? complete_name : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.primary.light,
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '19.36px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 240
                  }}
                >
                  Uploading
                </Typography>
              </Tooltip>
              <Tooltip title={default_common_name ? default_common_name : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 240
                  }}
                >
                  Diet_De Brazza.pdf
                </Typography>
              </Tooltip>
              <LinearProgress value={50} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const DietAttachedCard = () => (
    <Box
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        backgroundColor: 'background.default',
        height: '100%'
      }}
    >
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #C3CEC7',
          display: 'flex',
          gap: 1,
          padding: '20px 16px',
          marginX: 4
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              variant='rounded'
              alt='Medicine Image'
              sx={{
                width: 48,
                height: 48,
                background: '#FFD3D34D',
                overflow: 'hidden'
              }}
            >
              <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon.png'} alt='Profile' />
            </Avatar>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                <Tooltip title={complete_name ? complete_name : '-'}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: 240
                    }}
                  >
                    Diet_Ringneck Parakeet _1.pdf
                  </Typography>
                </Tooltip>

                <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                  <Typography sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}>
                    1.2 MB
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  variant='rounded'
                  alt='Medicine Image'
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#E8F4F2',
                    overflow: 'hidden'
                  }}
                >
                  {default_icon ? (
                    <img style={{ width: '100%', height: '100%' }} src={default_icon} alt='Profile' />
                  ) : (
                    <Icon icon='mdi:user' />
                  )}
                </Avatar>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Tooltip title={complete_name ? complete_name : '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.primary.light,
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '16.96px',
                        letterSpacing: '0.1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: 240
                      }}
                    >
                      Jordan Stevenson
                    </Typography>
                  </Tooltip>
                  <Tooltip title={default_common_name ? default_common_name : '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '14.52px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: 240
                      }}
                    >
                      14 Apr 2024 | 12 : 35 PM
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box>
            <Icon icon='akar-icons:cross' style={{ cursor: 'pointer' }} fontSize={24} color={'#839D8D'} />
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const DietDetachedCard = () => (
    <Box
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        backgroundColor: 'background.default',
        height: '100%'
      }}
    >
      <Box
        sx={{
          backgroundColor: '#DAE7DF',
          borderRadius: '8px',
          display: 'flex',
          gap: 1,
          padding: '20px 16px',
          marginX: 4
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 48,
              height: 48,
              background: '#0000000D',
              overflow: 'hidden'
            }}
          >
            <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon.png'} alt='Profile' />
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
              <Tooltip title={complete_name ? complete_name : '-'}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '19.36px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 240
                  }}
                >
                  Diet_Ringneck Parakeet _1.pdf
                </Typography>
              </Tooltip>

              <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                <Typography sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}>
                  1.2 MB
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
              <Typography
                sx={{
                  color: '#E93353',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '14.52px',
                  mr: 1
                }}
              >
                Detached by
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '16.96px',
                  letterSpacing: '0.1px'
                }}
              >
                Jordan Stevenson
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '14.52px'
                }}
              >
                14 Apr 2024 | 12 : 35 PM
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={speciesDetailsDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
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
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Species Details</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setSpeciesDetailsDrawer(false)}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      {SpeciesDietCard()}
      <SpeciesDietUploadingCard />
      <DietAttachedCard />
      <DietDetachedCard />
      <DietAttachedCard />
      {/* bottom buttons */}
      <Box
        sx={{
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          fullWidth
          variant='contained'
          size='large'
          sx={{}}
          onClick={() => {
            fileInputRef.current.click()
            // handleApplyFilter()
            // setShowFilters(true)
          }}
        >
          UPLOAD NEW
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesDetails
