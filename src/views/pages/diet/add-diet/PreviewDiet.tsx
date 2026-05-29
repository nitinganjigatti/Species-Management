import React, { useState, useEffect } from 'react'

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
  TableRow,
  CircularProgress,
  useMediaQuery
} from '@mui/material'
import { Divider, Card } from '@mui/material'
import AddDietType from './AddDietType'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { t } from 'i18next'

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

interface Props {
  formData: any
  handleNext: (...args: any[]) => void
  handlePrev: (...args: any[]) => void
  uomList: any[]
  finalhandleSubmit: (...args: any[]) => void
  uomprevnew: any[]
  setFormData: (...args: any[]) => void
  id: any
  remarks: any
  onRemarksChange: (...args: any[]) => void
  loader: any
}

const StepPreviewDiet = ({
  formData,
  handleNext,
  handlePrev,
  uomList,
  finalhandleSubmit,
  uomprevnew,
  setFormData,
  id,
  remarks,
  onRemarksChange,
  loader
}: Props) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState<boolean>(false)
  const [mealData, setmealType] = useState<any[]>([])
  const [LocalformData, setlocalformData] = useState<any[]>([])
  const [mealingredientIndex, setmealingredientIndex] = useState<string>('')
  const [ingredientvalueid, setingredientvalueid] = useState<Record<string, any>>({})
  const [headertype, setheadertype] = useState<string>('')
  const [headerMatch, setheaderMatch] = useState<any>('')
  const [dietTypeval, setdietTypeval] = useState<string>('')
  const [dietTypes, setDietTypes] = useState<any[]>([])
  const [activitySidebarOpen, setActivitySidebarOpen] = useState<boolean>(false)
  const [diettypechildvalues, setdiettypechildvalues] = useState<any[]>([])
  const [uomId, setuomId] = useState<string | number>('')
  const [uomLabel, setuomLabel] = useState<string>('')
  const [errorpop, setErrorpop] = useState<string>('')
  const [expanded, setExpanded] = useState<boolean>(false)

  const [screenSize, setScreenSize] = useState<any>({
    width: window.innerWidth,
    height: window.innerHeight
  })

  const [initialValues, setInitialValues] = useState<any>({
    quantity: '',
    meal_value_uom_id: '',
    notes: '',
    feed_uom_name: ''
  })

  const transformedArray = uomprevnew.map(item => ({
    value: item._id,
    label: item.name
  }))

  const handleClickOpen = (index: any, item: any, type: any, dietType: any) => {
    const getUomValues = (mealTypeObject: any) => {
      return {
        feedUomName: item?.portion_uom_id ? item.portion_uom_name : mealTypeObject?.feed_uom_name,
        mealValueUomId: item?.portion_uom_id ? item.portion_uom_id : mealTypeObject?.meal_value_uom_id
      }
    }
    if (formData.diet_type_name !== 'By Weight') {
      const mealTypeObject = item?.meal_type?.find((meal: any) => meal.meal_value_header === type)
      const { feedUomName, mealValueUomId } = getUomValues(mealTypeObject)

      setFormValue('quantity', mealTypeObject?.quantity)
      setFormValue('notes', mealTypeObject?.notes)
      setFormValue('feed_uom_name', feedUomName)
      setFormValue('meal_value_uom_id', mealValueUomId)

      const initialval = mealTypeObject
        ? {
          quantity: mealTypeObject.quantity || '',
          meal_value_uom_id: mealValueUomId || '',
          notes: mealTypeObject.notes || '',
          feed_uom_name: feedUomName ? { value: mealValueUomId, label: feedUomName } : '',
          check: item?.portion_uom_id ? 'recipe' : ''
        }
        : {
          quantity: '',
          meal_value_uom_id: mealValueUomId || '',
          notes: '',
          feed_uom_name: feedUomName ? { value: mealValueUomId, label: feedUomName } : '',
          check: item?.portion_uom_id ? 'recipe' : ''
        }

      setInitialValues(initialval)
    } else {
      const numericType = type !== 'Generic' ? parseFloat(type) : type

      const mealTypeObject = item?.meal_type?.find((meal: any, mealIndex: any) => {
        if (meal.meal_value_header !== 'Generic') {
          return parseFloat(meal.meal_value_header) === numericType
        } else {
          return meal.meal_value_header === numericType
        }
      })
      const { feedUomName, mealValueUomId } = getUomValues(mealTypeObject)

      setFormValue('quantity', mealTypeObject?.quantity)
      setFormValue('notes', mealTypeObject?.notes)
      setFormValue('feed_uom_name', feedUomName)
      setFormValue('meal_value_uom_id', mealValueUomId)

      const initialval = mealTypeObject
        ? {
          quantity: mealTypeObject.quantity || '',
          meal_value_uom_id: mealValueUomId || '',
          notes: mealTypeObject.notes || '',
          feed_uom_name: feedUomName ? { value: mealValueUomId, label: feedUomName } : '',
          check: item?.portion_uom_id ? 'recipe' : ''
        }
        : {
          quantity: '',
          meal_value_uom_id: mealValueUomId || '',
          notes: '',
          feed_uom_name: feedUomName ? { value: mealValueUomId, label: feedUomName } : '',
          check: item?.portion_uom_id ? 'recipe' : ''
        }

      setInitialValues(initialval)
    }

    setOpen(true)
    setmealingredientIndex(index)
    setingredientvalueid(item.mealid)
    setdietTypeval(dietType)
    if (formData.diet_type_name !== 'By Weight') {
      setheadertype(type)
    } else {
      const inputString = type
      const numberOnly = inputString.replace(/[^\d.-]/g, '')
      const textOnly = inputString.replace(/^\s*\d*\s*/, '')

      setheadertype(type)
      type !== 'Generic' ? setheaderMatch(parseFloat(numberOnly)) : setheaderMatch(numberOnly)

      const matchedUom = uomprevnew.find(item => item.name === textOnly)
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
  } = useForm<any>({
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

  const handleReceiveDietTypes = (dietTypesData: any) => {
    setDietTypes(dietTypesData)
    setActivitySidebarOpen(false)

    const stateforHeader = dietTypesData.map((item: any) => {
      const { weight, unit } = item
      const { name } = unit.value

      return `${weight} ${name}`
    })

    const apival = dietTypesData.map((item: any) => {
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

  const getCookie = (name: any) => {
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

  const convertToTitleCase = (str: any) => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  useEffect(() => {
    if (id) {
      const dietTypeChildValues = getCookie('dietTypeChildValues')
      const dietTypeChildVal = getCookie('dietTypeChildVal')
      if (dietTypeChildValues !== null) {
        const parsedValue = JSON?.parse(dietTypeChildValues)
        const parsedvaldiet = JSON?.parse(dietTypeChildVal ?? '')

        const newarr = parsedvaldiet?.map((item: any, index: any) => ({
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
        const parsedvaldiet = JSON?.parse(dietTypeChildVal ?? '')

        const newarr = parsedvaldiet?.map((item: any, index: any) => ({
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
        return
      }
    }
  }, [activitySidebarOpen, id])

  const CustomScrollbar = styled('div')({
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      width: 10,
      height: 4
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'lightgray',
      borderRadius: 5
    }
  })

  const useStyles = (styled as any)({
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

  const SelectQuantityclick = (index: any, item: any, val?: any) => {
    const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
    if (quantity && feed_uom_name) {
      setErrorpop('')
      if (dietTypeval === 'ingredient') {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData }

        const addMealIndex = updatedFormData.meal_data.findIndex((meal: any) => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].ingredient.findIndex(
            (ingredient: any, i: any) => ingredient.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray = updatedFormData.meal_data[addMealIndex].ingredient[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => {
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
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => meal.meal_value_header === headertype)
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
        const updatedFormData = { ...formData }
        const addMealIndex = updatedFormData.meal_data.findIndex((meal: any) => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].recipe.findIndex(
            (recipe: any, i: any) => recipe.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray = updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => {
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
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => meal.meal_value_header === headertype)
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
      } else if (dietTypeval === 'combo') {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData }

        const addMealIndex = updatedFormData.meal_data.findIndex((meal: any) => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].combo.findIndex(
            (recipe: any, i: any) => recipe.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray = updatedFormData.meal_data[addMealIndex].combo[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => {
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
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => meal.meal_value_header === headertype)
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
            updatedFormData.meal_data[addMealIndex].combo[ingredientIndex].meal_type = mealTypeArray
          }
        }
        setlocalformData(updatedFormData)
        setOpen(false)
      } else {
        const { quantity, meal_value_uom_id, notes, feed_uom_name } = getValues()
        const updatedFormData = { ...formData }
        const addMealIndex = updatedFormData.meal_data.findIndex((meal: any) => meal.mealid === ingredientvalueid)

        if (addMealIndex !== -1) {
          const ingredientIndex = updatedFormData.meal_data[addMealIndex].ingredientwithchoice.findIndex(
            (recipe: any, i: any) => recipe.mealid === ingredientvalueid && i === mealingredientIndex
          )

          if (ingredientIndex !== -1) {
            const mealTypeArray =
              updatedFormData.meal_data[addMealIndex].ingredientwithchoice[ingredientIndex].meal_type || []

            if (formData.diet_type_name === 'By Weight') {
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => {
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
              const existingMealTypeIndex = mealTypeArray.findIndex((meal: any) => meal.meal_value_header === headertype)
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

  useEffect(() => {
    if (formData.diet_type_name === 'By Weight') {
      const updatedFormData = { ...formData, child: diettypechildvalues }
      setlocalformData(updatedFormData)
      setFormData(updatedFormData)
    }
  }, [diettypechildvalues, formData.diet_type_name])

  useEffect(() => {
    const updatedFormData = { ...formData }

    updatedFormData.meal_data.forEach((meal: any) => {
      if (meal.ingredient) {
        meal.ingredient.forEach((ingredient: any) => {
          if (ingredient.meal_type && ingredient.meal_type.length > 0) {
            ingredient.meal_type = ingredient.meal_type.filter((mealType: any) => {
              if (mealType.meal_value_header === 'Generic') return true

              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }

      if (meal.recipe) {
        meal.recipe.forEach((recipe: any) => {
          if (recipe.meal_type && recipe.meal_type.length > 0) {
            recipe.meal_type = recipe.meal_type.filter((mealType: any) => {
              if (mealType.meal_value_header === 'Generic') return true

              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }

      if (meal.combo) {
        meal.combo.forEach((recipe: any) => {
          if (recipe.meal_type && recipe.meal_type.length > 0) {
            recipe.meal_type = recipe.meal_type.filter((mealType: any) => {
              if (mealType.meal_value_header === 'Generic') return true

              return formData.diet_type_name === 'By Weight'
                ? getCookie('dietTypeChildValues')?.includes(mealType.meal_value_header)
                : formData.child?.includes(mealType.meal_value_header)
            })
          }
        })
      }

      if (meal.ingredientwithchoice) {
        meal.ingredientwithchoice.forEach((ingredientwithchoice: any) => {
          if (ingredientwithchoice.meal_type && ingredientwithchoice.meal_type.length > 0) {
            ingredientwithchoice.meal_type = ingredientwithchoice.meal_type.filter((mealType: any) => {
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

  const onSubmit = async (data: any) => {
    const updatedData = { ...data, ...LocalformData }

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

  const getDayName = (dayId: any) => {
    const day = Day.find(d => d.id === dayId)

    return day ? day.name : ''
  }

  const handleclickRecipeDetail = (val: any) => {
    const url = `/diet/recipe/${val}`
    window.open(url, '_blank')
  }

  const handleclickComboDetail = (val: any) => {
    const url = `/diet/combo/${val}`
    window.open(url, '_blank')
  }

  const getModal = (index: any, item: any, val: any) => {
    return (
      <Dialog
        className=''
        open={open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleClosed()
          }
        }}
        disableEscapeKeyDown
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
          component='div'
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6'>Add Value</Typography>
          <Icon style={{ cursor: 'pointer' }} icon='tabler:x' fontSize='1.25rem' onClick={handleClosed} />
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={5} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                {initialValues?.check === 'recipe' ? (
                  <Controller
                    name='feed_uom_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        onChange={(event, newValue) => {
                          onChange(newValue)
                        }}
                        defaultValue={initialValues.feed_uom_name ? initialValues.feed_uom_name : null}
                        options={transformedArray}
                        getOptionLabel={option => option.label}
                        disabled
                        renderInput={params => (
                          <TextField {...params} label='Select Unit' placeholder='Search & Select' />
                        )}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    name='feed_uom_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        onChange={(event, newValue) => {
                          onChange(newValue)
                        }}
                        defaultValue={initialValues.feed_uom_name ? initialValues.feed_uom_name : null}
                        options={transformedArray}
                        getOptionLabel={option => option.label}
                        renderInput={params => (
                          <TextField {...params} label='Select Unit' placeholder='Search & Select' />
                        )}
                      />
                    )}
                  />
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ pt: 5 }}>
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
            <Grid
              size={{ xs: 12 }}
              sx={{ textAlign: 'center', mb: 3 }}
              onClick={() => SelectQuantityclick(index, item)}
            >
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
          <Box sx={{ px: 5, mt: 2, pb: 3, float: 'left' }}>
            <Typography variant='h6'>{t('preview')}</Typography>
          </Box>

          <Grid container spacing={5} sx={{ px: 5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
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
                    formData.diet_image.map((file: any) => (
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
            </Grid>

            <Grid size={{ xs: 10, sm: 7.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>
                  <span>{t('diet_module.diet_name')} : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_name}</span>
                </Typography>
                <Typography>
                  <span>{t('diet_module.diet_type')} : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_type_name ? formData.diet_type_name : '-'}</span>
                </Typography>
              </div>
              <div>
                <Typography sx={{ mt: 2 }}>
                  <span>{t('diet_module.nutritionist')} : </span>
                  <span style={{ fontWeight: 600 }}>{formData.dietitian_name}</span>
                </Typography>
              </div>
              <Grid sx={{ mt: 5 }}>
                <div>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('description')}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      width: '100%',
                      color: theme.palette.customColors.secondaryBg,
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
                        color: theme.palette.customColors.neutralPrimary,
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
            <Grid sx={{ overflowX: 'auto' }} {...({ value: 'full' } as any)}>
              <Typography
                variant='h6'
                sx={formData.diet_type_name === 'By Weight' ? { width: '50%', mt: 3, float: 'left' } : { mb: 3 }}
              >
                {t('diet_module.value_for_meals')}
              </Typography>
              {formData.diet_type_name === 'By Weight' ? (
                <Grid
                  container
                  sx={{
                    justifyContent: 'flex-end',
                    overflowX: 'auto',
                    pt: 2,
                    pr: 3,
                    width: '50%',
                    mb: 8
                  }}
                >
                  <Button onClick={() => setActivitySidebarOpen(true)} variant='contained'>
                    {t('diet_module.add_diet_type')}
                  </Button>
                </Grid>
              ) : (
                ''
              )}
              <Grid sx={{ overflowX: 'auto', pb: 0 }} {...({ value: 'full' } as any)}>
                <CustomScrollbar
                  style={{
                    maxWidth: '100%'
                  }}
                >
                  <Table aria-label='simple table' style={{ tableLayout: 'fixed', width: 'max-content' }}>
                    <TableHead
                      sx={{
                        backgroundColor: theme.palette.secondary.contrastText,
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.contrastText
                        }
                      }}
                    >
                      <TableRow
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.secondary.contrastText,
                            boxShadow: 'none'
                          }
                        }}
                      >
                        <TableCell
                          sx={{
                            border: 'none',
                            height: '40px',
                            backgroundColor: theme.palette.secondary.contrastText,
                            pl: '0 !important',
                            py: 0,
                            width: '180px',
                            position: isSmallDevice ? '' : 'sticky ',
                            left: 0,
                            paddingRight: '0px',
                            zIndex: 11,
                            '&:hover': {
                              backgroundColor: theme.palette.secondary.contrastText
                            }
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
                              {t('diet_module.meal_name_time')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 'none',
                            height: '40px',
                            backgroundColor: theme.palette.secondary.contrastText,
                            position: isSmallDevice ? '' : 'sticky ',
                            left: '180px',
                            p: 0,
                            width: '500px',
                            zIndex: 11
                          }}
                          className='meal_dtl_hd'
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
                              {t('diet_module.meal_details')}
                            </Typography>
                          </Box>
                        </TableCell>
                        {formData.diet_type_name === 'By Gender' ? (
                          <>
                            <TableCell
                              //colSpan={12}
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '141px',
                                borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>GENERIC</Typography>
                            </TableCell>

                            {formData.child?.map((all: any, index: any) => {
                              return (
                                <TableCell
                                  key={index}
                                  sx={{
                                    border: 'none',
                                    backgroundColor: '#C1D3D099',
                                    height: '40px',
                                    width: '140px',
                                    borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                    textAlign: 'center'
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 600 }}>{all}</Typography>
                                </TableCell>
                              )
                            })}
                          </>
                        ) : formData.diet_type_name === 'By Lifestage' ? (
                          <>
                            <TableCell
                              // colSpan={5}
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '137px',
                                borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>GENERIC</Typography>
                            </TableCell>

                            {formData.child?.map((all: any, index: any) => {
                              return (
                                <TableCell
                                  key={index}
                                  sx={{
                                    border: 'none',
                                    backgroundColor: '#C1D3D099',
                                    height: '40px',
                                    width: '140px',
                                    borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                    textAlign: 'center',
                                    p: all === 'Undetermined' ? '6px' : '16px'
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 600 }}>{all}</Typography>
                                </TableCell>
                              )
                            })}
                          </>
                        ) : formData.diet_type_name === 'Generic' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '137px',
                                borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>GENERIC</Typography>
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
                                borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                textAlign: 'center'
                              }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>GENERIC</Typography>
                            </TableCell>
                            {formData.child?.map((all: any, index: any) => {
                              return (
                                <TableCell
                                  key={index}
                                  sx={{
                                    border: 'none',
                                    backgroundColor: '#C1D3D099',
                                    height: '40px',
                                    width: '140px',
                                    borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                    textAlign: 'center'
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 600 }}>{all}</Typography>
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
                      {formData.meal_data?.map((itemd: any, index: any) => {
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

                        const totalRows =
                          (itemd?.recipe?.length || 0) +
                          (itemd?.combo?.length || 0) +
                          (itemd?.ingredient?.length || 0) +
                          (itemd?.ingredientwithchoice?.length || 0)

                        return (
                          <React.Fragment key={index}>
                            <TableRow
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.secondary.contrastText,
                                  boxShadow: 'none'
                                }
                              }}
                            >
                              <TableCell
                                sx={{
                                  position: isSmallDevice ? 'relative' : 'sticky ',
                                  left: 0,
                                  width: '180px',
                                  border: 'none',
                                  pl: '1.25rem !important',
                                  pr: '36px',
                                  background: theme.palette.secondary.contrastText,
                                  height: '185px',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  overflow: 'hidden',
                                  zIndex: 10
                                }}
                                component='th'
                                scope='row'
                                rowSpan={totalRows + 1}
                              >
                                <Grid
                                  component='div'
                                  sx={{
                                    position: 'absolute',
                                    top: '80px',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '70%'
                                  }}
                                >
                                  <Typography
                                    component='div'
                                    sx={{
                                      textAlign: 'center',
                                      color: theme.palette.customColors.addPrimary,
                                      fontWeight: 500,
                                      fontSize: '14px',
                                      mt: '10px',
                                      mb: 5
                                    }}
                                  >
                                    {itemd.meal_name}
                                  </Typography>
                                  <Box
                                    sx={{
                                      borderRadius: '25px',
                                      border: `2px dotted ${theme.palette.customColors.addPrimary}`,
                                      py: '5px',
                                      px: '4px',
                                      width: '100%'
                                    }}
                                  >
                                    <Typography
                                      component='div'
                                      sx={{
                                        textAlign: 'center',
                                        color: theme.palette.customColors.addPrimary,
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        lineHeight: '19.36px'
                                      }}
                                    >
                                      {startTimes}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Box
                                      sx={{
                                        width: 0,
                                        height: '19px',
                                        borderLeft: `2px solid ${theme.palette.customColors.addPrimary}`
                                      }}
                                    ></Box>
                                  </Box>

                                  <Box
                                    sx={{
                                      borderRadius: '25px',
                                      border: `2px dotted ${theme.palette.customColors.addPrimary}`,
                                      py: '5px',
                                      px: '4px',
                                      width: '100%'
                                    }}
                                  >
                                    <Typography
                                      component='div'
                                      sx={{
                                        textAlign: 'center',
                                        color: theme.palette.customColors.addPrimary,
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        lineHeight: '19.36px'
                                      }}
                                    >
                                      {endTimes}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </TableCell>
                            </TableRow>

                            <React.Fragment key={`recipes-${index}`}>
                              {itemd?.recipe?.map((item: any, index: any) => {
                                return (
                                  <TableRow
                                    key={`recipe-${index}`}
                                    className='tablerowi'
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        boxShadow: 'none'
                                      }
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        position: isSmallDevice ? '' : 'sticky ',
                                        left: '180px',
                                        border: 'none',
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        pl: '1.25rem !important',
                                        zIndex: 10
                                      }}
                                    >
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',

                                          backgroundColor: (theme.palette.background as any).OnBackground,
                                          borderRadius: '8px',
                                          p: '12px',
                                          gap: '16px'
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
                                                      : 'cellmodule4'
                                            : formData?.diet_type_name === 'By Gender'
                                              ? formData?.child?.length === 2
                                                ? 'cellmodule5'
                                                : 'cellmodule4'
                                              : formData?.diet_type_name === 'Generic'
                                                ? 'cellmodule6'
                                                : formData?.diet_type_name === 'By Lifestage'
                                                  ? formData?.child?.length > 2
                                                    ? 'cellmodule7'
                                                    : 'cellmodule4'
                                                  : 'cellmodule4'
                                        }
                                      >
                                        <Box>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '12px'
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                              {item?.recipe_name && (
                                                <>
                                                  <Typography
                                                    component='div'
                                                    sx={{
                                                      color: theme.palette.customColors.OnSurfaceVariant,
                                                      fontSize: '13px',
                                                      fontWeight: 400,
                                                      display: 'block'
                                                    }}
                                                  >
                                                    {t('navigation.recipe')}
                                                  </Typography>
                                                  <Typography
                                                    component='div'
                                                    sx={{
                                                      color: theme.palette.customColors.neutralPrimary,
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '16px',
                                                      cursor: 'pointer',
                                                      display: 'block'
                                                    }}
                                                    onClick={() => handleclickRecipeDetail(item.recipe_id)}
                                                  >
                                                    {item?.recipe_name}
                                                  </Typography>
                                                </>
                                              )}
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                              <Typography
                                                sx={{
                                                  color: theme.palette.customColors.OnSurfaceVariant,
                                                  fontSize: '13px',
                                                  fontWeight: 400,
                                                  width: '100%',
                                                  mb: 1
                                                }}
                                              >
                                                {t('diet_module.items_used')}
                                              </Typography>
                                              {item?.ingredients?.length > 0 && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                  }}
                                                >
                                                  {item.ingredients.map((name: any, i: any) => (
                                                    <Box
                                                      key={i}
                                                      sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                        borderRadius: '8px',
                                                        px: '10px',
                                                        py: '2px'
                                                      }}
                                                    >
                                                      <Typography
                                                        component='span'
                                                        sx={{
                                                          fontSize: '14px',
                                                          lineHeight: '1.7rem',
                                                          color: theme.palette.common.black
                                                        }}
                                                      >
                                                        {`${name?.ingredient_name || ''} | ${name?.preparation_type || ''
                                                          } | ${name?.cut_size || ''} |  `}
                                                      </Typography>
                                                      <Typography
                                                        component='span'
                                                        sx={{
                                                          fontWeight: 'bold',
                                                          fontSize: '14px',
                                                          lineHeight: '1.7rem',
                                                          marginLeft: '2px',
                                                          color: theme.palette.common.black
                                                        }}
                                                      >
                                                        {` ${parseFloat(name?.quantity) || 0}${' ' + name?.uom_text}`}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              )}
                                            </Box>

                                            {item?.recipe?.length > 0 && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  gap: '24px'
                                                }}
                                              >
                                                {item?.recipe?.map((r: any, i: any) => (
                                                  <Box key={i} sx={{ display: 'flex' }}>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.primary.light,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r.name}&nbsp;
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.customColors.neutralPrimary,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 600,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r?.percentage}
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
                                                      color: theme.palette.primary.light,
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
                                                      color: theme.palette.primary.light,
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  p: '12px',
                                                  borderRadius: '8px'
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {t('remarks')}
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
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
                                            {item?.days_of_week?.length === 8 || item?.days_of_week?.length === 7 ? (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                <Box
                                                  sx={{
                                                    width: '80px',
                                                    height: '32px',
                                                    borderRadius: '16px',
                                                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontWeight: 400,
                                                      fontSize: '13px',
                                                      lineHeight: '18px',
                                                      color: theme.palette.customColors.OnSurfaceVariant
                                                    }}
                                                  >
                                                    All Days
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            ) : (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week
                                                  ?.sort((a: any, b: any) => a - b)
                                                  .map((dayId: any, index: any) => (
                                                    <Box
                                                      key={index}
                                                      sx={{
                                                        width: '48px',
                                                        height: '32px',
                                                        borderRadius: '16px',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                          color: theme.palette.customColors.OnSurfaceVariant
                                                        }}
                                                      >
                                                        {getDayName(dayId)}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                              </Box>
                                            )}
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
                                        border: 'none',
                                        width: '141px',
                                        minWidth: '141px',
                                        zIndex: 1
                                      }}
                                      onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                    >
                                      <Box
                                        sx={{
                                          height: '100%'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                            component='div'
                                            sx={{
                                              color: theme.palette.customColors.neutralPrimary,
                                              lineHeight: '16.94px',
                                              fontWeight: 400,
                                              fontSize: '14px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            {item.meal_type
                                              ? (() => {
                                                // Prepare the display values
                                                const genericMeals = item.meal_type
                                                  .map((meal: any) => {
                                                    if (meal.meal_value_header === 'Generic') {
                                                      // If portion_uom_id exists, use portion_uom_name
                                                      const uomName = item?.portion_uom_id
                                                        ? item.portion_uom_name
                                                        : meal.feed_uom_name

                                                      return meal.quantity + (uomName ? ' ' + uomName : '')
                                                    }

                                                    return null
                                                  })
                                                  .filter(Boolean)

                                                // If no Generic meal found, show "Add"
                                                return genericMeals.length === 0 ? 'Add' : genericMeals
                                              })()
                                              : 'Add'}
                                            {item.meal_type
                                              ? item.meal_type.map((meal: any, i: any) =>
                                                meal.meal_value_header === 'Generic' &&
                                                  meal.notes &&
                                                  meal.notes.trim() !== '' ? (
                                                  <Typography key={i} sx={{ textAlign: 'center' }}>
                                                    <img
                                                      src='/icons/Notes.svg'
                                                      alt='Grocery Icon'
                                                      width='35px'
                                                      draggable={false}
                                                    />
                                                  </Typography>
                                                ) : null
                                              )
                                              : null}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    {formData.child?.map((all: any, indexnew: any) => {
                                      if (all !== 'Generic') {
                                        return (
                                          <TableCell
                                            key={`child-${indexnew}`}
                                            style={{
                                              paddingLeft: '8px',
                                              paddingRight: '8px',
                                              height: '10px',
                                              maxHeight: '100%',
                                              border: 'none',
                                              width: '140px',
                                              minWidth: '140px',
                                              zIndex: 1
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    textAlign: 'center'
                                                  }}
                                                >
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? 'Add'
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                      : 'Add'}
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? ''
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? ''
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                      : ''}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                        )
                                      }
                                    })}
                                    {getModal(index, item, 'recipe')}
                                  </TableRow>
                                )
                              })}
                            </React.Fragment>

                            <React.Fragment key={`combos-${index}`}>
                              {itemd?.combo?.map((item: any, index: any) => {
                                return (
                                  <TableRow
                                    key={`combo-${index}`}
                                    className='tablerowi'
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        boxShadow: 'none'
                                      }
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        position: isSmallDevice ? '' : 'sticky ',
                                        left: '180px',
                                        border: 'none',
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        pl: '1.25rem !important',
                                        zIndex: 10
                                      }}
                                    >
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',

                                          backgroundColor: '#DAE7DF99',
                                          borderRadius: '8px',
                                          p: '12px',
                                          gap: '16px'
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
                                                      : 'cellmodule4'
                                            : formData?.diet_type_name === 'By Gender'
                                              ? formData?.child?.length === 2
                                                ? 'cellmodule5'
                                                : 'cellmodule4'
                                              : formData?.diet_type_name === 'Generic'
                                                ? 'cellmodule6'
                                                : formData?.diet_type_name === 'By Lifestage'
                                                  ? formData?.child?.length > 2
                                                    ? 'cellmodule7'
                                                    : 'cellmodule4'
                                                  : 'cellmodule4'
                                        }
                                      >
                                        <Box>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '12px'
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                              {item?.recipe_name && (
                                                <>
                                                  <Typography
                                                    component='div'
                                                    sx={{
                                                      color: theme.palette.customColors.OnSurfaceVariant,
                                                      fontSize: '13px',
                                                      fontWeight: 400,
                                                      display: 'block'
                                                    }}
                                                  >
                                                    Mix
                                                  </Typography>
                                                  <Typography
                                                    component='div'
                                                    sx={{
                                                      color: theme.palette.customColors.neutralPrimary,
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '16px',
                                                      cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleclickComboDetail(item.recipe_id)}
                                                  >
                                                    {item?.recipe_name}
                                                  </Typography>
                                                </>
                                              )}
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                              <Typography
                                                sx={{
                                                  color: theme.palette.customColors.OnSurfaceVariant,
                                                  fontSize: '13px',
                                                  fontWeight: 400,
                                                  width: '100%',
                                                  mb: 1
                                                }}
                                              >
                                                {t('diet_module.items_used')}
                                              </Typography>
                                              {item?.ingredients?.length > 0 && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                  }}
                                                >
                                                  {item.ingredients.map((name: any, i: any) => (
                                                    <Box
                                                      key={i}
                                                      sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                        borderRadius: '8px',
                                                        px: '10px',
                                                        py: '2px'
                                                      }}
                                                    >
                                                      <Typography
                                                        component='span'
                                                        sx={{
                                                          fontSize: '14px',
                                                          lineHeight: '1.7rem',
                                                          color: theme.palette.common.black
                                                        }}
                                                      >
                                                        {`${name?.ingredient_name || ''} | ${name?.preparation_type || ''
                                                          } | ${name?.cut_size || ''} |  `}
                                                      </Typography>
                                                      <Typography
                                                        component='span'
                                                        sx={{
                                                          fontWeight: 'bold',
                                                          fontSize: '14px',
                                                          lineHeight: '1.7rem',
                                                          marginLeft: '2px',
                                                          color: theme.palette.common.black
                                                        }}
                                                      >
                                                        {` ${parseFloat(name?.quantity) || 0}${name?.quantity_type === 'percentage' ? ' %' : ''
                                                          }`}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              )}
                                            </Box>

                                            {item?.recipe?.length > 0 && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  gap: '24px'
                                                }}
                                              >
                                                {item?.recipe?.map((r: any, i: any) => (
                                                  <Box key={i} sx={{ display: 'flex' }}>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.primary.light,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r.name}&nbsp;
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.customColors.neutralPrimary,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 600,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r?.percentage}
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
                                                      color: theme.palette.primary.light,
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
                                                      color: theme.palette.primary.light,
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  p: '12px',
                                                  borderRadius: '8px'
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {t('remarks')}
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
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
                                            {item?.days_of_week?.length === 8 || item?.days_of_week?.length === 7 ? (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                <Box
                                                  sx={{
                                                    width: '80px',
                                                    height: '32px',
                                                    borderRadius: '16px',
                                                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontWeight: 400,
                                                      fontSize: '13px',
                                                      lineHeight: '18px',
                                                      color: theme.palette.customColors.OnSurfaceVariant
                                                    }}
                                                  >
                                                    All Days
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            ) : (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week
                                                  ?.sort((a: any, b: any) => a - b)
                                                  .map((dayId: any, i: any) => (
                                                    <Box
                                                      key={i}
                                                      sx={{
                                                        width: '48px',
                                                        height: '32px',
                                                        borderRadius: '16px',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                          color: theme.palette.customColors.OnSurfaceVariant
                                                        }}
                                                      >
                                                        {getDayName(dayId)}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                              </Box>
                                            )}
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
                                        border: 'none',
                                        width: '141px',
                                        minWidth: '141px'
                                      }}
                                      onClick={() => handleClickOpen(index, item, 'Generic', 'combo')}
                                    >
                                      <Box
                                        sx={{
                                          height: '100%'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                            component='div'
                                            sx={{
                                              color: theme.palette.customColors.neutralPrimary,
                                              lineHeight: '16.94px',
                                              fontWeight: 400,
                                              fontSize: '14px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            {item.meal_type
                                              ? item.meal_type
                                                .map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                                .filter(Boolean).length === 0
                                                ? 'Add'
                                                : item.meal_type.map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                              : 'Add'}
                                            {item.meal_type
                                              ? item.meal_type.map((meal: any, i: any) =>
                                                meal.meal_value_header === 'Generic' &&
                                                  meal.notes &&
                                                  meal.notes.trim() !== '' ? (
                                                  <Typography key={i} sx={{ textAlign: 'center' }}>
                                                    <img
                                                      src='/icons/Notes.svg'
                                                      alt='Grocery Icon'
                                                      width='35px'
                                                      draggable={false}
                                                    />
                                                  </Typography>
                                                ) : null
                                              )
                                              : null}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    {formData.child?.map((all: any, indexnew: any) => {
                                      if (all !== 'Generic') {
                                        return (
                                          <TableCell
                                            key={`combo-child-${indexnew}`}
                                            style={{
                                              paddingLeft: '8px',
                                              paddingRight: '8px',
                                              height: '10px',
                                              maxHeight: '100%',
                                              border: 'none',
                                              width: '140px',
                                              minWidth: '140px'
                                            }}
                                            onClick={() => handleClickOpen(index, item, all, 'combo')}
                                          >
                                            <Box
                                              sx={{
                                                height: '100%'
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    textAlign: 'center'
                                                  }}
                                                >
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? 'Add'
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                      : 'Add'}
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? ''
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? ''
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                      : ''}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                        )
                                      }
                                    })}
                                    {getModal(index, item, 'combo')}
                                  </TableRow>
                                )
                              })}
                            </React.Fragment>

                            <React.Fragment key={`ingredients-${index}`}>
                              {itemd?.ingredient?.map((item: any, index: any) => {
                                return (
                                  <TableRow
                                    key={`ingredient-${index}`}
                                    className='tablerowi'
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        boxShadow: 'none'
                                      }
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        position: isSmallDevice ? '' : 'sticky ',
                                        left: '180px',
                                        border: 'none',
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        pl: '1.25rem !important',
                                        zIndex: 10
                                      }}
                                    >
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',

                                          backgroundColor: '#00d6c957',
                                          borderRadius: '8px',
                                          p: '12px',
                                          gap: '16px'
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
                                                      : 'cellmodule4'
                                            : formData?.diet_type_name === 'By Gender'
                                              ? formData?.child?.length === 2
                                                ? 'cellmodule5'
                                                : 'cellmodule4'
                                              : formData?.diet_type_name === 'Generic'
                                                ? 'cellmodule6'
                                                : formData?.diet_type_name === 'By Lifestage'
                                                  ? formData?.child?.length > 2
                                                    ? 'cellmodule7'
                                                    : 'cellmodule4'
                                                  : 'cellmodule4'
                                        }
                                      >
                                        <Box>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '12px'
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                              {item?.ingredient_name && (
                                                <Typography
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.OnSurfaceVariant,
                                                    fontSize: '13px',
                                                    fontWeight: 400,
                                                    display: 'block',
                                                    width: '100%'
                                                  }}
                                                >
                                                  {t('navigation.item')}
                                                </Typography>
                                              )}
                                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <Typography
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '16px'
                                                  }}
                                                >
                                                  {item?.ingredient_name}
                                                </Typography>

                                                {item?.preparation_type &&
                                                  (item?.master_cut_size ? (
                                                    <Typography
                                                      component='div'
                                                      sx={{
                                                        color: theme.palette.customColors.OnSurfaceVariant,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      &nbsp;-&nbsp; {item?.preparation_type}&nbsp;-&nbsp;
                                                      {item?.master_cut_size}
                                                    </Typography>
                                                  ) : (
                                                    <Typography
                                                      component='div'
                                                      sx={{
                                                        color: theme.palette.customColors.OnSurfaceVariant,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      &nbsp;-&nbsp; {item?.preparation_type}
                                                    </Typography>
                                                  ))}
                                              </Box>
                                            </Box>

                                            {item?.ingredient?.length > 0 && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  gap: '24px'
                                                }}
                                              >
                                                {item?.ingredient?.map((r: any, i: any) => (
                                                  <Box key={i} sx={{ display: 'flex' }}>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.primary.light,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r.name}&nbsp;
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        color: theme.palette.customColors.neutralPrimary,
                                                        lineHeight: '16.94px',
                                                        fontWeight: 600,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {r?.percentage}
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
                                                      color: theme.palette.primary.light,
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
                                                      color: theme.palette.primary.light,
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  p: '12px',
                                                  borderRadius: '8px'
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {t('remarks')}
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
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
                                            {item?.days_of_week?.length === 8 || item?.days_of_week?.length === 7 ? (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                <Box
                                                  sx={{
                                                    width: '80px',
                                                    height: '32px',
                                                    borderRadius: '16px',
                                                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontWeight: 400,
                                                      fontSize: '13px',
                                                      lineHeight: '18px',
                                                      color: theme.palette.customColors.OnSurfaceVariant
                                                    }}
                                                  >
                                                    All Days
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            ) : (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week
                                                  ?.sort((a: any, b: any) => a - b)
                                                  .map((dayId: any, i: any) => (
                                                    <Box
                                                      key={i}
                                                      sx={{
                                                        width: '48px',
                                                        height: '32px',
                                                        borderRadius: '16px',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                          color: theme.palette.customColors.OnSurfaceVariant
                                                        }}
                                                      >
                                                        {getDayName(dayId)}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                              </Box>
                                            )}
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
                                        border: 'none',
                                        width: '141px',
                                        minWidth: '141px'
                                      }}
                                      onClick={() => handleClickOpen(index, item, 'Generic', 'ingredient')}
                                    >
                                      <Box
                                        sx={{
                                          height: '100%'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                            component='div'
                                            sx={{
                                              color: theme.palette.customColors.neutralPrimary,
                                              lineHeight: '16.94px',
                                              fontWeight: 400,
                                              fontSize: '14px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            {item.meal_type
                                              ? item.meal_type
                                                .map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                                .filter(Boolean).length === 0
                                                ? 'Add'
                                                : item.meal_type.map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                              : 'Add'}
                                            {item.meal_type
                                              ? item.meal_type.map((meal: any, i: any) =>
                                                meal.meal_value_header === 'Generic' &&
                                                  meal.notes &&
                                                  meal.notes.trim() !== '' ? (
                                                  <Typography key={i} sx={{ textAlign: 'center' }}>
                                                    <img
                                                      src='/icons/Notes.svg'
                                                      alt='Grocery Icon'
                                                      width='35px'
                                                      draggable={false}
                                                    />
                                                  </Typography>
                                                ) : null
                                              )
                                              : null}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    {formData.child?.map((all: any, indexnew: any) => {
                                      if (all !== 'Generic') {
                                        return (
                                          <TableCell
                                            key={`ingredient-child-${indexnew}`}
                                            style={{
                                              paddingLeft: '8px',
                                              paddingRight: '8px',
                                              height: '10px',
                                              maxHeight: '100%',
                                              border: 'none',
                                              width: '140px',
                                              minWidth: '140px'
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    textAlign: 'center'
                                                  }}
                                                >
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? 'Add'
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                      : 'Add'}
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? ''
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? ''
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                      : ''}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                        )
                                      }
                                    })}

                                    {getModal(index, item, 'ingredient')}
                                  </TableRow>
                                )
                              })}
                            </React.Fragment>

                            <React.Fragment key={`choice-${index}`}>
                              {itemd?.ingredientwithchoice?.map((item: any, index: any) => {
                                return (
                                  <TableRow
                                    key={`choice-${index}`}
                                    className='tablerowi'
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        boxShadow: 'none'
                                      }
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        position: isSmallDevice ? '' : 'sticky ',
                                        left: '180px',
                                        border: 'none',
                                        backgroundColor: theme.palette.secondary.contrastText,
                                        pl: '1.25rem !important',
                                        zIndex: 10
                                      }}
                                    >
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',

                                          backgroundColor: '#00d6c957',
                                          borderRadius: '8px',
                                          p: '12px',
                                          gap: '16px'
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
                                                      : 'cellmodule4'
                                            : formData?.diet_type_name === 'By Gender'
                                              ? formData?.child?.length === 2
                                                ? 'cellmodule5'
                                                : 'cellmodule4'
                                              : formData?.diet_type_name === 'Generic'
                                                ? 'cellmodule6'
                                                : formData?.diet_type_name === 'By Lifestage'
                                                  ? formData?.child?.length > 2
                                                    ? 'cellmodule7'
                                                    : 'cellmodule4'
                                                  : 'cellmodule4'
                                        }
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
                                              component='div'
                                              sx={{
                                                color: theme.palette.customColors.neutralPrimary,
                                                lineHeight: '16.94px',
                                                fontWeight: 600,
                                                fontSize: '16px'
                                              }}
                                            >
                                              Offer minimum {item?.no_of_component_required} from the below items
                                            </Typography>
                                          )}
                                          <Divider />
                                          <Typography
                                            sx={{
                                              color: theme.palette.customColors.OnSurfaceVariant,
                                              fontSize: '13px',
                                              fontWeight: 400,
                                              width: '100%',
                                              mb: 0
                                            }}
                                          >
                                            {t('diet_module.items_using')}
                                          </Typography>
                                          {item?.ingredientList?.length > 0 && (
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                columnGap: `24px`,
                                                rowGap: '10px'
                                              }}
                                            >
                                              {item?.ingredientList?.map((il: any, i: any) => (
                                                <React.Fragment key={i}>
                                                  <Box
                                                    sx={{
                                                      height: '32px',
                                                      borderRadius: '7px',
                                                      backgroundColor: '#1F415B1A',
                                                      display: 'flex',
                                                      px: 2,
                                                      justifyContent: 'center',
                                                      alignItems: 'center'
                                                    }}
                                                  >
                                                    <Typography
                                                      component='div'
                                                      sx={{
                                                        fontWeight: 600,
                                                        fontSize: '14px',
                                                        lineHeight: '16.94px',
                                                        color: theme.palette.secondary.dark
                                                      }}
                                                    >
                                                      {il?.ingredient_name}
                                                      <span style={{ lineHeight: '18px', fontWeight: 400 }}>
                                                        {' |'}&nbsp;
                                                      </span>
                                                    </Typography>

                                                    {il?.master_cut_size ? (
                                                      <Typography
                                                        component='div'
                                                        sx={{
                                                          fontWeight: 400,
                                                          fontSize: '14px',
                                                          lineHeight: '18px',
                                                          color: theme.palette.secondary.dark
                                                        }}
                                                      >
                                                        {' '}
                                                        {il?.preparation_type} | {il?.master_cut_size}
                                                      </Typography>
                                                    ) : (
                                                      <Typography
                                                        component='div'
                                                        sx={{
                                                          fontWeight: 400,
                                                          fontSize: '14px',
                                                          lineHeight: '18px',
                                                          color: theme.palette.secondary.dark
                                                        }}
                                                      >
                                                        {il?.preparation_type}
                                                      </Typography>
                                                    )}
                                                  </Box>
                                                </React.Fragment>
                                              ))}
                                            </Box>
                                          )}

                                          {item?.remarks && (
                                            <Box
                                              sx={{
                                                backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                p: '12px',
                                                borderRadius: '8px'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: theme.palette.customColors.neutralPrimary,
                                                  lineHeight: '16.94px',
                                                  fontWeight: 600,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                {t('remarks')}
                                              </Typography>
                                              <Typography
                                                sx={{
                                                  color: theme.palette.customColors.neutralPrimary,
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
                                            {item?.days_of_week?.length === 8 || item?.days_of_week?.length === 7 ? (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                <Box
                                                  sx={{
                                                    width: '80px',
                                                    height: '32px',
                                                    borderRadius: '16px',
                                                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontWeight: 400,
                                                      fontSize: '13px',
                                                      lineHeight: '18px',
                                                      color: theme.palette.customColors.OnSurfaceVariant
                                                    }}
                                                  >
                                                    All Days
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            ) : (
                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                {item?.days_of_week
                                                  ?.sort((a: any, b: any) => a - b)
                                                  .map((dayId: any, i: any) => (
                                                    <Box
                                                      key={i}
                                                      sx={{
                                                        width: '48px',
                                                        height: '32px',
                                                        borderRadius: '16px',
                                                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                          color: theme.palette.customColors.OnSurfaceVariant
                                                        }}
                                                      >
                                                        {getDayName(dayId)}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                              </Box>
                                            )}
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
                                        border: 'none',
                                        width: '141px',
                                        minWidth: '141px'
                                      }}
                                      onClick={() => handleClickOpen(index, item, 'Generic', 'ingredientwithchoice')}
                                    >
                                      <Box
                                        sx={{
                                          height: '100%'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                            component='div'
                                            sx={{
                                              color: theme.palette.customColors.neutralPrimary,
                                              lineHeight: '16.94px',
                                              fontWeight: 400,
                                              fontSize: '14px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            {item.meal_type
                                              ? item.meal_type
                                                .map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                                .filter(Boolean).length === 0
                                                ? 'Add'
                                                : item.meal_type.map((meal: any, i: any) => {
                                                  return meal.meal_value_header === 'Generic'
                                                    ? meal.quantity +
                                                    (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                    : null
                                                })
                                              : 'Add'}
                                            {item.meal_type
                                              ? item.meal_type.map((meal: any, i: any) =>
                                                meal.meal_value_header === 'Generic' &&
                                                  meal.notes &&
                                                  meal.notes.trim() !== '' ? (
                                                  <Typography key={i} sx={{ textAlign: 'center' }}>
                                                    <img
                                                      src='/icons/Notes.svg'
                                                      alt='Grocery Icon'
                                                      width='35px'
                                                      draggable={false}
                                                    />
                                                  </Typography>
                                                ) : null
                                              )
                                              : null}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    {formData.child?.map((all: any, indexnew: any) => {
                                      if (all !== 'Generic') {
                                        return (
                                          <TableCell
                                            key={`choice-child-${indexnew}`}
                                            style={{
                                              paddingLeft: '8px',
                                              paddingRight: '8px',
                                              height: '10px',
                                              maxHeight: '100%',
                                              border: 'none',
                                              width: '140px',
                                              minWidth: '140px'
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
                                                  backgroundColor: theme.palette.customColors.mdAntzNeutral,
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
                                                  component='div'
                                                  sx={{
                                                    color: theme.palette.customColors.neutralPrimary,
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    textAlign: 'center'
                                                  }}
                                                >
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? 'Add'
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (all.includes(meal.meal_value_header)) {
                                                          return (
                                                            meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? 'Add'
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          return meal.meal_value_header === all
                                                            ? meal.quantity +
                                                            (meal.feed_uom_name ? ' ' + meal.feed_uom_name : '')
                                                            : null
                                                        })
                                                      : 'Add'}
                                                  {formData.diet_type_name === 'By Weight' && item.meal_type
                                                    ? item.meal_type
                                                      .map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                      .filter(Boolean).length === 0
                                                      ? ''
                                                      : item.meal_type.map((meal: any, i: any) => {
                                                        if (
                                                          all.includes(meal.meal_value_header) &&
                                                          meal.notes &&
                                                          meal.notes.trim() !== ''
                                                        ) {
                                                          return (
                                                            <Typography key={i} sx={{ textAlign: 'center' }}>
                                                              <img
                                                                src='/icons/Notes.svg'
                                                                alt='Grocery Icon'
                                                                width='35px'
                                                                draggable={false}
                                                              />
                                                            </Typography>
                                                          )
                                                        }

                                                        return null
                                                      })
                                                    : item.meal_type
                                                      ? item.meal_type
                                                        .map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                        .filter(Boolean).length === 0
                                                        ? ''
                                                        : item.meal_type.map((meal: any, i: any) => {
                                                          if (
                                                            meal.meal_value_header === all &&
                                                            meal.notes &&
                                                            meal.notes.trim() !== ''
                                                          ) {
                                                            return (
                                                              <Typography key={i} sx={{ textAlign: 'center' }}>
                                                                <img
                                                                  src='/icons/Notes.svg'
                                                                  alt='Grocery Icon'
                                                                  width='35px'
                                                                  draggable={false}
                                                                />
                                                              </Typography>
                                                            )
                                                          }

                                                          return null
                                                        })
                                                      : ''}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                        )
                                      }
                                    })}
                                    {getModal(index, item, 'ingredientwithchoice')}
                                  </TableRow>
                                )
                              })}
                            </React.Fragment>

                            <TableRow>
                              <TableCell colSpan={12} sx={{ borderBottom: 'none', padding: '8px 16px' }}>
                                {itemd.notes ? (
                                  <>
                                    <span style={{ fontWeight: 'bold', color: 'rgb(0 0 0 / 67%)' }}>
                                      {t('notes')} :
                                    </span>{' '}
                                    {itemd.notes}
                                  </>
                                ) : (
                                  <></>
                                )}
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CustomScrollbar>
                <Grid size={{ xs: 12 }} sx={{ pt: 10, pb: 8 }}>
                  <Controller
                    name='remarks'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange } }) => (
                      <TextField
                        multiline
                        fullWidth
                        value={remarks}
                        label={`${t('remarks')} (${t('optional')})`}
                        name='remarks'
                        onChange={e => {
                          onChange(e)
                          onRemarksChange(e.target.value)
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

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12, mx: 6 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrevClick}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                {t('go_back')}
              </Button>

              <Button
                onClick={finalhandleSubmit}
                variant='contained'
                endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}
                disabled={loader}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  minWidth: 120
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t('submit')}
                  {loader && <CircularProgress size={16} sx={{ color: '#ccc' }} />}
                </span>
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
