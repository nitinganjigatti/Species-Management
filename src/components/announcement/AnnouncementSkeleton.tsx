'use client'

import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'

interface AnnouncementSkeletonProps {
  showMedia?: boolean
  showDescription?: boolean
}

const AnnouncementSkeleton = ({
  showMedia = false,
  showDescription = true
}: AnnouncementSkeletonProps) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header - Icon + Label + Badge area */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton variant='circular' width={40} height={40} />
          <Skeleton variant='text' width={120} height={24} />
        </Box>
        <Skeleton variant='rounded' width={24} height={24} />
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Title */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Skeleton variant='text' width='80%' height={32} />
      </Box>

      {/* Author and time */}
      <Box sx={{ px: 2, pt: 0.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant='text' width='35%' height={20} />
      </Box>

      {/* Description */}
      {showDescription && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Skeleton variant='text' width='100%' height={18} />
          <Skeleton variant='text' width='90%' height={18} />
          <Skeleton variant='text' width='60%' height={18} />
        </Box>
      )}

      {/* Media Preview */}
      {showMedia && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Skeleton
            variant='rounded'
            width='100%'
            height={200}
            sx={{ borderRadius: '8px' }}
          />
        </Box>
      )}

      <Divider sx={{ mx: 2 }} />

      {/* Like and Comment row */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Skeleton variant='circular' width={28} height={28} />
          <Skeleton variant='text' width={20} height={20} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Skeleton variant='circular' width={28} height={28} />
          <Skeleton variant='text' width={20} height={20} />
        </Box>
      </Box>
    </Card>
  )
}

export default AnnouncementSkeleton
