import { Avatar, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const EggsStats = ({ allStats, setOpenDiscard, openDiscard }) => {
  const theme = useTheme()
  return (
    <>
      <Grid container spacing={3} columns={5}>
        <Grid item xs={5} sm={2.5} lg={1}>
          <Box
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              py: '24px',
              px: '16px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Avatar
              variant='square'
              sx={{ height: '40px', width: '40px' }}
              src='/icons/egg_dashboard/dashboard_nest.png'
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography
                sx={{
                  color: theme.palette.primary.dark,
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '19.36px'
                }}
              >
                {allStats?.total_egg_in_nest}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                Eggs in Nest
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={5} sm={2.5} lg={1}>
          <Box
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              py: '24px',
              px: '16px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Avatar
              variant='square'
              sx={{ height: '40px', width: '40px' }}
              src='/icons/egg_dashboard/eggToNursery.png'
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Typography
                  sx={{
                    //   color: theme.palette.primary.light,
                    color: '#00AFD6',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  {allStats?.total_eggs_to_nursery}{' '}
                </Typography>
                <Tooltip
                  placement='top'
                  title={
                    <>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: '300'
                        }}
                      >
                        In nursery:{' '}
                        <span
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {allStats?.total_eggs_in_nursery}
                        </span>
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: '300'
                        }}
                      >
                        In transit:{' '}
                        <span
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {allStats?.total_eggs_in_transit}
                        </span>
                      </p>
                    </>
                  }
                >
                  <IconButton sx={{ p: 0 }}>
                    <Icon
                      icon='mi:circle-information'
                      color={theme.palette.customColors.OnSurfaceVariant}
                      fontSize={14}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                Eggs to Nursery
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={5} sm={2.5} lg={1}>
          <Box
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              py: '24px',
              px: '16px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Avatar variant='square' sx={{ height: '40px', width: '40px' }} src='/icons/egg_dashboard/Hatched.png' />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '19.36px'
                }}
              >
                {allStats?.total_hatched_egg}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                Hatched
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={5} sm={2.5} lg={1}>
          <Box
            onClick={() => setOpenDiscard(true)}
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              py: '24px',
              px: '16px',
              cursor: 'pointer',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Avatar variant='square' sx={{ height: '40px', width: '40px' }} src='/icons/egg_dashboard/eggDiscard.png' />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Typography
                  sx={{
                    color: theme.palette.formContent.tertiary,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  {allStats?.total_egg_discard}
                </Typography>
                <Tooltip
                  placement='top'
                  title={
                    <>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: '300'
                        }}
                      >
                        Discarded:{' '}
                        <span
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {allStats?.total_egg_discarded}
                        </span>
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: '300'
                        }}
                      >
                        Marked for Discard:{' '}
                        <span
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {allStats?.total_egg_ready_to_be_discarded}
                        </span>
                      </p>
                    </>
                  }
                >
                  <IconButton sx={{ p: 0 }}>
                    <Icon
                      icon='mi:circle-information'
                      color={theme.palette.customColors.OnSurfaceVariant}
                      fontSize={14}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                Egg Discard
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={5} sm={2.5} lg={1}>
          <Box
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              py: '24px',
              px: '16px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Avatar variant='square' sx={{ height: '40px', width: '40px' }} src='/icons/egg_dashboard/totalEggs.png' />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography
                sx={{
                  color: '#1F515B',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '19.36px'
                }}
              >
                {allStats?.total_eggs}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px'
                }}
              >
                Total Eggs
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default EggsStats
