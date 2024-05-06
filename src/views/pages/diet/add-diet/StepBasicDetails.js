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
import RecipeList from 'src/components/diet/RecipeList'

const defaultValues = {
  diet_name: '',
  diet_type: '',
  diet_type_id: '',
  diet_type_child: '',
  diet_image: '',
  desc: '',
  meal_data: [
    {
      newid: 'meal',
      meal_name: '',
      meal_from_time: '',
      meal_to_time: '',
      notes: '',
      recipe: [],
      ingredient: [],
      ingredientwithchoice: []
    }
  ]
}

const schema = yup.object().shape({
  diet_name: yup.string().required('Diet name is required'),
  diet_type: yup.string().required('Diet type is required'),
  meal_data: yup.array().of(
    yup.object().shape({
      meal_name: yup.string().required('Meal name is required'),
      meal_from_time: yup.string().required('Meal from time is required'),
      meal_to_time: yup.string().required('Meal to time is required'),
      notes: yup.string(),
      recipe: yup.array(), // Validation for 'recipe' array, if needed
      ingredient: yup.array() // Validation for 'ingredient' array, if needed
    })
  )
})

const StepBasicDetails = ({
  handleNext,
  formData,
  uomList,
  popperPlacement,
  selectedCard,
  setSelectedCard,
  setSelectedCardRecipe,
  selectedCardRecipe
}) => {
  // ** States
  const [uploadedImage, setUploadedImage] = useState(null)
  const [openIngredient, setOpenIngredient] = useState(false)
  const [toValue, setToValue] = useState(null)
  const [OpenIngredientchoice, setOpenIngredientchoice] = useState(false)
  const [childStateValue, setChildStateValue] = useState([])
  const [allSelectedValues, setAllSelectedValues] = useState([])
  const [childRecipeStateValue, setRecipeChildStateValue] = useState([])
  const [allRecipeSelectedValues, setAllRecipeSelectedValues] = useState([])
  const [allIngredientchoiceSelectedValues, setAllIngredientchoiceSelectedValues] = useState([])
  const [childIngredeintchoiceStateValue, setIngredientchoiceChildStateValue] = useState([])
  const [finalvalue, setfinalvalue] = useState([])
  const [finalvaluerecipe, setfinalrecipevalue] = useState([])
  const [checkid, setcheckid] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [recipeList, setRecipeList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
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
    formState: { errors },
    trigger,
    setValue: setFormValue
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
    name: 'meal_data'
  })

  const handleImageUpload = imageData => {
    setUploadedImage(imageData)
  }

  const handleChildStateChange = value => {
    console.log(value, 'value')
    console.log(fieldsIngredients, 'fieldsIngredients')
    setChildStateValue(value)

    // Remove duplicates from the new value based on id and valueid
    const uniqueValues = value.filter(
      (val, index, self) =>
        index === self.findIndex(v => v.ingredient_id === val.ingredient_id && v.valueid === val.valueid)
    )
    setAllSelectedValues(prevState => {
      // Filter out duplicates from the previous state
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal => uniqueVal.ingredient_id === prevVal?.ingredient_id && uniqueVal.valueid === prevVal?.valueid
          )
      )

      // Combine unique values from the new value with filtered previous state
      const updatedValues = [...filteredPrevState, ...uniqueValues]
      console.log(fieldsIngredients)
      console.log(updatedValues)

      // Update the fieldsIngredients with the new values
      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.ingredient = updatedValues.filter(up => up?.valueid === field.newid)
      }

      // Return the updated values to setAllSelectedValues
      return updatedValues
    })

    setfinalvalue(fieldsIngredients)
    console.log(fieldsIngredients, 'fieldsIngredients')
  }

  const handleRecipeStateChange = value => {
    console.log(value, 'card')
    console.log(fieldsIngredients, 'fieldsIngredients')
    setRecipeChildStateValue(value)

    // Remove duplicates from the new value based on id and valueid
    const uniqueValues = value.filter(
      (val, index, self) => index === self.findIndex(v => v.recipe_id === val.recipe_id && v.valueid === val.valueid)
    )
    console.log(uniqueValues, 'uniqueValues')
    setAllRecipeSelectedValues(prevState => {
      // Filter out duplicates from the previous state
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal => uniqueVal.recipe_id === prevVal?.recipe_id && uniqueVal.valueid === prevVal?.valueid
          )
      )

      // Combine unique values from the new value with filtered previous state
      const updatedValues = [...filteredPrevState, ...uniqueValues]
      console.log(fieldsIngredients)
      console.log(updatedValues)

      // Update the fieldsIngredients with the new values
      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.recipe = updatedValues.filter(up => up?.valueid === field.newid)
      }

      // Return the updated values to setAllSelectedValues
      return updatedValues
    })

    setfinalrecipevalue(fieldsIngredients)
    console.log(fieldsIngredients, 'fieldsIngredients')
  }

  const handleIngredientchoiceStateChange = value => {
    console.log(value, 'card')
    console.log(fieldsIngredients, 'fieldsIngredients')
    setIngredientchoiceChildStateValue(value)

    // Remove duplicates from the new value based on id and valueid
    const uniqueValues = value.filter(
      (val, index, self) => index === self.findIndex(v => v.id === val.id && v.valueid === val.valueid)
    )
    console.log(uniqueValues, 'uniqueValues')
    setAllIngredientchoiceSelectedValues(prevState => {
      // Filter out duplicates from the previous state
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(uniqueVal => uniqueVal.id === prevVal?.id && uniqueVal.valueid === prevVal?.valueid)
      )

      // Combine unique values from the new value with filtered previous state
      const updatedValues = [...filteredPrevState, ...uniqueValues]
      console.log(fieldsIngredients)
      console.log(updatedValues, 'updatedValues')

      // Update the fieldsIngredients with the new values
      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.ingredientwithchoice = updatedValues.filter(up => up?.valueid === field.newid)
      }

      // Return the updated values to setAllSelectedValues
      return updatedValues
    })

    setfinalvalue(fieldsIngredients)
    console.log(fieldsIngredients, 'fieldsIngredients')
  }

  useEffect(() => {
    if (formData) {
      setUploadedImage(formData.diet_image)
      // Flatten the array of arrays into a single array
      const flattenedIngredients = formData.meal_data?.flatMap(all => all.ingredient)
      setAllSelectedValues(flattenedIngredients)

      const flattenedRecipes = formData.meal_data?.flatMap(all => all.recipe)
      setAllRecipeSelectedValues(flattenedRecipes)

      const flattenedIngchoice = formData.meal_data?.flatMap(all => all.ingredientwithchoice)
      setAllIngredientchoiceSelectedValues(flattenedIngchoice)
    }
  }, [formData])

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  useEffect(() => {
    // Filter allSelectedValues based on checkid
    if (checkid) {
      const filteredValues = allSelectedValues.filter(value => value?.valueid === checkid)
      // Update childStateValue with the filtered values
      setChildStateValue(filteredValues)

      const filteredValuesing = allIngredientchoiceSelectedValues.filter(value => value?.valueid === checkid)
      // Update childStateValue with the filtered values
      setIngredientchoiceChildStateValue(filteredValuesing)
    }
  }, [checkid, allSelectedValues, allIngredientchoiceSelectedValues, formData])

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

  const handleAddIngerdientChoice = (val, index) => {
    setOpenIngredientchoice(true)
    setcheckid(val.newid)

    // Update childStateValue with objects having matching valueid
    setIngredientchoiceChildStateValue(prevState => {
      const newState = prevState.filter(item => item.valueid === val.id)
      return newState
    })
  }

  const addEventSidebarOpen = (val, index) => {
    console.log(val, 'val')
    console.log(index, 'index')
    setOpenDrawer(true)
    setSelectedCardRecipe([])
    setcheckid(val.newid)
  }

  const handleSidebarCloseRecipe = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
  }

  const handleAddIngerdient = (val, index) => {
    console.log(val, 'raghu')
    console.log(index, 'ppp')
    setOpenIngredient(true)
    setcheckid(val.newid)

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

  // const onSubmit = async data => {
  //   console.log(data, 'data')
  //   console.log(fieldsIngredients, 'raaa')
  //   window.scrollTo(0, 0)
  //   // Clear any existing errors
  //   Object.keys(defaultValues).forEach(field => {
  //     clearErrors(field)
  //   })

  //   try {
  //     await schema.validate(data, { abortEarly: false })
  //     const imageData = await handleImageUpload()
  //     console.log(imageData, 'imageData')

  //     // Check for empty ingredient or recipe arrays
  //     const emptyIndexes = []
  //     fieldsIngredients.forEach((item, index) => {
  //       if (!item.ingredient || item.ingredient.length === 0 || !item.recipe || item.recipe.length === 0) {
  //         emptyIndexes.push(index)
  //       }
  //     })

  //     if (emptyIndexes.length > 0) {
  //       // Adjust the indexes by adding 1 before displaying them in the alert
  //       const adjustedIndexes = emptyIndexes.map(index => index + 1)
  //       // Trigger alert with the adjusted indexes of objects with empty ingredient or recipe arrays
  //       alert(`Objects at indexes ${adjustedIndexes.join(', ')} have empty ingredient or recipe arrays.`)
  //       return
  //     }

  //     // Update the meal_data array with ingredients from finalvalue
  //     const updatedAddMeals = data.meal_data.map((meal, index) => {
  //       // Check if finalvalue has corresponding index
  //       if (finalvalue[index]) {
  //         return {
  //           ...meal,
  //           ingredient: finalvalue[index].ingredient,
  //           recipe: finalvalue[index].recipe
  //         }
  //       }
  //       return meal
  //     })

  //     // Merge the image data with other form data
  //     const formDataWithImage = {
  //       ...data,
  //       diet_image: uploadedImage,
  //       meal_data: updatedAddMeals
  //     }

  //     handleNext(formDataWithImage)
  //     console.log(formDataWithImage, 'data')
  //   } catch (validationErrors) {
  //     alert('hi')
  //     validationErrors.inner?.forEach(error => {
  //       setError(error.path, { message: error.message })
  //     })
  //   }
  // }

  const onSubmit = async data => {
    console.log(data, 'data')
    console.log(fieldsIngredients, 'raaa')
    window.scrollTo(0, 0)
    // Clear any existing errors
    // Object.keys(defaultValues).forEach(field => {
    //   clearErrors(field)
    // })

    try {
      await schema.validate(data, { abortEarly: false })
      const imageData = await handleImageUpload()
      console.log(imageData, 'imageData')

      // Update the meal_data array with ingredients from finalvalue
      const updatedAddMeals = data.meal_data.map((meal, index) => {
        // Check if finalvalue has corresponding index
        if (finalvalue[index]) {
          return {
            ...meal,
            ingredient: finalvalue[index].ingredient
          }
        }
        return meal
      })

      // Update the meal_data array with recipes from finalrecipevalue
      const updatedAddMealsWithRecipes = updatedAddMeals.map((meal, index) => {
        // Check if finalrecipevalue has corresponding index
        if (finalvaluerecipe[index]) {
          return {
            ...meal,
            recipe: finalvaluerecipe[index].recipe
          }
        }
        return meal
      })

      // Merge the updatedAddMeals and updatedAddMealsWithRecipes arrays
      const mergedAddMeals = updatedAddMealsWithRecipes.map((meal, index) => ({
        ...meal,
        ingredient: updatedAddMeals[index].ingredient
      }))

      // Merge the image data with other form data
      const formDataWithImage = {
        ...data,
        diet_image: uploadedImage,
        meal_data: mergedAddMeals
      }

      handleNext(formDataWithImage)
      console.log(formDataWithImage, 'data')
    } catch (validationErrors) {
      alert('hi')
      validationErrors.inner?.forEach(error => {
        setError(error.path, { message: error.message })
      })
    }
  }

  const cancelBack = () => {
    Router.push('/diet/recipe/')
  }

  const addIngredientsButton = () => {
    console.log(childStateValue, 'childStateValue')
    console.log(finalvalue, 'finalvalue')
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
              newid: `meal${fieldsIngredients.length}`,
              meal_name: '',
              meal_from_time: '',
              meal_to_time: '',
              notes: ''
              //ingredient: finalvalue.map(all => all.ingredient)
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
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '20px' }}
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
      return <> {/* <span>{removeIngredientButton(index)}</span>{' '} */}</>
    }
  }

  // const removeingClick = (ingredientIdToRemove,val) => {
  //   setChildStateValue(prevSelectedCard => {
  //     const filteredChildStateValue = prevSelectedCard.filter(
  //       ingredient => ingredient.ingredient_id !== ingredientIdToRemove
  //     )
  //     setAllSelectedValues(prevAllSelectedValues => {
  //       return prevAllSelectedValues.filter(ingredient => ingredient.ingredient_id !== ingredientIdToRemove)
  //     })

  //     // Update fieldsIngredients by filtering out ingredients based on ingredientIdToRemove
  //     const updatedFieldsIngredients = fieldsIngredients.map(field => {
  //       field.ingredient = field.ingredient.filter(ing => ing.ingredient_id !== ingredientIdToRemove)
  //       return field
  //     })

  //     // Set the final value using setfinalvalue
  //     setfinalvalue(updatedFieldsIngredients)

  //     return filteredChildStateValue
  //   })
  // }

  const removeingClick = (ingredientIdToRemove, val) => {
    setChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(
        ingredient => ingredient.ingredient_id !== ingredientIdToRemove
      )

      setAllSelectedValues(prevAllSelectedValues => {
        // Filter out objects based on conditions
        return prevAllSelectedValues.filter(ingredient => {
          return !(ingredient.valueid === val && ingredient.ingredient_id === ingredientIdToRemove)
        })
      })

      // Update fieldsIngredients by filtering out ingredients based on ingredientIdToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        field.ingredient = field.ingredient.filter(ing => ing.ingredient_id !== ingredientIdToRemove)
        return field
      })

      // Set the final value using setfinalvalue
      setfinalvalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClickRecipe = recipeIdToRemove => {
    setRecipeChildStateValue(prevSelectedCard => {
      // console.log(prevSelectedCard, 'prevSelectedCard')
      const filteredChildStateValue = prevSelectedCard.filter(recipe => recipe.recipe_id !== recipeIdToRemove)
      setAllRecipeSelectedValues(prevAllSelectedValues => {
        return prevAllSelectedValues.filter(recipe => recipe.recipe_id !== recipeIdToRemove)
      })

      // Update fieldsIngredients by filtering out ingredients based on recipeIdToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        field.recipe = field.recipe?.filter(ing => ing.recipe_id !== recipeIdToRemove)
        return field
      })

      // Set the final value using setfinalrecipevalue
      setfinalrecipevalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

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
                  name='diet_type_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => {
                    console.log(value, 'value')
                    return (
                      <Autocomplete
                        value={uomList.find(option => option.id === value) || null}
                        disablePortal
                        id='diet_type_id'
                        options={uomList || []}
                        getOptionLabel={option => option.diet_type_name}
                        isOptionEqualToValue={(option, value) => option?.id === value}
                        onChange={(e, val) => {
                          console.log(val, 'val')
                          if (val === null) {
                            setFormValue('diet_type_id', '') // Clear the diet_type_id value
                            setFormValue('diet_type', '') // Clear the diet_type value
                            setFormValue('diet_type_child', '')
                          } else {
                            setFormValue('diet_type_id', val.id) // Set the diet_type_id value
                            setFormValue('diet_type', val.diet_type_name) // Set the diet_type value
                            setFormValue('diet_type_child', val.child)
                            trigger('diet_type')
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
                    )
                  }}
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
            <CardHeader title={`Add Meal ${index + 1}`} sx={{ float: 'left', width: '50%' }} />
            {(fieldsIngredients.length - 1 === index && index > 0) ||
            (!index <= 0 && !fieldsIngredients.length - 1 <= 0) ? (
              <Grid sx={{ float: 'right', width: '40%', marginRight: '24px' }}>{removeIngredientButton(index)}</Grid>
            ) : (
              ''
            )}
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <Controller
                      name={`meal_data[${index}].meal_name`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          type='text'
                          label='Meal name (Optional) '
                          name={`meal_data[${index}].meal_name`}
                          error={
                            errors.meal_data && errors.meal_data[index] && errors.meal_data[index].meal_name?.message
                              ? true
                              : false
                          }
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
                    {errors.meal_data && errors.meal_data[index] && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors.meal_data[index].meal_name?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3.2}>
                  <FormControl fullWidth>
                    <Controller
                      name={`meal_data[${index}].meal_from_time`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          {console.log(value, 'vvv')}
                          <TimePicker
                            label='Select time - from'
                            onChange={onChange}
                            defaultValue={value ? dayjs(value) : null}
                          />
                        </LocalizationProvider>
                      )}
                    />

                    {errors.meal_data && errors.meal_data[index] && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors.meal_data[index].meal_from_time?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <Controller
                      name={`meal_data[${index}].meal_to_time`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          {console.log(toValue?.$d, 'value')}
                          <TimePicker
                            label='Select time - to'
                            onChange={onChange}
                            defaultValue={value ? dayjs(value) : null}
                          />
                        </LocalizationProvider>
                      )}
                    />
                    {errors.meal_data && errors.meal_data[index] && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors.meal_data[index].meal_to_time?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              {allRecipeSelectedValues?.length > 0 &&
              allRecipeSelectedValues.some(value => value?.valueid === field.newid) ? (
                <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                  <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                    <Typography variant='h6'>Recipes</Typography>
                  </Box>

                  <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                    <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                      {recipes.map((recipe, index) => (
                        <Grid
                          item
                          xs={12}
                          sm={
                            recipe.label === 'No'
                              ? 0.5
                              : recipe.label === 'Recipe'
                              ? 2.2
                              : recipe.label === 'Ingredients'
                              ? 1.5
                              : 3.7
                          }
                          key={index}
                          sx={{ py: 4, px: 2, textAlign: 'center' }}
                        >
                          <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>{recipe.label} </div>
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>

                    {allRecipeSelectedValues?.length > 0 ? (
                      allRecipeSelectedValues.map((all, index) => {
                        const matchingField = all?.valueid === field.newid
                        console.log(matchingField, 'matchingField')
                        console.log(index, 'index')
                        if (matchingField) {
                          return (
                            <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }} key={index}>
                              <Grid item xs={12} sm={0.5}>
                                <Typography>1</Typography>
                              </Grid>
                              <Grid item xs={12} sm={2.2}>
                                <Typography>{all.recipe_name}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                                <Typography>{all.preparation_type}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={3.7}>
                                <Grid container spacing={1} sx={{ pl: 2 }}>
                                  {days.map((day, index) => (
                                    <Grid item key={index}>
                                      <Typography
                                        sx={{
                                          color: all.days_of_week?.includes(index + 1) ? '#1F415B' : '#839D8D',
                                          marginRight: 3
                                        }}
                                      >
                                        {day}
                                      </Typography>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Grid>
                              <Grid item xs={12} sm={3.7}>
                                <Grid sx={{ pl: 7 }}>
                                  <Typography>{all.remarks ? all.remarks : '-'}</Typography>
                                </Grid>
                              </Grid>
                              <Icon
                                onClick={() => removeingClickRecipe(all.recipe_id)}
                                style={{ position: 'relative', left: '1%' }}
                                icon='iconoir:cancel'
                              />
                            </Grid>
                          )
                        }
                        return null
                      })
                    ) : (
                      <Typography sx={{ pt: 4, pb: 4, textAlign: 'center', fontWeight: 500, width: '100%' }}>
                        No Records to show
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              ) : null}

              {allSelectedValues?.length > 0 && allSelectedValues.some(value => value.valueid === field.newid) ? (
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
                      allSelectedValues.map((all, index) => {
                        const matchingField = all?.valueid === field.newid
                        console.log(matchingField, 'matchingField')
                        console.log(index, 'index')
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
                                <Typography>{all.preparation_type}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={3.7}>
                                <Grid container spacing={1} sx={{ pl: 2 }}>
                                  {days.map((day, index) => (
                                    <Grid item key={day}>
                                      <Typography
                                        sx={{
                                          color: all.days_of_week?.includes(index + 1) ? '#1F415B' : '#839D8D',
                                          marginRight: 3
                                        }}
                                      >
                                        {day}
                                      </Typography>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Grid>
                              <Grid item xs={12} sm={3.7}>
                                <Grid sx={{ pl: 7 }}>
                                  <Typography>{all.remarks ? all.remarks : '-'}</Typography>
                                </Grid>
                              </Grid>
                              <Icon
                                onClick={() => removeingClick(all.ingredient_id, all.valueid)}
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
              ) : (
                ''
              )}

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
                  onClick={() => addEventSidebarOpen(field, index)}
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
                  onClick={() => handleAddIngerdientChoice(field, index)}
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
                    name={`meal_data[${index}].notes`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        multiline
                        fullWidth
                        value={value}
                        label='Enter Notes '
                        name={`meal_data[${index}].notes`}
                        error={Boolean(errors.desc)}
                        onChange={onChange}
                        id='textarea-outlined'
                        rows={5}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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
        <AddIngredientswithChoice
          open={OpenIngredientchoice}
          handleSidebarClose={handleSidebarClose}
          checkid={checkid}
          onChange={handleIngredientchoiceStateChange}
          allIngredientchoiceSelectedValues={allIngredientchoiceSelectedValues}
          setAllIngredientchoiceSelectedValues={setAllIngredientchoiceSelectedValues}
          formData={formData}
          childIngredeintchoiceStateValue={childIngredeintchoiceStateValue}
        />
        <AddIngredients
          open={openIngredient}
          handleSidebarClose={handleSidebarClose}
          onChange={handleChildStateChange}
          onRemove={removeingClick}
          childStateValue={childStateValue}
          checkid={checkid}
          allSelectedValues={allSelectedValues}
          setAllSelectedValues={setAllSelectedValues}
          formData={formData}
          setSelectedIngredient={setSelectedIngredient}
        />
        <RecipeList
          recipeList={recipeList}
          setSelectedCardRecipe={setSelectedCardRecipe}
          selectedCardRecipe={selectedCardRecipe}
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={handleSidebarCloseRecipe}
          submitLoader={submitLoader}
          checkid={checkid}
          onChange={handleRecipeStateChange}
          allRecipeSelectedValues={allRecipeSelectedValues}
          setAllRecipeSelectedValues={setAllRecipeSelectedValues}
          formData={formData}
          onRemove={removeingClickRecipe}
        />
      </form>
    </>
  )
}

export default StepBasicDetails
