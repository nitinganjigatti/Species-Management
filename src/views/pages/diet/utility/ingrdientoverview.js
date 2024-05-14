import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography
} from '@mui/material'
import SwapCallsIcon from '@mui/icons-material/SwapCalls'
import styled from '@emotion/styled'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/system'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

const IngredientOverview = () => {
  // Styled Grid component
  const StyledGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    [theme.breakpoints.down('md')]: {
      borderBottom: `1px solid ${theme.palette.divider}`
    },
    [theme.breakpoints.up('md')]: {
      borderRight: `1px solid ${theme.palette.divider}`
    }
  }))

  return (
    <>
      <Grid container>
        <Card>
          <StyledGrid item md={11}>
            <CardContent>
              <Grid item sx={{ display: 'flex' }}>
                <Grid
                  item
                  sx={{
                    borderRadius: '6px',
                    border: '2px solid #e7f3ff',
                    margin: 'auto',
                    height: '64px',
                    mt: '30px',
                    ml: '30px'
                  }}
                >
                  <img src='https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg' width={60} height={60} />
                </Grid>
                <Grid>
                  <Typography sx={{ m: 2, color: '#1F515B' }} variant='h5'>
                    Pineapple
                  </Typography>
                  <Typography sx={{ fontSize: '14px', m: 2, color: 'text.secondary' }}>Id - ING00001</Typography>
                  <Typography sx={{ fontSize: '14px', m: 1, ml: 2, mt: 3, color: 'text.secondary' }}>
                    Preparation Type
                  </Typography>
                </Grid>
                <Grid>
                  <Typography sx={{ fontSize: '14px', m: 2, mt: 12, ml: 0, color: 'text.secondary' }}>
                    Feed Type - Fruits
                  </Typography>
                  <Select input={<OutlinedInput sx={{ borderRadius: '3px', height: '30px', width: '150px', ml: 2 }} />}>
                    <MenuItem disabled value=''>
                      Select
                    </MenuItem>
                    <MenuItem value='option1'>Option 1</MenuItem>
                    <MenuItem value='option2'>Option 2</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
            <Grid sx={{ margin: 'auto', position: 'relative', left: '31px', top: 4 }}>
              <SwapHorizIcon />
            </Grid>
          </StyledGrid>
        </Card>
      </Grid>
    </>
  )
}

export default IngredientOverview
