// ** React Imports
import {
  Avatar,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import FeedOverview from 'src/views/pages/diet/feed/feedoverview'

const FeedDetails = () => {
  function createData(ingredients, added, addedon) {
    return { ingredients, added, addedon }
  }
  const rows = [
    createData('Frozen ', 'Jennifer summers', 'Added on 03/10/2024'),
    createData('Ice cream ', 'Jennifer summers', 'Added on 03/10/2024'),
    createData('Eclair', 'Jennifer summers', 'Added on 03/10/2024'),
    createData('Cupcake', 'Jennifer summers', 'Added on 03/10/2024'),
    createData('Gingerbread', 'Jennifer summers', 'Added on 03/10/2024')
  ]

  return (
    <Grid container spacing={6}>
      <FeedOverview />

      <Grid item xs={8}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 600 }} variant='h6'>
                Description
              </Typography>
            </Box>
            <div style={{ fontSize: '12px' }}>
              Carefully formulated and nutritionally balanced diet designed for a wide range of domestic animals,
              including livestock, poultry, and pets. It typically consists of a combination of grains, protein sources,
              vitamins, and minerals tailored to meet the specific dietary needs of the target species. These
              ingredients come in various formulations, such as starter, grower, and finisher, to support different life
              stages and production purposes. They provide essential nutrients for growth, reproduction, and overall
              health, ensuring that animals receive the right balance of proteins, carbohydrates, and other vital
              components.
            </div>
          </CardContent>
        </Card>
        <Card sx={{ mt: 6 }}>
          <CardContent>
            <Box sx={{ display: 'flex', my: 7, height: '32px', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 600 }} variant='h6'>
                Ingredients
              </Typography>
              <Button
                sx={{ px: 7, py: 5, ml: 34 }}
                size='small'
                variant='contained'

                // onClick={() => Router.push('/diet/add-feed')}
              >
                <Icon icon='mdi:add' fontSize={20} />
                &nbsp; Add ingredient
              </Button>
              <TextField
                variant='outlined'
                placeholder='Search ingredient'
                InputProps={{
                  startAdornment: <Icon style={{ marginRight: 7 }} color='#a7a7a7' icon='mdi:search' fontSize={18} />
                }}
                sx={{ '& input': { py: 2 } }}
              />
            </Box>
            {/* <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <FormControlLabel control={<Switch defaultChecked />} label='Show Active Only' />
            </Box> */}

            <TableContainer sx={{ border: '1px solid #e8ebf1' }}>
              <Table aria-label='simple table'>
                <TableHead>
                  <TableRow sx={{ height: '56px', backgroundColor: '#E8F4F2' }}>
                    <TableCell>Ingredients</TableCell>
                    <TableCell>Added by</TableCell>
                    <TableCell align='right'></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.ingredients}>
                      {console.log(row, 'ppp')}
                      <TableCell sx={{ pr: 10 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Avatar variant='square' />
                          {row.ingredients}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
                          {/* <Img src={row.img} alt={row.added} /> */}
                          <Avatar variant='round' />
                          <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{row.added}</Typography>
                            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                              {row.addedon}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                          {/* <Img src={row.img} alt={row.added} /> */}
                          <Avatar variant='round' />
                          <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{row.added}</Typography>
                            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                              {row.addedon}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
                          <Icon color='#a7a7a7' icon='mdi:eye-outline' />
                          {/* <Icon color='#a7a7a7' icon='mdi:dots-vertical' /> */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default FeedDetails
