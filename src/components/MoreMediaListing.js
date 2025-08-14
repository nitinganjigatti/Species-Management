import React from 'react'
import { Box, Card, CardContent, Typography, Avatar, Grid, useTheme, useMediaQuery, IconButton } from '@mui/material'
import MediaCard from 'src/views/utility/MediaCard'

const MoreMediaListing = ({ mediaItems = [], maxVisibleItems = 2, onMoreClick = () => {} }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const getMaxVisibleItems = () => {
    if (isMobile) return Math.min(maxVisibleItems, 1)
    if (isTablet) return Math.min(maxVisibleItems, 2)

    return maxVisibleItems
  }

  const visibleItemsCount = getMaxVisibleItems()
  const visibleItems = mediaItems.slice(0, visibleItemsCount)
  const remainingCount = Math.max(0, mediaItems.length - visibleItemsCount)

  if (!mediaItems.length) {
    return (
      <Typography variant='body2' color='text.secondary'>
        No media items to display
      </Typography>
    )
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Visible Media Items */}
        {visibleItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={item.id || index}>
            <MediaCard media={mediaItems} isBorderedCard />
          </Grid>
        ))}
        {remainingCount > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                borderRadius: 1,
                background: '#E8F4F299',
                p: 6
              }}
              onClick={() => onMoreClick(mediaItems.slice(visibleItemsCount))}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: 80
                  }}
                >
                  <Typography
                    sx={{
                      color: '#1F515B',
                      fontWeight: 500,
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  >
                    +{remainingCount}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#1F515B',
                      fontWeight: 500,
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  >
                    more
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default MoreMediaListing
