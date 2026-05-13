import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { Card, CardContent, Avatar, CircularProgress, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { end } from '@popperjs/core'
import { useTheme } from '@mui/material/styles'

const StepBillingDetails = ({ handlePrev, formData, handleSubmit, loader }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  // const columns = [
  //   {
  //     flex: 0.5,
  //     minWidth: 30,
  //     field: 'ingredient_name',
  //     headerName: 'Ingredient Name',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.ingredient_name}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.3,
  //     minWidth: 10,
  //     field: 'ingredient_id',
  //     headerName: 'Ingredient ID',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary', pl: 7 }}>
  //         {params.row.ingredient_id}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.9,
  //     minWidth: 20,
  //     field: 'feed_type_label',
  //     headerName: 'Feed Type',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
  //         {params.row.feed_type_label}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 10,
  //     field: 'quantity',
  //     headerName: 'Quantity',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
  //         {parseFloat(params.row.quantity).toFixed(2)}
  //         {params.row.uom_text ? ` ${params.row.uom_text}` : ''}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 20,
  //     field: 'preparation_type',
  //     headerName: 'Preparation Type',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
  //         {params.row.preparation_type}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.4,
  //     minWidth: 20,
  //     field: 'cut_size',
  //     headerName: 'Cut Size',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary', pl: 5 }}>
  //         {params?.row?.cut_size ? params?.row?.cut_size : '-'}
  //       </Typography>
  //     )
  //   }
  // ]

  const columnsforPercentage = [
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: t('diet_module.item_name'),
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
      headerName: t('diet_module.item_id'),
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
      headerName: t('diet_module.feed_type'),
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
          {parseFloat(params.row.quantity).toFixed(1)}
          {params.row.uom_text ? ` ${params.row.uom_text}` : '%'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'preparation_type',
      headerName: t('diet_module.preparation_type'),
      renderCell: params => (
        <Tooltip title={params?.row?.preparation_type} arrow placement='bottom-start'>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }} className='text_overflow_moduled'>
            {params.row.preparation_type}
          </Typography>
        </Tooltip>
      )
    }

    // {
    //   flex: 0.4,
    //   minWidth: 20,
    //   field: 'cut_size',
    //   headerName: 'Cut Size',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
    //       {params?.row?.cut_size ? params?.row?.cut_size : '-'}
    //     </Typography>
    //   )
    // }
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
        <Box sx={{ float: 'left' }}>
          <Typography variant='h6'>{t('preview')}</Typography>
        </Box>

        <Grid container spacing={5}>
          <Grid size={{ xs: 12 }}>
            <>
              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ px: 0, py: 0 }}>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 4 }}>
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
                        <CardContent sx={{ pt: 0 }}>
                          {/* <Box
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
                                {formData.portion_size !== '0'
                                  ? formData.portion_size + ' ' + (formData.portion_uom_name || '')
                                  : '0' + ' g'}
                              </Typography>
                            </Box>
                          </Box> */}
                          <Box
                            sx={{
                              width: '100%',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              my: 1
                            }}
                          >
                            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                              <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                                {t('diet_module.items_used')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                                {formData.by_percentage.length + ' nos'}
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
                                {formData.kcal ? formData.kcal + ' Kcal' : ' 0 Kcal'}
                              </Typography>
                            </Box>
                          </Box> */}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 8 }}>
                      <Typography sx={{ fontSize: '16px', color: '#000', fontWeight: 500 }}>
                        {t('description')}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: '14px', pt: 2 }}>
                        {formData.desc ? formData.desc : 'No Description to show'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 'none' }}>
                <CardContent sx={{ px: 0, py: 0 }}>
                  <Card sx={{ boxShadow: 'none' }}>
                    <CardHeader title={t('diet_module.item_by_perc')} sx={{ px: 0, py: 4 }} />

                    <DataGrid
                      sx={{
                        '.MuiDataGrid-main': {
                          borderRadius: '8px',
                          border: '1px solid #e9e9ec'
                        },
                        '.MuiDataGrid-cell:focus': {
                          outline: 'none'
                        },
                        '& .MuiDataGrid-row:hover': {
                          cursor: 'pointer'
                        },
                        '& .MuiDataGrid-columnHeader': {
                          whiteSpace: 'nowrap', // Prevents text wrapping in header
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          backgroundColor: theme.palette.customColors.customTableHeaderBg
                        },
                        '& .MuiDataGrid-cell': {
                          whiteSpace: 'nowrap', // Prevents text wrapping in cell
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '12px'
                        }
                      }}
                      columnVisibilityModel={{
                        sl_no: false
                      }}
                      autoHeight
                      rows={rowsPercentage}
                      columns={columnsforPercentage}
                      hideFooter={true}
                    />

                    {/* <CardHeader title='Ingredient by Quantity' sx={{ mt: 8 }} />
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
                    /> */}
                  </Card>
                </CardContent>
              </Card>
            </>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrev}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                {t('go_back')}
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
                  {t('submit')}
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
