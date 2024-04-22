// ** React Imports
import React, { useEffect, useState } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import { Divider, CardContent, FormHelperText, Card, CardHeader, Avatar } from '@mui/material'
import { useRouter } from 'next/router'
import Router from 'next/router'
import { useForm, useFieldArray } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller } from 'react-hook-form'
// ** Third Party Imports
//import { DemoContainer } from '@mui/x-date-pickers/internals/demo'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

// ** Custom Component Imports
import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import AddIngredientswithChoice from 'src/components/diet/AddIngredientswithchoice'
import AddIngredients from 'src/components/diet/AddIngredients'

const defaultValues = {
  diet_name: '',
  diet_type: '',
  diet_image: '',
  desc: '',
  add_meal: [
    {
      meal_name: '',
      meal_from_time: '',
      meal_to_time: '',
      notes: '',
      recipe: [
        {
          recipe_id: '',
          days_of_week: [],
          remarks: '',
          meal_type: [
            {
              meal_value_header: '',
              quantity: '',
              meal_value_uom_id: '',
              notes: ''
            }
          ]
        }
      ],
      ingredient: [
        {
          ingredient_id: '',
          preparation_type_id: '',
          preparation_type: '',
          feed_cut_size: '',
          feed_uom_id: '',
          days_of_week: [],
          remarks: '',
          meal_type: [
            {
              meal_value_header: '',
              quantity: '',
              meal_value_uom_id: '',
              notes: ''
            }
          ]
        }
      ]
    }
  ]
}

const schema = yup.object().shape({
  diet_name: yup.string().required('Recipe name is required')
  //portion_size: yup.string().required('Portion size is required')
  // diet_type: yup.string().required('Unit of measurement is required'),
  // nutrional_value: yup.string().required('Nutritional values are required'),
  // nutrional_uom_id: yup.string().required('Unit of measurement is required'),
  // kcal: yup.string().required('Total calories are required')
})

const StepBasicDetails = ({ handleNext, formData, uomList, popperPlacement, selectedCard, setSelectedCard }) => {
  // ** States
  const [uploadedImage, setUploadedImage] = useState(null)
  const [openIngredient, setOpenIngredient] = useState(false)
  const [toValue, setToValue] = useState(null)
  const [OpenIngredientchoice, setOpenIngredientchoice] = useState(false)
  const [childStateValue, setChildStateValue] = useState([])
  const [allSelectedValues, setAllSelectedValues] = useState([])
  const [checkid, setcheckid] = useState('')
  const router = useRouter()
  const recipes = [
    { label: 'No' },
    { label: 'Recipe' },
    { label: 'Ingredients' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]
  const ingredients = [
    { label: 'No' },
    { label: 'Ingredient' },
    { label: 'Prep types' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]
  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    formState: { errors }
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const {
    fields: fieldsIngredients,
    append: appendIngredients,
    remove: removeIngredients
  } = useFieldArray({
    control,
    name: 'add_meal'
  })

  const handleImageUpload = imageData => {
    setUploadedImage(imageData)
  }

  // Function to handle changes in child state
  const handleChildStateChange = value => {
    setChildStateValue(value)

    // Remove duplicates from the new value based on id and valueid
    const uniqueValues = value.filter(
      (val, index, self) => index === self.findIndex(v => v.id === val.id && v.valueid === val.valueid)
    )

    // Update allSelectedValues with unique values
    setAllSelectedValues(prevState => {
      // Filter out duplicates from the previous state
      const filteredPrevState = prevState.filter(
        prevVal => !uniqueValues.some(uniqueVal => uniqueVal.id === prevVal.id && uniqueVal.valueid === prevVal.valueid)
      )

      // Combine unique values from the new value with filtered previous state
      return [...filteredPrevState, ...uniqueValues]
    })
  }

  useEffect(() => {
    if (formData) {
      setUploadedImage(formData.diet_image)
    }
  }, [formData])

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  useEffect(() => {
    // Filter allSelectedValues based on checkid
    const filteredValues = allSelectedValues.filter(value => value.valueid === checkid)
    // Update childStateValue with the filtered values
    setChildStateValue(filteredValues)
  }, [checkid, allSelectedValues])

  const ScrollToFieldError = ({ errors }) => {
    console.log(errors, 'errors')
    useEffect(() => {
      if (!errors) return
      console.log(Object.keys(errors)[0], 'check')
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.querySelector(`input[name="${firstErrorField}"]`)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, [errors])

    return null
  }

  const handleAddIngerdientChoice = val => {
    setOpenIngredientchoice(true)
  }

  const handleAddIngerdient = (val, id, index) => {
    setOpenIngredient(true)
    setcheckid(val.id)

    // Update childStateValue with objects having matching valueid
    setChildStateValue(prevState => {
      const newState = prevState.filter(item => item.valueid === val.id)
      return newState
    })
  }

  console.log(fieldsIngredients, 'fields')

  const handleSidebarClose = () => {
    setOpenIngredient(false)
    setOpenIngredientchoice(false)
  }

  const onSubmit = async data => {
    window.scrollTo(0, 0)
    // Clear any existing errors
    Object.keys(defaultValues).forEach(field => {
      clearErrors(field)
    })

    try {
      await schema.validate(data, { abortEarly: false })
      const imageData = await handleImageUpload()
      console.log(imageData, 'imageData')
      // Merge the image data with other form data
      const formDataWithImage = {
        ...data,
        diet_image: uploadedImage
      }
      handleNext(formDataWithImage)
      console.log(formDataWithImage, 'data')
    } catch (validationErrors) {
      validationErrors.inner.forEach(error => {
        setError(error.path, { message: error.message })
      })
    }
  }

  const cancelBack = () => {
    Router.push('/diet/recipe/')
  }

  const addIngredientsButton = () => {
    console.log(childStateValue, 'childStateValue')
    return (
      <>
        <Grid
          container
          justifyContent='center'
          alignItems='center'
          sx={{
            mt: 12,
            border: '3px dotted #37BD69',
            padding: '8px 16px',
            backgroundColor: '#37bd6912',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => {
            appendIngredients({
              meal_name: '',
              meal_from_time: '',
              meal_to_time: '',
              notes: '',
              ingredient: fieldsIngredients.map((field, i) => {
                const matchingChildState = childStateValue.find((child, j) =>
                  i === j ? child.valueid === field.id : null
                )
                if (matchingChildState) {
                  // Map child state values to the fieldsIngredients
                  return {
                    ...matchingChildState,
                    ingredient_id: '',
                    preparation_type_id: '',
                    preparation_type: '',
                    feed_cut_size: '',
                    feed_uom_id: '',
                    days_of_week: [],
                    remarks: '',
                    meal_type: [
                      {
                        meal_value_header: '',
                        quantity: '',
                        meal_value_uom_id: '',
                        notes: ''
                      }
                    ]
                  }
                } else {
                  // If no matching child state found, return empty ingredient object
                  return {
                    ingredient_id: '',
                    preparation_type_id: '',
                    preparation_type: '',
                    feed_cut_size: '',
                    feed_uom_id: '',
                    days_of_week: [],
                    remarks: '',
                    meal_type: [
                      {
                        meal_value_header: '',
                        quantity: '',
                        meal_value_uom_id: '',
                        notes: ''
                      }
                    ]
                  }
                }
              })
            })
          }}
        >
          <Typography
            sx={{
              mb: 1,
              color: '#37BD69',
              cursor: 'pointer',
              fontWeight: 500,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center'
            }}
            variant='h6'
          >
            <Icon icon='material-symbols:add' style={{ marginRight: '8px' }} /> ADD NEW MEAL
          </Typography>
        </Grid>
      </>
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

  const removeingClick = ingredientIdToRemove => {
    // Filter out the ingredient with the specified ID from childStateValue
    setChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(ingredient => ingredient.id !== ingredientIdToRemove)
      // Update setAllSelectedValues by removing the same object from allSelectedValues
      setAllSelectedValues(prevAllSelectedValues => {
        return prevAllSelectedValues.filter(ingredient => ingredient.id !== ingredientIdToRemove)
      })
      return filteredChildStateValue
    })
  }

  console.log(errors, 'nknn')
  console.log(uploadedImage, 'uploadedImage')
  console.log(formData, 'formdata')
  console.log(selectedCard, 'selectedCard')
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ boxShadow: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Box sx={{ mb: 1, px: 5, mt: 5, float: 'left' }}>
            <Typography variant='h6'>Basic Information</Typography>
          </Box>
          <ScrollToFieldError errors={errors} />
          <Grid container spacing={5} sx={{ px: 5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='diet_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Diet name *'
                      name='diet_name'
                      error={Boolean(errors.diet_name)}
                      onChange={onChange}
                    />
                  )}
                />
                {errors.diet_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.diet_name?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                {console.log(uomList, 'uomList')}
                <Controller
                  name='diet_type'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      value={uomList.find(option => option._id === value) || null}
                      disablePortal
                      id='diet_type'
                      options={uomList || []}
                      getOptionLabel={option => option.name}
                      isOptionEqualToValue={(option, value) => option?._id === value?._id}
                      onChange={(e, val) => {
                        if (val === null) {
                          return onChange('')
                        } else {
                          return onChange(val._id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Diet Type *'
                          placeholder='Search & Select'
                          error={Boolean(errors.diet_type)}
                        />
                      )}
                    />
                  )}
                />

                {errors?.diet_type && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.diet_type?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {console.log(uploadedImage, 'uploadedImage')}
            <Grid item xs={6}>
              <CardContent sx={{ px: 0, paddingTop: 2 }}>
                <CustomFileUploaderSingle onImageUpload={handleImageUpload} uploadedImagenew={uploadedImage} />
              </CardContent>
            </Grid>

            <Grid item xs={12} sx={{ pt: 0, pb: 8 }}>
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
        </Card>

        {fieldsIngredients.map((field, index) => (
          <Card sx={{ mt: 7 }} key={field.id}>
            <CardHeader title={`Add Meal ${index + 1}`} />

            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <Controller
                      name={`add_meal[${index}].meal_name`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          type='text'
                          label='Meal name (Optional) '
                          name={`add_meal[${index}].meal_name`}
                          error={Boolean(errors.nutrional_value)}
                          onChange={onChange}
                          placeholder=''
                          onInput={e => {
                            if (e.target.value < 0) {
                              e.target.value = ''
                            }
                          }}
                        />
                      )}
                    />
                    {errors.nutrional_value && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.nutrional_value?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3.2}>
                  <FormControl fullWidth>
                    {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                    <Controller
                      name={`add_meal[${index}].meal_from_time`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          {console.log(value?.$d, 'vvv')}
                          <TimePicker label='Select time - from' value={value?.$d} onChange={onChange} />
                        </LocalizationProvider>
                      )}
                    />

                    {errors?.nutrional_uom_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.nutrional_uom_id?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <Controller
                      name={`add_meal[${index}].meal_to_time`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          {console.log(toValue?.$d, 'value')}
                          <TimePicker label='Select time - to' value={value?.$d} onChange={onChange} />
                        </LocalizationProvider>
                      )}
                    />
                    {errors.kcal && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.kcal?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Recipes</Typography>
                </Box>

                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {recipes.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Recipe'
                            ? 2.2
                            : ingredient.label === 'Ingredients'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5 }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                    <Icon style={{ position: 'relative', left: '1%' }} icon='iconoir:cancel' />
                  </Grid>
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Ingredients</Typography>
                </Box>

                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {ingredients.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Ingredient'
                            ? 2.2
                            : ingredient.label === 'Prep types'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {allSelectedValues.length > 0 ? (
                    allSelectedValues.map(all => {
                      const matchingField = all.valueid === field.id
                      console.log(matchingField, 'matchingField')
                      if (matchingField) {
                        return (
                          <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }}>
                            <Grid item xs={12} sm={0.5}>
                              <Typography>1</Typography>
                            </Grid>
                            <Grid item xs={12} sm={2.2}>
                              <Typography>{all.name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                              <Typography>5</Typography>
                            </Grid>
                            <Grid item xs={12} sm={3.7}>
                              <Grid container spacing={7} sx={{ pl: 2 }}>
                                <Grid item>
                                  <Typography>M</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>T</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>W</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>T</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>F</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>S</Typography>
                                </Grid>
                                <Grid item>
                                  <Typography>S</Typography>
                                </Grid>
                              </Grid>
                            </Grid>
                            <Grid item xs={12} sm={3.7}>
                              <Grid sx={{ pl: 7 }}>
                                <Typography>5</Typography>
                              </Grid>
                            </Grid>
                            <Icon
                              onClick={() => removeingClick(all.id)}
                              style={{ position: 'relative', left: '1%' }}
                              icon='iconoir:cancel'
                            />
                          </Grid>
                        )
                      }
                    })
                  ) : (
                    <Typography sx={{ pt: 4, pb: 4, textAlign: 'center', fontWeight: 500, width: '100%' }}>
                      No Records to show
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Ingredients with choice</Typography>
                </Box>
                {console.log(fieldsIngredients, 'fieldsIngredients')}
                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {ingredients.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Ingredient'
                            ? 2.2
                            : ingredient.label === 'Prep types'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>

                    <Grid
                      container
                      sx={{ background: '#00afd633', padding: '0px 0px 15px 15px', borderRadius: '8px', mt: 3 }}
                    >
                      {console.log(selectedCard, 'selectedCard')}
                      {selectedCard?.map(all => {
                        return (
                          <Grid item>
                            <Card sx={{ width: '280px', height: '90px', mr: 4, boxShadow: 'none', mt: 3 }}>
                              <CardContent
                                sx={{
                                  gap: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '14px'
                                }}
                              >
                                <Avatar
                                  variant='square'
                                  alt='Medicine Image'
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    mr: 1,
                                    background: '#E8F4F2',
                                    padding: '2px',
                                    borderRadius: '4px'
                                  }}
                                  src={all.image}
                                >
                                  {null ?? <Icon icon='healthicons:fruits-outline' />}
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <span>{all.name}</span>
                                  <span style={{ color: '#7A8684', fontSize: 13 }}>{'ING' + all.id}</span>

                                  <span style={{ color: '#7A8684', fontSize: 13 }}>{all.feedType}</span>
                                </Box>
                                <Icon
                                  onClick={() => removeCancelIcon(all)}
                                  style={{ position: 'relative', left: '28%' }}
                                  icon='iconoir:cancel'
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        )
                      })}

                      <Grid item>
                        <Card sx={{ width: '100px', height: '90px', mr: 4, boxShadow: 'none', mt: 3, padding: 3 }}>
                          <CardContent
                            sx={{
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: 2
                            }}
                            onClick={handleAddIngerdientChoice}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Icon
                                style={{ marginLeft: '14px', color: '#00D6C9', fontWeight: 600 }}
                                icon='material-symbols:add'
                              />

                              <span style={{ marginLeft: '12px', color: '#00D6C9', fontWeight: 500 }}>Add</span>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5 }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Grid sx={{ pb: 12 }}>
                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Icon icon='material-symbols:add' />
                  ADD RECIPE
                </Typography>
                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    ml: 12,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onClick={() => handleAddIngerdient(field, index)}
                >
                  <Icon icon='material-symbols:add' />
                  ADD INGREDIENT
                </Typography>

                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    ml: 12,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onClick={() => handleAddIngerdientChoice('add')}
                >
                  <Icon icon='material-symbols:add' />
                  ADD INGREDIENT WITH CHOICE
                </Typography>
              </Grid>

              <Divider sx={{ mb: 4, pb: 1, mt: 6, width: '98%' }} />

              <Grid>
                <Typography variant='h6'>Add Notes</Typography>
                <Grid item xs={12} sx={{ pt: 5 }}>
                  <Controller
                    name='desc'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        multiline
                        fullWidth
                        value={value}
                        label='Enter Notes '
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
              {fieldsIngredients.length - 1 === index && index > 0 ? <Grid>{removeIngredientButton(index)}</Grid> : ''}
              <Grid>{handleAddRemoveingredient(fieldsIngredients, index)}</Grid>
            </CardContent>
          </Card>
        ))}

        <Card sx={{ mt: 8 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 7, mr: 6 }}>
              <Button
                color='secondary'
                variant='outlined'
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
                onClick={cancelBack}
              >
                Cancel
              </Button>
              <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
                Next
              </Button>
            </Box>
          </Grid>
        </Card>
        <AddIngredientswithChoice open={OpenIngredientchoice} handleSidebarClose={handleSidebarClose} />
        <AddIngredients
          open={openIngredient}
          handleSidebarClose={handleSidebarClose}
          onChange={handleChildStateChange}
          onRemove={removeingClick}
          childStateValue={childStateValue}
          checkid={checkid}
          allSelectedValues={allSelectedValues}
          setAllSelectedValues={setAllSelectedValues}
        />
      </form>
    </>
  )
}

export default StepBasicDetails
