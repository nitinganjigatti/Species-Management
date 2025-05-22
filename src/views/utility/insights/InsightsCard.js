import React from 'react'
import HeaderCard from './InsightsHeaderCard'
import InfoStatCard from './InfoStatCard'
import { alpha, Box, Card, CircularProgress, Grid, IconButton, Typography } from '@mui/material'
import UserInfoCard from './UserInfoCard'
import { useTheme } from '@mui/material/styles'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'

const InsightsCard = ({
  data,
  loading,
  error,
  isAllSites = false,
  actions = {},
  onCallClick,
  onMessageClick,
  onInfoClick = {},
  zooName,
  subtitle,
  userName,
  description,
  userImage,
  image = '/images/housing/testInDev.jpg',
  speciesCount,
  animalCount,
  sectionsCount,
  enclosuresCount
}) => {
  const theme = useTheme()

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
        {isAllSites && (
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.common.white, 0.16),
                color: theme.palette.customColors.PrimaryContainer,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                height: 'fit-content'
              }}
            >
              <InsightsOutlinedIcon />
            </Box>
            <Typography sx={{ color: theme => theme.palette.common.white, fontSize: '1.5rem' }} fontWeight={600}>
              All Site Insights
            </Typography>
          </Box>
        )}
        {showHeader && <HeaderCard title={zooName || ''} subtitle={subtitle || ''} {...actions} />}

        {showUserInfo && (
          <Box sx={{ mt: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <UserInfoCard avatarUrl={userImage || ''} name={userName || ''} description={description || ''} />
            <Box display='flex' gap={2}>
              {onCallClick && (
                <IconButton
                  onClick={onCallClick}
                  sx={{
                    backgroundColor: alpha(theme.palette.common.white, 0.21),
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                    borderRadius: '50%',
                    padding: 2
                  }}
                >
                  <CallOutlinedIcon sx={{ color: theme.palette.common.white }} />
                </IconButton>
              )}
              {onMessageClick && (
                <IconButton
                  onClick={onMessageClick}
                  sx={{
                    backgroundColor: alpha(theme.palette.common.white, 0.21),
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                    borderRadius: '50%',
                    padding: 2
                  }}
                >
                  <InsertCommentOutlinedIcon sx={{ color: theme.palette.common.white }} />
                </IconButton>
              )}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            mt: 10,
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
                value={speciesCount}
                label='Species'
                onClick={onInfoClick?.species}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/animals.svg'}
                value={animalCount}
                label='Animals'
                onClick={onInfoClick?.animals}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/sections.svg'}
                value={sectionsCount}
                label='Sections'
                onClick={onInfoClick?.sections}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoStatCard
                imagePath={'/images/housing/enclosures.svg'}
                value={enclosuresCount}
                label='Enclosures'
                onClick={onInfoClick?.enclosures}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default React.memo(InsightsCard)
