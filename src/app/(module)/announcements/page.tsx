'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Icon from 'src/@core/components/icon'

const AnnouncementsPage = () => {
  return (
    <Box>
      <Card>
        <CardHeader
          title='Announcements'
          action={
            <Button variant='contained' startIcon={<Icon icon='mdi:plus' />}>
              Create Announcement
            </Button>
          }
        />
        <CardContent>
          <Typography variant='body1'>
            Welcome to the Announcements module. This page is rendered using the App Router.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6'>Sample Announcement</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      This is a placeholder for your announcements. You can build out the full
                      functionality here using the App Router patterns.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AnnouncementsPage
