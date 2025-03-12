import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Typography, Card, CardContent } from '@mui/material'

const SpeciesfirstSection = ({ eggDetails }) => {
  const theme = useTheme()
  return (
    <>
      <Card>
        <CardContent
          style={{ paddingBottom: 0 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            mb: 8
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500,
              fontSize: '22px',
              lineHeight: '29.05px'
            }}
          >
            Species Egg Module
          </Typography>
          <Box sx={{ backgroundColor: '#F2FFF8', borderRadius: '8px' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Box sx={{ height: '64px', width: '64px', borderRadius: '8px', bgcolor: '#FFE86E' }}>
                  <img src='/icons/Incubator_CON.png' alt='incubator' style={{ height: '100%', width: '100%' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '16.94px',
                      mb: '6px'
                    }}
                  >
                    Species name
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '19.36px'
                    }}
                  >
                    {eggDetails.complete_name}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Total Eggs
                </Typography>
                <Typography
                  sx={{
                    color: '#006D35',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.total_egg}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  In Nest
                </Typography>
                <Typography
                  sx={{
                    color: '#006D35',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.egg_in_nest}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Incubation
                </Typography>
                <Typography
                  sx={{
                    color: '#006D35',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.egg_in_incubation}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Hatched
                </Typography>
                <Typography
                  sx={{
                    color: '#006D35',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.egg_in_hatched}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Alive
                </Typography>
                <Typography
                  sx={{
                    color: '#37BD69',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.egg_in_alive}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16.94px',
                    mb: '6px'
                  }}
                >
                  Mortality
                </Typography>
                <Typography
                  sx={{
                    color: '#FA6140',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px'
                  }}
                >
                  {eggDetails.egg_in_mortality}
                </Typography>
              </Box>
            </CardContent>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}

export default SpeciesfirstSection
