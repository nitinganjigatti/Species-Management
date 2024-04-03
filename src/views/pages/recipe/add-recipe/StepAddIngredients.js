import { useState, useEffect } from 'react'
// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import { FormHelperText } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { IconButton } from '@mui/material'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import CancelIcon from '@mui/icons-material/Cancel'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

let totalQuantityval

const defaultValues = {
  by_percentage: [
    {
      ingredient_id: '',
      ingredient_name: '',
      feed_type_label: '',
      quantity: '',
      preparation_type_id: '',
      preparation_name: ''
    }
  ],
  by_quantity: [
    {
      ingredient_id: '',
      ingredient_name: '',
      feed_type_label: '',
      uom_id: '',
      quantity: '',
      preparation_type_id: ''
    }
  ],
  desc: ''
}

const schema = yup.object().shape({
  by_percentage: yup.array().of(
    yup.object().shape({
      ingredient_id: yup.string().required('ingredient id is required'),
      quantity: yup.string().required(),
      preparation_type_id: yup.string().required()
    })
  ),
  by_quantity: yup.array().of(
    yup.object().shape({
      ingredient_id: yup.string().required(),
      uom_id: yup.string().required(),
      quantity: yup.string().required(),
      preparation_type_id: yup.string().required()
    })
  )
})

const StepAddIngredients = ({
  formData,
  handleNext,
  handlePrev,
  uomList,
  IngredientTypeList,
  IngredientTypeListSearch,
  onCancelIconClick,
  handleIngredientChange
}) => {
  const ingredients = [{ label: ' Ingredients' }, { label: 'Quantity' }, { label: 'Preparation Type' }]
  const ingredientsbyqun = [
    { label: ' Ingredients' },
    { label: 'Unit of Measurement' },
    { label: 'Quantity' },
    { label: 'Preparation Type' }
  ]
  const [preparationTypeListPercentage, setPreparationTypeListPercentage] = useState([])
  const [preparationTypeListQuantity, setPreparationTypeListQuantity] = useState([])

  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    formState: { errors },
    trigger,
    getValues,
    setValue: setFormValue
  } = useForm({
    defaultValues,
    shouldUnregister: false,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const {
    fields: fieldsIngredients,
    append: appendIngredients,
    remove: removeIngredients
  } = useFieldArray({
    control,
    name: 'by_percentage'
  })

  const {
    fields: fieldsByQuantity,
    append: appendByQuantity,
    remove: removeByQuantity
  } = useFieldArray({
    control,
    name: 'by_quantity'
  })

  const addIngredientsButton = () => {
    console.log(fieldsIngredients, 'klklkl')
    totalQuantityval = fieldsIngredients.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0)
    console.log(totalQuantityval, 'totalQuantity')

    return (
      <Typography
        sx={{
          mb: 1,
          px: 4,
          mt: 6,
          float: 'left',
          color: '#37BD69',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={() => {
          appendIngredients({
            ingredient_id: '',
            quantity: '',
            preparation_type_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW INGREDIENT
      </Typography>
    )
  }
  const addQuantityButton = () => {
    return (
      <Typography
        sx={{
          mb: 1,
          px: 4,
          mt: 6,
          float: 'left',
          color: '#37BD69',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={() => {
          appendByQuantity({
            ingredient_id: '',
            quantity: '',
            preparation_type_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW INGREDIENT
      </Typography>
    )
  }
  const removeIngredientButton = index => {
    console.log(index, 'index')
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          removeIngredients(index)
        }}
        className='checkraghu'
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const removebyQuantityButton = index => {
    console.log(index, 'index')
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          removeByQuantity(index)
        }}
        className='checkraghu'
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const handleAddRemoveingredient = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addIngredientsButton()}
          {/* {removeIngredientButton(index)} */}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addIngredientsButton()}
          {/* {clearSaltFields(index)} */}
        </>
      )
    } else {
      return <>{removeIngredientButton(index)}</>
    }
  }

  const handleAddRemoveQuantity = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addQuantityButton()}
          {/* {removeIngredientButton(index)} */}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addQuantityButton()}
          {/* {clearSaltFields(index)} */}
        </>
      )
    } else {
      return <>{removebyQuantityButton(index)}</>
    }
  }

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  const handlePrevClick = () => {
    window.scrollTo(0, 0)
    handlePrev()
  }

  useEffect(() => {
    // Set the form values using the formData prop when the component mounts
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  const onSubmit = async data => {
    console.log(data, 'data')
    window.scrollTo(0, 0)
    // Clear any existing errors
    Object.keys(defaultValues).forEach(field => {
      clearErrors(field)
    })

    try {
      await schema.validate(data, { abortEarly: false })

      // Proceed to the next step if validation succeeds
      handleNext(data)
    } catch (validationErrors) {
      validationErrors.inner.forEach(error => {
        setError(error.path, { message: error.message })
      })
    }
  }

  const handlecheck = async (ingredientId, index, section) => {
    try {
      const response = await getPreparationTypeList(ingredientId)
      if (response.success === true) {
        const ingredient = IngredientTypeList.find(item => item.id === ingredientId)
        if (ingredient) {
          // Update the preparationTypeList array based on the section
          if (section === 'by_percentage') {
            setPreparationTypeListPercentage(prevList => {
              const newList = [...prevList]
              newList[index] = response.data.result
              return newList
            })
          } else if (section === 'by_quantity') {
            setPreparationTypeListQuantity(prevList => {
              const newList = [...prevList]
              newList[index] = response.data.result
              return newList
            })
          }
        }
      }
    } catch (error) {
      // Handle error
    }
  }

  useEffect(() => {
    // Iterate through formData.by_percentage and trigger handlecheck for each ingredient_id
    formData.by_percentage.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_percentage')
      }
    })
  }, [formData])

  useEffect(() => {
    // Iterate through formData.by_quantity and trigger handlecheck for each ingredient_id
    formData.by_quantity.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_quantity')
      }
    })
  }, [formData])

  console.log(errors, 'ppp')
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {console.log(fieldsIngredients, 'fieldsIngredients')}
        <Grid container spacing={5} sx={{ px: 5, pt: 6 }}>
          <Box sx={{ mb: 4, px: 5, mt: 2, float: 'left' }}>
            <Typography variant='h6'>Add Ingredient- by Percentage</Typography>
          </Box>
          <Grid container spacing={5} sx={{ px: 5, background: '#E8F4F2', my: 1, borderRadius: 0.5, mx: 4 }}>
            {ingredients.map((ingredient, index) => (
              <Grid item xs={12} sm={3.6} key={index} sx={{ py: 4, px: 2 }}>
                <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                  {ingredient.label}
                  {/* {ingredient.label === 'Quantity' ? totalQuantityval + '%' : ''} */}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={5} sx={{ px: 5, py: 5 }}>
            <Grid container spacing={5} sx={{ px: 5, py: 5 }}>
              {fieldsIngredients.map((field, index) => (
                <Grid container spacing={5} sx={{ px: 5, py: 5 }} key={field.id}>
                  <Grid item xs={12} sm={3.6}>
                    {console.log(IngredientTypeList, 'IngredientTypeList')}
                    <FormControl fullWidth>
                      <Controller
                        name={`by_percentage[${index}].ingredient_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            value={IngredientTypeList.find(option => option.id === value) || null}
                            disablePortal
                            id={`by_percentage[${index}].ingredient_id`}
                            placeholder='Search & Select'
                            options={IngredientTypeList || []}
                            getOptionLabel={option => option?.ingredient_name}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            onChange={(e, val) => {
                              console.log(val, 'val')
                              if (val === null) {
                                onChange('')
                                setFormValue(`by_percentage[${index}].ingredient_name`, '')
                                setFormValue(`by_percentage[${index}].feed_type_label`, '')
                                setPreparationTypeListPercentage([])
                              } else {
                                onChange(val?.id)
                                setFormValue(`by_percentage[${index}].ingredient_name`, val?.ingredient_name)
                                setFormValue(`by_percentage[${index}].feed_type_label`, val?.feed_type_label)
                                // if (val.preparation_types) {
                                //   setpreparationTypeList(val.preparation_types)
                                // } else {
                                //   setpreparationTypeList([])
                                // }
                                handlecheck(val?.id, index, 'by_percentage')
                              }
                            }}
                            onKeyUp={e => {
                              IngredientTypeListSearch(e?.target?.value)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Select Ingredient'
                                placeholder='Search & Select'
                                // error={Boolean(errors.ingredients)}
                              />
                            )}
                          />
                        )}
                      />
                      {errors.by_percentage && errors.by_percentage[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_percentage[index].ingredient_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3.6}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_percentage[${index}].quantity`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            type='number'
                            label='Enter Quantity (%)'
                            name={`by_percentage[${index}].quantity`}
                            error={Boolean(errors.quantity)}
                            onChange={onChange}
                            placeholder=''
                          />
                        )}
                      />
                      {errors.by_percentage && errors.by_percentage[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_percentage[index].quantity?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3.6}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_percentage[${index}].preparation_type_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => {
                          console.log(value, 'value')
                          console.log(preparationTypeListPercentage, 'preparationTypeList')
                          return (
                            <Autocomplete
                              id={`by_percentage[${index}].preparation_type_id`}
                              getOptionLabel={option => option.label || ''}
                              renderInput={params => <TextField {...params} label='Select Preparation Type' />}
                              options={preparationTypeListPercentage[index] || []}
                              onChange={(event, newValue) => {
                                const updatedIngredient = newValue?.id || ''
                                setFormValue(`by_percentage[${index}].preparation_type_id`, newValue?.id || '') // Use id instead of value
                                setFormValue(`by_percentage[${index}].preparation_name`, newValue?.label || '')
                                onChange(updatedIngredient, index)
                              }}
                              value={preparationTypeListPercentage[index]?.find(option => option.id === value) || null}
                              isOptionEqualToValue={(option, value) => option.id === value}
                            />
                          )
                        }}
                      />
                      {errors.by_percentage && errors.by_percentage[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_percentage[index].preparation_type_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  {fieldsIngredients.length - 1 === index && index > 0 ? (
                    <Grid>{removeIngredientButton(index)}</Grid>
                  ) : (
                    ''
                  )}
                  <Grid>{handleAddRemoveingredient(fieldsIngredients, index)}</Grid>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mb: 2, px: 5, mt: 2, float: 'left' }}>
              <Typography variant='h6'>Add Ingredient- by Quantity</Typography>
            </Box>
            <Grid container spacing={5} sx={{ px: 5, background: '#E8F4F2', my: 4, borderRadius: 0.5, mx: 4 }}>
              {ingredientsbyqun.map((ingredient, index) => (
                <Grid item xs={12} sm={2.9} key={index} sx={{ py: 4, px: 2 }}>
                  <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                    {ingredient.label}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={5} sx={{ px: 5, py: 5 }}>
              {fieldsByQuantity.map((field, index) => (
                <Grid container spacing={5} sx={{ px: 5, py: 5 }} key={field.id}>
                  <Grid item xs={12} sm={2.9}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_quantity[${index}].ingredient_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            value={IngredientTypeList.find(option => option.id === value) || null}
                            disablePortal
                            id={`by_quantity[${index}].ingredient_id`}
                            placeholder='Search & Select'
                            options={IngredientTypeList || []}
                            getOptionLabel={option => option?.ingredient_name}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            onChange={(e, val) => {
                              if (val === null) {
                                onChange('')
                                setFormValue(`by_quantity[${index}].ingredient_name`, '')
                                setFormValue(`by_quantity[${index}].feed_type_label`, '')
                                setPreparationTypeListQuantity([])
                              } else {
                                onChange(val?.id)
                                setFormValue(`by_quantity[${index}].ingredient_name`, val?.ingredient_name)
                                setFormValue(`by_quantity[${index}].feed_type_label`, val?.feed_type_label)
                                handlecheck(val?.id, index, 'by_quantity')
                              }
                            }}
                            onKeyUp={e => {
                              IngredientTypeListSearch(e?.target?.value)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Select Ingredient'
                                placeholder='Search & Select'
                                // error={Boolean(errors.byQuantity)}
                                // InputProps={{
                                //   ...params.InputProps,
                                //   endAdornment: (
                                //     <>
                                //       {/* Cancel icon */}
                                //       <IconButton
                                //         aria-label='cancel'
                                //         onClick={() => {
                                //           // Call the onCancelIconClick function passed as prop
                                //           onCancelIconClick()
                                //         }}
                                //       >
                                //         <CancelIcon />
                                //       </IconButton>
                                //     </>
                                //   )
                                // }}
                              />
                            )}
                          />
                        )}
                      />
                      {errors.by_quantity && errors.by_quantity[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_quantity[index].ingredient_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2.8}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_quantity[${index}].uom_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => {
                          return (
                            <Autocomplete
                              id={`by_quantity[${index}].uom_id`}
                              getOptionLabel={option => option.name}
                              renderInput={params => <TextField {...params} label='Measurement (UOM)' />}
                              options={uomList || []}
                              onChange={(e, val) => {
                                if (val === null) {
                                  return onChange('')
                                } else {
                                  return onChange(val._id)
                                }
                              }}
                              value={uomList.find(option => option._id === value) || null}
                              isOptionEqualToValue={(option, value) => option?._id === value?._id}
                            />
                          )
                        }}
                      />
                      {errors.by_quantity && errors.by_quantity[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_quantity[index].uom_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2.9}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_quantity[${index}].quantity`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            type='number'
                            label='Enter Quantity (%)'
                            name={`by_quantity[${index}].quantity`}
                            error={Boolean(errors.quantity)}
                            onChange={onChange}
                            placeholder=''
                          />
                        )}
                      />
                      {errors.by_quantity && errors.by_quantity[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_quantity[index].quantity?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2.8}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_quantity[${index}].preparation_type_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => {
                          return (
                            <Autocomplete
                              id={`by_quantity[${index}].preparation_type_id`}
                              getOptionLabel={option => option.label || ''}
                              renderInput={params => <TextField {...params} label='Select Preparation Type' />}
                              options={preparationTypeListQuantity[index] || []}
                              onChange={(event, newValue) => {
                                const updatedIngredient = newValue?.id || ''
                                setFormValue(`by_quantity[${index}].preparation_type_id`, newValue?.id || '') // Use id instead of value
                                setFormValue(`by_quantity[${index}].preparation_name`, newValue?.label || '')
                                onChange(updatedIngredient, index)
                              }}
                              value={preparationTypeListQuantity[index]?.find(option => option.id === value) || null}
                              isOptionEqualToValue={(option, value) => option.id === value}
                            />
                          )
                        }}
                      />
                      {errors.by_quantity && errors.by_quantity[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_quantity[index].preparation_type_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  {fieldsByQuantity.length - 1 === index && index > 0 ? (
                    <Grid>{removebyQuantityButton(index)}</Grid>
                  ) : (
                    ''
                  )}
                  <Grid>{handleAddRemoveQuantity(fieldsByQuantity, index)}</Grid>
                </Grid>
              ))}
            </Grid>

            <Grid container sx={{ px: 5, py: 3 }}>
              <Box sx={{ mb: 4, float: 'left' }}>
                <Typography variant='h6'>Add Description</Typography>
              </Box>
              <Grid item xs={12}>
                <Controller
                  name='desc'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      multiline
                      fullWidth
                      value={value}
                      label='Description (Optional)'
                      name='desc'
                      error={Boolean(errors.desc)}
                      onChange={onChange}
                      id='textarea-outlined'
                      rows={5}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrevClick}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                Go back
              </Button>
              <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
                Next
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </>
  )
}

export default StepAddIngredients
