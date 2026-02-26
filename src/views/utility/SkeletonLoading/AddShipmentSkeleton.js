import { Card, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Box, Grid } from '@mui/system'
import CommonTableSkeleton from './CommonTableSkeleton'

function AddShipmentSkeleton() {
  return (
    <Grid sx={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
      <Grid sx={{ marginBottom: '10px' }}>
        <Skeleton width={220} height={50} />
      </Grid>
      <Grid item container size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', gap: { xs: '12px', md: '0px' } }}>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          {/* Shipped */}
          <Skeleton width={120} height={24} />
          <Skeleton width={100} height={24} />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          {/* delivery type */}
          <Skeleton width={120} height={24} />
          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Skeleton width={100} height={24} />
            <Skeleton width={100} height={24} />
          </Box>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12 }} sx={{ marginTop: '42px', marginBottom: '20px' }}>
        {/* Divider line */}
        <Skeleton width={'100%'} height={'3px'} />
      </Grid>
      <Grid>
        {/* Shipment Details */}
        <Skeleton width={170} height={24} />
      </Grid>
      <Grid>
        {/* 4 box */}
        <Grid container rowSpacing={1} columnSpacing={4}>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <Skeleton height={80} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <Skeleton height={80} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <Skeleton height={80} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <Skeleton height={80} />
          </Grid>
        </Grid>
      </Grid>
      <Grid>
        <Grid container rowSpacing={1} columnSpacing={4}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Skeleton height={80} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Skeleton height={80} />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12 }} sx={{ marginTop: '12px', marginBottom: '24px' }}>
        {/* DividerLine */}
        <Skeleton width={'100%'} height={'3px'} />
      </Grid>
      <Grid>
        {/* Table */}
        <CommonTableSkeleton />
      </Grid>
    </Grid>
  )
}

export default AddShipmentSkeleton
