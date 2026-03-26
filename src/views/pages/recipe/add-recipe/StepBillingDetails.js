import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { Card, CardContent, Avatar, Tooltip, CircularProgress } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

const StepBillingDetails = ({ handlePrev, formData, handleSubmit, loader }) => {
  const theme = useTheme()

  const columns = [
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'Item Name',
      renderCell: params => (
        <Tooltip title={params.row.ingredient_name}>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }} className='text_overflow_moduled'>
            {params.row.ingredient_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'ingredient_id',
      headerName: 'Item ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 5 }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.feed_type_label}
        </Typography>
      )
    },
    {
      flex: 0.43,
      minWidth: 10,
      field: 'quantity',
      headerName: 'Quantity',
      renderCell: params => (
        <>
          <Tooltip
            title={`${parseFloat(params.row.quantity).toFixed(2)}${
              params.row.uom_text ? ` ${params.row.uom_text}` : ''
            }`}
          >
            <Typography variant='body2' className='text_overflow_moduled' sx={{ color: 'text.primary', pl: 3 }}>
              {parseFloat(params.row.quantity).toFixed(1)}
              {params.row.uom_text ? ` ${params.row.uom_text}` : ''}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'preparation_type',
      headerName: 'Preparation Type',
      renderCell: params => (
        <Tooltip title={params?.row?.preparation_type}>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }} className='text_overflow_moduled'>
            {params.row.preparation_type}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'cut_size',
      headerName: 'Cut Size',
      renderCell: params => (
        <Tooltip title={params?.row?.cut_size}>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              pl: 2
            }}
            className='text_overflow_moduled'
          >
            {params?.row?.cut_size ? params?.row?.cut_size : '-'}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const columnsforPercentage = [
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
      flex: 0.3,
      minWidth: 10,
      field: 'ingredient_id',
      headerName: 'Ingredient ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 7 }}>
          {params.row.ingredient_id}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'feed_type_label',
      headerName: 'Feed Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.feed_type_label}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'quantity',
      headerName: `Quantity (100%)`,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {parseFloat(params.row.quantity).toFixed(2)}
          {params.row.uom_text ? ` ${params.row.uom_text}` : '%'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'preparation_type',
      headerName: 'Preparation Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.preparation_type}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'cut_size',
      headerName: 'Cut Size',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 5 }}>
          {params?.row?.cut_size ? params?.row?.cut_size : '-'}
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
      <Grid container spacing={5} sx={{ px: 0, pt: 3 }}>
        <Box sx={{ px: 5, float: 'left' }}>
          <Typography variant='h6'>Preview</Typography>
        </Box>

        <Grid container spacing={5}>
          {console.log(formData, 'formData')}
          <Grid item size={{ xs: 12 }}>
            <>
              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ pt: 0 }}>
                  <Grid container spacing={6}>
                    <Grid item size={{ xs: 4 }}>
                      <Card sx={{ boxShadow: 'none', background: theme.palette.customColors.bodyBg }}>
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
                        <CardContent sx={{ pt: 1 }}>
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
                              <Typography
                                variant='body2'
                                sx={{ mr: 1.5, color: theme.palette.customColors.secondaryBg }}
                              >
                                {formData.portion_size !== '0'
                                  ? formData.portion_size + ' ' + (formData.portion_uom_name || '')
                                  : '0' + ' g'}
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
                              <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Items used
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant='body2'
                                sx={{ mr: 1.5, color: theme.palette.customColors.secondaryBg }}
                              >
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
                              justifyContent: 'space-between'
                            }}
                          >
                            {/* <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                                Calories per 100gms
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                                {formData.kcal ? formData.kcal + ' Kcal' : ' 0 Kcal'}
                              </Typography>
                            </Box> */}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item size={{ xs: 8 }}>
                      <Typography sx={{ fontSize: '16px', color: '#000', fontWeight: 500 }}>Description</Typography>
                      <Typography variant='body2' sx={{ fontSize: '14px', pt: 2 }}>
                        {formData.desc ? formData.desc : 'No Description to show'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ mb: 5, pt: 0 }}>
                  <Card sx={{ boxShadow: 'none' }}>
                    {/* <CardHeader title='Ingredient by percentage' />

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
                      columns={columnsforPercentage}
                      hideFooter={true}
                    /> */}

                    <CardHeader title='Item by Quantity' sx={{ pl: 0 }} />
                    <DataGrid
                      sx={{
                        '.MuiDataGrid-cell:focus': {
                          outline: 'none'
                        },
                        '& .MuiDataGrid-row:hover': {
                          cursor: 'pointer'
                        },
                        '& .MuiDataGrid-columnHeader': {
                          whiteSpace: 'nowrap', // Prevents text wrapping in header
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        },
                        '& .MuiDataGrid-cell': {
                          whiteSpace: 'nowrap', // Prevents text wrapping in cell
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
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

          <Grid item size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12, mx: 5 }}>
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
                disabled={loader}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  minWidth: 120
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Submit
                  {loader && <CircularProgress size={16} sx={{ color: '#ccc' }} />}
                </span>
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default StepBillingDetails
