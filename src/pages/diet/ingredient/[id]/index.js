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
import IngredientDetailCardview from 'src/views/pages/ingredient/ingredient-detail/cardview'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { getIngredientDetail } from 'src/lib/api/diet/getIngredients'
import OverviewTabView from 'src/views/pages/ingredient/ingredient-detail/overview-tabview'
import Icon from 'src/@core/components/icon'
import ModuleDeleteDialogConfirmation from 'src/components/utility/ModuleDeleteDialogConfirmation'
import { deleteIngredient } from 'src/lib/api/diet/getIngredients'
import toast from 'react-hot-toast'
import RecipeListTabview from 'src/views/pages/ingredient/ingredient-detail/recipeList-tabview'

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
    width: '511px',
    backgroundColor: '#E8F4F2'
  }
}))

const IngredientDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [value, setValue] = useState('1')
  const [loader, setLoader] = useState(true)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [IngredientsDetailsval, setIngredientsDetailsval] = useState({})
  const [recipeListTotal, setRecipeListTotal] = useState(0)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleClosenew = () => {
    setDeleteDialogBox(false)
  }

  const handleClickOpen = () => {
    setDeleteDialogBox(true)
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
    if (value === '1' && id) {
      getIngredientsDetailval(id)
    }
  }, [id, value])

  const confirmDeleteAction = async () => {
    try {
      setDeleteDialogBox(false)
      const response = await deleteIngredient(id)
      console.log(response, 'response')
      if (response.success === true) {
        Router.push(`/diet/ingredient`)
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
                    Ingredient {'ING' + id} has been successfully deleted
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
                      <Icon
                        icon='bx:pencil'
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          Router.push({ pathname: '/diet/ingredient/add-ingredient', query: { id: id } })
                        }}
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
                    <IngredientDetailCardview IngredientsDetailsval={IngredientsDetailsval} />

                    <Grid item xs={8}>
                      <TabContext value={value}>
                        <TabList onChange={handleChange} aria-label='customized tabs example'>
                          <Tab
                            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                            value='1'
                            label='OVERVIEW'
                          />
                          <Tab
                            style={{ borderRadius: 0 }}
                            value='2'
                            label={'USED IN RECIPE' + ' -' + ' ' + recipeListTotal}
                          />
                          <Tab
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            value='3'
                            label='USED IN DIET'
                          />
                        </TabList>
                        <TabPanel value='1'>
                          <OverviewTabView IngredientsDetailsval={IngredientsDetailsval} />
                        </TabPanel>
                        <TabPanel value='2'>
                          <RecipeListTabview
                            IngredientName={IngredientsDetailsval.ingredient_name}
                            onTotalChange={setRecipeListTotal}
                          />
                        </TabPanel>
                        <TabPanel value='3'>
                          <Typography>No Data to show</Typography>
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
          <ModuleDeleteDialogConfirmation
            handleClosenew={handleClosenew}
            action={confirmDeleteAction}
            open={deleteDialogBox}
            type='ingredient'
            message={
              <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>Deletion isn't possible!</span>
            }
          />
        </Grid>
      )}
    </>
  )
}

export default IngredientDetail
