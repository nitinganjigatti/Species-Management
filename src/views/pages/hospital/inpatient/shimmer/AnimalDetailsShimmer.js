import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Skeleton, Grid, Card } from '@mui/material'

const AnimalDetailsShimmer = ({ additionalFields, backgroundColor }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        p: 6,
        borderRadius: '8px',
        backgroundColor: backgroundColor || theme.palette.customColors.displaybgPrimary,
        boxShadow: 'none'
      }}
    >
      <Grid container rowSpacing={4} columnSpacing={8} alignItems='center'>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              maxWidth: '100%'
            }}
          >
            <Skeleton variant='rounded' width={56} height={56} sx={{ borderRadius: '8px' }} />

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Skeleton variant='text' width={140} height={16} sx={{ mb: 1 }} />
              <Skeleton variant='text' width={140} height={16} sx={{ mb: 1 }} />
              <Skeleton variant='text' width={140} height={16} />
            </Box>
          </Box>
        </Grid>

        {Array.from({ length: additionalFields }).map((_, index) => (
          <Grid size={{ xs: 6, sm: 3, md: 2 }} key={index}>
            <Skeleton variant='text' width={80} height={20} sx={{ mb: 1 }} />
            <Skeleton variant='text' width={70} height={24} />
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

export default AnimalDetailsShimmer
