import React from 'react'
import HeaderCard from './InsightsHeaderCard'
import InfoStatCard from './InfoStatCard'
import { alpha, Box, Card, CircularProgress, Grid, IconButton, Typography } from '@mui/material'
import UserInfoCard from './UserInfoCard'
import { useTheme } from '@mui/material/styles'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import RenderUtility from 'src/utility/render'

const InsightsCard = ({
  data,
  loading,
  error,
  isListingPage = false,
  pageTitle,
  actions = {},
  onCallClick,
  onMessageClick,
  zooName,
  subtitle,
  userName,
  description,
  userImage,
  image = '/images/housing/testInDev.jpg',
  statsData = []
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
        {isListingPage && (
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
              {pageTitle || ''}
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

        {Array.isArray(statsData) && statsData.length > 0 && (
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
            <Grid container spacing={3} justifyContent='flex-start'>
              {statsData.map((item, index) => {
                const length = statsData.length

                let xs = 6
                let sm = 6
                let md = 12 / length

                // Special handling when there are exactly 2 items
                if (length === 2) {
                  xs = 6 // still stack on extra small screens
                  sm = 3 // 25% width
                  md = 3
                } else if (length === 1) {
                  sm = 6
                  md = 6
                } else if (length === 4) {
                  md = 3
                }

                return (
                  <Grid item xs={xs} sm={sm} md={md} key={index} display='flex' justifyContent='flex-start'>
                    <InfoStatCard
                      imagePath={item.imagePath}
                      value={item.value}
                      label={item.label}
                      onClick={item.onClick}
                    />
                  </Grid>
                )
              })}
            </Grid>

            {/* <Grid container spacing={3} justifyContent={'flex-start'}>
              {statsData.map((item, index) => (
                <Grid
                  item
                  xs={6}
                  sm={statsData.length === 1 ? 6 : 12 / Math.min(2, statsData.length)}
                  md={statsData.length === 4 ? 3 : 12 / statsData.length}
                  key={index}
                  display='flex'
                  justifyContent={'flex-start'}
                >
                  <InfoStatCard
                    imagePath={item.imagePath}
                    value={item.value}
                    label={item.label}
                    onClick={item.onClick}
                  />
                </Grid>
              ))}
            </Grid> */}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(InsightsCard)
