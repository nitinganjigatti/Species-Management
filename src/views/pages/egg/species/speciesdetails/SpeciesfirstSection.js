import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Typography, Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'

const SpeciesfirstSection = ({ eggDetails }) => {
  const theme = useTheme()
  const { t } = useTranslation()
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
            {t('egg_module.species_egg_module')}
          </Typography>
          <Box sx={{ backgroundColor: theme.palette.customColors.Surface, borderRadius: '8px' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Box
                  sx={{
                    height: '64px',
                    width: '64px',
                    borderRadius: '8px',
                    bgcolor: theme.palette.customColors.antzNotes80
                  }}
                >
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
                    {t('species_name')}
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
                  {t('egg_module.total_eggs')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
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
                  {t('egg_module.in_nest')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
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
                  {t('egg_module.incubation')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
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
                  {t('egg_module.hatched')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.primary.dark,
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
                  {t('egg_module.alive')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.primary.main,
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
                  {t('navigation.mortality')}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.customColors.Tertiary,
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
