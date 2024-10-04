// ** React Imports
import { useEffect, useState, useContext } from 'react'

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
import { getRecipeDetail, updateRecipeStatus } from 'src/lib/api/diet/recipe'
import RecipeOverviewTabView from 'src/views/pages/recipe/recipe-detail/overview-tabview'
import Icon from 'src/@core/components/icon'
import ModuleDeleteDialogConfirmation from 'src/components/utility/ModuleDeleteDialogConfirmation'
import { deleteRecipe } from 'src/lib/api/diet/recipe'
import toast from 'react-hot-toast'
import RecipeListTabview from 'src/views/pages/recipe/recipe-detail/dietList-tabview'
import IngredientsListforRecipeDetail from '../ingredient-list'
import Toaster from 'src/components/Toaster'
import Tooltip from '@mui/material/Tooltip'
import { AuthContext } from 'src/context/AuthContext'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ChangeRecipeName from 'src/components/diet/ChangeRecipename'

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
  const [isOpen, setIsOpen] = useState(false)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [IngredientsDetailsval, setIngredientsDetailsval] = useState({})
  const [statusDialog, setstatusDialog] = useState(false)
  const [isActive, setIsActive] = useState(IngredientsDetailsval?.active || '0')
  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleStatusClickOpen = async event => {
    setstatusDialog(true)
  }

  const handleClosenew = () => {
    setDeleteDialogBox(false)
  }

  const handleStatusClose = () => {
    setstatusDialog(false)
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

  const confirmStatusUpdateAction = async () => {
    try {
      const activePayload = isActive == 0 ? 1 : 0
      setDeleteDialogBox(false)
      const response = await updateRecipeStatus(IngredientsDetailsval?.id, { status: activePayload })
      console.log(response, 'response')
      if (response.success === true) {
        //Router.push(`/diet/ingredient`)
        getRecipeDetailval(id)
        setstatusDialog(false)
        return Toaster({ type: 'success', message: response?.message })
      } else {
        return Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      alert('ppp')
    }
  }

  const confirmDeleteAction = async () => {
    try {
      setDeleteDialogBox(false)
      const response = await deleteRecipe(id)

      // console.log(response, 'response')
      if (response.success === true) {
        Router.push(`/diet/recipe`)
        Toaster({ type: 'success', message: `Recipe ${'REP' + id} has been successfully deleted` })
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  const handleRecipeClick = () => {
    setIsOpen(true)
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
                        <Tooltip title='Copy' placement='top'>
                          <Box sx={{ pr: 3 }}>
                            <Icon
                              icon='fluent:copy-32-regular'
                              style={{
                                fontSize: 24,
                                transform: 'rotate(180deg)',
                                cursor: 'pointer',
                                marginLeft: '10px'
                              }}
                              onClick={handleRecipeClick}
                            />
                          </Box>
                        </Tooltip>
                        {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
                          <Tooltip title='Edit' placement='top'>
                            <Box sx={{ pr: 3 }}>
                              <Icon
                                icon='bx:pencil'
                                style={{ cursor: 'pointer', marginLeft: '10px' }}
                                onClick={() =>
                                  Router.push({
                                    pathname: '/diet/recipe/add-recipe',
                                    query: { id: id, action: 'edit' }
                                  })
                                }
                              />
                            </Box>
                          </Tooltip>
                        )}

                        {dietModuleAccess === 'DELETE' && (
                          <Tooltip title='Delete' placement='top'>
                            <Box>
                              <Icon
                                icon='material-symbols:delete-outline'
                                style={{ cursor: 'pointer', marginLeft: '10px' }}
                                onClick={() => {
                                  if (
                                    Number(IngredientsDetailsval?.total_ingredients) +
                                      Number(IngredientsDetailsval?.diet_count) >
                                    0
                                  ) {
                                    handleStatusClickOpen()
                                  } else {
                                    handleClickOpen()
                                  }
                                }}
                              />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Grid container spacing={6} sx={{ mt: 3 }}>
                      <RecipeDetailCardview
                        isActive={isActive}
                        setIsActive={setIsActive}
                        IngredientsDetailsval={IngredientsDetailsval}
                        permission={dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE' ? true : false}
                        getRecipeDetailval={getRecipeDetailval}
                      />

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
          {/* <ModuleDeleteDialogConfirmation
            handleClosenew={handleClosenew}
            action={confirmDeleteAction}
            open={deleteDialogBox}
            type='recipe'
            dietCount={IngredientsDetailsval.diet_count}
            ingredientCount={IngredientsDetailsval.total_ingredients}
            message={
              <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>Deletion isn't possible!</span>
            }
          /> */}
          <ChangeRecipeName
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            recipename={IngredientsDetailsval.recipe_name}
            recipeid={id}
          />
          <ConfirmationDialog
            icon={'mdi:delete'}
            iconColor={'#ff3838'}
            title={'Are you sure you want to delete this Recipe?'}
            dialogBoxStatus={deleteDialogBox}
            onClose={handleClosenew}
            ConfirmationText={'Delete'}
            confirmAction={confirmDeleteAction}
          />
          <DeleteDialogConfirmation
            handleClosenew={handleStatusClose}
            action={confirmStatusUpdateAction}
            open={statusDialog}
            active={isActive == '1'}
            actionType={'confirm'}
            type='recipe'
            dietCount={IngredientsDetailsval.diet_count}
            ingredientCount={IngredientsDetailsval.total_ingredients}
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
