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
import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'

const RecipeDetailCardview = ({ IngredientsDetailsval }) => {
  const router = useRouter()
  const [isActive, setIsActive] = useState(IngredientsDetailsval?.active || false)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)

  const handleClosenew = () => {
    setDeleteDialogBox(false)
    setIsActive(IngredientsDetailsval.active)
  }
  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setIsActive(newIsActive)
    setDeleteDialogBox(true)
    console.log(deleteDialogBox, 'deleteDialogBox')
  }

  const confirmDeleteAction = async () => {
    console.log(isActive, 'ooo')
    try {
      setDeleteDialogBox(false)
      const response = await updateIngredientStatus(IngredientsDetailsval?.id, { active: isActive })
      console.log(response, 'response')
      if (response.success === true) {
        Router.push(`/diet/ingredient`)
        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 30, color: '#37BD69' }} />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: '#44544A' }}>
                    Ingredient {'ING' + IngredientsDetailsval.id} has been successfully{' '}
                    {isActive === 1 ? 'activated' : 'deactivated'}
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
    <Grid item xs={4}>
      <Card sx={{ boxShadow: 'none', background: '#EFF5F2' }}>
        <div
          item
          md={3}
          xs={12}
          style={{ borderRight: 'none', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
        >
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '18px',
                width: '120px',
                height: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Avatar
                variant='square'
                alt='Ingredient Image'
                sx={{
                  width: 70,
                  height: 70,
                  background: '#fff'
                }}
                src={IngredientsDetailsval.ingredient_image ? IngredientsDetailsval.ingredient_image : null}
              >
                {IngredientsDetailsval.ingredient_image ? null : <Icon icon='noto:red-apple' fontSize={'94px'} />}
              </Avatar>
            </div>
          </CardContent>
        </div>
        <Divider sx={{ mt: 3, mx: 4, borderColor: '#C3CEC7' }} />
        <CardContent>
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
                REP000123
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={IngredientsDetailsval.active === '1' ? true : false}
                      onChange={handleSwitchChange}
                      fontSize={2}
                    />
                  }
                  labelPlacement='start'
                  label={IngredientsDetailsval.active === '1' ? 'Active' : 'InActive'}
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
                Portion size
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.feed_type + ' ' + 'g'}
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
                Ingredients used
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                nos
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
                Calories per 100gms
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                Kcal
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <DeleteDialogConfirmation
        handleClosenew={handleClosenew}
        action={confirmDeleteAction}
        open={deleteDialogBox}
        message={<span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>Deactivate Ingredient?</span>}
      />
    </Grid>
  )
}

export default RecipeDetailCardview
