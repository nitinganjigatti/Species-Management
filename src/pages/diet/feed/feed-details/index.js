import { useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'
import FeedOverview from 'src/views/pages/diet/feed/feedoverview'
import { getFeedDetails, getIngredientsOnFeed } from 'src/lib/api/diet/getFeedDetails'
import format from 'date-fns/format'

const FeedDetails = () => {
  const [FeedDetailsValue, setFeedDetails] = useState([])
  const [IngredientsList, setIngredientsList] = useState([])
  const [loader, setLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredIngredients, setFilteredIngredients] = useState([])

  function convertToTitleCase(str) {
    const words = str?.split(/(?=[A-Z])/)
    const titleCaseWords = words?.map(word => {
      const firstLetter = word?.charAt(0).toUpperCase()
      const restOfWord = word?.slice(1)

      return firstLetter + restOfWord
    })
    const titleCaseStr = titleCaseWords?.join(' ')

    return titleCaseStr
  }

  const getFeedDetailsList = async () => {
    try {
      const response = await getFeedDetails()
      console.log(response, 'response')
      if (response.data.success === true) {
        setFeedDetails(response.data.data)
        setLoader(false)
      }
    } catch (error) {
      console.log('Suppliers list', error)
      setLoader(false)
    }
  }

  const getIngredientsonFeedList = async () => {
    try {
      const response = await getIngredientsOnFeed()
      console.log(response, 'response1')
      if (response.data.success === true) {
        setIngredientsList(response.data.data)
        setFilteredIngredients(response.data.data) // Initialize filtered data with all ingredients
        setLoader(false)
      }
    } catch (error) {
      console.log('Suppliers list', error)
      setLoader(false)
    }
  }

  useEffect(() => {
    getFeedDetailsList()
    getIngredientsonFeedList()
  }, [])

  const handleSearch = event => {
    const query = event.target.value
    setSearchQuery(query)
    // Filter the IngredientsList based on the search query
    const filteredData = IngredientsList.filter(ingredient =>
      ingredient.ingredient_name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredIngredients(filteredData)
  }

  // const filteredItems = list.filter(
  //   item => item.fullName && item.fullName.toLowerCase().includes(searchSquadMemeber.toLowerCase())
  // )

  return (
    <>
      {loader ? (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <Grid container spacing={6}>
          <FeedOverview FeedDetailsValue={FeedDetailsValue} />
          <Grid item xs={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600 }} variant='h6'>
                    Description
                  </Typography>
                </Box>
                <div style={{ fontSize: '12px' }}>{convertToTitleCase(FeedDetailsValue.desc)}</div>
              </CardContent>
            </Card>
            <Card sx={{ mt: 6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', my: 7, height: '32px', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600 }} variant='h6'>
                    Ingredients
                  </Typography>
                  <Button sx={{ px: 7, py: 5, ml: 34 }} size='small' variant='contained'>
                    <Icon icon='mdi:add' fontSize={20} />
                    &nbsp; Add ingredient
                  </Button>
                  <TextField
                    variant='outlined'
                    placeholder='Search ingredient'
                    InputProps={{
                      startAdornment: (
                        <Icon style={{ marginRight: 7 }} color='#a7a7a7' icon='mdi:search' fontSize={18} />
                      )
                    }}
                    sx={{ '& input': { py: 2 } }}
                    value={searchQuery ? searchQuery : ''}
                    onChange={handleSearch}
                    defaultValue=''
                  />
                </Box>
                {filteredIngredients.length === 0 ? (
                  <Typography variant='subtitle1'>No data to show</Typography>
                ) : (
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
                        {filteredIngredients.map(row => (
                          <TableRow key={row.ingredient_name}>
                            <TableCell sx={{ pr: 10 }}>
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Avatar variant='square' src={row.ingredient_image ? row.ingredient_image : ''} />
                                {row.ingredient_name ? row.ingredient_name : ''}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
                                <Avatar variant='round' src={row.image ? row.image : ''} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
                                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                    {row.created_by ? row.created_by : ''}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    sx={{ color: 'text.disabled', color: 'rgb(76 78 100 / 56%)' }}
                                  >
                                    Added on {format(new Date(row.created_at ? row.created_at : ''), 'MM/dd/yyyy')}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
                                <Icon color='#a7a7a7' icon='mdi:eye-outline' />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default FeedDetails
