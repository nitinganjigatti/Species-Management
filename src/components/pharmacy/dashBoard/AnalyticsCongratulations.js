// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative'
  }
}))

// Styled component for the image
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
  // ** Hook
  const theme = useTheme()

  return (
    <Card
      sx={{
        background: '#839D8D'
      }}
    >
      <CardContent>
        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
          <StyledGrid item xs={12} sm={3}>
            <Img width={180} src={`/images/Graphic_pharmacy.png`} alt='image' />
          </StyledGrid>
          {/* <Grid item xs={12} sm={3}>
            <img width={180} src={`/images/Graphic_pharmacy.png`} alt='image' />
          </Grid> */}

          <Grid item xs={12} sm={9}>
            <Typography variant='h5' sx={{ mb: 4.5, color: 'white' }}>
              Simplify operations and enhance productivity
            </Typography>

            <Typography sx={{ mb: 4.5, color: 'white' }} variant='body2'>
              Experience efficiency at your fingertips with dashboard. Explore stock, inventory, and orders
              effortlessly. Let's elevate your pharmacy management!
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default AnalyticsCongratulations
