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
import { Divider, CardContent, FormHelperText, Card, CardHeader, Avatar, Tooltip } from '@mui/material'
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
import toast from 'react-hot-toast'

// ** Custom Component Imports
import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import AddIngredientswithChoice from 'src/components/diet/AddIngredientswithchoice'
import AddIngredients from 'src/components/diet/AddIngredients'
import RecipeList from 'src/components/diet/RecipeList'

const defaultValues = {
  diet_name: '',
  diet_type_name: '',
  diet_type_id: '',
  child: '',
  diet_image: '',
  desc: '',
  remarks: '',
  meal_data: [
    {
      mealid: 'meal',
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

  //diet_type_name: yup.string().required('Diet type is required'),
  diet_type_id: yup.string().required('Diet type is required'),
  meal_data: yup.array().of(
    yup.object().shape({
      meal_name: yup.string().required('Meal name is required'),
      meal_from_time: yup.string().required('Meal from time is required'),
      meal_to_time: yup.string().required('Meal to time is required'),
      notes: yup.string(),
      recipe: yup.array(),
      ingredient: yup.array()
    })
  )
})

const StepBasicDetails = ({
  handleNext,
  formData,
  uomList,
  selectedCard,
  setSelectedCard,
  setSelectedCardRecipe,
  selectedCardRecipe,
  setUomprev,
  id,
  diettypechildvalues
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
  const [finalvalueingredientchoice, setfinalvalueingredientchoice] = useState([])
  const [checkid, setcheckid] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [recipeList, setRecipeList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [ingType, setingType] = useState('')
  const [ingredientChoiceIndex, setingredientChoiceIndex] = useState('')
  const router = useRouter()

  const recipes = [
    // { label: 'No' },
    { label: 'Recipe' },
    { label: 'Ingredients' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]

  const ingredients = [
    // { label: 'No' },
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
    setChildStateValue(value)

    const uniqueValues = value.filter(
      (val, index, self) =>
        index === self.findIndex(v => v.ingredient_id === val.ingredient_id && v.mealid === val.mealid)
    )
    setAllSelectedValues(prevState => {
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal => uniqueVal.ingredient_id === prevVal?.ingredient_id && uniqueVal.mealid === prevVal?.mealid
          )
      )
      const updatedValues = [...filteredPrevState, ...uniqueValues]

      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.ingredient = updatedValues.filter(up => up?.mealid === field.mealid)
      }

      return updatedValues
    })

    setfinalvalue(fieldsIngredients)
    console.log(fieldsIngredients, 'fieldsIngredients')
  }

  const handleRecipeStateChange = value => {
    setRecipeChildStateValue(value)
    const uniqueValues = value.filter(
      (val, index, self) => index === self.findIndex(v => v.recipe_id === val.recipe_id && v.mealid === val.mealid)
    )
    console.log(uniqueValues, 'uniqueValues')
    setAllRecipeSelectedValues(prevState => {
      // Filter out duplicates from the previous state
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal => uniqueVal.recipe_id === prevVal?.recipe_id && uniqueVal.mealid === prevVal?.mealid
          )
      )
      const updatedValues = [...filteredPrevState, ...uniqueValues]

      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.recipe = updatedValues.filter(up => up?.mealid === field.mealid)
      }

      // Return the updated values to setAllSelectedValues
      return updatedValues
    })

    setfinalrecipevalue(fieldsIngredients)
  }

  const handleIngredientchoiceStateChange = value => {
    setIngredientchoiceChildStateValue(value)

    setAllIngredientchoiceSelectedValues(value)

    for (let i = 0; i < fieldsIngredients.length; i++) {
      const field = fieldsIngredients[i]
      field.ingredientwithchoice = value.filter(up => up?.mealid === field.mealid)
    }
    setfinalvalueingredientchoice(fieldsIngredients)
    console.log(fieldsIngredients, 'fieldsIngredients')
  }

  function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  useEffect(() => {
    if (formData) {
      setUploadedImage(formData.diet_image)

      const flattenedIngredients = formData.meal_data?.flatMap(all =>
        all.ingredient?.map(ing => ({
          ...ing,
          ingredient_id: String(ing.ingredient_id) // Convert ingredient_id to string
        }))
      )
      setAllSelectedValues(flattenedIngredients)

      const flattenedRecipes = formData.meal_data?.flatMap(all =>
        all.recipe?.map(ing => ({
          ...ing,
          recipe_id: String(ing.recipe_id) // Convert recipe_id to string
        }))
      )
      setAllRecipeSelectedValues(flattenedRecipes)

      const flattenedIngchoice = formData.meal_data
        ?.flatMap(all => {
          return all?.ingredientwithchoice
            ?.map(ingChoice => {
              const updatedIngredientList = ingChoice.ingredientList
                .map(ingredient => ({
                  ...ingredient,
                  ingredient_id: String(ingredient.ingredient_id)
                }))
                .filter(ingredient => ingredient)

              return {
                ...ingChoice,
                ingredientList: updatedIngredientList
              }
            })
            .filter(ingChoice => ingChoice)
        })
        .filter(all => all)

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
      const filteredValues = allSelectedValues.filter(value => value?.mealid === checkid)

      setChildStateValue(filteredValues)

      const filteredValuesing = allIngredientchoiceSelectedValues.filter(value => value?.mealid === checkid)
      setIngredientchoiceChildStateValue(filteredValuesing)
    }
  }, [checkid, allSelectedValues, allIngredientchoiceSelectedValues, formData])

  const ScrollToFieldError = ({ errors }) => {
    useEffect(() => {
      if (!errors) return

      let firstErrorField = null

      for (const errorKey in errors) {
        const errorObject = errors[errorKey]

        if (errorObject?.ref?.name) {
          firstErrorField = errorObject.ref.name
          break
        }

        if (Array.isArray(errorObject)) {
          for (const error of errorObject) {
            console.log(error, 'error')
            if (error?.meal_name?.ref?.name || error?.meal_from_time?.ref?.name || error?.meal_to_time?.ref?.name) {
              firstErrorField =
                error?.meal_name?.ref?.name || error?.meal_from_time?.ref?.name || error?.meal_to_time?.ref?.name
              break
            }
          }
        }

        if (firstErrorField) break
      }

      console.log(firstErrorField, 'firstErrorField')

      if (firstErrorField) {
        const errorElement = document.querySelector(`input[name="${firstErrorField}"]`)
        console.log(errorElement, 'errorElement')

        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, [errors])

    return null
  }

  const handleAddIngerdientChoice = (val, index, type) => {
    console.log(val, 'val')
    console.log(index, 'index')
    setOpenIngredientchoice(true)
    setcheckid(val.mealid)
    setingType(type)
  }

  const handleAddIngerdientChoicewithindex = (val, index, type) => {
    console.log(val, 'val')
    console.log(index, 'index')
    setOpenIngredientchoice(true)
    setcheckid(val.mealid)
    setingType(type)
    setingredientChoiceIndex(index)

    setIngredientchoiceChildStateValue(prevState => {
      const newState = prevState.filter(item => item.mealid === val.id)

      return newState
    })
  }

  const addEventSidebarOpen = (val, index) => {
    console.log(val, 'val')
    console.log(index, 'index')
    setOpenDrawer(true)
    setSelectedCardRecipe([])
    setcheckid(val.mealid)
  }

  const handleSidebarCloseRecipe = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
  }

  const handleAddIngerdient = (val, index) => {
    setOpenIngredient(true)
    setcheckid(val.mealid)

    setChildStateValue(prevState => {
      const newState = prevState.filter(item => item.mealid === val.id)

      return newState
    })
  }

  const handleSidebarClose = () => {
    setOpenIngredient(false)
    setOpenIngredientchoice(false)
  }

  const onSubmit = async data => {
    window.scrollTo(0, 0)
    try {
      await schema.validate(data, { abortEarly: false })
      const imageData = await handleImageUpload()
      console.log(imageData, 'imageData')

      const updatedAddMeals = data.meal_data.map((meal, index) => {
        if (finalvalue[index]) {
          return {
            ...meal,
            ingredient: finalvalue[index].ingredient
          }
        }

        return meal
      })

      const updatedAddMealswithingChoice = updatedAddMeals.map((meal, index) => {
        if (finalvalueingredientchoice[index]) {
          return {
            ...meal,
            ingredientwithchoice: finalvalueingredientchoice[index].ingredientwithchoice
          }
        }

        return meal
      })

      const updatedAddMealsWithRecipes = updatedAddMealswithingChoice.map((meal, index) => {
        if (finalvaluerecipe[index]) {
          return {
            ...meal,
            recipe: finalvaluerecipe[index].recipe
          }
        }

        return meal
      })

      const mergedAddMeals = updatedAddMealsWithRecipes.map((meal, index) => ({
        ...meal,
        ingredient: updatedAddMeals[index].ingredient
      }))

      const formDataWithImage = {
        ...data,
        diet_image: uploadedImage,
        meal_data: mergedAddMeals
      }
      console.log(formDataWithImage, 'formDataWithImage')

      const invalidIndexes = formDataWithImage.meal_data.reduce((invalidIndexes, meal, index) => {
        if (
          (!meal.ingredient || meal.ingredient.length === 0) &&
          (!meal.recipe || meal.recipe.length === 0) &&
          (!meal.ingredientwithchoice || meal.ingredientwithchoice.length === 0)
        ) {
          invalidIndexes.push(index)
        }

        return invalidIndexes
      }, [])

      if (invalidIndexes.length > 0) {
        invalidIndexes.forEach(index => {
          toast.error(`Meal ${index + 1} must contain at least one of Ingredient, Recipe, or Ingredients with choice.`)
        })

        return
      }

      // Check for time overlap
      const lastOverlapIndex = checkForTimeOverlap(formDataWithImage.meal_data)
      console.log(lastOverlapIndex, 'lastOverlapIndex')
      if (lastOverlapIndex !== -1) {
        toast.error(`Meal ${lastOverlapIndex + 1} Start time cannot be later than end time.`)

        return
      } else {
        handleNext(formDataWithImage)
      }
      console.log(formDataWithImage, 'data')
    } catch (validationErrors) {
      validationErrors.inner?.forEach(error => {
        setError(error.path, { message: error.message })
      })
      toast.error('Submission failed. Please check the form for errors.')
    }
  }

  const checkForTimeOverlap = mealData => {
    let lastOverlapIndex = -1
    mealData.forEach((meal, index) => {
      const { meal_from_time, meal_to_time } = meal
      const fromTime = new Date(meal_from_time).getTime()
      const toTime = new Date(meal_to_time).getTime()

      // Check if meal_from_time is greater than or equal to meal_to_time
      if (fromTime >= toTime) {
        lastOverlapIndex = index

        return
      }

      //Check for overlap with other meals
      // for (let i = 0; i < mealData.length; i++) {
      //   if (i !== index) {
      //     const currentFromTime = new Date(mealData[i].meal_from_time).getTime()
      //     const currentToTime = new Date(mealData[i].meal_to_time).getTime()

      //     // Check for overlap
      //     if (
      //       (fromTime >= currentFromTime && fromTime < currentToTime) ||
      //       (toTime > currentFromTime && toTime <= currentToTime)
      //     ) {
      //       lastOverlapIndex = index
      //       break
      //     }
      //   }
      // }
    })

    return lastOverlapIndex
  }

  const cancelBack = () => {
    Router.push('/diet/diet/')
  }

  const addIngredientsButton = () => {
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
              mealid: `meal${fieldsIngredients.length}`,
              meal_name: `Meal ${fieldsIngredients.length + 1}`,
              meal_from_time: '',
              meal_to_time: '',
              notes: ''
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

  const removeingClick = (ingredientIdToRemove, val) => {
    console.log(ingredientIdToRemove, 'ingredientIdToRemove')
    setChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(
        ingredient => ingredient?.ingredient_id !== ingredientIdToRemove
      )

      setAllSelectedValues(prevAllSelectedValues => {
        // Filter out objects based on conditions
        return prevAllSelectedValues.filter(ingredient => {
          return !(ingredient?.mealid === val && ingredient?.ingredient_id === ingredientIdToRemove)
        })
      })

      // Update fieldsIngredients by filtering out ingredients based on ingredientIdToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        field.ingredient = field.ingredient?.filter(ing => String(ing.ingredient_id) !== ingredientIdToRemove)
        return field
      })
      console.log(fieldsIngredients, 'fieldsIngredients')
      console.log(updatedFieldsIngredients, 'updatedFieldsIngredients')
      // Set the final value using setfinalvalue
      setfinalvalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClicking = (indexToRemove, val) => {
    setingType('')
    setIngredientchoiceChildStateValue(prevSelectedCard => {
      console.log(prevSelectedCard, 'prevSelectedCard')

      // Filter out the entire ingredient object based on the index of prevSelectedCard
      const filteredChildStateValue = prevSelectedCard.filter((_, index) => index !== indexToRemove)

      setAllIngredientchoiceSelectedValues(prevAllSelectedValues => {
        const updatedAllSelectedValues = prevAllSelectedValues.filter((ingredient, index) => {
          return index !== indexToRemove || ingredient?.mealid !== val
        })

        return updatedAllSelectedValues
      })

      // Update fieldsIngredients by removing the ingredient based on the indexToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          field.ingredientwithchoice = field.ingredientwithchoice?.filter((_, ingIndex) => ingIndex !== indexToRemove)
        }

        return field
      })

      setfinalvalueingredientchoice(updatedFieldsIngredients)
      console.log(filteredChildStateValue, 'filteredChildStateValue')

      return filteredChildStateValue
    })
  }

  const removeingClickRecipe = (recipeIdToRemove, val) => {
    setRecipeChildStateValue(prevSelectedCard => {
      // console.log(prevSelectedCard, 'prevSelectedCard')
      const filteredChildStateValue = prevSelectedCard.filter(recipe => recipe.recipe_id !== recipeIdToRemove)

      setAllRecipeSelectedValues(prevAllSelectedValues => {
        // Filter out objects based on conditions
        return prevAllSelectedValues.filter(recipe => {
          return !(recipe?.mealid === val && recipe?.recipe_id === recipeIdToRemove)
        })
      })

      // Update fieldsIngredients by filtering out ingredients based on recipeIdToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        field.recipe = field.recipe?.filter(ing => String(ing.recipe_id) !== recipeIdToRemove)

        return field
      })

      // Set the final value using setfinalrecipevalue
      setfinalrecipevalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  // const removeingClickingwithChoice = (ingredientIdToRemove, val) => {
  //   alert('hi')
  //   setIngredientchoiceChildStateValue(prevSelectedCard => {
  //     console.log(prevSelectedCard, 'prevSelectedCard')

  //     const filteredChildStateValue = prevSelectedCard.filter(ingredient =>
  //       ingredient.ingredientList.some(ing => ing.ingredient_id !== ingredientIdToRemove)
  //     )

  //     setAllIngredientchoiceSelectedValues(prevAllSelectedValues => {
  //       // Filter out objects based on conditions
  //       console.log(prevAllSelectedValues, 'prevAllSelectedValues')

  //       return prevAllSelectedValues.map(ingredient => {
  //         if (ingredient.mealid === val) {
  //           ingredient.ingredientList = ingredient.ingredientList.filter(
  //             ing => ing.ingredient_id !== ingredientIdToRemove
  //           )
  //         }

  //         return ingredient
  //       })
  //     })

  //     // Update fieldsIngredients by filtering out ingredients based on ingredientIdToRemove
  //     const updatedFieldsIngredients = fieldsIngredients.map(field => {
  //       field.ingredient = field.ingredient?.map(ing => {
  //         if (ing.mealid === val) {
  //           ing.ingredientwithchoice = ing.ingredientwithchoice?.ingredientList?.filter(
  //             item => item.ingredient_id !== ingredientIdToRemove
  //           )
  //         }

  //         return ing
  //       })

  //       return field
  //     })

  //     // Set the final value using setfinalvalueingredientchoice
  //     setfinalvalueingredientchoice(updatedFieldsIngredients)

  //     return filteredChildStateValue
  //   })
  // }

  const removeingClickingwithChoice = (ingredientIdToRemove, val) => {
    setIngredientchoiceChildStateValue(prevSelectedCard => {
      console.log(prevSelectedCard, 'prevSelectedCard')

      const filteredChildStateValue = prevSelectedCard.filter(ingredient =>
        ingredient.ingredientList.some(ing => ing.ingredient_id !== ingredientIdToRemove)
      )

      setAllIngredientchoiceSelectedValues(prevAllSelectedValues => {
        // Filter out objects based on conditions
        console.log(prevAllSelectedValues, 'prevAllSelectedValues')

        const updatedAllSelectedValues = prevAllSelectedValues
          .map(ingredient => {
            if (ingredient?.mealid === val) {
              ingredient.ingredientList = ingredient.ingredientList.filter(
                ing => ing?.ingredient_id !== ingredientIdToRemove
              )
            }
            return ingredient
          })
          .filter(ingredient => ingredient.ingredientList.length > 0)

        return updatedAllSelectedValues
      })

      // Update fieldsIngredients by filtering out ingredients based on ingredientIdToRemove
      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        field.ingredientwithchoice = field.ingredientwithchoice
          ?.map(ing => {
            if (ing?.mealid === val) {
              ing.ingredientList = ing?.ingredientList?.filter(
                item => String(item.ingredient_id) !== ingredientIdToRemove
              )
            }
            return ing
          })
          .filter(ing => ing?.ingredientList && ing?.ingredientList.length > 0)

        return field
      })

      setfinalvalueingredientchoice(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

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
                        value={uomList?.find(option => option.id === value) || null}
                        // disablePortal
                        id='diet_type_id'
                        options={uomList || []}
                        getOptionLabel={option => option.diet_type_name}
                        isOptionEqualToValue={(option, value) => option?.id === value}
                        //disabled={id ? true : false}
                        onChange={(e, val) => {
                          console.log(val, 'val')
                          if (val === null) {
                            setFormValue('diet_type_id', '')
                            setFormValue('diet_type_name', '')
                            setFormValue('child', '')
                          } else {
                            setFormValue('diet_type_id', val.id)
                            setFormValue('diet_type_name', val.diet_type_name)
                            setFormValue('child', val.child)
                            trigger('diet_type_id')
                            deleteCookie('dietTypeChildValues')
                            deleteCookie('dietTypeChildVal')
                          }
                        }}
                        //sx={{ background: id ? '#80808021' : '' }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Diet Type *'
                            placeholder='Search & Select'
                            error={Boolean(errors.diet_type_id)}
                            name='diet_type_id'
                          />
                        )}
                      />
                    )
                  }}
                />

                {errors?.diet_type_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.diet_type_id?.message}</FormHelperText>
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
        </Card>

        {fieldsIngredients.map((field, index) => (
          <Card sx={{ mt: 7 }} key={field.id}>
            <CardHeader title={`Add Meal ${index + 1}`} sx={{ float: 'left', width: '50%' }} />
            {(fieldsIngredients.length - 1 === index && index > 0) ||
            (!index <= 0 && !fieldsIngredients.length - 1 <= 0) ? (
              <Grid sx={{ float: 'right', width: '4%', marginRight: '24px', cursor: 'pointer' }}>
                {removeIngredientButton(index)}
              </Grid>
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
                          label='Meal name'
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
                          <TimePicker
                            label='Select time - from'
                            onChange={onChange}
                            name={`meal_data[${index}].meal_from_time`}
                            defaultValue={value ? dayjs(value) : null}
                            sx={{
                              '& fieldset': {
                                borderColor:
                                  errors.meal_data && errors.meal_data[index] && errors.meal_data[index]?.meal_from_time
                                    ? 'red'
                                    : undefined // Change border color to red if there's an error
                              }
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Diet Type *'
                                placeholder='Search & Select'
                                error={Boolean(errors.meal_data[index].meal_from_time?.message)}
                                name={`meal_data[${index}].meal_from_time`}
                                sx={{
                                  '& fieldset': {
                                    borderColor: errors.meal_data?.[index]?.meal_from_time ? 'red' : undefined // Change border color to red if there's an error
                                  }
                                }}
                              />
                            )}
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
              allRecipeSelectedValues.some(value => value?.mealid === field.mealid) ? (
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
                        const matchingField = all?.mealid === field.mealid

                        if (matchingField) {
                          return (
                            <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }} key={index}>
                              <Grid item xs={12} sm={0.5}>
                                <Avatar
                                  variant='square'
                                  alt='Diet Image'
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    mr: 4,
                                    background: '#E8F4F2',
                                    padding: '8px',
                                    borderRadius: '50%'
                                  }}
                                  src={all.recipe_image ? all.recipe_image : '/icons/icon_diet_fill.png'}
                                ></Avatar>
                              </Grid>
                              <Grid item xs={12} sm={2.2}>
                                <Typography sx={{ pl: 3 }}>{all?.recipe_name}</Typography>
                                <Typography sx={{ color: '#7A8684', fontSize: '12px', pl: 3 }}>
                                  {'REP' + all?.recipe_id}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={1.0} sx={{ pl: 2 }}>
                                <Typography>{all?.ingredients_count}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={3.7}>
                                <Grid container spacing={1} sx={{ pl: 2 }}>
                                  {days.map((day, index) => (
                                    <Grid item key={index}>
                                      <Typography
                                        sx={{
                                          color: all?.days_of_week?.includes(index + 1) ? '#1F415B' : '#839D8D',
                                          marginRight: 4
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
                                  <Typography className='w_280'>
                                    <Tooltip title={all?.remarks} arrow placement='bottom'>
                                      <span className='text_overflow_moduled'>{all?.remarks ? all.remarks : '-'}</span>
                                    </Tooltip>
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Icon
                                onClick={() => removeingClickRecipe(all.recipe_id, all.mealid)}
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

              {allSelectedValues?.length > 0 && allSelectedValues.some(value => value?.mealid === field.mealid) ? (
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
                        const matchingField = all?.mealid === field.mealid

                        if (matchingField) {
                          return (
                            <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }} key={index}>
                              <Grid item xs={12} sm={0.5}>
                                <Avatar
                                  variant='square'
                                  alt='Diet Image'
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    mr: 4,
                                    background: '#E8F4F2',
                                    padding: '8px',
                                    borderRadius: '50%'
                                  }}
                                  src={all.ingredient_image ? all.ingredient_image : '/icons/icon_diet_fill.png'}
                                ></Avatar>
                              </Grid>
                              <Grid item xs={12} sm={1.8}>
                                <Typography sx={{ pl: 3 }}>{all.ingredient_name}</Typography>
                                <Typography sx={{ color: '#7A8684', fontSize: '12px', pl: 3 }}>
                                  {'ING' + all?.ingredient_id}
                                </Typography>
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
                                          marginRight: 4
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
                                  <Typography className='w_280'>
                                    <Tooltip title={all?.remarks} arrow placement='bottom'>
                                      <span className='text_overflow_moduled'>{all?.remarks ? all.remarks : '-'}</span>
                                    </Tooltip>
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Icon
                                onClick={() => removeingClick(all.ingredient_id, all.mealid)}
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

              {allIngredientchoiceSelectedValues?.length > 0 &&
              allIngredientchoiceSelectedValues.some(value => value?.mealid === field.mealid) ? (
                <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                  <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                    <Typography variant='h6'>Ingredients with choice</Typography>
                  </Box>

                  <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                    <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                      {ingredients.map((ingredient, index) => (
                        <Grid
                          item
                          xs={12}
                          sm={
                            ingredient.label === 'Ingredient'
                              ? 2.2
                              : ingredient.label === 'Prep types'
                              ? 2.3
                              : ingredient.label === 'Feeding days'
                              ? 2.7
                              : 3.9
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
                    {allIngredientchoiceSelectedValues.length > 0 ? (
                      allIngredientchoiceSelectedValues.map((all, index) => {
                        const matchingField = all?.mealid === field.mealid

                        if (matchingField) {
                          return (
                            <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }} key={index}>
                              {/* <Grid item xs={12} sm={0.5}>
                                <Typography>1</Typography>
                              </Grid> */}
                              <Grid item xs={12} sm={2.2}>
                                <Typography>
                                  Offer Minimum{' '}
                                  <span style={{ color: '#37BD69', fontSize: '17px', fontWeight: 600 }}>
                                    {all.no_of_component_required}
                                  </span>{' '}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={2.3} sx={{ pl: 2 }}>
                                <Typography className='w_155'>
                                  <Tooltip
                                    title={all?.ingredientList.map(all => all.preparation_type).join(', ')}
                                    arrow
                                    placement='bottom'
                                    className='text_overflow_moduled'
                                  >
                                    <span>{all?.ingredientList.map(all => all.preparation_type).join(', ')}</span>
                                  </Tooltip>
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={2.7}>
                                <Grid container spacing={1} sx={{ pl: 2 }}>
                                  {days.map((day, index) => (
                                    <Grid item key={day}>
                                      <Typography
                                        sx={{
                                          color: all?.days_of_week?.includes(index + 1) ? '#1F415B' : '#839D8D',
                                          marginRight: 4
                                        }}
                                      >
                                        {day}
                                      </Typography>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Grid>
                              <Grid item xs={12} sm={4.5}>
                                <Grid sx={{ pl: 7 }}>
                                  <Typography className='w_280'>
                                    <Tooltip title={all?.remarks} arrow placement='bottom'>
                                      <span className='text_overflow_moduled'>{all?.remarks ? all.remarks : '-'}</span>
                                    </Tooltip>
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Grid item xs={12} sm={0.3}>
                                <Icon
                                  onClick={() => removeingClicking(index, all.mealid)}
                                  style={{ position: 'relative', left: '1%' }}
                                  icon='iconoir:cancel'
                                />
                              </Grid>

                              <Grid
                                container
                                sx={{
                                  background: '#00afd633',
                                  padding: '0px 0px 15px 15px',
                                  borderRadius: '8px',
                                  mt: 3
                                }}
                              >
                                {all?.ingredientList?.map((all, index) => {
                                  console.log(all, 'all')

                                  return (
                                    <Grid item key={index}>
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
                                            alt='Diet Image'
                                            sx={{
                                              width: 40,
                                              height: 40,
                                              mr: 4,
                                              background: '#E8F4F2',
                                              padding: '8px',
                                              borderRadius: '50%'
                                            }}
                                            src={
                                              all.ingredient_image ? all.ingredient_image : '/icons/icon_diet_fill.png'
                                            }
                                          ></Avatar>
                                          <Box
                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                          >
                                            <span
                                              title={all?.ingredient_name}
                                              style={{
                                                width: '75px',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis'
                                              }}
                                            >
                                              {all?.ingredient_name}
                                            </span>
                                            <span style={{ color: '#7A8684', fontSize: 13 }}>
                                              {'ING' + all?.ingredient_id}
                                            </span>

                                            <span style={{ color: '#7A8684', fontSize: 13 }}>
                                              {all?.preparation_type}
                                            </span>
                                          </Box>
                                          <Icon
                                            onClick={() => removeingClickingwithChoice(all.ingredient_id, all.mealid)}
                                            style={{ position: 'relative', left: '28%' }}
                                            icon='iconoir:cancel'
                                          />
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  )
                                })}

                                <Grid item>
                                  <Card
                                    sx={{ width: '100px', height: '90px', mr: 4, boxShadow: 'none', mt: 3, padding: 3 }}
                                  >
                                    <CardContent
                                      sx={{
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        padding: 2
                                      }}
                                      onClick={() => handleAddIngerdientChoicewithindex(field, index, 'addingIndex')}
                                    >
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Icon
                                          style={{ marginLeft: '14px', color: '#00D6C9', fontWeight: 600 }}
                                          icon='material-symbols:add'
                                        />

                                        <span style={{ marginLeft: '12px', color: '#00D6C9', fontWeight: 500 }}>
                                          Add
                                        </span>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              </Grid>
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
                  onClick={() => handleAddIngerdientChoice(field, index, 'addingd')}
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
                //startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
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
          setOpenIngredientchoice={setOpenIngredientchoice}
          ingType={ingType}
          ingredientChoiceIndex={ingredientChoiceIndex}
          setingType={setingType}
          onRemove={removeingClickingwithChoice}
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
          setUomprev={setUomprev}
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
