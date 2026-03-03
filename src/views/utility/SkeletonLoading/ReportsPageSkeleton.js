import { Skeleton } from '@mui/material'
import { Grid } from '@mui/system'
import CommonTableSkeleton from './CommonTableSkeleton'

function ReportsPageSkeleton({ Length = 5, ReturnReportPage, ReconciliationReport }) {
  return (
    <Grid sx={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
      <Grid
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: '12px',
          mb: '24px',
          mt: '12px'
        }}
      >
        <Skeleton variant='rounded' width={250} height={30} />
        {ReturnReportPage && <Skeleton variant='rounded' width={120} height={30} />}
      </Grid>
      <Grid container columnSpacing={4} rowSpacing={'12px'}>
        <Grid size={{ xs: 12, sm: ReconciliationReport ? 3 : 5 }} item>
          <Skeleton variant='rounded' width={'100%'} height={40} />
        </Grid>
        <Grid size={{ xs: 12, sm: ReconciliationReport ? 9 : 7 }}>
          <Grid container sx={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Grid
              size={{
                xs: ReconciliationReport ? 12 : 'grow',
                sm: ReconciliationReport ? 4 : 'grow',
                md: ReconciliationReport ? 4 : 8
              }}
              item
            >
              <Skeleton variant='rounded' height={40} width={'100%'} />
            </Grid>

            {ReconciliationReport && (
              <Grid item size={{ xs: 12, sm: 3, md: 2.5 }}>
                <Skeleton variant='rounded' height={40} width={'100%'} />
              </Grid>
            )}

            <Grid
              item
              size={{
                xs: ReconciliationReport ? 'grow' : 'auto',
                sm: ReconciliationReport ? 3 : 'auto',
                md: ReconciliationReport ? 2 : 'auto'
              }}
              sx={{ display: 'flex', justifyContent: 'start' }}
            >
              <Skeleton
                variant='rounded'
                height={40}
                sx={{
                  width: {
                    xs: ReconciliationReport ? 160 : 40,
                    sm: ReconciliationReport ? '100%' : 40
                  }
                }}
              />
            </Grid>

            <Grid item>
              <Skeleton variant='rounded' height={40} width={40} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CommonTableSkeleton Length={Length} />
    </Grid>
  )
}

export default ReportsPageSkeleton
