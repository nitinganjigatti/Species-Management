import React from 'react'
import { Box, Card, CardContent, Typography, useTheme, useMediaQuery, alpha } from '@mui/material'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

// Responsive prop resolver (handles breakpoint-based props)
function useResponsivePropValue(prop, fallback) {
  const theme = useTheme()

  const isXs = useMediaQuery(theme.breakpoints.only('xs'))
  const isSm = useMediaQuery(theme.breakpoints.only('sm'))
  const isMd = useMediaQuery(theme.breakpoints.only('md'))
  const isLg = useMediaQuery(theme.breakpoints.only('lg'))
  const isXl = useMediaQuery(theme.breakpoints.only('xl'))

  // Early return for static values
  if (prop == null || typeof prop !== 'object') return prop ?? fallback

  if (isXl && prop.xl !== undefined) return prop.xl
  if (isLg && prop.lg !== undefined) return prop.lg
  if (isMd && prop.md !== undefined) return prop.md
  if (isSm && prop.sm !== undefined) return prop.sm
  if (isXs && prop.xs !== undefined) return prop.xs

  return fallback
}

const MoreMediaListing = ({
  mediaItems = [],
  maxVisibleItems = { xs: 1, sm: 4, md: 5, lg: 2 },
  onMoreClick = () => {}
}) => {
  const theme = useTheme()
  const maxVisible = useResponsivePropValue(maxVisibleItems, 2)

  if (mediaItems?.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        No media items to display
      </Typography>
    )
  }

  const visibleItems = mediaItems?.slice(0, maxVisible)
  const remainingCount = Math.max(0, mediaItems?.length - maxVisible)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '12px'
      }}
    >
      {visibleItems?.map((item, index) => (
        <FilePreviewCard
          key={item?.id}
          fileUrl={item?.file}
          fileType={item?.file_type}
          width={'133px'}
          height={'100px'}
          showTitle={false}
        />
      ))}
      {remainingCount > 0 && (
        <Card
          onClick={() => onMoreClick(mediaItems?.slice(maxVisible))}
          sx={{
            width: '66px',
            height: '100px',
            minWidth: '66px',
            minHeight: '100px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            background: alpha(theme.palette.customColors.displaybgPrimary, 0.6)
          }}
        >
          <Box sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              +{remainingCount} <br />
              more
            </Typography>
          </Box>
        </Card>
      )}
    </Box>
  )
}

export default MoreMediaListing
