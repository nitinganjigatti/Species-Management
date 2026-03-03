import { useState, useEffect } from 'react'
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
import { AddButton } from 'src/components/Buttons'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import { Divider } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Toaster from 'src/components/Toaster'
import { useTheme, useMediaQuery } from '@mui/material'
import Icon from 'src/@core/components/icon'
import AddCutSize from '../../diet/cutSizes/addCutSizes'
import { addCutSize, getCutsizeList } from 'src/lib/api/diet/settings/cutSizes'

const defaultValues = {
  by_percentage: [
    {
      ingredient_id: '',
      ingredient_name: '',
      feed_type_label: '',
      quantity: '',
      preparation_type_id: '',
      preparation_type: '',
      cut_size: '',
      cut_size_id: ''
    }
  ],
  by_quantity: [
    {
      ingredient_id: '',
      ingredient_name: '',
      feed_type_label: '',
      uom_id: '',
      quantity: '',
      preparation_type_id: '',
      preparation_type: '',
      cut_size: '',
      cut_size_id: ''
    }
  ],
  desc: ''
}

const schema = yup.object().shape({
  // by_percentage: yup.array().of(
  //   yup.object().shape({
  //     ingredient_id: yup.string().required('Ingredient is required'),
  //     quantity: yup
  //       .string()
  //       .required('Quantity is required')
  //       .test('is-less-than-100', 'Quantity must be less than or equal to 100', value => {
  //         return parseFloat(value) <= 100
  //       }),
  //     preparation_type_id: yup.string().required('Preparation type is required')
  //   })
  // ),
  // by_quantity: yup.array().of(
  //   yup.object().shape({
  //     ingredient_id: yup.string().required('Ingredient is required'),
  //     uom_id: yup.string().required('Uom is required'),
  //     quantity: yup
  //       .string()
  //       .required('Quantity is required')
  //       .test('is-less-than-100', 'Quantity must be less than or equal to 100', value => {
  //         return parseFloat(value) <= 100
  //       }),
  //     preparation_type_id: yup.string().required('Preparation type is required')
  //   })
  // )
})

const StepAddIngredients = ({
  formData,
  handleNext,
  handlePrev,
  uomList,
  cutsizeList,
  fullIngredientList,
  IngredientTypeListSearch,
  setcutSize,
  fetchMoreIngredients
}) => {
  const ingredients = [{ label: ' Items' }, { label: 'Quantity' }, { label: 'Preparation Type' }, { label: 'Cut Size' }]

  const handleScroll = event => {
    const listboxNode = event.currentTarget
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 5) {
      fetchMoreIngredients()
    }
  }

  const ingredientsbyqun = [
    { label: ' Items' },
    { label: 'Quantity' },
    { label: 'Unit of Measurement' },
    { label: 'Preparation Type' },
    { label: 'Cut Size' }
  ]
  const editParamsInitialState = { id: null, label: null, status: null }
  const [preparationTypeListPercentage, setPreparationTypeListPercentage] = useState([])
  const [preparationTypeListQuantity, setPreparationTypeListQuantity] = useState([])
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))

  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    formState: { errors },
    trigger,
    setError,
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

  const addQuantityButton = () => {
    return (
      <Grid
        container
        sx={{
          mb: 5,

          mt: 4,

          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={() => {
          appendByQuantity({
            ingredient_id: '',
            quantity: '',
            preparation_type_id: '',
            cut_size_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW ITEM
      </Grid>
    )
  }

  const removebyQuantityButton = index => {
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}
        className='ing_byquan'
        onClick={() => {
          removeByQuantity(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, status: null })
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const getCutsizeListdata = async () => {
    try {
      const params = {
        page: 1,
        limit: 100
      }
      await getCutsizeList(params).then(res => {
        setcutSize(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      const response = await addCutSize(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setOpenDrawer(false)
        getCutsizeListdata()
      } else {
        setSubmitLoader(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      Toaster({ type: 'error', message: JSON.stringify(e) })
    }
  }

  const handlePrevClick = () => {
    window.scrollTo(0, 0)
    handlePrev()
  }

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  useEffect(() => {
    getCutsizeListdata()
  }, [])

  const onSubmit = async data => {
    const isByQuantityValid =
      data.by_quantity.length > 0 &&
      data.by_quantity.every(
        item =>
          item.ingredient_id &&
          item.quantity &&
          item.uom_id &&
          item.preparation_type_id &&
          item.cut_size_id &&
          item.cut_size_id !== 'null' &&
          item.cut_size_id !== '0'
      )

    if (!isByQuantityValid) {
      const firstIncompleteIndex = data.by_quantity.findIndex(
        item =>
          !item.ingredient_id ||
          !item.quantity ||
          !item.uom_id ||
          !item.preparation_type_id ||
          !item.cut_size_id ||
          item.cut_size_id === 'null' ||
          item.cut_size_id === '0'
      )
      const targetIndex = firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0

      data.by_quantity.forEach((item, index) => {
        if (!item.ingredient_id)
          setError(`by_quantity[${index}].ingredient_id`, { type: 'manual', message: 'Item is required' })
        if (!item.quantity)
          setError(`by_quantity[${index}].quantity`, { type: 'manual', message: 'Quantity is required' })
        if (!item.uom_id)
          setError(`by_quantity[${index}].uom_id`, { type: 'manual', message: 'Measurement is required' })
        if (!item.preparation_type_id)
          setError(`by_quantity[${index}].preparation_type_id`, { type: 'manual', message: 'Type is required' })
        if (!item.cut_size_id || item.cut_size_id === 'null' || item.cut_size_id === '0')
          setError(`by_quantity[${index}].cut_size`, { type: 'manual', message: 'Cut size is required' })
      })

      setTimeout(() => {
        const errorElement = document.getElementById('testnew' + targetIndex)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          window.scrollTo(0, 0)
        }
      }, 50)

      return Toaster({
        type: 'error',
        message: `Please fill in all fields in By Quantity at row ${targetIndex + 1}.`
      })
    }

    // Check for duplicate ingredients with same preparation and cut size
    const seen = new Set()
    let duplicateFound = false
    data.by_quantity.forEach(item => {
      if (item.ingredient_id && item.preparation_type_id && item.cut_size_id) {
        const key = `${item.ingredient_id}-${item.preparation_type_id}-${item.cut_size_id}`
        if (seen.has(key)) {
          duplicateFound = true
        }
        seen.add(key)
      }
    })

    if (duplicateFound) {
      return Toaster({
        type: 'error',
        message: 'The same item with same preparation type and cut size is not allowed.'
      })
    }

    window.scrollTo(0, 0)

    Object.keys(defaultValues).forEach(field => {
      clearErrors(field)
    })

    try {
      await schema.validate(data, { abortEarly: false })
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
        const ingredient = fullIngredientList.find(item => item.id === ingredientId)
        if (ingredient) {
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
    } catch (error) {}
  }

  useEffect(() => {
    formData.by_percentage.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_percentage')
      }
    })
  }, [formData])

  useEffect(() => {
    formData.by_quantity.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_quantity')
      }
    })
  }, [formData])

  useEffect(() => {
    if (fieldsByQuantity.length === 0) {
      appendByQuantity({ ingredient_id: '', quantity: '', uom_id: '', preparation_type_id: '', cut_size_id: '' })
    }
    if (fieldsIngredients.length === 0) {
      appendIngredients({ ingredient_id: '', quantity: '', preparation_type_id: '', cut_size_id: '' })
    }
  }, [fieldsByQuantity, fieldsIngredients, appendByQuantity, appendIngredients])

  const ScrollToFieldError = ({ errors, index }) => {
    const firstErrorField = Object.keys(errors)[0]

    if (firstErrorField === 'by_percentage') {
      const errorElement = document.getElementById('test' + index)

      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else if (firstErrorField === 'by_quantity') {
      const errorElement = document.getElementById('testnew' + index)

      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return null
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={5} sx={{ px: 5, pt: 6 }}>
          <Grid container spacing={5} sx={{ px: 1, py: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0, mr: 4 }}>
                <Typography variant='h6'>Add Item - by Quantity</Typography>
                <AddButton title='Add Cut Size' action={() => addEventSidebarOpen()} />
              </Box>
            </Grid>

            <Box
              sx={{
                width: '100%',
                overflowX: 'auto'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: 'max-content'
                }}
              >
                <Grid
                  container
                  spacing={5}
                  sx={{
                    px: 5,
                    background: theme.palette.customColors.displaybgPrimary,

                    borderRadius: 0.5,

                    mb: '1.25rem'
                  }}
                >
                  {ingredientsbyqun.map((ingredient, index) => (
                    <Grid size={{ xs: 12, sm: ingredient.label !== 'Quantity' ? 2.4 : 2.2 }} key={index} sx={{ py: 4 }}>
                      <Typography
                        sx={{
                          textTransform: 'uppercase',
                          fontSize: 14,
                          fontWeight: 600,
                          pl: ingredient.label === 'Preparation Type' || ingredient.label === 'Cut Size' ? 7 : 4
                        }}
                      >
                        {ingredient.label}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                {fieldsByQuantity.map((field, index) => (
                  <Box key={field.id}>
                    <Grid
                      container
                      spacing={5}
                      sx={{ px: 0, py: 3, flexWrap: 'nowrap', minWidth: 'max-content' }}
                      id={'testnew' + index}
                    >
                      <ScrollToFieldError errors={errors} index={index} />
                      <Grid size={{ xs: 12, sm: 2.3 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`by_quantity[${index}].ingredient_id`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                sx={{
                                  width: isSmallDevice ? '216px' : '236px'
                                }}
                                value={fullIngredientList.find(option => option.id === value) || null}
                                id={`by_quantity[${index}].ingredient_id`}
                                placeholder='Search & Select'
                                options={fullIngredientList || []}
                                getOptionLabel={option => option?.ingredient_name}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                ListboxProps={{
                                  onScroll: handleScroll
                                }}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    onChange('')
                                    setFormValue(`by_quantity[${index}].ingredient_name`, '')
                                    setFormValue(`by_quantity[${index}].feed_type_label`, '')
                                    setFormValue(`by_quantity[${index}].preparation_type`, '')
                                  } else {
                                    onChange(val?.id)
                                    setFormValue(`by_quantity[${index}].ingredient_name`, val?.ingredient_name)
                                    setFormValue(`by_quantity[${index}].feed_type_label`, val?.feed_type_label)
                                    handlecheck(val?.id, index, 'by_quantity')
                                    setFormValue(`by_quantity[${index}].preparation_type`, '')
                                    setFormValue(`by_quantity[${index}].preparation_type_id`, '')
                                  }
                                }}
                                onKeyUp={e => {
                                  IngredientTypeListSearch(e?.target?.value)
                                }}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Select Item*'
                                    placeholder='Search & Select'
                                    error={
                                      errors.by_quantity &&
                                      errors.by_quantity[index] &&
                                      errors.by_quantity[index].ingredient_id?.message
                                        ? true
                                        : false
                                    }
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

                      <Grid size={{ xs: 12, sm: 2.3 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`by_quantity[${index}].quantity`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                type='number'
                                label='Enter Quantity *'
                                name={`by_quantity[${index}].quantity`}
                                onChange={onChange}
                                placeholder=''
                                sx={{ width: isSmallDevice ? '216px' : '236px' }}
                                onInput={e => {
                                  if (e.target.value < 0) {
                                    e.target.value = ''
                                  }
                                }}
                                error={
                                  errors.by_quantity &&
                                  errors.by_quantity[index] &&
                                  errors.by_quantity[index].quantity?.message
                                    ? true
                                    : false
                                }
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
                      <Grid size={{ xs: 12, sm: 2.3 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`by_quantity[${index}].uom_id`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => {
                              return (
                                <Autocomplete
                                  sx={{
                                    width: isSmallDevice ? '216px' : '236px'
                                  }}
                                  id={`by_quantity[${index}].uom_id`}
                                  getOptionLabel={option => option.name}
                                  renderInput={params => (
                                    <TextField
                                      {...params}
                                      label='Measurement (UOM) *'
                                      error={
                                        errors.by_quantity &&
                                        errors.by_quantity[index] &&
                                        errors.by_quantity[index].uom_id?.message
                                          ? true
                                          : false
                                      }
                                    />
                                  )}
                                  options={uomList || []}
                                  onChange={(e, val) => {
                                    if (val === null) {
                                      onChange('')
                                      setFormValue(`by_quantity[${index}].uom_text`, '')
                                    } else {
                                      onChange(val._id)
                                      setFormValue(`by_quantity[${index}].uom_text`, val?.name || '')
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
                      <Grid size={{ xs: 12, sm: 2.3 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`by_quantity[${index}].preparation_type_id`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => {
                              return (
                                <Autocomplete
                                  sx={{
                                    width: isSmallDevice ? '216px' : '236px'
                                  }}
                                  id={`by_quantity[${index}].preparation_type_id`}
                                  getOptionLabel={option => option.label || ''}
                                  renderInput={params => (
                                    <TextField
                                      {...params}
                                      label='Select Type*'
                                      error={
                                        errors.by_quantity &&
                                        errors.by_quantity[index] &&
                                        errors.by_quantity[index].preparation_type_id?.message
                                          ? true
                                          : false
                                      }
                                    />
                                  )}
                                  options={preparationTypeListQuantity[index] || []}
                                  onChange={(event, newValue) => {
                                    const updatedIngredient = newValue?.id || ''
                                    setFormValue(`by_quantity[${index}].preparation_type_id`, newValue?.id || '')
                                    setFormValue(`by_quantity[${index}].preparation_type`, newValue?.label || '')
                                    onChange(updatedIngredient, index)
                                  }}
                                  value={
                                    preparationTypeListQuantity[index]?.find(option => option.id === value) || null
                                  }
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

                      <Grid size={{ xs: 12, sm: 2.3 }}>
                        <FormControl fullWidth>
                          <Controller
                            name={`by_quantity[${index}].cut_size`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => {
                              return (
                                <>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Autocomplete
                                      sx={{
                                        width: isSmallDevice ? '216px' : '236px'
                                      }}
                                      id={`by_quantity[${index}].cut_size`}
                                      getOptionLabel={option => option.cut_size}
                                      options={cutsizeList || []}
                                      onChange={(e, val) => {
                                        if (val === null) {
                                          onChange('')
                                          setFormValue(`by_quantity[${index}].cut_size`, '')
                                          setFormValue(`by_quantity[${index}].cut_size_id`, '')
                                        } else {
                                          onChange(val.id)
                                          setFormValue(`by_quantity[${index}].cut_size`, val?.cut_size)
                                          setFormValue(`by_quantity[${index}].cut_size_id`, val?.id)
                                          clearErrors(`by_quantity[${index}].cut_size`)
                                        }
                                      }}
                                      value={cutsizeList.find(option => option.cut_size === value) || null}
                                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                      renderInput={params => (
                                        <TextField
                                          {...params}
                                          label='Select Cut size *'
                                          error={
                                            errors.by_quantity &&
                                            errors.by_quantity[index] &&
                                            errors.by_quantity[index].cut_size?.message
                                              ? true
                                              : false
                                          }
                                        />
                                      )}
                                    />

                                    {fieldsByQuantity.length > 1 && removebyQuantityButton(index)}
                                  </Box>
                                  {errors.by_quantity &&
                                    errors.by_quantity[index] &&
                                    errors.by_quantity[index].cut_size && (
                                      <FormHelperText sx={{ color: 'error.main' }}>
                                        {errors.by_quantity[index].cut_size?.message}
                                      </FormHelperText>
                                    )}
                                </>
                              )
                            }}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    {fieldsByQuantity.length - 1 === index && (
                      <Box sx={{ mt: 0, float: 'left' }}>{addQuantityButton()}</Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            <Grid container>
              <Box sx={{ mb: 2, float: 'left' }}>
                <Typography variant='h6'>Add Description</Typography>
              </Box>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='desc'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      multiline
                      fullWidth
                      value={value}
                      label='Description (Optional) *'
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

          <Grid size={{ xs: 12 }}>
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
      <AddCutSize
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        //resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
    </>
  )
}

export default StepAddIngredients
