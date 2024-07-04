import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { fontFamily, fontSize, fontWeight } from '@mui/system'
import Icon from 'src/@core/components/icon'

const EggDisCarded = () => {
  return (
    <>
      <Grid sx={{ margin: 4, mt: 10, ml: 10 }}>
        <Card sx={{ width: '500px', border: '1px solid #C3CEC7' }}>
          <CardContent>
            <Box
              sx={{
                width: '450px',
                height: '102px',
                border: '2px solid #FFD3D3',
                borderRadius: '8px',
                gap: 12,
                display: 'flex'
              }}
            >
              <Box
                sx={{
                  width: '57px',
                  height: '99px',
                  borderTopLeftRadius: '7px', // Border radius on top left corner
                  borderBottomLeftRadius: '7px', // Border radius on bottom left corner
                  backgroundColor: '#FFD3D3',
                  borderLeft: '1px solid #FFD3D3',
                  gap: 10
                }}
              >
                <Box sx={{ width: '28px', height: '28px' }}>
                  <Avatar
                    src={'/icons/redEgg.png'}
                    sx={{
                      width: '36.33px',
                      height: '30px',
                      top: '35.5px',
                      left: '7.93px'
                    }}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  width: '290px',
                  height: '104px',
                  padding: '16px, 12px, 16px, 0px'
                }}
              >
                <Box sx={{ width: '238px', height: '72px', gap: 6 }}>
                  <Box sx={{ width: '238px', height: '20px' }}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: '500',
                        fontFamily: 'Inter',
                        mt: 2,
                        position: 'relative',
                        right: '25px'
                      }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: '400',
                            fontFamily: 'Inter',
                            color: '#44544A',
                            mt: 1,
                            position: 'relative',
                            right: '25px'
                          }}
                        >
                          0273 / 24
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          mt: 1.5,
                          position: 'relative',
                          right: '10px'
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#E93353',
                            fontSize: '14px',
                            fontWeight: '500',
                            px: 3,
                            backgroundColor: '#FFD3D3',
                            textAlign: 'center',
                            borderRadius: '4px'
                          }}
                        >
                          Rotten
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          gap: 10,
                          position: 'relative',
                          mt: 1,
                          left: '170px'
                        }}
                      >
                        <Icon icon='mdi:delete-outline' />
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: '400',
                        fontFamily: 'Inter',
                        mb: 3,
                        position: 'relative',
                        right: '25px'
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
      </Grid>
    </>
  )
}
export default EggDisCarded
