import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import {
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'
import { Divider, Card } from '@mui/material'
import AddDietType from './AddDietType'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
  meal_type: [
    {
      meal_value_header: '',
      quantity: '',
      meal_value_uom_id: '',
      notes: '',
      feed_uom_name: ''
    }
  ]
}

const StepPreviewDiet = ({
  formData,
  handleNext,
  handlePrev,
  uomList,
  finalhandleSubmit,
  uomprev,
  setFormData,
  id,
  remarks,
  onRemarksChange
}) => {
  const [open, setOpen] = useState(false)
  const [mealData, setmealType] = useState([])
  const [LocalformData, setlocalformData] = useState([])
  const [mealingredientIndex, setmealingredientIndex] = useState('')
  const [ingredientvalueid, setingredientvalueid] = useState({})
  const [headertype, setheadertype] = useState('')
  const [headerMatch, setheaderMatch] = useState('')
  const [dietTypeval, setdietTypeval] = useState('')
  const [dietTypes, setDietTypes] = useState([])
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [diettypechildvalues, setdiettypechildvalues] = useState([])
  const [uomId, setuomId] = useState('')
  const [uomLabel, setuomLabel] = useState('')
  const [errorpop, setErrorpop] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  const [initialValues, setInitialValues] = useState({
    quantity: '',
    meal_value_uom_id: '',
    notes: '',
    feed_uom_name: ''
  })

  const transformedArray = uomprev.map(item => ({
    value: item._id,
    label: item.name
  }))
  console.log(transformedArray, 'transformedArray')

  const handleClickOpen = (index, item, type, dietType) => {
    console.log(item, 'item')
    console.log(type, 'type')
    console.log(index, 'index')

    if (formData.diet_type_name !== 'By Weight') {
      const mealTypeObject = item?.meal_type?.find((meal, mealIndex) => {
        return meal.meal_value_header === type
      })
      console.log(mealTypeObject, 'mealTypeObject')
      setFormValue('quantity', mealTypeObject?.quantity)
      setFormValue('notes', mealTypeObject?.notes)
      setFormValue('feed_uom_name', mealTypeObject?.feed_uom_name)
      setFormValue('meal_value_uom_id', mealTypeObject?.meal_value_uom_id)

      const initialval = mealTypeObject
        ? {
            quantity: mealTypeObject.quantity || '',
            meal_value_uom_id: mealTypeObject.meal_value_uom_id || '',
            notes: mealTypeObject.notes || '',
            feed_uom_name: mealTypeObject.feed_uom_name
              ? { value: mealTypeObject.meal_value_uom_id, label: mealTypeObject.feed_uom_name }
              : ''
          }
        : {
            quantity: '',
            meal_value_uom_id: '',
            notes: '',
            feed_uom_name: ''
          }

      setInitialValues(initialval)
    } else {
      const numericType = type !== 'Generic' ? parseFloat(type) : type
      console.log(numericType, 'numericType')

      const mealTypeObject = item?.meal_type?.find((meal, mealIndex) => {
        // Check if meal_value_header is not equal to 'Generic'
        if (meal.meal_value_header !== 'Generic') {
          return parseFloat(meal.meal_value_header) === numericType
        } else {
          return meal.meal_value_header === numericType
        }
      })
      console.log(mealTypeObject, 'mealTypeObject')
      setFormValue('quantity', mealTypeObject?.quantity)
      setFormValue('notes', mealTypeObject?.notes)
      setFormValue('feed_uom_name', mealTypeObject?.feed_uom_name)
      setFormValue('meal_value_uom_id', mealTypeObject?.meal_value_uom_id)

      const initialval = mealTypeObject
        ? {
            quantity: mealTypeObject.quantity || '',
            meal_value_uom_id: mealTypeObject.meal_value_uom_id || '',
            notes: mealTypeObject.notes || '',
            feed_uom_name: mealTypeObject.feed_uom_name
              ? { value: mealTypeObject.meal_value_uom_id, label: mealTypeObject.feed_uom_name }
              : ''
          }
        : {
            quantity: '',
            meal_value_uom_id: '',
            notes: '',
            feed_uom_name: ''
          }

      setInitialValues(initialval)
    }

    // Then open the dialog
    setOpen(true)
    setmealingredientIndex(index)
    setingredientvalueid(item.mealid)
    setdietTypeval(dietType)
    if (formData.diet_type_name !== 'By Weight') {
      setheadertype(type)
    } else {
      const inputString = type
      const numberOnly = inputString.replace(/[^\d.-]/g, '') // Remove all non-numeric characters
      const textOnly = inputString.replace(/^\s*\d*\s*/, '')

      setheadertype(type)
      type !== 'Generic' ? setheaderMatch(parseFloat(numberOnly)) : setheaderMatch(numberOnly)

      // Find the object in uomprev array where name matches textOnly
      const matchedUom = uomprev.find(item => item.name === textOnly)
      if (matchedUom) {
        setuomId(parseFloat(matchedUom._id))
        setuomLabel(textOnly)
      }
    }
  }

  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    trigger,
    getValues,
    watch,
    setValue: setFormValue
  } = useForm({
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handlePrevClick = () => {
    window.scrollTo(0, 0)
    handlePrev()
  }

  useEffect(() => {
    if (formData) {
      reset(formData)
      setlocalformData(formData)
    }
  }, [formData, reset])

  // Define a function to receive the diet_types values from the child component
  const handleReceiveDietTypes = dietTypesData => {
    console.log(dietTypesData, 'dietTypesData')
    setDietTypes(dietTypesData)
    setActivitySidebarOpen(false)

    const stateforHeader = dietTypesData.map(item => {
      const { weight, unit } = item
      const { name } = unit.value

      return `${weight} ${name}`
    })

    const apival = dietTypesData.map(item => {
      const { weight, unit } = item
      const { _id, name } = unit.value

      return {
        meal_value_header: parseFloat(weight),
        weight_uom_id: parseFloat(_id),
        weight_uom_label: name
      }
    })

    document.cookie = `dietTypeChildValues=${JSON.stringify(stateforHeader)}; path=/`
    document.cookie = `dietTypeChildVal=${JSON.stringify(apival)}; path=/`

    // Check if stateforHeader is an array
    if (Array.isArray(stateforHeader)) {
      setdiettypechildvalues(stateforHeader)
    } else {
      console.error('newState is not an array:', stateforHeader)
    }
  }

  const handleClosed = () => {
    setOpen(false)
    reset(defaultValues)
  }

  const getCookie = name => {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1)
      }
    }

    return null
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  useEffect(() => {
    if (id) {
      //const child = formData.child
      const dietTypeChildValues = getCookie('dietTypeChildValues')
      const dietTypeChildVal = getCookie('dietTypeChildVal')
      if (dietTypeChildValues !== null) {
        const parsedValue = JSON?.parse(dietTypeChildValues)
        const parsedvaldiet = JSON?.parse(dietTypeChildVal)

        const newarr = parsedvaldiet?.map((item, index) => ({
          unit: {
            value: {
              _id: item.weight_uom_id,
              name: item.weight_uom_label,
              description: item.weight_uom_label
            }
          },
          weight: parseInt(item.meal_value_header)
        }))

        setdiettypechildvalues(parsedValue)
        setDietTypes(newarr)
      }
    } else {
      const dietTypeChildValues = getCookie('dietTypeChildValues')
      const dietTypeChildVal = getCookie('dietTypeChildVal')
      if (dietTypeChildValues !== null) {
        const parsedValue = JSON?.parse(dietTypeChildValues)
        const parsedvaldiet = JSON?.parse(dietTypeChildVal)

        const newarr = parsedvaldiet?.map((item, index) => ({
          unit: {
            value: {
              _id: item.weight_uom_id,
              name: item.weight_uom_label,
              description: item.weight_uom_label
            }
          },
          weight: parseInt(item.meal_value_header)
        }))

        setdiettypechildvalues(parsedValue)
        setDietTypes(newarr)
      } else {
        console.error('Cookie "dietTypeChildValues" not found')
      }
    }
  }, [activitySidebarOpen, id])

  const CustomScrollbar = styled('div')({
    overflowX: 'auto', // or 'scroll'
    '&::-webkit-scrollbar': {
      width: 10, // specify your desired width
      height: 4 // specify your desired height
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent' // customize track color if needed
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'lightgray', // customize thumb color if needed
      borderRadius: 5 // specify border radius
    }
  })

  const useStyles = styled({
    table: {
      minWidth: 650
    },
    sticky: {
      position: 'sticky',
      left: 0,
      background: 'white',
      boxShadow: '5px 2px 5px grey',
      borderRight: '2px solid black'
    }
  })
  const classes = useStyles()

  const SelectQuantityclick = (index, item, val) => {
    console.log(val, 'val')
    const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
    if (quantity && feed_uom_name) {
      setErrorpop('')
      if (dietTypeval === 'ingredient') {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData }

        const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].ingredient.findIndex(
            (ingredient, i) => ingredient.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray = updatedFormData.meal_data[addMealIndex].ingredient[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => {
                if (headertype === 'Generic') {
                  return meal.meal_value_header === headertype
                } else {
                  return parseFloat(meal.meal_value_header) === parseFloat(headertype)
                }
              })

              // Update mealTypeArray with weight_uom_id and weight_uom_label if found in the cookie
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    // Conditionally include weight_uom_id and weight_uom_label
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                }
              } else {
                // If an existing object with the same meal_value_header is not found, add a new object
                mealTypeArray.push({
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    // Conditionally include weight_uom_id and weight_uom_label
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                })
              }
            } else {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                }
              } else {
                mealTypeArray.push({
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                })
              }
            }

            updatedFormData.meal_data[addMealIndex].ingredient[ingredientIndex].meal_type = mealTypeArray
          }
        }

        setlocalformData(updatedFormData)
        setOpen(false)
      } else if (dietTypeval === 'recipe') {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData } // Create a copy of formData

        const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].recipe.findIndex(
            (recipe, i) => recipe.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray = updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => {
                if (headertype === 'Generic') {
                  return meal.meal_value_header === headertype
                } else {
                  return parseFloat(meal.meal_value_header) === parseFloat(headertype)
                }
              })
              console.log(existingMealTypeIndex, 'existingMealTypeIndex')
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                }
              } else {
                mealTypeArray.push({
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                })
              }
            } else {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                }
              } else {
                mealTypeArray.push({
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                })
              }
            }
            updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type = mealTypeArray
          }
        }
        setlocalformData(updatedFormData)
        setOpen(false)
        console.log(updatedFormData, 'updatedFormData')
      } else {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData } // Create a copy of formData
        const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].ingredientwithchoice.findIndex(
            (recipe, i) => recipe.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray =
              updatedFormData.meal_data[addMealIndex].ingredientwithchoice[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => {
                if (headertype === 'Generic') {
                  return meal.meal_value_header === headertype
                } else {
                  return parseFloat(meal.meal_value_header) === parseFloat(headertype)
                }
              })
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                }
              } else {
                mealTypeArray.push({
                  meal_value_header: headertype !== 'Generic' ? headerMatch : headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes,
                  ...(headertype !== 'Generic' && {
                    weight_uom_id: uomId,
                    weight_uom_label: uomLabel
                  })
                })
              }
            } else {
              const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)
              if (existingMealTypeIndex !== -1) {
                mealTypeArray[existingMealTypeIndex] = {
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                }
              } else {
                mealTypeArray.push({
                  meal_value_header: headertype,
                  quantity: quantity,
                  meal_value_uom_id: feed_uom_name?.value || meal_value_uom_id,
                  feed_uom_name: feed_uom_name?.label || feed_uom_name,
                  notes: notes
                })
              }
            }

            updatedFormData.meal_data[addMealIndex].ingredientwithchoice[ingredientIndex].meal_type = mealTypeArray
          }
        }

        setlocalformData(updatedFormData)
        setOpen(false)
      }
    } else {
      setOpen(true)
      setErrorpop('Please fill Quantity and Unit')
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  console.log(screenSize.width, 'pppp')

  // useEffect(() => {
  //   const mediaElements = document.getElementsByClassName('cellmodule')
  //   for (const mediaElement of mediaElements) {
  //     if (screenSize.width === 1821) {
  //       if (formData?.diet_type_name === 'By Weight' && formData?.child?.length === 1) {
  //         mediaElement.style.width = '580px'
  //       } else if (formData?.child?.length === 1 || formData?.child?.length === 0) {
  //         mediaElement.style.width = '850px'
  //       } else if (formData?.child?.length === 2) {
  //         mediaElement.style.width = '660px'
  //       } else if (formData?.child?.length > 2) {
  //         mediaElement.style.width = '510px'
  //       } else {
  //         mediaElement.style.width = '566px'
  //       }
  //     } else if (screenSize.width === 1619) {
  //       if (formData?.diet_type_name === 'By Weight' && formData?.child?.length === 1) {
  //         mediaElement.style.width = '580px'
  //       } else if (formData?.child?.length === 1 || formData?.child?.length === 0) {
  //         mediaElement.style.width = '790px'
  //       } else if (formData?.child?.length === 2) {
  //         mediaElement.style.width = '605px'
  //       } else if (formData?.child?.length > 2) {
  //         mediaElement.style.width = '510px'
  //       } else {
  //         mediaElement.style.width = '500px'
  //       }
  //     } else if (screenSize.width === 1457) {
  //       if (formData?.diet_type_name === 'By Weight' && formData?.child?.length === 1) {
  //         mediaElement.style.width = '580px'
  //       } else if (formData?.child?.length === 1 || formData?.child?.length === 0) {
  //         mediaElement.style.width = '680px'
  //       } else if (formData?.child?.length == 2) {
  //         mediaElement.style.width = '518px'
  //       } else if (formData?.child?.length > 2) {
  //         mediaElement.style.width = '500px'
  //       } else {
  //         mediaElement.style.width = '500px'
  //       }
  //     } else if (screenSize.width === 1943) {
  //       if (formData?.diet_type_name === 'By Weight' && formData?.child?.length === 1) {
  //         mediaElement.style.width = '580px'
  //       } else if (formData?.child?.length === 1 || formData?.child?.length === 0) {
  //         mediaElement.style.width = '860px'
  //       } else if (formData?.child?.length > 1) {
  //         mediaElement.style.width = '665px'
  //       } else {
  //         mediaElement.style.width = '568px'
  //       }
  //     }
  //   }
  // }, [screenSize.width])

  useEffect(() => {
    if (formData.diet_type_name === 'By Weight') {
      const updatedFormData = { ...formData, child: diettypechildvalues }
      setlocalformData(updatedFormData) // Update local state
      setFormData(updatedFormData)
    }
  }, [diettypechildvalues, formData.diet_type_name])

  useEffect(() => {
    const updatedFormData = { ...formData }

    // Iterate over meal_data
    updatedFormData.meal_data.forEach(meal => {
      // Check if the meal_data has an ingredient array
      if (meal.ingredient) {
        meal.ingredient.forEach(ingredient => {
          if (ingredient.meal_type && ingredient.meal_type.length > 0) {
            ingredient.meal_type = ingredient.meal_type.filter(mealType => {
              console.log(mealType, 'mealType')
              if (mealType.meal_value_header === 'Generic') return true
              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }

      // Check if the meal_data has an ingredient array
      if (meal.recipe) {
        meal.recipe.forEach(recipe => {
          if (recipe.meal_type && recipe.meal_type.length > 0) {
            recipe.meal_type = recipe.meal_type.filter(mealType => {
              if (mealType.meal_value_header === 'Generic') return true
              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }

      // Check if the meal_data has an ingredient array
      if (meal.ingredientwithchoice) {
        meal.ingredientwithchoice.forEach(ingredientwithchoice => {
          if (ingredientwithchoice.meal_type && ingredientwithchoice.meal_type.length > 0) {
            ingredientwithchoice.meal_type = ingredientwithchoice.meal_type.filter(mealType => {
              if (mealType.meal_value_header === 'Generic') return true
              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }
    })
    setlocalformData(updatedFormData)
    setOpen(false)
  }, [formData.child])

  const onSubmit = async data => {
    console.log(data, 'data')
    const updatedData = { ...data, ...LocalformData }
    console.log(updatedData, 'updatedData')

    handleNext(updatedData)
    reset(defaultValues)
  }

  const Day = [
    { id: 0, name: 'All', isActive: false },
    { id: 1, name: 'Mon', isActive: false },
    { id: 2, name: 'Tue', isActive: false },
    { id: 3, name: 'Wed', isActive: false },
    { id: 4, name: 'Thu', isActive: false },
    { id: 5, name: 'Fri', isActive: false },
    { id: 6, name: 'Sat', isActive: false },
    { id: 7, name: 'Sun', isActive: false }
  ]

  const getDayName = dayId => {
    const day = Day.find(d => d.id === dayId)

    return day ? day.name : ''
  }

  const getModal = (index, item) => {
    console.log(getValues())
    return (
      <Dialog
        className=''
        open={open}
        onClose={handleClosed}
        aria-labelledby='customized-dialog-title'
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'visible',
            width: 500,
            boxShadow: 'none'
          },
          '& .MuiBackdrop-root': {
            backgroundColor: id ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle
          id='customized-dialog-title'
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6'>Add Value</Typography>
          <Icon icon='tabler:x' fontSize='1.25rem' onClick={handleClosed} />
        </DialogTitle>
        <DialogContent>
          {/* <Typography variant='h6'>Add Value</Typography> */}
          <Grid container spacing={5} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='quantity'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      type='number'
                      label='Quantity '
                      name='quantity'
                      onChange={onChange}
                      defaultValue={initialValues.quantity}
                      autoFocus={true}
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                {console.log(uomList, 'uomList')}
                <Controller
                  name='feed_uom_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      onChange={(event, newValue) => {
                        onChange(newValue) // Update the form value
                      }}
                      defaultValue={initialValues.feed_uom_name ? initialValues.feed_uom_name : null}
                      options={transformedArray} // List of options with value and label
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      renderInput={params => (
                        <TextField {...params} label='Select Unit' placeholder='Search & Select' />
                      )}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ pt: 5 }}>
              <Controller
                name='notes'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    multiline
                    fullWidth
                    label='Notes '
                    name='notes'
                    onChange={onChange}
                    id='textarea-outlined'
                    rows={3}
                    defaultValue={initialValues.notes}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 3 }} onClick={() => SelectQuantityclick(index, item)}>
              <Button variant='contained' sx={{ width: '350px', height: '40px' }}>
                ADD Quantity
              </Button>{' '}
            </Grid>
            <Typography sx={{ textAlign: 'center', color: '#ff0000', fontSize: '12px', width: '100%' }}>
              {errorpop}
            </Typography>
          </Grid>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ boxShadow: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Box sx={{ px: 5, mt: 2, float: 'left' }}>
            <Typography variant='h6'>Preview</Typography>
          </Box>

          <Grid container spacing={5} sx={{ mx: 1 }}>
            {/* First Grid item */}
            <Grid item xs={12} sm={4}>
              <div
                item
                md={3}
                xs={12}
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
                    {Array.isArray(formData.diet_image) && formData.diet_image.length > 0 ? (
                      formData.diet_image.map(file => (
                        <Avatar
                          key={file.name}
                          variant='square'
                          alt={file.name}
                          sx={{
                            width: '100%',
                            height: file.name ? '300px' : '250px',
                            borderRadius: 1
                          }}
                          src={URL.createObjectURL(file)}
                        />
                      ))
                    ) : (
                      <Avatar
                        variant='square'
                        src={formData.diet_image ? formData.diet_image : '/icons/recipedummy.svg'}
                        sx={{
                          width: '100%',
                          height: formData.diet_image ? '300px' : '250px',
                          borderRadius: '10px'
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </div>
            </Grid>
            {/* Second Grid item */}
            <Grid item xs={10} sm={7.5}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>
                  <span>Diet Name : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_name}</span>
                </Typography>
                <Typography>
                  <span>Diet Type : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_type_name ? formData.diet_type_name : '-'}</span>
                </Typography>
              </div>
              <Grid sx={{ mt: 5 }}>
                <div>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Description
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      width: '100%',
                      color: '#7A8684',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: expanded ? 'unset' : 3,
                      WebkitBoxOrient: 'vertical',
                      transition: 'max-height 2s ease-in-out',
                      maxHeight: expanded ? '1000px' : '60px'
                    }}
                  >
                    {formData.desc ? convertToTitleCase(formData.desc) : 'No Description to show '}
                  </Typography>
                  {formData.desc.length > 180 ? (
                    <Typography
                      onClick={toggleExpanded}
                      sx={{
                        fontWeight: '600',
                        fontSize: '13px',

                        textDecoration: 'underline',
                        color: '#000',
                        cursor: 'pointer'
                      }}
                    >
                      {expanded ? 'View less' : 'View more'}
                    </Typography>
                  ) : (
                    ''
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Card sx={{ boxShadow: 'none', px: 5 }}>
            <Grid sx={{ overflowX: 'auto' }} value='full'>
              <Typography
                variant='h6'
                sx={formData.diet_type_name === 'By Weight' ? { width: '50%', mt: 3, float: 'left' } : { mb: 3 }}
              >
                Enter Values for Meals
              </Typography>
              {formData.diet_type_name === 'By Weight' ? (
                <Grid container justifyContent='flex-end' sx={{ overflowX: 'auto', pt: 2, pr: 3, width: '50%', mb: 8 }}>
                  <Button onClick={() => setActivitySidebarOpen(true)} variant='contained'>
                    Add Diet Type
                  </Button>
                </Grid>
              ) : (
                ''
              )}
              <Grid sx={{ overflowX: 'auto', pb: 0 }} value='full'>
                <CustomScrollbar
                  style={{
                    maxWidth: '100%'
                  }}
                >
                  <Table aria-label='simple table' style={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            border: 'none',
                            height: '40px',
                            backgroundColor: '#fff',
                            pl: '16px',
                            py: 0,
                            width: '180px',
                            position: 'sticky',
                            left: 0,
                            paddingRight: '0px'
                          }}
                          className={classes.sticky}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              backgroundColor: '#C1D3D04D',
                              paddingLeft: '20px'
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '12px',
                                lineHeight: '16px',
                                fontWeight: 600
                              }}
                            >
                              TIME
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 'none',
                            height: '40px',
                            backgroundColor: '#fff',
                            position: 'sticky',
                            left: '180px',
                            p: 0,
                            width: '500px'
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              backgroundColor: '#C1D3D04D'
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '12px',
                                lineHeight: '16px',
                                fontWeight: 600,
                                pl: 5
                              }}
                            >
                              MEAL DETAILS
                            </Typography>
                          </Box>
                        </TableCell>
                        {formData.diet_type_name === 'By Gender' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '141px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>GENERIC</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '141px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>FEMALE </Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '141px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>MALE</Typography>
                            </TableCell>
                          </>
                        ) : formData.diet_type_name === 'By Lifestage' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '137px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>GENERIC</Typography>
                            </TableCell>
                            {/* {formData.child?.map((all, index) => {
                              return (
                                <TableCell
                                  key={index}
                                  sx={{
                                    border: 'none',
                                    backgroundColor: '#C1D3D099',
                                    height: '40px',
                                    width: '140px',
                                    borderRight: '1px solid #C3CEC7',
                                    textAlign: 'center'
                                  }}
                                >
                                  <Typography>{all}</Typography>
                                </TableCell>
                              )
                            })} */}
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '140px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>Juvenile </Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '140px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>Young</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '140px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>Adult</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '157px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>Undetermined</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>Old</Typography>
                            </TableCell>
                          </>
                        ) : formData.diet_type_name === 'Generic' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '137px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography>GENERIC</Typography>
                            </TableCell>
                          </>
                        ) : formData.diet_type_name === 'By Weight' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '137px',
                                borderRight: '1px solid #C3CEC7',
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>GENERIC</Typography>
                            </TableCell>
                            {formData.child?.map((all, index) => {
                              return (
                                <TableCell
                                  key={index}
                                  sx={{
                                    border: 'none',
                                    backgroundColor: '#C1D3D099',
                                    height: '40px',
                                    width: '140px',
                                    borderRight: '1px solid #C3CEC7',
                                    textAlign: 'center'
                                  }}
                                >
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{all}</Typography>
                                </TableCell>
                              )
                            })}
                          </>
                        ) : (
                          ''
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.meal_data?.map((itemd, index) => {
                        const fromdate = new Date(itemd.meal_from_time)

                        const formattedfromTime = fromdate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                        const todate = new Date(itemd.meal_to_time)

                        const formattedtoTime = todate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                        const startTimes = formattedfromTime
                        const endTimes = formattedtoTime
                        const ind = index

                        return (
                          <>
                            <TableRow key={index} className=''>
                              <TableCell
                                sx={{
                                  position: 'sticky',
                                  left: 0,
                                  width: '180px',
                                  border: 'none',
                                  pl: 0,
                                  pr: '36px',
                                  background: '#fff',
                                  height: '100px',
                                  //display: 'flex',
                                  //flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  overflow: 'hidden'
                                }}
                                component='th'
                                scope='row'
                              >
                                <span
                                  style={{
                                    position: 'absolute', // Change this to absolute
                                    top: '70px', // Center vertically
                                    transform: 'translateY(-50%)', // Adjust to center properly
                                    //display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '70%'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      borderRadius: '25px',
                                      border: `2px dotted #00AFD6`,
                                      py: '5px',
                                      px: '4px'
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        textAlign: 'center',
                                        color: '#00AFD6',
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        lineHeight: '19.36px'
                                      }}
                                    >
                                      {startTimes}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Box sx={{ width: 0, height: '19px', borderLeft: `2px solid #00AFD6` }}></Box>
                                  </Box>

                                  <Box
                                    sx={{
                                      borderRadius: '25px',
                                      border: `2px dotted #00AFD6`,
                                      py: '5px',
                                      px: '4px'
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        textAlign: 'center',
                                        color: '#00AFD6',
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        lineHeight: '19.36px'
                                      }}
                                    >
                                      {endTimes}
                                    </Typography>
                                  </Box>
                                </span>
                              </TableCell>
                              <>
                                {itemd?.ingredient?.map((item, index) => {
                                  console.log(formData?.child?.length, 'lll')

                                  return (
                                    <TableRow key={index} className='tablerowi'>
                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff',
                                          float: 'left'
                                        }}
                                        className={
                                          formData?.diet_type_name === 'By Weight'
                                            ? formData?.child?.length === 1
                                              ? 'cellmodule9'
                                              : formData?.child?.length === 0
                                              ? 'cellmodule1'
                                              : formData?.child?.length === 2
                                              ? 'cellmodule2'
                                              : formData?.child?.length === 3
                                              ? 'cellmodule22'
                                              : formData?.child?.length > 3
                                              ? 'cellmodule3'
                                              : 'cellmodule4' // Default for By Weight if no other condition is met
                                            : formData?.diet_type_name === 'By Gender'
                                            ? formData?.child?.length === 2
                                              ? 'cellmodule5'
                                              : 'cellmodule4' // Default if By Gender does not match other conditions
                                            : formData?.diet_type_name === 'Generic'
                                            ? 'cellmodule6' // Always 'cellmodule6' for Generic
                                            : formData?.diet_type_name === 'By Lifestage'
                                            ? formData?.child?.length > 2
                                              ? 'cellmodule7'
                                              : 'cellmodule4' // Default if By Lifestage does not match other conditions
                                            : 'cellmodule4' // Default for all other cases
                                        }
                                      >
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',

                                            //backgroundColor: '#E1F9ED',
                                            backgroundColor: '#00d6c957',
                                            borderRadius: '8px',
                                            p: '12px',
                                            gap: '16px'
                                          }}
                                        >
                                          <Box>
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex' }}>
                                                {item?.ingredient_name && (
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '16px'
                                                    }}
                                                  >
                                                    {item?.ingredient_name}
                                                  </Typography>
                                                )}
                                                {console.log(item, 'item')}
                                                {item?.preparation_type &&
                                                  (item?.feed_cut_size ? (
                                                    <Typography
                                                      sx={{
                                                        color: '#7A8684',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      &nbsp;-&nbsp; {item?.preparation_type}&nbsp;-&nbsp;
                                                      {item?.feed_cut_size + item.feed_uom_name}
                                                    </Typography>
                                                  ) : (
                                                    <Typography
                                                      sx={{
                                                        color: '#7A8684',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      &nbsp;-&nbsp; {item?.preparation_type}
                                                      {/* {item?.feed_cut_size + item.feed_uom_name} */}
                                                    </Typography>
                                                  ))}
                                              </Box>

                                              {item?.ingredient?.length > 0 && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    gap: '24px'
                                                  }}
                                                >
                                                  {item?.ingredient?.map((item, index) => (
                                                    <Box key={index} sx={{ display: 'flex' }}>
                                                      <Typography
                                                        sx={{
                                                          color: '#1F515B',
                                                          lineHeight: '16.94px',
                                                          fontWeight: 400,
                                                          fontSize: '14px'
                                                        }}
                                                      >
                                                        {item.name}&nbsp;
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          color: '#000',
                                                          lineHeight: '16.94px',
                                                          fontWeight: 600,
                                                          fontSize: '14px'
                                                        }}
                                                      >
                                                        {item?.percentage}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              )}
                                              {(item?.preparationType || item?.desc) && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    gap: '24px'
                                                  }}
                                                >
                                                  {item?.preparationType && (
                                                    <Typography
                                                      sx={{
                                                        color: '#1F515B',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item?.preparationType}
                                                    </Typography>
                                                  )}
                                                  {item?.desc && (
                                                    <Typography
                                                      sx={{
                                                        color: '#1F515B',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item?.desc}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              )}
                                              {item?.remarks && (
                                                <Box
                                                  sx={{
                                                    backgroundColor: '#0000000d',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    p: '12px',
                                                    borderRadius: '8px'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    Remarks
                                                  </Typography>
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {item?.remarks}
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                          {item?.days_of_week?.length > 0 && (
                                            <>
                                              <Divider />
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week?.map((item, index) => (
                                                  <Box
                                                    key={index}
                                                    sx={{
                                                      width: '48px',
                                                      height: '32px',
                                                      borderRadius: '16px',
                                                      backgroundColor: '#0000000d',
                                                      display: 'center',
                                                      justifyContent: 'center',
                                                      alignItems: 'center'
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontWeight: 400,
                                                        fontSize: '13px',
                                                        lineHeight: '18px',
                                                        color: '#44544A'
                                                      }}
                                                    >
                                                      {getDayName(item)}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                              </Box>
                                            </>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                        onClick={() => handleClickOpen(index, item, 'Generic', 'ingredient')}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {console.log(item.meal_type, 'eee')}
                                          <Box
                                            sx={{
                                              backgroundColor: '#0000000d',
                                              p: '10px',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              borderRadius: '8px',
                                              height: '100%'
                                            }}
                                            className={
                                              formData?.diet_type_name === 'By Gender'
                                                ? 'diet_val_container'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                ? 'diet_val_weight'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  formData?.child?.length === 3
                                                ? 'diet_val_weight1'
                                                : 'diet_val_cont'
                                            }
                                          >
                                            <Typography
                                              sx={{
                                                color: '#000',
                                                lineHeight: '16.94px',
                                                fontWeight: 400,
                                                fontSize: '14px'
                                              }}
                                            >
                                              {console.log(index, 'index')}
                                              {/* {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Generic'
                                                      ? meal.quantity +
                                                          (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                      : ''
                                                  })
                                                : 'Add'} */}
                                              {item.meal_type
                                                ? item.meal_type
                                                    .map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                    .filter(Boolean).length === 0
                                                  ? 'Add'
                                                  : item.meal_type.map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      {formData.child?.map((all, indexnew) => {
                                        if (all !== 'Generic') {
                                          return (
                                            <TableCell
                                              key={index}
                                              style={{
                                                paddingLeft: '8px',
                                                paddingRight: '8px',
                                                height: '10px',
                                                maxHeight: '100%',
                                                border: 'none'
                                              }}
                                              onClick={() => handleClickOpen(index, item, all, 'ingredient')}
                                            >
                                              <Box
                                                sx={{
                                                  height: '100%'
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    backgroundColor: '#0000000d',
                                                    p: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderRadius: '8px',
                                                    height: '100%'
                                                  }}
                                                  className={
                                                    formData?.diet_type_name === 'By Gender'
                                                      ? 'diet_val_container'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                      ? 'diet_val_weight'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        formData?.child?.length === 3
                                                      ? 'diet_val_weight1'
                                                      : 'diet_val_cont'
                                                  }
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {/* {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          if (all.includes(meal.meal_value_header)) {
                                                            return (
                                                              meal.quantity +
                                                              (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            )
                                                          } else {
                                                            return ''
                                                          }
                                                        })
                                                      : item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : ''
                                                        })
                                                      : 'Add'} */}
                                                    {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                      : item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                      : 'Add'}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            </TableCell>
                                          )
                                        }
                                      })}

                                      {getModal(index, item)}
                                    </TableRow>
                                  )
                                })}
                              </>
                              <>
                                {itemd?.recipe?.map((item, index) => {
                                  return (
                                    <TableRow key={index} className='tablerowi'>
                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff',
                                          float: 'left'
                                        }}
                                        className={
                                          formData?.diet_type_name === 'By Weight'
                                            ? formData?.child?.length === 1
                                              ? 'cellmodule9'
                                              : formData?.child?.length === 0
                                              ? 'cellmodule1'
                                              : formData?.child?.length === 2
                                              ? 'cellmodule2'
                                              : formData?.child?.length === 3
                                              ? 'cellmodule22'
                                              : formData?.child?.length > 3
                                              ? 'cellmodule3'
                                              : 'cellmodule4' // Default for By Weight if no other condition is met
                                            : formData?.diet_type_name === 'By Gender'
                                            ? formData?.child?.length === 2
                                              ? 'cellmodule5'
                                              : 'cellmodule4' // Default if By Gender does not match other conditions
                                            : formData?.diet_type_name === 'Generic'
                                            ? 'cellmodule6' // Always 'cellmodule6' for Generic
                                            : formData?.diet_type_name === 'By Lifestage'
                                            ? formData?.child?.length > 2
                                              ? 'cellmodule7'
                                              : 'cellmodule4' // Default if By Lifestage does not match other conditions
                                            : 'cellmodule4' // Default for all other cases
                                        }
                                      >
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',

                                            //backgroundColor: '#E1F9ED',
                                            backgroundColor: '#E1F9ED',
                                            borderRadius: '8px',
                                            p: '12px',
                                            gap: '16px'
                                          }}
                                        >
                                          <Box>
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex' }}>
                                                {item?.recipe_name && (
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '16px'
                                                    }}
                                                  >
                                                    {item?.recipe_name}
                                                  </Typography>
                                                )}
                                              </Box>
                                              {console.log(item, 'kkkk')}
                                              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                {item?.ingredient_name && item.ingredient_name.length > 0 && (
                                                  <Typography
                                                    sx={{
                                                      color: '#7A8684',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px',
                                                      display: 'flex',
                                                      flexWrap: 'wrap'
                                                    }}
                                                  >
                                                    {item?.ingredient_name.map((name, index) => (
                                                      <Box
                                                        key={index}
                                                        sx={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          marginRight: '10px'
                                                        }}
                                                      >
                                                        {name}
                                                        <Typography
                                                          component='span'
                                                          sx={{
                                                            fontWeight: 'bold',
                                                            marginLeft: '2px',
                                                            fontSize: '14px',
                                                            lineHeight: '1.7rem'
                                                          }}
                                                        >
                                                          {parseFloat(item?.quantity[index])}
                                                          {''}
                                                          {item?.quantity_type[index] === 'percentage' ? '%' : ''}
                                                        </Typography>
                                                      </Box>
                                                    ))}
                                                  </Typography>
                                                )}
                                                {item?.ingredients?.length > 0 &&
                                                  item?.ingredients.map((name, index) => (
                                                    <Box
                                                      key={index}
                                                      sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginRight: '10px',
                                                        backgroundColor: '#00D6C933',
                                                        m: 1,
                                                        borderRadius: '16px',
                                                        px: '10px',
                                                        gap: '8px'
                                                      }}
                                                    >
                                                      {name?.ingredient_name}
                                                      <Typography
                                                        component='span'
                                                        sx={{
                                                          fontWeight: 'bold',
                                                          marginLeft: '2px',
                                                          fontSize: '14px',
                                                          lineHeight: '1.7rem'
                                                        }}
                                                      >
                                                        {parseFloat(name?.quantity)}
                                                        {''}
                                                        {name?.quantity_type === 'percentage' ? '%' : ''}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                              </Box>

                                              {item?.recipe?.length > 0 && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    gap: '24px'
                                                  }}
                                                >
                                                  {item?.recipe?.map((item, index) => (
                                                    <Box key={index} sx={{ display: 'flex' }}>
                                                      <Typography
                                                        sx={{
                                                          color: '#1F515B',
                                                          lineHeight: '16.94px',
                                                          fontWeight: 400,
                                                          fontSize: '14px'
                                                        }}
                                                      >
                                                        {item.name}&nbsp;
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          color: '#000',
                                                          lineHeight: '16.94px',
                                                          fontWeight: 600,
                                                          fontSize: '14px'
                                                        }}
                                                      >
                                                        {item?.percentage}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              )}
                                              {(item?.preparationType || item?.desc) && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    gap: '24px'
                                                  }}
                                                >
                                                  {item?.preparationType && (
                                                    <Typography
                                                      sx={{
                                                        color: '#1F515B',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item?.preparationType}
                                                    </Typography>
                                                  )}
                                                  {item?.desc && (
                                                    <Typography
                                                      sx={{
                                                        color: '#1F515B',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item?.desc}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              )}
                                              {item?.remarks && (
                                                <Box
                                                  sx={{
                                                    backgroundColor: '#0000000d',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    p: '12px',
                                                    borderRadius: '8px'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    Remarks
                                                  </Typography>
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {item?.remarks}
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                          {item?.days_of_week?.length > 0 && (
                                            <>
                                              <Divider />
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week?.map((item, index) => (
                                                  <Box
                                                    key={index}
                                                    sx={{
                                                      width: '48px',
                                                      height: '32px',
                                                      borderRadius: '16px',
                                                      backgroundColor: '#0000000d',
                                                      display: 'center',
                                                      justifyContent: 'center',
                                                      alignItems: 'center'
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontWeight: 400,
                                                        fontSize: '13px',
                                                        lineHeight: '18px',
                                                        color: '#44544A'
                                                      }}
                                                    >
                                                      {getDayName(item)}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                              </Box>
                                            </>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                        onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {console.log(item.meal_type, 'eee')}
                                          <Box
                                            sx={{
                                              backgroundColor: '#0000000d',
                                              p: '10px',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              borderRadius: '8px',
                                              height: '100%'
                                            }}
                                            className={
                                              formData?.diet_type_name === 'By Gender'
                                                ? 'diet_val_container'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                ? 'diet_val_weight'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  formData?.child?.length === 3
                                                ? 'diet_val_weight1'
                                                : 'diet_val_cont'
                                            }
                                          >
                                            <Typography
                                              sx={{
                                                color: '#000',
                                                lineHeight: '16.94px',
                                                fontWeight: 400,
                                                fontSize: '14px'
                                              }}
                                            >
                                              {console.log(index, 'index')}
                                              {/* {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Generic'
                                                      ? meal.quantity +
                                                          (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                      : ''
                                                  })
                                                : 'Add'} */}
                                              {item.meal_type
                                                ? item.meal_type
                                                    .map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                    .filter(Boolean).length === 0
                                                  ? 'Add'
                                                  : item.meal_type.map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      {formData.child?.map((all, indexnew) => {
                                        if (all !== 'Generic') {
                                          return (
                                            <TableCell
                                              key={index}
                                              style={{
                                                paddingLeft: '8px',
                                                paddingRight: '8px',
                                                height: '10px',
                                                maxHeight: '100%',
                                                border: 'none'
                                              }}
                                              onClick={() => handleClickOpen(index, item, all, 'recipe')}
                                            >
                                              <Box
                                                sx={{
                                                  height: '100%'
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    backgroundColor: '#0000000d',
                                                    p: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderRadius: '8px',
                                                    height: '100%'
                                                  }}
                                                  className={
                                                    formData?.diet_type_name === 'By Gender'
                                                      ? 'diet_val_container'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                      ? 'diet_val_weight'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        formData?.child?.length === 3
                                                      ? 'diet_val_weight1'
                                                      : 'diet_val_cont'
                                                  }
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {/* {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          if (all.includes(meal.meal_value_header)) {
                                                            return (
                                                              meal.quantity +
                                                              (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            )
                                                          } else {
                                                            return ''
                                                          }
                                                        })
                                                      : item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : ''
                                                        })
                                                      : 'Add'} */}
                                                    {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                      : item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                      : 'Add'}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            </TableCell>
                                          )
                                        }
                                      })}
                                      {getModal(index, item)}
                                    </TableRow>
                                  )
                                })}
                              </>
                              <>
                                {itemd?.ingredientwithchoice?.map((item, index) => {
                                  return (
                                    <TableRow key={index} className='tablerowi'>
                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff',
                                          float: 'left'
                                        }}
                                        className={
                                          formData?.diet_type_name === 'By Weight'
                                            ? formData?.child?.length === 1
                                              ? 'cellmodule9'
                                              : formData?.child?.length === 0
                                              ? 'cellmodule1'
                                              : formData?.child?.length === 2
                                              ? 'cellmodule2'
                                              : formData?.child?.length === 3
                                              ? 'cellmodule22'
                                              : formData?.child?.length > 3
                                              ? 'cellmodule3'
                                              : 'cellmodule4' // Default for By Weight if no other condition is met
                                            : formData?.diet_type_name === 'By Gender'
                                            ? formData?.child?.length === 2
                                              ? 'cellmodule5'
                                              : 'cellmodule4' // Default if By Gender does not match other conditions
                                            : formData?.diet_type_name === 'Generic'
                                            ? 'cellmodule6' // Always 'cellmodule6' for Generic
                                            : formData?.diet_type_name === 'By Lifestage'
                                            ? formData?.child?.length > 2
                                              ? 'cellmodule7'
                                              : 'cellmodule4' // Default if By Lifestage does not match other conditions
                                            : 'cellmodule4' // Default for all other cases
                                        }
                                      >
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',

                                            //backgroundColor: '#E1F9ED',
                                            backgroundColor: '#00d6c957',
                                            borderRadius: '8px',
                                            p: '12px',
                                            gap: '16px'
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '12px'
                                            }}
                                          >
                                            {item?.no_of_component_required && (
                                              <Typography
                                                sx={{
                                                  color: '#000',
                                                  lineHeight: '16.94px',
                                                  fontWeight: 600,
                                                  fontSize: '16px'
                                                }}
                                              >
                                                Offer minimum {item?.no_of_component_required} from the below items
                                              </Typography>
                                            )}

                                            {item?.ingredientList?.length > 0 && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  flexWrap: 'wrap',
                                                  columnGap: `24px`,
                                                  rowGap: '10px'
                                                }}
                                              >
                                                {item?.ingredientList?.map((item, index) => (
                                                  <>
                                                    <Box
                                                      key={index}
                                                      sx={{
                                                        height: '32px',
                                                        borderRadius: '16px',
                                                        backgroundColor: '#1F415B1A',
                                                        display: 'center',
                                                        px: 2,
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                      }}
                                                    >
                                                      <Typography
                                                        sx={{
                                                          fontWeight: 600,
                                                          fontSize: '14px',
                                                          lineHeight: '16.94px',
                                                          color: '#1F415B'
                                                        }}
                                                      >
                                                        {item?.ingredient_name}
                                                      </Typography>
                                                      {item?.feed_cut_size ? (
                                                        <Typography
                                                          sx={{
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            lineHeight: '18px',
                                                            color: '#1F415B'
                                                          }}
                                                        >
                                                          &nbsp;-&nbsp; {item?.preparation_type}&nbsp;-&nbsp;
                                                          {item?.feed_cut_size + item.feed_uom_name}
                                                        </Typography>
                                                      ) : (
                                                        <Typography
                                                          sx={{
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            lineHeight: '18px',
                                                            color: '#1F415B'
                                                          }}
                                                        >
                                                          &nbsp;-&nbsp; {item?.preparation_type}
                                                        </Typography>
                                                      )}
                                                    </Box>
                                                  </>
                                                ))}
                                              </Box>
                                            )}

                                            {item?.remarks && (
                                              <Box
                                                sx={{
                                                  backgroundColor: '#0000000d',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  p: '12px',
                                                  borderRadius: '8px'
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    color: '#000',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  Remarks
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    color: '#000',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {item?.remarks}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                          {item?.days_of_week?.length > 0 && (
                                            <>
                                              <Divider />
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week?.map((item, index) => (
                                                  <Box
                                                    key={index}
                                                    sx={{
                                                      width: '48px',
                                                      height: '32px',
                                                      borderRadius: '16px',
                                                      backgroundColor: '#0000000d',
                                                      display: 'center',
                                                      justifyContent: 'center',
                                                      alignItems: 'center'
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        fontWeight: 400,
                                                        fontSize: '13px',
                                                        lineHeight: '18px',
                                                        color: '#44544A'
                                                      }}
                                                    >
                                                      {getDayName(item)}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                              </Box>
                                            </>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                        onClick={() => handleClickOpen(index, item, 'Generic', 'ingredientwithchoice')}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {console.log(item.meal_type, 'eee')}
                                          <Box
                                            sx={{
                                              backgroundColor: '#0000000d',
                                              p: '10px',

                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              borderRadius: '8px',
                                              height: '100%'
                                            }}
                                            className={
                                              formData?.diet_type_name === 'By Gender'
                                                ? 'diet_val_container'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                ? 'diet_val_weight'
                                                : formData?.diet_type_name === 'By Weight' &&
                                                  formData?.child?.length === 3
                                                ? 'diet_val_weight1'
                                                : 'diet_val_cont'
                                            }
                                          >
                                            <Typography
                                              sx={{
                                                color: '#000',
                                                lineHeight: '16.94px',
                                                fontWeight: 400,
                                                fontSize: '14px'
                                              }}
                                            >
                                              {console.log(index, 'index')}
                                              {/* {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Generic'
                                                      ? meal.quantity +
                                                          (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                      : ''
                                                  })
                                                : 'Add'} */}
                                              {item.meal_type
                                                ? item.meal_type
                                                    .map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                    .filter(Boolean).length === 0
                                                  ? 'Add'
                                                  : item.meal_type.map((meal, i) => {
                                                      return meal.meal_value_header === 'Generic'
                                                        ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                        : null
                                                    })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      {formData.child?.map((all, indexnew) => {
                                        if (all !== 'Generic') {
                                          return (
                                            <TableCell
                                              key={index}
                                              style={{
                                                paddingLeft: '8px',
                                                paddingRight: '8px',
                                                height: '10px',
                                                maxHeight: '100%',
                                                border: 'none'
                                              }}
                                              onClick={() => handleClickOpen(index, item, all, 'ingredientwithchoice')}
                                            >
                                              <Box
                                                sx={{
                                                  height: '100%'
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    backgroundColor: '#0000000d',
                                                    p: '10px',

                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderRadius: '8px',
                                                    height: '100%'
                                                  }}
                                                  className={
                                                    formData?.diet_type_name === 'By Gender'
                                                      ? 'diet_val_container'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        (formData?.child?.length === 2 || formData?.child?.length === 1)
                                                      ? 'diet_val_weight'
                                                      : formData?.diet_type_name === 'By Weight' &&
                                                        formData?.child?.length === 3
                                                      ? 'diet_val_weight1'
                                                      : 'diet_val_cont'
                                                  }
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {/* {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          if (all.includes(meal.meal_value_header)) {
                                                            return (
                                                              meal.quantity +
                                                              (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            )
                                                          } else {
                                                            return ''
                                                          }
                                                        })
                                                      : item.meal_type
                                                      ? item.meal_type.map((meal, i) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : ''
                                                        })
                                                      : 'Add'} */}
                                                    {formData.diet_type_name === 'By Weight' && item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            if (all.includes(meal.meal_value_header)) {
                                                              return (
                                                                meal.quantity +
                                                                (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              )
                                                            }
                                                            // Return null for elements that do not match the condition
                                                            return null
                                                          })
                                                      : item.meal_type
                                                      ? item.meal_type
                                                          .map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                          .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal, i) => {
                                                            return meal.meal_value_header === all
                                                              ? meal.quantity +
                                                                  (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                              : null
                                                          })
                                                      : 'Add'}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            </TableCell>
                                          )
                                        }
                                      })}
                                      {getModal(index, item)}
                                    </TableRow>
                                  )
                                })}
                              </>
                            </TableRow>
                            {itemd.notes ? (
                              <TableRow sx={{ width: '100%', borderBottom: '1px solid #C3CEC7', pb: 3 }}>
                                <Typography
                                  sx={{
                                    width: '100%',
                                    display: 'block',
                                    pb: 3
                                  }}
                                >
                                  <span style={{ fontWeight: 'bold', color: 'rgb(0 0 0 / 67%)' }}>Notes :</span>{' '}
                                  {itemd.notes}
                                </Typography>
                              </TableRow>
                            ) : (
                              ''
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CustomScrollbar>
                <Grid item xs={12} sx={{ pt: 10, pb: 8 }}>
                  <Controller
                    name='remarks'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange } }) => (
                      <TextField
                        multiline
                        fullWidth
                        value={remarks}
                        label='Remarks (Optional)'
                        name='remarks'
                        onChange={e => {
                          onChange(e) // Update react-hook-form state
                          onRemarksChange(e.target.value) // Update formData state in AddDiet
                        }}
                        id='textarea-outlined'
                        rows={5}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Card>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12, mx: 6 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrevClick}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                Go back
              </Button>
              <Button
                onClick={finalhandleSubmit}
                variant='contained'
                endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}
              >
                Submit
              </Button>
            </Box>
          </Grid>
        </Card>
      </form>
      <AddDietType
        setActivitySidebarOpen={setActivitySidebarOpen}
        activitySidebarOpen={activitySidebarOpen}
        onReceiveDietTypes={handleReceiveDietTypes}
        dietTypes={dietTypes}
      />
    </>
  )
}

export default StepPreviewDiet
