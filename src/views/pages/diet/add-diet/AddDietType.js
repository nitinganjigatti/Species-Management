import {
  Autocomplete,
  Button,
  CardContent,
  Divider,
  Drawer,
  FormControl,
  FormGroup,
  FormHelperText,
  Grid,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import TextField from '@mui/material/TextField'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { getUnitsForIngredient } from 'src/lib/api/diet/getFeedDetails'

const AddDietType = ({ activitySidebarOpen, setActivitySidebarOpen }) => {
  const [uomList, setUomList] = useState([])
  const [uom, setUom] = useState('')
  const [dis, setDis] = useState(true)

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['weight'],
        page_no: 1
      }
      await getUnitsForIngredient({ params: params }).then(res => {
        setUomList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    if (activitySidebarOpen) {
      getUnitsList()
    }
  }, [activitySidebarOpen])

  const defaultProductDetails = {
    diet_types: [
      {
        minWeight: '',
        maxWeight: '',
        unit: uom?._id || uom || ''
      }
    ]
  }

  const ProductValidationSchema = Yup.object().shape({
    diet_types: Yup.array().of(
      Yup.object().shape({
        minWeight: Yup.string().required('Min Wieght is required').min(1, 'Quantity should be greater than 0'),
        maxWeight: Yup.string().required('Max Wieght is required').min(1, 'Quantity should be greater than 0'),

        unit: Yup.string().required('Unit is required')
      })
    )
  })

  const form = useForm({
    defaultValues: defaultProductDetails,
    resolver: yupResolver(ProductValidationSchema),
    shouldUnregister: false,
    reValidateMode: 'onChange',
    mode: 'onChange'
  })
  const { watch, control, handleSubmit, formState, getValues, setValue, reset, setError, clearErrors } = form

  const { errors } = formState

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'diet_types'
  })

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else if (index <= 0 && fields?.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index <= 0 && fields?.length > 0) {
      return <>{clearSaltFields(index)}</>
    } else {
      return <>{removeSaltButton(index)}</>
    }
  }

  const addSaltButton = () => {
    return (
      <Button
        variant='outlined'
        onClick={() => {
          append({
            minWeight: '',
            maxWeight: '',
            unit: {
              value: uom ? uom : ''
            }
          })
          checkDisabled()
        }}
        sx={{ marginRight: '4px', borderRadius: 6 }}
      >
        Add Another
      </Button>
    )
  }

  const removeSaltButton = index => {
    return (
      <Box sx={{ ml: 3 }}>
        <Icon
          onClick={() => {
            remove(index)
            checkDisabled()
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const clearSaltFields = index => {
    checkDisabled
    return (
      <Box sx={{ ml: 2 }}>
        <Icon
          onClick={() => {
            remove(index)
            insert(index, {})
            checkDisabled()
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const checkDisabled = () => {
    setDis(
      getValues('diet_types').some(
        item =>
          item?.minWeight === '' ||
          item?.minWeight === undefined ||
          item?.minWeight === null ||
          item?.maxWeight === '' ||
          item?.maxWeight === undefined ||
          item?.maxWeight === null ||
          item?.unit?.value?._id === '' ||
          item?.unit?.value?._id === undefined ||
          item?.unit?.value?._id === null
      )
      //   getValues('diet_types')
      //     .map(item => ({
      // weight: `${item.weight}` ,
      //       unit: item?.unit?.value?._id
      //     }))
      //     .some(
      //       item =>
      //         item?.maxWeight === '' ||
      //         item?.maxWeight === undefined ||
      //         item?.maxWeight === null ||
      //         item?.minWeight === '' ||
      //         item?.minWeight === undefined ||
      //         item?.minWeight === null ||
      //         item?.unit === '' ||
      //         item?.unit === undefined ||
      //         item?.unit === null
      //     )
    )
  }

  const submitItems = () => {}
  const handleKeyUp = index => {
    const values = getValues('diet_types')
    const item = values[index]
    if (item && item.maxWeight) {
      if (item && item.minWeight >= item.maxWeight) {
        setError(`diet_types[${index}].minWeight`, {
          type: 'manual',
          message: 'Min Weight should be lower than Max Weight'
        })
      } else {
        clearErrors('diet_types', index)
      }
    }
  }
  const handleKeyUp2 = index => {
    const values = getValues('diet_types')
    const item = values[index]
    if (item && item.minWeight >= item.maxWeight) {
      setError(`diet_types[${index}].maxWeight`, {
        type: 'manual',
        message: 'Max Weight should be greater than Min Weight'
      })
    } else {
      clearErrors('diet_types', index)
    }
  }

  return (
    <div>
      <Drawer
        anchor='right'
        open={activitySidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', 520] },
          height: '100vh',
          '& .css-e1dg5m-MuiCardContent-root': {
            pt: 0
          }
        }}
      >
        <form onSubmit={handleSubmit(submitItems)}>
          <Box sx={{ pt: 4, position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', mb: 2 }}>
              <IconButton
                size='small'
                onClick={() => {
                  setActivitySidebarOpen(false)
                  setUomList([])
                  reset()
                }}
                sx={{ color: 'text.primary' }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
            <Box sx={{ mx: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 500, fontSize: '24px', color: 'black' }}>Add Weights</Typography>
              <Box>
                <FormControl fullWidth>
                  <Autocomplete
                    value={uom?._id}
                    forcePopupIcon={false} // disablePortal
                    isOptionEqualToValue={(option, value) => option.value === value}
                    noOptionsText='Type to search'
                    options={uomList?.length > 0 ? uomList : []}
                    getOptionLabel={option => option?.name}
                    onChange={(e, val) => {
                      if (val === null || undefined) {
                        setUom('')
                      } else {
                        setUom(val)
                      }
                    }}
                    renderInput={params => <TextField {...params} label='Select unit*' placeholder='Search & Select' />}
                    sx={{ width: '200px' }}
                  />
                </FormControl>
              </Box>
            </Box>
            <Divider />
          </Box>
          <CardContent sx={{ pb: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box>
              <Box>
                <FormGroup>
                  {fields.map((field, index) => (
                    <Grid container gap={3} key={field?.id} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={2.5}>
                        <FormControl fullWidth>
                          <Controller
                            name={`diet_types[${index}].minWeight`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <>
                                <TextField
                                  value={value}
                                  label='Min Weight*'
                                  onChange={e => {
                                    // setValue(`diet_types[${index}].weight`, e.target.value)
                                    onChange(e?.target?.value || '')
                                    checkDisabled()
                                  }}
                                  error={Boolean(errors?.diet_types?.[index]?.minWeight)}
                                  type='number'
                                  inputProps={{ min: 1 }}
                                  name={`diet_types[${index}].minWeight`}
                                  onKeyUp={() => {
                                    handleKeyUp(index)
                                  }}
                                />
                              </>
                            )}
                          />
                        </FormControl>
                        <Typography sx={{ fontSize: 12, ml: 2 }}>
                          {errors?.diet_types?.[index]?.minWeight?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2.5}>
                        <FormControl fullWidth>
                          <Controller
                            name={`diet_types[${index}].maxWeight`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <>
                                <TextField
                                  value={value}
                                  label='Max Weight*'
                                  inputProps={{ min: 1 }}
                                  onChange={e => {
                                    // setValue(`diet_types[${index}].weight`, e.target.value)
                                    onChange(e?.target?.value || '')
                                    checkDisabled()
                                  }}
                                  type='number'
                                  error={Boolean(errors?.diet_types?.[index]?.maxWeight)}
                                  name={`diet_types[${index}].maxWeight`}
                                  onKeyUp={() => {
                                    handleKeyUp2(index)
                                  }}
                                />
                              </>
                            )}
                          />
                        </FormControl>
                        <Typography sx={{ fontSize: 12, ml: 2 }}>
                          {errors?.diet_types?.[index]?.maxWeight?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth>
                          <Controller
                            name={`diet_types[${index}].unit.value`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <>
                                <Autocomplete
                                  value={value || value?._id}
                                  disablePortal
                                  id={`diet_types[${index}].unit.value`}
                                  options={uomList?.length > 0 ? uomList : []}
                                  getOptionLabel={option => option.name}
                                  onChange={(e, val) => {
                                    if (val === null || undefined || '') {
                                      onChange('')
                                      checkDisabled()
                                    } else if (!val) {
                                      checkDisabled()
                                    } else {
                                      // onChange(val?._id)
                                      onChange(val)
                                      checkDisabled()
                                    }
                                  }}
                                  renderInput={params => (
                                    <TextField {...params} label='Select unit*' placeholder='Search & Select' />
                                  )}
                                  sx={{ width: '200px' }}
                                />
                                {errors?.diet_types?.[index]?.unit && (
                                  <FormHelperText sx={{ color: 'error.main' }} id={`diet_types[${index}].unit`}>
                                    {'Unit is required'}
                                  </FormHelperText>
                                )}
                              </>
                            )}
                          />
                        </FormControl>
                      </Grid>

                      <Grid
                        item
                        alignSelf='center'
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {handleAddRemoveSalts(fields, index)}
                      </Grid>
                    </Grid>
                  ))}
                </FormGroup>
              </Box>
            </Box>
          </CardContent>
          <Box sx={{ position: 'fixed', bottom: 0, width: '100%', px: 4, py: 4, backgroundColor: '#fff', zIndex: 200 }}>
            <Button
              disabled={dis}
              onClick={() => {
                // console.log('fields', getValues('diet_types'))
                console.log(
                  'fields',
                  getValues('diet_types').map(item => ({
                    meal_value_header: `${item.minWeight}-${item.maxWeight} ${item?.unit?.value?.name}`
                  }))
                )
              }}
              sx={{ width: '488px' }}
              variant='contained'
            >
              Submit
            </Button>
          </Box>
        </form>
      </Drawer>
    </div>
  )
}

export default AddDietType
