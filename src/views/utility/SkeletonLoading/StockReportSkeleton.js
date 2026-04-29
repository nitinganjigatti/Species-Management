import { Skeleton } from '@mui/material'
import { Grid } from '@mui/system'
import CommonTableSkeleton from './CommonTableSkeleton'

function StockReportSkeleton({
  StockReport,
  Escrow,
  LowStock,
  ExpiredProducts,
  AboutToExpire,
  length = 5,
  selectedPharmacy
}) {
  return (
    <Grid sx={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
      <Grid sx={{ marginBottom: '14px' }}>
        <Skeleton width={220} height={50} />
      </Grid>
      <Grid container>
        {/* Search */}
        <Grid
          item
          size={{ xs: 12, sm: LowStock || Escrow ? 4 : 12, md: 3 }}
          sx={{ marginBottom: { xs: '12px ', md: 0 } }}
        >
          <Skeleton variant='rounded' width={'100%'} height={'40px'} />
        </Grid>
        {/* Store */}
        <Grid item size={{ xs: 12, sm: LowStock || Escrow ? 8 : 12, md: 9 }}>
          <Grid
            container
            columnSpacing={2}
            rowSpacing={'12px'}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'space-between', sm: LowStock || Escrow ? 'end' : 'space-between', md: 'end' },
              alignItems: 'center'
            }}
          >
            {((StockReport && selectedPharmacy.type === 'central') ||
              (AboutToExpire && selectedPharmacy.type === 'central') ||
              (ExpiredProducts && selectedPharmacy.type === 'central') ||
              Escrow) && (
              <Grid size={{ xs: ExpiredProducts ? 10 : 12, sm: Escrow ? 8 : ExpiredProducts ? 11 : 12, md: 4 }}>
                <Skeleton variant='rounded' width={'100%'} height={'40px'} />
              </Grid>
            )}
            {StockReport && (
              <Grid size={{ xs: ExpiredProducts ? 10 : 12, sm: Escrow ? 8 : ExpiredProducts ? 11 : 12, md: 4 }}>
                <Skeleton variant='rounded' width={'100%'} height={'40px'} />
              </Grid>
            )}
            {/* DateRangePicker */}
            {AboutToExpire && (
              <Grid size={{ xs: AboutToExpire ? 10 : 12, md: 5 }}>
                <Skeleton variant='rounded' width={'100%'} height={'40px'} />
              </Grid>
            )}
            {/* Toggle button */}
            {(StockReport || LowStock) && (
              <Grid size={{ xs: 4, sm: 3, md: 2 }}>
                <Skeleton variant='rounded' width={'100%'} height={'40px'} />
              </Grid>
            )}
            {/* export button */}{' '}
            {(StockReport || AboutToExpire || ExpiredProducts) && (
              <Grid size={{ xs: 'auto', sm: 'auto' }}>
                <Skeleton variant='rounded' width={'40px'} height={'40px'} />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid>
        <CommonTableSkeleton length={length} />
      </Grid>
    </Grid>
  )
}

export default StockReportSkeleton
