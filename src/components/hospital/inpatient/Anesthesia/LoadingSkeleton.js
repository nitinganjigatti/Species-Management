import { Box, Grid } from '@mui/material'
import Skeleton from '@mui/material/Skeleton'

const DetailsHeaderSkeleton = () => (
  <Skeleton variant='rounded' width={180} height={32} sx={{ mb: 2 }} />
)

const StatBlockSkeleton = () => (
  <Grid container spacing={4} sx={{ px: '8px' }}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Grid item key={`basic-skeleton-${index}`} xs={12} md={4}>
        <Skeleton variant='text' width='60%' height={16} />
        <Skeleton variant='text' width='80%' height={24} />
      </Grid>
    ))}
  </Grid>
)

const ChipRowSkeleton = () => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={`chip-skeleton-${index}`} variant='rounded' width={90 + index * 10} height={32} />
    ))}
  </Box>
)

const TableSkeleton = ({ rows = 4, columns = 6 }) => (
  <Skeleton
    variant='rounded'
    height={rows * 55}
    sx={{
      width: '100%',
      borderRadius: '8px',
      mt: 1
    }}
  />
)

const LoadingSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton variant='text' width={220} height={32} />
        <Skeleton variant='text' width={140} height={20} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DetailsHeaderSkeleton />
        <StatBlockSkeleton />
        <ChipRowSkeleton />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DetailsHeaderSkeleton />
        <StatBlockSkeleton />
        <ChipRowSkeleton />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DetailsHeaderSkeleton />
        <TableSkeleton rows={4} columns={8} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DetailsHeaderSkeleton />
        <TableSkeleton rows={4} columns={6} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DetailsHeaderSkeleton />
        <TableSkeleton rows={4} columns={6} />
      </Box>
    </Box>
  )
}

export default LoadingSkeleton
