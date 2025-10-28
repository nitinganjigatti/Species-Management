import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Skeleton, Grid } from '@mui/material'

const AnimalDetailsShimmer = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: 6,
        borderRadius: '8px',
        bgcolor: theme.palette.common.white,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: { xs: 4, md: 12 }
      }}
    >
      {/* Left Section - Avatar and Basic Info Shimmer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minWidth: 200,
          width: { xs: '100%', md: 'auto' }
        }}
      >
        <Skeleton
          variant="rounded"
          width={58}
          height={58}
          sx={{ borderRadius: '8px' }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Skeleton
            variant="text"
            width={130}
            height={24}
            sx={{ mb: 1 }}
          />
          <Skeleton
            variant="text"
            width={100}
            height={20}
            sx={{ mb: 1 }}
          />
          <Skeleton
            variant="text"
            width={80}
            height={20}
          />
        </Box>
      </Box>

      {/* Right Section - Details Grid Shimmer */}
      <Grid
        container
        spacing={{ xs: 2, md: 6 }}
        sx={{
          flex: 1,
          mt: { xs: 2, md: 0 }
        }}
      >
        <Grid item size={{ xs: 6, md: 2 }}>
          <Skeleton
            variant="text"
            width={80}
            height={20}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width={70}
            height={24}
          />
        </Grid>
        <Grid item size={{ xs: 6, md: 3 }}>
          <Skeleton
            variant="text"
            width={100}
            height={20}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width={60}
            height={24}
          />
        </Grid>
        <Grid item size={{ xs: 6, md: 4 }}>
          <Skeleton
            variant="text"
            width={80}
            height={20}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width={180}
            height={24}
          />
        </Grid>
        <Grid item size={{ xs: 6, md: 3 }}>
          <Skeleton
            variant="text"
            width={150}
            height={20}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="text"
            width={170}
            height={24}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnimalDetailsShimmer