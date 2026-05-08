import React from 'react'
import { Box, Skeleton } from '@mui/material'

interface ClinicalAssessmentShimmerProps {
  count?: number
}

const ClinicalAssessmentShimmer = ({ count = 5 }: ClinicalAssessmentShimmerProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            padding: { xs: '16px', sm: '20px', md: '24px' },
            backgroundColor: 'background.paper'
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 2fr',
                md: '1fr 2fr 1fr'
              },
              gap: { xs: 1.5, sm: 2 },
              alignItems: { xs: 'flex-start', sm: 'center' }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant='rounded' width={120} height={32} />
              <Skeleton variant='text' width='80%' height={32} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Skeleton variant='rounded' width={80} height={24} />
                <Skeleton variant='text' width={60} height={20} />
                <Skeleton variant='text' width={70} height={20} />
              </Box>
            </Box>

            <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Skeleton variant='text' width={60} height={20} />
                <Skeleton variant='text' width={40} height={24} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Skeleton variant='text' width={140} height={20} />
                <Skeleton variant='text' width={100} height={20} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Skeleton variant='text' width={100} height={20} />
                <Skeleton variant='text' width={50} height={20} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Skeleton variant='text' width={80} height={20} />
                <Skeleton variant='text' width={70} height={20} />
              </Box>

              <Skeleton variant='text' width='90%' height={40} sx={{ mb: 1 }} />
              <Skeleton variant='text' width={150} height={16} />
            </Box>

            <Box
              sx={{
                gridColumn: { xs: '1', sm: '1 / span 2', md: '3' },
                mt: { xs: 1, md: 0 },
                pt: { xs: 1.5, md: 0 }
              }}
            >
              <Skeleton variant='text' width={80} height={16} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant='circular' width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' width='80%' height={20} />
                  <Skeleton variant='text' width='60%' height={16} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default ClinicalAssessmentShimmer
