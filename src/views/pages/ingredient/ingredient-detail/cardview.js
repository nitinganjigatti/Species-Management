import { Grid, CardContent, Card, Box, Typography, Avatar, Switch, FormControlLabel } from '@mui/material'
import React from 'react'
import Divider from '@mui/material/Divider'
import Icon from 'src/@core/components/icon'

const IngredientDetailCardview = ({ IngredientsDetailsval }) => {
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

          <Grid item>
            <Typography sx={{ mb: 1, color: '#000', fontWeight: 500 }}>{'ING' + IngredientsDetailsval.id}</Typography>
            <FormControlLabel
              control={<Switch defaultChecked onChange={event => handleSwitchChange(event, params.row)} fontSize={2} />}
              labelPlacement='start'
              label='Active'
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
                {IngredientsDetailsval.feed_type}
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
                {IngredientsDetailsval.uom === 'gm' ? 'Gram (g)' : IngredientsDetailsval.uom}
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
    </Grid>
  )
}

export default IngredientDetailCardview
