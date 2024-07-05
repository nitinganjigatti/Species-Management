import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

const EggDisCarded = () => {
  return (
    <Card sx={{ width: '514px', m: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box
            sx={{
              width: '100%',
              height: '124px',
              border: '2px solid #FFD3D3',
              borderRadius: '8px',
              display: 'flex',
              gap: 4,
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                width: '70px',
                height: '120px',
                backgroundColor: '#FFD3D3',
                borderLeft: '1px solid FFD3D3',
                display: 'flex',
                borderTopLeftRadius: '5px ',
                borderBottomLeftRadius: '5px ',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Avatar src={'/icons/redEgg.png'} sx={{ width: '36.33px', height: '30px' }} />
            </Box>
            <Box
              sx={{
                flex: 1,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter',
                  position: 'relative',
                  right: '10px',
                  bottom: 0
                }}
              >
                Rainbow Lorikee
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <Box>
                  {' '}
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      fontFamily: 'Inter',
                      color: '#44544A',
                      position: 'relative',
                      right: '10px',
                      bottom: '2px'
                    }}
                  >
                    0273 / 24
                  </Typography>
                </Box>
                <Box>
                  {' '}
                  <Typography
                    sx={{
                      color: '#E93353',
                      fontSize: '14px',
                      fontWeight: '500',
                      px: 3,
                      backgroundColor: '#FFD3D3',
                      textAlign: 'center',
                      borderRadius: '4px',
                      alignSelf: 'flex-start',
                      position: 'relative',
                      bottom: '0px'
                    }}
                  >
                    Rotten
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', left: '180px' }}>
                  <Icon icon='mdi:delete-outline' sx={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  right: '12px',
                  bottom: '10px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: '400',
                    fontFamily: 'Inter'
                  }}
                >
                  10 Apr 2024
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: '100%',
              height: '124px',
              border: '2px solid #FFD3D3',
              borderRadius: '8px',
              display: 'flex',
              gap: 4,
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                width: '70px',
                height: '120px',
                backgroundColor: '#FFD3D3',
                borderLeft: '1px solid FFD3D3',
                display: 'flex',
                borderTopLeftRadius: '5px ',
                borderBottomLeftRadius: '5px ',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Avatar src={'/icons/redEgg.png'} sx={{ width: '36.33px', height: '30px' }} />
            </Box>
            <Box
              sx={{
                flex: 1,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter',
                  position: 'relative',
                  right: '10px',
                  bottom: 0
                }}
              >
                Rainbow Lorikee
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <Box>
                  {' '}
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      fontFamily: 'Inter',
                      color: '#44544A',
                      position: 'relative',
                      right: '10px',
                      bottom: '2px'
                    }}
                  >
                    0273 / 24
                  </Typography>
                </Box>
                <Box>
                  {' '}
                  <Typography
                    sx={{
                      color: '#E93353',
                      fontSize: '14px',
                      fontWeight: '500',
                      px: 3,
                      backgroundColor: '#FFD3D3',
                      textAlign: 'center',
                      borderRadius: '4px',
                      alignSelf: 'flex-start',
                      position: 'relative',
                      bottom: '0px'
                    }}
                  >
                    Rotten
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', left: '180px' }}>
                  <Icon icon='mdi:delete-outline' sx={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  right: '12px',
                  bottom: '10px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: '400',
                    fontFamily: 'Inter'
                  }}
                >
                  10 Apr 2024
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EggDisCarded
