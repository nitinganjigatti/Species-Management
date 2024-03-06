import { LoadingButton } from '@mui/lab'
import { Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'

export const ConfirmationBox = ({ setConfirmationBox }) => {
  const router = useRouter()
  return (
    <>
      <Grid container xs={12} sx={{ position: 'relative', bottom: '12px' }}>
        <Typography sx={{ fontSize: '20px' }}>Are you sure you want to Cancel ?</Typography>
        <Grid sx={12} xs={12}>
          <LoadingButton sx={{ margin: '2px' }} variant='contained' onClick={() => setConfirmationBox(false)}>
            Yes
          </LoadingButton>
          <LoadingButton
            sx={{ margin: '2px' }}
            variant='contained'
            onClick={() => router.push('/pharmacy/new-product-request/')}
          >
            No
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  )
}
