import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { Card, CardContent, Avatar } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Typography from '@mui/material/Typography'
import 'react-credit-cards/es/styles-compiled.css'

const StepBillingDetails = ({ handlePrev, formData, handleSubmit }) => {
  const columns = [
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'Ingredient Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.ingredient_name}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'ingredient_id',
      headerName: 'Ingredient ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.ingredient_id}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'feed_type_label',
      headerName: 'Feed Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.feed_type_label}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'quantity',
      headerName: 'Quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseFloat(params.row.quantity).toFixed(2)}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'preparation_type',
      headerName: 'Preparation Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.preparation_type}
        </Typography>
      )
    }
  ]

  const rowsPercentage = formData.by_percentage.map((ingredient, index) => ({
    id: index + 1, // Unique ID for each row
    ...ingredient
  }))

  const rowsQuantity = formData.by_quantity.map((ingredient, index) => ({
    id: index + 1,
    ...ingredient
  }))

  return (
    <>
      <Grid container spacing={5} sx={{ px: 5, pt: 6 }}>
        <Box sx={{ mb: 1, px: 5, mt: 2, float: 'left' }}>
          <Typography variant='h6'>Preview</Typography>
        </Box>

        <Grid container spacing={5}>
          {console.log(formData, 'formData')}
          <Grid item xs={12}>
            <>
              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ mt: 0 }}>
                  <Grid container spacing={6}>
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
                              {Array.isArray(formData.recipe_image) && formData.recipe_image.length > 0 ? (
                                formData.recipe_image.map(file => (
                                  <Avatar
                                    key={file.name}
                                    variant='square'
                                    alt={file.name}
                                    sx={{
                                      width: '100%',
                                      height: '100%'
                                    }}
                                    src={URL.createObjectURL(file)}
                                  />
                                ))
                              ) : (
                                <Avatar
                                  variant='square'
                                  src={
                                    typeof formData.recipe_image === 'string' && formData.recipe_image !== ''
                                      ? formData.recipe_image
                                      : '/icons/recipedummy.svg'
                                  }
                                  sx={{
                                    width: '100%',
                                    height: '100%'
                                  }}
                                />
                              )}
                            </div>
                          </CardContent>
                        </div>
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
                                Portion size
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                                {formData.portion_size
                                  ? formData.portion_size + ' ' + formData.portion_uom_name
                                  : '0' + formData.portion_uom_name}
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
                                {formData.by_percentage.length + formData.by_quantity.length + ' nos'}
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
                                {formData.kcal + ' Kcal'}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={8}>
                      <Typography sx={{ fontSize: '16px', color: '#000', fontWeight: 500 }}>Description</Typography>
                      <Typography variant='body2' sx={{ fontSize: '14px', pt: 2 }}>
                        {formData.desc ? formData.desc : 'No Description to show'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ mb: 5, mt: 2 }}>
                  <Card sx={{ boxShadow: 'none' }}>
                    <CardHeader title='Ingredient by percentage' />

                    <DataGrid
                      sx={{
                        '.MuiDataGrid-cell:focus': {
                          outline: 'none'
                        },
                        '& .MuiDataGrid-row:hover': {
                          cursor: 'pointer'
                        }
                      }}
                      columnVisibilityModel={{
                        sl_no: false
                      }}
                      autoHeight
                      rows={rowsPercentage}
                      columns={columns}
                      hideFooter={true}
                    />
                    <CardHeader title='Ingredient by Quantity' sx={{ mt: 8 }} />
                    <DataGrid
                      sx={{
                        '.MuiDataGrid-cell:focus': {
                          outline: 'none'
                        },
                        '& .MuiDataGrid-row:hover': {
                          cursor: 'pointer'
                        }
                      }}
                      columnVisibilityModel={{
                        sl_no: false
                      }}
                      autoHeight
                      hideFooterSelectedRowCount
                      disableColumnSelector={true}
                      hideFooter={true}
                      rows={rowsQuantity}
                      columns={columns}
                    />
                  </Card>
                </CardContent>
              </Card>
            </>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrev}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                Go back
              </Button>
              <Button
                onClick={handleSubmit}
                variant='contained'
                endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}
              >
                Submit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default StepBillingDetails
