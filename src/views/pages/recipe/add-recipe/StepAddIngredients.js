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
import IconButton from '@mui/material/IconButton'
import { AddButton } from 'src/components/Buttons'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import { Divider } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { useTheme, useMediaQuery } from '@mui/material'

// ** Icon Imports
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
  setFullIngredientList,
  onCancelIconClick,
  handleIngredientChange
}) => {
  const ingredients = [{ label: ' Items' }, { label: 'Quantity' }, { label: 'Preparation Type' }, { label: 'Cut Size' }]

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

  const addIngredientsButton = () => {
    return (
      <>
        <Typography
          sx={{
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
              preparation_type_id: '',
              cut_size_id: ''
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

    // Round to 2 decimal places
    return parseFloat(totalQuantity.toFixed(2))
  }

  const addQuantityButton = () => {
    return (
      <Grid
        container
        sx={{
          mb: 5,

          //px: 4,
          mt: 4,

          //float: 'left',
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

  const removeIngredientButton = index => {
    console.log(index, 'index')

    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '35px' }}
        className='ing_byperc'
        onClick={() => {
          removeIngredients(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const removebyQuantityButton = index => {
    console.log(index, 'index')

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

  // const handleAddRemoveingredient = (fields, index) => {
  //   if (fields.length - 1 === index && index > 0) {
  //     return <>{addIngredientsButton()}</>
  //   } else if (index <= 0 && fields.length - 1 <= 0) {
  //     return <>{addIngredientsButton()}</>
  //   } else {
  //     return <>{removeIngredientButton(index)}</>
  //   }
  // }

  const handleAddRemoveQuantity = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return <>{addQuantityButton()}</>
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return <>{addQuantityButton()}</>
    } else {
      return <>{removebyQuantityButton(index)}</>
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
    // Filter out incomplete entries
    data.by_percentage = data.by_percentage.filter(
      item => item.ingredient_id || item.quantity || item.preparation_type_id
    )
    data.by_quantity = data.by_quantity.filter(
      item => item.ingredient_id || item.quantity || item.preparation_type_id || item.uom_id
    )

    // Function to find the first incomplete index
    const findFirstIncompleteIndex = (array, keys) => {
      return array.findIndex(item => keys.some(key => !item[key]))
    }

    // Check if all entries in by_percentage have all required fields
    const isByPercentageValid = data.by_percentage.every(
      item => item.ingredient_id && item.quantity && item.preparation_type_id
    )
    console.log(data, 'data')

    // Check if all entries in by_quantity have all required fields
    const isByQuantityValid = data.by_quantity.every(
      item => item.ingredient_id && item.quantity && item.uom_id && item.preparation_type_id && item.cut_size_id
    )

    // If both arrays are empty or have incomplete entries, show an error
    if (data.by_quantity.length === 0) {
      window.scrollTo(0, 0)

      //return toast.error('Please fill in all fields in either "By Percentage" or "By Quantity".')
      return Toaster({
        type: 'error',
        message: 'Please fill in all fields for By Quantity.'
      })
    }

    // if (data.by_percentage.length > 0 && !isByPercentageValid) {
    //   const firstIncompleteIndex = findFirstIncompleteIndex(data.by_percentage, [
    //     'ingredient_id',
    //     'quantity',
    //     'preparation_type_id'
    //   ])
    //   window.scrollTo(0, 0)
    //   //return toast.error(`Please fill in all fields in "By Percentage" at index ${firstIncompleteIndex + 1}.`)
    //   return Toaster({
    //     type: 'error',
    //     message: `Please fill in all fields in "By Percentage" at index ${firstIncompleteIndex + 1}.`
    //   })
    // }

    if (data.by_quantity.length > 0 && !isByQuantityValid) {
      const firstIncompleteIndex = findFirstIncompleteIndex(data.by_quantity, [
        'ingredient_id',
        'quantity',
        'uom_id',
        'preparation_type_id',
        'cut_size_id'
      ])
      window.scrollTo(0, 0)

      //return toast.error(`Please fill in all fields in "By Quantity" at index ${firstIncompleteIndex + 1}.`)
      return Toaster({
        type: 'error',
        message: `Please fill in all fields in By Quantity at index ${firstIncompleteIndex + 1}.`
      })
    }

    if (!isByQuantityValid || data.by_quantity.some(item => item.cut_size_id === 'null' || item.cut_size_id === '0')) {
      window.scrollTo(0, 0)

      //return toast.error('Please fill in all fields in either "By Percentage" or "By Quantity".')
      return Toaster({
        type: 'error',
        message: 'Please fill in all fields for By Quantity.'
      })
    }
    console.log(data, 'data')
    if (!isByPercentageValid && calculateTotalQuantity() > 100 && data.by_percentage.length > 0) {
      window.scrollTo(0, 0)

      return toast(
        t => (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon icon='jam:alert-f' style={{ marginRight: '20px', fontSize: 50, color: 'rgb(255 0 0 / 80%)' }} />
              <div>
                <Typography sx={{ fontWeight: 500 }} variant='h5'>
                  Alert!
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                  Please review and adjust percentages before adding new ingredients
                </Typography>
              </div>
            </Box>
            <IconButton
              onClick={() => toast.dismiss(t.id)}
              style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        ),
        {
          style: {
            minWidth: '450px',
            minHeight: '130px'
          }
        }
      )
    } else if (!isByPercentageValid && calculateTotalQuantity() < 100 && data.by_percentage.length > 0) {
      window.scrollTo(0, 0)

      return toast(
        t => (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon icon='jam:alert-f' style={{ marginRight: '20px', fontSize: 50, color: 'rgb(255 0 0 / 80%)' }} />
              <div>
                <Typography sx={{ fontWeight: 500 }} variant='h5'>
                  Alert!
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                  Percentage added should be equal to 100%
                </Typography>
              </div>
            </Box>
            <IconButton
              onClick={() => toast.dismiss(t.id)}
              style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        ),
        {
          style: {
            minWidth: '450px',
            minHeight: '130px'
          }
        }
      )
    } else {
      window.scrollTo(0, 0)

      // Clear any existing errors
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
  }

  const handlecheck = async (ingredientId, index, section) => {
    console.log(ingredientId, 'ingredientId')
    try {
      const response = await getPreparationTypeList(ingredientId)
      if (response.success === true) {
        console.log(fullIngredientList, 'fullIngredientList')
        const ingredient = fullIngredientList.find(item => item.id === ingredientId)
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
    // Initialize fieldsByQuantity and fieldsIngredients with at least one empty object if empty
    if (fieldsByQuantity.length === 0) {
      appendByQuantity({ ingredient_id: '', quantity: '', uom_id: '', preparation_type_id: '', cut_size_id: '' })
    }
    if (fieldsIngredients.length === 0) {
      appendIngredients({ ingredient_id: '', quantity: '', preparation_type_id: '', cut_size_id: '' })
    }
  }, [fieldsByQuantity, fieldsIngredients, appendByQuantity, appendIngredients])

  const ScrollToFieldError = ({ errors, index }) => {
    // if (!errors) return
    const firstErrorField = Object.keys(errors)[0]
    console.log('First Error Field:', firstErrorField)
    console.log(errors)
    if (firstErrorField === 'by_percentage') {
      const errorElement = document.getElementById('test' + index)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        // errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.scroll(0, 250)
      }
    } else if (firstErrorField === 'by_quantity') {
      const errorElement = document.getElementById('testnew' + index)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        //errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.scrollTo(0, 700)
      }
    }

    return null
  }

  const handleEquilizerClick = () => {
    const byPercentageValues = getValues('by_percentage')
    console.log(byPercentageValues, 'byPercentageValues')
    const numIngredients = byPercentageValues.length
    const equalDistribution = 100 / numIngredients

    const updatedIngredients = byPercentageValues.map(ingredient => ({
      ...ingredient,
      quantity: equalDistribution.toString()
    }))
    setFormValue('by_percentage', updatedIngredients)
  }

  console.log(errors, 'ppp')

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {console.log(fieldsIngredients, 'fieldsIngredients')}
        <Grid container spacing={5} sx={{ px: 5, pt: 6 }}>
          {/* <Box sx={{ mb: 4, px: 5, mt: 2, float: 'left' }}>
            <Typography variant='h6'>Add Ingredient- by Percentage</Typography>
          </Box>
          <Grid container spacing={5} sx={{ px: 5, background: '#E8F4F2', my: 1, borderRadius: 0.5, mx: 4 }}>
            {ingredients.map((ingredient, index) => (
              <Grid item xs={12} sm={2.85} key={index} sx={{ py: 4 }}>
                <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  </div>
                </Typography>
              </Grid>
            ))}
          </Grid> */}

          <Grid container spacing={5} sx={{ px: 1, py: 3 }}>
            {/* <Grid container spacing={5} sx={{ px: 5, py: 5 }}>
              {fieldsIngredients.map((field, index) => (
                <Grid container spacing={5} sx={{ px: 5, py: 5 }} key={field.id} id={'test' + index}>
                  <ScrollToFieldError errors={errors} index={index} />
                  <Grid item xs={12} sm={2.85}>
                    {console.log(fullIngredientList, 'fullIngredientList')}
                    <FormControl fullWidth>
                      <Controller
                        name={`by_percentage[${index}].ingredient_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            value={fullIngredientList.find(option => option.id === value) || null}
                            disablePortal
                            id={`by_percentage[${index}].ingredient_id`}
                            placeholder='Search & Select'
                            options={fullIngredientList || []}
                            getOptionLabel={option => option?.ingredient_name}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            onChange={(e, val) => {
                              console.log(val, 'val')
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

                                // if (val.preparation_types) {
                                //   setpreparationTypeList(val.preparation_types)
                                // } else {
                                //   setpreparationTypeList([])
                                // }
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
                                label='Select Ingredient*'
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
                      {console.log(errors.by_percentage, 'lll')}
                      {errors.by_percentage && errors.by_percentage[index] && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.by_percentage[index].ingredient_id?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2.85}>
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

                              // Update the state or do whatever you need with the total quantity
                              console.log('Total Quantity:', totalQuantity)
                              trigger(`by_percentage[${index}].quantity`)
                            }}
                            // onBlur={() => {
                            //   // Format value to 2 decimal places on blur
                            //   onChange(parseFloat(value || 0).toFixed(2))
                            // }}
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
                        <Grid item xs={12} sm={12}>
                          <span
                            style={{
                              paddingTop: '15px',
                              float: 'left',
                              color: '#ff0000cc',
                              paddingLeft: '12px',
                              fontSize: '14px'
                            }}
                          >
                            {console.log(calculateTotalQuantity(), 'calculateTotalQuantity')}
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

                  <Grid item xs={12} sm={2.85}>
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

                  <Grid item xs={12} sm={2.85}>
                    <FormControl fullWidth>
                      <Controller
                        name={`by_percentage[${index}].cut_size`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => {
                          console.log(value, 'value')
                          return (
                            <Autocomplete
                              id={`by_percentage[${index}].cut_size`}
                              getOptionLabel={option => option.cut_size}
                              renderInput={params => <TextField {...params} label='Select Cut size' />}
                              options={cutsizeList || []}
                              onChange={(e, val) => {
                                console.log(val, 'val')
                                if (val === null) {
                                  onChange('')
                                  setFormValue(`by_percentage[${index}].cut_size`, '')
                                  setFormValue(`by_percentage[${index}].cut_size_id`, '')
                                } else {
                                  onChange(val.id)
                                  setFormValue(`by_percentage[${index}].cut_size`, val?.cut_size)
                                  setFormValue(`by_percentage[${index}].cut_size_id`, val?.id)
                                }
                              }}
                              value={cutsizeList.find(option => option.cut_size === value) || null}
                              isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            />
                          )
                        }}
                      />
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
            </Grid> */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0, mr: 4 }}>
                <Typography variant='h6'>Add Item - by Quantity</Typography>
                <AddButton title='Add Cut Size' action={() => addEventSidebarOpen()} />
              </Box>
            </Grid>

            <Box
              sx={{
                width: '100%', // Full width
                overflowX: 'auto' // Horizontal scrolling for the entire container
                //padding: '10px'
              }}
            >
              <Box
                sx={{
                  display: 'flex', // Flex to align rows horizontally
                  flexDirection: 'column', // Stack rows vertically
                  gap: '2px', // Add some gap between rows
                  minWidth: 'max-content' // Ensure the container doesn't shrink
                }}
              >
                <Grid
                  container
                  spacing={5}
                  sx={{
                    px: 5,
                    background: theme.palette.customColors.displaybgPrimary,

                    //my: 2,
                    borderRadius: 0.5,

                    //mx: 4
                    mb: '1.25rem'
                  }}
                >
                  {ingredientsbyqun.map((ingredient, index) => (
                    <Grid size={{ xs: 12, sm: ingredient.label !== 'Quantity' ? 2.4 : 2.2 }} key={index} sx={{ py: 4 }}>
                      <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600, pl: 4 }}>
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
                                  // '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                  //   isSmallDevice ? { paddingRight: '10px' } : {},
                                  // '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                  // '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {},
                                  width: isSmallDevice ? '216px' : '216px'
                                }}
                                value={fullIngredientList.find(option => option.id === value) || null}
                                //disablePortal
                                id={`by_quantity[${index}].ingredient_id`}
                                placeholder='Search & Select'
                                options={fullIngredientList || []}
                                getOptionLabel={option => option?.ingredient_name}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
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
                                sx={{ width: isSmallDevice ? '216px' : '216px' }}
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
                              console.log(value, 'value')

                              return (
                                <Autocomplete
                                  sx={{
                                    // '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                    //   isSmallDevice ? { paddingRight: '10px' } : {},
                                    // '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                    // '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {},
                                    width: isSmallDevice ? '216px' : '216px'
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
                                    // '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                    //   isSmallDevice ? { paddingRight: '10px' } : {},
                                    // '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                    // '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {},
                                    width: isSmallDevice ? '216px' : '216px'
                                  }}
                                  id={`by_quantity[${index}].preparation_type_id`}
                                  getOptionLabel={option => option.label || ''}
                                  renderInput={params => (
                                    <TextField
                                      {...params}
                                      label='Select Preparation Type*'
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
                                    setFormValue(`by_quantity[${index}].preparation_type_id`, newValue?.id || '') // Use id instead of value
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
                              console.log(value, 'value')

                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Autocomplete
                                    sx={{
                                      // '&.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
                                      //   isSmallDevice ? { paddingRight: '10px' } : {},
                                      // '& .MuiAutocomplete-clearIndicator': isSmallDevice ? { display: 'none' } : {},
                                      // '& .MuiAutocomplete-popupIndicator': isSmallDevice ? { display: 'none' } : {},
                                      width: isSmallDevice ? '216px' : '216px'
                                    }}
                                    id={`by_quantity[${index}].cut_size`}
                                    getOptionLabel={option => option.cut_size}
                                    renderInput={params => <TextField {...params} label='Select Cut size *' />}
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
                                      }
                                    }}
                                    value={cutsizeList.find(option => option.cut_size === value) || null}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                  />
                                  {/* Cancel Icon (Remove Button) */}
                                  {fieldsByQuantity.length > 1 && removebyQuantityButton(index)}
                                </Box>
                              )
                            }}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    {/* Add New Ingredient Button */}
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
