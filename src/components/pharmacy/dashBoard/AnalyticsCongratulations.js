// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { styled, useTheme } from '@mui/material/styles'
import { flex } from '@mui/system'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative'
  }
}))

const Img = styled('img')(({ theme }) => ({
  left: 0,
  bottom: 0,
  width: 180,

  // position: 'absolute',
  [theme.breakpoints.down('sm')]: {
    width: 100,
    position: 'static'
  }
}))

const AnalyticsCongratulations = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.customColors.Outline,

        display: 'flex',
        alignItems: 'center'
      }}
    >
      <CardContent>
        {/* <Grid container direction='row' alignItems='center' justifyContent='flex-start' wrap='nowrap' spacing={3}>
          <Grid
            item
            sx={{
              flexShrink: 0,

              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Img src='/images/Graphic_pharmacy.png' alt='Pharmacy' />
          </Grid>

          <Grid
            item
            sx={{
              color: 'white',
              flexGrow: 1,
              textAlign: 'left'
            }}
          >
            <Typography
              variant='h5'
              sx={{
                mb: 2,
                color: 'white'
              }}
            >
              Simplify operations and enhance productivity
            </Typography>

            <Typography variant='body2' sx={{ color: 'white' }}>
              Experience efficiency at your fingertips with the dashboard. Explore stock, inventory, and orders
              effortlessly. Let's elevate your pharmacy management!
            </Typography>
          </Grid>
        </Grid> */}

        <Box display='flex' flexDirection='row' alignItems='center' justifyContent='flex-start' gap={3}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <Img src='/images/Graphic_pharmacy.png' alt='Pharmacy' />
          </Box>

          <Box
            sx={{
              color: 'white',
              flexGrow: 1,
              textAlign: 'left'
            }}
          >
            <Typography
              variant='h5'
              sx={{
                mb: 2,
                color: 'white'
              }}
            >
              Simplify operations and enhance productivity
            </Typography>

            <Typography variant='body2' sx={{ color: 'white' }}>
              Experience efficiency at your fingertips with the dashboard. Explore stock, inventory, and orders
              effortlessly. Let's elevate your pharmacy management!
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AnalyticsCongratulations
