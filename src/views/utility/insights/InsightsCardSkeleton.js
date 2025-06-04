import React from 'react'
import { Box, Grid, Skeleton, useTheme, alpha } from '@mui/material'

const InsightsCardSkeleton = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        background: 'var(--Gradients-lightdark, linear-gradient(180deg, #37BD69 0%, #1F415B 100%))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        color: theme.palette.common.white,
        p: 6
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: theme.palette.common.black,
          opacity: 0.4,
          zIndex: 1
        }}
      />

      {/* Shimmer Foreground */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* HeaderCard shimmer */}
        <Skeleton variant='text' width='40%' height={28} sx={{ mb: 1, bgcolor: theme.palette.customColors?.grey800 }} />
        <Skeleton variant='text' width='30%' height={20} sx={{ mb: 4, bgcolor: theme.palette.customColors?.grey700 }} />

        {/* User info shimmer */}
        <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap', mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Skeleton variant='circular' width={56} height={56} sx={{ bgcolor: theme.palette.customColors?.grey800 }} />
            <Box>
              <Skeleton variant='text' width={120} height={20} sx={{ mb: 1, bgcolor: theme.palette.customColors?.grey800 }} />
              <Skeleton variant='text' width={80} height={16} sx={{ bgcolor: theme.palette.customColors?.grey800 }} />
            </Box>
          </Box>
        </Box>

        {/* Stats shimmer grid */}
        <Box
          sx={{
            mt: 6,
            p: { xs: 1.5, sm: 2 },
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.common.black, 0.3),
            backdropFilter: 'blur(0.5rem)',
            WebkitBackdropFilter: 'blur(0.5rem)'
          }}
        >
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={6} sm={3} md={3} key={i}>
                <Box
                  sx={{
                    p: { xs: 1.25, sm: 2 },
                    borderRadius: { xs: 2, sm: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 2, sm: 4 },
                    color: 'white',
                    minWidth: { xs: 120, sm: 150 }
                  }}
                >
                  {/* Rectangular image/icon box with rounded corners */}
                  <Box
                    sx={{
                      width: { xs: 40, sm: 56 },
                      height: { xs: 40, sm: 56 },
                      p: { xs: 1.5, sm: 3 },
                      borderRadius: 1,
                      bgcolor: theme.palette.customColors?.grey800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Skeleton
                      variant='rectangular'
                      width={{ xs: 24, sm: 32 }}
                      height={{ xs: 24, sm: 32 }}
                      sx={{ borderRadius: 1, bgcolor: theme.palette.customColors?.grey700 }}
                    />
                  </Box>

                  {/* Text block */}
                  <Box>
                    <Skeleton
                      variant='text'
                      width={60}
                      height={theme.typography.pxToRem(24)}
                      sx={{
                        mb: 1,
                        bgcolor: theme.palette.customColors?.grey800,
                        borderRadius: 1
                      }}
                    />
                    <Skeleton
                      variant='text'
                      width={80}
                      height={theme.typography.pxToRem(18)}
                      sx={{ bgcolor: theme.palette.customColors?.grey800, borderRadius: 1 }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default React.memo(InsightsCardSkeleton)
