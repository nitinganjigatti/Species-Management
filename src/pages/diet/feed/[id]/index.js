import { useEffect, useState, useCallback } from 'react'
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
  CircularProgress,
  TablePagination,
  TableFooter
} from '@mui/material'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import FeedOverview from 'src/views/pages/diet/feed/feedoverview'
import { getFeedDetails, getIngredientsOnFeed } from 'src/lib/api/diet/getFeedDetails'
import format from 'date-fns/format'
import { useRouter } from 'next/router'

const FeedDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const [FeedDetailsValue, setFeedDetails] = useState([])
  const [IngredientsList, setIngredientsList] = useState([])
  const [loader, setLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page_no, setPage_no] = useState(0)

  const emptyRows = page_no > 0 ? Math.max(0, (1 + page_no) * rowsPerPage - feedRows.length) : 0

  const handleChangePage = (event, newPage) => {
    setPage_no(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage_no(0)
  }

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

  const getFeedDetailsList = async id => {
    try {
      const response = await getFeedDetails(id)
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

  const getIngredientsonFeedList = async (id, query) => {
    try {
      const response = await getIngredientsOnFeed(id, { q: query })
      console.log(response, 'response1')
      if (response.data.success === true) {
        setIngredientsList(response.data.data)
        setLoader(false)
      }
    } catch (error) {
      console.log('Suppliers list', error)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id) {
      getFeedDetailsList(id)
      getIngredientsonFeedList(id, searchQuery)
    }
  }, [id, searchQuery])

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchQuery(q) // Update searchQuery state
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchQuery(value)
    searchTableData(value)
  }

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
          {console.log(id, 'id')}
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
                    value={searchQuery}
                    onChange={event => handleSearch(event.target.value)}
                    type='search'
                  />
                </Box>
                {IngredientsList.length === 0 ? (
                  <Typography variant='subtitle1' sx={{ my: '10%', textAlign: 'center' }}>
                    No data to show
                  </Typography>
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
                        {IngredientsList.map(row => (
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
                        {emptyRows > 0 && (
                          <TableRow style={{ height: 53 * emptyRows }}>
                            <TableCell colSpan={6} />
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TablePagination
                            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={3}
                            count={IngredientsList.length}
                            rowsPerPage={rowsPerPage}
                            page={page_no}
                            slotProps={{
                              select: {
                                inputProps: {
                                  'aria-label': 'rows per page'
                                },
                                native: true
                              }
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                          />
                        </TableRow>
                      </TableFooter>
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
