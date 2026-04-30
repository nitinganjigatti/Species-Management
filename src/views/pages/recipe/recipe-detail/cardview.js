import {
  Grid,
  CardContent,
  Card,
  Box,
  Typography,
  Avatar,
  Switch,
  FormControlLabel,
  IconButton,
  Divider
} from '@mui/material'
import { React, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { updateRecipeStatus } from 'src/lib/api/diet/recipe'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import ToasterforSuccess from 'src/components/SuccessToaster'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'
import { auto } from '@popperjs/core'

const RecipeDetailCardview = ({ IngredientsDetailsval, permission, getRecipeDetailval, isActive, setIsActive }) => {
  const router = useRouter()
  const { t } = useTranslation()
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [activePayload, setActivePayload] = useState(IngredientsDetailsval?.active || false)

  const handleClosenew = () => {
    setDeleteDialogBox(false)

    //setIsActive(IngredientsDetailsval.active)
  }

  useEffect(() => {
    setIsActive(IngredientsDetailsval?.active)
  }, [IngredientsDetailsval])

  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setActivePayload(newIsActive)
    setDeleteDialogBox(true)
  }

  const confirmDeleteAction = async () => {
    try {
      setDeleteDialogBox(false)

      const response = await updateRecipeStatus(IngredientsDetailsval?.id, {
        status: activePayload,
        meal_type: 'recipe'
      })
      if (response.success === true) {
        //Router.push(`/diet/recipe`)
        getRecipeDetailval(IngredientsDetailsval?.id)

        //return toast(t => <ToasterforSuccess isActive={isActive} type='Recipe' id={IngredientsDetailsval.id} t={t} />)
        return Toaster({ type: 'success', message: response?.message })
      } else {
        return Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {}
  }

  return (
    <Grid size={{ md: 4, xs: 6.5 }} sx={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
      <Card sx={{ boxShadow: 'none', background: '#EFF5F2' }}>
        <div
          style={{ borderRight: 'none', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
        >
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%'
              }}
            >
              <Avatar
                variant='square'
                alt='Ingredient Image'
                sx={{
                  width: '100%',
                  height: IngredientsDetailsval.recipe_image ? '100%' : '250px'
                }}
                src={
                  IngredientsDetailsval.recipe_image
                    ? IngredientsDetailsval.recipe_image
                    : '/icons/icon_recipe_fill.png'
                }
              ></Avatar>
            </div>
          </CardContent>
        </div>
        {/* <Divider sx={{ mt: 3, mx: 4, borderColor: '#C3CEC7' }} /> */}
        <CardContent sx={{ pt: 0 }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                {'REP' + IngredientsDetailsval.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Grid>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive === '1' ? true : false}
                      onChange={permission ? handleSwitchChange : null}
                      fontSize={2}
                    />
                  }
                  labelPlacement='start'
                  label={isActive === '1' ? 'Active' : 'InActive'}
                  disabled={!permission}
                />
              </Grid>
            </Box>
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                {t('diet_module.portion_size')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.portion_size !== '0'
                  ? IngredientsDetailsval.portion_size + ' ' + (IngredientsDetailsval.portion_uom_name || '')
                  : '0 g'}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              my: 3
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                {t('diet_module.items_used')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.total_ingredients + ' nos'}
              </Typography>
            </Box>
          </Box>
          {/* <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              my: 3
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Calories per 100gms
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.kcal ? IngredientsDetailsval.kcal + ' Kcal' : 0 + ' Kcal'}
              </Typography>
            </Box>
          </Box> */}
        </CardContent>
      </Card>
      <DeleteDialogConfirmation
        handleClosenew={handleClosenew}
        action={confirmDeleteAction}
        open={deleteDialogBox}
        active={isActive}
        dietCount={IngredientsDetailsval.diet_count}
        type='recipe'
        ingredientCount={IngredientsDetailsval?.total_ingredients}
        message={
          <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
            {isActive === '1' ? 'Deactivate' : 'Activate'} Recipe?
          </span>
        }
      />
    </Grid>
  )
}

export default RecipeDetailCardview
