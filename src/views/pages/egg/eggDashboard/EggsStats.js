import React from 'react'
import { Avatar, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'

const StatBox = ({ avatarSrc, value, label, tooltipContent, onClick, valueColor }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '8px',
        backgroundColor: theme.palette.background.paper,
        py: '24px',
        px: '16px',
        display: 'flex',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <Avatar variant='square' sx={{ height: '40px', width: '40px' }} src={avatarSrc} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Typography
            sx={{
              color: valueColor || theme.palette.primary.main,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            {value ? value : 0}
          </Typography>
          {tooltipContent && (
            <Tooltip placement='top' title={tooltipContent}>
              <IconButton sx={{ p: 0 }}>
                <Icon icon='mi:circle-information' color={theme.palette.customColors.OnSurfaceVariant} fontSize={14} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '16.94px'
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

const EggsStats = ({ allStats, setOpenDiscard }) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const statsData = [
    {
      avatarSrc: '/icons/egg_dashboard/dashboard_nest.png',
      value: allStats?.total_egg_in_nest,
      label: 'Eggs in Nest'
    },
    {
      avatarSrc: '/icons/egg_dashboard/eggToNursery.png',
      value:
        (Number.isNaN(allStats?.total_eggs_to_nursery) ? 0 : Number(allStats?.total_eggs_to_nursery)) +
        (Number.isNaN(allStats?.total_eggs_in_transit) ? 0 : Number(allStats?.total_eggs_in_transit)) +
        (Number.isNaN(allStats?.total_eggs_in_nursery) ? 0 : Number(allStats?.total_eggs_in_nursery)) +
        (Number.isNaN(allStats?.total_eggs_in_incubators) ? 0 : Number(allStats?.total_eggs_in_incubators)),
      label: 'Eggs to Nursery',
      tooltipContent: (
        <>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            In nursery: <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_eggs_in_nursery}</span>
          </p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            In transit: <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_eggs_in_transit}</span>
          </p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            To nursery: <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_eggs_to_nursery}</span>
          </p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            In Incubator:
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_eggs_in_incubators}</span>
          </p>
        </>
      ),
      valueColor: '#00AFD6'
    },
    {
      avatarSrc: '/icons/egg_dashboard/Hatched.png',
      value: allStats?.total_hatched_egg,
      label: 'Hatched'
    },
    {
      avatarSrc: '/icons/egg_dashboard/eggDiscard.png',
      value:
        (Number.isNaN(allStats?.total_egg_ready_to_be_discarded_site)
          ? 0
          : Number(allStats?.total_egg_ready_to_be_discarded_site)) +
        (Number.isNaN(allStats?.total_egg_discarded_at_site) ? 0 : Number(allStats?.total_egg_discarded_at_site)) +
        (Number.isNaN(allStats?.total_egg_discarded_at_nursery)
          ? 0
          : Number(allStats?.total_egg_discarded_at_nursery)) +
        (Number.isNaN(allStats?.total_egg_ready_to_be_discarded_nursery)
          ? 0
          : Number(allStats?.total_egg_ready_to_be_discarded_nursery)),
      label: 'Egg Discard',
      onClick: () => setOpenDiscard(true),
      tooltipContent: (
        <>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            {t('egg_module.ready_to_be_discarded_at_site')}:{' '}
            <span style={{ fontSize: '12px', fontWeight: '500' }}>
              {allStats?.total_egg_ready_to_be_discarded_site}
            </span>
          </p>

          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            Discarded at site:{' '}
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_egg_discarded_at_site}</span>
          </p>

          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            Ready to be discarded at nursery:{' '}
            <span style={{ fontSize: '12px', fontWeight: '500' }}>
              {allStats?.total_egg_ready_to_be_discarded_nursery}
            </span>
          </p>

          <p style={{ margin: 0, fontSize: '12px', fontWeight: '300' }}>
            Discarded at nursery:{' '}
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{allStats?.total_egg_discarded_at_nursery}</span>
          </p>
        </>
      ),
      valueColor: theme.palette.formContent.tertiary
    },
    {
      avatarSrc: '/icons/egg_dashboard/totalEggs.png',
      value: allStats?.total_eggs,
      label: 'Total Eggs',
      valueColor: '#1F515B'
    }
  ]

  return (
    <Grid container spacing={3} columns={5}>
      {statsData.map((stat, index) => (
        <Grid item size={{ xs: 5, sm: 2.5, lg: 1 }} key={index}>
          <StatBox {...stat} />
        </Grid>
      ))}
    </Grid>
  )
}

export default EggsStats
