import { Avatar, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import { Box, display } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ConditionSlider from 'src/views/pages/egg/eggs/oonditionSlider'


const EggDetail = () => {
  const [openDrawer, setOpenDrawer] = useState(false)

  const theme = useTheme()
  return (
    <>
      <Card>
        <CardContent>
          <Grid container>
            <Grid sx={{ pr: '24px' }} item xs={3}>
              <Typography sx={{ height: '206px', background: theme.palette.customColors.lightBg, borderRadius: '8px' }}>
                Slider
              </Typography>
            </Grid>
            <Grid sx={{ alignSelf: 'stretch', height: '100%', py: '24px' }} xs={9} item>
              <Box sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', mb: '24px' }}>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '36px',
                      lineHeight: '43.57px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    0273 /24
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Box>
                      <Avatar></Avatar>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Jordan Stevenson
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '14.52px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        Updated on 1 Apr 2024
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '8px' }}>
                    <Box>
                      <Button variant='outlined'>DISCARD</Button>
                    </Box>
                    <Box>
                      <Button variant='contained'>ALLOCATE</Button>
                    </Box>

                    <Box>
                      <Button variant='contained' onClick={() => setOpenDrawer(true)}>
                        Condition
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Grid container gap={'24px'} sx={{ justifyContent: 'space-between' }}>
                <Grid
                  item
                  xs={3.75}
                  sx={{ display: 'flex', height: '88px', backgroundColor: 'skyblue', p: '12px', borderRadius: '8px' }}
                >
                  <Box>
                    <Avatar></Avatar>
                  </Box>
                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        1 Apr 2024
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Found date
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={3.75}
                  sx={{ display: 'flex', height: '88px', backgroundColor: 'skyblue', p: '12px', borderRadius: '8px' }}
                >
                  <Box>
                    <Avatar></Avatar>
                  </Box>
                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        Not Added
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.primary.main
                        }}
                      >
                        Current weight
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={3.75}
                  sx={{ display: 'flex', height: '88px', backgroundColor: 'green', p: '12px', borderRadius: '8px' }}
                >
                  <Box sx={{ height: '64px', width: '64px', borderRadius: '6px' }}>
                    <Avatar></Avatar>
                  </Box>
                  <Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          lineHeight: '24.2px',
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Intact
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '16.94px',
                          color: theme.palette.primary.main
                        }}
                      >
                        Warm Condition
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Icon icon='uil:angle-right' fontSize={14} />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {openDrawer && <ConditionSlider setOpenDrawer={setOpenDrawer} />}
    </>
  )
}

export default EggDetail
