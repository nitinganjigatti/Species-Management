import React from 'react'
import HeaderCard from './InsightsHeaderCard'
import InfoStatCard from './InfoStatCard'
import { alpha, Box, Card, CircularProgress, Grid, IconButton, Typography } from '@mui/material'
import UserInfoCard from './UserInfoCard'
import { useTheme } from '@mui/material/styles'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined'

const InsightsCard = ({ image = '/images/housing/testInDev.jpg', data, zooName, userName, loading, error }) => {
  // TODO: Mapping has to be updated. zooName, userName and image has to be mapped from data
  const theme = useTheme()
  console.log('data', data)
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='150px'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Card sx={{ p: 3, bgcolor: '#ffe6e6' }}>
        <Typography color='error' variant='body1'>
          {error}
        </Typography>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant='body1'>No data available.</Typography>
      </Card>
    )
  }

  const showHeader = Boolean(zooName)
  const showUserInfo = Boolean(userName)
  const removeMarginTop = !showHeader && !showUserInfo

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        backgroundImage: image && `url(${image})`,
        background: !image && 'var(--Gradients-lightdark, linear-gradient(180deg, #37BD69 0%, #1F415B 100%))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        color: theme.palette.common.white
      }}
    >
      {/* Black overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: theme.palette.common.black,
          opacity: 0.4,
          zIndex: 1
        }}
      />

      {/* Foreground content */}
      <Box sx={{ position: 'relative', zIndex: 2, p: 6 }}>
        {showHeader && (
          <HeaderCard
            title='Northern Highland Zoological Sanctuary'
            subtitle='Bannerghatta North'
            onEdit={() => console.log('Edit clicked')}
            onDelete={() => console.log('Delete clicked')}
            onAddNew={() => console.log('Add new clicked')}
            onTimeClick={() => console.log('Time clicked')}
          />
        )}
        {showUserInfo && (
          <Box sx={{ mt: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <UserInfoCard avatarUrl='' name='Jordan Stevenson' role='Super Admin' />

            <Box display='flex' gap={2}>
              <IconButton
                sx={theme => ({
                  backgroundColor: alpha(theme.palette.common.white, 0.21),
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                  borderRadius: '50%',
                  padding: 2
                })}
              >
                <CallOutlinedIcon sx={{ color: theme => theme.palette.common.white }} />
              </IconButton>

              <IconButton
                sx={theme => ({
                  backgroundColor: alpha(theme.palette.common.white, 0.21),
                  border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                  borderRadius: '50%',
                  padding: 2
                })}
              >
                <InsertCommentOutlinedIcon sx={{ color: theme => theme.palette.common.white }} />
              </IconButton>
            </Box>
          </Box>
        )}
        <Box
          sx={{
            mt: removeMarginTop ? 0 : 10,
            p: { xs: 1.5, sm: 2 },
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.common.black, 0.3),
            backdropFilter: 'blur(0.5rem)',
            WebkitBackdropFilter: 'blur(0.5rem)'
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/species.svg'}
                value={data?.zoo_stats?.total_species || ''}
                label='Species'
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/animals.svg'}
                value={data?.zoo_stats?.total_animals || ''}
                label='Animals'
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/sections.svg'}
                value={data?.zoo_stats?.total_sections || ''}
                label='Sections'
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/enclosures.svg'}
                value={data?.zoo_stats?.total_enclosures || ''}
                label='Enclosures'
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default React.memo(InsightsCard)
