import { Avatar, Button, Card, CardContent, CardHeader, Grid, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'

const AnimalDetails = ({ eggDetails, animal_id }) => {
  const headerAction = (
    <Typography sx={{ color: '#00AFD6', fontSize: '14px', lineHeight: '16.94px', fontWeight: 600, mr: 1 }}>
      De-link
    </Typography>
  )

  const theme = useTheme()
  return (
    <Card sx={{ backgroundColor: '#fff' }}>
      <CardHeader
        sx={{ pb: 0 }}
        title={'Animal Details'}
        // action={headerAction}
      />
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ backgroundColor: '#F2FFF8', borderRadius: '8px' }}>
          <CardContent>
            <Grid spacing={2} sx={{ rowGap: 4, alignItems: 'center', justifyContent: 'space-between' }} container>
              <Grid xs={12} sm={6} lg={4} xl={3} item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={eggDetails?.animal_data?.default_icon}
                    variant='rounded'
                    alt='Medicine Image'
                    sx={{
                      width: 35,
                      height: 35,
                      mr: 4,
                      borderRadius: '50%',
                      background: '#E8F4F2',
                      overflow: 'hidden'
                    }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Tooltip title={'-'}>
                      <Typography
                        sx={{
                          color: theme.palette.primary.light,
                          fontSize: '16px',
                          fontWeight: '500',
                          lineHeight: '19.36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%'
                        }}
                      >
                        {eggDetails?.animal_data?.default_common_name}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={'-'}>
                      <Typography
                        sx={{
                          color: theme.palette.primary.light,
                          fontSize: '14px',
                          fontWeight: '400',
                          lineHeight: '16.94px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%'
                        }}
                      >
                        {eggDetails?.animal_data?.scientific_name}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </Grid>
              <Grid xs={12} sm={6} lg={4} xl={1.7} item>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Animal Id
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails?.animal_data?.animal_id}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} lg={4} xl={1.7} item>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Site
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails?.animal_data?.site_name}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} lg={4} xl={1.7} item>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Section
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails?.animal_data?.section_name}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} lg={4} xl={1.7} item>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Enclosure
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails?.animal_data?.user_enclosure_name}
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} lg={4} xl={1.7} item>
                <Button variant='contained'>VIEW DETAILS</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AnimalDetails
