import { Button, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'

export const ConfirmationBox = ({ setConfirmationBox }) => {
  const router = useRouter()

  return (
    <>
      <Grid container>
        <Grid item>
          <Typography variant='h6' sx={{ position: 'relative', left: '64px' }}>
            Are you sure you want to Cancel ?
          </Typography>
        </Grid>
        <Grid xs={12}>
          <Button
            variant='outlined'
            sx={{ position: 'relative', left: '144px', m: '5px' }}
            onClick={() => router.push('/pharmacy/new-product-request/')}
          >
            Yes
          </Button>
          <Button
            variant='outlined'
            sx={{ position: 'relative', left: '144px' }}
            onClick={() => setConfirmationBox(false)}
          >
            No
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
