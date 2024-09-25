import { Avatar, Button, Card, CardContent, CardHeader, Grid, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import React from 'react'

const AnimalDetails = ({ eggDetails }) => {
  const headerAction = (
    <Typography sx={{ color: '#00AFD6', fontSize: '14px', lineHeight: '16.94px', fontWeight: 600, mr: 1 }}>
      De-link
    </Typography>
  )

  const animalData = [
    { key: 'Animal Id', value: eggDetails?.animal_data?.animal_id },
    { key: 'Site', value: eggDetails?.animal_data?.site_name },
    { key: 'Section', value: eggDetails?.animal_data?.section_name },
    { key: 'Enclosure', value: eggDetails?.animal_data?.user_enclosure_name }
  ]

  const theme = useTheme()
  return (
    <Card sx={{ backgroundColor: '#fff' }}>
      <CardHeader
        sx={{ pb: 0 }}
        title={'Animal Details'}
        // action={headerAction}
      />
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ backgroundColor: '#EFF5F2', borderRadius: '8px', py: '14px', px: '16px' }}>
          <Grid spacing={2} sx={{ rowGap: 4, alignItems: 'center' }} container>
            <Grid xs={12} sm={6} md={4} xl={3} item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  src={
                    eggDetails?.animal_data?.default_icon?.endsWith('.svg')
                      ? '/icons/egg_detail_nursery.png'
                      : eggDetails?.animal_data?.default_icon
                  }
                  variant='rounded'
                  alt='Medicine Image'
                  sx={{
                    width: 35,
                    height: 35,
                    borderRadius: '50%',
                    background: '#E8F4F2',
                    overflow: 'hidden'
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Typography
                    sx={{
                      color: theme.palette.primary.light,
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      whiteSpace: 'normal', // Change this to allow wrapping
                      wordWrap: 'break-word',
                      wordBreak: 'break-word', // Change this to 'break-word'
                      width: '100%'
                    }}
                  >
                    {eggDetails?.animal_data?.default_common_name || '-'}
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.primary.light,
                      fontSize: '14px',
                      fontWeight: '400',
                      lineHeight: '16.94px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      whiteSpace: 'normal', // Change this to allow wrapping
                      wordWrap: 'break-word',
                      wordBreak: 'break-word', // Change this to 'break-word'
                      width: '100%'
                    }}
                  >
                    {eggDetails?.animal_data?.scientific_name || '-'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {animalData?.map((item, index) => (
              <Grid key={index} xs={12} sm={6} md={4} xl={2.25} item>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  {item?.key}
                </Typography>
                <Tooltip title={item?.value ? item?.value : '-'}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '19.36px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      whiteSpace: 'normal', // Change this to allow wrapping
                      wordWrap: 'break-word',
                      wordBreak: 'break-word', // Change this to 'break-word'
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item?.value}
                  </Typography>
                </Tooltip>
              </Grid>
            ))}
            {/* <Grid xs={12} sm={6} lg={4} xl={1.7} item>
              <Button variant='contained'>VIEW DETAILS</Button>
            </Grid> */}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AnimalDetails
