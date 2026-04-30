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
import { useTheme } from '@mui/material/styles'

const AddDietType = ({ activitySidebarOpen, setActivitySidebarOpen, onReceiveDietTypes, dietTypes }) => {
  const [uomList, setUomList] = useState([])
  const [uom, setUom] = useState('')
  const [dis, setDis] = useState(true)
  const theme = useTheme()

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['length', 'weight'],
        page_no: 1,
        limit: 50
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

  const sendDietTypesToParent = dietTypesData => {
    onReceiveDietTypes(dietTypesData)
  }

  const defaultProductDetails = {
    diet_types: [
      {
        weight: '',

        // maxWeight: '',
        unit: uom?._id || uom || ''
      }
    ]
  }

  const ProductValidationSchema = Yup.object().shape({
    diet_types: Yup.array().of(
      Yup.object().shape({
        weight: Yup.string().required('Wieght is required').min(1, 'Quantity should be greater than 0')

        // maxWeight: Yup.string().required('Max Wieght is required').min(1, 'Quantity should be greater than 0')

        // unit: Yup.string().required('Unit is required')
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
            weight: '',

            // maxWeight: '',
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
    const dietTypes = getValues('diet_types')

    const isDisabled = dietTypes.some(item => {
      return !item?.weight || item?.weight === '' || !item?.unit?.value || item?.unit?.value === ''
    })
    setDis(isDisabled)
  }

  const submitItems = () => {
    const dietTypesData = getValues('diet_types')
    console.log(dietTypesData, 'dietTypesData')
    sendDietTypesToParent(dietTypesData)
  }

  const handleKeyUp = index => {
    const values = getValues('diet_types')
    const item = values[index]

    const duplicate = values
      ?.map(value => Number(value?.weight))
      ?.some((value, idx) => idx !== index && value === Number(item?.weight))

    // const duplicateMax = values
    //   ?.map(value => Number(value?.maxWeight))
    //   ?.some((value, idx) => idx !== index && value === Number(item?.maxWeight))
    if (duplicate) {
      setError(`diet_types[${index}].weight`, {
        type: 'manual',
        message: 'same weight not be allowed'
      })
    } else {
      clearErrors(`diet_types[${index}]`, 'weight')
    }
  }

  useEffect(() => {
    if (dietTypes?.length > 0 && activitySidebarOpen) {
      setValue('diet_types', dietTypes)
      checkDisabled()
    }
  }, [dietTypes, activitySidebarOpen])

  useEffect(() => {
    if (uom && fields.length === 1) {
      setValue(`diet_types[0].unit.value`, uom)
      checkDisabled()
    }
  }, [uom, fields.length])

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
          <Box
            sx={{ pt: 4, position: 'sticky', top: 0, backgroundColor: theme.palette.primary.contrastText, zIndex: 100 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', mb: 2 }}>
              <IconButton
                size='small'
                onClick={() => {
                  setActivitySidebarOpen(false)
                  setUomList([])
                  setUom('')
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
                <Autocomplete
                  value={uom !== undefined && uom !== '' ? uom : null} 
                  forcePopupIcon={false}
                  isOptionEqualToValue={(option, value) => option.value === value}
                  noOptionsText='Type to search'
                  options={uomList?.length > 0 ? uomList : []}
                  getOptionLabel={option => option?.name}
                  onChange={(e, val) => {
                    setUom(val !== null ? val : '') 
                  }}
                  renderInput={params => <TextField {...params} label='Select unit*' placeholder='Search & Select' />}
                  sx={{ width: '200px' }}
                />
              </Box>
            </Box>
            <Divider />
          </Box>
          <CardContent sx={{ pb: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box>
              <Box>
                <FormGroup>
                  {fields.map((field, index) => (
                    <Grid
                      container
                      key={field?.id}
                      sx={{
                        gap: 3,
                        mb: 4
                      }}
                    >
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`diet_types[${index}].weight`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <>
                                <TextField
                                  value={value}
                                  label='Weight*'
                                  onChange={e => {
                                    // setValue(`diet_types[${index}].weight`, e.target.value)
                                    onChange(e?.target?.value || '')
                                    checkDisabled()

                                    //setDis(false)
                                  }}
                                  error={Boolean(errors?.diet_types?.[index]?.weight)}
                                  type='number'
                                  name={`diet_types[${index}].weight`}
                                  onKeyUp={() => {
                                    handleKeyUp(index)
                                  }}
                                  slotProps={{
                                    htmlInput: { min: 1 }
                                  }}
                                />
                              </>
                            )}
                          />
                        </FormControl>

                        <Typography sx={{ fontSize: 12, ml: 2 }}>
                          {errors?.diet_types?.[index]?.weight?.message != 'same range value be not allowed' &&
                            errors?.diet_types?.[index]?.weight?.message}
                        </Typography>
                      </Grid>
                      {/* <Grid size={{xs: 12, sm: 2.5}}>
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
                          {errors?.diet_types?.[index]?.maxWeight?.message != 'same range value be not allowed' &&
                            errors?.diet_types?.[index]?.maxWeight?.message}
                        </Typography>
                      </Grid> */}
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`diet_types[${index}].unit.value`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <>
                                <Autocomplete

                                  //value={value || value?._id}
                                  value={getValues(`diet_types[${index}].unit.value`) || null}
                                  disablePortal
                                  id={`diet_types[${index}].unit.value`}
                                  options={uomList?.length > 0 ? uomList : []}
                                  getOptionLabel={option => option.name}
                                  onChange={(e, val) => {
                                    setValue(`diet_types[${index}].unit.value`, val || '')
                                    checkDisabled()
                                  }}
                                  renderInput={params => (
                                    <TextField {...params} label='Select unit*' placeholder='Search & Select' />
                                  )}
                                  sx={{ width: '200px' }}
                                />
                                {/* {errors?.diet_types?.[index]?.unit?.message && (
                                  <Typography sx={{ fontSize: '14px', color: 'error.main' }}>
                                    {errors?.diet_types?.[index]?.unit?.message || 'Unit is required'}
                                  </Typography>
                                )} */}
                              </>
                            )}
                          />
                        </FormControl>
                      </Grid>
                      {errors?.diet_types?.[index]?.weight?.message === 'same range value be not allowed' && (
                        <Grid size={{ xs: 10 }}>
                          <Typography sx={{ fontSize: 12, ml: 2 }}>
                            {errors?.diet_types?.[index]?.weight?.message}
                          </Typography>
                        </Grid>
                      )}
                      {/* {errors?.diet_types?.[index]?.maxWeight?.message === 'same range value be not allowed' && (
                        <Grid size={{xs: 10}}>
                          <Typography sx={{ fontSize: 12, ml: 2 }}>
                            {errors?.diet_types?.[index]?.maxWeight?.message}
                          </Typography>
                        </Grid>
                      )} */}

                      <Grid
                        item
                        sx={{
                          alignSelf: 'center',
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
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              width: '100%',
              px: 4,
              py: 4,
              backgroundColor: theme.palette.primary.contrastText,
              zIndex: 200
            }}
          >
            <Button
              disabled={dis || Boolean(errors?.diet_types)}
              type='submit'
              onClick={() => {
                console.log(
                  'fields',
                  getValues('diet_types').map(item => ({
                    meal_value_header: item?.weight,
                    weight_uom_id: item?.unit?.value?._id,
                    weight_uom_label: item?.unit?.value?.name
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
