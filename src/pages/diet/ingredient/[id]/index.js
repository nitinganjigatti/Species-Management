// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import { Grid, Card, CardContent, Box, Typography, CircularProgress, Breadcrumbs, Link } from '@mui/material'
import IngredientDetailCardview from 'src/views/pages/ingredient/ingredient-detail/cardview'
import { useRouter } from 'next/router'
import { getIngredientDetail } from 'src/lib/api/diet/getIngredients'
import OverviewTabView from 'src/views/pages/ingredient/ingredient-detail/overview-tabview'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'

// Styled TabList component
const TabList = styled(MuiTabList)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'none'
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: '#fff!important',
    fontWeight: 500
  },
  '& .MuiTab-root': {
    minHeight: 38,
    minWidth: 170,
    borderRadius: 8,
    padding: 14,
    color: '#7A8684',
    fontWeight: 500
  },
  '& .MuiTabs-flexContainer': {
    borderRadius: 8,
    width: '71%',
    backgroundColor: '#E8F4F2'
  }
}))

const IngredientDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [value, setValue] = useState('1')
  const [loader, setLoader] = useState(true)
  const [IngredientsDetailsval, setIngredientsDetailsval] = useState({})

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const getIngredientsDetailval = async id => {
    try {
      const response = await getIngredientDetail(id)
      if (response.data.success === true) {
        setIngredientsDetailsval(response.data.data)
        setLoader(false)
      } else {
        setLoader(false)
        setIngredientsDetailsval({})
      }
    } catch (error) {
      console.log('Feed list', error)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id) {
      getIngredientsDetailval(id)
    }
  }, [id])

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
          <Grid item xs={12}>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography color='inherit'>Diet</Typography>
              <Link underline='hover' color='inherit' href='/diet/ingredient/'>
                Ingredients
              </Link>
              <Typography color='text.primary'>Ingredient Details</Typography>
            </Breadcrumbs>
            {Object.keys(IngredientsDetailsval).length !== 0 ? (
              <Card>
                <CardContent sx={{ mb: 5, mt: 2 }}>
                  <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 600 }} variant='h6'>
                      {IngredientsDetailsval.ingredient_name}
                    </Typography>
                  </Box>
                  <Grid container spacing={6} sx={{ mt: 3 }}>
                    <IngredientDetailCardview IngredientsDetailsval={IngredientsDetailsval} />

                    <Grid item xs={8}>
                      <TabContext value={value}>
                        <TabList onChange={handleChange} aria-label='customized tabs example'>
                          <Tab value='1' label='OVERVIEW' />
                          <Tab value='2' label='USED IN RECIPE' />
                          <Tab value='3' label='USED IN DIET' />
                        </TabList>
                        <TabPanel value='1'>
                          <OverviewTabView IngredientsDetailsval={IngredientsDetailsval} />
                        </TabPanel>
                        <TabPanel value='2'>
                          <Typography>
                            Chocolate bar carrot cake candy canes sesame snaps. Cupcake pie gummi bears jujubes candy
                            canes. Chupa chups sesame snaps halvah.
                          </Typography>
                        </TabPanel>
                        <TabPanel value='3'>
                          <Typography>
                            Danish tiramisu jujubes cupcake chocolate bar cake cheesecake chupa chups. Macaroon ice
                            cream tootsie roll carrot cake gummi bears.
                          </Typography>
                        </TabPanel>
                      </TabContext>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              <Grid>
                <Typography variant='h6' sx={{ background: '#fff', padding: 8, borderRadius: '6px' }}>
                  Data Not Found
                </Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default IngredientDetail
