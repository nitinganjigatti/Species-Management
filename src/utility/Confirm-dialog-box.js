import { LoadingButton } from '@mui/lab'
import { Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'

export const ConfirmationBox = ({ setConfirmationBox }) => {
  const router = useRouter()

  return (
    <>
      <Grid container xs={12} sx={{ position: 'relative', bottom: '12px' }}>
        <Typography sx={{ fontSize: '20px', position: 'relative', left: '78px', top: '10px' }}>
          Are you sure you want to Cancel the Changes ?
        </Typography>
        <Grid xs={12} sx={{ position: 'relative', left: '200px', top: '10px' }}>
          <LoadingButton
            sx={{ margin: '2px' }}
            variant='contained'
            onClick={() => router.push('/pharmacy/new-product-request/')}
          >
            Yes
          </LoadingButton>
          <LoadingButton sx={{ margin: '2px' }} variant='contained' onClick={() => setConfirmationBox(false)}>
            No
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  )
}
