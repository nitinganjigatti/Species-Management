import { LoadingButton } from '@mui/lab'
import { Button, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'

export const ConfirmationBox = ({ setConfirmationBox }) => {
  const router = useRouter()

  return (
    <>
      <Grid container>
        <Grid item>
          <Typography variant='h6' sx={{ position: 'relative', left: '64px' }}>
            {' '}
            Are you sure you want to Cancel ?
          </Typography>
        </Grid>
        <Grid xs={12}>
          <Button sx={{ position: 'relative', left: '144px' }}>Yes</Button>
          <Button sx={{ position: 'relative', left: '144px' }}>No</Button>
        </Grid>
      </Grid>
      {/* <Grid container xs={12} sx={{ position: 'relative', bottom: '12px' }}>
        <Typography variant='subtitle2' sx={{ margin: '4px', position: 'relative', left: '150px' }}>
          Are you sure you want to Cancel ?
        </Typography>
        <Grid xs={12} sx={{ position: 'relative', left: '200px', top: '10px' }}>
          <LoadingButton
            sx={{ margin: '2px' }}
            variant='contained'
            onClick={() => router.push('/pharmacy/new-product-request/')}
          >
            Yes
          </LoadingButton>
          <LoadingButton variant='contained' sx={{ margin: '2px' }} onClick={() => setConfirmationBox(false)}>
            No
          </LoadingButton>
        </Grid>
      </Grid> */}
    </>
  )
}
