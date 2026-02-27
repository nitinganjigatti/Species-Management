import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import { FormHelperText, CircularProgress } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import { Divider, CardContent } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Toaster from 'src/components/Toaster'
import Router from 'next/router'
import Icon from 'src/@core/components/icon'
import AddCutSize from '../../diet/cutSizes/addCutSizes'
import { addCutSize, getCutsizeList } from 'src/lib/api/diet/settings/cutSizes'
import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'
import { useTheme, useMediaQuery } from '@mui/material'

const defaultValues = {
  recipe_name: '',
  portion_size: '',
  portion_uom_id: '',
  portion_uom_name: '',
  nutrional_value: '',
  nutrional_uom_id: '',
  kcal: '',
  by_percentage: [
    {
      ingredient_id: '',
      ingredient_name: '',
      feed_type_label: '',
      quantity: '',
      preparation_type_id: '',
      preparation_type: ''

      // cut_size: '',
      // cut_size_id: ''
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
  recipe_name: yup.string().required('Mix name is required')
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
  loader
}) => {
  const ingredients = [
    { label: ' Items' },
    { label: 'Quantity' },
    { label: 'Preparation Type' }

    // { label: 'Cut Size' }
  ]

  const editParamsInitialState = { id: null, label: null, status: null }
  const [uploadedImage, setUploadedImage] = useState(null)
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
    getValues,
    setValue: setFormValue,
    setError
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
    return (
      <>
        <Typography
          sx={{
            mb: 0,
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

              //cut_size_id: ''
            })
          }}
        >
          <Icon icon='material-symbols:add' />
          ADD NEW ITEM
        </Typography>
      </>
    )
  }

  const calculateTotalQuantity = () => {
    const byPercentageValues = getValues('by_percentage')
    const totalQuantity = byPercentageValues.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0)

    return parseFloat(totalQuantity.toFixed(2))
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

            //cut_size_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW ITEM
      </Typography>
    )
  }

  const removeIngredientButton = index => {
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}
        className='ing_byperc'
        onClick={() => {
          removeIngredients(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const handleAddRemoveingredient = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return <>{addIngredientsButton()}</>
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return <>{addIngredientsButton()}</>
    } else {
      return <>{removeIngredientButton(index)}</>
    }
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

  const cancelBack = () => {
    Router.push('/diet/combo/')
  }

  const handleImageUpload = imageData => {
    setUploadedImage(imageData)
  }

  useEffect(() => {
    if (formData) {
      setUploadedImage(formData.recipe_image)
    }
  }, [formData])

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  useEffect(() => {
    getCutsizeListdata()
  }, [])

  const onSubmit = async data => {
    const filteredPercentage = data.by_percentage.filter(
      item => item.ingredient_id || item.quantity || item.preparation_type_id
    )

    let hasError = false
    let firstErrorIndex = -1

    if (filteredPercentage.length === 0) {
      setError('by_percentage.0.ingredient_id', { type: 'manual', message: 'Ingredient is required' })
      setError('by_percentage.0.quantity', { type: 'manual', message: 'Quantity is required' })
      setError('by_percentage.0.preparation_type_id', { type: 'manual', message: 'Preparation type is required' })
      hasError = true
      firstErrorIndex = 0
    }

    data.by_percentage.forEach((item, index) => {
      const isAnyFilled = item.ingredient_id || item.quantity || item.preparation_type_id
      const isAllFilled = item.ingredient_id && item.quantity && item.preparation_type_id

      if (isAnyFilled && !isAllFilled) {
        hasError = true
        if (firstErrorIndex === -1) firstErrorIndex = index
        if (!item.ingredient_id)
          setError(`by_percentage.${index}.ingredient_id`, { type: 'manual', message: 'Ingredient is required' })
        if (!item.quantity)
          setError(`by_percentage.${index}.quantity`, { type: 'manual', message: 'Quantity is required' })
        if (!item.preparation_type_id)
          setError(`by_percentage.${index}.preparation_type_id`, {
            type: 'manual',
            message: 'Preparation type is required'
          })
      }
    })

    if (hasError) {
      Toaster({
        type: 'error',
        message: 'Please fill in all mandatory fields'
      })

      return
    }

    // Check for duplicate ingredients with same preparation type
    const checkRepeated = new Set()
    const hasDuplicates = filteredPercentage.some(item => {
      const key = `${item.ingredient_id}_${item.preparation_type_id}`
      if (checkRepeated.has(key)) {
        return true
      }
      checkRepeated.add(key)

      return false
    })

    if (hasDuplicates) {
      return Toaster({
        type: 'error',
        message: 'The same item with the same preparation type is not allowed'
      })
    }

    const totalQuantity = filteredPercentage.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0)

    if (totalQuantity > 100 && filteredPercentage.length > 0) {
      return Toaster({
        type: 'error',
        message: 'Please review and adjust percentages before adding new ingredients'
      })
    } else if (totalQuantity < 100 && filteredPercentage.length > 0) {
      return Toaster({
        type: 'error',
        message: 'Percentage added should be equal to 100%'
      })
    }

    const filteredByQuantity = data.by_quantity.filter(
      item => item.ingredient_id || item.quantity || item.preparation_type_id || item.uom_id
    )

    try {
      await schema.validate(data, { abortEarly: false })

      const formDataWithImage = {
        ...data,
        by_percentage: filteredPercentage,
        by_quantity: filteredByQuantity,
        recipe_image: uploadedImage
      }
      handleNext(formDataWithImage)
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
      appendByQuantity({ ingredient_id: '', quantity: '', uom_id: '', preparation_type_id: '' })
    }
    if (fieldsIngredients.length === 0) {
      appendIngredients({ ingredient_id: '', quantity: '', preparation_type_id: '' })
    }
  }, [fieldsByQuantity, fieldsIngredients, appendByQuantity, appendIngredients])

  const ScrollToFieldError = ({ errors }) => {
    useEffect(() => {
      if (!errors || Object.keys(errors).length === 0) return

      const firstErrorField = Object.keys(errors)[0]

      if (firstErrorField === 'by_percentage' && errors.by_percentage) {
        const firstIndex = Object.keys(errors.by_percentage)
          .map(Number)
          .sort((a, b) => a - b)
          .find(index => errors.by_percentage[index])

        if (firstIndex !== undefined) {
          const element = document.getElementById('test' + firstIndex)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      } else {
        const element = document.getElementsByName(firstErrorField)[0]
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (firstErrorField === 'recipe_name') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }, [errors])

    return null
  }

  const handleEquilizerClick = () => {
    const byPercentageValues = getValues('by_percentage')

    const numIngredients = byPercentageValues.length
    const equalDistribution = 100 / numIngredients

    const updatedIngredients = byPercentageValues.map(ingredient => ({
      ...ingredient,
      quantity: equalDistribution.toString()
    }))
    setFormValue('by_percentage', updatedIngredients)
  }

  return (
    <>
      {loader ? (
        <CardContent sx={{ background: '#fff', height: '100vh' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 5, px: 5, mt: 5, float: 'left' }}>
            <Typography variant='h6'>Mix details</Typography>
          </Box>
          <ScrollToFieldError errors={errors} />
          <Grid container spacing={5} sx={{ px: 5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <Controller
                  name='recipe_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Mix name *'
                      name='recipe_name'
                      error={Boolean(errors.recipe_name)}
                      onChange={onChange}
                    />
                  )}
                />

                {errors.recipe_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.recipe_name?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Divider sx={{ mx: 3, mt: 3, width: '98%', ml: 1 }} />

            <Box sx={{ float: 'left', width: '100%' }}>
              <Typography variant='h6'>Add image</Typography>
            </Box>

            <Grid size={{ xs: 6 }} sx={{ pt: 0 }}>
              <CardContent sx={{ px: 0, pt: 0 }}>
                <CustomFileUploaderSingle onImageUpload={handleImageUpload} uploadedImagenew={uploadedImage} />
              </CardContent>
            </Grid>
          </Grid>
          <Grid container spacing={5} sx={{ px: 5, pt: 0 }}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0, mt: 2, mr: 4 }}>
                <Typography variant='h6'>Add Item - by Percentage</Typography>
              </Box>
            </Grid>
            <Grid container spacing={5} sx={{ px: 5, background: '#E8F4F2', borderRadius: 0.5, mx: 0 }}>
              {ingredients.map((ingredient, index) => (
                <Grid size={{ xs: 12, sm: 3.7, md: 4 }} key={index} sx={{ py: 4 }}>
                  <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {ingredient.label}{' '}
                      <span style={{ fontSize: '12px', color: '#588980db', textTransform: 'lowercase' }}>
                        {' '}
                        {ingredient.label === 'Quantity' ? (
                          calculateTotalQuantity() === 0 ? (
                            '(0% Left)'
                          ) : calculateTotalQuantity() >= 100 ? (
                            <span style={{ fontSize: '12px', color: '#37BD69', textTransform: 'lowercase' }}>
                              (100% Done)
                            </span>
                          ) : (
                            `(${(100 - calculateTotalQuantity()).toFixed(2)}% Left)`
                          )
                        ) : (
                          ''
                        )}
                      </span>
                      {ingredient.label === 'Quantity' && <Icon icon='mdi:equal-box' onClick={handleEquilizerClick} />}
                    </span>
                  </Typography>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={5} sx={{ px: 0, py: 0 }}>
              <Grid container spacing={5} sx={{ px: 0, py: 0 }}>
                {fieldsIngredients.map((field, index) => (
                  <Grid container spacing={5} sx={{ px: 0, py: 1 }} key={field.id} id={'test' + index}>
                    <Grid size={{ xs: 12, sm: 3.6 }}>
                      <FormControl fullWidth>
                        <Controller
                          name={`by_percentage[${index}].ingredient_id`}
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Autocomplete
                              sx={{
                                '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                  isSmallDevice ? { paddingRight: '10px' } : {},
                                '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {}
                              }}
                              value={fullIngredientList.find(option => option.id === value) || null}
                              disablePortal
                              id={`by_percentage[${index}].ingredient_id`}
                              placeholder='Search & Select'
                              options={fullIngredientList || []}
                              getOptionLabel={option => option?.ingredient_name}
                              isOptionEqualToValue={(option, value) => option?.id === value?.id}
                              onChange={(e, val) => {
                                if (val === null) {
                                  onChange('')
                                  setFormValue(`by_percentage[${index}].ingredient_name`, '')
                                  setFormValue(`by_percentage[${index}].feed_type_label`, '')

                                  //setPreparationTypeListPercentage([])
                                  setFormValue(`by_percentage[${index}].preparation_type`, '')
                                } else {
                                  onChange(val?.id)
                                  setFormValue(`by_percentage[${index}].ingredient_name`, val?.ingredient_name)
                                  setFormValue(`by_percentage[${index}].feed_type_label`, val?.feed_type_label)

                                  handlecheck(val?.id, index, 'by_percentage')
                                  setFormValue(`by_percentage[${index}].preparation_type`, '')
                                  setFormValue(`by_percentage[${index}].preparation_type_id`, '')
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
                                    errors.by_percentage &&
                                    errors.by_percentage[index] &&
                                    errors.by_percentage[index].ingredient_id?.message
                                      ? true
                                      : false
                                  }
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

                    <Grid size={{ xs: 12, sm: 3.7 }}>
                      <FormControl fullWidth>
                        <Controller
                          name={`by_percentage[${index}].quantity`}
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              type='number'
                              label='Enter Quantity (%)*'
                              name={`by_percentage[${index}].quantity`}
                              onChange={e => {
                                onChange(e)
                                const totalQuantity = calculateTotalQuantity()

                                trigger(`by_percentage[${index}].quantity`)
                              }}
                              placeholder=''
                              onInput={e => {
                                if (e.target.value < 0) {
                                  e.target.value = ''
                                }
                              }}
                              error={
                                errors.by_percentage &&
                                errors.by_percentage[index] &&
                                errors.by_percentage[index].quantity?.message
                                  ? true
                                  : false
                              }
                            />
                          )}
                        />
                        {errors.by_percentage && errors.by_percentage[index] && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors.by_percentage[index].quantity?.message}
                          </FormHelperText>
                        )}
                        {index === fieldsIngredients.length - 1 && (
                          <Grid size={{ xs: 12, sm: 12 }}>
                            <span
                              style={{
                                paddingTop: '15px',
                                float: 'left',
                                color: '#ff0000cc',
                                paddingLeft: '12px',
                                fontSize: '14px'
                              }}
                            >
                              {fieldsIngredients.length > 1 && calculateTotalQuantity() > 100
                                ? "you've hit 100% limit"
                                : fieldsIngredients.length > 1 && calculateTotalQuantity() < 100
                                ? 'Limit should be equal to 100%'
                                : ''}
                            </span>
                          </Grid>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3.7 }}>
                      <FormControl fullWidth>
                        <Controller
                          name={`by_percentage[${index}].preparation_type_id`}
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => {
                            return (
                              <Autocomplete
                                sx={{
                                  '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                    isSmallDevice ? { paddingRight: '10px' } : {},
                                  '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                  '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {}
                                }}
                                id={`by_percentage[${index}].preparation_type_id`}
                                getOptionLabel={option => option.label || ''}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Select Preparation Type *'
                                    error={
                                      errors.by_percentage &&
                                      errors.by_percentage[index] &&
                                      errors.by_percentage[index].preparation_type_id?.message
                                        ? true
                                        : false
                                    }
                                  />
                                )}
                                options={preparationTypeListPercentage[index] || []}
                                onChange={(event, newValue) => {
                                  const updatedIngredient = newValue?.id || ''
                                  setFormValue(`by_percentage[${index}].preparation_type_id`, newValue?.id || '') // Use id instead of value
                                  setFormValue(`by_percentage[${index}].preparation_type`, newValue?.label || '')
                                  onChange(updatedIngredient, index)
                                }}
                                value={
                                  preparationTypeListPercentage[index]?.find(option => option.id === value) || null
                                }
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

              <Grid container sx={{ px: 0, py: 0 }}>
                <Box sx={{ mb: 0, float: 'left' }}>
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
                  onClick={cancelBack}
                  startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                  sx={{ mr: 6 }}
                >
                  Cancel
                </Button>
                <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
                  Next
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
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
