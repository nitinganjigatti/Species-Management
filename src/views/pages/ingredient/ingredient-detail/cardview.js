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
import ToasterforSuccess from 'src/components/SuccessToaster'
import Toaster from 'src/components/Toaster'

const IngredientDetailCardview = ({
  isActive,
  setIsActive,
  IngredientsDetailsval,
  permission,
  getIngredientsDetailval
}) => {
  const router = useRouter()
  const [activePayload, setActivePayload] = useState(IngredientsDetailsval?.active || false)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)

  const handleClosenew = () => {
    setDeleteDialogBox(false)

    // setIsActive(IngredientsDetailsval.active)
  }

  useEffect(() => {
    setIsActive(IngredientsDetailsval?.active)
  }, [IngredientsDetailsval])

  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setActivePayload(newIsActive)

    // setIsActive(newIsActive)
    setDeleteDialogBox(true)

    // console.log(deleteDialogBox, 'deleteDialogBox')
  }

  const confirmDeleteAction = async () => {
    console.log(isActive, 'ooo')
    try {
      setDeleteDialogBox(false)
      const response = await updateIngredientStatus(IngredientsDetailsval?.id, { status: activePayload })
      console.log(response, 'response')
      if (response.success === true) {
        getIngredientsDetailval(IngredientsDetailsval?.id)

        return Toaster({ type: 'success', message: response?.data })

        // toast(t => (
        //   <ToasterforSuccess isActive={isActive} type='Ingredient' id={IngredientsDetailsval.id} t={t} />
        // ))
      } else {
        return Toaster({ type: 'error', message: response?.data })
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
                src={IngredientsDetailsval.image ? IngredientsDetailsval.image : '/icons/icon_ingredient_fill.png'}
              >
                {IngredientsDetailsval.image ? null : <Icon icon='noto:red-apple' fontSize={'94px'} />}
              </Avatar>
            </div>
          </CardContent>

          <Grid item>
            <Typography sx={{ mb: 1, color: '#000', fontWeight: 500 }}>{'ING' + IngredientsDetailsval.id}</Typography>
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
            />
          </Grid>
        </div>
        <Divider sx={{ mt: 3, mx: 4, borderColor: '#C3CEC7' }} />
        <CardContent>
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
                Feed Type
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.feed_type_label}
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
                Unit of Measurement
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.uom === 'gm'
                  ? 'Gram (g)'
                  : IngredientsDetailsval.uom === null
                  ? '-'
                  : IngredientsDetailsval.uom}
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
                Standard Unit:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                {IngredientsDetailsval.standard_unit}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <DeleteDialogConfirmation
        handleClosenew={handleClosenew}
        action={confirmDeleteAction}
        open={deleteDialogBox}
        type='ingredient'
        active={isActive}
        recipeCount={IngredientsDetailsval.recipe_count}
        dietCount={IngredientsDetailsval.diet_count}
        message={
          <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
            {isActive === '1' ? 'Deactivate' : 'Activate'} Ingredient?
          </span>
        }
      />
    </Grid>
  )
}

export default IngredientDetailCardview
