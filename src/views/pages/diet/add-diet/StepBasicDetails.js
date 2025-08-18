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
import {
  Divider,
  CardContent,
  FormHelperText,
  Card,
  CardHeader,
  Avatar,
  Tooltip,
  CircularProgress,
  useMediaQuery
} from '@mui/material'
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
import { useTheme } from '@mui/material/styles'

import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

import Icon from 'src/@core/components/icon'
import AddIngredientswithChoice from 'src/components/diet/AddIngredientswithchoice'
import AddIngredients from 'src/components/diet/AddIngredients'
import RecipeList from 'src/components/diet/RecipeList'
import ComboList from 'src/components/diet/ComboList'

const defaultValues = {
  diet_name: '',
  diet_type_name: '',
  diet_type_id: '',
  dietitian_name: '',
  dietitian_id: null,
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
      combo: [],
      ingredient: [],
      ingredientwithchoice: []
    }
  ]
}

const schema = yup.object().shape({
  diet_name: yup.string().required('Diet name is required'),

  //diet_type_name: yup.string().required('Diet type is required'),
  diet_type_id: yup.string().required('Diet type is required'),
  dietitian_id: yup.string().required('Dietician name is required'),
  meal_data: yup.array().of(
    yup.object().shape({
      meal_name: yup.string().required('Meal name is required'),
      meal_from_time: yup.string().required('Meal from time is required'),
      meal_to_time: yup.string().required('Meal to time is required'),
      notes: yup.string(),
      recipe: yup.array(),
      combo: yup.array(),
      ingredient: yup.array()
    })
  )
})

const StepBasicDetails = ({
  handleNext,
  formData,
  uomList,
  dieticianList,
  selectedCard,
  setSelectedCard,
  setSelectedCardRecipe,
  setSelectedCardCombo,
  selectedCardRecipe,
  selectedCardCombo,
  setUomprevnew,
  cutsizelist,
  uom,
  feedType,
  id,
  diettypechildvalues,
  loader
}) => {
  // ** States
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [uploadedImage, setUploadedImage] = useState(null)
  const [openIngredient, setOpenIngredient] = useState(false)
  const [toValue, setToValue] = useState(null)
  const [OpenIngredientchoice, setOpenIngredientchoice] = useState(false)
  const [childStateValue, setChildStateValue] = useState([])
  const [allSelectedValues, setAllSelectedValues] = useState([])
  const [childRecipeStateValue, setRecipeChildStateValue] = useState([])
  const [childComboStateValue, setComboChildStateValue] = useState([])
  const [allRecipeSelectedValues, setAllRecipeSelectedValues] = useState([])
  const [allComboSelectedValues, setAllComboSelectedValues] = useState([])
  const [allIngredientchoiceSelectedValues, setAllIngredientchoiceSelectedValues] = useState([])
  const [childIngredeintchoiceStateValue, setIngredientchoiceChildStateValue] = useState([])
  const [finalvalue, setfinalvalue] = useState([])
  const [finalvaluerecipe, setfinalrecipevalue] = useState([])
  const [finalvaluecombo, setfinalcombovalue] = useState([])
  const [finalvalueingredientchoice, setfinalvalueingredientchoice] = useState([])
  const [checkid, setcheckid] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openDrawercombo, setOpenDrawercombo] = useState(false)
  const [recipeList, setRecipeList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [ingType, setingType] = useState('')
  const [ingredientChoiceIndex, setingredientChoiceIndex] = useState('')
  const [fromrow, setFromRow] = useState('')
  const [recipeid, setRecipeId] = useState('')
  const [recipeName, setRecipeName] = useState('')
  const [comboName, setComboName] = useState('')
  const [comboid, setComboId] = useState('')
  const [ingredientId, setIngredientId] = useState('')
  const [ingredientName, setIngredientName] = useState('')
  const [ingredientwithChoiceId, setIngredientwithChoiceId] = useState([])
  const [ingredientwithChoiceName, setIngredientwithChoiceName] = useState([])
  const router = useRouter()

  const recipes = [
    // { label: 'No' },
    { label: 'Recipe' },
    { label: 'Items' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]

  const combos = [
    // { label: 'No' },
    { label: 'Combo' },
    { label: 'Items' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]

  const ingredients = [
    // { label: 'No' },
    { label: 'Item' },
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
    setValue: setFormValue,
    setError
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

  const handleclickRecipeDetail = val => {
    const url = `/diet/recipe/${val}`
    window.open(url, '_blank')
  }

  const handleclickComboDetail = val => {
    const url = `/diet/combo/${val}`
    window.open(url, '_blank')
  }

  const handleChildStateChange = value => {
    setChildStateValue(value)

    const uniqueValues = value.filter(
      (val, index, self) =>
        index ===
        self.findIndex(
          v => String(v?.ingredient_id) === String(val?.ingredient_id) && String(v?.mealid) === String(val?.mealid)
        )
    )

    setAllSelectedValues(prevState => {
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal =>
              String(uniqueVal?.ingredient_id) === String(prevVal?.ingredient_id) &&
              String(uniqueVal?.mealid) === String(prevVal?.mealid)
          )
      )

      const updatedValues = [...filteredPrevState, ...uniqueValues].map(uniqueVal => {
       
        const matchedMealData = formData.meal_data.find(
          mealData =>
            Array.isArray(mealData.ingredient) &&
            mealData.ingredient.some(
              ingredient =>
                String(ingredient?.ingredient_id) === String(uniqueVal?.ingredient_id) &&
                String(ingredient?.mealid) === String(uniqueVal?.mealid)
            )
        )

        if (matchedMealData) {
          
          const matchedIngredient = matchedMealData.ingredient.find(
            ingredient =>
              String(ingredient?.ingredient_id) === String(uniqueVal?.ingredient_id) &&
              String(ingredient?.mealid) === String(uniqueVal?.mealid)
          )

          return {
            ...uniqueVal,
            meal_type: matchedIngredient?.meal_type || []
          }
        }

        return uniqueVal
      })

      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.ingredient = updatedValues.filter(up => String(up?.mealid) === String(field?.mealid))
      }

      return updatedValues
    })

    setfinalvalue(fieldsIngredients)
  }

  const handleRecipeStateChange = value => {
    setRecipeChildStateValue(value)

    const uniqueValues = value.filter(
      (val, index, self) =>
        index ===
        self.findIndex(
          v => String(v?.recipe_id) === String(val?.recipe_id) && String(v?.mealid) === String(val?.mealid)
        )
    )

    setAllRecipeSelectedValues(prevState => {
     
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal =>
              String(uniqueVal?.recipe_id) === String(prevVal?.recipe_id) &&
              String(uniqueVal?.mealid) === String(prevVal?.mealid)
          )
      )

      const updatedValues = [...filteredPrevState, ...uniqueValues].map(uniqueVal => {
       

        const matchedMealData = formData.meal_data.find(
          mealData =>
            Array.isArray(mealData.recipe) &&
            mealData.recipe.some(
              recipe =>
                String(recipe?.recipe_id) === String(uniqueVal?.recipe_id) &&
                String(recipe?.mealid) === String(uniqueVal?.mealid)
            )
        )

        if (matchedMealData) {
        
          const matchedRecipe = matchedMealData.recipe.find(
            recipe =>
              String(recipe?.recipe_id) === String(uniqueVal?.recipe_id) &&
              String(recipe?.mealid) === String(uniqueVal?.mealid)
          )

          return {
            ...uniqueVal,
            meal_type: matchedRecipe?.meal_type || []
          }
        }

        return uniqueVal
      })

      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.recipe = updatedValues.filter(up => String(up?.mealid) === String(field?.mealid))
      }

      return updatedValues
    })

    setfinalrecipevalue(fieldsIngredients)
  }

  const handleComboStateChange = value => {
    console.log('Received value:', value)
    setComboChildStateValue(value)

    const uniqueValues = value.filter(
      (val, index, self) =>
        index ===
        self.findIndex(
          v => String(v?.recipe_id) === String(val?.recipe_id) && String(v?.mealid) === String(val?.mealid)
        )
    )

    setAllComboSelectedValues(prevState => {
     
      const filteredPrevState = prevState.filter(
        prevVal =>
          !uniqueValues.some(
            uniqueVal =>
              String(uniqueVal?.recipe_id) === String(prevVal?.recipe_id) &&
              String(uniqueVal?.mealid) === String(prevVal?.mealid)
          )
      )

      const updatedValues = [...filteredPrevState, ...uniqueValues].map(uniqueVal => {
        const matchedMealData = formData.meal_data.find(
          mealData =>
            Array.isArray(mealData.combo) &&
            mealData.combo?.some(
              combo =>
                String(combo?.recipe_id) === String(uniqueVal?.recipe_id) &&
                String(combo?.mealid) === String(uniqueVal?.mealid)
            )
        )

        if (matchedMealData) {
         
          const matchedCombo = matchedMealData.combo?.find(
            combo =>
              String(combo?.recipe_id) === String(uniqueVal?.recipe_id) &&
              String(combo?.mealid) === String(uniqueVal?.mealid)
          )

          return {
            ...uniqueVal,
            meal_type: matchedCombo?.meal_type || []
          }
        }

        return uniqueVal
      })

      for (let i = 0; i < fieldsIngredients.length; i++) {
        const field = fieldsIngredients[i]
        field.combo = updatedValues.filter(up => String(up?.mealid) === String(field?.mealid))
      }

      console.log(updatedValues, 'updatedValues')

      return updatedValues
    })

    setfinalcombovalue(fieldsIngredients)
  }

  const handleIngredientchoiceStateChange = value => {
    setIngredientchoiceChildStateValue(value)

    setAllIngredientchoiceSelectedValues(value)

    for (let i = 0; i < fieldsIngredients.length; i++) {
      const field = fieldsIngredients[i]
      field.ingredientwithchoice = value.filter(up => up?.mealid === field.mealid)
    }
    setfinalvalueingredientchoice(fieldsIngredients)
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
          ingredient_id: String(ing.ingredient_id) 
        }))
      )
      setAllSelectedValues(flattenedIngredients)

      const flattenedRecipes = formData.meal_data?.flatMap(all =>
        all.recipe?.map(ing => ({
          ...ing,
          recipe_id: String(ing.recipe_id), 
          ingredients_count: ing?.ingredients?.length || ing?.ingredient_name?.length || 0
        }))
      )

      setAllRecipeSelectedValues(flattenedRecipes)

      const flattenedCombos = formData.meal_data?.flatMap(all =>
        all.combo?.map(ing => ({
          ...ing,
          recipe_id: String(ing.recipe_id), 
          ingredients_count: ing?.ingredients?.length || ing?.ingredient_name?.length || 0
        }))
      )

      setAllComboSelectedValues(flattenedCombos)

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
            if (error?.meal_name?.ref?.name || error?.meal_from_time?.ref?.name || error?.meal_to_time?.ref?.name) {
              firstErrorField =
                error?.meal_name?.ref?.name || error?.meal_from_time?.ref?.name || error?.meal_to_time?.ref?.name
              break
            }
          }
        }

        if (firstErrorField) break
      }

      if (firstErrorField) {
        const errorElement = document.querySelector(`input[name="${firstErrorField}"]`)

        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, [errors])

    return null
  }

  const handleAddIngerdientChoice = (val, index, type) => {
    setOpenIngredientchoice(true)
    setcheckid(val.mealid)
    setingType(type)
    setIngredientwithChoiceId([])
    setIngredientwithChoiceName([])
    setFromRow('')
  }

  const handleAddIngerdientChoicewithindex = (val, index, type, ingtype, rowval, id, name) => {
    setOpenIngredientchoice(true)
    setcheckid(val.mealid)
    setingType(type)
    setingredientChoiceIndex(index)
    setFromRow(rowval)
    setIngredientwithChoiceId(id)
    setIngredientwithChoiceName(name)
    setIngredientchoiceChildStateValue(prevState => {
      const newState = prevState.filter(item => item.mealid === val.id)

      return newState
    })
  }

  const addEventSidebarOpen = (val, index, type, rowval, id, name) => {
    if (type === 'recipe') {
      setOpenDrawer(true)
      setFromRow(rowval)
      setRecipeId(id)
      setRecipeName(name)
      setSelectedCardRecipe([])
    } else if (type === 'combo') {
      setOpenDrawercombo(true)
      setFromRow(rowval)
      setComboId(id)
      setSelectedCardCombo([])
      setComboName(name)
    }
    setcheckid(val.mealid)
  }

  const handleSidebarCloseRecipe = () => {
    setOpenDrawer(false)
    setOpenDrawercombo(false)
  }

  const handleAddIngerdient = (val, index, type, rowval, id, name) => {
    setFromRow(rowval)
    setIngredientId(id)
    setIngredientName(name)
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

      const updatedAddMealsWithCombos = updatedAddMealsWithRecipes.map((meal, index) => {
        if (finalvaluecombo[index]) {
          return {
            ...meal,
            combo: finalvaluecombo[index].combo
          }
        }

        return meal
      })

      const mergedAddMeals = updatedAddMealsWithCombos.map((meal, index) => ({
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
          (!meal.combo || meal.combo.length === 0) &&
          (!meal.ingredientwithchoice || meal.ingredientwithchoice.length === 0)
        ) {
          invalidIndexes.push(index)
        }

        return invalidIndexes
      }, [])

      if (invalidIndexes.length > 0) {
        invalidIndexes.forEach(index => {
          toast.error(`Meal ${index + 1} must contain at least one of item, recipe, combo or items with choice.`)
        })

        return
      }

     
      const lastOverlapIndex = checkForTimeOverlap(formDataWithImage.meal_data)

      if (lastOverlapIndex !== -1) {
        toast.error(`Meal ${lastOverlapIndex + 1} Start time cannot be later than end time.`)

        return
      } else {
        handleNext(formDataWithImage)
      }
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
    if (id !== undefined) {
      Router.push(`/diet/diet/${id}`)
    } else {
      Router.push(`/diet/diet`)
    }
  }

  const addIngredientsButton = () => {
    return (
      <>
        <Grid
          container
          onClick={() => {
            appendIngredients({
              mealid: `meal${fieldsIngredients.length}`,
              meal_name: `Meal ${fieldsIngredients.length + 1}`,
              meal_from_time: '',
              meal_to_time: '',
              notes: ''
            })
          }}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            mt: 12,
            border: `3px dotted ${theme.palette.primary.main}`,
            padding: '8px 16px',
            backgroundColor: '#37bd6912',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Typography
            sx={{
              mb: 1,
              color: theme.palette.primary.main,
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
    setChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(
        ingredient => ingredient?.ingredient_id !== ingredientIdToRemove
      )

      setAllSelectedValues(prevAllSelectedValues => {
        return prevAllSelectedValues.filter(ingredient => {
          return !(ingredient?.mealid === val && ingredient?.ingredient_id === ingredientIdToRemove)
        })
      })

      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          // Remove ingredient only if mealid matches
          field.ingredient = field.ingredient?.filter(ing => String(ing.ingredient_id) !== ingredientIdToRemove)
        }

        return field
      })

      setfinalvalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClicking = (indexToRemove, val, value) => {
    setingType('')
    setIngredientchoiceChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter((_, index) => index !== indexToRemove)

      setAllIngredientchoiceSelectedValues(prevAllSelectedValues => {
        const updatedAllSelectedValues = prevAllSelectedValues.filter((ingredient, index) => {
          return index !== indexToRemove || ingredient?.mealid !== val
        })

        return updatedAllSelectedValues
      })

      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          field.ingredientwithchoice = field.ingredientwithchoice?.filter(ingWithChoice => {
            const hasMatchingIngredient = ingWithChoice.ingredientList?.some(ing => {
              return value.ingredientList?.some(
                valIng =>
                  String(valIng.preparation_type_id) === String(ing.preparation_type_id) &&
                  String(valIng.mealid) === String(ing.mealid) &&
                  String(valIng.ingredient_id) === String(ing.ingredient_id)
              )
            })

            return !hasMatchingIngredient
          })
        }

        return field
      })
      setfinalvalueingredientchoice(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClickRecipe = (recipeIdToRemove, val) => {
    setRecipeChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(recipe => recipe.recipe_id !== recipeIdToRemove)

      setAllRecipeSelectedValues(prevAllSelectedValues => {
        return prevAllSelectedValues.filter(recipe => {
          return !(recipe?.mealid === val && recipe?.recipe_id === recipeIdToRemove)
        })
      })

      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          field.recipe = field.recipe?.filter(ing => String(ing.recipe_id) !== recipeIdToRemove)
        }

        return field
      })

      setfinalrecipevalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClickCombo = (recipeIdToRemove, val) => {
    setComboChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(recipe => recipe.recipe_id !== recipeIdToRemove)

      setAllComboSelectedValues(prevAllSelectedValues => {
        return prevAllSelectedValues.filter(recipe => {
          return !(recipe?.mealid === val && recipe?.recipe_id === recipeIdToRemove)
        })
      })

      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          field.combo = field.combo?.filter(ing => String(ing.recipe_id) !== recipeIdToRemove)
        }

        return field
      })

      setfinalcombovalue(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const removeingClickingwithChoice = (ingredientIdToRemove, val, index, value) => {
    setIngredientchoiceChildStateValue(prevSelectedCard => {
      const filteredChildStateValue = prevSelectedCard.filter(ingredient =>
        ingredient.ingredientList.some(ing => ing.ingredient_id !== ingredientIdToRemove)
      )

      setAllIngredientchoiceSelectedValues(prevAllSelectedValues => {
        const updatedAllSelectedValues = prevAllSelectedValues
          .map((ingredient, i) => {
            if (i === index && ingredient?.mealid === val) {
              return {
                ...ingredient,
                ingredientList: ingredient.ingredientList.filter(ing => ing?.ingredient_id !== ingredientIdToRemove)
              }
            }

            return ingredient
          })
          .filter(ingredient => ingredient.ingredientList.length > 0)

        return updatedAllSelectedValues
      })

      const updatedFieldsIngredients = fieldsIngredients.map(field => {
        if (field?.mealid === val) {
          const updatedIngredientWithChoice = field.ingredientwithchoice
            ?.map(ingWithChoice => {
              const updatedIngredientList = ingWithChoice.ingredientList?.filter(ing => {
                return !(
                  String(value.preparation_type_id) === String(ing.preparation_type_id) &&
                  String(value.mealid) === String(ing.mealid) &&
                  String(value.ingredient_id) === String(ing.ingredient_id)
                )
              })

              return {
                ...ingWithChoice,
                ingredientList: updatedIngredientList?.length > 0 ? updatedIngredientList : undefined
              }
            })
            .filter(ingWithChoice => ingWithChoice.ingredientList) 

          return {
            ...field,
            ingredientwithchoice: updatedIngredientWithChoice?.length > 0 ? updatedIngredientWithChoice : undefined
          }
        }

        return field
      })

      setfinalvalueingredientchoice(updatedFieldsIngredients)

      return filteredChildStateValue
    })
  }

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <>
      {loader ? (
        <CardContent sx={{ background: theme.palette.primary.contrastText, height: '100vh' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card sx={{ boxShadow: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Box sx={{ mb: 8, px: 5, mt: 5, float: 'left' }}>
              <Typography variant='h6'>Basic Information</Typography>
            </Box>
            <ScrollToFieldError errors={errors} />
            <Grid container spacing={5} sx={{ px: 5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
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

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}

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

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <Controller
                    name='dietitian_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => {
                      return (
                        <Autocomplete
                          id='dietitian_id'
                          value={dieticianList?.find(option => option.value === String(value)) || null}
                          options={dieticianList || []}
                          getOptionLabel={option => option.label}
                          isOptionEqualToValue={(option, value) => option?.value === String(value)}
                          onChange={(e, val) => {
                            if (val === null) {
                              setFormValue('dietitian_id', '')
                              setFormValue('dietitian_name', '')
                            } else {
                              setFormValue('dietitian_id', val.value)
                              setFormValue('dietitian_name', val.label)
                              trigger('dietitian_id')
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Prepared by *'
                              placeholder='Search & Select'
                              error={Boolean(errors.dietitian_id)}
                              name='dietitian_id'
                            />
                          )}
                        />
                      )
                    }}
                  />
                  {errors?.dietitian_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.dietitian_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* <Grid item size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <Controller
                    name='dietitian_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => {
                      console.log(value)

                      return (
                        <Autocomplete
                          id='dietitian_id'
                          value={dieticianList?.find(option => option.value === value) || null}
                          options={dieticianList || []}
                          getOptionLabel={option => option.label}
                          isOptionEqualToValue={(option, value) => option?.value === value}
                          onChange={(e, val) => {
                            if (val === null) {
                              setFormValue('dietitian_id', '')
                              setFormValue('dietitian_name', '')
                            } else {
                              setFormValue('dietitian_id', val.value)
                              setFormValue('dietitian_name', val.label)
                              trigger('dietitian_id')
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Dietician *'
                              placeholder='Search & Select'
                              error={Boolean(errors.dietitian_id)}
                              name='dietitian_id'
                            />
                          )}
                        />
                      )
                    }}
                  />
                  {errors?.dietitian_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.dietitian_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid> */}

              <Grid size={{ xs: 6 }}>
                <CardContent sx={{ px: 0, paddingTop: 2, pb: '0.7rem !important' }}>
                  <CustomFileUploaderSingle onImageUpload={handleImageUpload} uploadedImagenew={uploadedImage} />
                </CardContent>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ pt: 0, pb: 8 }}>
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
              <CardHeader title={`Add Meal ${index + 1}`} sx={{ float: 'left', width: '50%', mb: 5 }} />
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
                  <Grid size={{ xs: 12, sm: 3 }}>
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
                  <Grid size={{ xs: 12, sm: 3.2 }}>
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
                                    errors.meal_data &&
                                    errors.meal_data[index] &&
                                    errors.meal_data[index]?.meal_from_time
                                      ? 'red'
                                      : undefined 
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

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FormControl fullWidth>
                      <Controller
                        name={`meal_data[${index}].meal_to_time`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                              label='Select time - to'
                              name={`meal_data[${index}].meal_to_time`}
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
                  <Grid container spacing={5} sx={{ px: 0, pt: 5 }}>
                    <Box sx={{ mb: 0, mt: 2, float: 'left' }}>
                      <Typography variant='h6'>Recipes</Typography>
                    </Box>

                    <Grid
                      container
                      spacing={5}
                      sx={{
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '0.5rem',
                        mx: 0
                      }}
                    >
                      <Grid
                        container
                        spacing={5}
                        sx={{
                          background: theme.palette.background.OnBackground,
                          mt: 0,
                          borderTopLeftRadius: 7,
                          borderTopRightRadius: 7,
                          mx: 0
                        }}
                      >
                        {recipes.map((recipe, index) => (
                          <Grid
                            size={{
                              xs: 12,
                              sm:
                                recipe.label === 'No'
                                  ? 0.5
                                  : recipe.label === 'Recipe'
                                  ? 2.2
                                  : recipe.label === 'Items'
                                  ? 1.9
                                  : 3.7,
                              md:
                                recipe.label === 'No'
                                  ? 0.5
                                  : recipe.label === 'Recipe'
                                  ? 2.3
                                  : recipe.label === 'Items'
                                  ? 1.5
                                  : 3.5
                            }}
                            key={index}
                            sx={{ py: 4, px: 6, textAlign: 'center' }}
                          >
                            <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>{recipe.label} </span>
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>

                      {allRecipeSelectedValues?.length > 0 ? (
                        allRecipeSelectedValues.map((all, index) => {
                          const matchingField = all?.mealid === field.mealid

                          if (matchingField) {
                            return (
                              <Grid
                                container
                                sx={{
                                  px: 5,
                                  pb: 5,
                                  pt: 0,
                                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  borderRadius: '7px'
                                }}
                                key={index}
                              >
                                <Grid size={{ xs: 12, sm: 0.5, md: 0.5 }}>
                                  <Avatar
                                    variant='square'
                                    alt='Diet Image'
                                    sx={{
                                      width: isSmallDevice ? 30 : 40,
                                      height: isSmallDevice ? 30 : 40,
                                      mr: 4,
                                      background: isSmallDevice ? '' : theme.palette.customColors.tableHeaderBg,
                                      padding: isSmallDevice ? '0px' : '8px',
                                      borderRadius: '50%',
                                      marginTop: isSmallDevice ? '5px' : '0px'
                                    }}
                                    src={all.recipe_image ? all.recipe_image : '/icons/icon_diet_fill.png'}
                                  ></Avatar>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 2.2, md: 2.1 }}>
                                  <Tooltip title={all.recipe_name}>
                                    <Typography
                                      className='recipe_name'
                                      sx={{
                                        pl: 3,
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleclickRecipeDetail(all.recipe_id)}
                                    >
                                      {all?.recipe_name}
                                    </Typography>
                                  </Tooltip>
                                  <Typography
                                    sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '12px', pl: 3 }}
                                  >
                                    {'REP' + all?.recipe_id}
                                  </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 1.4, md: 1.0 }}>
                                  <Typography>{all?.ingredients_count}</Typography>
                                  {/* {all?.ingredients ? (
                                  <Typography>{all?.ingredients?.length}</Typography>
                                ) : (
                                  <Typography>{all?.ingredient_name?.length}</Typography>
                                )} */}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.7, md: 3.7 }}>
                                  <Grid container spacing={1} sx={{ pl: 2 }}>
                                    {days.map((day, index) => (
                                      <Grid key={index}>
                                        <Typography
                                          sx={{
                                            color: all?.days_of_week?.includes(index + 1)
                                              ? theme.palette.secondary.dark
                                              : theme.palette.customColors.Outline,
                                            marginRight: 4
                                          }}
                                        >
                                          {day}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.3, md: 3.5 }}>
                                  <Grid sx={{ pl: 7 }}>
                                    <Typography className='w_280'>
                                      <Tooltip title={all?.remarks} arrow placement='bottom'>
                                        <span className='text_overflow_moduled'>
                                          {all?.remarks ? all.remarks : '-'}
                                        </span>
                                      </Tooltip>
                                    </Typography>
                                  </Grid>
                                </Grid>
                                <Icon
                                  //onClick={() => removeingClickRecipe(all.recipe_id, all.mealid)}
                                  style={{ position: 'absolute', right: '8%', fontSize: '22px', cursor: 'pointer' }}
                                  className='pencil_diet'
                                  onClick={() =>
                                    addEventSidebarOpen(
                                      field,
                                      index,
                                      'recipe',
                                      'rowedit_recipe',
                                      all?.recipe_id,
                                      all?.recipe_name
                                    )
                                  }
                                  icon='bx:pencil'
                                />
                                <Icon
                                  className='del_diet'
                                  onClick={() => removeingClickRecipe(all.recipe_id, all.mealid)}
                                  style={{ position: 'absolute', right: '5%', cursor: 'pointer' }}
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

                {allComboSelectedValues?.length > 0 &&
                allComboSelectedValues.some(value => value?.mealid === field.mealid) ? (
                  <Grid container spacing={5} sx={{ px: 0, pt: 5 }}>
                    <Box sx={{ mb: 0, mt: 2, float: 'left' }}>
                      <Typography variant='h6'>Combo</Typography>
                    </Box>

                    <Grid
                      container
                      spacing={5}
                      sx={{
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '0.5rem',
                        mx: 0
                      }}
                    >
                      <Grid
                        container
                        spacing={5}
                        sx={{
                          background: '#DAE7DF99',
                          mt: 0,
                          borderTopLeftRadius: 7,
                          borderTopRightRadius: 7,
                          mx: 0
                        }}
                      >
                        {combos.map((recipe, index) => (
                          <Grid
                            size={{
                              xs: 12,
                              sm:
                                recipe.label === 'No'
                                  ? 0.5
                                  : recipe.label === 'Combo'
                                  ? 2.2
                                  : recipe.label === 'Items'
                                  ? 1.9
                                  : 3.7,
                              md:
                                recipe.label === 'No'
                                  ? 0.5
                                  : recipe.label === 'Combo'
                                  ? 2.3
                                  : recipe.label === 'Items'
                                  ? 1.5
                                  : 3.5
                            }}
                            key={index}
                            sx={{ py: 4, px: 6, textAlign: 'center' }}
                          >
                            <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>{recipe.label} </span>
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>

                      {allComboSelectedValues?.length > 0 ? (
                        allComboSelectedValues.map((all, index) => {
                          const matchingField = all?.mealid === field.mealid

                          if (matchingField) {
                            return (
                              <Grid
                                container
                                sx={{
                                  px: 5,
                                  pb: 5,
                                  pt: 0,
                                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  borderRadius: '7px'
                                }}
                                key={index}
                              >
                                <Grid size={{ xs: 12, sm: 0.5, md: 0.5 }}>
                                  <Avatar
                                    variant='square'
                                    alt='Diet Image'
                                    sx={{
                                      width: isSmallDevice ? 30 : 40,
                                      height: isSmallDevice ? 30 : 40,
                                      mr: 4,
                                      background: isSmallDevice ? '' : theme.palette.customColors.tableHeaderBg,
                                      padding: isSmallDevice ? '0px' : '8px',
                                      borderRadius: '50%',
                                      marginTop: isSmallDevice ? '5px' : '0px'
                                    }}
                                    src={all.recipe_image ? all.recipe_image : '/icons/icon_diet_fill.png'}
                                  ></Avatar>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 2.2, md: 2.1 }}>
                                  <Tooltip title={all.recipe_name}>
                                    <Typography
                                      className='recipe_name'
                                      sx={{
                                        pl: 3,
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleclickComboDetail(all.recipe_id)}
                                    >
                                      {all?.recipe_name}
                                    </Typography>
                                  </Tooltip>
                                  <Typography
                                    sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '12px', pl: 3 }}
                                  >
                                    {'CMB' + all?.recipe_id}
                                  </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 1.4, md: 1.0 }}>
                                  <Typography>{all?.ingredients_count}</Typography>
                                  {/* {all?.ingredients ? (
                                  <Typography>{all?.ingredients?.length}</Typography>
                                ) : (
                                  <Typography>{all?.ingredient_name?.length}</Typography>
                                )} */}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.7, md: 3.7 }}>
                                  <Grid container spacing={1} sx={{ pl: 2 }}>
                                    {days.map((day, index) => (
                                      <Grid key={index}>
                                        <Typography
                                          sx={{
                                            color: all?.days_of_week?.includes(index + 1)
                                              ? theme.palette.secondary.dark
                                              : theme.palette.customColors.Outline,
                                            marginRight: 4
                                          }}
                                        >
                                          {day}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.3, md: 3.5 }}>
                                  <Grid sx={{ pl: 5 }}>
                                    <Typography className='w_280'>
                                      <Tooltip title={all?.remarks} arrow placement='bottom'>
                                        <span className='text_overflow_moduled'>
                                          {all?.remarks ? all.remarks : '-'}
                                        </span>
                                      </Tooltip>
                                    </Typography>
                                  </Grid>
                                </Grid>
                                <Icon
                                  style={{ position: 'absolute', right: '8%', fontSize: '22px', cursor: 'pointer' }}
                                  className='pencil_diet'
                                  onClick={() =>
                                    addEventSidebarOpen(
                                      field,
                                      index,
                                      'combo',
                                      'rowedit_combo',
                                      all?.recipe_id,
                                      all?.recipe_name
                                    )
                                  }
                                  icon='bx:pencil'
                                />
                                <Icon
                                  className='del_diet'
                                  onClick={() => removeingClickCombo(all.recipe_id, all.mealid)}
                                  style={{ position: 'absolute', right: '5%', cursor: 'pointer' }}
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
                  <Grid container spacing={5} sx={{ px: 0, pt: 5 }}>
                    <Box sx={{ mb: 0, mt: 2, float: 'left' }}>
                      <Typography variant='h6'>Items</Typography>
                    </Box>

                    <Grid
                      container
                      spacing={5}
                      sx={{
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '0.5rem',
                        mx: 0
                      }}
                    >
                      <Grid
                        container
                        spacing={5}
                        sx={{ background: '#00d6c957', mt: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7, mx: 0 }}
                      >
                        {ingredients.map((ingredient, index) => (
                          <Grid
                            size={{
                              xs: 12,
                              sm:
                                ingredient.label === 'No'
                                  ? 0.5
                                  : ingredient.label === 'Item'
                                  ? 2.4
                                  : ingredient.label === 'Prep types'
                                  ? 2.0
                                  : 3.3,
                              md:
                                ingredient.label === 'No'
                                  ? 0.5
                                  : ingredient.label === 'Item'
                                  ? 2.2
                                  : ingredient.label === 'Prep types'
                                  ? 2.0
                                  : 3.3
                            }}
                            key={index}
                            sx={{ py: 4, px: 6, textAlign: 'center' }}
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
                              <Grid
                                container
                                sx={{
                                  px: 5,
                                  pb: 5,
                                  pt: 0,
                                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  borderRadius: '7px'
                                }}
                                key={index}
                              >
                                <Grid size={{ xs: 12, sm: 0.5, md: 0.5 }}>
                                  <Avatar
                                    variant='square'
                                    alt='Diet Image'
                                    sx={{
                                      width: isSmallDevice ? 30 : 40,
                                      height: isSmallDevice ? 30 : 40,
                                      mr: 4,
                                      background: isSmallDevice ? '' : theme.palette.customColors.tableHeaderBg,
                                      padding: isSmallDevice ? '0px' : '8px',
                                      borderRadius: '50%',
                                      marginTop: isSmallDevice ? '5px' : '0px'
                                    }}
                                    src={all.ingredient_image ? all.ingredient_image : '/icons/icon_diet_fill.png'}
                                  ></Avatar>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 2.2, md: 1.8 }}>
                                  <Tooltip title={all.ingredient_name}>
                                    <Typography className='recipe_name' sx={{ pl: 3 }}>
                                      {all.ingredient_name}
                                    </Typography>
                                  </Tooltip>
                                  <Typography
                                    sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '12px', pl: 3 }}
                                  >
                                    {'ING' + all?.ingredient_id}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 1.7, md: 1.5 }} sx={{ pl: 2 }}>
                                  <Typography>{all.preparation_type}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.3, md: 3.7 }}>
                                  <Grid container spacing={1} sx={{ pl: 2 }}>
                                    {days.map((day, index) => (
                                      <Grid key={day}>
                                        <Typography
                                          sx={{
                                            color: all.days_of_week?.includes(index + 1)
                                              ? theme.palette.secondary.dark
                                              : theme.palette.customColors.Outline,
                                            marginRight: 3
                                          }}
                                        >
                                          {day}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.3, md: 3.5 }}>
                                  <Grid sx={{ pl: 8 }}>
                                    <Typography className='w_280'>
                                      <Tooltip title={all?.remarks} arrow placement='bottom'>
                                        <span className='text_overflow_moduled'>
                                          {all?.remarks ? all.remarks : '-'}
                                        </span>
                                      </Tooltip>
                                    </Typography>
                                  </Grid>
                                </Grid>

                                <Icon
                                  //onClick={() => removeingClickRecipe(all.recipe_id, all.mealid)}
                                  style={{ position: 'absolute', right: '8%', fontSize: '22px', cursor: 'pointer' }}
                                  className='pencil_diet'
                                  onClick={() =>
                                    handleAddIngerdient(
                                      field,
                                      index,
                                      'ingredient',
                                      'rowedit_ingredient',
                                      all?.ingredient_id,
                                      all?.ingredient_name
                                    )
                                  }
                                  icon='bx:pencil'
                                />
                                <Icon
                                  className='del_diet'
                                  onClick={() => removeingClick(all.ingredient_id, all.mealid)}
                                  style={{ position: 'absolute', right: '5%', cursor: 'pointer' }}
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
                  <Grid container spacing={5} sx={{ px: 0, pt: 5 }}>
                    <Box sx={{ mb: 0, mt: 2, float: 'left' }}>
                      <Typography variant='h6'>Items with choice</Typography>
                    </Box>

                    <Grid
                      container
                      spacing={5}
                      sx={{
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '0.5rem',
                        mx: 0
                      }}
                    >
                      <Grid
                        container
                        spacing={5}
                        sx={{ background: '#00d6c957', mt: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7, mx: 0 }}
                      >
                        {ingredients.map((ingredient, index) => (
                          <Grid
                            size={{
                              xs: 12,
                              sm:
                                ingredient.label === 'Item'
                                  ? 2.2
                                  : ingredient.label === 'Prep types'
                                  ? 2.3
                                  : ingredient.label === 'Feeding days'
                                  ? 2.7
                                  : 3.9
                            }}
                            key={index}
                            sx={{ py: 4, px: 6, textAlign: 'center' }}
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
                              <Grid
                                container
                                sx={{
                                  px: 5,
                                  pb: 5,
                                  pt: 0,
                                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  borderRadius: '7px'
                                }}
                                key={index}
                              >
                                <Grid size={{ xs: 12, sm: 2.2 }}>
                                  <Typography>
                                    Offer Minimum{' '}
                                    <span
                                      style={{ color: theme.palette.primary.main, fontSize: '17px', fontWeight: 600 }}
                                    >
                                      {all.no_of_component_required}
                                    </span>{' '}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 2.3 }} sx={{ pl: 1 }}>
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
                                <Grid size={{ xs: 12, sm: 2.8 }}>
                                  <Grid container spacing={1} sx={{ pl: isSmallDevice ? 11 : 1 }}>
                                    {days.map((day, index) => (
                                      <Grid key={day}>
                                        <Typography
                                          sx={{
                                            color: all?.days_of_week?.includes(index + 1)
                                              ? theme.palette.secondary.dark
                                              : theme.palette.customColors.Outline,
                                            marginRight: 4
                                          }}
                                        >
                                          {day}
                                        </Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3.7, md: 3.6 }}>
                                  <Grid sx={{ pl: 7 }}>
                                    <Typography className='w_280'>
                                      <Tooltip title={all?.remarks} arrow placement='bottom'>
                                        <span className='text_overflow_moduled'>
                                          {all?.remarks ? all.remarks : '-'}
                                        </span>
                                      </Tooltip>
                                    </Typography>
                                  </Grid>
                                </Grid>

                                <Icon
                                  className='pencil_diet'
                                  style={{
                                    position: 'absolute',
                                    right: '8%',
                                    fontSize: '22px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() =>
                                    handleAddIngerdientChoicewithindex(
                                      field,
                                      index,
                                      'addingIndex',
                                      'ingredientwithchoice',
                                      'rowedit_ingredientwithchoice',
                                      all?.ingredientList.map(all => all.ingredient_id),
                                      all?.ingredientList.map(all => all.ingredient_name)
                                    )
                                  }
                                  icon='bx:pencil'
                                />
                                <Icon
                                  className='del_diet'
                                  onClick={() => removeingClicking(index, all.mealid, all)}
                                  style={{ position: 'absolute', right: '5%', cursor: 'pointer' }}
                                  icon='iconoir:cancel'
                                />

                                <Grid
                                  container
                                  sx={{
                                    background: '#00afd633',
                                    padding: '0px 0px 15px 15px',
                                    borderRadius: '8px',
                                    mt: 3
                                  }}
                                >
                                  {all?.ingredientList?.map((all, i) => {
                                    return (
                                      <Grid key={i}>
                                        <Card sx={{ width: '280px', height: '90px', mr: 0, boxShadow: 'none', mt: 3 }}>
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
                                                width: isSmallDevice ? 35 : 40,
                                                height: isSmallDevice ? 35 : 40,
                                                mr: 4,
                                                background: isSmallDevice
                                                  ? ''
                                                  : theme.palette.customColors.tableHeaderBg,
                                                padding: isSmallDevice ? '0px' : '8px',
                                                borderRadius: '50%'
                                              }}
                                              src={
                                                all.ingredient_image
                                                  ? all.ingredient_image
                                                  : '/icons/icon_diet_fill.png'
                                              }
                                            ></Avatar>
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start'
                                              }}
                                            >
                                              <span
                                                title={all?.ingredient_name}
                                                style={{
                                                  width: '148px',
                                                  overflow: 'hidden',
                                                  whiteSpace: 'nowrap',
                                                  textOverflow: 'ellipsis'
                                                }}
                                              >
                                                {all?.ingredient_name}
                                              </span>
                                              <span
                                                style={{ color: theme.palette.customColors.secondaryBg, fontSize: 13 }}
                                              >
                                                {'ING' + all?.ingredient_id}
                                              </span>

                                              <span
                                                style={{ color: theme.palette.customColors.secondaryBg, fontSize: 13 }}
                                              >
                                                {all?.preparation_type}
                                              </span>
                                            </Box>

                                            <Icon
                                              onClick={() =>
                                                removeingClickingwithChoice(all.ingredient_id, all.mealid, index, all)
                                              }
                                              style={{ position: 'relative', left: '0%', cursor: 'pointer' }}
                                              icon='iconoir:cancel'
                                            />
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    )
                                  })}

                                  <Grid>
                                    <Card
                                      sx={{
                                        width: '100px',
                                        height: '90px',
                                        mr: 4,
                                        boxShadow: 'none',
                                        mt: 3,
                                        padding: 3
                                      }}
                                    >
                                      <CardContent
                                        sx={{
                                          alignItems: 'center',
                                          justifyContent: 'flex-start',
                                          padding: 2
                                        }}
                                        onClick={() => handleAddIngerdientChoicewithindex(field, index, 'addingIndex')}
                                      >
                                        <Box
                                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                        >
                                          <Icon
                                            style={{
                                              marginLeft: '14px',
                                              color: theme.palette.customColors.Secondary,
                                              fontWeight: 600
                                            }}
                                            icon='material-symbols:add'
                                          />

                                          <span
                                            style={{
                                              marginLeft: '12px',
                                              color: theme.palette.customColors.Secondary,
                                              fontWeight: 500
                                            }}
                                          >
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
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    onClick={() => addEventSidebarOpen(field, index, 'recipe')}
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
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    onClick={() => addEventSidebarOpen(field, index, 'combo')}
                  >
                    <Icon icon='material-symbols:add' />
                    ADD COMBO
                  </Typography>
                  <Typography
                    className='item_cls'
                    sx={{
                      mb: 1,
                      mt: 6,
                      ml: 12,
                      float: 'left',
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    onClick={() => handleAddIngerdient(field, index)}
                  >
                    <Icon icon='material-symbols:add' />
                    ADD ITEM
                  </Typography>

                  <Typography
                    sx={{
                      mb: 1,
                      mt: 6,
                      ml: 12,
                      float: 'left',
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    className='ing_choice'
                    onClick={() => handleAddIngerdientChoice(field, index, 'addingd')}
                  >
                    <Icon icon='material-symbols:add' />
                    ADD ITEM WITH CHOICE
                  </Typography>
                </Grid>

                <Divider sx={{ mb: 4, pb: 1, mt: 6, width: '98%' }} />

                <Grid>
                  <Typography variant='h6'>Add Notes</Typography>
                  <Grid size={{ xs: 12 }} sx={{ pt: 5 }}>
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
            <Grid size={{ xs: 12 }}>
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
            uom={uom}
            feedType={feedType}
            ingredientwithChoiceId={ingredientwithChoiceId}
            ingredientwithChoiceName={ingredientwithChoiceName}
            fromrow={fromrow}
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
            setUomprevnew={setUomprevnew}
            uom={uom}
            feedType={feedType}
            ingredientId={ingredientId}
            fromrow={fromrow}
            setFromRow={setFromRow}
            ingredientName={ingredientName}
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
            dietid={id}
            fromrow={fromrow}
            recipeid={recipeid}
            recipeName={recipeName}
          />
          <ComboList
            recipeList={recipeList}
            setSelectedCardCombo={setSelectedCardCombo}
            selectedCardCombo={selectedCardCombo}
            drawerWidth={400}
            addEventSidebarOpen={openDrawercombo}
            handleSidebarClose={handleSidebarCloseRecipe}
            submitLoader={submitLoader}
            checkid={checkid}
            onChange={handleComboStateChange}
            allComboSelectedValues={allComboSelectedValues}
            setAllComboSelectedValues={setAllComboSelectedValues}
            formData={formData}
            onRemove={removeingClickCombo}
            cutsizelist={cutsizelist}
            dietid={id}
            fromrow={fromrow}
            comboid={comboid}
            comboName={comboName}
          />
        </form>
      )}
    </>
  )
}

export default StepBasicDetails
