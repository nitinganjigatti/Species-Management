'use client';
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
  IconButton,
  Avatar
} from '@mui/material'
import IngredientDetailCardview from 'src/views/pages/ingredient/ingredient-detail/cardview'
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import { getIngredientDetail, updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import OverviewTabView from 'src/views/pages/ingredient/ingredient-detail/overview-tabview'
import Icon from 'src/@core/components/icon'
import ModuleDeleteDialogConfirmation from 'src/components/utility/ModuleDeleteDialogConfirmation'
import { deleteIngredient } from 'src/lib/api/diet/getIngredients'
import RecipeListTabview from 'src/views/pages/ingredient/ingredient-detail/recipeList-tabview'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import Toaster from 'src/components/Toaster'
import Tooltip from '@mui/material/Tooltip'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'
import { useTranslation } from 'react-i18next'
import IngredientDetialDietListTabview from 'src/views/pages/ingredient/dietList-tabview'

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
    width: '682px',
    backgroundColor: '#E8F4F2'
  }
}))

const IngredientDetail = () => {
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) } as any;
  const { t } = useTranslation()
  const { id, source } = routerQuery
  const [value, setValue] = useState('1')
  const [loader, setLoader] = useState(true)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [IngredientsDetailsval, setIngredientsDetailsval] = useState<any>({})
  const [dietListTotal, setDietListTotal] = useState(0)
  const [isActive, setIsActive] = useState(IngredientsDetailsval?.active || '0')
  const [recipeListTotal, setRecipeListTotal] = useState(0)
  const [comboListTotal, setComboListTotal] = useState(0)
  const [statusDialog, setstatusDialog] = useState(false)

  const authData = useContext(AuthContext) as any
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }

  const handleStatusClickOpen = async (event: any) => {
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

  const getIngredientsDetailval = async (id: any) => {
    try {
      const response = await getIngredientDetail(id)
      if (response.success === true) {
        setIngredientsDetailsval(response.data)
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

  useEffect(() => {
    if (source !== undefined && source === 'fromdiet') {
      setValue('3')
    } else {
      setValue('1')
    }
  }, [source])

  const confirmStatusUpdateAction = async () => {
    try {
      const activePayload = isActive == 0 ? 1 : 0
      setDeleteDialogBox(false)
      const response = await updateIngredientStatus(IngredientsDetailsval?.id, { status: activePayload })
      console.log(response, 'response')
      if (response.success === true) {
        //router.push(`/diet/ingredient`)
        getIngredientsDetailval(id)
        setstatusDialog(false)

        return Toaster({ type: 'success', message: response?.data })
      } else {
        return Toaster({ type: 'error', message: response?.data })
      }
    } catch (error) {}
  }

  const confirmDeleteAction = async () => {
    try {
      setDeleteDialogBox(false)
      const response = await deleteIngredient(id as string)

      // console.log(response, 'response')
      if (response.success === true) {
        router.push(`/diet/ingredient`)

        //Toaster({ type: 'success', message: `Ingredient ${'ING' + id} has been successfully deleted` })
        Toaster({ type: 'success', message: `Item Deleted Successfully` })
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  return (
    <>
      {dietModule ? (
        <>
          {loader ? (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          ) : (
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                  <Typography color='inherit'>{t('navigation.diet')}</Typography>
                  <Typography
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'none'
                      }
                    }}
                    color='inherit'
                    onClick={() => router.push('/diet/ingredient')}
                  >
                    {t('navigation.item')}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.primary'
                    }}
                  >
                    {t('diet_module.item_details')}
                  </Typography>
                </Breadcrumbs>
                {Object.keys(IngredientsDetailsval).length !== 0 ? (
                  <Card>
                    <CardContent sx={{ mb: 5, mt: 2 }}>
                      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 600 }} variant='h6'>
                          {IngredientsDetailsval.ingredient_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
                          {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
                            <Tooltip title='Edit' placement='top'>
                              <Box sx={{ pr: 3 }}>
                                {/* <Icon
                                  icon='bx:pencil'
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    router.push(`/diet/ingredient/add-ingredient?id=${id}`)
                                  }}
                                /> */}
                                <Avatar
                                  sx={{ width: '100%', height: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                  src={'/icons/pencil_outlined.svg'}
                                  variant='square'
                                  onClick={() => {
                                    router.push(`/diet/ingredient/add-ingredient?id=${id}`)
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          )}
                          {dietModuleAccess === 'DELETE' && (
                            <Tooltip title='Delete' placement='top'>
                              <Box>
                                {/* <Icon
                                  icon='material-symbols:delete-outline'
                                  style={{ cursor: 'pointer', marginLeft: '15px' }}
                                  onClick={() => {
                                    if (
                                      Number(IngredientsDetailsval?.recipe_count) +
                                        Number(IngredientsDetailsval?.diet_count) >
                                      0
                                    ) {
                                      handleStatusClickOpen()
                                    } else {
                                      handleClickOpen()
                                    }
                                  }}
                                /> */}
                                <Avatar
                                  sx={{ width: '100%', height: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                  src={'/icons/delete_outlined.svg'}
                                  variant='square'
                                  onClick={() => {
                                    if (
                                      Number(IngredientsDetailsval?.recipe_count) +
                                        Number(IngredientsDetailsval?.diet_count) >
                                      0
                                    ) {
                                      handleStatusClickOpen(null)
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
                        <IngredientDetailCardview
                          isActive={isActive}
                          setIsActive={setIsActive}
                          IngredientsDetailsval={IngredientsDetailsval}
                          permission={dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE' ? true : false}
                          getIngredientsDetailval={getIngredientsDetailval}
                        />

                        <Grid size={{ xs: 12, md: 8 }}>
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
                                // label={'USED IN RECIPE' + ' -' + ' ' + recipeListTotal}
                                label={`${t('diet_module.used_recipe')} ${
                                  recipeListTotal > 0 ? ` - ${recipeListTotal}` : ''
                                }`}
                              />
                              <Tab
                                style={{ borderRadius: 0 }}
                                value='4'
                                label={`${t('diet_module.used_mix')} ${
                                  comboListTotal > 0 ? ` - ${comboListTotal}` : ''
                                }`}
                              />
                              <Tab
                                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                value='3'
                                //label={'USED IN DIET' + ' -' + ' ' + dietListTotal}
                                label={`${t('diet_module.used_diet')} ${
                                  dietListTotal > 0 ? ` - ${dietListTotal}` : ''
                                }`}
                              />
                            </TabList>
                            <TabPanel value='1'>
                              <OverviewTabView IngredientsDetailsval={IngredientsDetailsval} />
                            </TabPanel>
                            <TabPanel value='2'>
                              <RecipeListTabview
                                IngredientName={IngredientsDetailsval.ingredient_name}
                                onTotalChange={setRecipeListTotal}
                                mealType='recipe'
                              />
                            </TabPanel>
                            <TabPanel value='4'>
                              <RecipeListTabview
                                IngredientName={IngredientsDetailsval.ingredient_name}
                                onTotalChange={setComboListTotal}
                                mealType='combo'
                              />
                            </TabPanel>
                            <TabPanel value='3'>
                              {/* @ts-ignore */}
                              <IngredientDetialDietListTabview onTotalChange={setDietListTotal} />
                            </TabPanel>
                          </TabContext>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ) : (
                  <Grid>
                    <Typography variant='h6' sx={{ background: '#fff', padding: 8, borderRadius: '6px' }}>
                      {t('no_data')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              {/* <ModuleDeleteDialogConfirmation
                active={isActive}
                handleClosenew={handleStatusClose}
                action={confirmStatusUpdateAction}
                open={statusDialog}
                type='ingredient'
                message={
                  <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                    Deletion isn't possible!
                  </span>
                }
              /> */}
              <ConfirmationDialog
                icon={'mdi:delete'}
                iconColor={'#ff3838'}
                title={'Are you sure you want to delete this Ingredient?'}
                dialogBoxStatus={deleteDialogBox}
                onClose={handleClosenew}
                ConfirmationText={'Delete'}
                confirmAction={confirmDeleteAction}
              />
              {/* @ts-ignore */}
              <DeleteDialogConfirmation
                handleClosenew={handleStatusClose}
                action={confirmStatusUpdateAction}
                open={statusDialog}
                type='ingredient'
                active={isActive == '1'}
                actionType={'confirm'}
                typeCount={0}
                ingredientCount={0}
                recipeCount={IngredientsDetailsval.recipe_count}
                dietCount={IngredientsDetailsval.diet_count}
                message={
                  <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                    Deletion isn't possible!
                  </span>
                }
              />
            </Grid>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default IngredientDetail
