// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  IconButton
} from '@mui/material'
import RecipeDetailCardview from 'src/views/pages/recipe/recipe-detail/cardview'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { getRecipeDetail } from 'src/lib/api/diet/recipe'
import RecipeOverviewTabView from 'src/views/pages/recipe/recipe-detail/overview-tabview'
import Icon from 'src/@core/components/icon'
import ModuleDeleteDialogConfirmation from 'src/components/utility/ModuleDeleteDialogConfirmation'
import { deleteRecipe } from 'src/lib/api/diet/recipe'
import toast from 'react-hot-toast'
import RecipeListTabview from 'src/views/pages/recipe/recipe-detail/dietList-tabview'
import IngredientsListforRecipeDetail from '../ingredient-list'

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
    width: '342px',
    backgroundColor: '#E8F4F2'
  }
}))

const RecipeDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [value, setValue] = useState('1')
  const [loader, setLoader] = useState(true)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [IngredientsDetailsval, setIngredientsDetailsval] = useState({})

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleClosenew = () => {
    setDeleteDialogBox(false)
  }

  const handleClickOpen = () => {
    setDeleteDialogBox(true)
  }

  const getRecipeDetailval = async id => {
    try {
      const response = await getRecipeDetail(id)
      console.log(response, 'response')
      if (response.data.success === true && response.data.data !== null) {
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
    if (value === '1' && id) {
      getRecipeDetailval(id)
    }
  }, [id, value])

  const confirmDeleteAction = async () => {
    try {
      setDeleteDialogBox(false)
      const response = await deleteRecipe(id)
      console.log(response, 'response')
      if (response.success === true) {
        Router.push(`/diet/recipe`)
        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: '#44544A' }}>
                    Recipe {'REP' + id} has been successfully deleted
                  </Typography>
                </div>
              </Box>
              <IconButton
                onClick={() => toast.dismiss(t.id)}
                style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          ),
          {
            style: {
              minWidth: '450px',
              minHeight: '130px'
            }
          }
        )
      } else {
        alert('something went wrong')
      }
    } catch (error) {}
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
          <Grid item xs={12}>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography color='inherit'>Diet</Typography>
              <Link underline='hover' color='inherit' href='/diet/recipe/'>
                Recipe
              </Link>
              <Typography color='text.primary'>Recipe Details</Typography>
            </Breadcrumbs>
            {Object.keys(IngredientsDetailsval).length !== 0 ? (
              <>
                <Card>
                  <CardContent sx={{ mb: 5, mt: 2 }}>
                    <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600 }} variant='h6'>
                        {IngredientsDetailsval.recipe_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
                        <Icon
                          icon='bx:pencil'
                          style={{ cursor: 'pointer' }}
                          onClick={() => Router.push({ pathname: '/diet/recipe/add-recipe', query: { id: id } })}
                        />
                        <Icon
                          icon='material-symbols:delete-outline'
                          style={{ cursor: 'pointer', marginLeft: '15px' }}
                          onClick={() => {
                            handleClickOpen()
                          }}
                        />
                      </Box>
                    </Box>
                    <Grid container spacing={6} sx={{ mt: 3 }}>
                      <RecipeDetailCardview IngredientsDetailsval={IngredientsDetailsval} />

                      <Grid item xs={8}>
                        <TabContext value={value}>
                          <TabList onChange={handleChange} aria-label='customized tabs example'>
                            <Tab
                              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                              value='1'
                              label='OVERVIEW'
                            />
                            <Tab
                              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                              value='2'
                              label='USED IN DIET'
                            />
                          </TabList>
                          <TabPanel value='1'>
                            <RecipeOverviewTabView IngredientsDetailsval={IngredientsDetailsval} />
                          </TabPanel>
                          <TabPanel value='2'>
                            <RecipeListTabview IngredientName={IngredientsDetailsval.ingredient_name} />
                          </TabPanel>
                        </TabContext>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                {value === '1' ? (
                  <Card sx={{ mt: 5 }}>
                    <CardContent sx={{ mb: 5, mt: 2 }}>
                      <IngredientsListforRecipeDetail IngredientsDetailsval={IngredientsDetailsval} />
                    </CardContent>
                  </Card>
                ) : (
                  ''
                )}
              </>
            ) : (
              <Grid>
                <Typography variant='h6' sx={{ background: '#fff', padding: 8, borderRadius: '6px' }}>
                  Data Not Found
                </Typography>
              </Grid>
            )}
          </Grid>
          <ModuleDeleteDialogConfirmation
            handleClosenew={handleClosenew}
            action={confirmDeleteAction}
            open={deleteDialogBox}
            type='recipe'
            message={
              <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>Deletion isn't possible!</span>
            }
          />
        </Grid>
      )}
    </>
  )
}

export default RecipeDetail
