import React from 'react'
import { Box, Card, CardContent, Typography, Avatar, Grid, useTheme, useMediaQuery, IconButton } from '@mui/material'
import MediaCard from 'src/views/utility/MediaCard'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

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
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', flexWrap: 'nowrap' }}>
      {/* Visible Media Items */}
      {visibleItems.map((item, index) => (
        <FilePreviewCard key={item.id || index} fileUrl={item?.fileUrl} width={200} height={80} />
      ))}
      {remainingCount > 0 && (
        <Card
          sx={{
            width: 90,
            height: 100,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            background: '#E8F4F299'
          }}
          onClick={() => onMoreClick(mediaItems.slice(visibleItemsCount))}
        >
          <CardContent sx={{ p: 1 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F515B', textAlign: 'center' }}>
              +{remainingCount} <br />
              more
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default MoreMediaListing
