import { Avatar, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'

const Dashboard = () => {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ backgroundColor: 'pink', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Grid container columns={5}>
          <Grid item xs={2}>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '24px',
                fontWeight: '500',
                lineHeight: '29.05px'
              }}
            >
              Current Stats
            </Typography>
          </Grid>
          <Grid item xs={3}></Grid>
        </Grid>
        <Grid container spacing={'12px'} columns={5}>
          <Grid item xs={1}>
            <Box sx={{ py: '24px', px: '16px', display: 'flex', gap: '8px' }}>
              <Avatar sx={{ height: '40px', width: '40px' }} src='/icons/egg_dashboard/dashboard_egg.png' />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    color: theme.palette.formContent.tertiary,
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '19.36px'
                  }}
                >
                  3768
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '400',
                    lineHeight: '16.94px'
                  }}
                ></Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      </Box>
      <Box sx={{ backgroundColor: 'yellow' }}></Box>
      <Box sx={{ backgroundColor: 'green' }}></Box>
      <Box sx={{ backgroundColor: 'purple' }}></Box>
    </Box>
  )
}

export default Dashboard
